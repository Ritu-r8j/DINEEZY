'use client';

import styles from '../checkout.module.css';

interface OrderType {
    id: string;
    name: string;
    description: string;
    icon: string;
    selected: boolean;
}

interface DeliveryOption {
    id: string;
    name: string;
    description: string;
    time: string;
    price: number;
    selected: boolean;
}

interface OrderTypeSelectionProps {
    orderTypes: OrderType[];
    deliveryOptions: DeliveryOption[];
    selectedOrderType: OrderType | undefined;
    selectOrderType: (typeId: string) => void;
    selectDeliveryOption: (optionId: string) => void;
}

export default function OrderTypeSelection({
    orderTypes,
    deliveryOptions,
    selectedOrderType,
    selectOrderType,
    selectDeliveryOption
}: OrderTypeSelectionProps) {
    return (
        <div>
            <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${styles.subheading}`}>
                Order Type
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orderTypes.map((type) => (
                    <div
                        key={type.id}
                        onClick={() => selectOrderType(type.id)}
                        className={`${styles.orderTypeCard} ${type.selected ? styles.selectedCard : ''} p-4 cursor-pointer ${styles.focusVisible}`}
                    >
                        <div className="text-center">
                            <div className="mb-3 flex items-center justify-center">
                                {type.id === 'dine-in' && (
                                    <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4-4v4M8 3v4m8-4v4" />
                                        <circle cx="12" cy="12" r="3" strokeWidth="1.2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.5 12h3M12 10.5v3" />
                                    </svg>
                                )}
                                {type.id === 'takeaway' && (
                                    <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                )}
                                {type.id === 'pre-order' && (
                                    <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {type.id === 'car-dine-in' && (
                                    <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-4-1a1 1 0 001 1h3M9 17h4" />
                                    </svg>
                                )}
                                {type.id === 'delivery' && (
                                    <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17l4 4 4-4m-4-5v9m5-5v2a2 2 0 11-4 0v-2m0 0V7a2 2 0 114 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                                    </svg>
                                )}
                            </div>
                            <h4 className={`text-base font-medium text-gray-900 dark:text-white mb-1 ${styles.subheading}`}>
                                {type.name}
                            </h4>
                            <p className={`text-sm ${styles.bodyText}`}>
                                {type.description}
                            </p>
                        </div>

                        {/* Selection indicator */}
                        <div className="flex justify-center mt-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                type.selected
                                    ? 'border-gray-900 dark:border-gray-400 bg-gray-900 dark:bg-gray-400'
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}>
                                {type.selected && (
                                    <div className="w-2 h-2 rounded-full bg-white dark:bg-gray-900"></div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivery Options (only show if delivery is selected) */}
            {selectedOrderType?.id === 'delivery' && (
                <div className="mt-6">
                    <h4 className={`text-base font-medium text-gray-900 dark:text-white mb-4 ${styles.subheading}`}>
                        Delivery Options
                    </h4>
                    <div className="space-y-3">
                        {deliveryOptions.map((option) => (
                            <div
                                key={option.id}
                                onClick={() => selectDeliveryOption(option.id)}
                                className={`${styles.deliveryOption} ${option.selected ? styles.selectedCard : ''} flex items-center justify-between p-4 cursor-pointer ${styles.focusVisible}`}
                            >
                                <div className="flex items-center gap-3">
                                    <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17l4 4 4-4m-4-5v9m5-5v2a2 2 0 11-4 0v-2m0 0V7a2 2 0 114 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                                    </svg>
                                    <div>
                                        <h5 className={`text-sm font-medium text-gray-900 dark:text-white ${styles.subheading}`}>
                                            {option.name}
                                        </h5>
                                        <p className={`text-sm ${styles.bodyText}`}>
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            ₹{option.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        option.selected
                                            ? 'border-gray-900 dark:border-gray-400 bg-gray-900 dark:bg-gray-400'
                                            : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                        {option.selected && (
                                            <div className="w-2 h-2 rounded-full bg-white dark:bg-gray-900"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}