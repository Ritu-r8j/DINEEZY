'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Edit3, Save, X, Camera, ShieldCheck, Calendar } from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { updateUserProfile } from '@/app/(utils)/firebaseOperations';
import { toast } from 'sonner';

// --- UI Components ---

function SectionCard(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-[#14161a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden ${props.className || ''}`}>
      {props.children}
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-[#14161a] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#c9cbff] focus:ring-2 focus:ring-[#c9cbff]/20 focus:outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

export default function AdminProfilePage() {
  const { user, userProfile, refreshUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phone: userProfile.phoneNumber || '',
      });
    } else if (user) {
        setFormData({
            displayName: user.displayName || '',
            email: user.email || '',
            phone: user.phoneNumber || '',
        });
    }
  }, [userProfile, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const result = await updateUserProfile(user.uid, {
        displayName: formData.displayName,
        phoneNumber: formData.phone,
      });

      if (result.success) {
        await refreshUserData();
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An unexpected error occurred');
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phone: userProfile.phoneNumber || '',
      });
    }
    setIsEditing(false);
  };

  if (!user) {
      return (
          <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Profile Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account information and preferences.</p>
          </div>
          <div>
             {!isEditing ? (
                 <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all duration-200 shadow-sm"
                 >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                 </button>
             ) : (
                 <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all duration-200"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-gray-900 font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c9cbff]/50 transition-all duration-200 shadow-sm disabled:opacity-70"
                    >
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Save Changes
                            </>
                        )}
                    </button>
                 </div>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar Card */}
          <div className="lg:col-span-1">
             <SectionCard className="h-full">
                <div className="p-8 flex flex-col items-center text-center">
                   <div className="relative group">
                      <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] mb-4 shadow-lg">
                         <div className="w-full h-full rounded-full bg-white dark:bg-[#14161a] flex items-center justify-center overflow-hidden border-4 border-white dark:border-[#14161a]">
                             {user.photoURL ? (
                                 <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                             ) : (
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                    {(formData.displayName || user.email || 'A').charAt(0).toUpperCase()}
                                </span>
                             )}
                         </div>
                      </div>
                      <button className="absolute bottom-4 right-0 p-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors shadow-md border-2 border-white dark:border-[#14161a]">
                         <Camera className="w-4 h-4" />
                      </button>
                   </div>
                   
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                       {formData.displayName || 'Admin User'}
                   </h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{formData.email}</p>
                   
                   <div className="w-full border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4" /> Role
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">Admin</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              <Calendar className="w-4 h-4" /> Member Since
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                              {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                          </span>
                      </div>
                   </div>
                </div>
             </SectionCard>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
             <SectionCard>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#14161a]/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal details here.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Display Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={`${inputClass} pl-10`}
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled={true} 
                                    className={`${inputClass} pl-10 opacity-70 cursor-not-allowed`}
                                />
                                <span className="absolute right-3 top-3.5 text-xs text-gray-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Verified
                                </span>
                            </div>
                            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                Email address cannot be changed directly for security reasons.
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={`${inputClass} pl-10`}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>
                    </div>
                </div>
             </SectionCard>
          </div>

        </div>
      </div>
    </div>
  );
}
