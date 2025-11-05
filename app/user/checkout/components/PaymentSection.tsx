'use client';

import styles from '../checkout.module.css';

interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
    selected: boolean;
}

interface PaymentSectionProps {
    paymentMethods: PaymentMethod[];
    promoCode: string;
    setPromoCode: (code: string) => void;
    selectPaymentMethod: (methodId: string) => void;
}

export default function PaymentSection({
    paymentMethods,
    promoCode,
    setPromoCode,
    selectPaymentMethod
}: PaymentSectionProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className={`text-xl font-semibold text-gray-900 dark:text-white mb-6 ${styles.heading}`}>
                    Payment Method
                </h2>

                {/* Payment Method */}
                <div className="mb-6">
                    <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${styles.subheading}`}>
                        Choose Payment Method
                    </h3>
                    <div className="space-y-3">
                        {paymentMethods.map((method) => (
                            <div
                                key={method.id}
                                onClick={() => selectPaymentMethod(method.id)}
                                className={`${styles.paymentMethod} ${method.selected ? styles.selectedCard : ''} flex items-center gap-4 p-4 cursor-pointer ${styles.focusVisible}`}
                            >
                                <div className="text-2xl">
                                    {method.id === 'card' && <span className="text-blue-500">💳</span>}
                                    {method.id === 'upi' && <span className="text-purple-500">📱</span>}
                                    {method.id === 'cash' && <span className="text-green-500">💵</span>}
                                </div>
                                <span className={`flex-1 font-medium text-gray-900 dark:text-white ${styles.subheading}`}>
                                    {method.name}
                                </span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    method.selected
                                        ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                    {method.selected && (
                                        <div className="w-2 h-2 rounded-full bg-white dark:bg-gray-900"></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Promo Code */}
                <div>
                    <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${styles.subheading}`}>
                        Promo Code
                    </h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder="Enter promo code"
                            className={`flex-1 px-3 py-2.5 text-sm ${styles.modernInput} ${styles.focusVisible}`}
                        />
                        <button className={`px-4 py-2.5 text-sm font-medium ${styles.secondaryButton} ${styles.focusVisible}`}>
                            Apply
                        </button>
                    </div>
                    <p className={`text-xs mt-2 ${styles.bodyText}`}>
                        Optional - Enter a valid promo code to get a discount
                    </p>
                </div>
            </div>
        </div>
    );
}