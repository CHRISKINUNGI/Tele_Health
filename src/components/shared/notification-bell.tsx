'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types';
import Link from 'next/link';

interface NotificationBellProps {
    userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadNotifications();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`notifications_${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    loadNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const loadNotifications = async () => {
        try {
            const data = await getUserNotifications(userId, 10);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            await loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead(userId);
            await loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`p-4 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                                onClick={() => {
                                    if (!notification.read) {
                                        handleMarkAsRead(notification.id);
                                    }
                                }}
                            >
                                {notification.link ? (
                                    <Link href={notification.link} className="w-full">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-start justify-between">
                                                <p className="font-medium text-sm">{notification.title}</p>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="flex flex-col gap-1 w-full">
                                        <div className="flex items-start justify-between">
                                            <p className="font-medium text-sm">{notification.title}</p>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatTime(notification.created_at)}
                                        </p>
                                    </div>
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
