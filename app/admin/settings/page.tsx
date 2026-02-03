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
  ChevronRight,
  Info,
  Loader2
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
import { toast } from 'sonner';
import {
  BusinessType,
  BUSINESS_TYPE_INFO
} from '@/app/(utils)/businessTypeConfig';

// --- Types ---

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

// --- Constants & Helpers ---

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

// --- UI Components ---

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#c9cbff] focus:ring-offset-2",
        checked ? 'bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff]' : 'bg-gray-200 dark:bg-gray-700'
      )}
    >
      <span className="sr-only">{label || 'Toggle setting'}</span>
      <span
        aria-hidden="true"
        className={cx(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

function SectionCard(props: {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  description?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <section className={cx('bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden', props.className)}>
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#14161a]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {props.icon && (
            <div className="p-2.5 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white shadow-sm shrink-0">
              {props.icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{props.title}</h3>
            {props.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{props.description}</p>
            )}
          </div>
        </div>
        {props.rightElement && <div className="shrink-0">{props.rightElement}</div>}
      </div>
      <div className="p-6">
        {props.children}
      </div>
    </section>
  );
}

const inputClass = "w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#14161a] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#c9cbff] focus:ring-2 focus:ring-[#c9cbff]/20 focus:outline-none transition-all duration-200";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
const buttonPrimaryClass = "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-gray-900 font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c9cbff]/50 transition-all duration-200 shadow-sm";
const buttonSecondaryClass = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-all duration-200";

// --- Main Page Component ---

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
    cuisine: '',
    restaurantType: 'Both',
    dietaryOptions: [],
    specialties: [],
    amenities: [],
    description: '',
    topPicks: [],
    deliveryTime: '20-30 min',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
    mapDirectionsLink: '',
    nextVisitCouponDiscount: 10,
    nextVisitCouponEnabled: true,
    businessType: 'QSR',
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
            cuisine: data.cuisine || '',
            restaurantType: data.restaurantType || 'Both',
            dietaryOptions: data.dietaryOptions || [],
            specialties: data.specialties || [],
            amenities: data.amenities || [],
            description: data.description || '',
            topPicks: data.topPicks || [],
            deliveryTime: data.deliveryTime || '20-30 min',
            socialMedia: {
              facebook: data.socialMedia?.facebook || '',
              instagram: data.socialMedia?.instagram || '',
              twitter: data.socialMedia?.twitter || '',
            },
            mapDirectionsLink: data.mapDirectionsLink || '',
            nextVisitCouponDiscount: data.nextVisitCouponDiscount || 10,
            businessType: data.businessType || 'QSR',
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
          console.log('No restaurant settings found, using defaults');
        }

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

  const snapshot = useMemo(() => JSON.stringify(state), [state]);
  useEffect(() => {
    setIsDirty(true);
  }, [snapshot]);

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
      toast.error('Validation Error: ' + errs[0]);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const removeUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) return obj.map(removeUndefined);
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) cleaned[key] = removeUndefined(value);
          }
          return cleaned;
        }
        return obj;
      };
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
          cuisine: data.cuisine || '',
          restaurantType: data.restaurantType || 'Both',
          dietaryOptions: data.dietaryOptions || [],
          specialties: data.specialties || [],
          amenities: data.amenities || [],
          description: data.description || '',
          topPicks: data.topPicks || [],
          deliveryTime: data.deliveryTime || '20-30 min',
          socialMedia: {
            facebook: data.socialMedia?.facebook || '',
            instagram: data.socialMedia?.instagram || '',
            twitter: data.socialMedia?.twitter || '',
          },
          mapDirectionsLink: data.mapDirectionsLink || '',
          nextVisitCouponDiscount: data.nextVisitCouponDiscount || 10,
          nextVisitCouponEnabled: data.nextVisitCouponEnabled !== undefined ? data.nextVisitCouponEnabled : true,
          businessType: data.businessType || 'QSR',
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
      }
      setIsDirty(false);
      toast.info('Changes discarded');
    } catch (err: any) {
      console.error('Error discarding changes:', err);
      setError('Failed to discard changes. Please try again.');
    }
  }

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
        isVerified: false
      };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error && !user?.uid) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#14161a] rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            You must be logged in to access restaurant settings.
          </p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            className={buttonPrimaryClass + " w-full"}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Manage your restaurant preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={discard}
              disabled={!isDirty || isSaving}
              className={cx(
                buttonSecondaryClass,
                (!isDirty || isSaving) && "opacity-50 cursor-not-allowed"
              )}
            >
              Discard
            </button>
            <button
              onClick={save}
              disabled={isSaving}
              className={cx(
                buttonPrimaryClass,
                isSaving && "opacity-80 cursor-wait"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Business Type */}
        <SectionCard 
          title="Business Type" 
          description="Select your operational model to optimize features." 
          icon={<Settings className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(BUSINESS_TYPE_INFO).map(([key, info]) => {
              const isSelected = state.businessType === key;
              return (
                <div
                  key={key}
                  onClick={() => setField('businessType', key as any)}
                  className={cx(
                    "cursor-pointer rounded-xl p-5 border-2 transition-all duration-300 relative overflow-hidden group",
                    isSelected 
                      ? "border-[#c9cbff] bg-gradient-to-br from-[#b8dcff]/10 to-[#e5c0ff]/10" 
                      : "border-gray-200 dark:border-gray-800 hover:border-[#b8dcff] dark:hover:border-[#b8dcff]/50 bg-white dark:bg-[#14161a]"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cx(
                      "p-3 rounded-lg shrink-0 transition-colors duration-300",
                      isSelected ? "bg-gradient-to-br from-[#b8dcff] to-[#e5c0ff] text-gray-900" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-[#b8dcff]/20 group-hover:text-gray-900"
                    )}>
                      {key === 'QSR' ? <Coffee className="w-6 h-6" /> : <UtensilsCrossed className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{info.name}</h4>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#c9cbff] fill-current" />}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{info.description}</p>
                      <ul className="space-y-1.5">
                        {info.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#c9cbff] mr-2" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Basic Info */}
        <SectionCard title="Restaurant Profile" description="Basic information about your establishment." icon={<Building2 className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className={labelClass}>Restaurant Name <span className="text-red-500">*</span></label>
              <input
                id="name"
                type="text"
                value={state.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. The Golden Spoon"
                className={inputClass}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={state.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={cx(inputClass, "pl-10")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={state.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="contact@restaurant.com"
                  className={cx(inputClass, "pl-10")}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea
                id="description"
                rows={3}
                value={state.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Tell customers about your restaurant..."
                className={inputClass}
              />
            </div>
          </div>
        </SectionCard>

        {/* Media */}
        <SectionCard title="Media & Branding" description="Showcase your restaurant with high-quality visuals." icon={<Utensils className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Upload */}
            <div>
              <label className={labelClass}>Cover Image</label>
              <div 
                className={cx(
                  "mt-2 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors duration-200 min-h-[200px] relative overflow-hidden group",
                  state.image ? "border-transparent" : "border-gray-200 dark:border-gray-800 hover:border-[#b8dcff] dark:hover:border-[#b8dcff] bg-gray-50 dark:bg-[#14161a]/50"
                )}
                onDrop={onRestaurantImageDrop}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                {state.image ? (
                  <>
                    <img src={state.image} alt="Restaurant Cover" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                       <button
                        onClick={() => restaurantImageInputRef.current?.click()}
                        className="bg-white text-gray-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
                      >
                        Change
                      </button>
                  <button
                    onClick={() => setField('image', null)}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-[#14161a] text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-sm mb-3">
                      <Upload className="w-6 h-6 text-gray-400 dark:text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Click or drag image here</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    <button
                      type="button"
                      onClick={() => restaurantImageInputRef.current?.click()}
                      className="mt-4 text-[#c9cbff] text-sm font-medium hover:underline brightness-75 dark:brightness-100"
                    >
                      Browse files
                    </button>
                  </>
                )}
                <input
                  ref={restaurantImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onRestaurantImageFile(e.target.files[0])}
                />
              </div>
            </div>

             {/* Video Upload */}
             <div>
              <label className={labelClass}>Promo Video (Optional)</label>
              <div 
                className={cx(
                  "mt-2 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors duration-200 min-h-[200px] relative overflow-hidden group",
                  state.video ? "border-transparent" : "border-gray-200 dark:border-gray-800 hover:border-[#b8dcff] dark:hover:border-[#b8dcff] bg-gray-50 dark:bg-[#14161a]/50"
                )}
                onDrop={onRestaurantVideoDrop}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                {state.video ? (
                  <>
                    <video src={state.video} className="absolute inset-0 w-full h-full object-cover" controls={false} muted />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                       <button
                        onClick={() => restaurantVideoInputRef.current?.click()}
                        className="bg-white text-gray-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
                        disabled={isUploadingVideo}
                      >
                        Change
                      </button>
                  <button
                    onClick={() => setField('video', null)}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-[#14161a] text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                    disabled={isUploadingVideo}
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                     <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-sm mb-3">
                      <Video className="w-6 h-6 text-gray-400 dark:text-gray-300" />
                    </div>
                    {isUploadingVideo ? (
                      <div className="w-full max-w-[150px]">
                         <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Uploading...</p>
                         <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-[#b8dcff] to-[#e5c0ff] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                         </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Click or drag video here</p>
                        <p className="text-xs text-gray-500 mt-1">MP4 up to 50MB</p>
                        <button
                          type="button"
                          onClick={() => restaurantVideoInputRef.current?.click()}
                          className="mt-4 text-[#c9cbff] text-sm font-medium hover:underline brightness-75 dark:brightness-100"
                        >
                          Browse files
                        </button>
                      </>
                    )}
                  </>
                )}
                <input
                  ref={restaurantVideoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onRestaurantVideoFile(e.target.files[0])}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Location */}
        <SectionCard title="Address & Location" description="Help customers find you easily." icon={<MapPin className="w-5 h-5" />}>
           <div className="space-y-6">
             <div>
                <label className={labelClass}>Street Address</label>
                <input
                  type="text"
                  value={state.address.street}
                  onChange={(e) => setAddressField('street', e.target.value)}
                  className={inputClass}
                  placeholder="123 Food Street"
                />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={state.address.city}
                    onChange={(e) => setAddressField('city', e.target.value)}
                    className={inputClass}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    type="text"
                    value={state.address.state}
                    onChange={(e) => setAddressField('state', e.target.value)}
                    className={inputClass}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className={labelClass}>Postal Code</label>
                  <input
                    type="text"
                    value={state.address.postalCode}
                    onChange={(e) => setAddressField('postalCode', e.target.value)}
                    className={inputClass}
                    placeholder="ZIP Code"
                  />
                </div>
             </div>
             
             <div className="pt-4">
               <label className={labelClass}>Pin on Map</label>
               <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <LocationPicker
                    location={state.location}
                    onLocationChange={setLocation}
                  />
               </div>
               <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                 <Info className="w-3 h-3" /> Drag the marker to pin your exact location.
               </p>
             </div>

             <div>
               <label className={labelClass}>Google Maps Link</label>
               <div className="relative">
                 <Navigation className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                 <input
                   type="url"
                   value={state.mapDirectionsLink}
                   onChange={(e) => setField('mapDirectionsLink', e.target.value)}
                   className={cx(inputClass, "pl-10")}
                   placeholder="https://maps.google.com/..."
                 />
               </div>
             </div>
           </div>
        </SectionCard>

        {/* Operating Hours */}
        <SectionCard title="Operating Hours" description="Set your weekly schedule." icon={<ClockIcon className="w-5 h-5" />}>
          <div className="space-y-3">
             {days.map((day) => (
               <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-4 mb-2 sm:mb-0 min-w-[140px]">
                     <Toggle 
                       checked={state.hours[day].open}
                       onChange={(checked) => setDayOpen(day, checked)}
                     />
                     <span className={cx("font-medium", state.hours[day].open ? "text-gray-900 dark:text-white" : "text-gray-400")}>
                       {day}
                     </span>
                  </div>
                  {state.hours[day].open ? (
                    <div className="flex items-center gap-2">
                       <input
                         type="time"
                         value={state.hours[day].from}
                         onChange={(e) => setDayTime(day, 'from', e.target.value)}
                         className={cx(inputClass, "w-auto py-1.5 px-3")}
                       />
                       <span className="text-gray-400">to</span>
                       <input
                         type="time"
                         value={state.hours[day].to}
                         onChange={(e) => setDayTime(day, 'to', e.target.value)}
                         className={cx(inputClass, "w-auto py-1.5 px-3")}
                       />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic px-2">Closed</span>
                  )}
               </div>
             ))}
          </div>
        </SectionCard>

        {/* Other Details */}
        <SectionCard title="Additional Details" description="Cuisine, amenities, and more." icon={<Sparkles className="w-5 h-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className={labelClass}>Cuisine Type</label>
                <input
                  type="text"
                  value={state.cuisine}
                  onChange={(e) => setField('cuisine', e.target.value)}
                  placeholder="e.g. Italian, Indian, Mexican"
                  className={inputClass}
                />
             </div>
             <div>
                <label className={labelClass}>Restaurant Category</label>
                <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                   {(['Veg', 'Non-Veg', 'Both'] as const).map((type) => (
                     <button
                       key={type}
                       type="button"
                       onClick={() => setField('restaurantType', type)}
                       className={cx(
                         "flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                         state.restaurantType === type 
                           ? "bg-white dark:bg-[#14161a] text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5" 
                           : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                       )}
                     >
                       {type}
                     </button>
                   ))}
                </div>
             </div>
             
             <div>
               <label className={labelClass}>Amenities (Comma separated)</label>
               <input
                 type="text"
                 value={state.amenities?.join(', ')}
                 onChange={(e) => setField('amenities', e.target.value.split(',').map(s => s.trim()))}
                 placeholder="WiFi, Parking, AC..."
                 className={inputClass}
               />
             </div>
             
             <div>
               <label className={labelClass}>Average Delivery Time</label>
               <input
                 type="text"
                 value={state.deliveryTime}
                 onChange={(e) => setField('deliveryTime', e.target.value)}
                 placeholder="30-45 min"
                 className={inputClass}
               />
             </div>
          </div>
        </SectionCard>

        {/* Special Instructions */}
        <SectionCard 
          title="Special Instructions" 
          description="Customize available preparation preferences for customers." 
          icon={<FileText className="w-5 h-5" />}
          rightElement={
             <button onClick={openAddSpecialInstruction} className={buttonSecondaryClass}>
                <Plus className="w-4 h-4" /> Add Instruction
             </button>
          }
        >
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(state.specialInstructions || []).map((inst) => (
                <div key={inst.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50 dark:bg-[#14161a]/50">
                   <div className="flex items-center gap-3">
                      <Toggle 
                        checked={inst.active}
                        onChange={() => toggleSpecialInstructionStatus(inst.id)}
                      />
                      <div>
                         <p className={cx("font-medium text-sm", inst.active ? "text-gray-900 dark:text-white" : "text-gray-400")}>{inst.label}</p>
                         <p className="text-xs text-gray-500 capitalize">{inst.category}</p>
                      </div>
                   </div>
                   <div className="flex gap-1">
                      <button 
                        onClick={() => openEditSpecialInstruction(inst)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => requestDeleteSpecialInstruction(inst)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </SectionCard>

        {/* Modals will need similar styling updates if they contain custom UI, 
            but standard inputs/buttons will use the updated classes defined at the top. 
            For brevity and because they share the same components/classes, they will inherit the theme. 
        */}

      </div>

      {/* Special Instruction Modal */}
      {showSpecialInstructionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14161a] rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingSpecialInstruction ? 'Edit Instruction' : 'Add New Instruction'}
              </h3>
              <button onClick={() => setShowSpecialInstructionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              upsertSpecialInstruction({
                id: editingSpecialInstruction?.id,
                label: formData.get('label'),
                category: formData.get('category'),
                active: editingSpecialInstruction?.active ?? true
              });
            }} className="space-y-4">
              <div>
                <label className={labelClass}>Instruction Label</label>
                <input 
                  name="label" 
                  defaultValue={editingSpecialInstruction?.label} 
                  required 
                  className={inputClass}
                  placeholder="e.g. Less Spicy" 
                />
              </div>
              
              <div>
                <label className={labelClass}>Category</label>
                <select 
                  name="category" 
                  defaultValue={editingSpecialInstruction?.category || 'preparation'} 
                  className={inputClass}
                >
                  <option value="preparation">Preparation</option>
                  <option value="dietary">Dietary</option>
                  <option value="spice">Spice Level</option>
                  <option value="packaging">Packaging</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSpecialInstructionModal(false)} className={cx(buttonSecondaryClass, "w-full")}>
                  Cancel
                </button>
                <button type="submit" className={cx(buttonPrimaryClass, "w-full")}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
