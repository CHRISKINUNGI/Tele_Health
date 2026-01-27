'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserCircle, ChevronRight, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function PatientList() {
    const [patients, setPatients] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            // In a real app, we might fetch patients who have had appointments with this doctor
            // For now, let's fetch all patients for demonstration
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'patient')
                .order('name');

            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search patients by name or email..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="animate-pulse h-32 bg-gray-50/50 border-gray-100"></Card>
                    ))
                ) : filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                        <Link key={patient.id} href={`/provider/patients/${patient.id}`}>
                            <Card className="hover:border-blue-200 transition-all hover:shadow-md cursor-pointer group">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-gray-100 group-hover:border-blue-100">
                                            <AvatarFallback className="bg-gray-50 text-gray-500 font-semibold group-hover:bg-blue-50 group-hover:text-blue-700">
                                                {patient.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{patient.name}</h3>
                                            <p className="text-xs text-gray-500 truncate">{patient.email || 'No email provided'}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <FileText className="h-3.5 w-3.5" />
                                            <span>Document Hub</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-gray-200 text-gray-500">
                                            Active Patient
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your search query.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
