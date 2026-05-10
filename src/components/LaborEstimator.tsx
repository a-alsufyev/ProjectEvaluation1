import React, { useState, useEffect } from 'react';
import { DataService } from '../lib/services/DataService';
import { SpecialistRate, LaborDetail } from '../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  Search, 
  Briefcase, 
  Code,
  Calculator,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

export const LaborEstimator: React.FC = () => {
  const [rates, setRates] = useState<SpecialistRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'module' | 'service'>('module');
  const [selectedLabor, setSelectedLabor] = useState<LaborDetail[]>([]);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    const data = await DataService.getRates();
    setRates(data);
    setLoading(false);
  };

  const addSpecialist = (rate: SpecialistRate) => {
    if (selectedLabor.find(l => l.roleId === rate.id)) return;
    
    setSelectedLabor([...selectedLabor, {
      roleId: rate.id,
      roleName: rate.role,
      days: 1,
      ratePerDay: rate.daily_rate,
      total: rate.daily_rate
    }]);
  };

  const updateLabor = (roleId: string, days: number) => {
    setSelectedLabor(selectedLabor.map(l => {
      if (l.roleId === roleId) {
        return { ...l, days, total: days * l.ratePerDay };
      }
      return l;
    }));
  };

  const removeLabor = (roleId: string) => {
    setSelectedLabor(selectedLabor.filter(l => l.roleId !== roleId));
  };

  const totalCost = selectedLabor.reduce((acc, curr) => acc + curr.total, 0);

  const handleSave = async () => {
    if (!title || selectedLabor.length === 0) return;
    setSaving(true);

    const commonData = {
      title,
      description,
      development_cost: totalCost,
      integration_cost: 0,
      labor_details: selectedLabor
    };

    if (type === 'module') {
      await DataService.createModule({
        ...commonData,
        source_project: 'Внутренняя разработка',
        category: 'Пользовательский',
        tags: [],
        synonyms: []
      });
    } else {
      await DataService.createService(commonData);
    }

    // Reset
    setTitle('');
    setDescription('');
    setSelectedLabor([]);
    setSaving(false);
    alert('Успешно сохранено в базу данных!');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-[#9932CC]" size={40} />
        <p className="text-[#9932CC] font-bold italic serif">Загрузка конструктора...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#9932CC] pb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-[#9932CC]">
            <Calculator size={32} />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic serif">Конструктор оценки</h1>
          </div>
          <p className="text-black/60 font-medium max-w-lg">
            Создавайте новые модули или типовые работы на основе трудозатрат специалистов.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Form and Selection */}
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white border-2 border-black/5 rounded-3xl p-8 shadow-sm space-y-8">
            <div className="space-y-6">
              <div className="flex space-x-4">
                <button 
                  onClick={() => setType('module')}
                  className={cn(
                    "flex-1 py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 font-bold uppercase text-xs transition-all",
                    type === 'module' 
                      ? "bg-[#9932CC] text-white shadow-lg" 
                      : "bg-[#9932CC]/5 text-[#9932CC] hover:bg-[#9932CC]/10"
                  )}
                >
                  <Code size={16} />
                  <span>Новый Модуль</span>
                </button>
                <button 
                  onClick={() => setType('service')}
                  className={cn(
                    "flex-1 py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 font-bold uppercase text-xs transition-all",
                    type === 'service' 
                      ? "bg-[#9932CC] text-white shadow-lg" 
                      : "bg-[#9932CC]/5 text-[#9932CC] hover:bg-[#9932CC]/10"
                  )}
                >
                  <Briefcase size={16} />
                  <span>Типовая Работа</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold opacity-40">Название {type === 'module' ? 'модуля' : 'работы'}</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название..."
                  className="w-full bg-transparent border-b-2 border-black/5 pb-4 text-3xl font-bold italic serif outline-none focus:border-[#9932CC] transition-all text-[#9932CC]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold opacity-40">Краткое описание</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Что входит в эту оценку..."
                  className="w-full bg-[#9932CC]/5 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#9932CC] min-h-[100px] font-medium"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-black/5 pb-4">
                <h3 className="text-xl font-bold italic serif">Состав команды и время</h3>
                <span className="text-[10px] uppercase font-bold opacity-40">Трудозатраты в днях</span>
              </div>

              {selectedLabor.length === 0 ? (
                <div className="py-12 text-center bg-[#9932CC]/5 rounded-3xl border-2 border-dashed border-[#9932CC]/20 space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center text-[#9932CC] shadow-md">
                    <TrendingUp size={32} />
                  </div>
                  <p className="text-black/40 font-medium">Выберите специалистов справа, чтобы начать оценку</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {selectedLabor.map((labor) => (
                      <motion.div 
                        key={labor.roleId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border-2 border-black/5 rounded-2xl group hover:border-[#9932CC] transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-[#9932CC]/5 text-[#9932CC] rounded-xl flex items-center justify-center">
                            <Clock size={20} />
                          </div>
                          <p className="font-bold text-[#9932CC] italic serif text-lg">{labor.roleName}</p>
                        </div>

                        <div className="flex items-center space-x-8 mt-4 md:mt-0">
                          <div className="flex items-center space-x-3">
                            <input 
                              type="number" 
                              value={labor.days}
                              onChange={(e) => updateLabor(labor.roleId, Number(e.target.value))}
                              min="0.5"
                              step="0.5"
                              className="w-16 bg-[#9932CC]/5 rounded-lg py-2 px-3 text-center font-mono font-bold outline-none focus:ring-2 focus:ring-[#9932CC]"
                            />
                            <span className="text-[10px] uppercase font-bold opacity-40">дней</span>
                          </div>
                          
                          <div className="text-right min-w-[120px]">
                            <p className="text-[8px] uppercase font-bold opacity-40">Стоимость</p>
                            <p className="font-mono font-bold text-lg">{formatCurrency(labor.total)}</p>
                          </div>

                          <button 
                            onClick={() => removeLabor(labor.roleId)}
                            className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Specialist Selection and Total */}
        <div className="xl:col-span-4 space-y-8">
          {/* Total Summary */}
          <div className="bg-black text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">
              <Calculator size={180} />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Общая оценка разработки</p>
                <p className="text-5xl font-black tracking-tighter italic serif">{formatCurrency(totalCost)}</p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between text-lg font-bold text-[#9932CC]">
                  <span>ИТОГО:</span>
                  <span className="text-white">{formatCurrency(totalCost)}</span>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving || !title || selectedLabor.length === 0}
                className="w-full py-5 bg-[#9932CC] text-white rounded-2xl font-black uppercase text-sm shadow-[0_8px_30px_rgb(153,50,204,0.4)] hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:scale-100"
              >
                {saving ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    <span>Сохранить в базу</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Specialist Selection List */}
          <div className="bg-white border-2 border-black/5 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold italic serif flex items-center text-[#9932CC]">
              <Plus size={20} className="mr-2" /> Добавить специалиста
            </h3>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {rates.length === 0 ? (
                <div className="p-4 text-center text-black/40 text-sm">
                  Нет доступных ставок. Сначала настройте их в разделе "Ставки".
                </div>
              ) : (
                rates.map((rate) => (
                  <button 
                    key={rate.id}
                    onClick={() => addSpecialist(rate)}
                    disabled={!!selectedLabor.find(l => l.roleId === rate.id)}
                    className="w-full p-4 flex items-center justify-between bg-[#9932CC]/5 rounded-2xl hover:bg-[#9932CC] hover:text-white transition-all text-left group disabled:opacity-30 disabled:hover:bg-[#9932CC]/5 disabled:hover:text-black"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm tracking-tight">{rate.role}</p>
                      <p className="text-[8px] uppercase font-black opacity-40 group-hover:opacity-100">{formatCurrency(rate.daily_rate)} / день</p>
                    </div>
                    <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
