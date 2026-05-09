import React, { useState, useEffect } from 'react';
import { DataService } from '../lib/services/DataService';
import { Project, Estimate } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Folder, 
  Trash2, 
  Download, 
  Eye, 
  Loader2, 
  Calendar, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

interface ProjectListProps {
  onViewProject: (project: Project) => void;
  onNewProject: () => void;
}

const ProjectListItem: React.FC<{ 
  project: Project; 
  onDelete: (id: string) => void;
  onExport: (project: Project) => void;
  deletingId: string | null;
}> = ({ project, onDelete, onExport, deletingId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState(false);

  const toggleExpand = async () => {
    if (!isExpanded && estimates.length === 0) {
      setLoadingEstimates(true);
      const data = await DataService.getEstimatesByProject(project.id);
      setEstimates(data);
      setLoadingEstimates(false);
    }
    setIsExpanded(!isExpanded);
  };

  const totalWork = estimates
    .filter(e => e.type === 'module' || e.type === 'service')
    .reduce((acc, curr) => acc + (curr.development_cost || 0) + (curr.integration_cost || 0), 0);
  
  const totalLicense = estimates
    .filter(e => e.type === 'product')
    .reduce((acc, curr) => acc + (curr.license_cost || 0), 0);

  return (
    <motion.div
      layout
      className="bg-white border-2 border-black/5 rounded-3xl overflow-hidden hover:border-[#9932CC] transition-all group shadow-sm hover:shadow-xl"
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div 
              onClick={toggleExpand}
              className="w-14 h-14 bg-[#9932CC]/5 rounded-2xl flex items-center justify-center text-[#9932CC] group-hover:bg-[#9932CC] group-hover:text-white transition-all cursor-pointer"
            >
              <Folder size={28} />
            </div>
            <div className="space-y-1">
              <h3 
                onClick={toggleExpand}
                className="text-xl font-bold italic serif group-hover:text-[#9932CC] transition-all cursor-pointer"
              >
                {project.name}
              </h3>
              <div className="flex items-center space-x-3 text-[10px] uppercase font-bold tracking-wider opacity-40">
                <span className="flex items-center space-x-1">
                  <Calendar size={10} />
                  <span>{project.created_at ? new Date((project.created_at as any).toDate()).toLocaleDateString('ru-RU') : 'Недавно'}</span>
                </span>
                <span className="w-1 h-1 bg-black rounded-full" />
                <span>ID: {project.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onExport(project)}
              className="flex items-center space-x-2 px-4 py-3 bg-green-500/10 text-green-600 rounded-xl text-[10px] font-bold uppercase hover:bg-green-500 hover:text-white transition-all"
              title="Экспорт в Excel"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button 
              onClick={toggleExpand}
              className={cn(
                "p-3 rounded-xl transition-all",
                isExpanded ? "bg-[#9932CC] text-white" : "bg-[#9932CC]/5 text-[#9932CC] hover:bg-[#9932CC] hover:text-white"
              )}
              title="Развернуть"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <button 
              onClick={() => onDelete(project.id)}
              disabled={deletingId === project.id}
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
              title="Удалить"
            >
              {deletingId === project.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t-2 border-black/5 bg-[#9932CC]/5"
          >
            <div className="p-6 space-y-6">
              {loadingEstimates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-[#9932CC]" size={24} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold opacity-40 border-b border-[#9932CC]/10">
                          <th className="pb-2">Тип</th>
                          <th className="pb-2">Название</th>
                          <th className="pb-2 text-right">Стоимость (₽)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#9932CC]/5">
                        {estimates.map((est) => (
                          <tr key={est.id} className="text-sm">
                            <td className="py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                                est.type === 'module' ? "bg-blue-100 text-blue-600" : 
                                est.type === 'product' ? "bg-orange-100 text-orange-600" : 
                                "bg-purple-100 text-purple-600"
                              )}>
                                {est.type === 'module' ? 'Модуль' : est.type === 'product' ? 'Продукт' : 'Работа'}
                              </span>
                            </td>
                            <td className="py-3 font-medium text-black/80">{est.custom_title}</td>
                            <td className="py-3 text-right font-mono font-bold">
                              {est.type === 'product' 
                                ? formatCurrency(est.license_cost || 0)
                                : formatCurrency((est.development_cost || 0) + (est.integration_cost || 0))
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#9932CC]/10">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="opacity-40">Работы и модули:</span>
                        <span className="font-bold">{formatCurrency(totalWork)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="opacity-40">Тех. поддержка:</span>
                        <span className="font-bold text-[#9932CC]">{formatCurrency(project.technical_support_cost || 0)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="opacity-40">Продукты:</span>
                        <span className="font-bold">{formatCurrency(totalLicense)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="opacity-40">Лиц. поддержка:</span>
                        <span className="font-bold text-[#9932CC]">{formatCurrency(project.license_support_cost || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#9932CC]/20">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold opacity-40">Итоговая стоимость проекта</p>
                      <p className="text-3xl font-black italic serif text-[#9932CC]">
                        {formatCurrency(totalWork + totalLicense + (project.technical_support_cost || 0) + (project.license_support_cost || 0))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ProjectList: React.FC<ProjectListProps> = ({ onViewProject, onNewProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const data = await DataService.getProjects();
    setProjects(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот проект и все его оценки?')) {
      setDeletingId(id);
      await DataService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      setDeletingId(null);
    }
  };

  const handleExport = async (project: Project) => {
    const estimates = await DataService.getEstimatesByProject(project.id);
    
    const data: any[] = estimates.map(e => ({
      'Тип': e.type === 'module' ? 'Модуль' : e.type === 'product' ? 'Продукт' : 'Работа',
      'Название': e.custom_title,
      'Разработка (₽)': e.development_cost || 0,
      'Внедрение (₽)': e.integration_cost || 0,
      'Лицензия (₽)': e.license_cost || 0,
      'Комментарий': e.comment || ''
    }));

    // Add totals
    const totalDev = estimates.reduce((acc, curr) => acc + (curr.development_cost || 0), 0);
    const totalInt = estimates.reduce((acc, curr) => acc + (curr.integration_cost || 0), 0);
    const totalLic = estimates.reduce((acc, curr) => acc + (curr.license_cost || 0), 0);

    data.push({}); // Empty row
    data.push({
      'Название': 'ИТОГО ПО МОДУЛЯМ И РАБОТАМ',
      'Разработка (₽)': totalDev,
      'Внедрение (₽)': totalInt,
      'Тип': '', 'Лицензия (₽)': 0, 'Комментарий': ''
    });
    data.push({
      'Название': 'ИТОГО ПО ЛИЦЕНЗИЯМ',
      'Лицензия (₽)': totalLic,
      'Тип': '', 'Разработка (₽)': 0, 'Внедрение (₽)': 0, 'Комментарий': ''
    });
    
    data.push({
      'Название': 'ТЕХНИЧЕСКАЯ ПОДДЕРЖКА',
      'Разработка (₽)': project.technical_support_cost || ((totalDev + totalInt) * 0.1),
      'Тип': '', 'Внедрение (₽)': 0, 'Лицензия (₽)': 0, 'Комментарий': ''
    });
    data.push({
      'Название': 'ПОДДЕРЖКА ЛИЦЕНЗИЙ',
      'Лицензия (₽)': project.license_support_cost || (totalLic * 0.2),
      'Тип': '', 'Разработка (₽)': 0, 'Внедрение (₽)': 0, 'Комментарий': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Оценка');
    
    XLSX.writeFile(workbook, `${project.name}_Оценка.xlsx`);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-[#9932CC]" size={40} />
        <p className="text-[#9932CC] font-bold italic serif">Загрузка проектов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#9932CC] pb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-[#9932CC]">
            <Folder size={32} />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic serif">Мои Проекты</h1>
          </div>
          <p className="text-black/60 font-medium max-w-lg">
            Список всех созданных оценок и проектов с возможностью экспорта в Excel
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
            <input 
              type="text" 
              placeholder="Поиск проектов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-2 border-[#9932CC] rounded-2xl py-3 pl-12 pr-6 outline-none focus:ring-4 focus:ring-[#9932CC]/10 transition-all w-full md:w-64 font-medium"
            />
          </div>
          <button 
            onClick={onNewProject}
            className="flex items-center space-x-2 px-6 py-4 bg-[#9932CC] text-white rounded-2xl font-bold uppercase text-xs shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.1)] transition-all active:translate-y-0 active:shadow-none"
          >
            <Plus size={16} />
            <span>Новый проект</span>
          </button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-[#9932CC]/5 border-2 border-dashed border-[#9932CC]/20 rounded-3xl p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center text-[#9932CC] shadow-xl">
            <Folder size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold italic serif">Проекты не найдены</h3>
            <p className="text-black/40">Начните с создания вашего первого проекта</p>
          </div>
          <button 
            onClick={onNewProject}
            className="px-8 py-4 bg-[#9932CC] text-white rounded-2xl font-bold uppercase text-xs"
          >
            Создать проект
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredProjects.map((project, index) => (
              <ProjectListItem 
                key={project.id}
                project={project}
                onDelete={handleDelete}
                onExport={handleExport}
                deletingId={deletingId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
