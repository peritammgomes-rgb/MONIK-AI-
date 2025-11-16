import React from 'react';
import { PanelType } from '../types';
import { UserIcon, BriefcaseIcon, TagIcon, ArrowRightOnRectangleIcon, MonikLogoIcon, CalendarDaysIcon, HomeIcon, CurrencyDollarIcon } from './icons/Icons';

interface HeaderProps {
  activePanel: PanelType;
  onPanelChange: (panel: PanelType) => void;
  onOpenCategoryManager: () => void;
  onLogout: () => void;
  onOpenAgenda: () => void;
  onOpenSpendingCapModal: () => void;
  onOpenAccountsModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ activePanel, onPanelChange, onOpenCategoryManager, onLogout, onOpenAgenda, onOpenSpendingCapModal, onOpenAccountsModal }) => {
  const getButtonClasses = (panel: PanelType) => {
    const baseClasses = 'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500';
    if (activePanel === panel) {
      return `${baseClasses} bg-indigo-600 text-white shadow-md`;
    }
    return `${baseClasses} text-slate-600 hover:bg-slate-200`;
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <MonikLogoIcon className="h-8 w-8 text-amber-500" />
          <h1 className="text-2xl font-bold text-indigo-600">
            Monik <span className="text-slate-500">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
            <button onClick={() => onPanelChange('personal')} className={getButtonClasses('personal')}>
              <UserIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Pessoal</span>
            </button>
            <button onClick={() => onPanelChange('business')} className={getButtonClasses('business')}>
              <BriefcaseIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Profissional</span>
            </button>
          </nav>
          <div className="flex items-center gap-1">
             <button 
              onClick={onOpenAccountsModal} 
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              aria-label="Gerenciar contas bancárias"
              title="Contas Bancárias"
            >
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </button>
             <button 
              onClick={onOpenSpendingCapModal} 
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              aria-label="Definir teto de gastos"
              title="Teto de Gastos"
            >
              <HomeIcon className="h-6 w-6" />
            </button>
             <button 
              onClick={onOpenAgenda} 
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              aria-label="Abrir agenda"
              title="Agenda & Lembretes"
            >
              <CalendarDaysIcon className="h-6 w-6" />
            </button>
            <button 
              onClick={onOpenCategoryManager} 
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              aria-label="Gerenciar categorias"
              title="Gerenciar Categorias"
            >
              <TagIcon className="h-6 w-6" />
            </button>
            <button 
              onClick={onLogout} 
              className="p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
              aria-label="Sair"
              title="Sair"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;