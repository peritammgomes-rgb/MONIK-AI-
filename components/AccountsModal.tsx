import React, { useState, useEffect } from 'react';
import { PanelType, BankAccount } from '../types';
import { XMarkIcon, CurrencyDollarIcon, PencilIcon, ClipboardDocumentListIcon } from './icons/Icons';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  panel: PanelType;
  accounts: BankAccount[];
  onAddAccount: (name: string, initialBalance: number) => void;
  onUpdateAccount: (id: string, name: string, initialBalance: number) => void;
  onViewStatement: (accountId: string) => void;
}

const AccountsModal: React.FC<AccountsModalProps> = ({
  isOpen,
  onClose,
  panel,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onViewStatement,
}) => {
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  useEffect(() => {
    // Reset form when modal is opened or panel changes
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, panel]);
  
  const resetForm = () => {
      setName('');
      setInitialBalance('');
      setEditingAccount(null);
  };

  const handleEditClick = (account: BankAccount) => {
      setEditingAccount(account);
      setName(account.name);
      setInitialBalance(account.initialBalance.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(initialBalance);
    if (!name.trim() || isNaN(balance)) {
      alert("Por favor, insira um nome e um saldo inicial válidos.");
      return;
    }
    
    if (editingAccount) {
        onUpdateAccount(editingAccount.id, name, balance);
    } else {
        onAddAccount(name, balance);
    }
    
    resetForm();
  };

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            Contas Bancárias ({panel === 'personal' ? 'Pessoal' : 'Profissional'})
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Fechar" aria-label="Fechar modal">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {editingAccount ? 'Editar Conta' : 'Adicionar Nova Conta'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="account-name" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Nome da Conta</label>
                <input
                  id="account-name"
                  type="text"
                  placeholder="Ex: Banco Principal"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1 block w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="initial-balance" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Saldo Inicial (R$)</label>
                <input
                  id="initial-balance"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1000,00"
                  value={initialBalance}
                  onChange={e => setInitialBalance(e.target.value)}
                  className="mt-1 block w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm"
                  required
                />
              </div>
            </div>
             <div className="flex gap-2">
                 <button type="submit" title={editingAccount ? 'Salvar alterações da conta' : 'Adicionar nova conta'} className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                    {editingAccount ? 'Atualizar Conta' : 'Adicionar Conta'}
                 </button>
                 {editingAccount && (
                    <button type="button" onClick={resetForm} title="Cancelar edição" className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">
                        Cancelar Edição
                    </button>
                 )}
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Minhas Contas</h3>
            {accounts.length > 0 ? (
              accounts.map(account => (
                <div key={account.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg flex justify-between items-center gap-2">
                  <div className="flex-grow">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{account.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Saldo Inicial: {formatCurrency(account.initialBalance)}</p>
                  </div>
                  <div className="text-right flex-shrink-0 mx-4">
                    <p className={`text-lg font-bold ${account.currentBalance >= 0 ? 'text-slate-700 dark:text-slate-200' : 'text-red-500'}`}>
                      {formatCurrency(account.currentBalance)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Saldo Atual</p>
                  </div>
                   <div className="flex items-center gap-1">
                       <button onClick={() => handleEditClick(account)} title={`Editar conta ${account.name}`} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full" aria-label={`Editar conta ${account.name}`}>
                           <PencilIcon className="h-5 w-5" />
                       </button>
                       <button onClick={() => onViewStatement(account.id)} title={`Ver extrato da conta ${account.name}`} className="p-2 text-slate-400 hover:text-indigo-600 rounded-full" aria-label={`Ver extrato da conta ${account.name}`}>
                           <ClipboardDocumentListIcon className="h-5 w-5" />
                       </button>
                   </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500 dark:text-slate-400">Nenhuma conta cadastrada.</p>
                <p className="text-sm text-slate-400">Use o formulário acima para adicionar sua primeira conta.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountsModal;