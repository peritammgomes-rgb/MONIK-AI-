import React, { useState } from 'react';
import { Transaction, BankAccount } from '../types';
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon } from './icons/Icons';

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onRevertTransaction: (transaction: Transaction) => void;
  bankAccounts: BankAccount[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEditTransaction, onRevertTransaction, bankAccounts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h3 className="text-xl font-bold">Últimas Transações</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </span>
                <input
                    type="text"
                    placeholder="Pesquisar por descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full block bg-slate-100 dark:bg-slate-700 border-transparent rounded-full py-2 pl-10 pr-3 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
            </div>
        </div>
      </div>
      <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(t => {
            const accountName = bankAccounts.find(acc => acc.id === t.accountId)?.name || 'Conta não encontrada';
            return (
              <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                    {t.type === 'income' ? <ArrowUpIcon className="h-5 w-5 text-green-500" /> : <ArrowDownIcon className="h-5 w-5 text-red-500" />}
                   </div>
                   <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{t.description}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                          {t.category}{t.subCategory && ` / ${t.subCategory}`}
                      </p>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                          {accountName}
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </p>
                  </div>
                  <div className="flex items-center">
                      <button onClick={() => onEditTransaction(t)} title="Editar transação" className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full" aria-label="Editar transação">
                          <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => onRevertTransaction(t)} title="Corrigir lançamento (estornar e criar um novo)" className="p-2 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors rounded-full" aria-label="Corrigir lançamento">
                          <ArrowUturnLeftIcon className="h-5 w-5" />
                      </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">
            {searchTerm ? 'Nenhuma transação encontrada.' : 'Nenhuma transação registrada.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default TransactionList;