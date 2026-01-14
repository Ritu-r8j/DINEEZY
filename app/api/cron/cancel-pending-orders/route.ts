import { NextRequest, NextResponse } from 'next/server';
import { cancelOldPendingOrders } from '@/app/(utils)/firebaseOperations';

export async function GET(request: NextRequest) {
    try {
        // Verify the request is from Vercel Cron (optional security check)
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🕐 Cron job started: Cancelling old pending orders...');
        
        const result = await cancelOldPendingOrders();
        
        if (result.success) {
            console.log(`✅ Cron job completed: ${result.cancelledCount} orders cancelled`);
            return NextResponse.json({
                success: true,
                message: `Successfully cancelled ${result.cancelledCount} old pending orders`,
                cancelledCount: result.cancelledCount,
                cancelledOrders: result.cancelledOrders
            });
        } else {
            console.error('❌ Cron job failed:', result.error);
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('❌ Cron job error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
    return GET(request);
}