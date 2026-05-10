import React, { useState, useEffect } from 'react';
import { DataService } from '../lib/services/DataService';
import { SpecialistRate } from '../types';
import { Plus, Trash2, Save, Loader2, DollarSign, Clock, Briefcase, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';

export const RatesManager: React.FC = () => {
  const [rates, setRates] = useState<SpecialistRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState({ role: '', hourly_rate: 0, daily_rate: 0 });

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await DataService.getRates();
      setRates(data);
    } catch (err) {
      console.error("Failed to fetch rates", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newRole.role) return;
    setSaving(true);
    try {
      await DataService.createRate(newRole);
      setNewRole({ role: '', hourly_rate: 0, daily_rate: 0 });
      await fetchRates();
    } catch (err) {
      console.error("Failed to create rate", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await DataService.deleteRate(id);
      setRates(prev => prev.filter(r => r.id !== id));
      setItemToDelete(null);
    } catch (err) {
      console.error("Failed to delete rate", err);
      alert("Не удалось удалить ставку. Проверьте права доступа.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    await DataService.updateRate(id, { [field]: value });
    setRates(rates.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-[#9932CC]" size={40} />
        <p className="text-[#9932CC] font-bold italic serif">Загрузка ставок...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
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
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-red-500 space-y-6"
            >
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold italic serif">Удалить ставку?</h3>
                <p className="text-black/60 text-sm">Это действие необратимо. Ставка будет удалена из базы данных.</p>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 border-2 border-black/5 rounded-xl font-bold uppercase text-[10px] hover:bg-black/5 transition-all"
                >
                  Отмена
                </button>
                <button 
                  onClick={() => itemToDelete && handleDelete(itemToDelete)}
                  disabled={saving}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold uppercase text-[10px] hover:bg-red-600 shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Удалить'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#9932CC] pb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-[#9932CC]">
            <DollarSign size={32} />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic serif">Ставки специалистов</h1>
          </div>
          <p className="text-black/60 font-medium max-w-lg">
            Управляйте ролями и стоимостью часа/дня разработки. Эти данные используются в конструкторе трудозатрат.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border-2 border-[#9932CC] rounded-3xl p-6 shadow-[8px_8px_0px_rgba(153,50,204,0.1)] space-y-6 sticky top-24">
            <h3 className="text-xl font-bold italic serif text-[#9932CC]">Новый специалист</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold opacity-40">Должность / Роль</label>
                <div className="flex items-center bg-[#9932CC]/5 rounded-xl px-4 py-3 border border-transparent focus-within:border-[#9932CC] transition-all">
                  <Briefcase className="text-[#9932CC] mr-3" size={18} />
                  <input 
                    type="text" 
                    value={newRole.role}
                    onChange={(e) => setNewRole({ ...newRole, role: e.target.value })}
                    placeholder="Напр. Backend-разработчик"
                    className="bg-transparent outline-none w-full font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold opacity-40">Ставка (час)</label>
                  <div className="flex items-center bg-[#9932CC]/5 rounded-xl px-4 py-3">
                    <Clock className="text-[#9932CC] mr-2" size={16} />
                    <input 
                      type="number" 
                      value={newRole.hourly_rate}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewRole({ ...newRole, hourly_rate: val, daily_rate: val * 8 });
                      }}
                      className="bg-transparent outline-none w-full font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold opacity-40">Ставка (день)</label>
                  <div className="flex items-center bg-[#9932CC]/5 rounded-xl px-4 py-3">
                    <Calendar className="text-[#9932CC] mr-2" size={16} />
                    <input 
                      type="number" 
                      value={newRole.daily_rate}
                      onChange={(e) => setNewRole({ ...newRole, daily_rate: Number(e.target.value) })}
                      className="bg-transparent outline-none w-full font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCreate}
                disabled={saving || !newRole.role}
                className="w-full py-4 bg-[#9932CC] text-white rounded-2xl font-bold uppercase text-xs shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Добавить ставку'}
              </button>
            </div>
          </div>
        </div>

        {/* Rates Table */}
        <div className="lg:col-span-2">
          <div className="bg-white border-2 border-black/5 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-6 text-[10px] uppercase tracking-widest font-black">Роль / Должность</th>
                  <th className="p-6 text-[10px] uppercase tracking-widest font-black text-center">Час</th>
                  <th className="p-6 text-[10px] uppercase tracking-widest font-black text-center">День (8ч)</th>
                  <th className="p-6 text-[10px] uppercase tracking-widest font-black text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-[#9932CC]/5 transition-colors group">
                    <td className="p-6">
                      <input 
                        type="text" 
                        defaultValue={rate.role}
                        onBlur={(e) => handleUpdate(rate.id, 'role', e.target.value)}
                        className="bg-transparent font-bold italic serif text-lg outline-none w-full text-[#9932CC] focus:ring-1 focus:ring-[#9932CC]/20 rounded px-1"
                      />
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center space-x-1 font-mono font-bold">
                        <input 
                          type="number" 
                          defaultValue={rate.hourly_rate}
                          onBlur={(e) => handleUpdate(rate.id, 'hourly_rate', Number(e.target.value))}
                          className="bg-transparent text-center outline-none w-20 focus:text-[#9932CC]"
                        />
                        <span className="opacity-40">₽</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center space-x-1 font-mono font-bold">
                        <input 
                          type="number" 
                          defaultValue={rate.daily_rate}
                          onBlur={(e) => handleUpdate(rate.id, 'daily_rate', Number(e.target.value))}
                          className="bg-transparent text-center outline-none w-20 focus:text-[#9932CC]"
                        />
                        <span className="opacity-40">₽</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => setItemToDelete(rate.id)}
                        className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
