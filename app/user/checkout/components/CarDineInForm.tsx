'use client';

import { useState } from 'react';
import styles from '../checkout.module.css';

interface CarDineInFormProps {
    carDetails: {
        model: string;
        number: string;
    };
    serviceMode: 'EAT_IN_CAR' | 'TAKEAWAY';
    scheduledTime: string;
    availableTimeSlots: string[];
    onCarDetailsChange: (details: { model: string; number: string }) => void;
    onServiceModeChange: (mode: 'EAT_IN_CAR' | 'TAKEAWAY') => void;
    onScheduledTimeChange: (time: string) => void;
}

export default function CarDineInForm({
    carDetails,
    serviceMode,
    scheduledTime,
    availableTimeSlots,
    onCarDetailsChange,
    onServiceModeChange,
    onScheduledTimeChange
}: CarDineInFormProps) {
    return (
        <div className="space-y-4 mt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Car Dine-In Details
            </h3>

            {/* Time Slot Picker */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Time Slot *
                </label>
                <select
                    value={scheduledTime}
                    onChange={(e) => onScheduledTimeChange(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                >
                    <option value="">Choose a time slot</option>
                    {availableTimeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                            {slot}
                        </option>
                    ))}
                </select>
            </div>

            {/* Car Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Car Model *
                    </label>
                    <input
                        type="text"
                        value={carDetails.model}
                        onChange={(e) => onCarDetailsChange({ ...carDetails, model: e.target.value })}
                        placeholder="e.g., Honda Civic"
                        className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Car Number *
                    </label>
                    <input
                        type="text"
                        value={carDetails.number}
                        onChange={(e) => onCarDetailsChange({ ...carDetails, number: e.target.value })}
                        placeholder="e.g., ABC-1234"
                        className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                    />
                </div>
            </div>

            {/* Service Mode Toggle */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Service Mode *
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => onServiceModeChange('EAT_IN_CAR')}
                        className={`${styles.orderTypeCard} p-4 cursor-pointer rounded-lg border-2 transition-all ${
                            serviceMode === 'EAT_IN_CAR'
                                ? 'border-gray-900 dark:border-gray-400 bg-gray-900 dark:bg-gray-700 text-white'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                    >
                        <div className="text-center">
                            <div className="text-2xl mb-2">🍽️</div>
                            <h4 className="text-sm font-medium mb-1">Eat in the Car</h4>
                            <p className="text-xs opacity-80">Full service at your car</p>
                        </div>
                    </div>
                    <div
                        onClick={() => onServiceModeChange('TAKEAWAY')}
                        className={`${styles.orderTypeCard} p-4 cursor-pointer rounded-lg border-2 transition-all ${
                            serviceMode === 'TAKEAWAY'
                                ? 'border-gray-900 dark:border-gray-400 bg-gray-900 dark:bg-gray-700 text-white'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                    >
                        <div className="text-center">
                            <div className="text-2xl mb-2">🥡</div>
                            <h4 className="text-sm font-medium mb-1">Takeaway</h4>
                            <p className="text-xs opacity-80">Pick up from car</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                    {serviceMode === 'EAT_IN_CAR' 
                        ? '🚗 Your order will be served at your car with full service (water, assistance, tray pickup).'
                        : '🥡 Your order will be ready for pickup at your car. No additional services included.'}
                </p>
            </div>
        </div>
    );
}
