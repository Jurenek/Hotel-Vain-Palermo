import { supabase } from './supabase';

export interface Message {
    sender: 'guest' | 'reception';
    text: string;
    timestamp: string;
}

export interface Request {
    id: string;
    guest_id: string;
    guest_name: string;
    room_number: string;
    type: string;
    status: 'pending' | 'in_progress' | 'completed';
    messages: Message[];
    created_at: string;
    updated_at: string;
}

// Map database fields to app format (snake_case -> camelCase if needed, but we used snake_case in SQL)
// For verify-patch and existing code, we might need to adjust variable names or keep them consistent.
// The SQL uses snake_case: guest_id, guest_name, room_number.
// The app code (pages/api) uses camelCase: guestId, guestName, roomNumber.
// We need to map them here or update the app. Updating the app is cleaner but bigger diff.
// Let's map in the functions for now to minimize app changes.

export const getRequests = async (): Promise<Request[]> => {
    const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching requests:', error);
        return [];
    }

    // Map back to camelCase for the frontend if necessary, OR just return data if we update frontend types.
    // The frontend expects: guestName, roomNumber.
    // The DB has: guest_name, room_number.

    return data.map((r: any) => ({
        ...r,
        guestId: r.guest_id,
        guestName: r.guest_name,
        roomNumber: r.room_number,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    }));
};

export const getRequestById = async (id: string): Promise<Request | undefined> => {
    const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return undefined;

    return {
        ...data,
        guestId: data.guest_id,
        guestName: data.guest_name,
        roomNumber: data.room_number,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
};

export const createRequest = async (request: any): Promise<Request | null> => {
    const { data, error } = await supabase
        .from('requests')
        .insert([{
            guest_id: request.guestId,
            guest_name: request.guestName,
            room_number: request.roomNumber,
            type: request.type,
            status: 'pending',
            messages: request.messages || []
        }])
        .select()
        .single();

    if (error) {
        console.error('[createRequest] Supabase error:', error);
        return null;
    }
    console.log('[createRequest] Request created successfully:', data.id);

    return {
        ...data,
        guestId: data.guest_id,
        guestName: data.guest_name,
        roomNumber: data.room_number,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
};

export const updateRequest = async (id: string, updates: any): Promise<Request | null> => {
    try {
        const { message, sender, ...fieldUpdates } = updates;
        const dbUpdates: any = {};

        if (fieldUpdates.status) dbUpdates.status = fieldUpdates.status;
        dbUpdates.updated_at = new Date().toISOString();

        // If we have a message, we need to get current ones first
        if (message) {
            const current = await getRequestById(id);
            if (current) {
                const newMessage = {
                    sender: sender || 'reception',
                    text: message,
                    timestamp: new Date().toISOString()
                };
                const currentMessages = Array.isArray(current.messages) ? current.messages : [];
                dbUpdates.messages = [...currentMessages, newMessage];
            }
        }

        const { data, error } = await supabase
            .from('requests')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[updateRequest] Supabase error:', error);
            return null;
        }

        return {
            ...data,
            guestId: data.guest_id,
            guestName: data.guest_name,
            roomNumber: data.room_number,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    } catch (error) {
        console.error('[updateRequest] Exception:', error);
        return null;
    }
};

export const addMessage = async (requestId: string, message: Omit<Message, 'timestamp'>): Promise<Request | null> => {
    // 1. Get current messages
    const current = await getRequestById(requestId);
    if (!current) {
        console.error(`[addMessage] Request ${requestId} not found`);
        return null;
    }

    const newMessage = {
        ...message,
        timestamp: new Date().toISOString()
    };

    // Ensure messages is an array
    const currentMessages = Array.isArray(current.messages) ? current.messages : [];
    const updatedMessages = [...currentMessages, newMessage];

    const { data, error } = await supabase
        .from('requests')
        .update({
            messages: updatedMessages,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

    if (error) {
        console.error('[addMessage] Supabase error:', error);
        return null;
    }

    return {
        ...data,
        guestId: data.guest_id,
        guestName: data.guest_name,
        roomNumber: data.room_number,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}
