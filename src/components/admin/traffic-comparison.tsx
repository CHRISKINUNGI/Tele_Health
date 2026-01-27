'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TrafficComparisonProps {
    inPersonCount: number;
    virtualCount: number;
    inPersonCapacity: number;
}

export function TrafficComparison({
    inPersonCount,
    virtualCount,
    inPersonCapacity
}: TrafficComparisonProps) {
    const inPersonUtilization = (inPersonCount / inPersonCapacity) * 100;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Physical Waiting Room */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        🏥 Physical Waiting Room
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600">{inPersonCount}</div>
                        <p className="text-sm text-muted-foreground">Patients In-Person</p>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span>Capacity Utilization</span>
                            <span className="font-semibold">{Math.round(inPersonUtilization)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${inPersonUtilization > 80
                                        ? 'bg-red-500'
                                        : inPersonUtilization > 60
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(100, inPersonUtilization)}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {inPersonCount} of {inPersonCapacity} capacity
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Average Wait Time</span>
                            <Badge variant="outline" className="text-base">
                                {Math.round((inPersonCount * 15) / Math.max(1, inPersonCount))} min
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Digital Traffic */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        💻 Digital Traffic
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600">{virtualCount}</div>
                        <p className="text-sm text-muted-foreground">Virtual Appointments</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {Math.floor(virtualCount * 0.6)}
                            </div>
                            <p className="text-xs text-muted-foreground">Active Sessions</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {Math.ceil(virtualCount * 0.4)}
                            </div>
                            <p className="text-xs text-muted-foreground">In Queue</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Average Wait Time</span>
                            <Badge variant="outline" className="text-base">
                                {Math.round((virtualCount * 12) / Math.max(1, virtualCount))} min
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
