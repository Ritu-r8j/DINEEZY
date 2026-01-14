import { NextRequest, NextResponse } from 'next/server';
import { cancelOldPendingOrders } from '@/app/(utils)/firebaseOperations';

// Test endpoint to manually trigger the cron job
export async function GET(request: NextRequest) {
    try {
        console.log('🧪 Manual test: Cancelling old pending orders...');
        
        const result = await cancelOldPendingOrders();
        
        return NextResponse.json({
            success: result.success,
            message: result.success 
                ? `Test completed: ${result.cancelledCount} orders cancelled`
                : `Test failed: ${result.error}`,
            details: result
        });
    } catch (error: any) {
        console.error('❌ Test error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return GET(request);
}