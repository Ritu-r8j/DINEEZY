import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  userType?: 'user' | 'admin';
  createdAt: any;
  updatedAt: any;
}

export const createUserProfile = async (userData: Partial<UserData>) => {
  try {
    const userRef = doc(db, 'users', userData.uid!);
    const userProfile = {
      ...userData,
      userType: userData.userType || 'user', // Default to 'user' if not specified
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(userRef, userProfile);
    return { success: true, data: userProfile };
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log("Firebase", data)
      if (data.uid) {
        return { success: true, data: data as UserData };
      } else {
        return { success: false, error: 'User profile not found' };
      }
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (uid: string, updateData: Partial<UserData>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

export const completeUserRegistration = async (
  user: any,
  additionalData: {
    firstName: string;
    lastName: string;
    phone?: string;
  }
) => {
  try {
    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: `${additionalData.firstName} ${additionalData.lastName}`,
      phoneNumber: additionalData.phone || '',
      photoURL: user.photoURL || '',
    };
    const userResult = await createUserProfile(userProfile);
    if (!userResult.success) {
      return { success: false, error: userResult.error };
    }
    return {
      success: true,
      data: {
        user: userResult.data
      }
    };
  } catch (error: any) {
    console.error('Error completing registration:', error);
    return { success: false, error: error.message };
  }
};

export interface OTPData {
  phoneNumber: string;
  otp: string;
  createdAt: any;
  expiresAt: any;
  attempts: number;
  verified?: boolean;
  verifiedAt?: any;
}

export const storeOTPInFirestore = async (phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', phoneNumber);
    const otpData: OTPData = {
      phoneNumber,
      otp,
      createdAt: serverTimestamp(),
      expiresAt: null,
      attempts: 0,
      verified: false
    };
    await setDoc(userRef, { otpData }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error('Error storing OTP:', error);
    return { success: false, error: error.message };
  }
};

export const verifyOTPFromFirestore = async (phoneNumber: string, enteredOTP: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', phoneNumber);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'OTP not found' };
    }
    const userData = userDoc.data();
    const otpData = userData.otpData;
    if (!otpData) {
      return { success: false, error: 'OTP not found' };
    }
    if (otpData.verified) {
      return { success: false, error: 'OTP has already been used' };
    }
    if (otpData.attempts >= 3) {
      return { success: false, error: 'Too many attempts. Please request a new OTP.' };
    }
    if (otpData.otp === enteredOTP) {
      await updateDoc(userRef, {
        'otpData.verified': true,
        'otpData.verifiedAt': serverTimestamp()
      });
      return { success: true };
    } else {
      await updateDoc(userRef, {
        'otpData.attempts': otpData.attempts + 1
      });
      return { success: false, error: 'Invalid OTP' };
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message };
  }
};

export const cleanupExpiredOTPs = async (): Promise<{ success: boolean; cleaned: number; error?: string }> => {
  try {
    return { success: true, cleaned: 0 };
  } catch (error: any) {
    console.error('Error cleaning up expired OTPs:', error);
    return { success: false, cleaned: 0, error: error.message };
  }
};

// Check if phone number already exists in the database
export const checkPhoneNumberExists = async (phoneNumber: string): Promise<{ success: boolean; exists: boolean; error?: string }> => {
  try {
    // Add 91 prefix if not present
    const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', formattedPhone));
    const querySnapshot = await getDocs(q);

    return {
      success: true,
      exists: !querySnapshot.empty
    };
  } catch (error: any) {
    console.error('Error checking phone number:', error);
    return {
      success: false,
      exists: false,
      error: error.message
    };
  }
};

// Restaurant Settings Operations
export interface RestaurantSettings {
  id?: string; // Document ID from Firebase
  adminId: string; // The UID of the admin who owns this restaurant
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
  hours: Record<string, {
    open: boolean;
    from: string;
    to: string;
  }>;
  staff: Array<{
    id: string;
    name: string;
    role: string;
    status: 'Active' | 'Inactive';
  }>;
  createdAt?: any;
  updatedAt: any;
  // Additional fields for restaurant listing
  cuisine?: string;
  rating?: number;
  deliveryTime?: string;
  image?: string;
  // New restaurant details
  restaurantType?: 'Veg' | 'Non-Veg' | 'Both';
  dietaryOptions?: string[]; // ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Keto', 'Paleo']
  specialties?: string[]; // ['Pizza', 'Burgers', 'Pasta', 'Sushi', 'Indian', 'Chinese', 'Italian', 'Mexican']
  amenities?: string[]; // ['Wi-Fi', 'Outdoor Seating', 'Pet-Friendly', 'Parking', 'Delivery', 'Takeout']
  description?: string;
  topPicks?: string[]; // Special dishes or features
  priceLevel?: number;
}

export const saveRestaurantSettings = async (
  uid: string,
  settings: Omit<RestaurantSettings, 'adminId' | 'createdAt' | 'updatedAt'>
) => {
  try {
    const restaurantRef = doc(db, 'restaurants', uid);
    // Use a type that allows optional createdAt for settingsData
    const settingsData: Omit<RestaurantSettings, 'createdAt' | 'updatedAt'> & { updatedAt: any; createdAt?: any } = {
      ...settings,
      adminId: uid,
      updatedAt: serverTimestamp(),
    };

    // Check if document exists to determine if we need to set createdAt
    const docSnap = await getDoc(restaurantRef);
    if (!docSnap.exists()) {
      settingsData.createdAt = serverTimestamp();
    }

    await setDoc(restaurantRef, settingsData, { merge: true });
    return { success: true, data: settingsData };
  } catch (error: any) {
    console.error('Error saving restaurant settings:', error);
    return { success: false, error: error.message };
  }
};

export const getRestaurantSettings = async (uid: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', uid);
    const docSnap = await getDoc(restaurantRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return { success: true, data: data as RestaurantSettings };
    } else {
      return { success: false, error: 'Restaurant settings not found' };
    }
  } catch (error: any) {
    console.error('Error getting restaurant settings:', error);
    return { success: false, error: error.message };
  }
};

export const updateRestaurantSettings = async (uid: string, updateData: Partial<RestaurantSettings>) => {
  try {
    const restaurantRef = doc(db, 'restaurants', uid);
    await updateDoc(restaurantRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating restaurant settings:', error);
    return { success: false, error: error.message };
  }
};

// Verify that the admin owns the restaurant
export const verifyRestaurantOwnership = async (adminId: string, restaurantId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const docSnap = await getDoc(restaurantRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.adminId === adminId) {
        return { success: true, isOwner: true };
      } else {
        return { success: true, isOwner: false };
      }
    } else {
      return { success: false, error: 'Restaurant not found' };
    }
  } catch (error: any) {
    console.error('Error verifying restaurant ownership:', error);
    return { success: false, error: error.message };
  }
};

// Get all restaurants owned by an admin
export const getRestaurantsByAdmin = async (adminId: string) => {
  try {
    // Note: This would require a query in a real implementation
    // For now, we'll use the adminId as the document ID
    const restaurantRef = doc(db, 'restaurants', adminId);
    const docSnap = await getDoc(restaurantRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return { success: true, data: data as RestaurantSettings };
    } else {
      return { success: false, error: 'No restaurants found for this admin' };
    }
  } catch (error: any) {
    console.error('Error getting restaurants by admin:', error);
    return { success: false, error: error.message };
  }
};

// Get all restaurants for the restaurant listing page
export const getAllRestaurants = async () => {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const querySnapshot = await getDocs(restaurantsRef);

    const restaurants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RestaurantSettings[];

    return { success: true, data: restaurants };
  } catch (error: any) {
    console.error('Error getting all restaurants:', error);
    return { success: false, error: error.message };
  }
};

// Get all menu items for a specific restaurant
export const getRestaurantMenuItems = async (restaurantId: string) => {
  try {
    const menuItemsRef = collection(db, 'menuItems');
    const q = query(
      menuItemsRef,
      where('adminId', '==', restaurantId),
      where('available', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const menuItems: MenuItem[] = [];

    querySnapshot.forEach((doc) => {
      menuItems.push(doc.data() as MenuItem);
    });

    return { success: true, data: menuItems };
  } catch (error: any) {
    console.error('Error getting restaurant menu items:', error);
    return { success: false, error: error.message };
  }
};

// Get all menu items from all restaurants for the menu page
export const getAllMenuItems = async () => {
  try {
    const menuItemsRef = collection(db, 'menuItems');
    const q = query(
      menuItemsRef,
      where('available', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const menuItems: MenuItem[] = [];

    querySnapshot.forEach((doc) => {
      menuItems.push(doc.data() as MenuItem);
    });

    return { success: true, data: menuItems };
  } catch (error: any) {
    console.error('Error getting all menu items:', error);
    return { success: false, error: error.message };
  }
};

// Get menu items with filtering
export const getFilteredMenuItems = async (filters: {
  category?: string;
  dietary?: string[];
  priceRange?: { min: number; max: number };
  searchQuery?: string;
}) => {
  try {
    const menuItemsRef = collection(db, 'menuItems');
    let q = query(
      menuItemsRef,
      where('available', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    let menuItems = querySnapshot.docs.map(doc => doc.data() as MenuItem);

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      menuItems = menuItems.filter(item =>
        item.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters.dietary && filters.dietary.length > 0) {
      menuItems = menuItems.filter(item => {
        if (filters.dietary!.includes('vegetarian') && !item.isVegetarian) return false;
        if (filters.dietary!.includes('vegan') && !item.isVegan) return false;
        if (filters.dietary!.includes('gluten-free') && !item.isGlutenFree) return false;
        return true;
      });
    }

    if (filters.priceRange) {
      menuItems = menuItems.filter(item =>
        item.price >= filters.priceRange!.min && item.price <= filters.priceRange!.max
      );
    }

    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      menuItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.ingredients.toLowerCase().includes(searchLower)
      );
    }

    return { success: true, data: menuItems };
  } catch (error: any) {
    console.error('Error getting filtered menu items:', error);
    return { success: false, error: error.message };
  }
};

// Get ratings for menu items
export const getMenuItemsRatings = async () => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const querySnapshot = await getDocs(reviewsRef);

    const ratings: { [menuItemId: string]: { average: number; count: number } } = {};

    querySnapshot.forEach((doc) => {
      const review = doc.data();
      const menuItemId = review.menuItemId;
      const rating = review.rating;

      if (menuItemId && typeof rating === 'number') {
        if (!ratings[menuItemId]) {
          ratings[menuItemId] = { average: 0, count: 0 };
        }

        ratings[menuItemId].average = (ratings[menuItemId].average * ratings[menuItemId].count + rating) / (ratings[menuItemId].count + 1);
        ratings[menuItemId].count += 1;
      }
    });

    return { success: true, data: ratings };
  } catch (error: any) {
    console.error('Error getting menu items ratings:', error);
    return { success: false, error: error.message };
  }
};


// Get restaurants with filtering and search
export const getFilteredRestaurants = async (filters: {
  searchQuery?: string;
  dietary?: string[];
  priceRange?: string[];
  amenities?: string[];
  cuisines?: string[];
}) => {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const querySnapshot = await getDocs(restaurantsRef);

    let restaurants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RestaurantSettings[];

    // Apply search filter
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      restaurants = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchLower) ||
        restaurant.email.toLowerCase().includes(searchLower) ||
        restaurant.address?.city?.toLowerCase().includes(searchLower) ||
        restaurant.address?.state?.toLowerCase().includes(searchLower) ||
        restaurant.cuisine?.toLowerCase().includes(searchLower) ||
        restaurant.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply dietary filters
    if (filters.dietary && filters.dietary.length > 0) {
      restaurants = restaurants.filter(restaurant =>
        filters.dietary!.some(dietary =>
          restaurant.dietaryOptions?.includes(dietary)
        )
      );
    }

    // Apply cuisine filters
    if (filters.cuisines && filters.cuisines.length > 0) {
      restaurants = restaurants.filter(restaurant =>
        filters.cuisines!.some(cuisine =>
          restaurant.cuisine?.toLowerCase().includes(cuisine.toLowerCase())
        )
      );
    }

    // Apply amenities filters
    if (filters.amenities && filters.amenities.length > 0) {
      restaurants = restaurants.filter(restaurant =>
        filters.amenities!.some(amenity =>
          restaurant.amenities?.includes(amenity)
        )
      );
    }

    // Note: Price range filters would require additional data fields
    // For now, we'll return restaurants that match the other filters

    return { success: true, data: restaurants };
  } catch (error: any) {
    console.error('Error getting filtered restaurants:', error);
    return { success: false, error: error.message };
  }
};

// Menu Item Operations
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  preparationTime: number;
  ingredients: string;
  allergens: string[];
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'very-hot';
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  calories: number;
  rating: number;
  tags: string[];
  discount?: number;
  adminId: string;
  createdAt?: any;
  // Restaurant location and address for delivery/ordering purposes
  restaurantLocation?: {
    lat: number;
    lng: number;
  } | null;
  restaurantAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  updatedAt?: any;
}

export const addMenuItem = async (adminId: string, menuItem: Omit<MenuItem, 'id' | 'adminId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const menuItemsRef = collection(db, 'menuItems');
    const newMenuItemRef = doc(menuItemsRef);
    const menuItemData: MenuItem = {
      ...menuItem,
      id: newMenuItemRef.id,
      adminId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newMenuItemRef, menuItemData);
    return { success: true, data: menuItemData };
  } catch (error: any) {
    console.error('Error adding menu item:', error);
    return { success: false, error: error.message };
  }
};

export const getMenuItems = async (adminId: string) => {
  try {
    const menuItemsRef = collection(db, 'menuItems');
    const q = query(
      menuItemsRef,
      where('adminId', '==', adminId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const menuItems: MenuItem[] = [];

    querySnapshot.forEach((doc) => {
      menuItems.push(doc.data() as MenuItem);
    });

    return { success: true, data: menuItems };
  } catch (error: any) {
    console.error('Error getting menu items:', error);
    return { success: false, error: error.message };
  }
};

export const updateMenuItem = async (itemId: string, updateData: Partial<MenuItem>) => {
  try {
    const menuItemRef = doc(db, 'menuItems', itemId);
    await updateDoc(menuItemRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return { success: false, error: error.message };
  }
};

export const deleteMenuItem = async (itemId: string) => {
  try {
    const menuItemRef = doc(db, 'menuItems', itemId);
    await deleteDoc(menuItemRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    return { success: false, error: error.message };
  }
};

export const toggleMenuItemAvailability = async (itemId: string, available: boolean) => {
  try {
    const menuItemRef = doc(db, 'menuItems', itemId);
    await updateDoc(menuItemRef, {
      available,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling menu item availability:', error);
    return { success: false, error: error.message };
  }
};

// User Type Management Functions
export const updateUserType = async (uid: string, userType: 'user' | 'admin') => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      userType,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user type:', error);
    return { success: false, error: error.message };
  }
};

export const getUserType = async (uid: string): Promise<'user' | 'admin' | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserData;
      return userData.userType || 'user'; // Default to 'user' if not set
    }
    return null;
  } catch (error: any) {
    console.error('Error getting user type:', error);
    return null;
  }
};

// Order Management Functions
export interface OrderData {
  id: string;
  orderId: string; // Meaningful order ID like ORD2412151430A7B2
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  orderType: string;
  deliveryOption?: any;
  paymentMethod: string;
  specialInstructions: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  estimatedTime: string;
  adminEstimatedTime?: number; // Admin can set custom estimated time in minutes
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: any;
  restaurantId: string;
  userId?: string; // Optional for guest users
  guestSessionId?: string; // Optional for guest users to track their session
  isGuest: boolean;
}

// Create a new order in the database
export const createOrder = async (orderData: Omit<OrderData, 'id' | 'createdAt'>) => {
  try {
    // Use the meaningful orderId from orderData as the document ID
    const orderId = orderData.orderId;
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const orderRef = doc(db, 'orders', orderId);

    const order = {
      ...orderData,
      id: orderId,
      createdAt: serverTimestamp(),
    };

    await setDoc(orderRef, order);
    return { success: true, orderId };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

// Get orders for a specific restaurant
export const getRestaurantOrders = async (restaurantId: string) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const orders: OrderData[] = [];

    querySnapshot.forEach((doc) => {
      orders.push(doc.data() as OrderData);
    });

    return { success: true, data: orders };
  } catch (error: any) {
    console.error('Error getting restaurant orders:', error);
    return { success: false, error: error.message };
  }
};

// Get orders for a specific user
export const getUserOrders = async (userId: string) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const orders: OrderData[] = [];

    querySnapshot.forEach((doc) => {
      orders.push(doc.data() as OrderData);
    });

    return { success: true, data: orders };
  } catch (error: any) {
    console.error('Error getting user orders:', error);
    return { success: false, error: error.message };
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: OrderData['status']) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return { success: false, error: error.message };
  }
};

// Update order estimated time (admin function)
export const updateOrderEstimatedTime = async (orderId: string, estimatedTime: number) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      adminEstimatedTime: estimatedTime,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating order estimated time:', error);
    return { success: false, error: error.message };
  }
};

// Get menu item preparation time for fallback
export const getMenuItemPreparationTime = async (menuItemId: string, restaurantId: string) => {
  try {
    const menuRef = doc(db, 'restaurants', restaurantId, 'menu', menuItemId);
    const menuSnap = await getDoc(menuRef);

    if (menuSnap.exists()) {
      const menuData = menuSnap.data();
      return { success: true, preparationTime: menuData.preparationTime || 20 };
    } else {
      return { success: false, error: 'Menu item not found' };
    }
  } catch (error: any) {
    console.error('Error getting menu item preparation time:', error);
    return { success: false, error: error.message };
  }
};


// Get order by ID
export const getOrderById = async (orderId: string) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (orderSnap.exists()) {
      return { success: true, data: orderSnap.data() as OrderData };
    } else {
      return { success: false, error: 'Order not found' };
    }
  } catch (error: any) {
    console.error('Error getting order:', error);
    return { success: false, error: error.message };
  }
};

// Real-time listeners for orders
export const subscribeToRestaurantOrders = (
  restaurantId: string,
  callback: (orders: OrderData[]) => void
) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: OrderData[] = [];
      snapshot.forEach((doc) => {
        orders.push(doc.data() as OrderData);
      });
      callback(orders);
    }, (error) => {
      console.error('Error listening to restaurant orders:', error);
    });

    return unsubscribe;
  } catch (error: any) {
    console.error('Error setting up restaurant orders listener:', error);
    return () => { }; // Return empty function as fallback
  }
};

export const subscribeToUserOrders = (
  userId: string,
  callback: (orders: OrderData[]) => void
) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: OrderData[] = [];
      snapshot.forEach((doc) => {
        orders.push(doc.data() as OrderData);
      });
      callback(orders);
    }, (error) => {
      console.error('Error listening to user orders:', error);
    });

    return unsubscribe;
  } catch (error: any) {
    console.error('Error setting up user orders listener:', error);
    return () => { }; // Return empty function as fallback
  }
};

export const subscribeToGuestOrders = (
  restaurantId: string,
  guestSessionId: string,
  callback: (orders: OrderData[]) => void
) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      where('isGuest', '==', true),
      where('guestSessionId', '==', guestSessionId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: OrderData[] = [];
      snapshot.forEach((doc) => {
        orders.push(doc.data() as OrderData);
      });
      callback(orders);
    }, (error) => {
      console.error('Error listening to guest orders:', error);
    });

    return unsubscribe;
  } catch (error: any) {
    console.error('Error setting up guest orders listener:', error);
    return () => { }; // Return empty function as fallback
  }
};

// Utility function to format Firebase timestamps
// Utility function to remove undefined values from an object
export const removeUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter(item => item !== undefined);
  }

  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedValues(value);
    }
  }
  return cleaned;
};

// Restaurant Media Management Functions
export interface RestaurantMediaData {
  id: string;
  restaurantId: string;
  uploadedBy: string; // User ID
  url: string;
  type: 'image' | 'video';
  filename: string;
  format: string;
  publicId: string; // Cloudinary public ID for deletion
  isApproved: boolean;
  createdAt: any;
  updatedAt: any;
}

// Save uploaded media metadata to Firebase
export const saveRestaurantMedia = async (mediaData: Omit<RestaurantMediaData, 'id' | 'createdAt' | 'updatedAt' | 'isApproved'>) => {
  try {
    const mediaRef = doc(collection(db, 'restaurantMedia'));
    const media = {
      ...mediaData,
      id: mediaRef.id,
      isApproved: false, // Requires admin approval
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(mediaRef, media);
    return { success: true, data: media };
  } catch (error: any) {
    console.error('Error saving restaurant media:', error);
    return { success: false, error: error.message };
  }
};

// Get restaurant media
export const getRestaurantMedia = async (restaurantId: string, approvedOnly: boolean = true) => {
  try {
    const mediaRef = collection(db, 'restaurantMedia');
    let q = query(
      mediaRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    if (approvedOnly) {
      q = query(
        mediaRef,
        where('restaurantId', '==', restaurantId),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const media: RestaurantMediaData[] = [];

    querySnapshot.forEach((doc) => {
      media.push(doc.data() as RestaurantMediaData);
    });

    return { success: true, data: media };
  } catch (error: any) {
    console.error('Error getting restaurant media:', error);
    return { success: false, error: error.message };
  }
};

// Approve restaurant media (admin function)
export const approveRestaurantMedia = async (mediaId: string) => {
  try {
    const mediaRef = doc(db, 'restaurantMedia', mediaId);
    await updateDoc(mediaRef, {
      isApproved: true,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error approving restaurant media:', error);
    return { success: false, error: error.message };
  }
};

// Delete restaurant media
export const deleteRestaurantMedia = async (mediaId: string) => {
  try {
    const mediaRef = doc(db, 'restaurantMedia', mediaId);
    await deleteDoc(mediaRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting restaurant media:', error);
    return { success: false, error: error.message };
  }
};

export const formatFirebaseTimestamp = (timestamp: any): string => {
  if (!timestamp) return 'Unknown';

  try {
    // Handle Firebase Timestamp objects
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Handle regular Date objects or ISO strings
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Handle ISO string timestamps
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return 'Invalid date';
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
};

// Review Management Functions
export interface ReviewData {
  id: string;
  menuItemId: string;
  restaurantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: any;
  updatedAt: any;
  isVerified: boolean; // Whether the user actually ordered this item
  helpful: number; // Number of helpful votes
  notHelpful: number; // Number of not helpful votes
  media?: ReviewMedia[]; // Images and videos attached to review
}

export interface ReviewMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string; // For videos
  publicId: string; // Cloudinary public ID
  originalFilename: string;
  format: string;
  uploadedAt: any;
}

// Restaurant Review Schema (separate from food item reviews)
export interface RestaurantReviewData {
  id: string;
  restaurantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: any;
  updatedAt: any;
  isVerified: boolean; // Whether the user actually visited this restaurant
  helpful: number; // Number of helpful votes
  notHelpful: number; // Number of not helpful votes
  media?: ReviewMedia[]; // Images and videos attached to review
}

// Create a new review
export const createReview = async (reviewData: Omit<ReviewData, 'id' | 'createdAt' | 'updatedAt' | 'helpful' | 'notHelpful'>) => {
  try {
    const reviewRef = doc(collection(db, 'reviews'));

    // Clean the review data to remove undefined values and provide defaults
    const cleanReviewData = {
      menuItemId: reviewData.menuItemId || '',
      restaurantId: reviewData.restaurantId || '',
      userId: reviewData.userId || '',
      userName: reviewData.userName || 'Anonymous',
      userEmail: reviewData.userEmail || '',
      userPhotoURL: reviewData.userPhotoURL || '',
      rating: reviewData.rating || 5,
      comment: reviewData.comment || '',
      isVerified: reviewData.isVerified || false,
      media: reviewData.media || []
    };

    // Use Firestore Timestamp objects for proper storage
    const currentDate = new Date();
    const firestoreTimestamp = Timestamp.fromDate(currentDate);
    console.log('Creating menu item review with Firestore timestamp:', currentDate);

    const review = {
      ...cleanReviewData,
      id: reviewRef.id,
      helpful: 0,
      notHelpful: 0,
      createdAt: firestoreTimestamp,
      updatedAt: firestoreTimestamp,
    };

    // Remove any remaining undefined values before saving to Firebase
    const cleanedReview = removeUndefinedValues(review);

    await setDoc(reviewRef, cleanedReview);
    console.log('Menu item review created successfully with real timestamps');
    return { success: true, data: review };
  } catch (error: any) {
    console.error('Error creating review:', error);
    return { success: false, error: error.message };
  }
};

// Get reviews for a specific menu item
export const getMenuItemReviews = async (menuItemId: string) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('menuItemId', '==', menuItemId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => {
      const data = doc.data();

      // Handle server timestamp conversion
      let createdAt = data.createdAt;
      if (createdAt && createdAt._methodName === 'serverTimestamp') {
        // If it's still a server timestamp placeholder, use current time
        createdAt = new Date();
      } else if (createdAt && createdAt.toDate && typeof createdAt.toDate === 'function') {
        // Convert Firestore Timestamp to Date
        createdAt = createdAt.toDate();
      }

      let updatedAt = data.updatedAt;
      if (updatedAt && updatedAt._methodName === 'serverTimestamp') {
        updatedAt = new Date();
      } else if (updatedAt && updatedAt.toDate && typeof updatedAt.toDate === 'function') {
        updatedAt = updatedAt.toDate();
      }

      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
        helpful: data.helpful || 0,
        notHelpful: data.notHelpful || 0
      };
    }) as ReviewData[];
    return { success: true, data: reviews };
  } catch (error: any) {
    console.error('Error getting menu item reviews:', error);
    return { success: false, error: error.message };
  }
};


// Update a review
export const updateReview = async (reviewId: string, updateData: Partial<ReviewData>) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);

    // Use Firestore Timestamp for proper storage
    const currentDate = new Date();
    const firestoreTimestamp = Timestamp.fromDate(currentDate);
    console.log('Updating menu item review with Firestore timestamp:', currentDate);

    await updateDoc(reviewRef, {
      ...updateData,
      updatedAt: firestoreTimestamp,
    });

    console.log('Menu item review updated successfully with real timestamp');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating review:', error);
    return { success: false, error: error.message };
  }
};

// Delete a review
export const deleteReview = async (reviewId: string) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    await deleteDoc(reviewRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return { success: false, error: error.message };
  }
};

// Vote on a review (helpful/not helpful) with user tracking
export const voteOnReview = async (reviewId: string, userId: string, isHelpful: boolean) => {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (reviewDoc.exists()) {
      const currentData = reviewDoc.data() as ReviewData;

      // Ensure helpful and notHelpful fields exist
      const helpful = currentData.helpful || 0;
      const notHelpful = currentData.notHelpful || 0;

      // Check if user has already voted
      const userVotesRef = collection(db, 'reviewVotes');
      const userVoteQuery = query(
        userVotesRef,
        where('reviewId', '==', reviewId),
        where('userId', '==', userId)
      );
      const userVoteSnapshot = await getDocs(userVoteQuery);

      if (!userVoteSnapshot.empty) {
        // User has already voted, update their vote
        const existingVote = userVoteSnapshot.docs[0];
        const existingVoteData = existingVote.data();

        // If user is changing their vote
        if (existingVoteData.isHelpful !== isHelpful) {
          // Calculate new vote counts
          let newHelpful = helpful;
          let newNotHelpful = notHelpful;

          if (existingVoteData.isHelpful) {
            // Was helpful, now not helpful
            newHelpful = Math.max(0, newHelpful - 1);
            newNotHelpful += 1;
          } else {
            // Was not helpful, now helpful
            newNotHelpful = Math.max(0, newNotHelpful - 1);
            newHelpful += 1;
          }

          await updateDoc(reviewRef, {
            helpful: newHelpful,
            notHelpful: newNotHelpful,
            updatedAt: serverTimestamp(),
          });

          // Update the user's vote record
          await updateDoc(existingVote.ref, {
            isHelpful,
            updatedAt: serverTimestamp(),
          });
        }
        // If user is voting the same way, do nothing (already voted)
        return { success: true, message: 'Vote updated' };
      } else {
        // User hasn't voted yet, add their vote
        const voteUpdate = isHelpful
          ? { helpful: helpful + 1 }
          : { notHelpful: notHelpful + 1 };

        await updateDoc(reviewRef, {
          ...voteUpdate,
          updatedAt: serverTimestamp(),
        });

        // Create a new vote record for this user
        const newVoteRef = doc(collection(db, 'reviewVotes'));
        await setDoc(newVoteRef, {
          id: newVoteRef.id,
          reviewId,
          userId,
          isHelpful,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return { success: true, message: 'Vote recorded' };
      }
    } else {
      return { success: false, error: 'Review not found' };
    }
  } catch (error: any) {
    console.error('Error voting on review:', error);
    return { success: false, error: error.message };
  }
};

// Get user's vote for a specific review
export const getUserVoteForReview = async (reviewId: string, userId: string) => {
  try {
    const userVotesRef = collection(db, 'reviewVotes');
    const userVoteQuery = query(
      userVotesRef,
      where('reviewId', '==', reviewId),
      where('userId', '==', userId)
    );
    const userVoteSnapshot = await getDocs(userVoteQuery);

    if (!userVoteSnapshot.empty) {
      const voteData = userVoteSnapshot.docs[0].data();
      return { success: true, data: { isHelpful: voteData.isHelpful } };
    } else {
      return { success: true, data: null }; // User hasn't voted
    }
  } catch (error: any) {
    console.error('Error getting user vote:', error);
    return { success: false, error: error.message };
  }
};

// Get average rating for a menu item
export const getMenuItemAverageRating = async (menuItemId: string) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('menuItemId', '==', menuItemId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, data: { averageRating: 0, totalReviews: 0 } };
    }

    const reviews = querySnapshot.docs.map(doc => doc.data() as ReviewData);
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      success: true,
      data: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: reviews.length
      }
    };
  } catch (error: any) {
    console.error('Error getting average rating:', error);
    return { success: false, error: error.message };
  }
};

// Check if user has already reviewed a menu item
export const checkUserReview = async (menuItemId: string, userId: string) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('menuItemId', '==', menuItemId),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, data: null };
    }

    const review = querySnapshot.docs[0].data() as ReviewData;
    return { success: true, data: review };
  } catch (error: any) {
    console.error('Error checking user review:', error);
    return { success: false, error: error.message };
  }
};

// Reservation Management Functions
export interface ReservationData {
  id: string;
  reservationId: string; // Meaningful reservation ID like RES2412151430A7B2
  restaurantId: string; // Which restaurant this reservation is for
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  reservationDetails: {
    date: string; // YYYY-MM-DD format
    time: string; // HH:MM format
    guests: number;
    specialRequests?: string;
    tableNumber?: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  notes?: string; // Admin notes
  createdAt: any;
  updatedAt: any;
  userId?: string; // Optional for registered users
  isGuest: boolean;
  guestSessionId?: string; // For guest users
}

// Create a new reservation
export const createReservation = async (reservationData: Omit<ReservationData, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Use the meaningful reservationId from reservationData as the document ID
    const reservationId = reservationData.reservationId;
    if (!reservationId) {
      throw new Error('Reservation ID is required');
    }

    const reservationRef = doc(db, 'reservations', reservationId);

    // Clean the data to remove undefined values
    const cleanReservationData = removeUndefinedValues(reservationData);

    const reservation = {
      ...cleanReservationData,
      id: reservationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(reservationRef, reservation);
    return { success: true, reservationId };
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return { success: false, error: error.message };
  }
};

// Get reservations for a specific restaurant
export const getRestaurantReservations = async (restaurantId: string) => {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const reservations: ReservationData[] = [];

    querySnapshot.forEach((doc) => {
      reservations.push(doc.data() as ReservationData);
    });

    return { success: true, data: reservations };
  } catch (error: any) {
    console.error('Error getting restaurant reservations:', error);
    return { success: false, error: error.message };
  }
};

// Get reservations for a specific user
export const getUserReservations = async (userId: string) => {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const reservations: ReservationData[] = [];

    querySnapshot.forEach((doc) => {
      reservations.push(doc.data() as ReservationData);
    });

    return { success: true, data: reservations };
  } catch (error: any) {
    console.error('Error getting user reservations:', error);
    return { success: false, error: error.message };
  }
};

// Get guest reservations
export const getGuestReservations = async (restaurantId: string, guestSessionId: string) => {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('restaurantId', '==', restaurantId),
      where('isGuest', '==', true),
      where('guestSessionId', '==', guestSessionId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const reservations: ReservationData[] = [];

    querySnapshot.forEach((doc) => {
      reservations.push(doc.data() as ReservationData);
    });

    return { success: true, data: reservations };
  } catch (error: any) {
    console.error('Error getting guest reservations:', error);
    return { success: false, error: error.message };
  }
};

// Update reservation status
export const updateReservationStatus = async (reservationId: string, status: ReservationData['status'], notes?: string) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    await updateDoc(reservationRef, updateData);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating reservation status:', error);
    return { success: false, error: error.message };
  }
};

// Update reservation details
export const updateReservation = async (reservationId: string, updateData: Partial<ReservationData>) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating reservation:', error);
    return { success: false, error: error.message };
  }
};

// Cancel reservation
export const cancelReservation = async (reservationId: string, reason?: string) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer',
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling reservation:', error);
    return { success: false, error: error.message };
  }
};

// Get reservation by ID
export const getReservationById = async (reservationId: string) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    const reservationSnap = await getDoc(reservationRef);

    if (reservationSnap.exists()) {
      return { success: true, data: reservationSnap.data() as ReservationData };
    } else {
      return { success: false, error: 'Reservation not found' };
    }
  } catch (error: any) {
    console.error('Error getting reservation:', error);
    return { success: false, error: error.message };
  }
};

// Check availability for a specific date and time
export const checkReservationAvailability = async (restaurantId: string, date: string, time: string) => {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('restaurantId', '==', restaurantId),
      where('reservationDetails.date', '==', date),
      where('reservationDetails.time', '==', time),
      where('status', 'in', ['confirmed', 'pending'])
    );

    const querySnapshot = await getDocs(q);
    const existingReservations = querySnapshot.size;

    // You can set a maximum number of reservations per time slot
    const maxReservationsPerSlot = 10; // Adjust based on your restaurant capacity

    return {
      success: true,
      available: existingReservations < maxReservationsPerSlot,
      currentBookings: existingReservations,
      maxBookings: maxReservationsPerSlot
    };
  } catch (error: any) {
    console.error('Error checking reservation availability:', error);
    return { success: false, error: error.message };
  }
};

// Real-time listeners for reservations
export const subscribeToRestaurantReservations = (
  restaurantId: string,
  callback: (reservations: ReservationData[]) => void
) => {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservations: ReservationData[] = [];
      snapshot.forEach((doc) => {
        reservations.push(doc.data() as ReservationData);
      });
      callback(reservations);
    }, (error) => {
      console.error('Error listening to restaurant reservations:', error);
    });

    return unsubscribe;
  } catch (error: any) {
    console.error('Error setting up restaurant reservations listener:', error);
    return () => { }; // Return empty function as fallback
  }
};

export const subscribeToUserReservations = (
  userId: string,
  callback: (reservations: ReservationData[]) => void
) => {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reservations: ReservationData[] = [];
      snapshot.forEach((doc) => {
        reservations.push(doc.data() as ReservationData);
      });
      callback(reservations);
    }, (error) => {
      console.error('Error listening to user reservations:', error);
    });

    return unsubscribe;
  } catch (error: any) {
    console.error('Error setting up user reservations listener:', error);
    return () => { }; // Return empty function as fallback
  }
};

// Restaurant Review Operations
// Create a new restaurant review
export const createRestaurantReview = async (reviewData: Omit<RestaurantReviewData, 'id' | 'createdAt' | 'updatedAt' | 'helpful' | 'notHelpful'>) => {
  try {
    const reviewRef = doc(collection(db, 'restaurantReviews'));

    const cleanReviewData = {
      restaurantId: reviewData.restaurantId || '',
      userId: reviewData.userId || '',
      userName: reviewData.userName || 'Anonymous',
      userEmail: reviewData.userEmail || '',
      userPhotoURL: reviewData.userPhotoURL || '',
      rating: reviewData.rating || 5,
      comment: reviewData.comment || '',
      isVerified: reviewData.isVerified || false,
      media: reviewData.media || []
    };

    // Use Firestore Timestamp objects for proper storage
    const currentDate = new Date();
    const firestoreTimestamp = Timestamp.fromDate(currentDate);
    console.log('Creating review with Firestore timestamp:', currentDate);

    const review = {
      ...cleanReviewData,
      id: reviewRef.id,
      helpful: 0,
      notHelpful: 0,
      createdAt: firestoreTimestamp,
      updatedAt: firestoreTimestamp,
    };

    const cleanedReview = removeUndefinedValues(review);
    await setDoc(reviewRef, cleanedReview);

    console.log('Review created successfully with real timestamps');
    return { success: true, data: review };
  } catch (error: any) {
    console.error('Error creating restaurant review:', error);
    return { success: false, error: error.message };
  }
};

// Get restaurant reviews
export const getRestaurantReviews = async (restaurantId: string) => {
  try {
    const reviewsRef = collection(db, 'restaurantReviews');
    const q = query(
      reviewsRef,
      where('restaurantId', '==', restaurantId)
    );
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const docMetadata = doc.metadata;

      // Handle server timestamp conversion
      let createdAt = data.createdAt;
      let updatedAt = data.updatedAt;

      // If createdAt has _methodName serverTimestamp, it means it was never resolved
      // Use the document's creation time from metadata as fallback
      if (createdAt && createdAt._methodName === 'serverTimestamp') {
        console.warn(`Document ${doc.id} has unresolved serverTimestamp, using document metadata`);
        // Use document metadata creation time or current time as fallback
        createdAt = new Date(); // We'll fix this with a migration function
      } else if (createdAt && createdAt.toDate && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate();
      } else if (createdAt && typeof createdAt === 'object' && 'seconds' in createdAt) {
        // Handle Firebase Timestamp with seconds
        createdAt = new Date(createdAt.seconds * 1000);
      }

      // Same for updatedAt
      if (updatedAt && updatedAt._methodName === 'serverTimestamp') {
        updatedAt = new Date();
      } else if (updatedAt && updatedAt.toDate && typeof updatedAt.toDate === 'function') {
        updatedAt = updatedAt.toDate();
      } else if (updatedAt && typeof updatedAt === 'object' && 'seconds' in updatedAt) {
        updatedAt = new Date(updatedAt.seconds * 1000);
      }

      return {
        id: doc.id,
        ...data,
        createdAt,
        updatedAt,
        helpful: data.helpful || 0,
        notHelpful: data.notHelpful || 0
      };
    }) as RestaurantReviewData[];

    // Sort by createdAt since we can't use orderBy with unresolved timestamps
    reviews.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date();
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date();
      return dateB.getTime() - dateA.getTime();
    });

    return { success: true, data: reviews };
  } catch (error: any) {
    console.error('Error getting restaurant reviews:', error);
    return { success: false, error: error.message };
  }
};

// Update a restaurant review
export const updateRestaurantReview = async (reviewId: string, updateData: Partial<RestaurantReviewData>) => {
  try {
    const reviewRef = doc(db, 'restaurantReviews', reviewId);

    // Use Firestore Timestamp for proper storage
    const currentDate = new Date();
    const firestoreTimestamp = Timestamp.fromDate(currentDate);
    console.log('Updating review with Firestore timestamp:', currentDate);

    const cleanedData = removeUndefinedValues({
      ...updateData,
      updatedAt: firestoreTimestamp,
    });

    await updateDoc(reviewRef, cleanedData);
    console.log('Review updated successfully with real timestamp');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating restaurant review:', error);
    return { success: false, error: error.message };
  }
};

// Delete a restaurant review
export const deleteRestaurantReview = async (reviewId: string) => {
  try {
    const reviewRef = doc(db, 'restaurantReviews', reviewId);
    await deleteDoc(reviewRef);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting restaurant review:', error);
    return { success: false, error: error.message };
  }
};

// Get restaurant rating and reviews count
export const getRestaurantRating = async (restaurantId: string) => {
  try {
    const reviewsRef = collection(db, 'restaurantReviews');
    const q = query(
      reviewsRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          reviews: []
        }
      };
    }

    const reviews = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RestaurantReviewData[];

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    return {
      success: true,
      data: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        reviews: reviews
      }
    };
  } catch (error: any) {
    console.error('Error getting restaurant rating:', error);
    return { success: false, error: error.message };
  }
};

// Fix documents with unresolved serverTimestamp
export const fixUnresolvedTimestamps = async (restaurantId: string) => {
  try {
    console.log('Fixing unresolved timestamps for restaurant:', restaurantId);

    const reviewsRef = collection(db, 'restaurantReviews');
    const q = query(reviewsRef, where('restaurantId', '==', restaurantId));
    const querySnapshot = await getDocs(q);

    const fixPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      const docRef = doc(db, 'restaurantReviews', docSnapshot.id);

      let needsUpdate = false;
      const updates: any = {};

      // Check if createdAt needs fixing
      if (data.createdAt && data.createdAt._methodName === 'serverTimestamp') {
        // Use a reasonable creation time - you can adjust this logic
        // For now, we'll use current time minus some random hours to simulate different creation times
        const hoursAgo = Math.floor(Math.random() * 24 * 30); // Random time within last 30 days
        updates.createdAt = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
        needsUpdate = true;
        console.log(`Fixing createdAt for document ${docSnapshot.id}`);
      }

      // Check if updatedAt needs fixing
      if (data.updatedAt && data.updatedAt._methodName === 'serverTimestamp') {
        updates.updatedAt = updates.createdAt || new Date();
        needsUpdate = true;
        console.log(`Fixing updatedAt for document ${docSnapshot.id}`);
      }

      if (needsUpdate) {
        await updateDoc(docRef, updates);
        console.log(`Fixed timestamps for document ${docSnapshot.id}`);
      }
    });

    await Promise.all(fixPromises);
    console.log('Finished fixing timestamps');
    return { success: true, message: 'Timestamps fixed successfully' };
  } catch (error: any) {
    console.error('Error fixing timestamps:', error);
    return { success: false, error: error.message };
  }
};

// Alternative: Fix a specific document's timestamps
export const fixDocumentTimestamps = async (reviewId: string, createdAtDate?: Date) => {
  try {
    const reviewRef = doc(db, 'restaurantReviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      return { success: false, error: 'Review not found' };
    }

    const data = reviewDoc.data();
    const updates: any = {};

    // Fix createdAt
    if (data.createdAt && data.createdAt._methodName === 'serverTimestamp') {
      updates.createdAt = createdAtDate || new Date();
    }

    // Fix updatedAt
    if (data.updatedAt && data.updatedAt._methodName === 'serverTimestamp') {
      updates.updatedAt = createdAtDate || new Date();
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(reviewRef, updates);
      console.log(`Fixed timestamps for review ${reviewId}`);
      return { success: true, message: 'Timestamps fixed' };
    }

    return { success: true, message: 'No timestamps needed fixing' };
  } catch (error: any) {
    console.error('Error fixing document timestamps:', error);
    return { success: false, error: error.message };
  }
};

// Manual fix for a specific review (you can call this from console)
export const fixSpecificReview = async (reviewId: string = 'SBFe2Dbaa08PRajYoJMy') => {
  try {
    console.log('Fixing specific review:', reviewId);

    // Set a reasonable creation date (you can adjust this)
    const creationDate = new Date('2024-12-15T10:30:00Z'); // Adjust this to when you think the review was created

    const result = await fixDocumentTimestamps(reviewId, creationDate);
    console.log('Fix result:', result);

    return result;
  } catch (error: any) {
    console.error('Error fixing specific review:', error);
    return { success: false, error: error.message };
  }
};

// Function to manually call from browser console to fix your specific review
// Usage: window.fixMyReview()
if (typeof window !== 'undefined') {
  (window as any).fixMyReview = fixSpecificReview;
}

// Immediate fix for your existing review with serverTimestamp issue
export const fixYourReviewNow = async () => {
  try {
    const reviewId = 'SBFe2Dbaa08PRajYoJMy';
    const reviewRef = doc(db, 'restaurantReviews', reviewId);

    // Set realistic timestamps using Firestore Timestamp objects
    const createdDate = new Date('2024-12-15T10:30:00Z'); // When you actually created the review
    const updatedDate = new Date('2024-12-15T10:30:00Z'); // Same as created for new reviews

    const createdTimestamp = Timestamp.fromDate(createdDate);
    const updatedTimestamp = Timestamp.fromDate(updatedDate);

    console.log('Fixing your existing review with Firestore timestamps...');
    console.log('Setting createdAt to:', createdDate);
    console.log('Setting updatedAt to:', updatedDate);

    await updateDoc(reviewRef, {
      createdAt: createdTimestamp,
      updatedAt: updatedTimestamp
    });

    console.log('✅ Your review has been fixed! No more _methodName nonsense!');
    return {
      success: true,
      message: 'Your review now has real timestamps!',
      createdAt: createdDate,
      updatedAt: updatedDate
    };
  } catch (error: any) {
    console.error('Error fixing your review:', error);
    return { success: false, error: error.message };
  }
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).fixMyReviewNow = fixYourReviewNow;
}

// Quick fix for your current review document that has empty timestamps
export const fixEmptyTimestamps = async () => {
  try {
    const reviewId = 'QAja2YzQPXQBZCSBtW9W'; // Your current review ID from the screenshot
    const reviewRef = doc(db, 'restaurantReviews', reviewId);

    // Set proper timestamps
    const createdDate = new Date('2024-12-20T08:00:00Z'); // Adjust this to when you actually created the review
    const updatedDate = new Date('2024-12-20T08:00:00Z');

    const createdTimestamp = Timestamp.fromDate(createdDate);
    const updatedTimestamp = Timestamp.fromDate(updatedDate);

    console.log('Fixing empty timestamps for review:', reviewId);
    console.log('Setting createdAt to:', createdDate);
    console.log('Setting updatedAt to:', updatedDate);

    await updateDoc(reviewRef, {
      createdAt: createdTimestamp,
      updatedAt: updatedTimestamp
    });

    console.log('✅ Empty timestamps fixed! Your review now has proper dates!');
    return {
      success: true,
      message: 'Empty timestamps fixed successfully!',
      reviewId,
      createdAt: createdDate,
      updatedAt: updatedDate
    };
  } catch (error: any) {
    console.error('Error fixing empty timestamps:', error);
    return { success: false, error: error.message };
  }
};

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).fixEmptyTimestamps = fixEmptyTimestamps;
}

// WhatsApp Phone Authentication Functions
export interface PhoneAuthSession {
  phoneNumber: string;
  otp: string;
  createdAt: any;
  expiresAt: any;
  attempts: number;
  verified: boolean;
  verifiedAt?: any;
}

// Generate a random 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via WhatsApp
export const sendPhoneOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Import the notification function
    const { sendNotification } = await import('./notification');
    
    // Format phone number (remove any spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let formattedPhone: string;

    if (cleanPhone.length === 10) {
      formattedPhone = `91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      formattedPhone = cleanPhone;
    } else {
      return { success: false, error: 'Invalid phone number format. Please enter a 10-digit Indian mobile number.' };
    }

    // Check if phone number already exists
    const phoneExists = await checkPhoneNumberExists(formattedPhone);
    if (!phoneExists.success) {
      return { success: false, error: 'Error checking phone number. Please try again.' };
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in Firestore with expiration
    const otpRef = doc(db, 'phoneAuth', formattedPhone);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    const otpData: PhoneAuthSession = {
      phoneNumber: formattedPhone,
      otp,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      attempts: 0,
      verified: false
    };

    await setDoc(otpRef, otpData);

    // Send OTP via WhatsApp
    const result = await sendNotification('PHONE_VERIFICATION_OTP', formattedPhone, {
      name: 'User',
      otp: otp
    });

    if (result.status || result.success) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send OTP. Please try again.' };
    }
  } catch (error: any) {
    console.error('Error sending phone OTP:', error);
    return { success: false, error: error.message };
  }
};

// Verify OTP and authenticate user
export const verifyPhoneOTP = async (phoneNumber: string, enteredOTP: string): Promise<{ success: boolean; user?: UserData; error?: string }> => {
  try {
    // Format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let formattedPhone: string;

    if (cleanPhone.length === 10) {
      formattedPhone = `91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      formattedPhone = cleanPhone;
    } else {
      return { success: false, error: 'Invalid phone number format.' };
    }

    // Get OTP data from Firestore
    const otpRef = doc(db, 'phoneAuth', formattedPhone);
    const otpDoc = await getDoc(otpRef);

    if (!otpDoc.exists()) {
      return { success: false, error: 'OTP not found. Please request a new OTP.' };
    }

    const otpData = otpDoc.data() as PhoneAuthSession;

    // Check if OTP is already verified
    if (otpData.verified) {
      return { success: false, error: 'OTP has already been used. Please request a new OTP.' };
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      return { success: false, error: 'Too many attempts. Please request a new OTP.' };
    }

    // Check expiry
    const now = new Date();
    const expiryTime = otpData.expiresAt.toDate();
    if (now > expiryTime) {
      return { success: false, error: 'OTP has expired. Please request a new OTP.' };
    }

    // Verify OTP
    if (otpData.otp !== enteredOTP) {
      // Increment attempts
      await updateDoc(otpRef, {
        attempts: otpData.attempts + 1
      });
      return { success: false, error: 'Invalid OTP. Please try again.' };
    }

    // OTP is correct, mark as verified
    await updateDoc(otpRef, {
      verified: true,
      verifiedAt: serverTimestamp()
    });

    // Check if user exists in database
    const phoneExists = await checkPhoneNumberExists(formattedPhone);
    if (phoneExists.success && phoneExists.exists) {
      // User exists, get their profile
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', formattedPhone));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data() as UserData;
        
        // Send welcome message
        try {
          const { sendNotification } = await import('./notification');
          await sendNotification('WELCOME_LOGIN', formattedPhone, {
            name: userData.displayName || 'User'
          });
        } catch (welcomeError) {
          console.error('Error sending welcome message:', welcomeError);
        }

        return { success: true, user: userData };
      }
    }

    // User doesn't exist, create new user
    const newUserId = `phone_${formattedPhone}`;
    const newUser: UserData = {
      uid: newUserId,
      email: '', // Will be updated later if user provides email
      displayName: '', // Will be updated during profile completion
      phoneNumber: formattedPhone,
      photoURL: '',
      userType: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const userResult = await createUserProfile(newUser);
    if (userResult.success) {
      // Send welcome message for new user
      try {
        const { sendNotification } = await import('./notification');
        await sendNotification('WELCOME_LOGIN', formattedPhone, {
          name: 'User'
        });
      } catch (welcomeError) {
        console.error('Error sending welcome message:', welcomeError);
      }

      return { success: true, user: newUser };
    } else {
      return { success: false, error: 'Failed to create user profile.' };
    }

  } catch (error: any) {
    console.error('Error verifying phone OTP:', error);
    return { success: false, error: error.message };
  }
};

// Complete phone user profile (for new users)
export const completePhoneUserProfile = async (
  phoneNumber: string,
  profileData: {
    displayName: string;
    email?: string;
  }
): Promise<{ success: boolean; user?: UserData; error?: string }> => {
  try {
    // Format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let formattedPhone: string;

    if (cleanPhone.length === 10) {
      formattedPhone = `91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      formattedPhone = cleanPhone;
    } else {
      return { success: false, error: 'Invalid phone number format.' };
    }

    // Find user by phone number
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', formattedPhone));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'User not found.' };
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    // Update user profile
    const updateData: Partial<UserData> = {
      displayName: profileData.displayName,
      updatedAt: serverTimestamp()
    };

    if (profileData.email) {
      updateData.email = profileData.email;
    }

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updateData);

    // Get updated user data
    const updatedUserDoc = await getDoc(userRef);
    const updatedUser = updatedUserDoc.data() as UserData;

    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error('Error completing phone user profile:', error);
    return { success: false, error: error.message };
  }
};

// Clean up expired OTPs (can be called periodically)
export const cleanupExpiredPhoneOTPs = async (): Promise<{ success: boolean; cleaned: number; error?: string }> => {
  try {
    const phoneAuthRef = collection(db, 'phoneAuth');
    const now = new Date();
    const querySnapshot = await getDocs(phoneAuthRef);

    let cleanedCount = 0;
    const deletePromises: Promise<void>[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as PhoneAuthSession;
      const expiryTime = data.expiresAt.toDate();
      
      if (now > expiryTime) {
        deletePromises.push(deleteDoc(doc.ref));
        cleanedCount++;
      }
    });

    await Promise.all(deletePromises);
    return { success: true, cleaned: cleanedCount };
  } catch (error: any) {
    console.error('Error cleaning up expired OTPs:', error);
    return { success: false, cleaned: 0, error: error.message };
  }
};
