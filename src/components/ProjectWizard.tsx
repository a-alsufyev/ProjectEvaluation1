import React, { useState, useEffect } from 'react';
import { ProjectModule, Project, Estimate, Product } from '../types';
import { DataService } from '../lib/services/DataService';
import { useAuth } from '../lib/contexts/AuthContext';
import { useProjectDraft, ProjectModuleEntry } from '../lib/contexts/ProjectContext';
import { formatCurrency, cn } from '../lib/utils';
import { Search, Plus, Trash2, Save, Loader2, Sparkles, FolderPlus, ArrowRight, ChevronDown, ChevronUp, Package, Code, ShieldCheck, HeartPulse, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectWizardProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function ProjectWizard({ onCancel, onSuccess }: ProjectWizardProps) {
  const { profile } = useAuth();
  const { 
    projectName, setProjectName, 
    entries, setEntries, 
    licenseSupport, setLicenseSupport,
    technicalSupport, setTechnicalSupport,
    clearDraft 
  } = useProjectDraft();
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleSuggestions, setModuleSuggestions] = useState<ProjectModule[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      const [modules, products] = await Promise.all([
        DataService.getModules(),
        DataService.getProducts()
      ]);
      
      const filteredModules = modules.filter(m => 
        m.title.toLowerCase().includes(val.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(val.toLowerCase()))
      ).slice(0, 3);

      const filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 3);

      setModuleSuggestions(filteredModules);
      setProductSuggestions(filteredProducts);
    } else {
      setModuleSuggestions([]);
      setProductSuggestions([]);
    }
  };

  const addExistingModule = (module: ProjectModule) => {
    const newEntry: ProjectModuleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'module',
      isNew: false,
      title: module.title,
      devCost: module.development_cost,
      integrationCost: module.integration_cost,
      comment: '',
      baseModuleId: module.id
    };
    setEntries([newEntry, ...entries]);
    setSearchQuery('');
    setModuleSuggestions([]);
    setProductSuggestions([]);
  };

  const addExistingProduct = (product: Product) => {
    const newEntry: ProjectModuleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'product',
      isNew: false,
      title: product.title,
      licenseCost: product.license_cost,
      comment: '',
      baseProductId: product.id,
      selectedServiceIds: product.type === 'system' ? [] : undefined
    };
    setEntries([newEntry, ...entries]);
    setSearchQuery('');
    setModuleSuggestions([]);
    setProductSuggestions([]);
  };

  const addNewModule = () => {
    const newEntry: ProjectModuleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'module',
      isNew: true,
      title: 'Новый модуль',
      devCost: 0,
      integrationCost: 0,
      comment: ''
    };
    setEntries([newEntry, ...entries]);
  };

  const addNewProduct = () => {
    const newEntry: ProjectModuleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'product',
      isNew: true,
      title: 'Новый продукт (лицензия)',
      licenseCost: 0,
      comment: ''
    };
    setEntries([newEntry, ...entries]);
  };

  const addNewService = () => {
    const newEntry: ProjectModuleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'service',
      isNew: true,
      title: 'Новая работа (напр. Обследование)',
      devCost: 0,
      integrationCost: 0,
      comment: ''
    };
    setEntries([newEntry, ...entries]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<ProjectModuleEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !projectName || entries.length === 0) return;

    setIsSaving(true);
    try {
      // 1. Create Project with support costs
      const finalTS = technicalSupport !== null ? technicalSupport : entries.filter(e => e.type === 'module').reduce((acc, curr) => acc + (curr.devCost || 0) + (curr.integrationCost || 0), 0) * 0.1;
      const finalLS = licenseSupport !== null ? licenseSupport : entries.filter(e => e.type === 'product').reduce((acc, curr) => acc + (curr.licenseCost || 0), 0) * 0.1;

      const projectId = await DataService.createProject(projectName, profile.id, finalLS, finalTS);
      if (!projectId) throw new Error("Failed to create project");

      // 2. Process Entries
      for (const entry of entries) {
        if (entry.type === 'module') {
          let moduleId = entry.baseModuleId;
          if (entry.isNew || !moduleId) {
            moduleId = await DataService.createModule({
              title: entry.title,
              description: entry.comment || 'Добавлено при создании проекта ' + projectName,
              development_cost: entry.devCost || 0,
              integration_cost: entry.integrationCost || 0,
              source_project: projectName,
              category: 'General',
              tags: ['new-project'],
              synonyms: []
            });
          }

          if (moduleId) {
            await DataService.createEstimate({
              project_id: projectId,
              type: 'module',
              base_module_id: moduleId,
              custom_title: entry.title,
              development_cost: entry.devCost,
              integration_cost: entry.integrationCost,
              comment: entry.comment,
              created_by: profile.id
            });
          }
        } else if (entry.type === 'product') {
          let productId = entry.baseProductId;
          if (entry.isNew || !productId) {
            productId = await DataService.createProduct({
              title: entry.title,
              license_cost: entry.licenseCost || 0,
              description: entry.comment || 'Новый продукт в проекте ' + projectName
            });
          }

          if (productId) {
            await DataService.createEstimate({
              project_id: projectId,
              type: 'product',
              base_product_id: productId,
              custom_title: entry.title,
              license_cost: entry.licenseCost,
              comment: entry.comment,
              created_by: profile.id
            });

            // Add selected services as estimates
            if (entry.selectedServiceIds && entry.selectedServiceIds.length > 0) {
              for (const serviceId of entry.selectedServiceIds) {
                const serviceProduct = allProducts.find(p => p.id === serviceId);
                if (serviceProduct) {
                  await DataService.createEstimate({
                    project_id: projectId,
                    type: 'product',
                    base_product_id: serviceId,
                    custom_title: `${serviceProduct.title} (в составе ${entry.title})`,
                    license_cost: serviceProduct.license_cost,
                    comment: `Включено в состав системы ${entry.title}`,
                    created_by: profile.id
                  });
                }
              }
            }
          }
        } else if (entry.type === 'service') {
          // Services are project-specific, no historical data creation
          await DataService.createEstimate({
            project_id: projectId,
            type: 'service',
            custom_title: entry.title,
            development_cost: entry.devCost,
            integration_cost: entry.integrationCost,
            comment: entry.comment,
            created_by: profile.id
          });
        }
      }

      onSuccess();
      clearDraft();
    } catch (error) {
      console.error("Project save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    DataService.getProducts().then(setAllProducts);
  }, []);

  const workCost = entries.filter(e => e.type === 'module' || e.type === 'service').reduce((acc, curr) => acc + (curr.devCost || 0) + (curr.integrationCost || 0), 0);
  
  const productLicenseCost = entries.filter(e => e.type === 'product').reduce((acc, curr) => {
    let cost = curr.licenseCost || 0;
    
    // Add costs of selected services
    if (curr.selectedServiceIds && curr.selectedServiceIds.length > 0) {
      curr.selectedServiceIds.forEach(serviceId => {
        const service = allProducts.find(p => p.id === serviceId);
        if (service) {
          cost += service.license_cost;
        }
      });
    }
    
    return acc + cost;
  }, 0);
  
  const licenseCost = productLicenseCost;
  
  const currentTS = technicalSupport !== null ? technicalSupport : workCost * 0.1;
  const currentLS = licenseSupport !== null ? licenseSupport : licenseCost * 0.1;

  const totalCost = workCost + licenseCost + currentTS + currentLS;

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-12">
      <div className="flex items-center justify-between border-b-2 border-[#9932CC] pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#9932CC] text-white rounded-xl flex items-center justify-center">
            <FolderPlus size={24} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter uppercase italic serif">Новый проект</h1>
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Групповая оценка модулей</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-sm font-bold uppercase hover:underline text-[#9932CC]">Отмена</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          {/* Project Name */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest opacity-60">Название проекта</label>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Напр: Система лояльности 2.0"
              className="w-full bg-white border-2 border-[#9932CC] rounded-2xl p-6 text-2xl font-bold italic serif focus:ring-8 focus:ring-[#9932CC]/5 outline-none transition-all text-[#9932CC] placeholder:text-[#9932CC]/20"
            />
          </div>

          {/* Module Builder */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#9932CC]">Состав проекта ({entries.length})</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={addNewModule}
                  className="flex items-center space-x-2 px-4 py-2 border border-[#9932CC] text-[#9932CC] rounded-xl text-[10px] font-bold uppercase hover:bg-[#9932CC]/5 transition-all shadow-sm"
                >
                  <Code size={14} />
                  <span>Модуль</span>
                </button>
                <button 
                  onClick={addNewProduct}
                  className="flex items-center space-x-2 px-4 py-2 border border-[#9932CC] text-[#9932CC] rounded-xl text-[10px] font-bold uppercase hover:bg-[#9932CC]/5 transition-all shadow-sm"
                >
                  <Package size={14} />
                  <span>Продукт</span>
                </button>
                <button 
                  onClick={addNewService}
                  className="flex items-center space-x-2 px-4 py-2 border border-[#9932CC] text-[#9932CC] rounded-xl text-[10px] font-bold uppercase hover:bg-[#9932CC]/5 transition-all shadow-sm"
                >
                  <Briefcase size={14} />
                  <span>Работа</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#9932CC]/40">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Поиск существующих модулей или продуктов..."
                className="w-full bg-white border-2 border-[#9932CC] py-4 pl-12 pr-4 rounded-xl focus:ring-4 focus:ring-[#9932CC]/5 outline-none transition-all placeholder:text-[10px] placeholder:uppercase placeholder:font-bold placeholder:tracking-widest"
              />
              
              <AnimatePresence>
                {(moduleSuggestions.length > 0 || productSuggestions.length > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#9932CC] rounded-2xl overflow-hidden shadow-2xl z-50 divide-y divide-[#9932CC]/10"
                  >
                    {moduleSuggestions.map((m) => (
                      <button 
                        key={m.id}
                        onClick={() => addExistingModule(m)}
                        className="w-full p-4 flex items-center justify-between hover:bg-[#9932CC] hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Code size={16} className="opacity-40" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm">{m.title}</p>
                            <p className="text-[10px] opacity-60 uppercase">{m.source_project} — Модуль</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold">{formatCurrency(m.development_cost)}</span>
                      </button>
                    ))}
                    {productSuggestions.map((p) => (
                      <button 
                        key={p.id}
                        onClick={() => addExistingProduct(p)}
                        className="w-full p-4 flex items-center justify-between hover:bg-[#9932CC] hover:text-white transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Package size={16} className="opacity-40" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-sm">{p.title}</p>
                            <p className="text-[10px] opacity-60 uppercase">Готовый продукт</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold">{formatCurrency(p.license_cost)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {entries.map((entry, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={entry.id}
                    className="p-6 bg-white border-2 border-[#9932CC] rounded-2xl shadow-[4px_4px_0px_rgba(153,50,204,1)] space-y-4 relative"
                  >
                    <div className="absolute -left-3 top-6 bg-[#9932CC] text-white p-1 rounded-lg">
                      {entry.type === 'module' ? <Code size={12} /> : entry.type === 'product' ? <Package size={12} /> : <Briefcase size={12} />}
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <input 
                          type="text"
                          value={entry.title}
                          onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                          className="w-full bg-transparent border-b border-[#9932CC]/10 text-xl font-bold italic serif focus:border-[#9932CC] outline-none transition-all pb-2 text-[#9932CC]"
                          placeholder={entry.type === 'module' ? "Название модуля..." : entry.type === 'product' ? "Название продукта..." : "Название работы..."}
                        />
                        {entry.type === 'module' || entry.type === 'service' ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold opacity-40 tracking-wider">Разработка (₽)</label>
                              <input 
                                type="number"
                                value={entry.devCost}
                                onChange={(e) => updateEntry(entry.id, { devCost: Number(e.target.value) })}
                                className="w-full bg-[#9932CC]/5 rounded-lg p-3 font-mono font-bold text-sm focus:ring-2 focus:ring-[#9932CC]/10 text-[#9932CC] outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold opacity-40 tracking-wider">Внедрение (₽)</label>
                              <input 
                                type="number"
                                value={entry.integrationCost}
                                onChange={(e) => updateEntry(entry.id, { integrationCost: Number(e.target.value) })}
                                className="w-full bg-[#9932CC]/5 rounded-lg p-3 font-mono font-bold text-sm focus:ring-2 focus:ring-[#9932CC]/10 text-[#9932CC] outline-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold opacity-40 tracking-wider">Лицензия (₽)</label>
                              <input 
                                type="number"
                                value={entry.licenseCost}
                                onChange={(e) => updateEntry(entry.id, { licenseCost: Number(e.target.value) })}
                                className="w-full bg-[#9932CC]/5 rounded-lg p-3 font-mono font-bold text-sm focus:ring-2 focus:ring-[#9932CC]/10 text-[#9932CC] outline-none"
                              />
                            </div>

                            {entry.baseProductId && allProducts.find(p => p.id === entry.baseProductId)?.type === 'system' && (
                              <div className="space-y-4 p-4 bg-[#9932CC]/5 rounded-2xl border border-[#9932CC]/10">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] uppercase font-bold text-[#9932CC]">Входящие сервисы (модули)</label>
                                  <Sparkles size={14} className="text-[#9932CC]/40" />
                                </div>
                                <div className="space-y-2">
                                  {allProducts
                                    .filter(p => allProducts.find(sys => sys.id === entry.baseProductId)?.related_product_ids?.includes(p.id))
                                    .map(service => (
                                      <label key={service.id} className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                                        <div className="flex items-center space-x-3">
                                          <input 
                                            type="checkbox"
                                            checked={(entry.selectedServiceIds || []).includes(service.id)}
                                            onChange={(e) => {
                                              const currentIds = entry.selectedServiceIds || [];
                                              if (e.target.checked) {
                                                updateEntry(entry.id, { selectedServiceIds: [...currentIds, service.id] });
                                              } else {
                                                updateEntry(entry.id, { selectedServiceIds: currentIds.filter(id => id !== service.id) });
                                              }
                                            }}
                                            className="w-4 h-4 rounded border-[#9932CC] text-[#9932CC] focus:ring-[#9932CC]"
                                          />
                                          <span className="text-sm font-medium group-hover:text-[#9932CC]">{service.title}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold opacity-60">+{formatCurrency(service.license_cost)}</span>
                                      </label>
                                    ))
                                  }
                                  {allProducts.filter(p => allProducts.find(sys => sys.id === entry.baseProductId)?.related_product_ids?.includes(p.id)).length === 0 && (
                                    <p className="text-[10px] italic opacity-40">Нет связанных сервисов</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => removeEntry(entry.id)}
                        className="ml-4 p-2 text-black/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {entries.length === 0 && (
                <div className="p-20 text-center border-2 border-dashed border-[#9932CC]/20 rounded-2xl space-y-4">
                  <Plus className="mx-auto text-[#9932CC]/20" size={40} />
                  <p className="text-sm font-bold opacity-40 uppercase tracking-widest text-[#9932CC]">Добавьте модули для начала оценки</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="sticky top-8 space-y-8">
            {/* Summary Card */}
            <div className="bg-black text-white rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000 text-[#9932CC]">
                <Sparkles size={80} />
              </div>
              <div className="space-y-2 relative z-10 text-white">
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40">Total Evaluation</p>
                <div className="flex items-baseline space-x-2">
                  <h3 className="text-4xl font-mono font-bold tracking-tighter text-[#9932CC]">{formatCurrency(totalCost)}</h3>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-[10px] border-b border-white/10 pb-2">
                  <span className="opacity-40 uppercase font-bold">Заказная разработка</span>
                  <span className="font-mono font-bold">{formatCurrency(workCost)}</span>
                </div>
                <div className="flex justify-between text-[10px] border-b border-white/10 pb-2">
                  <span className="opacity-40 uppercase font-bold">Лицензии продуктов</span>
                  <span className="font-mono font-bold">{formatCurrency(licenseCost)}</span>
                </div>
                
                {/* Tech Support */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="opacity-60 flex items-center"><HeartPulse size={10} className="mr-1" /> Тех. поддержка</span>
                    <div className="flex items-center bg-white/10 rounded-lg px-2 py-1">
                      <input 
                        type="number"
                        value={Math.round(currentTS)}
                        onChange={(e) => setTechnicalSupport(Number(e.target.value))}
                        className="bg-transparent border-none outline-none text-right font-mono font-bold text-[#9932CC] w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="ml-1 opacity-40">₽</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={workCost * 0.5} 
                    step={1000}
                    value={currentTS}
                    onChange={(e) => setTechnicalSupport(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#9932CC]"
                  />
                </div>

                {/* License Support */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="opacity-60 flex items-center"><ShieldCheck size={10} className="mr-1" /> Лиц. поддержка</span>
                    <div className="flex items-center bg-white/10 rounded-lg px-2 py-1">
                      <input 
                        type="number"
                        value={Math.round(currentLS)}
                        onChange={(e) => setLicenseSupport(Number(e.target.value))}
                        className="bg-transparent border-none outline-none text-right font-mono font-bold text-[#9932CC] w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="ml-1 opacity-40">₽</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={licenseCost * 0.5} 
                    step={1000}
                    value={currentLS}
                    onChange={(e) => setLicenseSupport(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#9932CC]"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving || !projectName || entries.length === 0}
                className="w-full bg-[#9932CC] text-white py-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center space-x-3 hover:translate-y-[-2px] hover:shadow-xl transition-all disabled:opacity-20 active:translate-y-0"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                <span>Создать проект</span>
              </button>
            </div>

            <div className="p-6 bg-white border border-[#9932CC]/20 rounded-3xl space-y-4 italic text-xs leading-relaxed text-black/60 shadow-sm">
               Все новые модули будут автоматически сохранены в базу данных как исторические данные проекта <span className="font-bold text-[#9932CC] underline underline-offset-2">{projectName || "..."}</span>. Это позволит использовать их для будущих оценок.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
