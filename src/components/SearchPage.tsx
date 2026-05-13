import React, { useState, useEffect } from 'react';
import { ProjectModule, SearchResult } from '../types';
import { DataService } from '../lib/services/DataService';
import { getEmbedding, analyzeSimilarity } from '../services/ai';
import { formatCurrency, cn } from '../lib/utils';
import { Search, Filter, Loader2, ArrowUpRight, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchPageProps {
  initialQuery?: string;
  onSelectModule: (module: ProjectModule) => void;
}

export function SearchPage({ initialQuery = '', onSelectModule }: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMethod, setSearchMethod] = useState<'hybrid' | 'semantic'>('hybrid');

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery) return;
    setIsSearching(true);
    
    try {
      const allModules = await DataService.getModules();
      
      // 1. Semantic search if requested
      let relevantIds: string[] = [];
      if (searchMethod === 'semantic' || searchMethod === 'hybrid') {
        relevantIds = await analyzeSimilarity(searchQuery, allModules);
      }

      // 2. Combine with text search
      const combinedResults: SearchResult[] = allModules.map(m => {
        let relevance = 0;
        let matchType: 'fuzzy' | 'semantic' | undefined = undefined;

        if (relevantIds.includes(m.id)) {
          relevance = 0.9;
          matchType = 'semantic';
        }

        const titleMatch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
        const tagMatch = m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (titleMatch || tagMatch) {
          relevance = Math.max(relevance, titleMatch ? 1.0 : 0.8);
          matchType = matchType || 'fuzzy';
        }

        return { ...m, relevance, matchType };
      })
      .filter(m => m.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);

      setResults(combinedResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery) performSearch(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-end justify-between border-b-2 border-[#9932CC] pb-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tighter uppercase serif">Результаты поиска</h1>
          <p className="text-sm opacity-60">Найдено {results.length} модулей для "{query}"</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white border border-[#9932CC]/20 p-1 rounded-xl">
          <button 
            onClick={() => setSearchMethod('hybrid')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
              searchMethod === 'hybrid' ? "bg-[#9932CC] text-white" : "hover:bg-[#9932CC]/5 text-[#9932CC]"
            )}
          >
            Hybrid
          </button>
          <button 
            onClick={() => setSearchMethod('semantic')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
              searchMethod === 'semantic' ? "bg-[#9932CC] text-white" : "hover:bg-[#9932CC]/5 text-[#9932CC]"
            )}
          >
            Semantic (AI)
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#9932CC]/40">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Уточните запрос..."
            className="w-full bg-white border-2 border-[#9932CC] rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-[#9932CC]/5 transition-all shadow-[4px_4px_0px_rgba(153,50,204,1)]"
          />
        </div>
        <button 
          disabled={isSearching}
          className="bg-[#9932CC] text-white px-8 rounded-xl font-bold uppercase hover:bg-[#9932CC]/90 transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]"
        >
          {isSearching ? <Loader2 className="animate-spin" /> : <span>Поиск</span>}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {results.map((module) => (
            <motion.div
              key={module.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onClick={() => onSelectModule(module)}
              className="group bg-white border-2 border-[#9932CC] rounded-2xl p-6 hover:shadow-[12px_12px_0px_rgba(153,50,204,1)] transition-all cursor-pointer relative overflow-hidden"
            >
              {module.matchType === 'semantic' && (
                <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 flex items-center space-x-1 rounded-bl-xl">
                  <Cpu size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Matched by AI</span>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                       <h3 className="text-2xl font-bold group-hover:underline group-hover:text-[#9932CC] serif transition-colors">{module.title}</h3>
                       <ArrowUpRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9932CC]" />
                    </div>
                    <p className="text-xs uppercase tracking-widest font-bold text-black/40">{module.source_project} — {module.category}</p>
                  </div>
                  
                  <p className="text-sm line-clamp-3 text-black/80 leading-relaxed font-medium">{module.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {module.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-[#9932CC]/5 border border-[#9932CC]/10 text-[#9932CC] rounded-full text-[10px] font-bold uppercase">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="md:w-64 space-y-4">
                   <div className="p-4 bg-[#9932CC]/5 rounded-xl space-y-4">
                      <div className="space-y-1 border-b border-[#9932CC]/10 pb-3">
                        <p className="text-[10px] uppercase font-bold opacity-40">Dev Cost</p>
                        <p className="text-xl font-mono font-bold tracking-tighter text-[#9932CC]">{formatCurrency(module.development_cost)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold opacity-40">Integration Cost</p>
                        <p className="text-xl font-mono font-bold tracking-tighter text-[#9932CC]">{formatCurrency(module.integration_cost)}</p>
                      </div>
                      <div className="pt-2 border-t-2 border-[#9932CC]">
                        <p className="text-[10px] uppercase font-bold text-[#9932CC]">Historical Total</p>
                        <p className="text-2xl font-mono font-bold tracking-tighter text-[#9932CC]">{formatCurrency(module.development_cost + module.integration_cost)}</p>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {results.length === 0 && !isSearching && (
          <div className="p-20 text-center space-y-4 border-4 border-dashed border-[#9932CC]/10 rounded-3xl">
            <Search size={48} className="mx-auto text-[#9932CC]/20" />
            <div className="space-y-1">
              <p className="text-xl font-bold">Ничего не найдено</p>
              <p className="text-sm opacity-50">Попробуйте изменить запрос или использовать семантический поиск</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
