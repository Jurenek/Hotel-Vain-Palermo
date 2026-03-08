
import { NextResponse } from 'next/server';
import { getRequestById, updateRequest, addMessage } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { status, message, sender } = body;
        const { id } = await params;

        const existingRequest = await getRequestById(id);

        if (!existingRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        let updatedRequest = existingRequest;

        if (status && message) {
            const result = await updateRequest(id, { status, message, sender: sender || 'reception' });
            if (result) updatedRequest = result;
        } else {
            if (status) {
                const result = await updateRequest(id, { status });
                if (result) updatedRequest = result;
            }

            if (message) {
                const result = await addMessage(id, { sender: sender || 'reception', text: message });
                if (result) updatedRequest = result;
            }
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error(`Error in PATCH /api/requests/[id] for ID ${(await params).id}:`, error);
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
