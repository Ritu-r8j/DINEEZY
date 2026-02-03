'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, X, Clock, Tag, Star, Loader2, Leaf, Sprout, ShieldX, Flame, TrendingUp, Award, Heart, Users, BarChart3, Percent, Globe, Settings, Filter, ChevronDown } from 'lucide-react';
import { CategoryIcons, VegetarianIcon, VeganIcon, GlutenFreeIcon, NutritionIcon } from '@/lib/icons/categoryIcons';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  getRestaurantSettings,
  MenuItem
} from '@/app/(utils)/firebaseOperations';
import CategoryManagementModal from '@/app/(components)/CategoryManagementModal';
import ImageUpload from '@/app/(components)/ImageUpload';
import VideoUpload from '@/app/(components)/VideoUpload';
import { DEFAULT_CATEGORIES, getCategoryDisplayName } from '@/lib/categoryData';
import { getCategoryMappings, CategoryMappings } from '@/app/(utils)/categoryOperations';
import { deleteFromCloudinary } from '@/app/(utils)/cloudinary';



export default function MenuManagement() {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New state for enhanced features
  const [variants, setVariants] = useState<Array<{ name: string, price: number }>>([]);
  const [addons, setAddons] = useState<Array<{ name: string, price: number }>>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryMappings, setCategoryMappings] = useState<CategoryMappings>({});
  const [customCategories, setCustomCategories] = useState<any[]>([]);
  
  // Image management state
  const [imagePublicId, setImagePublicId] = useState<string>('');
  
  // Video management state
  const [videoPublicId, setVideoPublicId] = useState<string>('');
  
  // Input states for comma-separated fields
  const [allergenInput, setAllergenInput] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [ingredientInput, setIngredientInput] = useState<string>('');

  // Helper function to clean nutritional information (remove undefined/null/empty values)
  const cleanNutritionalInfo = (nutritionalInfo: any) => {
    if (!nutritionalInfo) return undefined;
    
    const cleaned = Object.fromEntries(
      Object.entries(nutritionalInfo).filter(([_, value]) => 
        value !== undefined && value !== null && value !== '' && !isNaN(Number(value))
      )
    );
    
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  };

  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str: string): string => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to process comma-separated input
  const processCommaSeparatedInput = (value: string): string[] => {
    return value
      .split(',')
      .map(item => capitalizeWords(item.trim()))
      .filter(item => item.length > 0);
  };

  // Helper functions for variants and add-ons
  const addVariant = () => {
    setVariants([...variants, { name: '', price: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: 'name' | 'price', value: string | number) => {
    const newVariants = [...variants];
    if (field === 'name') {
      newVariants[index].name = value as string;
    } else {
      newVariants[index].price = typeof value === 'string' ? parseFloat(value) || 0 : value;
    }
    setVariants(newVariants);
  };

  const capitalizeVariantName = (index: number) => {
    const newVariants = [...variants];
    newVariants[index].name = capitalizeWords(newVariants[index].name);
    setVariants(newVariants);
  };

  const addAddon = () => {
    setAddons([...addons, { name: '', price: 0 }]);
  };

  const removeAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index));
  };

  const updateAddon = (index: number, field: 'name' | 'price', value: string | number) => {
    const newAddons = [...addons];
    if (field === 'name') {
      newAddons[index].name = value as string;
    } else {
      newAddons[index].price = typeof value === 'string' ? parseFloat(value) || 0 : value;
    }
    setAddons(newAddons);
  };

  const capitalizeAddonName = (index: number) => {
    const newAddons = [...addons];
    newAddons[index].name = capitalizeWords(newAddons[index].name);
    setAddons(newAddons);
  };

  // Fetch menu items and restaurant data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch menu items, restaurant data, and category mappings in parallel
        const [menuResult, restaurantResult, categoryResult] = await Promise.all([
          getMenuItems(user.uid),
          getRestaurantSettings(user.uid),
          getCategoryMappings(user.uid)
        ]);

        if (menuResult.success && menuResult.data) {
          setMenuItems(menuResult.data);
        } else {
          setError(menuResult.error || 'Failed to fetch menu items');
        }

        if (restaurantResult.success && restaurantResult.data) {
          setRestaurantData(restaurantResult.data);
        } else {
          console.warn('Failed to fetch restaurant data:', restaurantResult.error);
        }

        if (categoryResult.success) {
          setCategoryMappings(categoryResult.data);
          setCustomCategories(categoryResult.customCategories || []);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  // Get unique categories from menu items (these are default category IDs)
  const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)));
  
  // Map categories to display names
  const categories = [
    { id: 'all', displayName: 'All' },
    ...uniqueCategories.map(catId => ({
      id: catId,
      displayName: getCategoryDisplayName(catId, categoryMappings, customCategories)
    }))
  ];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAvailability = async (itemId: string) => {
    if (!user?.uid) return;

    setActionLoading(itemId);
    try {
      const item = menuItems.find(i => i.id === itemId);
      if (!item) return;

      const result = await toggleMenuItemAvailability(itemId, !item.isAvailable);
      if (result.success) {
        setMenuItems(items =>
          items.map(menuItem =>
            menuItem.id === itemId ? { ...menuItem, isAvailable: !menuItem.isAvailable } : menuItem
          )
        );
      } else {
        setError(result.error || 'Failed to update availability');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error toggling availability:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!user?.uid) return;

    setActionLoading(itemId);
    try {
      const item = menuItems.find(i => i.id === itemId);
      
      // Delete from Firestore
      const result = await deleteMenuItem(itemId);
      if (result.success) {
        // Delete image from Cloudinary if it exists and has a public_id
        if (item?.imagePublicId) {
          try {
            await deleteFromCloudinary(item.imagePublicId);
          } catch (cloudinaryError) {
            console.error('Failed to delete image from Cloudinary:', cloudinaryError);
            // Continue even if Cloudinary deletion fails
          }
        }
        
        // Delete video from Cloudinary if it exists and has a public_id
        if (item?.videoPublicId) {
          try {
            await deleteFromCloudinary(item.videoPublicId);
          } catch (cloudinaryError) {
            console.error('Failed to delete video from Cloudinary:', cloudinaryError);
            // Continue even if Cloudinary deletion fails
          }
        }
        
        setMenuItems(items => items.filter(item => item.id !== itemId));
      } else {
        setError(result.error || 'Failed to delete item');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error deleting item:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    
    // Normalize category to ensure it's a valid default category ID
    let normalizedCategory = item.category;
    
    // Check if category is already a valid default category ID
    const isValidCategoryId = DEFAULT_CATEGORIES.some(cat => cat.id === item.category);
    
    if (!isValidCategoryId) {
      // Try to find matching default category by name (case-insensitive)
      const matchingCategory = DEFAULT_CATEGORIES.find(
        cat => cat.name.toLowerCase() === item.category.toLowerCase()
      );
      
      if (matchingCategory) {
        normalizedCategory = matchingCategory.id;
      } else {
        // Default to main-course if no match found
        normalizedCategory = 'main-course';
      }
    }
    
    setFormData({
      ...item,
      category: normalizedCategory
    });
    setVariants(item.variants || []);
    setAddons(item.addons || []);
    setImagePublicId(item.imagePublicId || '');
    setVideoPublicId(item.videoPublicId || '');
    
    // Initialize input states for comma-separated fields
    setIngredientInput(Array.isArray(item.ingredients) ? item.ingredients.join(', ') : '');
    setAllergenInput(Array.isArray(item.allergens) ? item.allergens.join(', ') : '');
    setTagInput(Array.isArray(item.tags) ? item.tags.join(', ') : '');
    
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingItem || !formData || !user?.uid) return;

    setActionLoading('save');
    try {
      // Clean nutritional information
      const cleanedNutritionalInfo = cleanNutritionalInfo(formData.nutritionalInfo);

      // Include variants and addons in the update data (filter out empty entries)
      const updateData = {
        ...formData,
        // Validate discount price
        discountPrice: formData.discountPrice && 
                      formData.discountPrice > 0 && 
                      formData.price &&
                      formData.discountPrice < formData.price ? formData.discountPrice : undefined,
        variants: variants.filter(v => v.name.trim() && v.price > 0) || [],
        addons: addons.filter(a => a.name.trim() && a.price > 0) || [],
        ...(imagePublicId && { imagePublicId }), // Only include if imagePublicId exists
        ...(videoPublicId && { videoPublicId }), // Only include if videoPublicId exists
        ...(cleanedNutritionalInfo && { nutritionalInfo: cleanedNutritionalInfo }),
        updatedAt: new Date()
      };

      const result = await updateMenuItem(editingItem.id, updateData);
      if (result.success) {
        setMenuItems(items =>
          items.map(item =>
            item.id === editingItem.id ? { ...item, ...updateData } : item
          )
        );
        setShowEditModal(false);
        setEditingItem(null);
        setFormData({});
        setVariants([]);
        setAddons([]);
        setImagePublicId('');
        setVideoPublicId('');
        setIngredientInput('');
        setAllergenInput('');
        setTagInput('');
      } else {
        setError(result.error || 'Failed to update item');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating item:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.price || !user?.uid) return;

    setActionLoading('add');
    try {
      // Clean nutritional information
      const cleanedNutritionalInfo = cleanNutritionalInfo(formData.nutritionalInfo);

      const newItemData = {
        // Admin & Restaurant Info
        adminId: user.uid,
        restaurantId: restaurantData?.id || 'default_restaurant',
        restaurantName: restaurantData?.name || 'Restaurant',
        restaurantAddress: restaurantData?.address ? {
          street: restaurantData.address.street,
          city: restaurantData.address.city,
          state: restaurantData.address.state,
          postalCode: restaurantData.address.postalCode
        } : null,
        restaurantLocation: restaurantData?.location ? {
          lat: restaurantData.location.lat,
          lng: restaurantData.location.lng
        } : null,

        // Item Info
        name: formData.name,
        description: formData.description || '',
        category: formData.category || 'main-course', // Store default category ID
        image: formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop&crop=center',
        tags: tagInput ? processCommaSeparatedInput(tagInput) : [],

        // Pricing
        price: formData.price,
        discountPrice: formData.discountPrice && 
                      formData.discountPrice > 0 && 
                      formData.price &&
                      formData.discountPrice < formData.price ? formData.discountPrice : undefined,
        currency: formData.currency || 'INR',
        isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,
        available: formData.isAvailable !== undefined ? formData.isAvailable : true,
        // Details
        spiceLevel: formData.spiceLevel || 'mild',
        preparationTime: formData.preparationTime || 15,
        calories: formData.nutritionalInfo?.calories || 0,

        // Dietary Info
        isVegetarian: formData.isVegetarian || false,
        isVegan: formData.isVegan || false,
        isGlutenFree: formData.isGlutenFree || false,
        allergens: allergenInput ? processCommaSeparatedInput(allergenInput) : [],

        // Ingredients
        ingredients: ingredientInput ? processCommaSeparatedInput(ingredientInput) : [],

        // Nutritional Information (only include if provided and has valid values)
        ...(cleanedNutritionalInfo && { nutritionalInfo: cleanedNutritionalInfo }),

        // Variants & Add-ons (filter out empty entries)
        variants: variants.filter(v => v.name.trim() && v.price > 0) || [],
        addons: addons.filter(a => a.name.trim() && a.price > 0) || [],
        
        // Image Public ID for Cloudinary cleanup (only include if exists)
        ...(imagePublicId && { imagePublicId }),
        
        // Video Public ID for Cloudinary cleanup (only include if exists)
        ...(videoPublicId && { videoPublicId }),

        // Meta Info
        rating: 0,
        totalRatings: 0,
        totalOrders: 0,
        isBestSeller: formData.isBestSeller || false,
        isRecommended: formData.isRecommended || false,

        // Analytics
        viewCount: 0,
        orderCount: 0,
        lastOrderedAt: null,

        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await addMenuItem(user.uid, newItemData);
      if (result.success && result.data) {
        setMenuItems(items => [result.data!, ...items]);
        setShowAddModal(false);
        setFormData({});
        setVariants([]);
        setAddons([]);
        setImagePublicId('');
        setVideoPublicId('');
        setIngredientInput('');
        setAllergenInput('');
        setTagInput('');
      } else {
        setError(result.error || 'Failed to add item');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding item:', err);
    } finally {
      setActionLoading(null);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] transition-colors duration-300">
      {/* Glass Header */}
      <div className="sticky top-0 z-30 w-full bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Menu Management</h1>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                  {menuItems.length} {menuItems.length === 1 ? 'item' : 'items'} in total
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="hidden sm:flex items-center px-4 py-2 bg-white dark:bg-[#14161a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 shadow-sm text-sm font-medium group"
                title="Manage Categories"
              >
                <Settings className="h-4 w-4 mr-2 text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" />
                Categories
              </button>
              
              <button
                onClick={() => {
                  setFormData({ isAvailable: true });
                  setVariants([]);
                  setAddons([]);
                  setImagePublicId('');
                  setVideoPublicId('');
                  setIngredientInput('');
                  setAllergenInput('');
                  setTagInput('');
                  setShowAddModal(true);
                }}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-slate-900 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-gray-50 dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-[#1a1d24] rounded-full">
                <ShieldX className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 dark:group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name, description..."
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl leading-5 bg-white dark:bg-[#14161a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-gray-400 dark:focus:border-gray-500 transition-all duration-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar mask-linear-fade">
             <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                  selectedCategory === 'all'
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md'
                    : 'bg-white dark:bg-[#14161a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <Filter className="h-3.5 w-3.5 mr-2" />
                All Items
              </button>
              {categories.filter(c => c.id !== 'all').map(category => {
                const IconComponent = CategoryIcons[category.id] || CategoryIcons.default;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                      selectedCategory === category.id
                         ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md'
                    : 'bg-white dark:bg-[#14161a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <IconComponent className={`h-3.5 w-3.5 mr-2 ${selectedCategory === category.id ? 'text-current' : 'text-gray-500 dark:text-gray-400'}`} />
                    {category.displayName}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#14161a] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 h-[380px] animate-pulse">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
                <div className="flex justify-between items-center mt-auto">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-8"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="bg-gray-100 dark:bg-[#14161a]/50 p-6 rounded-full mb-6">
              <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No items found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">
              {searchTerm 
                ? `No menu items match "${searchTerm}". Try adjusting your search.`
                : "Your menu is empty. Start adding delicious items to your menu."}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-gray-900 dark:text-white hover:underline font-medium"
              >
                Clear Search
              </button>
            )}
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-slate-900 rounded-xl hover:shadow-lg font-bold transition-all"
              >
                Add Your First Item
              </button>
            )}
          </div>
        )}

        {/* Menu Grid */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="group relative bg-white dark:bg-[#14161a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-[0_0_20px_rgba(184,220,255,0.4)] hover:border-[#c9cbff] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-[#14161a]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {item.discountPrice && item.discountPrice < item.price && (
                      <span className="bg-black text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        -{Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
                      </span>
                    )}
                    {item.isBestSeller && (
                      <span className="bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-slate-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Best Seller
                      </span>
                    )}
                  </div>

                  {/* Availability Toggle (Absolute) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAvailability(item.id);
                    }}
                    disabled={actionLoading === item.id}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 shadow-sm z-10 ${
                      item.isAvailable
                        ? 'bg-white/90 text-slate-900 hover:bg-white'
                        : 'bg-black/60 text-white hover:bg-black/80'
                    }`}
                    title={item.isAvailable ? "Mark as Unavailable" : "Mark as Available"}
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : item.isAvailable ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>

                  {/* Unavailable Overlay */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center z-0">
                      <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-semibold border border-white/30">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                        {getCategoryDisplayName(item.category, categoryMappings, customCategories)}
                      </p>
                    </div>
                    <div className="text-right">
                       {item.discountPrice && item.discountPrice < item.price ? (
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-lg text-gray-900 dark:text-white">
                             {item.currency === 'INR' ? '₹' : '$'}{item.discountPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-400 line-through decoration-gray-400/50">
                             {item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                           {item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Compact Tags */}
                     {item.isVegetarian && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-[#1a1d24] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                          <VegetarianIcon className="h-3 w-3 mr-1" /> Veg
                        </span>
                      )}
                      {item.isVegan && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-[#1a1d24] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                           <VeganIcon className="h-3 w-3 mr-1" /> Vegan
                        </span>
                      )}
                       {item.spiceLevel !== 'none' && item.spiceLevel !== 'mild' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-[#1a1d24] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                          <Flame className="h-3 w-3 mr-1" /> {item.spiceLevel === 'medium' ? 'Spicy' : 'Hot'}
                        </span>
                      )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                     <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-3">
                        <span className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-gray-400 fill-current" />
                          {item.rating.toFixed(1)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.preparationTime}m
                        </span>
                     </div>
                     
                     <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/50 dark:hover:text-white rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category Management Modal */}
        {user?.uid && (
          <CategoryManagementModal
            isOpen={showCategoryModal}
            onClose={() => setShowCategoryModal(false)}
            adminId={user.uid}
            onSave={async () => {
              // Refresh category mappings and custom categories after save
              const result = await getCategoryMappings(user.uid);
              if (result.success) {
                setCategoryMappings(result.data);
                setCustomCategories(result.customCategories || []);
              }
            }}
          />
        )}

        {/* Enhanced Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#14161a] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#0f1115]/50">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {showAddModal ? 'Add New Item' : 'Edit Item'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                     Fill in the details to {showAddModal ? 'create a new' : 'update the'} menu item.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setFormData({});
                    setVariants([]);
                    setAddons([]);
                    setImagePublicId('');
                    setVideoPublicId('');
                    setIngredientInput('');
                    setAllergenInput('');
                    setTagInput('');
                    setError(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Basic Info Section */}
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Item Name <span className="text-gray-400">*</span>
                        </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onBlur={(e) => {
                          const capitalized = capitalizeWords(e.target.value);
                          setFormData({ ...formData, name: capitalized });
                        }}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all outline-none"
                        placeholder="e.g. Truffle Mushroom Burger"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category <span className="text-gray-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.category || 'main-course'}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all outline-none appearance-none"
                        >
                          <optgroup label="Default Categories">
                            {DEFAULT_CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {getCategoryDisplayName(cat.id, categoryMappings, customCategories)}
                              </option>
                            ))}
                          </optgroup>
                          {customCategories.length > 0 && (
                            <optgroup label="Custom Categories">
                              {customCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all outline-none resize-none"
                        placeholder="Describe the dish, ingredients, and flavor profile..."
                      />
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* Pricing Section */}
                <section className="space-y-4">
                   <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                    Pricing & Availability
                  </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Regular Price <span className="text-gray-400">*</span>
                        </label>
                        <div className="flex rounded-xl shadow-sm">
                           <select
                              value={formData.currency || 'INR'}
                              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                              className="px-3 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 border-r-0 rounded-l-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 outline-none"
                            >
                              <option value="INR">₹</option>
                              <option value="USD">$</option>
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.price || ''}
                              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                              className="flex-1 min-w-0 block w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-r-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 outline-none"
                              placeholder="0.00"
                            />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                           Discounted Price <span className="text-xs font-normal text-gray-500">(Optional)</span>
                        </label>
                         <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.discountPrice || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              const regularPrice = formData.price || 0;
                              if (!e.target.value || (value > 0 && regularPrice > 0 && value < regularPrice)) {
                                setFormData({ ...formData, discountPrice: value || undefined });
                              }
                            }}
                            className="w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all outline-none"
                            placeholder="e.g. 199.00"
                          />
                           {formData.price && formData.discountPrice && formData.discountPrice < formData.price && (
                            <p className="text-xs text-gray-900 dark:text-white font-medium">
                              Saving: {Math.round(((formData.price - formData.discountPrice) / formData.price) * 100)}%
                            </p>
                          )}
                      </div>

                      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                         <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#14161a]/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-800">
                            <input
                              type="checkbox"
                              checked={formData.isAvailable !== false}
                              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                              className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available</span>
                          </label>

                          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#14161a]/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-800">
                            <input
                              type="checkbox"
                              checked={formData.isBestSeller || false}
                              onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                              className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                            />
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Best Seller</span>
                          </label>

                          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#14161a]/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-800">
                             <input
                              type="checkbox"
                              checked={formData.isRecommended || false}
                              onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                              className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900"
                            />
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recommended</span>
                          </label>
                      </div>
                   </div>
                </section>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* Media Section */}
                <section className="space-y-4">
                   <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                    Media
                  </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Image</label>
                         <div className="bg-gray-50 dark:bg-[#14161a] p-1 rounded-2xl border border-gray-200 dark:border-gray-800">
                             <ImageUpload
                                onChange={(url, publicId) => {
                                  setFormData({ ...formData, image: url });
                                  if (publicId) setImagePublicId(publicId);
                                }}
                                value={formData.image}
                              />
                         </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Video (Optional)</label>
                         <div className="bg-gray-50 dark:bg-[#14161a] p-1 rounded-2xl border border-gray-200 dark:border-gray-800">
                            <VideoUpload
                              onChange={(url, publicId) => {
                                setFormData({ ...formData, video: url });
                                if (publicId) setVideoPublicId(publicId);
                              }}
                              value={formData.video}
                            />
                         </div>
                      </div>
                   </div>
                </section>

                <hr className="border-gray-100 dark:border-gray-800" />
                
                {/* Details Section */}
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                    Details & Dietary
                  </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prep Time (min)</label>
                        <input
                          type="number"
                          value={formData.preparationTime || 15}
                          onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 outline-none"
                        />
                      </div>
                      
                       <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories (kcal)</label>
                        <input
                          type="number"
                          value={formData.nutritionalInfo?.calories || 0}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            nutritionalInfo: { 
                              ...formData.nutritionalInfo, 
                              calories: parseInt(e.target.value) 
                            } 
                          })}
                          className="w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Spice Level</label>
                         <div className="flex bg-gray-50 dark:bg-[#14161a] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                            {['none', 'mild', 'medium', 'hot'].map((level) => (
                              <button
                                key={level}
                                onClick={() => setFormData({ ...formData, spiceLevel: level as any })}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                                  formData.spiceLevel === level
                                    ? 'bg-white dark:bg-[#1a1d24] shadow-sm text-gray-900 dark:text-white ring-1 ring-gray-200 dark:ring-gray-600'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3 pt-2">
                      <div className="flex flex-wrap gap-3">
                         <label className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-[#14161a]/50 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.isVegetarian || false}
                              onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                              className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-600"
                            />
                             <VegetarianIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vegetarian</span>
                          </label>

                           <label className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-[#14161a]/50 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.isVegan || false}
                              onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                              className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-600"
                            />
                             <VeganIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vegan</span>
                          </label>

                           <label className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-[#14161a]/50 rounded-xl border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.isGlutenFree || false}
                              onChange={(e) => setFormData({ ...formData, isGlutenFree: e.target.checked })}
                              className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-600"
                            />
                             <GlutenFreeIcon className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Gluten Free</span>
                          </label>
                      </div>
                   </div>

                   <div className="space-y-1.5">
                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ingredients <span className="text-xs font-normal text-gray-500">(comma separated)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all outline-none resize-none"
                        placeholder="e.g. Flour, Sugar, Milk, Eggs"
                      />
                   </div>
                   
                   <div className="space-y-1.5">
                       <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Allergens <span className="text-xs font-normal text-gray-500">(comma separated)</span>
                      </label>
                      <input
                        type="text"
                        value={allergenInput}
                        onChange={(e) => setAllergenInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all outline-none"
                        placeholder="e.g. Nuts, Dairy, Gluten"
                      />
                   </div>
                </section>
                
                <hr className="border-gray-100 dark:border-gray-800" />

                {/* Variants & Add-ons */}
                <section className="space-y-6">
                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                          Variants <span className="text-xs font-normal text-gray-500 normal-case">(e.g. Sizes, Portions)</span>
                        </h3>
                        <button
                          onClick={addVariant}
                          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
                        >
                          + Add Variant
                        </button>
                      </div>
                      
                      {variants.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-[#14161a]/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                          <p className="text-sm text-gray-500">No variants added yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {variants.map((variant, index) => (
                            <div key={index} className="flex gap-3 items-start animate-in slide-in-from-left-4 duration-300">
                              <input
                                type="text"
                                value={variant.name}
                                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                onBlur={() => capitalizeVariantName(index)}
                                placeholder="Name (e.g. Large)"
                                className="flex-1 px-4 py-2 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 outline-none"
                              />
                              <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                  type="number"
                                  value={variant.price || ''}
                                  onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-7 pr-4 py-2 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 outline-none"
                                />
                              </div>
                              <button
                                onClick={() => removeVariant(index)}
                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>

                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                          Add-ons <span className="text-xs font-normal text-gray-500 normal-case">(e.g. Extra Cheese, Dip)</span>
                        </h3>
                        <button
                          onClick={addAddon}
                          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline"
                        >
                          + Add Add-on
                        </button>
                      </div>
                      
                      {addons.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-[#14161a]/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                          <p className="text-sm text-gray-500">No add-ons added yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {addons.map((addon, index) => (
                            <div key={index} className="flex gap-3 items-start animate-in slide-in-from-left-4 duration-300">
                              <input
                                type="text"
                                value={addon.name}
                                onChange={(e) => updateAddon(index, 'name', e.target.value)}
                                onBlur={() => capitalizeAddonName(index)}
                                placeholder="Name (e.g. Extra Cheese)"
                                className="flex-1 px-4 py-2 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 outline-none"
                              />
                              <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                  type="number"
                                  value={addon.price || ''}
                                  onChange={(e) => updateAddon(index, 'price', e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-7 pr-4 py-2 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-gray-300 outline-none"
                                />
                              </div>
                              <button
                                onClick={() => removeAddon(index)}
                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0f1115]/50 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={showAddModal ? handleAdd : handleSave}
                  disabled={actionLoading !== null}
                  className="px-5 py-2.5 text-sm font-bold text-slate-900 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {showAddModal ? 'Adding...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {showAddModal ? 'Add Item' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
