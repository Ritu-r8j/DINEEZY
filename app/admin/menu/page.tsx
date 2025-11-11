'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, X, Clock, Tag, Star, Loader2, Leaf, Sprout, ShieldX, Flame, TrendingUp, Award, Heart, Users, BarChart3, Percent, Globe, Settings } from 'lucide-react';
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
import { DEFAULT_CATEGORIES, getCategoryDisplayName } from '@/lib/categoryData';
import { getCategoryMappings, CategoryMappings } from '@/app/(utils)/categoryOperations';



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
  
  // Combine default and custom categories
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];
  
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
      const result = await deleteMenuItem(itemId);
      if (result.success) {
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
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingItem || !formData || !user?.uid) return;

    setActionLoading('save');
    try {
      // Include variants and addons in the update data (filter out empty entries)
      const updateData = {
        ...formData,
        variants: variants.filter(v => v.name.trim() && v.price > 0) || [],
        addons: addons.filter(a => a.name.trim() && a.price > 0) || [],
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
        tags: formData.tags || [],

        // Pricing
        price: formData.price,
        discountPrice: formData.discountPrice || undefined,
        currency: formData.currency || 'INR',
        isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,

        // Details
        spiceLevel: formData.spiceLevel || 'mild',
        preparationTime: formData.preparationTime || 15,
        calories: formData.calories || 0,

        // Dietary Info
        isVegetarian: formData.isVegetarian || false,
        isVegan: formData.isVegan || false,
        isGlutenFree: formData.isGlutenFree || false,
        allergens: formData.allergens || [],

        // Ingredients
        ingredients: Array.isArray(formData.ingredients) ? formData.ingredients :
          (formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()) : []),

        // Variants & Add-ons (filter out empty entries)
        variants: variants.filter(v => v.name.trim() && v.price > 0) || [],
        addons: addons.filter(a => a.name.trim() && a.price > 0) || [],

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{menuItems.length} items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm text-sm font-medium"
                title="Manage Categories"
              >
                <Settings className="h-4 w-4 mr-1" />
                Categories
              </button>
              <button
                onClick={() => {
                  setFormData({ isAvailable: true }); // Default to available when adding
                  setVariants([]);
                  setAddons([]);
                  setShowAddModal(true);
                }}
                className="flex items-center px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-sm text-sm font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center">
              <div className="text-red-600 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Warning Message for Missing Location */}
        {!loading && restaurantData && !restaurantData.location && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-center">
              <div className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center">
                <ShieldX className="h-4 w-4 mr-2" />
                Restaurant location not set. New menu items will be added without location data.
                <a href="/admin/settings" className="ml-1 underline hover:text-black dark:hover:text-white">
                  Set location in settings
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Loading menu items...</span>
            </div>
          </div>
        )}

        {/* Compact Search and Filter */}
        {!loading && (
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 shadow-sm overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === category.id
                    ? 'bg-gray-900 dark:bg-gray-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-700/70'
                    }`}
                >
                  {category.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Perfect & Polished Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm transition-all duration-300 hover:shadow-lg dark:hover:border-primary/20">
              <div className="relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Enhanced Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Top Controls Row */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  {/* Discount Badge */}
                  {item.discountPrice && item.discountPrice < item.price && (
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      -{Math.round(((item.price - item.discountPrice) / item.price) * 100)}% OFF
                    </div>
                  )}

                  {/* Best Seller Badge */}
                  {item.isBestSeller && (
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      BESTSELLER
                    </div>
                  )}

                  {/* Availability Toggle */}
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    disabled={actionLoading === item.id}
                    className={`z-10 p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${item.isAvailable
                      ? 'bg-white/90 text-gray-900 hover:bg-gray-100/90 hover:scale-110'
                      : 'bg-gray-900/90 text-white hover:bg-gray-800/90 hover:scale-110'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : item.isAvailable ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Rating & Analytics Badges */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex flex-col gap-2">
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{item.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({item.totalRatings})</span>
                  </div>

                  {/* Analytics Badge */}
                  {(item.totalOrders || 0) > 0 && (
                    <div className="bg-blue-500/90 text-white px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="text-xs font-semibold">{item.totalOrders}</span>
                    </div>
                  )}
                </div>

                {/* Recommended Badge */}
                {item.isRecommended && (
                  <div className="absolute top-3 right-16">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span className="text-xs font-semibold">Recommended</span>
                    </div>
                  </div>
                )}

                {/* Unavailable Overlay */}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-white font-bold text-lg mb-1">Unavailable</div>
                      <div className="text-white/80 text-sm">Currently out of stock</div>
                    </div>
                  </div>
                )}

                {/* Quick Action Buttons (Hover) */}
                <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 bg-white/90 hover:bg-gray-100 text-gray-900 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={actionLoading === item.id}
                    className="p-2 bg-gray-900/90 hover:bg-gray-800 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5">
                {/* Header with Enhanced Typography */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-full">
                        {getCategoryDisplayName(item.category, categoryMappings, customCategories)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="flex flex-col items-end">
                      {item.discountPrice && item.discountPrice < item.price ? (
                        <>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                            {item.currency === 'INR' ? '₹' : '$'}{item.discountPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400 line-through">
                            {item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}
                          </div>
                        </>
                      ) : (
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                          {item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}
                        </div>
                      )}

                      {/* Variants and Add-ons indicators */}
                      <div className="flex flex-col gap-1 mt-1">
                        {item.variants && item.variants.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <Globe className="h-3 w-3 inline mr-1" />
                            {item.variants.length} variant{item.variants.length > 1 ? 's' : ''}
                          </div>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <Plus className="h-3 w-3 inline mr-1" />
                            {item.addons.length} add-on{item.addons.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Enhanced Tags and Dietary Info */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 dark:border-gray-600 flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {item.isVegetarian && (
                    <span className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 dark:border-gray-600 flex items-center">
                      <Leaf className="h-3 w-3 mr-1" />
                      Veg
                    </span>
                  )}
                  {item.isVegan && (
                    <span className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 dark:border-gray-600 flex items-center">
                      <Sprout className="h-3 w-3 mr-1" />
                      Vegan
                    </span>
                  )}
                  {item.isGlutenFree && (
                    <span className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-300 dark:border-gray-600 flex items-center">
                      <ShieldX className="h-3 w-3 mr-1" />
                      GF
                    </span>
                  )}
                </div>

                {/* Enhanced Meta Info */}
                <div className="flex items-center justify-between text-xs mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.preparationTime}m</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.calories} cal</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.spiceLevel !== 'none' && (
                      <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {Array.from({ length: item.spiceLevel === 'mild' ? 1 : item.spiceLevel === 'medium' ? 2 : item.spiceLevel === 'hot' ? 3 : 4 }).map((_, i) => (
                          <Flame key={i} className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Status and Actions */}
                {/* Enhanced Status and Actions */}
                <div className="space-y-3 pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  {/* Analytics Row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <BarChart3 className="h-3 w-3" />
                        <span>{item.viewCount || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <TrendingUp className="h-3 w-3" />
                        <span>{item.orderCount || 0} orders</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.addons && item.addons.length > 0 && (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                          +{item.addons.length} add-ons
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions and Status Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 hover:scale-110"
                        title="Edit item"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        disabled={actionLoading === item.id}
                        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete item"
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300 hover:scale-110"
                        title="View analytics"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 flex items-center ${item.isAvailable
                      ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                      : 'bg-gray-900 dark:bg-gray-600 text-white border border-gray-300 dark:border-gray-600'
                      }`}>
                      {item.isAvailable ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Available
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Unavailable
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants & Add-ons Tooltip */}
                {((item.variants?.length || 0) > 0 || (item.addons?.length || 0) > 0) && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 mt-2">
                    {item.variants && item.variants.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          Variants:
                        </h4>
                        <div className="space-y-1">
                          {item.variants.map((variant, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>{variant.name}</span>
                              <span>{item.currency === 'INR' ? '₹' : '$'}{variant.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                          <Plus className="h-3 w-3 mr-1" />
                          Add-ons:
                        </h4>
                        <div className="space-y-1">
                          {item.addons.map((addon, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span>{addon.name}</span>
                              <span>+{item.currency === 'INR' ? '₹' : '$'}{addon.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">No menu items found matching your criteria.</div>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-50">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {showAddModal ? 'Add New Menu Item' : 'Edit Menu Item'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setFormData({});
                    setVariants([]);
                    setAddons([]);
                    setError(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <div className="p-4 space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter item name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price *
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={formData.currency || 'INR'}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="INR">₹</option>
                          <option value="USD">$</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Percent className="h-4 w-4 inline mr-1" />
                        Discount Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discountPrice || ''}
                        onChange={(e) => setFormData({ ...formData, discountPrice: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Optional discount price"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter item description"
                    />
                  </div>

                  {/* Category and Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category || 'main-course'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <optgroup label="Default Categories">
                          {DEFAULT_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {getCategoryDisplayName(cat.id, categoryMappings, customCategories)}
                            </option>
                          ))}
                        </optgroup>
                        {customCategories.length > 0 && (
                          <optgroup label="Custom Categories">
                            {customCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Showing: {getCategoryDisplayName(formData.category || 'main-course', categoryMappings, customCategories)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prep Time (min)
                      </label>
                      <input
                        type="number"
                        value={formData.preparationTime || ''}
                        onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Calories
                      </label>
                      <input
                        type="number"
                        value={formData.calories || ''}
                        onChange={(e) => setFormData({ ...formData, calories: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="500"
                      />
                    </div>
                  </div>

                  {/* Spice Level and Dietary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Spice Level
                      </label>
                      <select
                        value={formData.spiceLevel || 'none'}
                        onChange={(e) => setFormData({ ...formData, spiceLevel: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="none">No Spice</option>
                        <option value="mild">Mild 🌶️</option>
                        <option value="medium">Medium 🌶️🌶️</option>
                        <option value="hot">Hot 🌶️🌶️🌶️</option>
                        <option value="very-hot">Very Hot 🌶️🌶️🌶️🌶️</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount || ''}
                        onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Availability Status
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isAvailable"
                          checked={formData.isAvailable === true}
                          onChange={() => setFormData({ ...formData, isAvailable: true })}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          <Eye className="h-4 w-4 mr-1 text-green-600" />
                          Available
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="isAvailable"
                          checked={formData.isAvailable === false}
                          onChange={() => setFormData({ ...formData, isAvailable: false })}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          <EyeOff className="h-4 w-4 mr-1 text-red-600" />
                          Unavailable
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Dietary Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dietary Options
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isVegetarian || false}
                          onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">🌱 Vegetarian</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isVegan || false}
                          onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">🌿 Vegan</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isGlutenFree || false}
                          onChange={(e) => setFormData({ ...formData, isGlutenFree: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">🚫 Gluten Free</span>
                      </label>
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.image || ''}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Ingredients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ingredients (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.ingredients || ''}
                      onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Tomato, Cheese, Basil"
                    />
                  </div>

                  {/* Allergens */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Allergens (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.allergens?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, allergens: e.target.value.split(', ').filter(a => a.trim()) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Gluten, Dairy, Nuts"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Tag className="h-4 w-4 inline mr-1" />
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags?.join(', ') || ''}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(', ').filter(t => t.trim()) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Popular, Spicy, Healthy"
                    />
                  </div>

                  {/* Variants Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Globe className="h-4 w-4 inline mr-1" />
                      Variants
                    </label>
                    <div className="space-y-2">
                      {variants.length === 0 && (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                          No variants added. Click "Add Variant" to create size options like Half/Full.
                        </div>
                      )}
                      {variants.map((variant, index) => (
                        <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateVariant(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                              placeholder="Variant name (e.g., Half, Full)"
                            />
                          </div>
                          <div className="w-32">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                {formData.currency === 'INR' ? '₹' : '$'}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.price || ''}
                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Remove variant"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addVariant}
                        className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                      >
                        <Plus className="h-4 w-4 inline mr-1" />
                        Add Variant
                      </button>
                    </div>
                  </div>

                  {/* Add-ons Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Plus className="h-4 w-4 inline mr-1" />
                      Add-ons
                    </label>
                    <div className="space-y-2">
                      {addons.length === 0 && (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                          No add-ons added. Click "Add Add-on" to create extras like cheese, combos, etc.
                        </div>
                      )}
                      {addons.map((addon, index) => (
                        <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={addon.name}
                              onChange={(e) => updateAddon(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                              placeholder="Add-on name (e.g., Extra Cheese)"
                            />
                          </div>
                          <div className="w-32">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                {formData.currency === 'INR' ? '₹' : '$'}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={addon.price || ''}
                                onChange={(e) => updateAddon(index, 'price', e.target.value)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAddon(index)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Remove add-on"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addAddon}
                        className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                      >
                        <Plus className="h-4 w-4 inline mr-1" />
                        Add Add-on
                      </button>
                    </div>
                  </div>

                  {/* Meta Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meta Information
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isBestSeller || false}
                          onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                          className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          <Award className="h-4 w-4 mr-1" />
                          Best Seller
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isRecommended || false}
                          onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          Recommended
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setFormData({});
                        setVariants([]);
                        setAddons([]);
                        setError(null);
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={showAddModal ? handleAdd : handleSave}
                      disabled={actionLoading === 'add' || actionLoading === 'save'}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {(actionLoading === 'add' || actionLoading === 'save') && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span>
                        {actionLoading === 'add' ? 'Adding...' :
                          actionLoading === 'save' ? 'Saving...' :
                            showAddModal ? 'Add Item' : 'Save Changes'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}