import React, { useState, useMemo } from 'react';
import { BankAccount, Transaction } from '../types';
import { XMarkIcon, ClipboardDocumentListIcon } from './icons/Icons';

interface BankStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount;
  allTransactions: Transaction[];
}

const BankStatementModal: React.FC<BankStatementModalProps> = ({
  isOpen,
  onClose,
  account,
  allTransactions,
}) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (dateString: string) => new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');

  const { periodTransactions, initialBalanceForPeriod, totalIncome, totalExpense, finalBalance } = useMemo(() => {
    const accountTransactions = allTransactions
      .filter(t => t.accountId === account.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balanceBeforePeriod = account.initialBalance;
    accountTransactions.forEach(t => {
      if (t.date < startDate) {
        balanceBeforePeriod += t.type === 'income' ? t.amount : -t.amount;
      }
    });

    const filteredTransactions = accountTransactions.filter(t => t.date >= startDate && t.date <= endDate);

    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });

    return {
      periodTransactions: filteredTransactions,
      initialBalanceForPeriod: balanceBeforePeriod,
      totalIncome: income,
      totalExpense: expense,
      finalBalance: balanceBeforePeriod + income - expense,
    };
  }, [account, allTransactions, startDate, endDate]);
  

  if (!isOpen) return null;
  
  let runningBalanceForRender = initialBalanceForPeriod;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-500" />
            Extrato da Conta: {account.name}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Fechar" aria-label="Fechar modal">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
            <div className="flex-grow">
                <label htmlFor="start-date-stmt" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data Início</label>
                <input type="date" id="start-date-stmt" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm text-sm" />
            </div>
            <div className="flex-grow">
                <label htmlFor="end-date-stmt" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data Fim</label>
                <input type="date" id="end-date-stmt" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm text-sm" />
            </div>
        </div>

        <main className="flex-grow p-6 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Saldo Inicial</p>
                    <p className="font-bold text-lg">{formatCurrency(initialBalanceForPeriod)}</p>
                </div>
                 <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">Entradas</p>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
                </div>
                 <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">Saídas</p>
                    <p className="font-bold text-lg text-red-600 dark:text-red-400">{formatCurrency(totalExpense)}</p>
                </div>
                 <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-lg">
                    <p className="text-sm text-indigo-800 dark:text-indigo-300">Saldo Final</p>
                    <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatCurrency(finalBalance)}</p>
                </div>
            </div>

            <div className="space-y-2">
                 <div className="hidden md:grid grid-cols-4 items-center p-2 text-sm font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <div>Data</div>
                    <div>Descrição</div>
                    <div className="text-right">Valor</div>
                    <div className="text-right">Saldo</div>
                </div>
                {periodTransactions.length > 0 ? (
                    periodTransactions.map(t => {
                        runningBalanceForRender += t.type === 'income' ? t.amount : -t.amount;
                        const isIncome = t.type === 'income';
                        return (
                             <div key={t.id} className="grid grid-cols-3 md:grid-cols-4 items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm">
                                <div className="font-medium">{formatDate(t.date)}</div>
                                <div className="col-span-2 md:col-span-1 break-words">{t.description}</div>
                                <div className={`font-mono text-right ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                    {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                                </div>
                                <div className="hidden md:block font-mono text-right text-slate-500 dark:text-slate-400">
                                    {formatCurrency(runningBalanceForRender)}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-10">Nenhuma transação encontrada para este período.</p>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default BankStatementModal;