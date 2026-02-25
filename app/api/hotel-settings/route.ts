import { NextResponse } from 'next/server';
import { getHotelSettings, updateHotelSettings } from '@/lib/hotel-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    const settings = await getHotelSettings();
    return NextResponse.json(settings);
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const updated = await updateHotelSettings(body);
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating hotel settings:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
