import React, { useState } from 'react';
import { PanelType, Category } from '../types';
import { XMarkIcon } from './icons/Icons';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  panel: PanelType;
  expenseCategories: Category;
  incomeCategories: Category;
  onUpdateCategories: (type: 'expense' | 'income', newCategories: Category) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  panel,
  expenseCategories,
  incomeCategories,
  onUpdateCategories,
}) => {
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleAddCategory = (type: 'expense' | 'income') => {
    const newCategoryName = (type === 'expense' ? newExpenseCategory : newIncomeCategory).trim();
    const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

    if (newCategoryName && !currentCategories[newCategoryName]) {
      const updated = { ...currentCategories, [newCategoryName]: [] };
      onUpdateCategories(type, updated);
      if (type === 'expense') {
        setNewExpenseCategory('');
      } else {
        setNewIncomeCategory('');
      }
    }
  };

  const handleAddSubCategory = (parentCategory: string, type: 'expense' | 'income') => {
    const subCategoryName = newSubCategory[parentCategory]?.trim();
    const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;

    if (subCategoryName && !currentCategories[parentCategory].includes(subCategoryName)) {
      const updated = {
        ...currentCategories,
        [parentCategory]: [...currentCategories[parentCategory], subCategoryName],
      };
      onUpdateCategories(type, updated);
      setNewSubCategory({ ...newSubCategory, [parentCategory]: '' });
    }
  };

  const renderCategorySection = (
    title: string,
    categories: Category,
    type: 'expense' | 'income'
  ) => {
    const [newCategoryValue, setNewCategoryValue] = type === 'expense' 
        ? [newExpenseCategory, setNewExpenseCategory]
        : [newIncomeCategory, setNewIncomeCategory];
    const buttonClass = type === 'expense' 
        ? "bg-indigo-600 hover:bg-indigo-700" 
        : "bg-green-600 hover:bg-green-700";

    return (
      <section>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
        <div className="space-y-3">
          {Object.entries(categories).map(([category, subCategories]) => (
            <div key={category} className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
              <p className="font-bold">{category}</p>
              <ul className="list-disc list-inside pl-2 mt-1 text-sm text-slate-600 dark:text-slate-300">
                {Array.isArray(subCategories) && subCategories.map(sub => <li key={sub}>{sub}</li>)}
                {Array.isArray(subCategories) && subCategories.length === 0 && <li className="text-slate-400 italic">Nenhuma subcategoria</li>}
              </ul>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Nova subcategoria"
                  value={newSubCategory[category] || ''}
                  onChange={(e) => setNewSubCategory({ ...newSubCategory, [category]: e.target.value })}
                  className="flex-grow bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button onClick={() => handleAddSubCategory(category, type)} title="Adicionar subcategoria" className="bg-indigo-500 text-white px-3 py-1 text-sm rounded-md hover:bg-indigo-600">Adicionar</button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            placeholder="Nova categoria"
            value={newCategoryValue}
            onChange={(e) => setNewCategoryValue(e.target.value)}
            className="flex-grow bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button onClick={() => handleAddCategory(type)} title={`Adicionar nova categoria de ${type === 'expense' ? 'despesa' : 'entrada'}`} className={`${buttonClass} text-white px-3 py-1 text-sm rounded-md font-semibold`}>Adicionar Categoria</button>
        </div>
      </section>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold">Gerenciar Categorias ({panel === 'personal' ? 'Pessoal' : 'Profissional'})</h2>
                <button onClick={onClose} title="Fechar" className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <XMarkIcon className="h-6 w-6"/>
                </button>
            </header>
            <main className="flex-grow p-6 overflow-y-auto space-y-6">
                {renderCategorySection('Categorias de Despesa', expenseCategories, 'expense')}
                <hr className="border-slate-200 dark:border-slate-700"/>
                {renderCategorySection('Categorias de Entrada', incomeCategories, 'income')}
            </main>
        </div>
    </div>
  );
};

export default CategoryManager;