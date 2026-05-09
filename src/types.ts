export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface ProjectModule {
  id: string;
  title: string;
  description: string;
  development_cost: number;
  integration_cost: number;
  source_project: string;
  category: string;
  tags: string[];
  synonyms: string[];
  created_at: string;
  updated_at: string;
  embedding?: number[];
}

export interface Product {
  id: string;
  title: string;
  license_cost: number;
  description: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  status: 'draft' | 'finalized';
  license_support_cost?: number;
  technical_support_cost?: number;
}

export interface Estimate {
  id: string;
  project_id?: string;
  type: 'module' | 'product' | 'service';
  base_module_id?: string;
  base_product_id?: string;
  custom_title: string;
  development_cost?: number;
  integration_cost?: number;
  license_cost?: number;
  comment: string;
  created_by: string;
  created_at: string;
}

export interface SearchResult extends ProjectModule {
  relevance: number;
  matchType?: 'fuzzy' | 'semantic';
}
