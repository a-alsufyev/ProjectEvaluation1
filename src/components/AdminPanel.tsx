import React, { useState, useEffect } from 'react';
import { DataService } from '../lib/services/DataService';
import { AuditLog } from '../types';
import { Shield, Clock, User, Info, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await DataService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-black pb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-black">
            <div className="p-2 bg-black text-white rounded-lg">
              <Shield size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tight uppercase italic serif">Администрирование</h1>
          </div>
          <p className="text-black/60 max-w-xl font-medium">
            Логирование действий пользователей и управление системными параметрами.
          </p>
        </div>

        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black/80 transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span>Обновить логи</span>
        </button>
      </div>

      <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-[12px_12px_0px_rgba(0,0,0,0.1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white uppercase text-[10px] font-black tracking-widest">
                <th className="p-6"><div className="flex items-center space-x-2"><Clock size={12} /><span>Время</span></div></th>
                <th className="p-6"><div className="flex items-center space-x-2"><User size={12} /><span>Пользователь</span></div></th>
                <th className="p-6"><div className="flex items-center space-x-2"><Shield size={12} /><span>Действие</span></div></th>
                <th className="p-6"><div className="flex items-center space-x-2"><Info size={12} /><span>Детали</span></div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Loader2 size={32} className="animate-spin mx-auto opacity-20" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-black/40 font-bold italic">
                    Логов пока нет
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={log.id} 
                    className="hover:bg-black/[0.02] transition-colors"
                  >
                    <td className="p-6 font-mono text-xs opacity-60">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">{log.user_email}</span>
                        <span className="text-[10px] opacity-40 uppercase font-bold">{log.user_id}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-block px-3 py-1 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-tight">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-6 text-sm italic font-medium opacity-70">
                      {log.details}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
