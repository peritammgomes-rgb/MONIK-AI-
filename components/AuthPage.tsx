import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            Monik <span className="text-slate-500 dark:text-slate-400">AI</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Sua assistente financeira inteligente.</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              title="Ir para a tela de login"
              className={`w-1/2 py-3 text-sm font-semibold transition-colors ${activeTab === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setActiveTab('register')}
              title="Ir para a tela de cadastro"
              className={`w-1/2 py-3 text-sm font-semibold transition-colors ${activeTab === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <div className="space-y-4">
              {activeTab === 'register' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Nome</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
                <input
                  id="email"
                  type="email"
                  defaultValue="usuario@monikai.com"
                  className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Senha</label>
                <input
                  id="password"
                  type="password"
                  defaultValue="123456"
                  className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                title={activeTab === 'login' ? 'Acessar o painel' : 'Criar nova conta'}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 font-semibold"
              >
                {activeTab === 'login' ? 'Acessar Painel' : 'Criar Conta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;