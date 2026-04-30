// Hotel guest store
'use client';

import { create } from 'zustand';

export interface GuestData {
    name: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    wifiPassword: string;
    email?: string;
    checkInCompleted: boolean;
    checkInTime?: string;
    language: 'es' | 'en';
    reservationId?: string;
}

interface GuestStore {
    guest: GuestData;
    updateGuest: (data: Partial<GuestData>) => void;
    completeCheckIn: (email: string, time: string) => void;
    resetGuest: () => void;
}

const defaultGuest: GuestData = {
    name: 'Invitado',
    email: '',
    roomNumber: '304',
    checkIn: '8 Feb 2026',
    checkOut: '12 Feb 2026',
    checkInTime: '',
    wifiPassword: 'love2bevain',
    checkInCompleted: false,
    language: 'es',
};

// Helper to get initial state from localStorage
const getInitialGuest = (): GuestData => {
    if (typeof window === 'undefined') return defaultGuest;
    const stored = localStorage.getItem('vain-hotel-guest');
    return stored ? JSON.parse(stored) : defaultGuest;
};

export const useGuestStore = create<GuestStore>((set) => ({
    guest: getInitialGuest(),
    updateGuest: (data) =>
        set((state) => {
            const newGuest = { ...state.guest, ...data };
            if (typeof window !== 'undefined') {
                localStorage.setItem('vain-hotel-guest', JSON.stringify(newGuest));
            }
            return { guest: newGuest };
        }),
    completeCheckIn: (email, time) =>
        set((state) => {
            const newGuest = {
                ...state.guest,
                email,
                checkInTime: time,
                checkInCompleted: true,
            };
            if (typeof window !== 'undefined') {
                localStorage.setItem('vain-hotel-guest', JSON.stringify(newGuest));
            }
            return { guest: newGuest };
        }),
    resetGuest: () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('vain-hotel-guest', JSON.stringify(defaultGuest));
        }
        return set({ guest: defaultGuest });
    },
}));
