import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category, BankAccount } from '../types';
import { XMarkIcon } from './icons/Icons';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onSave: (transaction: Transaction) => void;
  expenseCategories: Category;
  incomeCategories: Category;
  bankAccounts: BankAccount[];
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ isOpen, onClose, transaction, onSave, expenseCategories, incomeCategories, bankAccounts }) => {
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [date, setDate] = useState(transaction.date);
  const [type] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [subCategory, setSubCategory] = useState(transaction.subCategory);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  
  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

  useEffect(() => {
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setDate(transaction.date);
    setCategory(transaction.category);
    setSubCategory(transaction.subCategory);
    setAccountId(transaction.accountId);
  }, [transaction]);

  useEffect(() => {
    if (category && currentCategories[category]) {
      setSubCategories(currentCategories[category]);
    } else {
      setSubCategories([]);
    }
  }, [category, currentCategories]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...transaction,
      description,
      amount: parseFloat(amount),
      date,
      category,
      subCategory,
      accountId
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">Editar Transação</h2>
          <button onClick={onClose} title="Fechar" className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
            <main className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Descrição</label>
                  <input
                    id="edit-description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Valor (R$)</label>
                  <input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Data</label>
                  <input
                    id="edit-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-account" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Conta</label>
                  <select
                    id="edit-account"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm"
                    required
                  >
                    {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Categoria</label>
                  <select
                    id="edit-category"
                    value={category}
                    onChange={(e) => {
                        setCategory(e.target.value);
                        setSubCategory(''); // Reset subcategory on category change
                    }}
                    className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm"
                  >
                    {Object.keys(currentCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                {subCategories.length > 0 && (
                  <div>
                    <label htmlFor="edit-subCategory" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Subcategoria</label>
                    <select
                      id="edit-subCategory"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm"
                    >
                      <option value="">Selecione...</option>
                      {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>
                )}
            </main>
            <footer className="flex justify-end items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                <div className="flex gap-2">
                    <button type="button" onClick={onClose} title="Cancelar edição" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                        Cancelar
                    </button>
                    <button type="submit" title="Salvar alterações" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700">
                        Salvar Alterações
                    </button>
                </div>
            </footer>
          </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;