import React, { useState, useEffect } from 'react';
import { ProjectModule } from '../types';
import { DataService } from '../lib/services/DataService';
import { useAuth } from '../lib/contexts/AuthContext';
import { getCostRecommendation } from '../services/ai';
import { formatCurrency, cn } from '../lib/utils';
import { Save, X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface EstimateFormProps {
  baseModule: ProjectModule | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EstimateForm({ baseModule, onCancel, onSuccess }: EstimateFormProps) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [devCost, setDevCost] = useState(0);
  const [integrationCost, setIntegrationCost] = useState(0);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);

  useEffect(() => {
    if (baseModule) {
      setTitle(baseModule.title + ' (Копия)');
      setDevCost(baseModule.development_cost);
      setIntegrationCost(baseModule.integration_cost);
    }
  }, [baseModule]);

  const handleRecommend = async () => {
    if (!baseModule) return;
    setIsRecommending(true);
    const data = await getCostRecommendation(title, JSON.stringify(baseModule));
    setRecommendation(data);
    setIsRecommending(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseModule || !profile) return;

    setIsSaving(true);
    try {
      await DataService.createEstimate({
        type: 'module',
        base_module_id: baseModule.id,
        custom_title: title,
        development_cost: Number(devCost),
        integration_cost: Number(integrationCost),
        comment: comment,
        created_by: profile.id,
      });
      onSuccess();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!baseModule) {
    return (
      <div className="p-20 text-center space-y-6">
        <Sparkles size={48} className="mx-auto text-[#9932CC]/20" />
        <div className="space-y-2">
          <p className="text-xl font-bold serif">Выберите модуль для оценки</p>
          <p className="text-sm opacity-50">Вы можете найти модуль в поиске или выбрать из базы данных</p>
        </div>
        <button 
          onClick={onCancel}
          className="bg-[#9932CC] text-white px-8 py-3 rounded-xl font-bold uppercase transition-transform hover:scale-105 active:scale-95 shadow-lg"
        >
          Вернуться на панель
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between border-b-2 border-[#9932CC] pb-6">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest opacity-40">Создание оценки на базе:</p>
          <h1 className="text-4xl font-bold tracking-tighter serif">{baseModule.title}</h1>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-[#9932CC]/5 rounded-full transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#9932CC]">Название оценки</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white border-2 border-[#9932CC] rounded-xl p-4 font-medium focus:ring-4 focus:ring-[#9932CC]/5 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#9932CC]">Стоимость разработки (₽)</label>
                <input 
                  type="number" 
                  value={devCost}
                  onChange={(e) => setDevCost(Number(e.target.value))}
                  required
                  className="w-full bg-white border-2 border-[#9932CC] rounded-xl p-4 font-mono font-bold focus:ring-4 focus:ring-[#9932CC]/5 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#9932CC]">Стоимость внедрения (₽)</label>
                <input 
                  type="number" 
                  value={integrationCost}
                  onChange={(e) => setIntegrationCost(Number(e.target.value))}
                  required
                  className="w-full bg-white border-2 border-[#9932CC] rounded-xl p-4 font-mono font-bold focus:ring-4 focus:ring-[#9932CC]/5 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#9932CC]">Комментарий к оценке</label>
              <textarea 
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Опишите особенности проекта или причины изменения стоимости..."
                className="w-full bg-white border-2 border-[#9932CC] rounded-xl p-4 font-medium focus:ring-4 focus:ring-[#9932CC]/5 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#9932CC] text-white py-5 px-8 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#9932CC]/90 transition-all flex items-center justify-center space-x-3 shadow-[8px_8px_0px_rgba(153,50,204,0.15)] hover:shadow-[12px_12px_0px_rgba(153,50,204,0.15)] active:shadow-none"
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              <span>Сохранить оценку</span>
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="px-10 py-5 border-2 border-black rounded-2xl font-bold uppercase tracking-widest hover:bg-black/5 transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)]"
            >
              Отмена
            </button>
          </div>
        </form>

        <aside className="space-y-8">
          {/* AI Helper Card */}
          <div className="bg-[#9932CC] text-white rounded-3xl p-6 relative overflow-hidden group shadow-xl">
            <Sparkles className="absolute top-[-10px] right-[-10px] text-white opacity-20 group-hover:rotate-12 transition-transform duration-700" size={120} />
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold serif">AI Рекомендация</h3>
                <p className="text-xs opacity-80">ИИ анализирует исторические данные и предлагает оптимальный диапазон стоимости.</p>
              </div>

              {!recommendation ? (
                <button 
                  onClick={handleRecommend}
                  disabled={isRecommending}
                  className="w-full bg-white text-[#9932CC] p-4 rounded-xl font-bold uppercase flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isRecommending ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  <span>Получить совет</span>
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-4 border-t border-white/20"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[8px] uppercase opacity-60 font-bold">Min</p>
                      <p className="text-xs font-mono font-bold tracking-tighter">{formatCurrency(recommendation.min)}</p>
                    </div>
                    <div className="text-center border-x border-white/20">
                      <p className="text-[8px] uppercase opacity-60 font-bold">Avg</p>
                      <p className="text-xs font-mono font-bold tracking-tighter">{formatCurrency(recommendation.avg)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] uppercase opacity-60 font-bold">Max</p>
                      <p className="text-xs font-mono font-bold tracking-tighter">{formatCurrency(recommendation.max)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-90">{recommendation.explanation}</p>
                  <button 
                    onClick={() => {
                        setDevCost(recommendation.avg);
                        setRecommendation(null);
                    }}
                    className="w-full py-2 bg-white/10 border border-white/20 rounded-lg text-[10px] font-bold uppercase hover:bg-white/20 transition-colors"
                  >
                    Применить среднюю стоимость
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Historical Reference */}
          <div className="p-6 bg-white border border-[#9932CC]/20 rounded-3xl space-y-4 shadow-sm">
             <h3 className="text-xs font-bold uppercase tracking-widest border-b border-[#9932CC]/10 pb-2 text-[#9932CC]">История модуля</h3>
             <div className="space-y-3">
                <div className="flex justify-between text-xs">
                   <span className="opacity-40">Проект</span>
                   <span className="font-bold">{baseModule.source_project}</span>
                </div>
                <div className="flex justify-between text-xs">
                   <span className="opacity-40">Категория</span>
                   <span className="font-bold">{baseModule.category}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-[#141414]/5">
                   <span className="opacity-40">Дата оценки</span>
                   <span className="font-bold">{new Date(baseModule.created_at).toLocaleDateString()}</span>
                </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
