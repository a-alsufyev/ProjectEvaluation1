import React, { useState, useEffect } from 'react';
import { DataService } from '../lib/services/DataService';
import { ProjectModule, Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Edit2, Trash2, Database, Upload, Download, Loader2, Search, Filter, Package, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ModuleList() {
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'modules' | 'products'>('modules');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [m, p] = await Promise.all([
        DataService.getModules(),
        DataService.getProducts()
      ]);
      setModules(m || []);
      setProducts(p || []);
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
    : products.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, title: string } | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleAdd = async () => {
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
    } else {
      await DataService.createProduct({
        title: formData.title || 'Новый продукт',
        license_cost: Number(formData.licenseCost) || 0,
        description: formData.description || ''
      });
    }
    setShowAddModal(false);
    setFormData({});
    refreshData();
  };

  const refreshData = async () => {
    const [m, p] = await Promise.all([
      DataService.getModules(),
      DataService.getProducts()
    ]);
    setModules(m || []);
    setProducts(p || []);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    if (view === 'modules') {
      await DataService.deleteModule(itemToDelete.id);
    } else {
      await DataService.deleteProduct(itemToDelete.id);
    }
    
    setItemToDelete(null);
    refreshData();
  };

  return (
    <div className="space-y-8">
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
              <h2 className="text-2xl font-bold tracking-tight italic serif">Добавить {view === 'modules' ? 'модуль' : 'продукт'}</h2>
              
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

                {view === 'modules' ? (
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
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold opacity-40">Категория</label>
                      <input 
                        type="text" 
                        value={formData.category || ''}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-[#9932CC]/5 border border-[#9932CC]/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#9932CC]/20"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-40">Стоимость лицензии (₽)</label>
                    <input 
                      type="number" 
                      value={formData.licenseCost || ''}
                      onChange={(e) => setFormData({...formData, licenseCost: e.target.value})}
                      className="w-full bg-[#9932CC]/5 border border-[#9932CC]/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#9932CC]/20"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border-2 border-[#9932CC] text-[#9932CC] rounded-xl font-bold uppercase text-xs"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleAdd}
                  className="flex-1 py-3 bg-[#9932CC] text-white rounded-xl font-bold uppercase text-xs shadow-lg"
                >
                  Сохранить
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
              <span>Продукты (Лицензии)</span>
            </button>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter uppercase italic serif">
              {view === 'modules' ? 'База модулей' : 'Каталог продуктов'}
            </h1>
            <p className="text-sm opacity-60">
              {view === 'modules' ? 'Управление историческими данными об оценках' : 'Готовые решения для лицензионной поставки'}
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
              <th className="p-6 italic serif normal-case text-sm">{view === 'modules' ? 'Модуль / Проект' : 'Название продукта'}</th>
              <th className="p-6 text-center">{view === 'modules' ? 'Категория' : 'Тип'}</th>
              <th className="p-6">{view === 'modules' ? 'Разработка' : 'Лицензия'}</th>
              <th className="p-6">{view === 'modules' ? 'Внедрение' : 'Дата создания'}</th>
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
                      <span className="px-3 py-1 bg-[#9932CC]/10 text-[#9932CC] rounded-full text-[10px] font-bold uppercase">
                        {view === 'modules' && 'category' in item ? item.category : 'Лицензия'}
                      </span>
                    </td>
                    <td className="p-6 font-mono text-sm font-bold text-[#9932CC]">
                      {formatCurrency(view === 'modules' && 'development_cost' in item ? item.development_cost : (item as Product).license_cost)}
                    </td>
                    <td className="p-6 font-mono text-sm font-bold text-[#9932CC]/60 italic font-sans text-xs">
                       {view === 'modules' && 'integration_cost' in item 
                         ? formatCurrency(item.integration_cost) 
                         : new Date(item.created_at || Date.now()).toLocaleDateString()
                       }
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-2 hover:bg-[#9932CC] hover:text-white rounded-lg transition-all text-[#9932CC]"><Edit2 size={16} /></button>
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
