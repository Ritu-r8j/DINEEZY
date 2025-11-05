'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import styles from '../checkout.module.css';

interface StepNavButtonsProps {
    currentStep: number;
    isStep1Valid: () => boolean;
    isStep2Valid: () => boolean;
    isFormValid: () => boolean;
    isPlacingOrder: boolean;
    total: number;
    nextStep: () => void;
    prevStep: () => void;
    placeOrder: () => void;
}

export default function StepNavButtons({
    currentStep,
    isStep1Valid,
    isStep2Valid,
    isFormValid,
    isPlacingOrder,
    total,
    nextStep,
    prevStep,
    placeOrder
}: StepNavButtonsProps) {
    if (currentStep === 1) {
        return (
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={nextStep}
                    disabled={!isStep1Valid()}
                    className={`px-6 py-3 text-sm font-medium transition-all ${styles.stepButton} ${styles.focusVisible} ${
                        isStep1Valid() ? styles.primaryButton : styles.secondaryButton
                    }`}
                >
                    Continue to Review
                    <ChevronRight className="w-4 h-4 ml-2 inline" />
                </button>
            </div>
        );
    }

    if (currentStep === 2) {
        return (
            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={prevStep}
                    className={`px-6 py-3 text-sm font-medium transition-all ${styles.stepButton} ${styles.secondaryButton} ${styles.focusVisible}`}
                >
                    <ChevronLeft className="w-4 h-4 mr-2 inline" />
                    Back
                </button>
                <button
                    onClick={nextStep}
                    disabled={!isStep2Valid()}
                    className={`px-6 py-3 text-sm font-medium transition-all ${styles.stepButton} ${styles.focusVisible} ${
                        isStep2Valid() ? styles.primaryButton : styles.secondaryButton
                    }`}
                >
                    Continue to Payment
                    <ChevronRight className="w-4 h-4 ml-2 inline" />
                </button>
            </div>
        );
    }

    if (currentStep === 3) {
        return (
            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={prevStep}
                    className={`px-6 py-3 text-sm font-medium transition-all ${styles.stepButton} ${styles.secondaryButton} ${styles.focusVisible}`}
                >
                    <ChevronLeft className="w-4 h-4 mr-2 inline" />
                    Back
                </button>
                <button
                    onClick={placeOrder}
                    disabled={isPlacingOrder || !isFormValid()}
                    className={`px-8 py-3 text-sm font-medium transition-all ${styles.stepButton} ${styles.focusVisible} ${
                        isPlacingOrder || !isFormValid() ? styles.secondaryButton : styles.primaryButton
                    }`}
                >
                    {isPlacingOrder ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Complete Order • ₹{total.toFixed(2)}
                        </>
                    )}
                </button>
            </div>
        );
    }

    return null;
}