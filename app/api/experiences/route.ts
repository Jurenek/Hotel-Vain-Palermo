import { NextResponse } from 'next/server';
import { getExperiences, createExperience } from '@/lib/experiences-db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const experiences = await getExperiences();
    return NextResponse.json(experiences);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, venue, description, time, price, icon, category, bookable, rating, distance } = body;

        if (!title || !venue || !description) {
            return NextResponse.json(
                { error: 'Missing required fields: title, venue, description' },
                { status: 400 }
            );
        }

        const experience = await createExperience({
            title,
            venue,
            description,
            time: time || '',
            price: price || '',
            icon: icon || 'Music',
            category: category || 'food',
            bookable: bookable ?? false,
            rating: rating || null,
            distance: distance || null,
        });

        if (!experience) {
            return NextResponse.json(
                { error: 'Failed to create experience' },
                { status: 500 }
            );
        }

        return NextResponse.json(experience, { status: 201 });
    } catch (error) {
        console.error('Error creating experience:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
