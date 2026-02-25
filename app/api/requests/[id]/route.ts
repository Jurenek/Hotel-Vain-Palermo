
import { NextResponse } from 'next/server';
import { getRequestById, updateRequest, addMessage } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const body = await request.json();
    const { status, message, sender } = body;
    const { id } = await params;

    const existingRequest = await getRequestById(id);

    if (!existingRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let updatedRequest = existingRequest;

    if (status) {
        const result = await updateRequest(id, { status });
        if (result) updatedRequest = result;
    }

    if (message) {
        const result = await addMessage(id, { sender: sender || 'reception', text: message });
        if (result) updatedRequest = result;
    }

    return NextResponse.json(updatedRequest);
}
