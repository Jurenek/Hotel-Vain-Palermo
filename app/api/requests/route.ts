
import { NextResponse } from 'next/server';
import { getRequests, createRequest, Request as DbRequest } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const requests = await getRequests();
        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error in GET /api/requests:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { guestId, guestName, roomNumber, type, message } = body;

        if (!guestId || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newRequest = await createRequest({
            guestId,
            guestName: guestName || 'Guest',
            roomNumber: roomNumber || 'Unknown',
            type,
            messages: message ? [{ sender: 'guest', text: message, timestamp: new Date().toISOString() }] : [],
        });

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        console.error('Error processing POST request:', error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
