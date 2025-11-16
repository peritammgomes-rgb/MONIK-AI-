

import React, { useState } from 'react';
import { XMarkIcon, ChatBubbleBottomCenterTextIcon, MicrophoneIcon, MonikLogoIcon } from './icons/Icons';
import Chatbot from './Chatbot';
import LiveChat from './LiveChat';
import { Transaction } from '../types';

interface ChatWidgetProps {
    personalTransactions: Transaction[];
    businessTransactions: Transaction[];
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ personalTransactions, businessTransactions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');

  const getTabClass = (tab: 'text' | 'voice') => {
    return `w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
        activeTab === tab 
        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' 
        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Fechar assistente" : "Abrir assistente Monik AI"}
        className="fixed bottom-6 right-6 bg-amber-500 text-slate-900 dark:bg-amber-400 p-4 rounded-full shadow-lg hover:bg-amber-600 dark:hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:focus:ring-offset-slate-900 transition-transform duration-200 hover:scale-110 z-50"
        aria-label="Abrir assistente Monik AI"
      >
        {isOpen ? <XMarkIcon className="h-7 w-7" /> : <MonikLogoIcon className="h-7 w-7" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden border border-slate-200 dark:border-slate-700">
            <header className="bg-slate-100 dark:bg-slate-900 p-2">
                <nav className="flex">
                    <button onClick={() => setActiveTab('text')} className={getTabClass('text')} title="Abrir chat por texto">
                        <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                        Chat por Texto
                    </button>
                    <button onClick={() => setActiveTab('voice')} className={getTabClass('voice')} title="Abrir chat por voz">
                        <MicrophoneIcon className="h-5 w-5" />
                        Chat por Voz
                    </button>
                </nav>
            </header>
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'text' && <Chatbot personalTransactions={personalTransactions} businessTransactions={businessTransactions} />}
                {activeTab === 'voice' && <LiveChat />}
            </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;