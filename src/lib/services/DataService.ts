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
import { ProjectModule, Estimate, UserProfile, Project, Product } from '../../types';

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
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
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
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async deleteModule(id: string) {
    const path = `modules/${id}`;
    try {
      await deleteDoc(doc(db, 'modules', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async deleteProduct(id: string) {
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
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
