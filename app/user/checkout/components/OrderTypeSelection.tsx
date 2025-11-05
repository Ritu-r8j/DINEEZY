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
                            <div className="text-3xl mb-3">
                                {type.id === 'dine-in' && <span className="text-orange-500">🍽️</span>}
                                {type.id === 'takeaway' && <span className="text-green-500">🥡</span>}
                                {type.id === 'delivery' && <span className="text-blue-500">🚚</span>}
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
                                    ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100'
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
                                    <div className="text-2xl">
                                        <span className="text-blue-500">🚚</span>
                                    </div>
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
                                            ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100'
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