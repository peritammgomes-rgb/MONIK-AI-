import React from 'react';
import { Transaction, Category, SpendingCapAlert, BankAccount } from '../types';
import AddTransactionForm from './AddTransactionForm';
import TransactionList from './TransactionList';
import { TrendingUpIcon, TrendingDownIcon, ScaleIcon, ChartPieIcon } from './icons/Icons';
import Alert from './Alert';

interface BusinessDashboardProps {
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
  businessActivity: string;
  setBusinessActivity: (activity: string) => void;
  activeAlerts: SpendingCapAlert[];
  dismissAlert: (id: string) => void;
  bankAccounts: BankAccount[];
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ 
    transactions, 
    addTransaction, 
    expenseCategories, 
    incomeCategories, 
    onOpenAnalysis, 
    onEditTransaction,
    onRevertTransaction,
    revertedTransaction,
    clearRevertedTransaction,
    businessActivity, 
    setBusinessActivity,
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
    
    const businessAlerts = activeAlerts.filter(alert => alert.id.startsWith('business-'));

    return (
        <div className="space-y-6">
             {businessAlerts.length > 0 && (
                <div className="space-y-2">
                    {businessAlerts.map(alert => (
                        <Alert key={alert.id} message={alert.message} onDismiss={() => dismissAlert(alert.id)} />
                    ))}
                </div>
            )}
            <div className="flex justify-between items-center gap-4 flex-wrap">
                <h2 className="text-3xl font-bold text-slate-800">Painel Profissional</h2>
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

            <div className="bg-white p-4 rounded-xl shadow-lg">
                <label htmlFor="business-activity" className="block text-sm font-medium text-slate-600">
                    Qual seu ramo de atividade profissional?
                </label>
                <input
                    id="business-activity"
                    type="text"
                    value={businessActivity}
                    onChange={(e) => setBusinessActivity(e.target.value)}
                    placeholder="Ex: Consultoria de Marketing, Loja de Roupas, Cafeteria"
                    className="mt-1 block w-full bg-slate-100 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                    Esta informação ajuda a IA a fornecer análises e dicas mais precisas para o seu negócio.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100">
                        <TrendingUpIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Receita</p>
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
                        <p className="text-sm text-slate-500">Custos & Despesas</p>
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
                        <p className="text-sm text-slate-500">Lucro/Prejuízo</p>
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

export default BusinessDashboard;