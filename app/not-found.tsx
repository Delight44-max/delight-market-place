'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/');
    }, [router]);


    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-lg">Redirecting to home...</p>
        </div>
    );
}