import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ProjectModuleEntry {
  id: string;
  type: 'module' | 'product' | 'service';
  isNew: boolean;
  title: string;
  devCost?: number;
  integrationCost?: number;
  licenseCost?: number;
  comment: string;
  baseModuleId?: string;
  baseProductId?: string;
}

interface ProjectContextType {
  projectName: string;
  setProjectName: (name: string) => void;
  entries: ProjectModuleEntry[];
  setEntries: (entries: ProjectModuleEntry[]) => void;
  licenseSupport: number | null;
  setLicenseSupport: (val: number | null) => void;
  technicalSupport: number | null;
  setTechnicalSupport: (val: number | null) => void;
  clearDraft: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projectName, setProjectName] = useState(() => {
    return localStorage.getItem('pe_draft_name') || '';
  });
  
  const [entries, setEntries] = useState<ProjectModuleEntry[]>(() => {
    const saved = localStorage.getItem('pe_draft_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [licenseSupport, setLicenseSupport] = useState<number | null>(() => {
    const saved = localStorage.getItem('pe_draft_ls');
    return saved ? JSON.parse(saved) : null;
  });

  const [technicalSupport, setTechnicalSupport] = useState<number | null>(() => {
    const saved = localStorage.getItem('pe_draft_ts');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('pe_draft_name', projectName);
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem('pe_draft_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('pe_draft_ls', JSON.stringify(licenseSupport));
  }, [licenseSupport]);

  useEffect(() => {
    localStorage.setItem('pe_draft_ts', JSON.stringify(technicalSupport));
  }, [technicalSupport]);

  const clearDraft = () => {
    setProjectName('');
    setEntries([]);
    setLicenseSupport(null);
    setTechnicalSupport(null);
    localStorage.removeItem('pe_draft_name');
    localStorage.removeItem('pe_draft_entries');
    localStorage.removeItem('pe_draft_ls');
    localStorage.removeItem('pe_draft_ts');
  };

  return (
    <ProjectContext.Provider value={{ 
      projectName, 
      setProjectName, 
      entries, 
      setEntries, 
      licenseSupport, 
      setLicenseSupport, 
      technicalSupport, 
      setTechnicalSupport, 
      clearDraft 
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectDraft() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectDraft must be used within a ProjectProvider');
  }
  return context;
}
