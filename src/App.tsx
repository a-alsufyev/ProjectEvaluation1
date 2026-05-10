import React, { useState } from 'react';
import { AuthProvider, useAuth } from './lib/contexts/AuthContext';
import { ProjectProvider } from './lib/contexts/ProjectContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SearchPage } from './components/SearchPage';
import { EstimateForm } from './components/EstimateForm';
import { ProjectWizard } from './components/ProjectWizard';
import { ModuleList } from './components/ModuleList';
import { ProjectList } from './components/ProjectList';
import { RatesManager } from './components/RatesManager';
import { LaborEstimator } from './components/LaborEstimator';
import { ProjectModule, Project } from './types';
import { Loader2, LogIn } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signIn, signInGuest } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedModule, setSelectedModule] = useState<ProjectModule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#9932CC]" size={48} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white p-6 font-sans">
        <div className="max-w-md w-full space-y-12 text-center">
          <div className="space-y-4">
             <div className="w-20 h-20 bg-[#9932CC] rounded-3xl mx-auto flex items-center justify-center rotate-3 shadow-xl">
               <span className="text-white text-3xl font-bold italic serif">PE</span>
             </div>
             <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter uppercase italic serif">System Intelligence</h1>
                <p className="text-black/60 font-medium">Ускоренная оценка проектных модулей на основе ИИ и исторических данных</p>
             </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={signIn}
              className="w-full bg-[#9932CC] text-white py-5 px-8 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#9932CC]/90 transition-all flex items-center justify-center space-x-3 shadow-[8px_8px_0px_rgba(153,50,204,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              <LogIn size={20} />
              <span>Войти с Google</span>
            </button>

            <button 
              onClick={signInGuest}
              className="w-full bg-white border-2 border-[#9932CC] text-[#9932CC] py-5 px-8 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#9932CC]/5 transition-all flex items-center justify-center space-x-3 shadow-[8px_8px_0px_rgba(153,50,204,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              <Loader2 size={20} />
              <span>Войти как гость (Demo)</span>
            </button>
          </div>

          <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30">
            For internal use only
          </p>
        </div>
      </div>
    );
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('search');
  };

  const handleSelectModule = (module: ProjectModule) => {
    setSelectedModule(module);
    setActiveTab('estimate');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onSearch={handleSearch} onSelectModule={handleSelectModule} />;
      case 'search':
        return <SearchPage initialQuery={searchQuery} onSelectModule={handleSelectModule} />;
      case 'new':
        return (
          <ProjectWizard 
            onCancel={() => setActiveTab('dashboard')} 
            onSuccess={() => setActiveTab('projects')}
          />
        );
      case 'estimate':
        return (
          <EstimateForm 
            baseModule={selectedModule} 
            onCancel={() => {
              setSelectedModule(null);
              setActiveTab('dashboard');
            }} 
            onSuccess={() => setActiveTab('dashboard')}
          />
        );
      case 'modules':
        return <ModuleList />;
      case 'projects':
        return (
          <ProjectList 
            onViewProject={(p) => console.log('View project', p)} 
            onNewProject={() => setActiveTab('new')} 
          />
        );
      case 'rates':
        return <RatesManager />;
      case 'estimator':
        return <LaborEstimator />;
      default:
        return <Dashboard onSearch={handleSearch} onSelectModule={handleSelectModule} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </AuthProvider>
  );
}
