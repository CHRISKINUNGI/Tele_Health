'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldCheck, Database, Zap, Cpu, Server } from 'lucide-react';

export function SystemHealth() {
    const [latency, setLatency] = useState(24);
    const [uptime, setUptime] = useState('99.98%');
    const [status, setStatus] = useState<'healthy' | 'degraded'>('healthy');

    // Simulate real-time monitoring
    useEffect(() => {
        const interval = setInterval(() => {
            setLatency(Math.floor(Math.random() * 15) + 15);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">System Integrity</p>
                                <h3 className="text-xl font-black text-gray-900">Secure & Verified</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Database Latency</p>
                                <h3 className="text-xl font-black text-gray-900 tabular-nums">{latency}ms</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Current Uptime</p>
                                <h3 className="text-xl font-black text-gray-900">{uptime}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b py-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Server className="h-5 w-5 text-gray-500" />
                        Network Infrastructure Status
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                        Operational
                    </Badge>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Status Blocks */}
                        <div className="space-y-6">
                            {[
                                { name: 'Authentication Engine', status: 'Healthy', icon: ShieldCheck },
                                { name: 'Real-time Broadcast Service', status: 'Healthy', icon: Activity },
                                { name: 'Document Analysis (AI)', status: 'Healthy', icon: Cpu },
                                { name: 'Cloud Storage API', status: 'Healthy', icon: Server },
                            ].map((service, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <service.icon className="h-4 w-4" />
                                        </div>
                                        <span className="font-bold text-gray-900 text-sm">{service.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-xs font-bold text-green-600 uppercase tracking-tighter">{service.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Performance Pulse Visualization */}
                        <div className="bg-gray-900 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
                            <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">Traffic Load Pulse</h4>
                            <div className="h-32 flex items-center justify-center gap-1.5">
                                {[2, 4, 3, 5, 8, 4, 6, 2, 9, 3, 5, 2, 7, 4, 3].map((val, i) => (
                                    <div
                                        key={i}
                                        className="w-2 bg-blue-500/40 rounded-full transition-all duration-300 animate-pulse"
                                        style={{
                                            height: `${val * 10}%`,
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="mt-8 flex items-center justify-between text-white">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Peak Latency</p>
                                    <p className="text-2xl font-black">42ms</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Current Requests</p>
                                    <p className="text-2xl font-black">1.2k/min</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
