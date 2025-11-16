import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction, TransactionType, Category, BankAccount } from '../types';
import { suggestCategoryForTransaction, extractTransactionDetailsFromImage, createTranscriptionSession, createPcmBlob } from '../services/geminiService';
import { SparklesIcon, CameraIcon, MicrophoneIcon, StopIcon } from './icons/Icons';
import { LiveServerMessage, LiveSession } from '@google/genai';

interface AddTransactionFormProps {
  // FIX: Update the addTransaction prop type to Omit<Transaction, 'id' | 'panel'> to match the parent component's function signature.
  addTransaction: (transaction: Omit<Transaction, 'id' | 'panel'>, installments?: { count: number }) => void;
  expenseCategories: Category;
  incomeCategories: Category;
  revertedTransaction: Transaction | null;
  clearRevertedTransaction: () => void;
  bankAccounts: BankAccount[];
}

const AddTransactionForm: React.FC<AddTransactionFormProps> = ({ 
    addTransaction, 
    expenseCategories, 
    incomeCategories,
    revertedTransaction,
    clearRevertedTransaction,
    bankAccounts
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [accountId, setAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs for audio recording
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    if (bankAccounts.length > 0 && !accountId) {
      setAccountId(bankAccounts[0].id);
    }
  }, [bankAccounts, accountId]);

  // Effect to populate the form when a transaction is reverted.
  useEffect(() => {
    if (revertedTransaction) {
        setDescription(revertedTransaction.description);
        setAmount(revertedTransaction.amount.toString());
        setDate(revertedTransaction.date);
        setType(revertedTransaction.type);
        setCategory(revertedTransaction.category);
        setSubCategory(revertedTransaction.subCategory);
        setAccountId(revertedTransaction.accountId);

        // Signal that the reverted transaction has been processed.
        clearRevertedTransaction();
    }
  }, [revertedTransaction, clearRevertedTransaction]);

  // Effect to manage category and sub-category consistency when type or category changes.
  useEffect(() => {
    const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
    const availableCategories = Object.keys(currentCategories);

    // If the selected category is not valid for the current type, reset it.
    if (!availableCategories.includes(category)) {
        const firstCategory = availableCategories[0] || '';
        setCategory(firstCategory);
        
        const newSubCategories = currentCategories[firstCategory] || [];
        setSubCategories(newSubCategories);
        setSubCategory(newSubCategories[0] || '');
    } else {
        // If the category is valid, ensure the sub-category list is correct.
        const newSubCategories = currentCategories[category] || [];
        setSubCategories(newSubCategories);

        // And ensure the selected sub-category is valid.
        if (!newSubCategories.includes(subCategory)) {
            setSubCategory(newSubCategories[0] || '');
        }
    }
  }, [category, type, expenseCategories, incomeCategories, subCategory]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !category || !accountId) {
        alert("Por favor, preencha todos os campos, incluindo a conta bancária.");
        return;
    }
    addTransaction(
      {
        description,
        amount: parseFloat(amount),
        date,
        type,
        category,
        subCategory,
        accountId
      },
      isInstallment && type === 'expense' ? { count: parseInt(installments) } : undefined
    );
    setDescription('');
    setAmount('');
    setIsInstallment(false);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSuggestCategory = async () => {
      if (!description.trim()) return;
      setIsSuggesting(true);
      try {
          const categoriesToSuggest = type === 'expense' ? expenseCategories : incomeCategories;
          const suggestion = await suggestCategoryForTransaction(description, type, categoriesToSuggest);
          const availableCategories = Object.keys(categoriesToSuggest);

          if (suggestion.category && availableCategories.includes(suggestion.category)) {
              setCategory(suggestion.category);
              const availableSubCategories = categoriesToSuggest[suggestion.category] || [];
              if (suggestion.subCategory && availableSubCategories.includes(suggestion.subCategory)) {
                  setSubCategory(suggestion.subCategory);
              }
          }
      } catch (error) {
          console.error("Failed to suggest category", error);
      } finally {
          setIsSuggesting(false);
      }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    try {
        const details = await extractTransactionDetailsFromImage(file);
        setDescription(details.description || '');
        setAmount(details.amount?.toString() || '');
        if (details.date && /^\d{4}-\d{2}-\d{2}$/.test(details.date)) {
            setDate(details.date);
        }
    } catch (error) {
        console.error("OCR failed", error);
        alert("Falha ao ler o recibo. Por favor, preencha os dados manualmente.");
    } finally {
        setIsOcrLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
     if (sessionPromiseRef.current) {
        try {
            const session = await sessionPromiseRef.current;
            session.close();
        } catch (e) { console.error("Error closing session:", e); }
        sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
        audioContextRef.current = null;
    }
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        
        sessionPromiseRef.current = createTranscriptionSession({
            onOpen: () => {
                if (!audioContextRef.current || !streamRef.current) return;
                const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                };
                source.connect(scriptProcessorRef.current);
                scriptProcessorRef.current.connect(audioContextRef.current.destination);
            },
            onMessage: (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                     // Append with a space if description is not empty
                    setDescription(prev => prev ? `${prev}${text}` : text);
                }
                 if (message.serverContent?.turnComplete) {
                     setDescription(prev => prev + ' ');
                 }
            },
            onError: (e) => { console.error("Session error:", e); stopRecording(); },
            onClose: () => {}
        });
    } catch (e) {
        console.error("Failed to start recording", e);
        setIsRecording(false);
    }
  };

  const handleMicClick = () => {
      isRecording ? stopRecording() : startRecording();
  };

  useEffect(() => {
      return () => {
          stopRecording();
      }
  }, [stopRecording]);

  const categories = type === 'expense' ? Object.keys(expenseCategories) : Object.keys(incomeCategories);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Adicionar Transação</h3>
        <input 
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden" 
        />
        <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isOcrLoading}
            title="Escanear recibo com a câmera"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900 transition disabled:opacity-50 disabled:cursor-wait"
        >
            {isOcrLoading ? (
                <>
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Lendo...</span>
                </>
            ) : (
                <>
                    <CameraIcon className="h-5 w-5" />
                    <span>Escanear</span>
                </>
            )}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setType('expense'); }}
              title="Registrar uma despesa"
              className={`w-full py-2 rounded-md text-sm font-medium transition ${type === 'expense' ? 'bg-red-500 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); }}
              title="Registrar uma entrada"
              className={`w-full py-2 rounded-md text-sm font-medium transition ${type === 'income' ? 'bg-green-500 text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Entrada
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Descrição</label>
          <div className="relative mt-1">
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 pr-20"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1">
                <button 
                    type="button" 
                    onClick={handleMicClick}
                    className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    title={isRecording ? "Parar gravação" : "Gravar descrição por voz"}
                >
                   {isRecording ? <StopIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
                </button>
                <button 
                    type="button" 
                    onClick={handleSuggestCategory}
                    disabled={isSuggesting || !description.trim()}
                    className="p-2 rounded-full text-indigo-500 hover:bg-indigo-100 dark:hover:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed"
                    title="Sugerir categoria com IA"
                >
                    {isSuggesting ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <SparklesIcon className="h-5 w-5" />}
                </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Valor (R$)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
             <div>
              <label htmlFor="account" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Conta</label>
              <select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                {bankAccounts.length === 0 ? <option disabled>Cadastre uma conta</option> :
                  bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)
                }
              </select>
            </div>
        </div>
        
        {type === 'expense' && (
            <div className="space-y-2">
                 <div className="flex items-center">
                    <input
                        id="isInstallment"
                        type="checkbox"
                        checked={isInstallment}
                        onChange={(e) => setIsInstallment(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isInstallment" className="ml-2 block text-sm text-slate-600 dark:text-slate-300">
                        É uma compra parcelada?
                    </label>
                </div>
                {isInstallment && (
                     <div>
                        <label htmlFor="installments" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Número de parcelas</label>
                        <input
                            id="installments"
                            type="number"
                            min="2"
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                )}
            </div>
        )}

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Data {isInstallment ? 'da 1ª parcela' : ''}</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Categoria</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {subCategories.length > 0 && (
          <div>
            <label htmlFor="subCategory" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Subcategoria</label>
            <select
              id="subCategory"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
               {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={bankAccounts.length === 0}
          title={bankAccounts.length === 0 ? "Cadastre uma conta primeiro" : "Adicionar transação"}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {bankAccounts.length === 0 ? "Cadastre uma conta primeiro" : "Adicionar"}
        </button>
      </form>
    </div>
  );
};

export default AddTransactionForm;