import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AuditLog, ProjectModule, Estimate, UserProfile, Project, Product, SpecialistRate, Service } from '../../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const DataService = {
  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const path = 'audit_logs';
    try {
      const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  },

  async logAction(action: string, details: string) {
    if (!auth.currentUser) return;
    const path = 'audit_logs';
    try {
      await addDoc(collection(db, path), {
        user_id: auth.currentUser.uid,
        user_email: auth.currentUser.email,
        action,
        details,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
       console.error("Logging failed:", error);
    }
  },

  // Modules
  async getModules(): Promise<ProjectModule[]> {
    const path = 'modules';
    try {
      const q = query(collection(db, path), orderBy('title'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectModule));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  },

  async getModule(id: string): Promise<ProjectModule | null> {
    const path = `modules/${id}`;
    try {
      const docRef = doc(db, 'modules', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as ProjectModule;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
    return null;
  },

  async createModule(data: Omit<ProjectModule, 'id' | 'created_at' | 'updated_at'>) {
    const path = 'modules';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      await this.logAction('Создание модуля', `Название: ${data.title}`);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateModule(id: string, data: Partial<ProjectModule>) {
    const path = `modules/${id}`;
    try {
      await updateDoc(doc(db, 'modules', id), {
        ...data,
        updated_at: serverTimestamp(),
      });
      await this.logAction('Обновление модуля', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Estimates
  async getEstimates(): Promise<Estimate[]> {
    const path = 'estimates';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Estimate));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  },

  async createEstimate(data: Omit<Estimate, 'id' | 'created_at'>) {
    const path = 'estimates';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        created_at: serverTimestamp(),
      });
      await this.logAction('Создание оценки', `Проект ID: ${data.project_id}, Модулей: ${data.labor_details?.length || 0}`);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Projects
  async createProject(name: string, userId: string, licenseSupport?: number, technicalSupport?: number): Promise<string | undefined> {
    const path = 'projects';
    try {
      const docRef = await addDoc(collection(db, path), {
        name,
        created_by: userId,
        created_at: serverTimestamp(),
        status: 'draft',
        license_support_cost: licenseSupport || 0,
        technical_support_cost: technicalSupport || 0,
      });
      await this.logAction('Создание проекта', `Название: ${name}`);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const path = 'products';
    try {
      const q = query(collection(db, path), orderBy('title'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  },

  async createProduct(data: Omit<Product, 'id' | 'created_at'>) {
    const path = 'products';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        created_at: serverTimestamp(),
      });
      const newId = docRef.id;

      // Bidirectional sync: Add this ID to all related products
      if (data.related_product_ids && data.related_product_ids.length > 0) {
        for (const targetId of data.related_product_ids) {
          const tDoc = await getDoc(doc(db, 'products', targetId));
          if (tDoc.exists()) {
            const tData = tDoc.data() as Product;
            const tRelated = tData.related_product_ids || [];
            if (!tRelated.includes(newId)) {
              await updateDoc(doc(db, 'products', targetId), {
                related_product_ids: [...tRelated, newId]
              });
            }
          }
        }
      }

      await this.logAction('Создание продукта', `Название: ${data.title}`);
      return newId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const path = `products/${id}`;
    try {
      const productRef = doc(db, 'products', id);
      
      // Get old data if we're updating relationships
      let oldRelatedIds: string[] = [];
      if (data.related_product_ids !== undefined) {
        const snap = await getDoc(productRef);
        if (snap.exists()) {
          oldRelatedIds = (snap.data() as Product).related_product_ids || [];
        }
      }

      await updateDoc(productRef, data);

      // Bidirectional sync
      if (data.related_product_ids !== undefined) {
        const newRelatedIds = data.related_product_ids || [];
        
        const toAdd = newRelatedIds.filter(rid => !oldRelatedIds.includes(rid));
        const toRemove = oldRelatedIds.filter(rid => !newRelatedIds.includes(rid));

        // Add back-links
        for (const targetId of toAdd) {
          const tDoc = await getDoc(doc(db, 'products', targetId));
          if (tDoc.exists()) {
            const tData = tDoc.data() as Product;
            const tRelated = tData.related_product_ids || [];
            if (!tRelated.includes(id)) {
              await updateDoc(doc(db, 'products', targetId), {
                related_product_ids: [...tRelated, id]
              });
            }
          }
        }

        // Remove back-links
        for (const targetId of toRemove) {
          const tDoc = await getDoc(doc(db, 'products', targetId));
          if (tDoc.exists()) {
            const tData = tDoc.data() as Product;
            const tRelated = (tData.related_product_ids || []).filter(rid => rid !== id);
            await updateDoc(doc(db, 'products', targetId), {
              related_product_ids: tRelated
            });
          }
        }
      }

      await this.logAction('Обновление продукта', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Services
  async getServices(): Promise<Service[]> {
    const path = 'services';
    try {
      const q = query(collection(db, path), orderBy('title'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  },

  async createService(data: Omit<Service, 'id' | 'created_at'>) {
    const path = 'services';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        created_at: serverTimestamp(),
      });
      await this.logAction('Создание услуги', `Название: ${data.title}`);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateService(id: string, data: Partial<Service>) {
    const path = `services/${id}`;
    try {
      await updateDoc(doc(db, 'services', id), data);
      await this.logAction('Обновление услуги', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteService(id: string) {
    const path = `services/${id}`;
    try {
      await deleteDoc(doc(db, 'services', id));
      await this.logAction('Удаление услуги', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Rates
  async getRates(): Promise<SpecialistRate[]> {
    const path = 'rates';
    try {
      const q = query(collection(db, path), orderBy('role'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpecialistRate));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  },

  async createRate(data: Omit<SpecialistRate, 'id' | 'created_at'>) {
    const path = 'rates';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...data,
        created_at: serverTimestamp(),
      });
      await this.logAction('Создание ставки', `Роль: ${data.role}`);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateRate(id: string, data: Partial<SpecialistRate>) {
    const path = `rates/${id}`;
    try {
      await updateDoc(doc(db, 'rates', id), data);
      await this.logAction('Обновление ставки', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteRate(id: string) {
    const path = `rates/${id}`;
    try {
      await deleteDoc(doc(db, 'rates', id));
      await this.logAction('Удаление ставки', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async deleteModule(id: string) {
    const path = `modules/${id}`;
    try {
      await deleteDoc(doc(db, 'modules', id));
      await this.logAction('Удаление модуля', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async deleteProduct(id: string) {
    const path = `products/${id}`;
    try {
      // Bidirectional sync: Remove this ID from all related products
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        const relatedIds = (snap.data() as Product).related_product_ids || [];
        for (const targetId of relatedIds) {
          const tDoc = await getDoc(doc(db, 'products', targetId));
          if (tDoc.exists()) {
            const tData = tDoc.data() as Product;
            const tRelated = (tData.related_product_ids || []).filter(rid => rid !== id);
            await updateDoc(doc(db, 'products', targetId), {
              related_product_ids: tRelated
            });
          }
        }
      }

      await deleteDoc(doc(db, 'products', id));
      await this.logAction('Удаление продукта', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getProjects(): Promise<Project[]> {
    const path = 'projects';
    try {
      const q = query(collection(db, path), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  },

  async deleteProject(id: string) {
    const path = `projects/${id}`;
    try {
      // Also delete all associated estimates
      const estimatesPath = 'estimates';
      const q = query(collection(db, estimatesPath), where('project_id', '==', id));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, estimatesPath, d.id)));
      
      await Promise.all([
        deleteDoc(doc(db, 'projects', id)),
        ...deletePromises
      ]);
      await this.logAction('Удаление проекта', `ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getEstimatesByProject(projectId: string): Promise<Estimate[]> {
    const path = 'estimates';
    try {
      const q = query(collection(db, path), where('project_id', '==', projectId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Estimate));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  },

  // Real-time listener for modules
  subscribeToModules(callback: (modules: ProjectModule[]) => void) {
    const path = 'modules';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectModule));
        callback(modules);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, path)
    );
  }
};
