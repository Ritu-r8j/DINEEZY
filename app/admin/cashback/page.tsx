'use client';

import { useState, useEffect } from 'react';
import { 
  Instagram, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search, 
  RefreshCw,
  Calendar,
  User,
  Receipt,
  Clock,
  Eye,
  X,
  Mail,
  Phone,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '@/app/(utils)/firebase';

interface CashbackClaim {
  id: string;
  userId: string;
  billId: string;
  instagramHandle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userDisplayName?: string;
}

export default function CashbackClaimManagement() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<CashbackClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<CashbackClaim | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load cashback claims with real-time listener
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    const claimsRef = collection(db, 'cashback_claims');
    const q = query(
      claimsRef,
      where('restaurantId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const claimsData: CashbackClaim[] = [];
        
        // Fetch claims with user details
        for (const docSnapshot of snapshot.docs) {
          const claimData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          } as CashbackClaim;
          
          // Fetch user details from users collection
          try {
            const userRef = doc(db, 'users', claimData.userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('User data for', claimData.userId, ':', userData);
              
              // Try multiple possible name fields
              claimData.userDisplayName = userData.displayName || 
                                         userData.name || 
                                         userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` :
                                         userData.firstName ||
                                         claimData.userName || 
                                         '';
              claimData.userEmail = userData.email || claimData.userEmail || '';
              claimData.userPhone = userData.phoneNumber || userData.phone || claimData.userPhone || '';
            } else {
              console.log('User document not found for:', claimData.userId);
            }
          } catch (error) {
            console.error('Error fetching user details:', error);
          }
          
          claimsData.push(claimData);
        }
        
        setClaims(claimsData);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error loading cashback claims:', err);
        setError('Failed to load cashback claims');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle claim status update
  const handleUpdateStatus = async (claimId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setIsUpdating(claimId);
      const claimRef = doc(db, 'cashback_claims', claimId);
      
      await updateDoc(claimRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Success feedback handled by real-time listener
    } catch (err) {
      console.error('Error updating claim status:', err);
      setError('Failed to update claim status');
    } finally {
      setIsUpdating(null);
    }
  };

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.instagramHandle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.billId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.userName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status color
  const getStatusColor = (status: CashbackClaim['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time ago
  const getTimeAgo = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading cashback claims...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Claims</h2>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cashback Claims</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage Instagram tagging cashback claims
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {claims.filter(c => c.status === 'pending').length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-3 py-2 rounded-lg text-sm font-medium">
                  {claims.filter(c => c.status === 'pending').length} pending
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by Instagram handle, Bill ID, User ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: claims.length },
                { key: 'pending', label: 'Pending', count: claims.filter(c => c.status === 'pending').length },
                { key: 'approved', label: 'Approved', count: claims.filter(c => c.status === 'approved').length },
                { key: 'rejected', label: 'Rejected', count: claims.filter(c => c.status === 'rejected').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Instagram Handle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Bill ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClaims.length > 0 ? (
                  filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <Instagram className="h-5 w-5 text-pink-500" />
                          <div>
                            <a
                              href={`https://www.instagram.com/${claim.instagramHandle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                            >
                              <span>@{claim.instagramHandle.replace('@', '')}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {claim.userDisplayName && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{claim.userDisplayName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Receipt className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white font-mono">
                            {claim.billId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono text-xs">
                            {claim.userId.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {getTimeAgo(claim.createdAt)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(claim.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedClaim(claim);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {claim.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(claim.id, 'approved')}
                                disabled={isUpdating === claim.id}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating === claim.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(claim.id, 'rejected')}
                                disabled={isUpdating === claim.id}
                                className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isUpdating === claim.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {claim.status === 'approved' ? 'Approved' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Instagram className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No cashback claims found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm
                          ? `No claims match "${searchTerm}"`
                          : statusFilter === 'pending'
                          ? 'No pending claims at the moment'
                          : `No ${statusFilter} claims found`
                        }
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        {claims.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Claims</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{claims.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {claims.filter(c => c.status === 'approved').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {claims.filter(c => c.status === 'rejected').length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedClaim && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDetailsModal(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg">
                      {selectedClaim.userDisplayName ? selectedClaim.userDisplayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Claim Details</h2>
                      <p className="text-sm text-blue-100">Complete user information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* User Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Full Name
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedClaim.userDisplayName || selectedClaim.userEmail?.split('@')[0] || 'Not provided'}
                      </p>
                      {!selectedClaim.userDisplayName && selectedClaim.userEmail && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          (Derived from email)
                        </p>
                      )}
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        User ID
                      </p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                        {selectedClaim.userId}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email Address
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white break-all">
                        {selectedClaim.userEmail || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone Number
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedClaim.userPhone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Claim Information */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Claim Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Instagram className="h-3 w-3" />
                        Instagram Handle
                      </p>
                      <a
                        href={`https://www.instagram.com/${selectedClaim.instagramHandle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        @{selectedClaim.instagramHandle.replace('@', '')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Bill/Order ID
                      </p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">
                        {selectedClaim.billId}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Status
                      </p>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClaim.status)}`}>
                        {selectedClaim.status.charAt(0).toUpperCase() + selectedClaim.status.slice(1)}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submitted
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(selectedClaim.createdAt)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {getTimeAgo(selectedClaim.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedClaim.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedClaim.id, 'approved');
                        setShowDetailsModal(false);
                      }}
                      disabled={isUpdating === selectedClaim.id}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating === selectedClaim.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Approve Claim
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedClaim.id, 'rejected');
                        setShowDetailsModal(false);
                      }}
                      disabled={isUpdating === selectedClaim.id}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating === selectedClaim.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 mr-2" />
                          Reject Claim
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
