'use client';

import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Edit2, Check, Settings, Tag, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_CATEGORIES, getCategoryDisplayName, CustomCategory } from '@/lib/categoryData';
import { CategoryMappings, getCategoryMappings, updateCategoryMapping, removeCategoryMapping, addCustomCategory, updateCustomCategory, deleteCustomCategory } from '@/app/(utils)/categoryOperations';
import { CategoryIcons, DefaultCategoryIcon } from '@/lib/icons/categoryIcons';

const getCategoryIcon = (iconKey: string) => {
  return CategoryIcons[iconKey as keyof typeof CategoryIcons] || DefaultCategoryIcon;
};

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  onSave?: () => void;
}

export default function CategoryManagementModal({
  isOpen,
  onClose,
  adminId,
  onSave
}: CategoryManagementModalProps) {
  const [mappings, setMappings] = useState<CategoryMappings>({});
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('default');

  useEffect(() => {
    if (isOpen && adminId) {
      loadMappings();
    }
  }, [isOpen, adminId]);

  const loadMappings = async () => {
    setLoading(true);
    const result = await getCategoryMappings(adminId);
    if (result.success) {
      setMappings(result.data);
      setCustomCategories(result.customCategories || []);
    }
    setLoading(false);
  };

  const handleEdit = (categoryId: string) => {
    setEditingCategory(categoryId);
    const currentName = getCategoryDisplayName(categoryId, mappings);
    setEditValue(currentName);
  };

  const handleSave = async (categoryId: string) => {
    if (!editValue.trim()) return;

    setSaving(true);
    const result = await updateCategoryMapping(adminId, categoryId, editValue.trim());
    
    if (result.success) {
      await loadMappings();
      setEditingCategory(null);
      setEditValue('');
      onSave?.();
    }
    setSaving(false);
  };

  const handleReset = async (categoryId: string) => {
    setSaving(true);
    const result = await removeCategoryMapping(adminId, categoryId);
    
    if (result.success) {
      await loadMappings();
      onSave?.();
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim()) return;

    setSaving(true);
    const result = await addCustomCategory(adminId, {
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || 'Custom category',
      icon: newCategoryIcon
    });

    if (result.success) {
      await loadMappings();
      setShowAddCustom(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryIcon('default');
      onSave?.();
    }
    setSaving(false);
  };

  const handleDeleteCustomCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this custom category? Menu items using this category will need to be reassigned.')) {
      return;
    }

    setSaving(true);
    const result = await deleteCustomCategory(adminId, categoryId);

    if (result.success) {
      await loadMappings();
      onSave?.();
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="h-6 w-6 mr-2" />
              Category Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customize category names while maintaining internal standardization
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Custom Categories Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Categories</h3>
                  <button
                    onClick={() => setShowAddCustom(!showAddCustom)}
                    className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom
                  </button>
                </div>

                {showAddCustom && (
                  <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3 border-2 border-blue-200 dark:border-blue-700">
                    <div className="grid grid-cols-1 gap-2">
                      <select
                        value={newCategoryIcon}
                        onChange={(e) => setNewCategoryIcon(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {Object.keys(CategoryIcons).filter(key => key !== 'default').map(iconKey => (
                          <option key={iconKey} value={iconKey}>
                            {iconKey.charAt(0).toUpperCase() + iconKey.slice(1).replace(/-([a-z])/g, (_, char) => ' ' + char.toUpperCase())}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Category name (e.g., Signature Dishes)"
                      />
                    </div>
                    <input
                      type="text"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Description (optional)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCustomCategory}
                        disabled={saving || !newCategoryName.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Add Category
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCustom(false);
                          setNewCategoryName('');
                          setNewCategoryDescription('');
                          setNewCategoryIcon('default');
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {customCategories.length > 0 ? (
                  <div className="space-y-2">
                    {customCategories.map((category) => (
                      <div
                        key={category.id}
                        className="p-4 rounded-xl border-2 border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/20"
                      >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                             <div className="text-gray-900 dark:text-white">
                               {(() => {
                                 const IconComponent = getCategoryIcon(category.icon);
                                 return <IconComponent className="h-8 w-8" />;
                               })()}
                             </div>
                             <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {category.name}
                                </span>
                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                                  Custom
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {category.description}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCustomCategory(category.id)}
                            disabled={saving}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete custom category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    No custom categories yet. Click "Add Custom" to create one for your restaurant.
                  </p>
                )}
              </div>

              {/* Default Categories Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Default Categories</h3>
                <div className="space-y-3">
              {DEFAULT_CATEGORIES.map((category) => {
                const isEditing = editingCategory === category.id;
                const isCustomized = mappings[category.id]?.isActive;
                const displayName = getCategoryDisplayName(category.id, mappings);
                const CategoryIcon = getCategoryIcon(category.iconKey);

                return (
                  <div
                    key={category.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isCustomized
                        ? 'border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="text-gray-900 dark:text-white">
                          <CategoryIcon className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Enter custom name"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSave(category.id);
                                  if (e.key === 'Escape') handleCancel();
                                }}
                              />
                              <button
                                onClick={() => handleSave(category.id)}
                                disabled={saving || !editValue.trim()}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {displayName}
                                </h3>
                                {isCustomized && (
                                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isCustomized ? (
                                  <>
                                    Default: <span className="font-medium">{category.name}</span> • {category.description}
                                  </>
                                ) : (
                                  category.description
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(category.id)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                            title="Customize name"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {isCustomized && (
                            <button
                              onClick={() => handleReset(category.id)}
                              disabled={saving}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reset to default"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-start space-x-3">
              <Tag className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  How Category Mapping Works
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• <strong>Display Name:</strong> What customers see in your menu</li>
                  <li>• <strong>Internal Category:</strong> Used for standardization and analytics</li>
                  <li>• <strong>SEO Benefit:</strong> Custom names improve search visibility</li>
                  <li>• <strong>Example:</strong> "Drinks & Mocktails" displays to users, but internally maps to "Beverages"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
