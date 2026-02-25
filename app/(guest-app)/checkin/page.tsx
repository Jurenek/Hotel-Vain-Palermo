'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is no longer needed - redirect to home
export default function CheckInPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null;
}
