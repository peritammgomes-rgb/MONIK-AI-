import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Transaction } from '../types';
import { getChat, getGroundedResponse, analyzeBusinessDataWithGemini } from '../services/geminiService';
import { PaperAirplaneIcon, UserIcon } from './icons/Icons';
import { Chat } from '@google/genai';

interface ChatbotProps {
    personalTransactions: Transaction[];
    businessTransactions: Transaction[];
}

const Chatbot: React.FC<ChatbotProps> = ({ personalTransactions, businessTransactions }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou a Monik AI, sua assistente financeira. Como posso te ajudar a organizar, conquistar e transbordar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = getChat();
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        let responseText = '';
        if (input.toLowerCase().includes('pesquisar sobre')) {
            const { text } = await getGroundedResponse(input);
            responseText = text;
        } else if (input.toLowerCase().includes('analisar meus dados de negócio')) {
            responseText = await analyzeBusinessDataWithGemini(businessTransactions);
        } else {
            if(chatRef.current) {
                const result = await chatRef.current.sendMessageStream({ message: input });
                let streamedText = '';
                for await (const chunk of result) {
                    streamedText += chunk.text;
                     setMessages(prev => {
                        const newMessages = [...prev];
                        if (newMessages[newMessages.length - 1].role === 'model') {
                            newMessages[newMessages.length - 1].text = streamedText;
                        } else {
                            newMessages.push({ role: 'model', text: streamedText });
                        }
                        return newMessages;
                    });
                }
                responseText = streamedText;
            }
        }
        
        if (!responseText.trim()) { // Handle cases where streaming wasn't used
             setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.text = responseText;
                } else {
                    newMessages.push({ role: 'model', text: responseText });
                }
                return newMessages;
            });
        }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0"><UserIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" /></div>}
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AI</div>
                <div className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-700 rounded-bl-none">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-full py-2 pl-4 pr-12 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            title="Enviar mensagem"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 text-white disabled:bg-slate-400 dark:disabled:bg-slate-600 hover:bg-indigo-700 transition"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;