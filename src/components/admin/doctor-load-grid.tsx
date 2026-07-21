'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDoctorName } from '@/lib/utils/doctor-name';
import { Users, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DoctorLoad {
    id: string;
    name: string;
    specialization: string;
    currentPatient: string | null;
    queueLength: number;
    status: 'busy' | 'available';
}

interface DoctorLoadGridProps {
    loads: DoctorLoad[];
}

export function DoctorLoadGrid({ loads }: DoctorLoadGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loads.map((doctor) => (
                <Card key={doctor.id} className="overflow-hidden border-gray-200 hover:border-blue-200 transition-colors">
                    <CardHeader className="bg-white border-b px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {doctor.name.charAt(0)}
                                </div>
                                <CardTitle className="text-sm font-bold">
                                    {formatDoctorName(doctor.name)}
                                </CardTitle>
                            </div>
                            <Badge
                                variant={doctor.status === 'available' ? 'outline' : 'secondary'}
                                className={doctor.status === 'available' ? 'text-green-600 border-green-200 bg-green-50' : 'bg-amber-50 text-amber-700 border-amber-200'}
                            >
                                {doctor.status === 'available' ? 'Online' : 'In Session'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {/* Current Patient */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                                <User className="h-4 w-4" />
                                <span>Current Patient</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                                {doctor.currentPatient || 'None'}
                            </span>
                        </div>

                        {/* Queue Length */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Users className="h-4 w-4" />
                                <span>Patients in Queue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`font-bold ${doctor.queueLength > 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                                    {doctor.queueLength}
                                </span>
                                {doctor.queueLength > 3 && <AlertCircle className="h-4 w-4 text-amber-500" />}
                            </div>
                        </div>

                        {/* Load Level Indicator */}
                        <div>
                            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                                <span>Load Level</span>
                                <span>{doctor.queueLength > 5 ? 'High' : doctor.queueLength > 2 ? 'Moderate' : 'Low'}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-full h-full ${i <= doctor.queueLength
                                                ? (doctor.queueLength > 4 ? 'bg-red-500' : doctor.queueLength > 2 ? 'bg-amber-500' : 'bg-blue-500')
                                                : 'bg-gray-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
