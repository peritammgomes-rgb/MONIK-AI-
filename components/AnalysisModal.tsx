import React, { useState, useEffect } from 'react';
import { PanelType, Transaction, FinancialAnalysis, BusinessFinancialAnalysis, Goal } from '../types';
import { generateFinancialAnalysis } from '../services/geminiService';
import { XMarkIcon, ChartPieIcon, LightBulbIcon, FlagIcon } from './icons/Icons';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  panel: PanelType;
  businessActivity?: string;
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  onAddContribution: (goalId: string, amount: number) => void;
}

const CHART_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#d946ef', '#f97316', '#22c55e', '#0ea5e9'];

const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
    isOpen, 
    onClose, 
    transactions, 
    panel, 
    businessActivity,
    goals,
    onAddGoal,
    onAddContribution,
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'goals'>('analysis');
  const [analysis, setAnalysis] = useState<FinancialAnalysis | BusinessFinancialAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  // Goal Form State
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalContribution, setGoalContribution] = useState('');
  const [contributionAmount, setContributionAmount] = useState<{ [key: string]: string }>({});

  const fetchAnalysis = async () => {
    if (transactions.length > 0) {
      setIsLoading(true);
      setError(null);
      setAnalysis(null);

      const filteredTransactions = transactions.filter(t => {
        const tDate = t.date;
        return tDate >= startDate && tDate <= endDate;
      });

      if (filteredTransactions.length === 0) {
        setError("Nenhuma transação encontrada no período selecionado.");
        setIsLoading(false);
        return;
      }

      try {
        const result = await generateFinancialAnalysis(filteredTransactions, panel, businessActivity);
        
        // Add client-side calculation to ensure accuracy for personal panel
        if (panel === 'personal' && result) {
            const clientSideTotalIncome = filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            (result as FinancialAnalysis).totalIncome = clientSideTotalIncome;
        }
        
        setAnalysis(result);
      } catch (err) {
        setError('Não foi possível gerar a análise. Tente novamente mais tarde.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'analysis') {
        fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget);
    const contribution = parseFloat(goalContribution);

    if (goalName.trim() && !isNaN(target) && target > 0 && !isNaN(contribution) && contribution >= 0) {
        onAddGoal({
            name: goalName.trim(),
            targetAmount: target,
            monthlyContribution: contribution
        });
        setGoalName('');
        setGoalTarget('');
        setGoalContribution('');
    } else {
        alert("Por favor, preencha todos os campos com valores válidos. O valor alvo deve ser um número positivo.");
    }
  }
  
  const handleAddContribution = (goalId: string) => {
      const amount = parseFloat(contributionAmount[goalId] || '0');
      if (amount > 0) {
          onAddContribution(goalId, amount);
          setContributionAmount(prev => ({ ...prev, [goalId]: '' }));
      }
  }

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderAnalysisTab = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Analisando seus dados para o período...</p>
        </div>
      );
    }
    if (error) {
      return <p className="text-center text-red-500 py-10">{error}</p>;
    }
    if (analysis && panel === 'personal') {
        const data = analysis as FinancialAnalysis;
        const expensePercentage = data.totalIncome > 0 ? (data.totalExpense / data.totalIncome) * 100 : 0;
        const maxSpend = data.spendBySubCategory ? Math.max(...data.spendBySubCategory.map(d => d.value), 0) : 0;

        return (
           <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Resumo da IA</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 italic">"{data.summary}"</p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Resumo do Período</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-baseline">
                        <span className="text-slate-600 dark:text-slate-300">Total de Entradas:</span>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(data.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-slate-600 dark:text-slate-300">Total de Saídas:</span>
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(data.totalExpense)}</span>
                    </div>
                    {data.totalIncome > 0 && (
                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-600">
                            <span className="font-medium text-slate-500 dark:text-slate-400">Percentual da receita gasto:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{expensePercentage.toFixed(1)}%</span>
                        </div>
                    )}
                </div>
              </div>


              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Análise de Despesas por Subcategoria</h3>
                <div className="space-y-3">
                  {data.spendBySubCategory && data.spendBySubCategory.length > 0 ? data.spendBySubCategory.sort((a,b) => b.value - a.value).map((item, index) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {formatCurrency(item.value)}
                          {data.totalIncome > 0 && (
                            <span className="ml-2 text-xs opacity-75">
                              ({((item.value / data.totalIncome) * 100).toFixed(1)}% da renda)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                        <div
                          className="h-4 rounded-full"
                          style={{
                            width: `${maxSpend > 0 ? (item.value / maxSpend) * 100 : 0}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        ></div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma despesa encontrada neste período.</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2"><LightBulbIcon className="h-6 w-6 text-amber-500" /> Dicas da IA</h3>
                  <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-400">{data.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                </div>
                 <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2"><FlagIcon className="h-6 w-6 text-green-500" /> Metas Sugeridas</h3>
                  <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-400">{data.suggestedGoals.map((goal, i) => <li key={i}>{goal}</li>)}</ul>
                </div>
              </div>
            </div>
        )
    }
    if (analysis && panel === 'business') {
        const data = analysis as BusinessFinancialAnalysis;
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Demonstrativo de Resultados</h3>
                    <div className="mt-2 text-sm space-y-1 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">Receita Total</span> <span className="font-medium text-green-600">{formatCurrency(data.cashFlow.totalRevenue)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">(-) Custos Variáveis</span> <span className="font-medium text-red-600">{formatCurrency(data.cashFlow.totalVariableCosts)}</span></div>
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-1 mt-1"><span className="font-bold">(=) Margem de Contribuição</span> <span className="font-bold">{formatCurrency(data.cashFlow.contributionMargin)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">(-) Custos Fixos</span> <span className="font-medium text-red-600">{formatCurrency(data.cashFlow.totalFixedCosts)}</span></div>
                        <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-1 mt-1"><span className="font-bold">(=) Resultado Operacional</span> <span className="font-bold">{formatCurrency(data.cashFlow.operatingResult)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">(+) Entradas Não Operacionais</span> <span className="font-medium text-green-600">{formatCurrency(data.cashFlow.nonOperationalIncome)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-300">(-) Saídas Não Operacionais</span> <span className="font-medium text-red-600">{formatCurrency(data.cashFlow.nonOperationalExpenses)}</span></div>
                        <div className="flex justify-between border-t-2 border-slate-300 dark:border-slate-500 pt-1 mt-1"><span className="text-lg font-extrabold">(=) Resultado Líquido</span> <span className={`text-lg font-extrabold ${data.cashFlow.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.cashFlow.netResult)}</span></div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Indicadores Chave (KPIs)</h3>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">{data.kpis.map(kpi => (<div key={kpi.name} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg"><p className="font-bold text-slate-800 dark:text-slate-100">{kpi.name}: <span className="text-indigo-600 dark:text-indigo-400">{kpi.value}</span></p><p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.interpretation}</p></div>))}</div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Análise para seu Ramo de Atividade</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 italic">"{data.tailoredAnalysis}"</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2"><LightBulbIcon className="h-6 w-6 text-amber-500" /> Dicas da IA</h3>
                        <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-400">{data.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2"><FlagIcon className="h-6 w-6 text-green-500" /> Metas Sugeridas</h3>
                        <ul className="space-y-2 list-disc list-inside text-sm text-slate-600 dark:text-slate-400">{data.suggestedGoals.map((goal, i) => <li key={i}>{goal}</li>)}</ul>
                    </div>
                </div>
            </div>
        )
    }
    return <p className="text-center text-slate-500 dark:text-slate-400 py-10">Nenhuma análise disponível.</p>;
  };
  
  const renderGoalsTab = () => (
    <div className="space-y-6">
        <form onSubmit={handleAddGoal} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Adicionar Nova Meta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input type="text" placeholder="Nome da Meta (ex: Viagem)" value={goalName} onChange={e => setGoalName(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md text-sm" required />
                <input type="number" placeholder="Valor Alvo (R$)" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md text-sm" required />
                <input type="number" placeholder="Aporte Mensal (R$)" value={goalContribution} onChange={e => setGoalContribution(e.target.value)} className="w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md text-sm" required />
            </div>
            <button type="submit" title="Adicionar nova meta" className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">Adicionar Meta</button>
        </form>

        <div className="space-y-4">
            {goals.length > 0 ? goals.map(goal => {
                const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                return (
                    <div key={goal.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <p className="font-bold text-slate-800 dark:text-slate-100">{goal.name}</p>
                            <p className="text-sm font-mono">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-4 mt-2">
                           <div className="h-4 rounded-full bg-green-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        </div>
                        <div className="text-right text-sm font-semibold mt-1">{progress.toFixed(1)}%</div>
                        <div className="flex gap-2 mt-3 items-center flex-wrap">
                            <input type="number" placeholder="Valor do aporte manual" value={contributionAmount[goal.id] || ''} onChange={e => setContributionAmount(prev => ({ ...prev, [goal.id]: e.target.value }))} className="flex-grow bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm" />
                            <button onClick={() => handleAddContribution(goal.id)} title="Adicionar aporte à meta" className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-green-700">Adicionar Aporte</button>
                             {goal.monthlyContribution > 0 && (
                                <button 
                                    type="button"
                                    onClick={() => onAddContribution(goal.id, goal.monthlyContribution)} 
                                    title={`Adicionar aporte mensal de ${formatCurrency(goal.monthlyContribution)}`} 
                                    className="bg-indigo-500 text-white px-3 py-1.5 text-sm rounded-md hover:bg-indigo-600"
                                >
                                    Aportar Mensal ({formatCurrency(goal.monthlyContribution)})
                                </button>
                            )}
                        </div>
                    </div>
                )
            }) : <p className="text-center text-slate-500 dark:text-slate-400 py-4">Você ainda não tem nenhuma meta. Comece a planejar!</p>}
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ChartPieIcon className="h-6 w-6 text-indigo-500" />
            Análise Financeira & Metas
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" title="Fechar" aria-label="Fechar modal">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>
        
        <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex px-4">
                <button onClick={() => setActiveTab('analysis')} title="Ver Análise Financeira" className={`px-4 py-3 font-medium text-sm ${activeTab === 'analysis' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Análise</button>
                <button onClick={() => setActiveTab('goals')} title="Ver Planejador de Metas" className={`px-4 py-3 font-medium text-sm ${activeTab === 'goals' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Planejador de Metas</button>
            </nav>
        </div>

        {activeTab === 'analysis' && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
                <div className="flex-grow">
                    <label htmlFor="start-date" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data Início</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                 <div className="flex-grow">
                    <label htmlFor="end-date" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data Fim</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <button onClick={fetchAnalysis} disabled={isLoading} title="Analisar período selecionado" className="self-end px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isLoading ? 'Analisando...' : 'Analisar Período'}
                </button>
            </div>
        )}

        <main className="flex-grow p-6 overflow-y-auto">
            {activeTab === 'analysis' ? renderAnalysisTab() : renderGoalsTab()}
        </main>
      </div>
    </div>
  );
};

export default AnalysisModal;