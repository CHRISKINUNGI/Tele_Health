'use client';

import { Sidebar } from '@/components/shared/sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userRole: 'doctor' | 'patient' | 'admin';
    userId: string;
    userName: string;
    userDetails?: string;
}

export function DashboardLayout({
    children,
    userRole,
    userId,
    userName,
    userDetails,
}: DashboardLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                userRole={userRole}
                userId={userId}
                userName={userName}
                userDetails={userDetails}
            />
            <main className="flex-1 overflow-y-auto bg-gray-50">
                {children}
            </main>
        </div>
    );
}
