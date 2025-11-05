'use client';

import { Check } from 'lucide-react';

interface StepNavigationProps {
    currentStep: number;
}

export default function StepNavigation({ currentStep }: StepNavigationProps) {
    const steps = [
        { number: 1, label: 'Information', shortLabel: 'Info' },
        { number: 2, label: 'Review Order', shortLabel: 'Review' },
        { number: 3, label: 'Payment', shortLabel: 'Payment' }
    ];

    return (
        <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 sm:space-x-8">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center">
                        {/* Step Circle */}
                        <div className="flex items-center">
                            <div
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                                    currentStep >= step.number
                                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                {currentStep > step.number ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    step.number
                                )}
                            </div>
                            
                            {/* Step Label */}
                            <div className="ml-3 hidden sm:block">
                                <p className={`text-sm font-medium transition-colors ${
                                    currentStep === step.number
                                        ? 'text-gray-900 dark:text-white'
                                        : currentStep > step.number
                                        ? 'text-gray-700 dark:text-gray-300'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {step.label}
                                </p>
                            </div>
                            
                            {/* Mobile Label */}
                            <div className="ml-2 sm:hidden">
                                <p className={`text-xs font-medium transition-colors ${
                                    currentStep === step.number
                                        ? 'text-gray-900 dark:text-white'
                                        : currentStep > step.number
                                        ? 'text-gray-700 dark:text-gray-300'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {step.shortLabel}
                                </p>
                            </div>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className={`w-12 sm:w-16 h-px mx-4 sm:mx-6 transition-colors ${
                                currentStep > step.number
                                    ? 'bg-gray-900 dark:bg-gray-300'
                                    : 'bg-gray-300 dark:bg-gray-600'
                            }`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}