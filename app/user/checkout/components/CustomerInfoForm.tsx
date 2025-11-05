'use client';

import styles from '../checkout.module.css';

interface CustomerInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface CustomerInfoFormProps {
    customerInfo: CustomerInfo;
    setCustomerInfo: (info: CustomerInfo) => void;
    isLoggedIn: boolean;
}

export default function CustomerInfoForm({ 
    customerInfo, 
    setCustomerInfo, 
    isLoggedIn 
}: CustomerInfoFormProps) {
    return (
        <div className="mb-6">
            <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${styles.subheading}`}>
                Contact Information
            </h3>

            {isLoggedIn ? (
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-3 text-green-800 dark:text-green-300">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">Using your account information</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                value={customerInfo.firstName}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                                placeholder="Enter your first name"
                                className={`w-full px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={customerInfo.lastName}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                                placeholder="Enter your last name"
                                className={`w-full px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                value={customerInfo.email}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                placeholder="your.email@example.com"
                                className={`w-full px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={customerInfo.phone}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                placeholder="(555) 123-4567"
                                className={`w-full px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-3 text-blue-800 dark:text-blue-300">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div>
                                <span className="text-sm font-medium">Guest Checkout</span>
                                <p className={`text-sm mt-1 ${styles.bodyText}`}>
                                    Create an account to save your information for faster checkout next time.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                value={customerInfo.firstName}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                                placeholder="Enter your first name"
                                className={`w-full px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={customerInfo.lastName}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                                placeholder="Enter your last name"
                                className={`w-full px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                value={customerInfo.email}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                placeholder="your.email@example.com"
                                className={`w-full px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={customerInfo.phone}
                                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                placeholder="(555) 123-4567"
                                className={`w-full px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                            />
                        </div>
                    </div>
                </div>
            )}

            <p className={`text-xs mt-3 ${styles.bodyText}`}>
                * Required fields. We'll use this information to contact you about your order.
            </p>
        </div>
    );
}