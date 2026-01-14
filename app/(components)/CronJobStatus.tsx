'use client';

import { useState } from 'react';
import { Clock, Play, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function CronJobStatus() {
    const [isLoading, setIsLoading] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    const testCronJob = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/test-cron', {
                method: 'POST'
            });
            const result = await response.json();
            setLastResult(result);
        } catch (error) {
            setLastResult({
                success: false,
                error: 'Failed to test cron job'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Auto-Cancel Cron Job
                </h3>
            </div>
            
            <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Automatically cancels pending orders older than 30 minutes.</p>
                    <p className="text-xs mt-1">Runs every 30 minutes • Excludes reservation orders</p>
                </div>

                <button
                    onClick={testCronJob}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
                >
                    {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                    {isLoading ? 'Testing...' : 'Test Now'}
                </button>

                {lastResult && (
                    <div className={`p-3 rounded-lg border ${
                        lastResult.success 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            {lastResult.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${
                                lastResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                            }`}>
                                {lastResult.message}
                            </span>
                        </div>
                        
                        {lastResult.details && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                <p>Cancelled: {lastResult.details.cancelledCount || 0} orders</p>
                                {lastResult.details.cancelledOrders && lastResult.details.cancelledOrders.length > 0 && (
                                    <p className="mt-1">Orders: {lastResult.details.cancelledOrders.join(', ')}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}