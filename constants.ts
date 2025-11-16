import { Transaction, Category } from './types';

export const PERSONAL_CATEGORIES: Category = {
  'Alimentação': ['Padaria', 'Mercado', 'Açougue', 'Feira', 'Restaurante'],
  'Moradia': ['Aluguel', 'Água', 'Luz', 'Telefone', 'Internet', 'Condomínio'],
  'Veículo': ['Combustível', 'Mecânico', 'Lava-car', 'IPVA', 'Seguro'],
  'Saúde': ['Farmácia', 'Médico', 'Plano de Saúde', 'Exames', 'Dentista'],
  'Lazer': ['Viagens', 'Clube', 'Cinema', 'Shows'],
  'Filhos': ['Escola', 'Roupas', 'Brinquedos', 'Mesada'],
  'Despesas Pessoais': ['Roupas', 'Cosméticos', 'Salão de Beleza', 'Academia'],
  'Investimentos': ['Ações', 'Fundos Imobiliários', 'Renda Fixa'],
};

export const PERSONAL_INCOME_CATEGORIES: Category = {
  'Rendimentos': ['Salário', 'Renda Extra', 'Vale Refeição', 'Dividendos', 'Vendas', 'Aluguel Recebido'],
};

export const BUSINESS_INCOME_CATEGORIES: Category = {
  'Receita de Vendas': ['Produto ou Serviço', 'Outros Produtos ou Serviços'],
  'Recebimento de Comissões': ['Comissão de Parceiros'],
  'Recebimento de Juros': ['Juros/Mora sobre Vendas'],
  'Entradas Não Operacionais': ['Empréstimos Obtidos', 'Capitalização dos Sócios', 'Venda de Equipamentos', 'Juros de Aplicações', 'Outras Entradas'],
};

export const BUSINESS_EXPENSE_CATEGORIES: Category = {
  'Custos Variáveis': ['Impostos (Simples, ISS, PIS/Cofins)', 'Matéria-prima', 'Mão de Obra Terceirizada', 'Comissão Interna', 'Comissão Externa', 'Taxas de Cartão/Boleto', 'Outros Custos Variáveis'],
  'Custos Fixos': ['Tarifas Bancárias', 'Aluguel de Maquininha', 'DOC/TED', 'Telefone e Internet', 'Celular', 'Energia Elétrica', 'Aluguel e Condomínio', 'Água', 'IPTU', 'Transporte e Combustível', 'Alimentação (Equipe)', 'Correios e Cartórios', 'Salários', 'Bolsa de Estágio', 'Benefícios (VT e VR)', 'Rescisão', 'FGTS', 'INSS/Sindicato', 'Pró-labore', 'Plano de Saúde', 'Contador', 'TI', 'Advogado', 'Manutenção de Equipamentos', 'Softwares e Assinaturas', 'Materiais de Escritório/Limpeza', 'Manutenção de Veículo', 'Outros Custos Fixos'],
  'Investimentos': ['Marketing (Papelaria, Site, Mídias)', 'Eventos', 'Compra de Equipamentos', 'Reformas e Estrutura', 'Mobiliário', 'Consultoria', 'Treinamentos', 'Outros Investimentos'],
  'Saídas Não Operacionais': ['Pagamento de Empréstimos', 'Juros Bancários/Atraso', 'Pagamento de Dívidas Anteriores', 'Distribuição de Lucros', 'Outras Saídas'],
};

// Renaming for consistency
export const BUSINESS_CATEGORIES = BUSINESS_EXPENSE_CATEGORIES;

export const mockPersonalTransactions: Transaction[] = [
  { id: '1', description: 'Salário Mensal', amount: 5000, date: '2023-10-05', type: 'income', category: 'Rendimentos', subCategory: 'Salário', accountId: 'mock-personal-account', panel: 'personal' },
  { id: '2', description: 'Supermercado do Mês', amount: 750, date: '2023-10-06', type: 'expense', category: 'Alimentação', subCategory: 'Mercado', accountId: 'mock-personal-account', panel: 'personal' },
  { id: '3', description: 'Conta de Luz', amount: 150, date: '2023-10-10', type: 'expense', category: 'Moradia', subCategory: 'Luz', accountId: 'mock-personal-account', panel: 'personal' },
  { id: '4', description: 'Jantar com amigos', amount: 120, date: '2023-10-12', type: 'expense', category: 'Lazer', subCategory: 'Restaurante', accountId: 'mock-personal-account', panel: 'personal' },
];

export const mockBusinessTransactions: Transaction[] = [
    { id: 'b1', description: 'Venda Consultoria de Marketing', amount: 2500, date: '2023-10-05', type: 'income', category: 'Receita de Vendas', subCategory: 'Produto ou Serviço', accountId: 'mock-business-account', panel: 'business' },
    { id: 'b2', description: 'Assinatura Software de Gestão', amount: 150, date: '2023-10-06', type: 'expense', category: 'Custos Fixos', subCategory: 'Softwares e Assinaturas', accountId: 'mock-business-account', panel: 'business' },
    { id: 'b3', description: 'Pagamento Pró-labore', amount: 3000, date: '2023-10-10', type: 'expense', category: 'Custos Fixos', subCategory: 'Pró-labore', accountId: 'mock-business-account', panel: 'business' },
];