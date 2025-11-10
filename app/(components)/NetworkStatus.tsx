'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { checkNetworkStatus } from '../(utils)/firebase';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check initial network status
    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const status = await checkNetworkStatus();
        setIsOnline(status.online);
      } catch (error) {
        setIsOnline(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();

    // Listen for browser online/offline events
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !isChecking) {
    return null; // Don't show anything when online
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline ? 'bg-green-500' : 'bg-red-500'
    } text-white`}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm">Offline Mode</span>
        </>
      )}
    </div>
  );
}
