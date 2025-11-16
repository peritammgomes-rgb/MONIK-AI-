import React from 'react';
import { Transaction, Category, SpendingCapAlert, BankAccount } from '../types';
import AddTransactionForm from './AddTransactionForm';
import TransactionList from './TransactionList';
import { TrendingUpIcon, TrendingDownIcon, ScaleIcon, ChartPieIcon } from './icons/Icons';
import Alert from './Alert';

interface PersonalDashboardProps {
  transactions: Transaction[];
  // FIX: Update the addTransaction prop type to Omit<Transaction, 'id' | 'panel'> to match the parent component's function signature.
  addTransaction: (transaction: Omit<Transaction, 'id' | 'panel'>, installments?: { count: number }) => void;
  expenseCategories: Category;
  incomeCategories: Category;
  onOpenAnalysis: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onRevertTransaction: (transaction: Transaction) => void;
  revertedTransaction: Transaction | null;
  clearRevertedTransaction: () => void;
  activeAlerts: SpendingCapAlert[];
  dismissAlert: (id: string) => void;
  bankAccounts: BankAccount[];
}

const PersonalDashboard: React.FC<PersonalDashboardProps> = ({ 
    transactions, 
    addTransaction, 
    expenseCategories, 
    incomeCategories, 
    onOpenAnalysis, 
    onEditTransaction, 
    onRevertTransaction,
    revertedTransaction,
    clearRevertedTransaction,
    activeAlerts,
    dismissAlert,
    bankAccounts
}) => {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    const personalAlerts = activeAlerts.filter(alert => alert.id.startsWith('personal-'));

    return (
        <div className="space-y-6">
            {personalAlerts.length > 0 && (
                <div className="space-y-2">
                    {personalAlerts.map(alert => (
                        <Alert key={alert.id} message={alert.message} onDismiss={() => dismissAlert(alert.id)} />
                    ))}
                </div>
            )}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Painel Pessoal</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenAnalysis}
                        title="Analisar finanças e gerenciar metas"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                    >
                        <ChartPieIcon className="h-5 w-5" />
                        Análise & Metas
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100">
                        <TrendingUpIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Entradas</p>
                        <p className="text-2xl font-semibold text-green-600">
                            {totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
                    <div className="p-3 rounded-full bg-red-100">
                        <TrendingDownIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Saídas</p>
                        <p className="text-2xl font-semibold text-red-600">
                            {totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
                    <div className="p-3 rounded-full bg-indigo-100">
                        <ScaleIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Saldo Atual</p>
                        <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                            {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <AddTransactionForm 
                        addTransaction={addTransaction} 
                        expenseCategories={expenseCategories}
                        incomeCategories={incomeCategories}
                        revertedTransaction={revertedTransaction}
                        clearRevertedTransaction={clearRevertedTransaction}
                        bankAccounts={bankAccounts}
                    />
                </div>
                <div className="lg:col-span-2">
                    <TransactionList 
                        transactions={transactions}
                        onEditTransaction={onEditTransaction}
                        onRevertTransaction={onRevertTransaction}
                        bankAccounts={bankAccounts}
                    />
                </div>
            </div>
        </div>
    );
};

export default PersonalDashboard;