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
} from 'lucide-react';
import {
  saveRestaurantSettings,
  getRestaurantSettings,
  RestaurantSettings
} from '@/app/(utils)/firebaseOperations';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {toast} from 'sonner';

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

type StaffStatus = 'Active' | 'Inactive';

type Staff = {
  id: string;
  name: string;
  role: string;
  status: StaffStatus;
};

type SettingsState = {
  name: string;
  phone: string;
  email: string;
  offer: string;
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
  logoDataUrl?: string | null;
  hours: Record<DayKey, DayHours>;
  staff: Staff[];
  // New restaurant details
  cuisine?: string;
  restaurantType?: 'Veg' | 'Non-Veg' | 'Both';
  dietaryOptions?: string[];
  specialties?: string[];
  amenities?: string[];
  description?: string;
  topPicks?: string[];
  deliveryTime?: string;
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

const DEFAULT_STAFF: Staff[] = [
  { id: 'stf-1', name: 'Ethan Carter', role: 'Manager', status: 'Active' },
  { id: 'stf-2', name: 'Olivia Bennett', role: 'Chef', status: 'Active' },
  { id: 'stf-3', name: 'Noah Thompson', role: 'Waiter', status: 'Inactive' },
];

function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function cx(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

function SectionCard(props: { title: string; children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <section className={cx('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 group', props.className)}>
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
  const days: DayKey[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [state, setState] = useState<SettingsState>({
    name: '',
    phone: '',
    email: '',
    offer: '',
    address: { street: '', city: '', postalCode: '', state: '' },
    location: undefined,
    logoDataUrl: null,
    hours: DEFAULT_HOURS,
    staff: DEFAULT_STAFF,
    // New restaurant details
    cuisine: '',
    restaurantType: 'Both',
    dietaryOptions: [],
    specialties: [],
    amenities: [],
    description: '',
    topPicks: [],
    deliveryTime: '20-30 min',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staff modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

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
            offer: data.offer || '',
            address: {
              street: data.address?.street || '',
              city: data.address?.city || '',
              postalCode: data.address?.postalCode || '',
              state: data.address?.state || '',
            },
            location: data.location || undefined,
            logoDataUrl: data.logoDataUrl || null,
            hours: { ...DEFAULT_HOURS, ...(data.hours || {}) },
            staff: Array.isArray(data.staff) ? data.staff : DEFAULT_STAFF,
            // New restaurant details
            cuisine: data.cuisine || '',
            restaurantType: data.restaurantType || 'Both',
            dietaryOptions: data.dietaryOptions || [],
            specialties: data.specialties || [],
            amenities: data.amenities || [],
            description: data.description || '',
            topPicks: data.topPicks || [],
            deliveryTime: data.deliveryTime || '20-30 min',
          });
        } else {
          // No settings found, use defaults
          console.log('No restaurant settings found, using defaults');
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

  function setDayOpen(day: DayKey, open: boolean) {
    setState((s) => ({ ...s, hours: { ...s.hours, [day]: { ...s.hours[day], open } } }));
  }

  function setDayTime(day: DayKey, part: 'from' | 'to', value: string) {
    setState((s) => ({ ...s, hours: { ...s.hours, [day]: { ...s.hours[day], [part]: value } } }));
  }

  async function onLogoFile(file: File) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setField('logoDataUrl', String(reader.result));
    reader.readAsDataURL(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) onLogoFile(f);
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
      const result = await saveRestaurantSettings(user.uid, state);

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
          offer: data.offer || '',
          address: {
            street: data.address?.street || '',
            city: data.address?.city || '',
            postalCode: data.address?.postalCode || '',
            state: data.address?.state || '',
          },
          location: data.location || undefined,
          logoDataUrl: data.logoDataUrl || null,
          hours: { ...DEFAULT_HOURS, ...(data.hours || {}) },
          staff: Array.isArray(data.staff) ? data.staff : DEFAULT_STAFF,
          // New restaurant details
          cuisine: data.cuisine || '',
          restaurantType: data.restaurantType || 'Both',
          dietaryOptions: data.dietaryOptions || [],
          specialties: data.specialties || [],
          amenities: data.amenities || [],
          description: data.description || '',
          topPicks: data.topPicks || [],
          deliveryTime: data.deliveryTime || '20-30 min',
        });
      } else {
        // Reset to defaults if no saved data
        setState({
          name: '',
          phone: '',
          email: '',
          offer: '',
          address: { street: '', city: '', postalCode: '', state: '' },
          location: undefined,
          logoDataUrl: null,
          hours: DEFAULT_HOURS,
          staff: DEFAULT_STAFF,
          // New restaurant details
          cuisine: '',
          restaurantType: 'Both',
          dietaryOptions: [],
          specialties: [],
          amenities: [],
          description: '',
          topPicks: [],
          deliveryTime: '20-30 min',
        });
      }
      setIsDirty(false);
    } catch (err: any) {
      console.error('Error discarding changes:', err);
      setError('Failed to discard changes. Please try again.');
    }
  }

  // Staff management
  function openAddStaff() {
    setEditingStaff(null);
    setShowStaffModal(true);
  }

  function openEditStaff(s: Staff) {
    setEditingStaff(s);
    setShowStaffModal(true);
  }

  function upsertStaff(payload: Omit<Staff, 'id'> & { id?: string }) {
    setState((s) => {
      if (payload.id) {
        return { ...s, staff: s.staff.map((it) => (it.id === payload.id ? { ...it, ...payload } : it)) };
      }
      return { ...s, staff: [...s.staff, { id: uid('stf'), ...payload }] };
    });
    setShowStaffModal(false);
  }

  function requestDeleteStaff(s: Staff) {
    setDeleteTarget(s);
  }

  function confirmDeleteStaff() {
    if (!deleteTarget) return;
    setState((s) => ({ ...s, staff: s.staff.filter((it) => it.id !== deleteTarget.id) }));
    setDeleteTarget(null);
  }

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

          {/* Logo */}
          <SectionCard title="Logo" icon={<Star className="h-6 w-6" />}>
            {state.logoDataUrl ? (
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <img
                    src={state.logoDataUrl}
                    alt="Logo"
                    className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300" />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <Upload className="h-4 w-4" /> Replace
                  </button>
                  <button
                    onClick={() => setField('logoDataUrl', null)}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={onDrop}
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
                  Drag and drop or browse to upload your logo.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Recommended size: 200x200px</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-black text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition-all duration-200"
                >
                  Browse Files
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onLogoFile(f);
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
                      placeholder="+1 (555) 123-4567"
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

              <div>
                <label htmlFor="offer" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Special Offer
                </label>
                <input
                  id="offer"
                  type="text"
                  value={state.offer}
                  onChange={(e) => setField('offer', e.target.value)}
                  placeholder="e.g., 20% off on first order, Free delivery above ₹500"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-black relative transition-all duration-300">
                          <span className="absolute top-0.5 left-0.5 h-5 w-5 bg-white rounded-full transition-all peer-checked:translate-x-5" />
                        </div>
                      </label>

                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={d.from}
                          disabled={!d.open}
                          onChange={(e) => setDayTime(day, 'from', e.target.value)}
                          className="form-input p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm disabled:opacity-50 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 w-full sm:w-auto"
                        />
                        <span className="text-gray-500 hidden sm:inline">–</span>
                        <input
                          type="time"
                          value={d.to}
                          disabled={!d.open}
                          onChange={(e) => setDayTime(day, 'to', e.target.value)}
                          className="form-input p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm disabled:opacity-50 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 w-full sm:w-auto"
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
                  onChange={(e) => setField('cuisine', e.target.value)}
                  placeholder="e.g., Italian, Indian, Chinese, Mexican"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
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
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Tell customers about your restaurant, what makes it special..."
                  rows={3}
                  className="w-full form-textarea bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200 resize-none"
                />
              </div>

              {/* Delivery Time */}
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Delivery Time
                </label>
                <input
                  id="deliveryTime"
                  type="text"
                  value={state.deliveryTime || ''}
                  onChange={(e) => setField('deliveryTime', e.target.value)}
                  placeholder="e.g., 20-30 min, 15-25 min"
                  className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
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
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm">
                      {specialty}
                      <button
                        onClick={() => setField('specialties', state.specialties?.filter((_, i) => i !== index) || [])}
                        className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800/50 rounded-full p-0.5"
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
        </div>

        {/* Add/Edit Staff Modal */}
        {showStaffModal && (
          <StaffModal
            onClose={() => setShowStaffModal(false)}
            onSave={(payload) => upsertStaff(payload)}
            staff={editingStaff ?? undefined}
          />
        )}

        {/* Confirm Delete Modal */}
        {deleteTarget && (
          <ConfirmDeleteModal
            name={deleteTarget.name}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDeleteStaff}
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

        {/* Staff Accounts */}
        <SectionCard title="Staff Accounts" icon={<Users className="h-6 w-6" />}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Members</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your restaurant team</p>
              </div>
              <button
                onClick={openAddStaff}
                className="bg-black text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 inline-flex items-center gap-2 transition-all duration-200 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" /> Add Staff
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead className="border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th scope="col" className="py-3 pr-6 font-semibold">Name</th>
                    <th scope="col" className="py-3 px-6 font-semibold">Role</th>
                    <th scope="col" className="py-3 px-6 font-semibold">Status</th>
                    <th scope="col" className="py-3 pl-6 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.staff.map((s, idx) => (
                    <tr key={s.id} className={cx('border-b border-gray-200 dark:border-gray-700', idx === state.staff.length - 1 && 'border-b-0')}>
                      <td className="py-4 pr-6 text-gray-900 dark:text-gray-100">{s.name}</td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{s.role}</td>
                      <td className="py-4 px-6">
                        <span
                          className={cx(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            s.status === 'Active'
                              ? 'bg-gray-900/10 text-gray-900 dark:bg-white/10 dark:text-white'
                              : 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-300'
                          )}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 pl-6 text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => openEditStaff(s)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm"
                          >
                            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" /> 
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => requestDeleteStaff(s)}
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
          </div>
        </SectionCard>


      </div>
    </div>
  );
}

/* ----------------------------- Staff Modal ------------------------------ */

function StaffModal(props: {
  staff?: Staff;
  onSave: (payload: Omit<Staff, 'id'> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(props.staff?.name ?? '');
  const [role, setRole] = useState(props.staff?.role ?? '');
  const [status, setStatus] = useState<StaffStatus>(props.staff?.status ?? 'Active');

  function save() {
    if (!name.trim()) {
      alert('Name is required.');
      return;
    }
    if (!role.trim()) {
      alert('Role is required.');
      return;
    }
    props.onSave({ id: props.staff?.id, name: name.trim(), role: role.trim(), status });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={props.onClose} />
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Users className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-black dark:text-white">
              {props.staff ? 'Edit Staff' : 'Add Staff'}
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
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Chef / Manager / Waiter"
              className="w-full form-input bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StaffStatus)}
              className="w-full form-select bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
          <h4 className="text-lg font-semibold text-black dark:text-white">Delete Staff</h4>
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