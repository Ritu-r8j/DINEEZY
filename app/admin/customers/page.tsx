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

  useEffect(() => {
    if (!user) return;

    const loadCustomers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(
          ordersRef,
          where('restaurantId', '==', user.uid)
        );
        const ordersSnapshot = await getDocs(ordersQuery);

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

        const customersData: Customer[] = [];
        const usersRef = collection(db, 'users');

        for (const userId of Array.from(userIds)) {
          const userQuery = query(usersRef, where('__name__', '==', userId));
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            const userOrders = ordersByUser.get(userId) || [];
            
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

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.displayName?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phoneNumber?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower)
    );
  });

  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const toggleExportField = (key: keyof Customer) => {
    setExportFields(fields =>
      fields.map(field =>
        field.key === key ? { ...field, selected: !field.selected } : field
      )
    );
  };

  const formatDateForExport = (timestamp?: Timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

    const headers = selectedFields.map(f => f.label).join(',');
    
    const rows = customersToExport.map(customer => {
      return selectedFields.map(field => {
        let value = customer[field.key];
        
        if (field.key === 'createdAt' || field.key === 'lastOrderDate') {
          value = formatDateForExport(value as Timestamp);
        } else if (!value) {
          value = '';
        }
        
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    const csv = [headers, ...rows].join('\n');

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

    navigator.clipboard.writeText(phoneNumbers).then(() => {
      alert(`${phoneNumbers.split('\n').length} phone numbers copied to clipboard!`);
      setShowExportModal(false);
      setSelectedCustomers(new Set());
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900 dark:text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex flex-col items-center justify-center gap-4">
        <div className="text-gray-400 text-6xl">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Error Loading Customers</h2>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Customer Management</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View and export customer information for marketing campaigns.
            </p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{customers.length}</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Users className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">With Email</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {customers.filter(c => c.email).length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Mail className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">With Phone</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {customers.filter(c => c.phoneNumber || c.phone).length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Phone className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Selection */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#14161a] text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-gray-900 dark:focus:border-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedCustomers.size > 0 && (
            <div className="flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white px-3 py-1.5 rounded-lg border border-gray-900 dark:border-gray-700">
              <span className="text-sm font-medium">
                {selectedCustomers.size} selected
              </span>
              <button
                onClick={() => setSelectedCustomers(new Set())}
                className="text-xs text-gray-300 hover:text-white font-semibold underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 w-4">
                    <button
                      onClick={selectAllCustomers}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-gray-900 dark:text-white" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registered</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        selectedCustomers.has(customer.id) ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCustomerSelection(customer.id)}
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          {selectedCustomers.has(customer.id) ? (
                            <CheckSquare className="h-5 w-5 text-gray-900 dark:text-white" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] flex items-center justify-center text-black font-semibold shadow-sm border border-white/20">
                            {customer.displayName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
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
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[150px]">{customer.email}</span>
                            </div>
                          )}
                          {(customer.phoneNumber || customer.phone) && (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{customer.phoneNumber || customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                           <Calendar className="h-4 w-4" />
                           {formatDate(customer.createdAt)}
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                           <Calendar className="h-4 w-4" />
                           {formatDate(customer.lastOrderDate)}
                         </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No customers found.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14161a] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black/5 rounded-lg backdrop-blur-sm">
                  <Download className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="text-black font-bold text-lg">Export Data</h3>
                  <p className="text-black/60 text-xs">
                    {selectedCustomers.size > 0 ? `${selectedCustomers.size} customers selected` : `All ${filteredCustomers.length} customers`}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-black/60 hover:text-black">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Select Fields</h4>
                <div className="grid grid-cols-2 gap-3">
                  {exportFields.map((field) => (
                    <button
                      key={field.key}
                      onClick={() => toggleExportField(field.key)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        field.selected
                          ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {field.selected ? (
                        <CheckSquare className="h-5 w-5 text-gray-900 dark:text-white" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        field.selected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {field.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={exportToCSV}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-black rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  Export CSV
                </button>
                <button
                  onClick={exportForWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Copy Numbers
                </button>
              </div>
              
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                CSV suitable for Excel/Google Sheets. Numbers optimized for WhatsApp broadcasting.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
