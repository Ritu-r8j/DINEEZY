'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, X, Clock, Tag, Camera, Star, Loader2 } from 'lucide-react';
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

  // Fetch menu items and restaurant data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch both menu items and restaurant data in parallel
        const [menuResult, restaurantResult] = await Promise.all([
          getMenuItems(user.uid),
          getRestaurantSettings(user.uid)
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
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid]);

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

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
      
      const result = await toggleMenuItemAvailability(itemId, !item.available);
      if (result.success) {
    setMenuItems(items =>
          items.map(menuItem =>
            menuItem.id === itemId ? { ...menuItem, available: !menuItem.available } : menuItem
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
    setFormData(item);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingItem || !formData || !user?.uid) return;
    
    setActionLoading('save');
    try {
      const result = await updateMenuItem(editingItem.id, formData);
      if (result.success) {
      setMenuItems(items =>
        items.map(item =>
          item.id === editingItem.id ? { ...item, ...formData } : item
        )
      );
      setShowEditModal(false);
      setEditingItem(null);
      setFormData({});
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
        name: formData.name,
        description: formData.description || '',
        price: formData.price,
        category: formData.category || 'Main Course',
        image: formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop&crop=center',
        available: formData.available !== undefined ? formData.available : true,
        preparationTime: formData.preparationTime || 15,
        ingredients: formData.ingredients || '',
        allergens: formData.allergens || [],
        spiceLevel: formData.spiceLevel || 'none',
        isVegetarian: formData.isVegetarian || false,
        isVegan: formData.isVegan || false,
        isGlutenFree: formData.isGlutenFree || false,
        calories: formData.calories || 0,
        rating: 0,
        tags: formData.tags || [],
        // Include restaurant location coordinates
        restaurantLocation: restaurantData?.location ? {
          lat: restaurantData.location.lat,
          lng: restaurantData.location.lng
        } : null,
        // Include restaurant address for reference
        restaurantAddress: restaurantData?.address ? {
          street: restaurantData.address.street,
          city: restaurantData.address.city,
          state: restaurantData.address.state,
          postalCode: restaurantData.address.postalCode
        } : null
      };
      
      const result = await addMenuItem(user.uid, newItemData);
      if (result.success && result.data) {
        setMenuItems(items => [result.data!, ...items]);
        setShowAddModal(false);
        setFormData({});
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

  const getSpiceLevelColor = (level: string) => {
    switch (level) {
      case 'mild': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hot': return 'text-orange-600';
      case 'very-hot': return 'text-red-600';
      default: return 'text-gray-600';
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
                {restaurantData?.location && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    📍 Location Set
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setFormData({ available: true }); // Default to available when adding
                setShowAddModal(true);
              }}
              className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </button>
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
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-center">
              <div className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                ⚠️ Restaurant location not set. New menu items will be added without location data. 
                <a href="/admin/settings" className="ml-1 underline hover:text-yellow-700 dark:hover:text-yellow-300">
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
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === category
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-700/70'
                  }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Perfect & Polished Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/30 dark:border-gray-700/30 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 hover:border-blue-300/50 dark:hover:border-blue-600/50">
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
                  {item.discount && (
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                      -{item.discount}% OFF
                    </div>
                  )}

                  {/* Availability Toggle */}
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    disabled={actionLoading === item.id}
                    className={`z-10 p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${item.available
                      ? 'bg-emerald-100/90 text-emerald-600 hover:bg-emerald-200/90 hover:scale-110'
                      : 'bg-red-100/90 text-red-600 hover:bg-red-200/90 hover:scale-110'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {actionLoading === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : item.available ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Star className="h-3 w-3 text-black fill-current dark:text-white" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{item.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Unavailable Overlay */}
                {!item.available && (
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
                    className="p-2 bg-blue-500/90 hover:bg-blue-600 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={actionLoading === item.id}
                    className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                      ${item.price.toFixed(2)}
                    </div>
                    {item.discount && (
                      <div className="text-xs text-gray-400 line-through">
                        ${(item.price / (1 - item.discount / 100)).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Enhanced Tags and Dietary Info */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 text-xs px-2.5 py-1 rounded-full font-medium border border-blue-200/50 dark:border-blue-700/50">
                      {tag}
                    </span>
                  ))}
                  {item.isVegetarian && (
                    <span className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 text-xs px-2.5 py-1 rounded-full font-medium border border-green-200/50 dark:border-green-700/50">
                      🌱 Veg
                    </span>
                  )}
                  {item.isVegan && (
                    <span className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 text-xs px-2.5 py-1 rounded-full font-medium border border-green-200/50 dark:border-green-700/50">
                      🌿 Vegan
                    </span>
                  )}
                  {item.isGlutenFree && (
                    <span className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 text-xs px-2.5 py-1 rounded-full font-medium border border-orange-200/50 dark:border-orange-700/50">
                      🚫 GF
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
                      <span className={`${getSpiceLevelColor(item.spiceLevel)} text-sm`}>
                        {'🌶️'.repeat(item.spiceLevel === 'mild' ? 1 : item.spiceLevel === 'medium' ? 2 : item.spiceLevel === 'hot' ? 3 : 4)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Enhanced Status and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 hover:scale-110"
                      title="Edit item"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={actionLoading === item.id}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete item"
                    >
                      {actionLoading === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                      <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${item.available
                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-700/50'
                    : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-200 border border-red-200/50 dark:border-red-700/50'
                    }`}>
                    {item.available ? '✅ Available' : '❌ Unavailable'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">No menu items found matching your criteria.</div>
          </div>
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
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="0.00"
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
                        value={formData.category || 'Main Course'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option>Main Course</option>
                        <option>Appetizers</option>
                        <option>Salads</option>
                        <option>Pizza</option>
                        <option>Burgers</option>
                        <option>Desserts</option>
                        <option>Beverages</option>
                      </select>
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
                          name="available"
                          checked={formData.available === true}
                          onChange={() => setFormData({ ...formData, available: true })}
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
                          name="available"
                          checked={formData.available === false}
                          onChange={() => setFormData({ ...formData, available: false })}
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

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setFormData({});
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