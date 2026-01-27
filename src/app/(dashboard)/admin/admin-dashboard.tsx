'use client';

import { useEffect, useState } from 'react';
import { TrafficComparison } from '@/components/admin/traffic-comparison';
import { ReassignmentTable } from '@/components/admin/reassignment-table';
import { DoctorLoadGrid } from '@/components/admin/doctor-load-grid';
import { AdminSettings } from '@/components/admin/admin-settings';
import { AdminAnalytics } from '@/components/admin/admin-analytics';
import { UserManagement } from '@/components/admin/user-management';
import { SystemHealth } from '@/components/admin/system-health';
import { getFlaggedQueueEntries, getDoctorLoads } from '@/lib/actions/queue';
import { getSystemAnalytics } from '@/lib/actions/analytics';
import { getAllProfiles } from '@/lib/actions/profiles';
import { reassignAppointment } from '@/lib/actions/appointments';
import { useRealtimeQueue } from '@/hooks/use-realtime-queue';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Users, Settings, Activity, BarChart3, ShieldCheck } from 'lucide-react';
import type { QueueEntry } from '@/lib/types';

export function AdminDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [flaggedEntries, setFlaggedEntries] = useState<QueueEntry[]>([]);
    const [doctorLoads, setDoctorLoads] = useState<any[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [inPersonCapacity, setInPersonCapacity] = useState(25);
    const [loading, setLoading] = useState(true);
    const { queueEntries } = useRealtimeQueue();

    useEffect(() => {
        loadDashboardData();
    }, [queueEntries]);

    const loadDashboardData = async () => {
        try {
            const [flagged, loads, analytics, allProfiles] = await Promise.all([
                getFlaggedQueueEntries(),
                getDoctorLoads(),
                getSystemAnalytics(),
                getAllProfiles()
            ]);
            setFlaggedEntries(flagged as QueueEntry[]);
            setDoctorLoads(loads);
            setAnalyticsData(analytics);
            setProfiles(allProfiles);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReassign = async (appointmentId: string, newDoctorId: string) => {
        try {
            await reassignAppointment(appointmentId, newDoctorId);
            await loadDashboardData();
        } catch (error) {
            console.error('Error reassigning appointment:', error);
            throw error; // Let the caller handle it
        }
    };

    // Calculate traffic stats
    const inPersonCount = queueEntries.filter(
        entry => entry.appointment?.type === 'in_person'
    ).length;
    const virtualCount = queueEntries.filter(
        entry => entry.appointment?.type === 'virtual'
    ).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Syncing system data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Live</span>
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Command Center</h1>
                            <p className="text-sm text-gray-500 font-medium">
                                Monitoring {queueEntries.length} active sessions across the network
                            </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Local Time</p>
                                <p className="text-xl font-black text-gray-900 tabular-nums">
                                    {new Date().toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                    })}
                                </p>
                            </div>
                            <div className="h-10 w-px bg-gray-200" />
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">System Health</p>
                                <p className="text-xl font-black text-green-600">Optimal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sub-navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => router.push(`/admin?tab=${val}`)}
                    className="space-y-8"
                >
                    <TabsList className="bg-white border p-1 rounded-xl shadow-sm inline-flex">
                        <TabsTrigger value="overview" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            <LayoutDashboard className="h-4 w-4" />
                            System Overview
                        </TabsTrigger>
                        <TabsTrigger value="doctors" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            <Users className="h-4 w-4" />
                            Provider Loads
                        </TabsTrigger>
                        <TabsTrigger value="reassignment" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            <Activity className="h-4 w-4" />
                            Reassignment Queue
                            {flaggedEntries.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                    {flaggedEntries.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            <Users className="h-4 w-4" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="health" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            <ShieldCheck className="h-4 w-4" />
                            System Health
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="gap-2 px-6 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            <Settings className="h-4 w-4" />
                            Config
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 outline-none">
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-xl font-black text-gray-900">Patient Flow Dynamics</h2>
                                <div className="h-px flex-1 bg-gray-200" />
                            </div>
                            <TrafficComparison
                                inPersonCount={inPersonCount}
                                virtualCount={virtualCount}
                                inPersonCapacity={inPersonCapacity}
                            />
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <section className="space-y-4">
                                <h3 className="font-bold text-gray-900">Critical Reassignments</h3>
                                <ReassignmentTable
                                    flaggedEntries={flaggedEntries.slice(0, 3)}
                                    onReassign={handleReassign}
                                />
                            </section>
                            <section className="space-y-4">
                                <h3 className="font-bold text-gray-900">Provider Pulse</h3>
                                <DoctorLoadGrid loads={doctorLoads.slice(0, 3)} />
                            </section>
                        </div>
                    </TabsContent>

                    <TabsContent value="doctors" className="space-y-4 outline-none">
                        <DoctorLoadGrid loads={doctorLoads} />
                    </TabsContent>

                    <TabsContent value="reassignment" className="space-y-4 outline-none">
                        <ReassignmentTable
                            flaggedEntries={flaggedEntries}
                            onReassign={handleReassign}
                        />
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4 outline-none">
                        {analyticsData && <AdminAnalytics data={analyticsData} />}
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4 outline-none">
                        <UserManagement profiles={profiles} />
                    </TabsContent>

                    <TabsContent value="health" className="space-y-4 outline-none">
                        <SystemHealth />
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4 outline-none">
                        <AdminSettings
                            inPersonCapacity={inPersonCapacity}
                            onUpdateCapacity={setInPersonCapacity}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
