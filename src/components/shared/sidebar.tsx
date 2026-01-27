'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    MessageSquare,
    Calendar,
    FileText,
    Users,
    Settings,
    LogOut,
    Activity,
    ClipboardList,
    BarChart3,
    Bell
} from 'lucide-react';
import { NotificationBell } from './notification-bell';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    userRole: 'doctor' | 'patient' | 'admin';
    userId: string;
    userName: string;
    userDetails?: string;
}

export function Sidebar({ userRole, userId, userName, userDetails }: SidebarProps) {
    const pathname = usePathname();

    const getNavigationItems = () => {
        switch (userRole) {
            case 'doctor':
                return [
                    { href: '/provider', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/messages', label: 'Messages', icon: MessageSquare },
                    { href: '/provider/appointments', label: 'Appointments', icon: Calendar },
                    { href: '/provider/patients', label: 'Patients', icon: Users },
                    { href: '/provider/notes', label: 'Clinical Notes', icon: FileText },
                ];
            case 'patient':
                return [
                    { href: '/patient', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/messages', label: 'Messages', icon: MessageSquare },
                    { href: '/patient/appointments', label: 'My Appointments', icon: Calendar },
                    { href: '/patient/records', label: 'Medical Records', icon: FileText },
                    { href: '/patient/documents', label: 'Documents', icon: ClipboardList },
                ];
            case 'admin':
                return [
                    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                    { href: '/admin?tab=analytics', label: 'Analytics', icon: BarChart3 },
                    { href: '/admin?tab=reassignment', label: 'Appointments', icon: Calendar },
                    { href: '/admin?tab=users', label: 'Users', icon: Users },
                    { href: '/admin?tab=health', label: 'System Health', icon: Activity },
                ];
            default:
                return [];
        }
    };

    const navigationItems = getNavigationItems();

    const isActive = (href: string) => {
        if (href === '/provider' || href === '/patient' || href === '/admin') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-blue-600">🏥 Telehealth</h1>
                <p className="text-xs text-gray-500 mt-1">Resource Management</p>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                        {userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">
                            {userDetails || userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </p>
                    </div>
                    <NotificationBell userId={userId} />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-1">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                                        active
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    )}
                                >
                                    <Icon className={cn('h-5 w-5', active ? 'text-blue-700' : 'text-gray-500')} />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 space-y-2">
                <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-start gap-3">
                        <Settings className="h-5 w-5" />
                        Settings
                    </Button>
                </Link>
                <Link href="/login">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="h-5 w-5" />
                        Sign Out
                    </Button>
                </Link>
            </div>
        </div>
    );
}
