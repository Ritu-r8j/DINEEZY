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
  User,
  Receipt,
  Clock,
  Eye,
  X,
  Mail,
  Phone,
  CreditCard,
  AlertCircle
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
        
        for (const docSnapshot of snapshot.docs) {
          const claimData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          } as CashbackClaim;
          
          try {
            const userRef = doc(db, 'users', claimData.userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              claimData.userDisplayName = userData.displayName || 
                                         userData.name || 
                                         (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : '') ||
                                         userData.firstName ||
                                         claimData.userName || 
                                         '';
              claimData.userEmail = userData.email || claimData.userEmail || '';
              claimData.userPhone = userData.phoneNumber || userData.phone || claimData.userPhone || '';
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

  const handleUpdateStatus = async (claimId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setIsUpdating(claimId);
      const claimRef = doc(db, 'cashback_claims', claimId);
      
      await updateDoc(claimRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating claim status:', err);
      setError('Failed to update claim status');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.instagramHandle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.billId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.userName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: CashbackClaim['status']) => {
    switch (status) {
      case 'pending': return 'bg-white border border-gray-200 text-gray-500 dark:bg-[#14161a] dark:border-gray-700 dark:text-gray-400';
      case 'approved': return 'bg-gray-900 text-white border border-gray-900 dark:bg-white dark:text-black dark:border-white';
      case 'rejected': return 'bg-gray-100 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700';
      default: return 'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800';
    }
  };

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
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Error Loading Claims</h2>
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Cashback Claims</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Verify and manage Instagram story cashback claims.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors self-start sm:self-center"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Claims</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{claims.length}</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Receipt className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {claims.filter(c => c.status === 'approved').length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <CheckCircle className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {claims.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Clock className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by handle, bill ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#14161a] text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-gray-900 dark:focus:border-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-lg p-1">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Instagram</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bill ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredClaims.length > 0 ? (
                  filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-4 w-4 text-gray-900 dark:text-white" />
                          <a
                            href={`https://www.instagram.com/${claim.instagramHandle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 dark:text-white hover:underline decoration-gray-400 underline-offset-2"
                          >
                            @{claim.instagramHandle.replace('@', '')}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500 dark:text-gray-400">
                        {claim.billId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] flex items-center justify-center text-xs font-bold text-black shadow-sm border border-white/20">
                             {claim.userDisplayName ? claim.userDisplayName.charAt(0).toUpperCase() : 'U'}
                           </div>
                           <span className="text-gray-900 dark:text-white font-medium">{claim.userDisplayName || 'Unknown'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {getTimeAgo(claim.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedClaim(claim);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {claim.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(claim.id, 'approved')}
                                disabled={isUpdating === claim.id}
                                className="p-1.5 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                              >
                                {isUpdating === claim.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(claim.id, 'rejected')}
                                disabled={isUpdating === claim.id}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                              >
                                {isUpdating === claim.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No claims found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14161a] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] px-6 py-4 flex justify-between items-center">
              <h3 className="text-black font-bold text-lg">Claim Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-black/60 hover:text-black">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User Info</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedClaim.userDisplayName || 'N/A'}</p>
                  </div>
                   <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedClaim.userPhone || 'N/A'}</p>
                  </div>
                   <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedClaim.userEmail || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Claim Info</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Instagram</p>
                    <a href={`https://instagram.com/${selectedClaim.instagramHandle.replace('@','')}`} target="_blank" className="font-medium text-gray-900 dark:text-white flex items-center gap-1 hover:underline">
                      {selectedClaim.instagramHandle} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                   <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bill ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">{selectedClaim.billId}</p>
                  </div>
                   <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Submitted At</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedClaim.createdAt)}</p>
                  </div>
                </div>
              </div>

              {selectedClaim.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedClaim.id, 'rejected');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedClaim.id, 'approved');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-black rounded-lg hover:opacity-90 font-medium transition-opacity"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
