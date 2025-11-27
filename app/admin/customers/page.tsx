'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Mail, 
  Phone, 
  Calendar,
  Loader2,
  X,
  CheckSquare,
  Square,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/app/(utils)/firebase';

interface Customer {
  id: string;
  displayName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  createdAt?: Timestamp;
  lastOrderDate?: Timestamp;
}

interface ExportField {
  key: keyof Customer;
  label: string;
  selected: boolean;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [exportFields, setExportFields] = useState<ExportField[]>([
    { key: 'displayName', label: 'Name', selected: true },
    { key: 'email', label: 'Email', selected: true },
    { key: 'phoneNumber', label: 'Phone Number', selected: true },
    { key: 'createdAt', label: 'Registration Date', selected: false },
    { key: 'lastOrderDate', label: 'Last Order Date', selected: false },
  ]);

  // Load customers
  useEffect(() => {
    if (!user) return;

    const loadCustomers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all orders for this restaurant
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(
          ordersRef,
          where('restaurantId', '==', user.uid)
        );
        const ordersSnapshot = await getDocs(ordersQuery);

        // Get unique user IDs from orders
        const userIds = new Set<string>();
        const ordersByUser = new Map<string, any[]>();

        ordersSnapshot.forEach((doc) => {
          const orderData = doc.data();
          const userId = orderData.userId;
          if (userId) {
            userIds.add(userId);
            if (!ordersByUser.has(userId)) {
              ordersByUser.set(userId, []);
            }
            ordersByUser.get(userId)?.push(orderData);
          }
        });

        // Fetch user details
        const customersData: Customer[] = [];
        const usersRef = collection(db, 'users');

        for (const userId of Array.from(userIds)) {
          const userQuery = query(usersRef, where('__name__', '==', userId));
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            const userOrders = ordersByUser.get(userId) || [];
            
            // Get last order date
            const lastOrder = userOrders.sort((a, b) => 
              (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
            )[0];

            customersData.push({
              id: userId,
              displayName: userData.displayName || userData.name || 
                          (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : '') ||
                          userData.firstName || '',
              name: userData.name,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phoneNumber: userData.phoneNumber || userData.phone,
              phone: userData.phone,
              createdAt: userData.createdAt,
              lastOrderDate: lastOrder?.createdAt,
            });
          }
        }

        // Sort by last order date (most recent first)
        customersData.sort((a, b) => {
          const dateA = a.lastOrderDate?.seconds || 0;
          const dateB = b.lastOrderDate?.seconds || 0;
          return dateB - dateA;
        });
        setCustomers(customersData);
      } catch (err) {
        console.error('Error loading customers:', err);
        setError('Failed to load customers');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, [user]);

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.displayName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phoneNumber?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Toggle customer selection
  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  // Select all filtered customers
  const selectAllCustomers = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  // Toggle export field
  const toggleExportField = (key: keyof Customer) => {
    setExportFields(fields =>
      fields.map(field =>
        field.key === key ? { ...field, selected: !field.selected } : field
      )
    );
  };

  // Format date for export
  const formatDateForExport = (timestamp?: Timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const customersToExport = selectedCustomers.size > 0
      ? filteredCustomers.filter(c => selectedCustomers.has(c.id))
      : filteredCustomers;

    if (customersToExport.length === 0) {
      alert('No customers to export');
      return;
    }

    const selectedFields = exportFields.filter(f => f.selected);
    if (selectedFields.length === 0) {
      alert('Please select at least one field to export');
      return;
    }

    // Create CSV header
    const headers = selectedFields.map(f => f.label).join(',');
    
    // Create CSV rows
    const rows = customersToExport.map(customer => {
      return selectedFields.map(field => {
        let value = customer[field.key];
        
        // Format special fields
        if (field.key === 'createdAt' || field.key === 'lastOrderDate') {
          value = formatDateForExport(value as Timestamp);
        } else if (!value) {
          value = '';
        }
        
        // Escape commas and quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    // Combine header and rows
    const csv = [headers, ...rows].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportModal(false);
    setSelectedCustomers(new Set());
  };

  // Export for WhatsApp (phone numbers only)
  const exportForWhatsApp = () => {
    const customersToExport = selectedCustomers.size > 0
      ? filteredCustomers.filter(c => selectedCustomers.has(c.id))
      : filteredCustomers;

    const phoneNumbers = customersToExport
      .map(c => c.phoneNumber || c.phone)
      .filter(phone => phone)
      .join('\n');

    if (!phoneNumbers) {
      alert('No phone numbers found');
      return;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(phoneNumbers).then(() => {
      alert(`${phoneNumbers.split('\n').length} phone numbers copied to clipboard!`);
      setShowExportModal(false);
      setSelectedCustomers(new Set());
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Customers</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                View and export customer information for marketing
              </p>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">With Email</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customers.filter(c => c.email).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">With Phone</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customers.filter(c => c.phoneNumber || c.phone).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedCustomers.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCustomers.size} selected
              </span>
              <button
                onClick={() => setSelectedCustomers(new Set())}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Customers Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={selectAllCustomers}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0 ? (
                        <CheckSquare className="h-5 w-5" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        selectedCustomers.has(customer.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCustomerSelection(customer.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {selectedCustomers.has(customer.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {customer.displayName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.displayName || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              ID: {customer.id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-4 w-4" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {(customer.phoneNumber || customer.phone) && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phoneNumber || customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(customer.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(customer.lastOrderDate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No customers found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm
                          ? `No customers match "${searchTerm}"`
                          : 'No customers have placed orders yet'
                        }
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowExportModal(false)}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="dark:bg-gray-800 bg-white px-6 py-4 border-b-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Export Customer Data</h2>
                      <p className="text-sm text-blue-100">
                        {selectedCustomers.size > 0 
                          ? `Exporting ${selectedCustomers.size} selected customers`
                          : `Exporting all ${filteredCustomers.length} customers`
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Select Fields to Export
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {exportFields.map((field) => (
                      <button
                        key={field.key}
                        onClick={() => toggleExportField(field.key)}
                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                          field.selected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {field.selected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          field.selected
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {field.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={exportToCSV}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    Export as CSV
                  </button>
                  <button
                    onClick={exportForWhatsApp}
                    className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg font-medium transition-colors"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Copy Phone Numbers
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  CSV files can be opened in Excel or Google Sheets. Phone numbers are copied to clipboard for WhatsApp marketing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
