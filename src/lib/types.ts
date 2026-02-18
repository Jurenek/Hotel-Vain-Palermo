// Types for the hotel app
import { LucideIcon } from 'lucide-react';

export interface Experience {
    id: number;
    category: 'tango' | 'food' | 'art' | 'tour';
    title: string;
    venue: string;
    description: string;
    time: string;
    price: string;
    icon: LucideIcon;
    image?: string;
}

export interface HotelInfo {
    breakfast: { start: string; end: string; location: string };
    pool: { start: string; end: string; location: string };
    reception: string;
    quietHours: { start: string; end: string };
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'guest' | 'hotel';
    timestamp: string;
}

export interface RoomServiceItem {
    id: string;
    name: string;
    description: string;
    price: string;
    category: 'breakfast' | 'drinks' | 'snacks' | 'dinner';
    available: boolean;
}
