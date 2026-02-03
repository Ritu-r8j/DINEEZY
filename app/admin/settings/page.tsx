'use client';

import LocationPicker from './components/LocationPicker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  Edit3,
  Plus,
  Phone,
  Mail,
  Clock as ClockIcon,
  X,
  CheckCircle2,
  Users,
  Save,
  AlertCircle,
  Building2,
  Utensils,
  Star,
  Sparkles,
  MapPin,
  Share2,
  Navigation,
  Settings,
  Coffee,
  UtensilsCrossed,
  FileText,
  CreditCard,
  Building,
  Smartphone,
  Video,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';
import {
  saveRestaurantSettings,
  getRestaurantSettings,
  RestaurantSettings,
  savePaymentDetails,
  getPaymentDetails,
  PaymentDetails
} from '@/app/(utils)/firebaseOperations';
import { uploadImageToCloudinary, uploadVideoToCloudinary, uploadToCloudinary } from '@/app/(utils)/cloudinary';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {toast} from 'sonner';
import { 
  BusinessType, 
  BUSINESS_TYPE_INFO
} from '@/app/(utils)/businessTypeConfig';
import { BusinessTypeGate } from '@/app/(utils)/useFeatures';

type DayKey =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

type DayHours = {
  open: boolean;
  from: string; // HH:mm
  to: string; // HH:mm
};

type Table = {
  id: string;
  number: string;
  capacity: number;
  status: 'active' | 'inactive';
};

type SettingsState = {
  name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    state: string;
  };
  location?: {
    lat: number;
    lng: number;
  };
  image?: string | null;
  video?: string | null; // Cloudinary video URL
  hours: Record<DayKey, DayHours>;
  tables: Table[];
  // New restaurant details
  cuisine?: string;
  restaurantType?: 'Veg' | 'Non-Veg' | 'Both';
  dietaryOptions?: string[];
  specialties?: string[];
  amenities?: string[];
  description?: string;
  topPicks?: string[];
  deliveryTime?: string;
  // Social Media & Links
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  mapDirectionsLink?: string;
  // Next Visit Coupon Settings
  nextVisitCouponDiscount?: number;
  nextVisitCouponEnabled?: boolean;
  // Business Type Configuration
  businessType?: 'QSR' | 'RESTO';
  // Special Instructions
  specialInstructions?: {
    id: string;
    label: string;
    category: string;
    active: boolean;
  }[];
};

const DEFAULT_HOURS: Record<DayKey, DayHours> = {
  Monday: { open: true, from: '09:00', to: '22:00' },
  Tuesday: { open: true, from: '09:00', to: '22:00' },
  Wednesday: { open: true, from: '09:00', to: '22:00' },
  Thursday: { open: true, from: '09:00', to: '22:00' },
  Friday: { open: true, from: '09:00', to: '23:00' },
  Saturday: { open: true, from: '09:00', to: '23:00' },
  Sunday: { open: false, from: '00:00', to: '00:00' },
};

function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

// Helper function to count words
function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

// Helper function to limit text by word count
function limitByWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

function SectionCard(props: { title: string; children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <section className={cx('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 group mt-5', props.className)}>
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 sm:gap-3">
          {props.icon && <div className="text-gray-600 dark:text-gray-400 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">{props.icon}</div>}
          <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white">{props.title}</h3>
        </div>
      </div>
      <div className="p-4 sm:p-6">{props.children}</div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const restaurantImageInputRef = useRef<HTMLInputElement | null>(null);
  const restaurantVideoInputRef = useRef<HTMLInputElement | null>(null);
  const days: DayKey[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [state, setState] = useState<SettingsState>({
    name: '',
    phone: '',
    email: '',
    address: { street: '', city: '', postalCode: '', state: '' },
    location: undefined,
    image: null,
    video: null,
    hours: DEFAULT_HOURS,
    tables: [],
    // New restaurant details
    cuisine: '',
    restaurantType: 'Both',
    dietaryOptions: [],
    specialties: [],
    amenities: [],
    description: '',
    topPicks: [],
    deliveryTime: '20-30 min',
    // Social Media & Links
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
    mapDirectionsLink: '',
    // Next Visit Coupon Settings
    nextVisitCouponDiscount: 10, // Default 10% discount
    nextVisitCouponEnabled: true, // Default enabled
    // Business Type Configuration
    businessType: 'QSR', // Default to QSR for simpler setup
    // Default Special Instructions
    specialInstructions: [
      { id: 'inst-1', label: 'Less spicy', category: 'spice', active: true },
      { id: 'inst-2', label: 'Extra spicy', category: 'spice', active: true },
      { id: 'inst-3', label: 'Less salt', category: 'preparation', active: true },
      { id: 'inst-4', label: 'No butter', category: 'dietary', active: true },
      { id: 'inst-5', label: 'No nuts', category: 'dietary', active: true },
      { id: 'inst-6', label: 'No onion/garlic', category: 'dietary', active: true },
      { id: 'inst-7', label: 'Extra veggies', category: 'preparation', active: true },
      { id: 'inst-8', label: 'Well done', category: 'preparation', active: true },
      { id: 'inst-9', label: 'Separate packaging', category: 'packaging', active: true },
      { id: 'inst-10', label: 'Eco-friendly packaging', category: 'packaging', active: true },
    ],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Table modal state
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteTableTarget, setDeleteTableTarget] = useState<Table | null>(null);

  // Special Instructions modal state
  const [showSpecialInstructionModal, setShowSpecialInstructionModal] = useState(false);
  const [editingSpecialInstruction, setEditingSpecialInstruction] = useState<any | null>(null);
  const [deleteSpecialInstructionTarget, setDeleteSpecialInstructionTarget] = useState<any | null>(null);

  // Payment Details state
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    preferredMethod: 'bank' as 'bank' | 'upi',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: ''
    },
    upiDetails: {
      upiId: '',
      upiName: ''
    }
  });

  // Load settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await getRestaurantSettings(user.uid);

        if (result.success && result.data) {
          const data = result.data;
          setState({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: {
              street: data.address?.street || '',
              city: data.address?.city || '',
              postalCode: data.address?.postalCode || '',
              state: data.address?.state || '',
            },
            location: data.location || undefined,
            image: data.image || null,
            video: data.video || null,
            hours: { ...DEFAULT_HOURS, ...(data.hours || {}) },
            tables: Array.isArray(data.tables) ? data.tables.map(t => ({
              ...t,
              status: t.status || 'active'
            })) : [],
            // New restaurant details
            cuisine: data.cuisine || '',
            restaurantType: data.restaurantType || 'Both',
            dietaryOptions: data.dietaryOptions || [],
            specialties: data.specialties || [],
            amenities: data.amenities || [],
            description: data.description || '',
            topPicks: data.topPicks || [],
            deliveryTime: data.deliveryTime || '20-30 min',
            // Social Media & Links
            socialMedia: {
              facebook: data.socialMedia?.facebook || '',
              instagram: data.socialMedia?.instagram || '',
              twitter: data.socialMedia?.twitter || '',
            },
            mapDirectionsLink: data.mapDirectionsLink || '',
            // Next Visit Coupon Settings
            nextVisitCouponDiscount: data.nextVisitCouponDiscount || 10,
            // Business Type Configuration
            businessType: data.businessType || 'QSR',
            // Special Instructions Configuration
            specialInstructions: data.specialInstructions && data.specialInstructions.length > 0 
              ? data.specialInstructions 
              : [
                  { id: 'inst-1', label: 'Less spicy', category: 'spice', active: true },
                  { id: 'inst-2', label: 'Extra spicy', category: 'spice', active: true },
                  { id: 'inst-3', label: 'Less salt', category: 'preparation', active: true },
                  { id: 'inst-4', label: 'No butter', category: 'dietary', active: true },
                  { id: 'inst-5', label: 'No nuts', category: 'dietary', active: true },
                  { id: 'inst-6', label: 'No onion/garlic', category: 'dietary', active: true },
                  { id: 'inst-7', label: 'Extra veggies', category: 'preparation', active: true },
                  { id: 'inst-8', label: 'Well done', category: 'preparation', active: true },
                  { id: 'inst-9', label: 'Separate packaging', category: 'packaging', active: true },
                  { id: 'inst-10', label: 'Eco-friendly packaging', category: 'packaging', active: true },
                ],
          });
        } else {
          // No settings found, use defaults
          console.log('No restaurant settings found, using defaults');
        }

        // Load payment details
        const paymentResult = await getPaymentDetails(user.uid);
        if (paymentResult.success && paymentResult.data) {
          setPaymentDetails(paymentResult.data);
          setPaymentForm({
            preferredMethod: paymentResult.data.preferredMethod,
            bankDetails: paymentResult.data.bankDetails ? {
              accountHolderName: paymentResult.data.bankDetails.accountHolderName || '',
              accountNumber: paymentResult.data.bankDetails.accountNumber || '',
              ifscCode: paymentResult.data.bankDetails.ifscCode || '',
              bankName: paymentResult.data.bankDetails.bankName || '',
              branchName: paymentResult.data.bankDetails.branchName || ''
            } : {
              accountHolderName: '',
              accountNumber: '',
              ifscCode: '',
              bankName: '',
              branchName: ''
            },
            upiDetails: paymentResult.data.upiDetails || {
              upiId: '',
              upiName: ''
            }
          });
        }
      } catch (err: any) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid]);

  // Track changes
  const snapshot = useMemo(() => JSON.stringify(state), [state]);
  useEffect(() => {
    setIsDirty(true);
  }, [snapshot]);

  // Handlers
  function setField<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function setAddressField<K extends keyof SettingsState['address']>(key: K, value: SettingsState['address'][K]) {
    setState((s) => ({ ...s, address: { ...s.address, [key]: value } }));
  }

  function setLocation(location: { lat: number; lng: number } | undefined) {
    setState((s) => ({ ...s, location }));
  }

  function setSocialMedia(platform: 'facebook' | 'instagram' | 'twitter', value: string) {
    setState((s) => ({
      ...s,
      socialMedia: {
        ...s.socialMedia,
        [platform]: value,
      },
    }));
  }

  function setDayOpen(day: DayKey, open: boolean) {
    setState((s) => ({ ...s, hours: { ...s.hours, [day]: { ...s.hours[day], open } } }));
  }

  function setDayTime(day: DayKey, part: 'from' | 'to', value: string) {
    setState((s) => ({ ...s, hours: { ...s.hours, [day]: { ...s.hours[day], [part]: value } } }));
  }

  async function onRestaurantImageFile(file: File) {
    if (!file || !file.type.startsWith('image/')) return;
    
    try {
      setIsUploadingImage(true);
      const result = await uploadImageToCloudinary(file);
      
      if (result.success && result.url) {
        setField('image', result.url);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function onRestaurantVideoFile(file: File) {
    if (!file || !file.type.startsWith('video/')) return;
    
    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('Video file size must be less than 50MB');
      return;
    }

    try {
      setIsUploadingVideo(true);
      setUploadProgress(0);
      toast.info('Uploading video... This may take a moment.');
      
      const result = await uploadToCloudinary(
        file, 
        (progress) => {
          setUploadProgress(progress);
        }, 
        'restaurant-videos'
      );
      
      setField('video', result.secure_url);
      toast.success('Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload video');
    } finally {
      setIsUploadingVideo(false);
      setUploadProgress(0);
    }
  }

  function onRestaurantImageDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) onRestaurantImageFile(f);
  }

  function onRestaurantVideoDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) onRestaurantVideoFile(f);
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!state.name.trim()) errs.push('Business name is required.');
    if (state.phone && !/^\+?[\d\s()-]{7,}$/.test(state.phone.trim())) errs.push('Enter a valid phone number.');
    if (state.email && !/^\S+@\S+\.\S+$/.test(state.email.trim())) errs.push('Enter a valid email address.');
    return errs;
  }

  async function save() {
    if (!user?.uid) {
      setError('You must be logged in to save settings.');
      return;
    }

    const errs = validate();
    if (errs.length) {
      alert('Please fix the following:\n\n' + errs.map((e) => `• ${e}`).join('\n'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Helper function to recursively remove undefined values
      const removeUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return null; // Convert undefined to null for Firestore
        }
        
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined);
        }
        
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              cleaned[key] = removeUndefined(value);
            }
          }
          return cleaned;
        }
        
        return obj;
      };

      // Ensure discount percentage has a valid value before saving
      const stateToSave = {
        ...state,
        nextVisitCouponDiscount: state.nextVisitCouponDiscount || 10
      };

      const cleanSettings = removeUndefined(stateToSave);
      
      const result = await saveRestaurantSettings(user.uid, cleanSettings);

      if (result.success) {
        setSavedAt(new Date().toLocaleString());
        setIsDirty(false);
        toast.success('Settings saved successfully');
      } else {
        setError(result.error || 'Failed to save settings. Please try again.');
      }
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function discard() {
    if (!user?.uid) {
      setError('You must be logged in to discard changes.');
      return;
    }

    try {
      setError(null);
      const result = await getRestaurantSettings(user.uid);

      if (result.success && result.data) {
        const data = result.data;
        setState({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: {
            street: data.address?.street || '',
            city: data.address?.city || '',
            postalCode: data.address?.postalCode || '',
            state: data.address?.state || '',
          },
          location: data.location || undefined,
          image: data.image || null,
          video: data.video || null,
          hours: { ...DEFAULT_HOURS, ...(data.hours || {}) },
          tables: Array.isArray(data.tables) ? data.tables.map(t => ({
            ...t,
            status: t.status || 'active'
          })) : [],
          // New restaurant details
          cuisine: data.cuisine || '',
          restaurantType: data.restaurantType || 'Both',
          dietaryOptions: data.dietaryOptions || [],
          specialties: data.specialties || [],
          amenities: data.amenities || [],
          description: data.description || '',
          topPicks: data.topPicks || [],
          deliveryTime: data.deliveryTime || '20-30 min',
          // Social Media & Links
          socialMedia: {
            facebook: data.socialMedia?.facebook || '',
            instagram: data.socialMedia?.instagram || '',
            twitter: data.socialMedia?.twitter || '',
          },
          mapDirectionsLink: data.mapDirectionsLink || '',
          // Next Visit Coupon Settings
          nextVisitCouponDiscount: data.nextVisitCouponDiscount || 10,
          nextVisitCouponEnabled: data.nextVisitCouponEnabled !== undefined ? data.nextVisitCouponEnabled : true,
          // Business Type Configuration
          businessType: data.businessType || 'QSR',
          // Special Instructions Configuration
          specialInstructions: data.specialInstructions && data.specialInstructions.length > 0 
            ? data.specialInstructions 
            : [
                { id: 'inst-1', label: 'Less spicy', category: 'spice', active: true },
                { id: 'inst-2', label: 'Extra spicy', category: 'spice', active: true },
                { id: 'inst-3', label: 'Less salt', category: 'preparation', active: true },
                { id: 'inst-4', label: 'No butter', category: 'dietary', active: true },
                { id: 'inst-5', label: 'No nuts', category: 'dietary', active: true },
                { id: 'inst-6', label: 'No onion/garlic', category: 'dietary', active: true },
                { id: 'inst-7', label: 'Extra veggies', category: 'preparation', active: true },
                { id: 'inst-8', label: 'Well done', category: 'preparation', active: true },
                { id: 'inst-9', label: 'Separate packaging', category: 'packaging', active: true },
                { id: 'inst-10', label: 'Eco-friendly packaging', category: 'packaging', active: true },
              ],
        });
      } else {
        // Reset to defaults if no saved data
        setState({
          name: '',
          phone: '',
          email: '',
          address: { street: '', city: '', postalCode: '', state: '' },
          location: undefined,
          image: null,
          video: null,
          hours: DEFAULT_HOURS,
          tables: [],
          // New restaurant details
          cuisine: '',
          restaurantType: 'Both',
          dietaryOptions: [],
          specialties: [],
          amenities: [],
          description: '',
          topPicks: [],
          deliveryTime: '20-30 min',
          // Social Media & Links
          socialMedia: {
            facebook: '',
            instagram: '',
            twitter: '',
          },
          mapDirectionsLink: '',
        });
      }
      setIsDirty(false);
    } catch (err: any) {
      console.error('Error discarding changes:', err);
      setError('Failed to discard changes. Please try again.');
    }
  }

  // Table management
  function openAddTable() {
    setEditingTable(null);
    setShowTableModal(true);
  }

  function openEditTable(t: Table) {
    setEditingTable(t);
    setShowTableModal(true);
  }

  function upsertTable(payload: Table | (Omit<Table, 'id'> & { id?: string })) {
    setState((s) => {
      if ('id' in payload && payload.id && s.tables.some(t => t.id === payload.id)) {
        return { 
          ...s, 
          tables: s.tables.map((it) => (it.id === payload.id ? payload as Table : it)) 
        };
      }
      const newTable: Table = {
        id: 'id' in payload && payload.id ? payload.id : uid('tbl'),
        number: payload.number,
        capacity: payload.capacity,
        status: payload.status
      };
      return { 
        ...s, 
        tables: [...s.tables, newTable] 
      };
    });
    setShowTableModal(false);
  }

  function requestDeleteTable(t: Table) {
    setDeleteTableTarget(t);
  }

  function confirmDeleteTable() {
    if (!deleteTableTarget) return;
    setState((s) => ({ ...s, tables: s.tables.filter((it) => it.id !== deleteTableTarget.id) }));
    setDeleteTableTarget(null);
  }

  // Special Instructions management
  function openAddSpecialInstruction() {
    setEditingSpecialInstruction(null);
    setShowSpecialInstructionModal(true);
  }

  function openEditSpecialInstruction(instruction: any) {
    setEditingSpecialInstruction(instruction);
    setShowSpecialInstructionModal(true);
  }

  function upsertSpecialInstruction(payload: any) {
    setState((s) => {
      const currentInstructions = s.specialInstructions || [];
      if (payload.id && currentInstructions.some(inst => inst.id === payload.id)) {
        return { 
          ...s, 
          specialInstructions: currentInstructions.map((it) => (it.id === payload.id ? payload : it)) 
        };
      }
      const newInstruction = {
        id: payload.id || uid('inst'),
        label: payload.label,
        category: payload.category,
        active: payload.active !== undefined ? payload.active : true
      };
      return { 
        ...s, 
        specialInstructions: [...currentInstructions, newInstruction] 
      };
    });
    setShowSpecialInstructionModal(false);
  }

  function toggleSpecialInstructionStatus(instructionId: string) {
    setState((s) => ({
      ...s,
      specialInstructions: (s.specialInstructions || []).map((inst) =>
        inst.id === instructionId ? { ...inst, active: !inst.active } : inst
      )
    }));
  }

  function requestDeleteSpecialInstruction(instruction: any) {
    setDeleteSpecialInstructionTarget(instruction);
  }

  function confirmDeleteSpecialInstruction() {
    if (!deleteSpecialInstructionTarget) return;
    setState((s) => ({ 
      ...s, 
      specialInstructions: (s.specialInstructions || []).filter((it) => it.id !== deleteSpecialInstructionTarget.id) 
    }));
    setDeleteSpecialInstructionTarget(null);
  }

  // Payment Details management
  const handleSavePaymentDetails = async () => {
    if (!user?.uid) return;

    try {
      const restaurantResult = await getRestaurantSettings(user.uid);
      const restaurantName = restaurantResult.success && restaurantResult.data 
        ? restaurantResult.data.name 
        : 'Restaurant';

      const paymentData: any = {
        restaurantId: user.uid,
        restaurantName,
        preferredMethod: paymentForm.preferredMethod,
        isVerified: false // Will be verified by super admin
      };

      // Only include the relevant payment details
      if (paymentForm.preferredMethod === 'bank') {
        paymentData.bankDetails = {
          accountHolderName: paymentForm.bankDetails.accountHolderName.trim(),
          accountNumber: paymentForm.bankDetails.accountNumber.trim(),
          ifscCode: paymentForm.bankDetails.ifscCode.trim(),
          bankName: paymentForm.bankDetails.bankName.trim(),
          ...(paymentForm.bankDetails.branchName.trim() && { branchName: paymentForm.bankDetails.branchName.trim() })
        };
      } else if (paymentForm.preferredMethod === 'upi') {
        paymentData.upiDetails = {
          upiId: paymentForm.upiDetails.upiId.trim(),
          upiName: paymentForm.upiDetails.upiName.trim()
        };
      }

      const result = await savePaymentDetails(user.uid, paymentData);
      
      if (result.success) {
        setPaymentDetails(result.data as PaymentDetails);
        setShowPaymentModal(false);
        toast.success('Payment details saved successfully');
      } else {
        toast.error('Failed to save payment details: ' + result.error);
      }
    } catch (error: any) {
      toast.error('Error saving payment details: ' + error.message);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !user?.uid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You must be logged in to access restaurant settings.
          </p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Page header */}
        <div className="mb-8 sm:mb-10 lg:mb-12 animate-slide-in-from-top">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-2">Restaurant Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            Manage your restaurant's information and settings
          </p>
        </div>

        

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Business Type Selection */}
        <SectionCard title="Business Type Configuration" icon={<Settings className="h-6 w-6" />} className="border-2 border-gray-300 dark:border-gray-600">
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Settings className="h-5 w-5 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Choose Your Business Model</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Select the type that best matches your restaurant to optimize your platform experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QSR Option */}
              <div
                className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  state.businessType === 'QSR'
                    ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-700 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => setField('businessType', 'QSR')}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    state.businessType === 'QSR'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    <Coffee className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {BUSINESS_TYPE_INFO.QSR.name}
                      </h3>
                      {state.businessType === 'QSR' && (
                        <CheckCircle2 className="h-5 w-5 text-gray-900 dark:text-white" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {BUSINESS_TYPE_INFO.QSR.description}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Key Features:</p>
                      {BUSINESS_TYPE_INFO.QSR.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-900 dark:bg-white rounded-full"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RESTO Option */}
              <div
                className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  state.businessType === 'RESTO'
                    ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-700 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => setField('businessType', 'RESTO')}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    state.businessType === 'RESTO'
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    <UtensilsCrossed className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {BUSINESS_TYPE_INFO.RESTO.name}
                      </h3>
                      {state.businessType === 'RESTO' && (
                        <CheckCircle2 className="h-5 w-5 text-gray-900 dark:text-white" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {BUSINESS_TYPE_INFO.RESTO.description}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Key Features:</p>
                      {BUSINESS_TYPE_INFO.RESTO.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-900 dark:bg-white rounded-full"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>


        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Business Name */}
          <SectionCard title="Business Name" icon={<Building2 className="h-6 w-6" />}>
            <div className="space-y-6">
              <div>
                <label htmlFor="restaurant-name" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Restaurant Name *
                </label>
                <input
                  id="restaurant-name"
                  type="text"
                  value={state.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g., The Gourmet Corner"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
              </div>
            </div>
          </SectionCard>

          {/* Restaurant Image */}
          <SectionCard title="Restaurant Image" icon={<Utensils className="h-6 w-6" />}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a high-quality image of your restaurant. This will be displayed on the homepage and restaurant listings.
            </p>
            {state.image ? (
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="relative group w-full sm:w-auto">
                  <img
                    src={state.image}
                    alt="Restaurant"
                    className="w-full sm:w-64 h-48 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300" />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => restaurantImageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <Upload className="h-4 w-4" /> Replace
                  </button>
                  <button
                    onClick={() => setField('image', null)}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={onRestaurantImageDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              >
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                  <Upload className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Drag and drop or browse to upload your restaurant image.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Recommended size: 1200x800px (16:9 ratio)</p>
                <button
                  onClick={() => restaurantImageInputRef.current?.click()}
                  className="bg-black text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition-all duration-200"
                >
                  Browse Files
                </button>
              </div>
            )}

            <input
              ref={restaurantImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onRestaurantImageFile(f);
              }}
            />
          </SectionCard>

          {/* Restaurant Video */}
          <SectionCard title="Restaurant Video (Optional)" icon={<Video className="h-6 w-6" />}>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a short video of your restaurant. This will be displayed as a background video on mobile devices for an enhanced user experience. Maximum file size: 50MB.
            </p>
            {state.video ? (
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="relative group w-full sm:w-auto">
                  <video
                    src={state.video}
                    className="w-full sm:w-64 h-48 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-lg"
                    controls
                    preload="metadata"
                  >
                    <source src={state.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => restaurantVideoInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" /> 
                    {isUploadingVideo ? 'Uploading...' : 'Replace Video'}
                  </button>
                  <button
                    onClick={() => setField('video', null)}
                    disabled={isUploadingVideo}
                    className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Remove Video
                  </button>
                  {isUploadingVideo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                        Uploading video... {uploadProgress}%
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gray-900 dark:bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Video will be optimized for mobile viewing
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>✓ Click video to play/pause</p>
                    <p>✓ Hover to show controls</p>
                    <p>✓ Click fullscreen for better view</p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDrop={onRestaurantVideoDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              >
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                  <Video className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Drag and drop or browse to upload your restaurant video.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Supported formats: MP4, MOV, AVI • Max size: 50MB
                </p>
                <button
                  onClick={() => restaurantVideoInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  className="bg-black text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingVideo ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Browse Files'
                  )}
                </button>
                {isUploadingVideo && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-gray-900 dark:text-white">
                      Uploading... {uploadProgress}%
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gray-900 dark:bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              ref={restaurantVideoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onRestaurantVideoFile(f);
              }}
            />
          </SectionCard>

          {/* Contact Information */}
          <SectionCard title="Contact Information" icon={<Phone className="h-6 w-6" />}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="phone-number" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="phone-number"
                      type="tel"
                      value={state.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      placeholder="91 6389055072"
                      className="w-full pl-9 form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={state.email}
                      onChange={(e) => setField('email', e.target.value)}
                      placeholder="contact@gourmetcorner.com"
                      className="w-full pl-9 form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Restaurant Address */}
          <SectionCard title="Restaurant Address" icon={<Building2 className="h-6 w-6" />}>
            <div className="space-y-6">
              <div>
                <label htmlFor="street-address" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Street Address
                </label>
                <input
                  id="street-address"
                  type="text"
                  value={state.address.street}
                  onChange={(e) => setAddressField('street', e.target.value)}
                  placeholder="123 Main Street, Suite 100"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={state.address.city}
                    onChange={(e) => setAddressField('city', e.target.value)}
                    placeholder="New York"
                    className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    State/Province
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={state.address.state}
                    onChange={(e) => setAddressField('state', e.target.value)}
                    placeholder="NY"
                    className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="postal-code" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Postal Code
                  </label>
                  <input
                    id="postal-code"
                    type="text"
                    value={state.address.postalCode}
                    onChange={(e) => setAddressField('postalCode', e.target.value)}
                    placeholder="10001"
                    className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

            {/* Restaurant Location */}
            <SectionCard title="Restaurant Location" icon={<MapPin className="h-6 w-6" />}>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Set the exact location of your restaurant. This helps customers find you easily and enables accurate delivery estimates.
                </p>
                <LocationPicker 
                  location={state.location} 
                  onLocationChange={setLocation} 
                />
              </div>
            </div>
          </SectionCard>

          {/* Opening Hours */}
          <SectionCard title="Opening Hours" icon={<ClockIcon className="h-6 w-6" />}>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {days.map((day, index) => {
                const d = state.hours[day];
                return (
                  <div key={day} className="flex flex-col lg:flex-row lg:items-center justify-between py-3 sm:py-4 gap-3">
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{day}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {d.open ? `${d.from} - ${d.to}` : 'Closed'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={d.open}
                          onChange={(e) => setDayOpen(day, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-black transition-colors duration-300">
                          <div className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-transform duration-300 ${d.open ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </label>

                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={d.from}
                          disabled={!d.open}
                          onChange={(e) => setDayTime(day, 'from', e.target.value)}
                          className="form-input p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 w-full sm:w-auto text-gray-900 dark:text-gray-100"
                        />
                        <span className="text-gray-500 hidden sm:inline">–</span>
                        <input
                          type="time"
                          value={d.to}
                          disabled={!d.open}
                          onChange={(e) => setDayTime(day, 'to', e.target.value)}
                          className="form-input p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 w-full sm:w-auto text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>



          {/* Restaurant Details */}
          <SectionCard title="Restaurant Details" icon={<Utensils className="h-6 w-6" />}>
            <div className="space-y-6">
              {/* Cuisine Type */}
              <div>
                <label htmlFor="cuisine" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Cuisine Type
                </label>
                <input
                  id="cuisine"
                  type="text"
                  value={state.cuisine || ''}
                  onChange={(e) => {
                    const limitedText = limitByWords(e.target.value, 10);
                    setField('cuisine', limitedText);
                  }}
                  placeholder="e.g., Italian, Indian, Chinese, Mexican"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                  {countWords(state.cuisine || '')}/10 words
                </div>
              </div>

              {/* Restaurant Type */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Restaurant Type
                </label>
                <div className="flex gap-4">
                  {(['Veg', 'Non-Veg', 'Both'] as const).map((type) => (
                    <label key={type} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="restaurantType"
                        value={type}
                        checked={state.restaurantType === type}
                        onChange={(e) => setField('restaurantType', e.target.value as 'Veg' | 'Non-Veg' | 'Both')}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full peer-checked:border-black dark:peer-checked:border-white peer-checked:bg-black dark:peer-checked:bg-white relative">
                        <div className="absolute inset-0.5 bg-white dark:bg-gray-800 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>


              {/* Description */}
<div>
                <label htmlFor="description" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Restaurant Description
                </label>
                <textarea
                  id="description"
                  value={state.description || ''}
                  onChange={(e) => {
                    const limitedText = limitByWords(e.target.value, 70);
                    setField('description', limitedText);
                  }}
                  placeholder="Tell customers about your restaurant, what makes it special..."
                  rows={3}
                  className="w-full form-textarea bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200 resize-none"
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                  {countWords(state.description || '')}/70 words
                </div>
              </div>
              {/* Delivery Time */}
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Delivery Time
                </label>
                <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={state.deliveryTime?.split('-')[0] || '20'}
                    onChange={(e) => {
                      const minTime = e.target.value;
                      const maxTime = state.deliveryTime?.split('-')[1] || '30';
                      setField('deliveryTime', `${minTime}-${maxTime}`);
                    }}
                    placeholder="20"
                    min="1"
                    max="120"
                    className="w-20 form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">-</span>
                  <input
                    type="number"
                    value={state.deliveryTime?.split('-')[1] || '30'}
                    onChange={(e) => {
                      const minTime = state.deliveryTime?.split('-')[0] || '20';
                      const maxTime = e.target.value;
                      setField('deliveryTime', `${minTime}-${maxTime}`);
                    }}
                    placeholder="30"
                    min="1"
                    max="120"
                    className="w-20 form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">min</span>
                </div>
              </div>

            </div>
          </SectionCard>

          {/* Specialties & Features */}
          <SectionCard title="Specialties & Features" icon={<Sparkles className="h-6 w-6" />}>
            <div className="space-y-6">
              {/* Specialties */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Specialties (What you're famous for)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {state.specialties?.map((specialty, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full text-sm">
                      {specialty}
                      <button
                        onClick={() => setField('specialties', state.specialties?.filter((_, i) => i !== index) || [])}
                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Add specialty (e.g., Pizza, Burgers, Sushi)"
                    className="flex-1 form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const value = e.currentTarget.value.trim();
                        if (value && !state.specialties?.includes(value)) {
                          setField('specialties', [...(state.specialties || []), value]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const value = input.value.trim();
                      if (value && !state.specialties?.includes(value)) {
                        setField('specialties', [...(state.specialties || []), value]);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Dietary Options */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Dietary Options
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Keto', 'Paleo'].map((option) => (
                    <label key={option} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.dietaryOptions?.includes(option) || false}
                        onChange={(e) => {
                          const current = state.dietaryOptions || [];
                          if (e.target.checked) {
                            setField('dietaryOptions', [...current, option]);
                          } else {
                            setField('dietaryOptions', current.filter(item => item !== option));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black focus:ring-2"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Amenities
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {['Wi-Fi', 'Outdoor Seating', 'Pet-Friendly', 'Parking', 'Delivery', 'Takeout', 'Reservations', 'Live Music'].map((amenity) => (
                    <label key={amenity} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.amenities?.includes(amenity) || false}
                        onChange={(e) => {
                          const current = state.amenities || [];
                          if (e.target.checked) {
                            setField('amenities', [...current, amenity]);
                          } else {
                            setField('amenities', current.filter(item => item !== amenity));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black focus:ring-2"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Social Media Links */}
          <SectionCard title="Social Media Links" icon={<Share2 className="h-6 w-6" />}>
            <div className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect your social media profiles to help customers find and follow you online.
              </p>

              {/* Facebook */}
              <div>
                <label htmlFor="facebook" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-gray-900 dark:text-white" />
                    Facebook
                  </div>
                </label>
                <input
                  id="facebook"
                  type="url"
                  value={state.socialMedia?.facebook || ''}
                  onChange={(e) => setSocialMedia('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourrestaurant"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
              </div>

              {/* Instagram */}
              <div>
                <label htmlFor="instagram" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-gray-900 dark:text-white" />
                    Instagram
                  </div>
                </label>
                <input
                  id="instagram"
                  type="url"
                  value={state.socialMedia?.instagram || ''}
                  onChange={(e) => setSocialMedia('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourrestaurant"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
              </div>

              {/* Twitter */}
              <div>
                <label htmlFor="twitter" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-5 h-5 text-gray-900 dark:text-white" />
                    Twitter / X
                  </div>
                </label>
                <input
                  id="twitter"
                  type="url"
                  value={state.socialMedia?.twitter || ''}
                  onChange={(e) => setSocialMedia('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourrestaurant"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
              </div>
            </div>
          </SectionCard>

          {/* Map Directions Link */}
          <SectionCard title="Map & Directions" icon={<Navigation className="h-6 w-6" />}>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add a Google Maps link to help customers get directions to your restaurant easily.
              </p>

              <div>
                <label htmlFor="mapDirectionsLink" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Google Maps Directions Link
                </label>
                <input
                  id="mapDirectionsLink"
                  type="url"
                  value={state.mapDirectionsLink || ''}
                  onChange={(e) => setField('mapDirectionsLink', e.target.value)}
                  placeholder="https://maps.google.com/?q=Your+Restaurant+Name"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  💡 Tip: Search your restaurant on Google Maps, click "Share", and copy the link.
                </p>
              </div>

              {/* Preview Button */}
              {state.mapDirectionsLink && (
                <div className="pt-2">
                  <a
                    href={state.mapDirectionsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    <Navigation className="w-4 h-4" />
                    Preview Directions
                  </a>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Next Visit Coupon Settings */}
          <SectionCard title="Next Visit Coupon Settings" icon={<Star className="h-6 w-6" />}>
            <div className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Enable Next Visit Coupons
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Turn on/off the next visit coupon feature for your customers
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.nextVisitCouponEnabled !== false}
                    onChange={(e) => setField('nextVisitCouponEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-gray-500 transition-colors duration-300">
                    <div className={`absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-transform duration-300 ${
                      state.nextVisitCouponEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </label>
              </div>

              {state.nextVisitCouponEnabled !== false && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure the discount percentage for next visit coupons. Customers get one coupon per day after completing an order.
                  </p>

                  {/* Coupon Discount Percentage */}
                  <div>
                    <label htmlFor="couponDiscount" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                      Discount Percentage
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="couponDiscount"
                        type="number"
                        min="1"
                        max="50"
                        value={state.nextVisitCouponDiscount || ''}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === '') {
                            setField('nextVisitCouponDiscount', undefined);
                          } else {
                            const numValue = parseInt(inputValue);
                            if (!isNaN(numValue)) {
                              const value = Math.min(50, Math.max(1, numValue));
                              setField('nextVisitCouponDiscount', value);
                            }
                          }
                        }}
                        placeholder="10"
                        className="w-24 form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">% off</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Customers will receive a {state.nextVisitCouponDiscount || 10}% discount coupon for their next visit. Range: 1-50%
                    </p>
                  </div>

                  {/* Coupon Info */}
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                          How Next Visit Coupons Work
                        </h4>
                        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <li>• Customers get 1 coupon per day after completing an order</li>
                          <li>• Coupons are valid for 30 days from issue date</li>
                          <li>• Customers can view and use coupons from their profile</li>
                          <li>• Coupons are automatically applied during checkout</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {state.nextVisitCouponEnabled === false && (
                <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 text-gray-400 mx-auto mb-3 flex items-center justify-center">
                    <Star className="h-8 w-8" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Visit Coupons Disabled</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Enable the toggle above to start offering next visit coupons to your customers
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Add/Edit Table Modal */}
        {showTableModal && (
          <TableModal
            onClose={() => setShowTableModal(false)}
            onSave={(payload) => upsertTable(payload)}
            table={editingTable ?? undefined}
          />
        )}

        {/* Add/Edit Special Instruction Modal */}
        {showSpecialInstructionModal && (
          <SpecialInstructionModal
            instruction={editingSpecialInstruction}
            onSave={upsertSpecialInstruction}
            onClose={() => setShowSpecialInstructionModal(false)}
          />
        )}

        {/* Payment Details Modal */}
        {showPaymentModal && (
          <PaymentDetailsModal
            paymentForm={paymentForm}
            setPaymentForm={setPaymentForm}
            onSave={handleSavePaymentDetails}
            onClose={() => setShowPaymentModal(false)}
          />
        )}

        {/* Confirm Delete Table Modal */}
        {deleteTableTarget && (
          <ConfirmDeleteModal
            name={`Table ${deleteTableTarget.number}`}
            onCancel={() => setDeleteTableTarget(null)}
            onConfirm={confirmDeleteTable}
          />
        )}

        {/* Confirm Delete Special Instruction Modal */}
        {deleteSpecialInstructionTarget && (
          <ConfirmDeleteModal
            name={deleteSpecialInstructionTarget.label}
            onCancel={() => setDeleteSpecialInstructionTarget(null)}
            onConfirm={confirmDeleteSpecialInstruction}
          />
        )}

        {/* Sticky Save/Discard Bar */}
        {isDirty && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg p-4 z-40">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">You have unsaved changes</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {savedAt ? `Last saved: ${savedAt}` : 'Changes not saved yet'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={discard}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    onClick={save}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-6 py-2 text-sm font-semibold text-white bg-black hover:bg-gray-800 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <br/>
        {/* Table Management - Only for RESTO */}
        <BusinessTypeGate businessType="RESTO">
          <SectionCard title="Table Management" icon={<MapPin className="h-6 w-6" />}>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Restaurant Tables</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure your tables for reservation management
                  </p>
                </div>
                <button
                  onClick={openAddTable}
                  className="bg-black text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 inline-flex items-center gap-2 transition-all duration-200 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" /> Add Table
                </button>
              </div>

              {state.tables.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">No tables configured</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                    Add tables to enable table management in reservations
                  </p>
                  <button
                    onClick={openAddTable}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add Your First Table
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th scope="col" className="py-3 pr-6 font-semibold">Table Number</th>
                        <th scope="col" className="py-3 px-6 font-semibold">Capacity</th>
                        <th scope="col" className="py-3 px-6 font-semibold">Status</th>
                        <th scope="col" className="py-3 pl-6 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.tables.map((t, idx) => (
                        <tr
                          key={t.id}
                          className={cx(
                            'border-b border-gray-200 dark:border-gray-700',
                            idx === state.tables.length - 1 && 'border-b-0'
                          )}
                        >
                          <td className="py-4 pr-6 text-gray-900 dark:text-gray-100 font-medium">{t.number}</td>
                          <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                            {t.capacity} seats
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={cx(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              t.status === 'active'
                                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                                : 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-300'
                            )}
                          >
                            {t.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 pl-6 text-right">
                          <div className="flex flex-col sm:flex-row items-end sm:justify-end gap-1 sm:gap-2">
                            <button
                              onClick={() => openEditTable(t)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm"
                            >
                              <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => requestDeleteTable(t)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quick Stats */}
            {state.tables.length > 0 && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{state.tables.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Tables</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {state.tables.filter((t) => t.status === 'active').length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {state.tables.reduce((sum, t) => sum + t.capacity, 0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(state.tables.reduce((sum, t) => sum + t.capacity, 0) / state.tables.length).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Capacity</div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
        </BusinessTypeGate>

        {/* Special Instructions Management */}
        <SectionCard title="Special Instructions" icon={<FileText className="h-6 w-6" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Quick options for customer checkout</p>
              <button
                onClick={() => {
                  setEditingSpecialInstruction(null);
                  setShowSpecialInstructionModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {/* Special Instructions List - Compact Grid */}
            {(state.specialInstructions && state.specialInstructions.length > 0) ? (
              <div className="flex flex-wrap gap-2">
                {state.specialInstructions.map((instruction) => (
                  <div
                    key={instruction.id}
                    className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                      instruction.active
                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium cursor-pointer ${
                        instruction.active
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 line-through'
                      }`}
                      onClick={() => toggleSpecialInstructionStatus(instruction.id)}
                      title={instruction.active ? 'Click to disable' : 'Click to enable'}
                    >
                      {instruction.label}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={() => openEditSpecialInstruction(instruction)}
                        className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded"
                        title="Edit"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => requestDeleteSpecialInstruction(instruction)}
                        className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No instructions yet. Click "Add" to create one.</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Payment Details Management */}
        <SectionCard title="Payment Details" icon={<CreditCard className="h-6 w-6" />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure your bank account or UPI details for receiving payouts
                </p>
                {paymentDetails?.isVerified && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-gray-900 dark:text-white" />
                    <span className="text-xs text-gray-900 dark:text-white">Verified</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
              >
                {paymentDetails ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span className="hidden sm:inline">{paymentDetails ? 'Edit' : 'Add'}</span>
              </button>
            </div>

            {paymentDetails ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    paymentDetails.preferredMethod === 'bank'
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {paymentDetails.preferredMethod === 'bank' ? (
                      <Building className="h-5 w-5 text-gray-900 dark:text-white" />
                    ) : (
                      <Smartphone className="h-5 w-5 text-gray-900 dark:text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {paymentDetails.preferredMethod === 'bank' ? 'Bank Account' : 'UPI Details'}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Preferred payment method
                    </p>
                  </div>
                </div>

                {paymentDetails.preferredMethod === 'bank' && paymentDetails.bankDetails && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Account Holder:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {paymentDetails.bankDetails.accountHolderName}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {paymentDetails.bankDetails.bankName}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                        <p className="font-mono text-gray-900 dark:text-white">
                          ****{paymentDetails.bankDetails.accountNumber.slice(-4)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">IFSC Code:</span>
                        <p className="font-mono text-gray-900 dark:text-white">
                          {paymentDetails.bankDetails.ifscCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentDetails.preferredMethod === 'upi' && paymentDetails.upiDetails && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">UPI ID:</span>
                        <p className="font-mono text-gray-900 dark:text-white">
                          {paymentDetails.upiDetails.upiId}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Name:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {paymentDetails.upiDetails.upiName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No payment details configured</p>
                <p className="text-xs mt-1">Add your bank or UPI details to receive payouts</p>
              </div>
            )}
          </div>
        </SectionCard>


      </div>
    </div>
  );
}

/* ----------------------------- Table Modal ------------------------------ */

function TableModal(props: {
  table?: Table;
  onSave: (payload: Table | (Omit<Table, 'id'> & { id?: string })) => void;
  onClose: () => void;
}) {
  const [number, setNumber] = useState(props.table?.number ?? '');
  const [capacity, setCapacity] = useState(props.table?.capacity ?? 2);
  const [status, setStatus] = useState<'active' | 'inactive'>(props.table?.status ?? 'active');

  function save() {
    if (!number.trim()) {
      alert('Table number is required.');
      return;
    }
    if (capacity < 1) {
      alert('Capacity must be at least 1.');
      return;
    }
    
    const tableData: Table = {
      id: props.table?.id || uid('tbl'),
      number: number.trim(),
      capacity,
      status
    };
    
    props.onSave(tableData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={props.onClose} />
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <MapPin className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-black dark:text-white">
              {props.table ? 'Edit Table' : 'Add Table'}
            </h4>
          </div>
          <button
            onClick={props.onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Table Number</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g., T1, A1, 101"
              className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Capacity (Seats)</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="20"
              placeholder="2"
              className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full form-select bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={props.onClose}
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Confirm Delete Modal ------------------------- */

function ConfirmDeleteModal(props: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={props.onCancel} />
      <div className="relative w-full max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-slide-in-from-bottom">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Trash2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-black dark:text-white">Confirm Delete</h4>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to remove <span className="font-semibold text-black dark:text-white">{props.name}</span>? This action cannot be undone.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={props.onCancel}
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={props.onConfirm}
            className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Special Instruction Modal ----------------------- */

function SpecialInstructionModal(props: {
  instruction?: { id: string; label: string; category: string; active: boolean } | null;
  onSave: (payload: { id?: string; label: string; category: string; active: boolean }) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(props.instruction?.label ?? '');
  const isEditing = !!props.instruction;

  function save() {
    if (!label.trim()) {
      alert('Instruction text is required.');
      return;
    }
    
    // Check if input contains commas - split into multiple instructions
    if (!isEditing && label.includes(',')) {
      const instructions = label.split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      
      // Save each instruction separately
      instructions.forEach((instructionLabel: string) => {
        props.onSave({ 
          label: instructionLabel, 
          category: 'other',
          active: true 
        });
      });
      return;
    }
    
    // Single instruction save
    props.onSave({ 
      id: props.instruction?.id, 
      label: label.trim(), 
      category: 'other',
      active: true
    });
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={props.onClose} />
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-slide-in-from-bottom">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-black dark:text-white">
            {isEditing ? 'Edit Instruction' : 'Add Special Instruction'}
          </h4>
          <button
            onClick={props.onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Instruction Text
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isEditing ? "Edit your instruction" : "Type instruction(s) - use commas to add multiple"}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isEditing ? 'Press Enter to save quickly' : 'Tip: Use commas to add multiple at once (e.g., "Less spicy, No nuts, Extra sauce")'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={props.onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200"
          >
            {isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
/* ----------------------- Payment Details Modal ----------------------- */

function PaymentDetailsModal(props: {
  paymentForm: {
    preferredMethod: 'bank' | 'upi';
    bankDetails: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName: string;
    };
    upiDetails: {
      upiId: string;
      upiName: string;
    };
  };
  setPaymentForm: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    // Validate form
    if (props.paymentForm.preferredMethod === 'bank') {
      if (!props.paymentForm.bankDetails.accountHolderName.trim() ||
          !props.paymentForm.bankDetails.accountNumber.trim() ||
          !props.paymentForm.bankDetails.ifscCode.trim() ||
          !props.paymentForm.bankDetails.bankName.trim()) {
        alert('Please fill all required bank details');
        return;
      }
    } else {
      if (!props.paymentForm.upiDetails.upiId.trim() ||
          !props.paymentForm.upiDetails.upiName.trim()) {
        alert('Please fill all required UPI details');
        return;
      }
    }

    setIsLoading(true);
    try {
      await props.onSave();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={props.onClose} />
      <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-black dark:text-white">
            Payment Details
          </h4>
          <button
            onClick={props.onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              Preferred Payment Method
            </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => props.setPaymentForm({
                    ...props.paymentForm,
                    preferredMethod: 'bank'
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    props.paymentForm.preferredMethod === 'bank'
                      ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <Building className="h-6 w-6 mx-auto mb-2 text-gray-900 dark:text-white" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Bank Account</p>
                </button>
                <button
                  type="button"
                  onClick={() => props.setPaymentForm({
                    ...props.paymentForm,
                    preferredMethod: 'upi'
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    props.paymentForm.preferredMethod === 'upi'
                      ? 'border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <Smartphone className="h-6 w-6 mx-auto mb-2 text-gray-900 dark:text-white" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">UPI</p>
                </button>
              </div>
          </div>

          {/* Bank Details Form */}
          {props.paymentForm.preferredMethod === 'bank' && (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900 dark:text-white">Bank Account Details</h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    value={props.paymentForm.bankDetails.accountHolderName}
                    onChange={(e) => props.setPaymentForm({
                      ...props.paymentForm,
                      bankDetails: {
                        ...props.paymentForm.bankDetails,
                        accountHolderName: e.target.value
                      }
                    })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="Enter account holder name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={props.paymentForm.bankDetails.accountNumber}
                    onChange={(e) => props.setPaymentForm({
                      ...props.paymentForm,
                      bankDetails: {
                        ...props.paymentForm.bankDetails,
                        accountNumber: e.target.value
                      }
                    })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="Enter account number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={props.paymentForm.bankDetails.ifscCode}
                    onChange={(e) => props.setPaymentForm({
                      ...props.paymentForm,
                      bankDetails: {
                        ...props.paymentForm.bankDetails,
                        ifscCode: e.target.value.toUpperCase()
                      }
                    })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="Enter IFSC code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={props.paymentForm.bankDetails.bankName}
                    onChange={(e) => props.setPaymentForm({
                      ...props.paymentForm,
                      bankDetails: {
                        ...props.paymentForm.bankDetails,
                        bankName: e.target.value
                      }
                    })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="Enter bank name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={props.paymentForm.bankDetails.branchName}
                    onChange={(e) => props.setPaymentForm({
                      ...props.paymentForm,
                      bankDetails: {
                        ...props.paymentForm.bankDetails,
                        branchName: e.target.value
                      }
                    })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="Enter branch name (optional)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* UPI Details Form */}
          {props.paymentForm.preferredMethod === 'upi' && (
            <div className="space-y-4">
              <h5 className="font-medium text-gray-900 dark:text-white">UPI Details</h5>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    UPI ID *
                  </label>
                  <input
                    type="text"
                    value={props.paymentForm.upiDetails.upiId}
                    onChange={(e) => props.setPaymentForm({
                      ...props.paymentForm,
                      upiDetails: {
                        ...props.paymentForm.upiDetails,
                        upiId: e.target.value
                      }
                    })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="example@paytm or 9876543210@ybl"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Name on UPI *
                  </label>
                  <input
                    type="text"
                    value={props.paymentForm.upiDetails.upiName}
                    onChange={(e) => props.setPaymentForm({
                      ...props.paymentForm,
                      upiDetails: {
                        ...props.paymentForm.upiDetails,
                        upiName: e.target.value
                      }
                    })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                    placeholder="Enter name as registered with UPI"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-900 dark:text-white mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Security Notice</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                  Your payment details are encrypted and stored securely. They will be verified by our team before being used for payouts.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={props.onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
}