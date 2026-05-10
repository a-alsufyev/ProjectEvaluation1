import React, { useState, useEffect } from 'react';
import { DataService } from '../lib/services/DataService';
import { ProjectModule, Product, Service, LaborDetail } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Edit2, Trash2, Database, Upload, Download, Loader2, Search, Filter, Package, Code, Briefcase, ChevronRight, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ModuleList() {
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [view, setView] = useState<'modules' | 'products' | 'services'>('modules');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedLaborDetails, setSelectedLaborDetails] = useState<{title: string, labor: LaborDetail[]} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [m, p, s] = await Promise.all([
        DataService.getModules(),
        DataService.getProducts(),
        DataService.getServices()
      ]);
      setModules(m || []);
      setProducts(p || []);
      setServices(s || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const seedData = async () => {
    setIsSeeding(true);
    const moduleExamples = [
      {
        title: "Модуль поиска синонимов",
        description: "Интеллектуальный поиск терминов с учетом лингвистической близости и словаря синонимов.",
        development_cost: 0,
        integration_cost: 200000,
        source_project: "Продукт X",
        category: "Поиск",
        tags: ["nlp", "search", "synonyms"],
        synonyms: ["поисковый движок", "семантический поиск"]
      },
      {
        title: "Модуль распознавания лиц (V3)",
        description: "Высокоточное распознавание лиц в реальном времени с поддержкой маскировки.",
        development_cost: 5000000,
        integration_cost: 500000,
        source_project: "Проект Безопасность",
        category: "ИИ",
        tags: ["ai", "vision", "security"],
        synonyms: ["face processing", "biometrics"]
      }
    ];

    const productExamples = [
      {
        title: "CRM Core Engine",
        license_cost: 2500000,
        description: "Базовое ядро CRM системы с поддержкой мультитенантности и гибких рабочих процессов."
      },
      {
        title: "Analytics Suite Pro",
        license_cost: 1200000,
        description: "Комплексная система аналитики с визуализацией данных в реальном времени."
      },
      {
        title: "Security Gate Enterprise",
        license_cost: 800000,
        description: "Программный комплекс для обеспечения безопасности сетевых соединений."
      }
    ];

    for (const ex of moduleExamples) {
      await DataService.createModule(ex);
    }
    for (const ex of productExamples) {
      await DataService.createProduct(ex);
    }
    
    const [m, p] = await Promise.all([
      DataService.getModules(),
      DataService.getProducts()
    ]);
    setModules(m || []);
    setProducts(p || []);
    setIsSeeding(false);
  };

  const filteredItems = view === 'modules' 
    ? modules.filter(m => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.source_project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : view === 'products'
    ? products.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : services.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, title: string } | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    if (view === 'modules') {
      setFormData({
        title: item.title,
        description: item.description,
        devCost: item.development_cost,
        integrationCost: item.integration_cost,
        category: item.category
      });
    } else if (view === 'products') {
      setFormData({
        title: item.title,
        description: item.description,
        licenseCost: item.license_cost
      });
    } else {
      setFormData({
        title: item.title,
        description: item.description,
        devCost: item.development_cost,
        integrationCost: item.integration_cost
      });
    }
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (editingId) {
      if (view === 'modules') {
        await DataService.updateModule(editingId, {
          title: formData.title,
          description: formData.description,
          development_cost: Number(formData.devCost),
          integration_cost: Number(formData.integrationCost),
          category: formData.category
        });
      } else if (view === 'products') {
        await DataService.updateProduct(editingId, {
          title: formData.title,
          license_cost: Number(formData.licenseCost),
          description: formData.description
        });
      } else {
        await DataService.updateService(editingId, {
          title: formData.title,
          development_cost: Number(formData.devCost),
          integration_cost: Number(formData.integrationCost),
          description: formData.description
        });
      }
    } else {
      if (view === 'modules') {
        await DataService.createModule({
          title: formData.title || 'Новый модуль',
          description: formData.description || '',
          development_cost: Number(formData.devCost) || 0,
          integration_cost: Number(formData.integrationCost) || 0,
          source_project: 'Manual Entry',
          category: formData.category || 'General',
          tags: [],
          synonyms: []
        });
      } else if (view === 'products') {
        await DataService.createProduct({
          title: formData.title || 'Новый продукт',
          license_cost: Number(formData.licenseCost) || 0,
          description: formData.description || ''
        });
      } else {
        await DataService.createService({
          title: formData.title || 'Новая работа',
          development_cost: Number(formData.devCost) || 0,
          integration_cost: Number(formData.integrationCost) || 0,
          description: formData.description || ''
        });
      }
    }
    setShowAddModal(false);
    setEditingId(null);
    setFormData({});
    refreshData();
  };

  const refreshData = async () => {
    const [m, p, s] = await Promise.all([
      DataService.getModules(),
      DataService.getProducts(),
      DataService.getServices()
    ]);
    setModules(m || []);
    setProducts(p || []);
    setServices(s || []);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    if (view === 'modules') {
      await DataService.deleteModule(itemToDelete.id);
    } else if (view === 'products') {
      await DataService.deleteProduct(itemToDelete.id);
    } else {
      await DataService.deleteService(itemToDelete.id);
    }
    
    setItemToDelete(null);
    refreshData();
  };

  return (
    <div className="space-y-8">
      {/* Labor Details Modal */}
      <AnimatePresence>
        {selectedLaborDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border-2 border-[#9932CC] space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-xl font-bold italic serif text-[#9932CC]">{selectedLaborDetails.title}</h3>
                <button onClick={() => setSelectedLaborDetails(null)} className="p-2 hover:bg-[#9932CC]/10 rounded-lg">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold opacity-40">Детализация трудозатрат</p>
                <div className="space-y-2">
                  {selectedLaborDetails.labor.map((l, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#9932CC]/5 rounded-xl border border-[#9932CC]/10">
                      <div className="flex items-center space-x-3">
                        <User size={16} className="text-[#9932CC]" />
                        <span className="font-bold">{l.roleName}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{l.days}дн. × {formatCurrency(l.ratePerDay)}</p>
                        <p className="font-mono font-bold text-[#9932CC]">{formatCurrency(l.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-red-500 space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                  <Trash2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight">Удалить {view === 'modules' ? 'модуль' : 'продукт'}?</h3>
                  <p className="text-sm text-black/60 italic font-medium">
                    "{itemToDelete.title}" будет безвозвратно удален из базы данных.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 border-2 border-black/10 text-black/60 rounded-xl font-bold uppercase text-xs hover:bg-black/5 transition-all"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-red-600 transition-all"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-[#9932CC] space-y-6"
            >
              <h2 className="text-2xl font-bold tracking-tight italic serif">
                {editingId ? 'Редактировать' : 'Добавить'} {view === 'modules' ? 'модуль' : view === 'products' ? 'продукт' : 'работу'}
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold opacity-40">Название</label>
                  <input 
                    type="text" 
                    value={formData.title || ''}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-[#9932CC]/5 border border-[#9932CC]/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#9932CC]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold opacity-40">Описание</label>
                  <textarea 
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-[#9932CC]/5 border border-[#9932CC]/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#9932CC]/20 min-h-[80px]"
                  />
                </div>

                {view === 'products' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-40">Стоимость лицензии (₽)</label>
                    <input 
                      type="number" 
                      value={formData.licenseCost || ''}
                      onChange={(e) => setFormData({...formData, licenseCost: e.target.value})}
                      className="w-full bg-[#9932CC]/5 border border-[#9932CC]/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#9932CC]/20"
                    />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold opacity-40">Разработка (₽)</label>
                        <input 
                          type="number" 
                          value={formData.devCost || ''}
                          onChange={(e) => setFormData({...formData, devCost: e.target.value})}
                          className="w-full bg-[#9932CC]/5 border border-[#9932CC]/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#9932CC]/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold opacity-40">Внедрение (₽)</label>
                        <input 
                          type="number" 
                          value={formData.integrationCost || ''}
                          onChange={(e) => setFormData({...formData, integrationCost: e.target.value})}
                          className="w-full bg-[#9932CC]/5 border border-[#9932CC]/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#9932CC]/20"
                        />
                      </div>
                    </div>
                    {view === 'modules' && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold opacity-40">Категория</label>
                        <input 
                          type="text" 
                          value={formData.category || ''}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full bg-[#9932CC]/5 border border-[#9932CC]/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#9932CC]/20"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                    setFormData({});
                  }}
                  className="flex-1 py-3 border-2 border-[#9932CC] text-[#9932CC] rounded-xl font-bold uppercase text-xs"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-[#9932CC] text-white rounded-xl font-bold uppercase text-xs shadow-lg"
                >
                  {editingId ? 'Обновить' : 'Сохранить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#9932CC] pb-6">
        <div className="space-y-4 text-black">
          <div className="flex items-center space-x-2 bg-[#9932CC]/5 p-1 rounded-xl w-fit border border-[#9932CC]/10">
            <button 
              onClick={() => setView('modules')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                view === 'modules' ? "bg-[#9932CC] text-white shadow-lg" : "hover:bg-[#9932CC]/10 text-[#9932CC]"
              )}
            >
              <Code size={14} />
              <span>Модули</span>
            </button>
            <button 
              onClick={() => setView('products')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                view === 'products' ? "bg-[#9932CC] text-white shadow-lg" : "hover:bg-[#9932CC]/10 text-[#9932CC]"
              )}
            >
              <Package size={14} />
              <span>Продукт (Лиц)</span>
            </button>
            <button 
              onClick={() => setView('services')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                view === 'services' ? "bg-[#9932CC] text-white shadow-lg" : "hover:bg-[#9932CC]/10 text-[#9932CC]"
              )}
            >
              <Briefcase size={14} />
              <span>Работы</span>
            </button>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter uppercase italic serif">
              {view === 'modules' ? 'База модулей' : view === 'products' ? 'Каталог продуктов' : 'Типовые работы'}
            </h1>
            <p className="text-sm opacity-60">
              {view === 'modules' ? 'Управление историческими данными об оценках' : view === 'products' ? 'Готовые решения для лицензионной поставки' : 'База типовых услуг и процессов'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-[#9932CC]">
          <button 
            disabled={isSeeding}
            onClick={seedData} 
            className="flex items-center space-x-2 px-4 py-2 border-2 border-[#9932CC] rounded-xl text-xs font-bold uppercase hover:bg-[#9932CC]/5 transition-all disabled:opacity-50"
          >
            {isSeeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            <span>Заполнить демо-данными</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#9932CC] text-white rounded-xl text-xs font-bold uppercase hover:bg-[#9932CC]/90 transition-all shadow-md"
          >
            <Plus size={14} />
            <span>Добавить {view === 'modules' ? 'модуль' : 'продукт'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9932CC]/30" size={18} />
            <input 
              type="text" 
              placeholder="Поиск по названию или тегам..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-[#9932CC]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9932CC]/5"
            />
         </div>
         <div className="flex space-x-2">
            <button className="px-4 border border-[#9932CC]/20 rounded-xl flex items-center space-x-2 hover:bg-[#9932CC]/5 transition-all text-[#9932CC]">
               <Upload size={18} />
               <span className="text-sm font-medium">Импорт</span>
            </button>
            <button className="px-4 border border-[#9932CC]/20 rounded-xl flex items-center space-x-2 hover:bg-[#9932CC]/5 transition-all text-[#9932CC]">
               <Download size={18} />
               <span className="text-sm font-medium">Экспорт</span>
            </button>
         </div>
      </div>

      <div className="bg-white border-2 border-[#9932CC] rounded-2xl overflow-hidden shadow-[8px_8px_0px_rgba(153,50,204,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#9932CC] text-white uppercase text-[10px] tracking-widest font-bold">
              <th className="p-6 italic serif normal-case text-sm">
                {view === 'modules' ? 'Модуль / Проект' : view === 'products' ? 'Название продукта' : 'Название работы'}
              </th>
              <th className="p-6 text-center">{view === 'modules' ? 'Категория' : view === 'products' ? 'Тип' : 'Трудозатраты'}</th>
              <th className="p-6">{view === 'products' ? 'Лицензия' : 'Разработка'}</th>
              <th className="p-6">{view === 'products' ? 'Дата создания' : 'Внедрение'}</th>
              <th className="p-6 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#9932CC]/10">
            <AnimatePresence>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#9932CC]/20" size={32} />
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={item.id} 
                    className="hover:bg-[#9932CC]/5 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="space-y-1">
                        <p className="font-bold underline decoration-transparent group-hover:decoration-[#9932CC] group-hover:text-[#9932CC] transition-all decoration-2 underline-offset-4">{item.title}</p>
                        {view === 'modules' && 'source_project' in item && (
                           <p className="text-[10px] uppercase font-bold opacity-40">{item.source_project}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {view === 'products' ? (
                        <span className="px-3 py-1 bg-[#9932CC]/10 text-[#9932CC] rounded-full text-[10px] font-bold uppercase">Лицензия</span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="px-3 py-1 bg-[#9932CC]/10 text-[#9932CC] rounded-full text-[10px] font-bold uppercase mb-1">
                            {view === 'modules' && 'category' in item ? item.category : 'Работа'}
                          </span>
                          {(item as any).labor_details && (
                            <button 
                              onClick={() => setSelectedLaborDetails({ title: item.title, labor: (item as any).labor_details })}
                              className="flex items-center text-[8px] font-black hover:text-black transition-colors"
                            >
                              <Filter size={8} className="mr-1" />
                              ДЕТАЛИ
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-6 font-mono text-sm font-bold text-[#9932CC]">
                      {formatCurrency(view === 'products' ? (item as Product).license_cost : (item as any).development_cost)}
                    </td>
                    <td className="p-6 font-mono text-sm font-bold text-[#9932CC]/60 italic font-sans text-xs">
                       {view !== 'products' && 'integration_cost' in item 
                         ? formatCurrency((item as any).integration_cost) 
                         : new Date(item.created_at || Date.now()).toLocaleDateString()
                       }
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-[#9932CC] hover:text-white rounded-lg transition-all text-[#9932CC]"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setItemToDelete({ id: item.id, title: item.title })}
                          className="p-2 hover:bg-black hover:text-white rounded-lg transition-all text-[#9932CC]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-20 text-center space-y-4">
                    <Database size={48} className="mx-auto text-[#9932CC]/10" />
                    <p className="text-sm font-bold opacity-40 italic text-[#9932CC]">Данные не найдены</p>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
