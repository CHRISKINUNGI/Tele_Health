'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Clock, Users, Calendar } from 'lucide-react';

interface AnalyticsData {
    totalVolume: number;
    completedCount: number;
    avgWaitMins: number;
    avgConsultationMins: number;
    typeSplit: { inPerson: number, virtual: number };
    trend: Array<{ day: string, volume: number, wait: number }>;
}

export function AdminAnalytics({ data }: { data: AnalyticsData }) {
    const maxVolume = Math.max(...data.trend.map(d => d.volume));

    return (
        <div className="space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Volume', value: data.totalVolume, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Avg Wait Time', value: `${data.avgWaitMins}m`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Avg Session', value: `${data.avgConsultationMins}m`, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Network Throughput', value: `${Math.round((data.completedCount / Math.max(1, data.totalVolume)) * 100)}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                ].map((stat, i) => (
                    <Card key={i} className="border-gray-200 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">{stat.value}</h3>
                                </div>
                                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Volume Trend Chart */}
                <Card className="lg:col-span-2 border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Activity Trend (7 Days)
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-64 flex items-end justify-between gap-4">
                            {data.trend.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative flex flex-col items-center">
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded-md font-bold z-10 whitespace-nowrap">
                                            {day.volume} Visits
                                        </div>
                                        {/* Bar */}
                                        <div
                                            className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600 relative overflow-hidden"
                                            style={{ height: `${(day.volume / maxVolume) * 200}px` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Patient Split */}
                <Card className="border-gray-200">
                    <CardHeader className="border-b bg-gray-50/50 py-4">
                        <CardTitle className="text-lg">Service Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="font-semibold">In-Person Visits</span>
                                </div>
                                <span className="text-gray-500 font-bold">{data.typeSplit.inPerson}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-1000"
                                    style={{ width: `${(data.typeSplit.inPerson / Math.max(1, data.totalVolume)) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                                    <span className="font-semibold">Virtual Consults</span>
                                </div>
                                <span className="text-gray-500 font-bold">{data.typeSplit.virtual}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-purple-500 h-full transition-all duration-1000"
                                    style={{ width: `${(data.typeSplit.virtual / Math.max(1, data.totalVolume)) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t text-center">
                            <p className="text-xs text-gray-400 font-medium">
                                Total network volume has increased by <span className="text-green-600 font-bold">+12%</span> this week.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
