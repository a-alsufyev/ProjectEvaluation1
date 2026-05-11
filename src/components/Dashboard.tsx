import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, History, Star, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { DataService } from '../lib/services/DataService';
import { ProjectModule, Estimate } from '../types';
import { motion } from 'motion/react';
import { analyzeSimilarity } from '../services/ai';

interface DashboardProps {
  onSearch: (query: string) => void;
  onSelectModule: (module: ProjectModule) => void;
}

export function Dashboard({ onSearch, onSelectModule }: DashboardProps) {
  const [recentEstimates, setRecentEstimates] = useState<Estimate[]>([]);
  const [popularModules, setPopularModules] = useState<ProjectModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProjectModule[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const estimates = await DataService.getEstimates();
      setRecentEstimates(estimates);
      
      const modules = await DataService.getModules();
      // Mock popularity by taking first few
      setPopularModules(modules.slice(0, 3));
    };
    fetchData();
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 2) {
      setIsSearching(true);
      const [modules, products] = await Promise.all([
        DataService.getModules(),
        DataService.getProducts()
      ]);
      
      const filteredModules = modules.filter(m => 
        m.title.toLowerCase().includes(value.toLowerCase()) || 
        m.tags.some(t => t.toLowerCase().includes(value.toLowerCase()))
      ).map(m => ({ ...m, type: 'module' as const }));

      const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(value.toLowerCase())
      ).map(p => ({ ...p, type: 'product' as const }));

      setSuggestions([...filteredModules, ...filteredProducts].slice(0, 5));
      setIsSearching(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) onSearch(searchQuery);
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Search Section */}
      <section className="text-center space-y-8 pt-12">
        <div className="space-y-2">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="text-[11px] uppercase tracking-[0.2em] font-medium"
          >
            Intellectual evaluation system
          </motion.p>
          <h1 className="text-6xl font-bold tracking-tighter leading-none italic serif">
            Найдите похожие<br/>модули
          </h1>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#9932CC]/30 group-focus-within:text-[#9932CC] transition-colors">
              <Search size={22} className={cn(isSearching && "animate-pulse")} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Начните вводить название модуля"
              className="w-full bg-white border-2 border-[#9932CC] rounded-2xl py-6 pl-14 pr-6 text-xl focus:outline-none focus:ring-4 focus:ring-[#9932CC]/5 transition-all shadow-[8px_8px_0px_rgba(153,50,204,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            />
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-4 bg-white border-2 border-[#9932CC] rounded-2xl overflow-hidden shadow-[8px_8px_0px_rgba(153,50,204,1)] z-50"
              >
                {suggestions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectModule(m as any)}
                    className="w-full p-4 flex items-center hover:bg-[#9932CC] hover:text-white transition-colors text-left group border-b border-[#9932CC]/10 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-bold">{m.title}</p>
                      <p className="text-xs opacity-60 italic">{'source_project' in m ? m.source_project : 'Готовый продукт'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{formatCurrency('license_cost' in m ? m.license_cost : (m.development_cost + m.integration_cost))}</p>
                      <p className="text-[10px] uppercase opacity-40">est. total</p>
                    </div>
                    <ArrowRight size={16} className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Grid Layout for content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
        {/* Recent Estimates */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#9932CC]/20 pb-4">
            <h2 className="flex items-center text-sm font-bold uppercase tracking-wider text-[#9932CC]">
              <History size={18} className="mr-2" /> Последние оценки
            </h2>
            <button className="text-xs font-medium hover:underline">Все история</button>
          </div>
          <div className="space-y-4">
            {recentEstimates.length > 0 ? (
              recentEstimates.map((e) => (
                <div key={e.id} className="p-4 bg-white border border-[#9932CC]/20 rounded-xl hover:shadow-lg transition-all cursor-pointer">
                  <p className="font-bold">{e.custom_title}</p>
                  <div className="flex justify-between mt-2 text-xs text-black/60">
                    <span className="font-mono">{formatCurrency(e.license_cost || ((e.development_cost || 0) + (e.integration_cost || 0)))}</span>
                    <span>{new Date(e.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#9932CC]/40 border-2 border-dashed border-[#9932CC]/20 rounded-2xl">
                Нет недавних оценок
              </div>
            )}
          </div>
        </div>

        {/* Popular Modules */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#9932CC]/20 pb-4">
            <h2 className="flex items-center text-sm font-bold uppercase tracking-wider text-[#9932CC]">
              <Star size={18} className="mr-2" /> Популярные модули
            </h2>
          </div>
          <div className="space-y-4">
            {popularModules.map((m) => (
              <div 
                key={m.id} 
                className="group relative p-4 bg-white border border-[#9932CC]/20 rounded-xl overflow-hidden cursor-pointer"
                onClick={() => onSelectModule(m)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold group-hover:underline">{m.title}</h3>
                  <div className="flex space-x-1">
                    {m.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-[#9932CC]/10 text-[#9932CC] rounded text-[10px] font-medium uppercase">{tag}</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-black/60 line-clamp-2 italic">{m.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">{m.source_project}</span>
                  <span className="text-sm font-mono font-bold text-[#9932CC]">{formatCurrency(m.development_cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for AnimatePresence
import { AnimatePresence } from 'motion/react';
