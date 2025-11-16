import React, { useState, useEffect, useMemo } from 'react';
import { PanelType, Transaction, Category, Goal, Appointment, SpendingCap, SpendingCapAlert, BankAccount } from './types';
import { mockPersonalTransactions, mockBusinessTransactions, PERSONAL_CATEGORIES, BUSINESS_EXPENSE_CATEGORIES, PERSONAL_INCOME_CATEGORIES, BUSINESS_INCOME_CATEGORIES } from './constants';
import Header from './components/Header';
import PersonalDashboard from './components/PersonalDashboard';
import BusinessDashboard from './components/BusinessDashboard';
import ChatWidget from './components/ChatWidget';
import CategoryManager from './components/CategoryManager';
import AnalysisModal from './components/AnalysisModal';
import AuthPage from './components/AuthPage';
import EditTransactionModal from './components/EditTransactionModal';
import AgendaModal from './components/AgendaModal';
import SpendingCapModal from './components/SpendingCapModal';
import AccountsModal from './components/AccountsModal';
import BankStatementModal from './components/BankStatementModal';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [panel, setPanel] = useState<PanelType>('personal');
  const [personalTransactions, setPersonalTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('personalTransactions');
    return saved ? JSON.parse(saved) : mockPersonalTransactions;
  });
  const [businessTransactions, setBusinessTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('businessTransactions');
    return saved ? JSON.parse(saved) : mockBusinessTransactions;
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [bankAccounts, setBankAccounts] = useState<Omit<BankAccount, 'currentBalance'>[]>(() => {
    try {
      const saved = localStorage.getItem('bankAccounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure currentBalance is not persisted, it's always calculated
        return parsed.map(({ id, name, initialBalance, panel }: BankAccount) => ({ id, name, initialBalance, panel }));
      }
      return [
        { id: 'mock-personal-account', name: 'Conta Pessoal Principal', initialBalance: 1000, panel: 'personal' },
        { id: 'mock-business-account', name: 'Conta Empresarial Principal', initialBalance: 5000, panel: 'business' },
      ];
    } catch (e) { return []; }
  });
  
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
        const saved = localStorage.getItem('appointments');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  const [personalExpenseCategories, setPersonalExpenseCategories] = useState<Category>(PERSONAL_CATEGORIES);
  const [businessExpenseCategories, setBusinessExpenseCategories] = useState<Category>(BUSINESS_EXPENSE_CATEGORIES);
  const [personalIncomeCategories, setPersonalIncomeCategories] = useState<Category>(PERSONAL_INCOME_CATEGORIES);
  const [businessIncomeCategories, setBusinessIncomeCategories] = useState<Category>(BUSINESS_INCOME_CATEGORIES);
  
  const [spendingCaps, setSpendingCaps] = useState<SpendingCap[]>(() => {
    try {
        const saved = localStorage.getItem('spendingCaps');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });
  const [notifiedCaps, setNotifiedCaps] = useState<Record<string, number>>({}); // { [capId]: month }
  const [activeAlerts, setActiveAlerts] = useState<SpendingCapAlert[]>([]);

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [isSpendingCapModalOpen, setIsSpendingCapModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [viewingAccountStatementId, setViewingAccountStatementId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [businessActivity, setBusinessActivity] = useState('');
  const [revertedTransaction, setRevertedTransaction] = useState<Transaction | null>(null);


  useEffect(() => {
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }, [appointments]);
  
  useEffect(() => {
    localStorage.setItem('spendingCaps', JSON.stringify(spendingCaps));
  }, [spendingCaps]);
  
  useEffect(() => {
    localStorage.setItem('bankAccounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);
  
   useEffect(() => {
    localStorage.setItem('personalTransactions', JSON.stringify(personalTransactions));
  }, [personalTransactions]);

  useEffect(() => {
    localStorage.setItem('businessTransactions', JSON.stringify(businessTransactions));
  }, [businessTransactions]);


  // Derived state: Recalculate account balances whenever dependencies change
  const accountsWithCalculatedBalances = useMemo<BankAccount[]>(() => {
    const allTransactions = [...personalTransactions, ...businessTransactions];
    return bankAccounts.map(account => {
        const currentBalance = allTransactions
            .filter(t => t.accountId === account.id)
            .reduce((balance, t) => {
                return t.type === 'income' ? balance + t.amount : balance - t.amount;
            }, account.initialBalance);
        return { ...account, currentBalance };
    });
  }, [bankAccounts, personalTransactions, businessTransactions]);


  // Spending Cap Alert Effect
  useEffect(() => {
    const currentMonth = new Date().getMonth();

    // Reset notifications if the month has changed
    const updatedNotifiedCaps = { ...notifiedCaps };
    let didReset = false;
    for (const capId in updatedNotifiedCaps) {
        if (updatedNotifiedCaps[capId] !== currentMonth) {
            delete updatedNotifiedCaps[capId];
            didReset = true;
        }
    }
    if (didReset) {
        setNotifiedCaps(updatedNotifiedCaps);
    }
    
    const newAlerts: SpendingCapAlert[] = [];

    spendingCaps.forEach(cap => {
        if (notifiedCaps[cap.id] === currentMonth || activeAlerts.some(a => a.id === cap.id)) {
            return;
        }

        const transactions = cap.panel === 'personal' ? personalTransactions : businessTransactions;
        
        const relevantTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const isSameMonthYear = transactionDate.getMonth() === currentMonth &&
                                   transactionDate.getFullYear() === new Date().getFullYear();
            
            if (!isSameMonthYear || t.type !== 'expense') {
                return false;
            }
            if (cap.subCategory) {
                return t.category === cap.category && t.subCategory === cap.subCategory;
            }
            return t.category === cap.category;
        });

        const totalSpent = relevantTransactions.reduce((acc, t) => acc + t.amount, 0);

        if (cap.limit > 0 && (totalSpent / cap.limit) >= 0.9) {
            const categoryName = cap.subCategory ? `${cap.category} / ${cap.subCategory}` : cap.category;
            
            newAlerts.push({
                id: cap.id,
                message: `Atenção: Você atingiu 90% do seu teto de gastos para "${categoryName}".`
            });
            
            setNotifiedCaps(prev => ({ ...prev, [cap.id]: currentMonth }));
        }
    });

     if (newAlerts.length > 0) {
        setActiveAlerts(prev => [...prev, ...newAlerts]);
    }

  }, [personalTransactions, businessTransactions, spendingCaps, notifiedCaps, activeAlerts]);


  const handleLogin = (isNewUser: boolean = false) => {
    if (isNewUser) {
      // Clear local storage for a fresh start
      localStorage.removeItem('personalTransactions');
      localStorage.removeItem('businessTransactions');
      localStorage.removeItem('bankAccounts');
      localStorage.removeItem('appointments');
      localStorage.removeItem('spendingCaps');

      // Reset component state
      setPersonalTransactions([]);
      setBusinessTransactions([]);
      setBankAccounts([]);
      setAppointments([]);
      setSpendingCaps([]);
      setGoals([]);
      setNotifiedCaps({});
      setActiveAlerts([]);
      setBusinessActivity('');
    }
    setIsAuthenticated(true);
  };
  const handleLogout = () => setIsAuthenticated(false);

  const addAppointment = (appointment: Omit<Appointment, 'id'>) => {
    setAppointments(prev => [...prev, { ...appointment, id: crypto.randomUUID() }]
        .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    );
  };

  const deleteAppointment = (id: string) => {
      setAppointments(prev => prev.filter(app => app.id !== id));
  };
  
  const dismissAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'panel'>, installments?: { count: number }) => {
    const transactionsToAdd: Omit<Transaction, 'id'>[] = [];
    const setter = panel === 'personal' ? setPersonalTransactions : setBusinessTransactions;

    if (installments && installments.count > 1 && transaction.type === 'expense') {
        const totalAmount = transaction.amount;
        const installmentAmount = parseFloat((totalAmount / installments.count).toFixed(2));
        
        for (let i = 0; i < installments.count; i++) {
            const installmentDate = new Date(transaction.date);
            installmentDate.setUTCMonth(installmentDate.getUTCMonth() + i);
            const installmentDateString = installmentDate.toISOString().split('T')[0];
            
            transactionsToAdd.push({
                ...transaction,
                description: `${transaction.description} (${i + 1}/${installments.count})`,
                amount: installmentAmount,
                date: installmentDateString,
                panel: panel,
            });

            const reminder: Omit<Appointment, 'id'> = {
                title: `Pagar parcela: ${transaction.description}`,
                date: installmentDateString,
                time: '09:00',
                notes: `Parcela ${i + 1}/${installments.count}. Valor: ${installmentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                type: 'reminder'
            };
            addAppointment(reminder);
        }
    } else {
        transactionsToAdd.push({ ...transaction, panel: panel });
    }
    
    const newTransactionsWithIds = transactionsToAdd.map(t => ({...t, id: crypto.randomUUID()}));

    setter(prev => 
        [...newTransactionsWithIds, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    const setter = panel === 'personal' ? setPersonalTransactions : setBusinessTransactions;
    setter(prev => 
        prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    setEditingTransaction(null);
  };

  const handleRevertTransaction = (transactionToRevert: Transaction) => {
    setPersonalTransactions(prev => prev.filter(t => t.id !== transactionToRevert.id));
    setBusinessTransactions(prev => prev.filter(t => t.id !== transactionToRevert.id));
    setRevertedTransaction(transactionToRevert);
  };
  
  const clearRevertedTransaction = () => {
      setRevertedTransaction(null);
  };

  const handleUpdateCategories = (type: 'expense' | 'income', newCategories: Category) => {
      if (panel === 'personal') {
          if (type === 'expense') setPersonalExpenseCategories(newCategories);
          else setPersonalIncomeCategories(newCategories);
      } else {
          if (type === 'expense') setBusinessExpenseCategories(newCategories);
          else setBusinessIncomeCategories(newCategories);
      }
  };
  
  const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>) => {
    setGoals(prev => [...prev, { ...goal, id: crypto.randomUUID(), currentAmount: 0 }]);
  };

  const addContributionToGoal = (goalId: string, amount: number) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g));
  };
  
    const addOrUpdateSpendingCap = (panel: PanelType, category: string, limit: number, subCategory?: string) => {
        const id = `${panel}-${category}${subCategory ? `-${subCategory}` : ''}`;
        setSpendingCaps(prev => {
            const existingCapIndex = prev.findIndex(c => c.id === id);
            if (existingCapIndex > -1) {
                const updatedCaps = [...prev];
                updatedCaps[existingCapIndex] = { ...updatedCaps[existingCapIndex], limit };
                return updatedCaps;
            } else {
                return [...prev, { id, panel, category, subCategory, limit }];
            }
        });
    };

    const deleteSpendingCap = (id: string) => {
        setSpendingCaps(prev => prev.filter(c => c.id !== id));
    };

    const addBankAccount = (name: string, initialBalance: number) => {
        const newAccount = {
            id: crypto.randomUUID(),
            name,
            initialBalance,
            panel,
        };
        setBankAccounts(prev => [...prev, newAccount]);
    };

    const updateBankAccount = (id: string, name: string, initialBalance: number) => {
        setBankAccounts(prev => prev.map(acc => 
            acc.id === id ? { ...acc, name, initialBalance } : acc
        ));
    };

    const handleOpenStatementModal = (accountId: string) => {
        setViewingAccountStatementId(accountId);
    };
    const handleCloseStatementModal = () => {
        setViewingAccountStatementId(null);
    };


  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const currentTransactions = panel === 'personal' ? personalTransactions : businessTransactions;
  const currentBankAccounts = accountsWithCalculatedBalances.filter(acc => acc.panel === panel);
  const viewingAccountStatement = accountsWithCalculatedBalances.find(acc => acc.id === viewingAccountStatementId) || null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      <Header 
        activePanel={panel} 
        onPanelChange={setPanel} 
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        onLogout={handleLogout}
        onOpenAgenda={() => setIsAgendaOpen(true)}
        onOpenSpendingCapModal={() => setIsSpendingCapModalOpen(true)}
        onOpenAccountsModal={() => setIsAccountsModalOpen(true)}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {panel === 'personal' ? (
          <PersonalDashboard 
            transactions={personalTransactions} 
            addTransaction={addTransaction}
            expenseCategories={personalExpenseCategories}
            incomeCategories={personalIncomeCategories}
            onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
            onEditTransaction={setEditingTransaction}
            onRevertTransaction={handleRevertTransaction}
            revertedTransaction={revertedTransaction}
            clearRevertedTransaction={clearRevertedTransaction}
            activeAlerts={activeAlerts}
            dismissAlert={dismissAlert}
            bankAccounts={currentBankAccounts}
          />
        ) : (
          <BusinessDashboard 
            transactions={businessTransactions} 
            addTransaction={addTransaction}
            expenseCategories={businessExpenseCategories}
            incomeCategories={businessIncomeCategories}
            onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
            onEditTransaction={setEditingTransaction}
            onRevertTransaction={handleRevertTransaction}
            revertedTransaction={revertedTransaction}
            clearRevertedTransaction={clearRevertedTransaction}
            businessActivity={businessActivity}
            setBusinessActivity={setBusinessActivity}
            activeAlerts={activeAlerts}
            dismissAlert={dismissAlert}
            bankAccounts={currentBankAccounts}
          />
        )}
      </main>
      <ChatWidget personalTransactions={personalTransactions} businessTransactions={businessTransactions} />
      {isCategoryManagerOpen && (
        <CategoryManager
            isOpen={isCategoryManagerOpen}
            onClose={() => setIsCategoryManagerOpen(false)}
            panel={panel}
            expenseCategories={panel === 'personal' ? personalExpenseCategories : businessExpenseCategories}
            incomeCategories={panel === 'personal' ? personalIncomeCategories : businessIncomeCategories}
            onUpdateCategories={handleUpdateCategories}
        />
      )}
      {isAnalysisModalOpen && (
          <AnalysisModal
            isOpen={isAnalysisModalOpen}
            onClose={() => setIsAnalysisModalOpen(false)}
            transactions={currentTransactions}
            panel={panel}
            businessActivity={businessActivity}
            goals={goals}
            onAddGoal={addGoal}
            onAddContribution={addContributionToGoal}
          />
      )}
      {editingTransaction && (
        <EditTransactionModal
            isOpen={!!editingTransaction}
            onClose={() => setEditingTransaction(null)}
            transaction={editingTransaction}
            onSave={updateTransaction}
            expenseCategories={panel === 'personal' ? personalExpenseCategories : businessExpenseCategories}
            incomeCategories={panel === 'personal' ? personalIncomeCategories : businessIncomeCategories}
            bankAccounts={currentBankAccounts}
        />
      )}
      {isAgendaOpen && (
          <AgendaModal
            isOpen={isAgendaOpen}
            onClose={() => setIsAgendaOpen(false)}
            appointments={appointments}
            onAddAppointment={addAppointment}
            onDeleteAppointment={deleteAppointment}
          />
      )}
      {isSpendingCapModalOpen && (
        <SpendingCapModal
            isOpen={isSpendingCapModalOpen}
            onClose={() => setIsSpendingCapModalOpen(false)}
            panel={panel}
            transactions={currentTransactions}
            expenseCategories={panel === 'personal' ? personalExpenseCategories : businessExpenseCategories}
            spendingCaps={spendingCaps}
            onAddOrUpdate={addOrUpdateSpendingCap}
            onDelete={deleteSpendingCap}
        />
      )}
      {isAccountsModalOpen && (
        <AccountsModal
            isOpen={isAccountsModalOpen}
            onClose={() => setIsAccountsModalOpen(false)}
            panel={panel}
            accounts={currentBankAccounts}
            onAddAccount={addBankAccount}
            onUpdateAccount={updateBankAccount}
            onViewStatement={handleOpenStatementModal}
        />
      )}
      {viewingAccountStatement && (
        <BankStatementModal
          isOpen={!!viewingAccountStatement}
          onClose={handleCloseStatementModal}
          account={viewingAccountStatement}
          allTransactions={[...personalTransactions, ...businessTransactions]}
        />
      )}
    </div>
  );
};

export default App;