import { NextResponse } from 'next/server';
import { updateExperience, deleteExperience, getExperienceById } from '@/lib/experiences-db';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updated = await updateExperience(Number(id), body);

        if (!updated) {
            return NextResponse.json(
                { error: 'Experience not found or failed to update' },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating experience:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const success = await deleteExperience(Number(id));

        if (!success) {
            return NextResponse.json(
                { error: 'Experience not found or failed to delete' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting experience:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
