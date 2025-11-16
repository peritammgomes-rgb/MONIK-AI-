import React, { useState, useEffect } from 'react';
import { PanelType, Category, SpendingCap, Transaction } from '../types';
import { XMarkIcon, HomeIcon, TrashIcon } from './icons/Icons';

interface SpendingCapModalProps {
  isOpen: boolean;
  onClose: () => void;
  panel: PanelType;
  transactions: Transaction[];
  expenseCategories: Category;
  spendingCaps: SpendingCap[];
  onAddOrUpdate: (panel: PanelType, category: string, limit: number, subCategory?: string) => void;
  onDelete: (id: string) => void;
}

const SpendingCapModal: React.FC<SpendingCapModalProps> = ({
  isOpen,
  onClose,
  panel,
  transactions,
  expenseCategories,
  spendingCaps,
  onAddOrUpdate,
  onDelete,
}) => {
  const availableCategories = Object.keys(expenseCategories);
  const [selectedCategory, setSelectedCategory] = useState(availableCategories[0] || '');
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [limit, setLimit] = useState('');

  useEffect(() => {
    // Reset category selection when panel changes
    const newAvailable = Object.keys(expenseCategories);
    setSelectedCategory(newAvailable[0] || '');
    setLimit('');
  }, [panel, expenseCategories]);

  useEffect(() => {
    const subs = expenseCategories[selectedCategory] || [];
    setSubCategories(subs);
    setSelectedSubCategory(''); // Reset subcategory when main category changes
  }, [selectedCategory, expenseCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitAmount = parseFloat(limit);
    if (!selectedCategory || isNaN(limitAmount) || limitAmount <= 0) {
        alert("Por favor, selecione uma categoria e insira um limite válido.");
        return;
    };
    onAddOrUpdate(panel, selectedCategory, limitAmount, selectedSubCategory || undefined);
    setLimit('');
  };

  const calculateCurrentSpending = (category: string, subCategory?: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const total = transactions
        .filter(t => {
            const isCorrectCategory = t.category === category &&
                                     t.type === 'expense' &&
                                     new Date(t.date).getMonth() === currentMonth &&
                                     new Date(t.date).getFullYear() === currentYear;

            if (!isCorrectCategory) return false;

            // If a subcategory cap is defined, match it.
            if (subCategory) {
                return t.subCategory === subCategory;
            }
            // If no subcategory cap, sum all transactions for the main category.
            return true;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    return total;
  };
  
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const panelCaps = spendingCaps.filter(c => c.panel === panel);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HomeIcon className="h-6 w-6 text-indigo-500" />
            Teto de Gastos ({panel === 'personal' ? 'Pessoal' : 'Profissional'})
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Fechar" aria-label="Fechar modal">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto space-y-6">
            <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Definir Novo Teto Mensal</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                        <label htmlFor="cap-category" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Categoria</label>
                        <select
                            id="cap-category"
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="mt-1 block w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                        >
                           {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     {subCategories.length > 0 && (
                        <div className="sm:col-span-1">
                            <label htmlFor="cap-subcategory" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Subcategoria</label>
                            <select
                                id="cap-subcategory"
                                value={selectedSubCategory}
                                onChange={e => setSelectedSubCategory(e.target.value)}
                                className="mt-1 block w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                            >
                               <option value="">Toda a Categoria</option>
                               {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                     )}
                    <div className="sm:col-span-1">
                        <label htmlFor="cap-limit" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Limite (R$)</label>
                        <input
                            id="cap-limit"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ex: 500,00"
                            value={limit}
                            onChange={e => setLimit(e.target.value)}
                            className="mt-1 block w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                            required
                        />
                    </div>
                </div>
                <button type="submit" title="Salvar teto de gastos" className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                    Salvar Teto
                </button>
            </form>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Meus Tetos de Gastos</h3>
                {panelCaps.length > 0 ? panelCaps.map(cap => {
                    const spent = calculateCurrentSpending(cap.category, cap.subCategory);
                    const progress = cap.limit > 0 ? Math.min((spent / cap.limit) * 100, 100) : 0;
                    const progressBarColor = progress >= 90 ? 'bg-red-500' : progress >= 75 ? 'bg-amber-500' : 'bg-green-500';
                    const displayName = cap.subCategory ? `${cap.category} / ${cap.subCategory}` : cap.category;

                    return (
                        <div key={cap.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <p className="font-bold text-slate-800 dark:text-slate-100">{displayName}</p>
                                <button onClick={() => onDelete(cap.id)} title={`Remover teto para ${displayName}`} className="p-1 text-slate-400 hover:text-red-500" aria-label={`Remover teto para ${displayName}`}>
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex justify-between text-sm font-mono mt-1">
                                <span className={progress >= 90 ? 'font-bold text-red-500' : ''}>{formatCurrency(spent)}</span>
                                <span className="text-slate-500 dark:text-slate-400">/ {formatCurrency(cap.limit)}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-4 mt-2">
                               <div className={`h-4 rounded-full transition-all duration-500 ${progressBarColor}`} style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    );
                }) : (
                     <div className="text-center py-6">
                        <p className="text-slate-500 dark:text-slate-400">Você ainda não definiu nenhum teto de gastos.</p>
                        <p className="text-sm text-slate-400">Use o formulário acima para começar a controlar suas despesas.</p>
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default SpendingCapModal;