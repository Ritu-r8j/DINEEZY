'use client';

import { X, AlertTriangle } from 'lucide-react';

interface ReplaceCartModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentRestaurantName: string;
  newRestaurantName: string;
  itemCount: number;
}

export default function ReplaceCartModal({
  isOpen,
  onConfirm,
  onCancel,
  currentRestaurantName,
  newRestaurantName,
  itemCount
}: ReplaceCartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Replace Cart Items?</h3>
              <p className="text-sm text-muted-foreground mt-1">Different restaurant detected</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Current cart from:</p>
              <p className="font-semibold text-foreground">{currentRestaurantName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {itemCount} item{itemCount > 1 ? 's' : ''} in cart
              </p>
            </div>
            
            <div className="border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">New item from:</p>
              <p className="font-semibold text-foreground">{newRestaurantName}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Your cart contains items from <span className="font-semibold text-foreground">{currentRestaurantName}</span>. 
            Adding items from <span className="font-semibold text-foreground">{newRestaurantName}</span> will 
            replace your current cart items.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-border">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg transition-colors"
          >
            Keep Current Cart
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            Replace Cart
          </button>
        </div>
      </div>
    </div>
  );
}
