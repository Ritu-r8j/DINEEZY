import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { CustomCategoryMapping, CustomCategory } from '@/lib/categoryData';

export interface CategoryMappings {
  [defaultCategoryId: string]: CustomCategoryMapping;
}

export interface RestaurantCategories {
  mappings: CategoryMappings;
  customCategories: CustomCategory[];
}

// Get category mappings for a restaurant
export const getCategoryMappings = async (adminId: string) => {
  try {
    const docRef = doc(db, 'restaurants', adminId, 'settings', 'categoryMappings');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        success: true,
        data: data.mappings as CategoryMappings || {},
        customCategories: data.customCategories as CustomCategory[] || []
      };
    }

    return { success: true, data: {}, customCategories: [] };
  } catch (error: any) {
    console.error('Error fetching category mappings:', error);
    return { success: false, error: error.message, data: {}, customCategories: [] };
  }
};

// Save/Update category mappings
export const saveCategoryMappings = async (
  adminId: string,
  mappings: CategoryMappings
) => {
  try {
    const docRef = doc(db, 'restaurants', adminId, 'settings', 'categoryMappings');
    
    await setDoc(docRef, {
      mappings,
      updatedAt: new Date()
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('Error saving category mappings:', error);
    return { success: false, error: error.message };
  }
};

// Add or update a single category mapping
export const updateCategoryMapping = async (
  adminId: string,
  defaultCategoryId: string,
  customName: string,
  isActive: boolean = true
) => {
  try {
    const result = await getCategoryMappings(adminId);
    const mappings: CategoryMappings = result.data || {};

    mappings[defaultCategoryId] = {
      customName,
      defaultCategoryId,
      isActive,
      createdAt: mappings[defaultCategoryId]?.createdAt || new Date(),
      updatedAt: new Date()
    };

    return await saveCategoryMappings(adminId, mappings);
  } catch (error: any) {
    console.error('Error updating category mapping:', error);
    return { success: false, error: error.message };
  }
};

// Remove a category mapping (revert to default)
export const removeCategoryMapping = async (
  adminId: string,
  defaultCategoryId: string
) => {
  try {
    const result = await getCategoryMappings(adminId);
    const mappings: CategoryMappings = result.data || {};

    delete mappings[defaultCategoryId];

    return await saveCategoryMappings(adminId, mappings);
  } catch (error: any) {
    console.error('Error removing category mapping:', error);
    return { success: false, error: error.message };
  }
};


// Add a custom category
export const addCustomCategory = async (
  adminId: string,
  category: Omit<CustomCategory, 'id' | 'isCustom' | 'createdAt' | 'updatedAt'>
) => {
  try {
    const result = await getCategoryMappings(adminId);
    const customCategories: CustomCategory[] = result.customCategories || [];
    
    // Generate unique ID
    const categoryId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newCategory: CustomCategory = {
      ...category,
      id: categoryId,
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    customCategories.push(newCategory);
    
    const docRef = doc(db, 'restaurants', adminId, 'settings', 'categoryMappings');
    await setDoc(docRef, {
      mappings: result.data || {},
      customCategories,
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true, data: newCategory };
  } catch (error: any) {
    console.error('Error adding custom category:', error);
    return { success: false, error: error.message };
  }
};

// Update a custom category
export const updateCustomCategory = async (
  adminId: string,
  categoryId: string,
  updates: Partial<Omit<CustomCategory, 'id' | 'isCustom' | 'createdAt'>>
) => {
  try {
    const result = await getCategoryMappings(adminId);
    const customCategories: CustomCategory[] = result.customCategories || [];
    
    const index = customCategories.findIndex(cat => cat.id === categoryId);
    if (index === -1) {
      return { success: false, error: 'Category not found' };
    }
    
    customCategories[index] = {
      ...customCategories[index],
      ...updates,
      updatedAt: new Date()
    };
    
    const docRef = doc(db, 'restaurants', adminId, 'settings', 'categoryMappings');
    await setDoc(docRef, {
      mappings: result.data || {},
      customCategories,
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating custom category:', error);
    return { success: false, error: error.message };
  }
};

// Delete a custom category
export const deleteCustomCategory = async (
  adminId: string,
  categoryId: string
) => {
  try {
    const result = await getCategoryMappings(adminId);
    const customCategories: CustomCategory[] = (result.customCategories || []).filter(
      cat => cat.id !== categoryId
    );
    
    const docRef = doc(db, 'restaurants', adminId, 'settings', 'categoryMappings');
    await setDoc(docRef, {
      mappings: result.data || {},
      customCategories,
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting custom category:', error);
    return { success: false, error: error.message };
  }
};
