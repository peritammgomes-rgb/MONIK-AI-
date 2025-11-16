export type PanelType = 'personal' | 'business';
export type TransactionType = 'income' | 'expense';

export interface BankAccount {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  panel: PanelType;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string;
  subCategory: string;
  accountId: string; // Link to BankAccount
  panel: PanelType;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: any[];
}

export interface Category {
  [key: string]: string[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface FinancialAnalysis {
  summary: string;
  totalIncome: number;
  totalExpense: number;
  spendBySubCategory: ChartDataPoint[];
  tips: string[];
  suggestedGoals: string[];
}

// Types for Business Analysis
export interface CashFlowData {
  totalRevenue: number;
  totalVariableCosts: number;
  contributionMargin: number;
  totalFixedCosts: number;
  operatingResult: number;
  nonOperationalIncome: number;
  nonOperationalExpenses: number;
  netResult: number;
}

export interface Kpi {
  name: string;
  value: string;
  interpretation: string;
}

export interface BusinessFinancialAnalysis {
  cashFlow: CashFlowData;
  kpis: Kpi[];
  tailoredAnalysis: string;
  tips: string[];
  suggestedGoals: string[];
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
}

export interface Appointment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes: string;
  type: 'reminder' | 'manual';
}

export interface SpendingCap {
  id: string; // panel-category or panel-category-subcategory
  panel: PanelType;
  category: string;
  subCategory?: string;
  limit: number;
}

export interface SpendingCapAlert {
  id: string; // Corresponds to SpendingCap id
  message: string;
}