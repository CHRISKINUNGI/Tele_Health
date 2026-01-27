'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Search, UserCog, Mail, Shield, User as UserIcon, Filter } from 'lucide-react';
import { CreateUserDialog } from './create-user-dialog';
import type { Profile } from '@/lib/types';

interface UserManagementProps {
    profiles: Profile[];
}

export function UserManagement({ profiles }: UserManagementProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'doctor' | 'patient' | 'admin'>('all');

    const filteredProfiles = profiles.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p as any).email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || p.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'doctor': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Doctor</Badge>;
            case 'admin': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200">Admin</Badge>;
            default: return <Badge variant="outline">Patient</Badge>;
        }
    };

    return (
        <Card className="border-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-gray-500" />
                        Directory Management
                    </CardTitle>
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <CreateUserDialog />
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-9 w-64 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1">
                            <Filter className="h-4 w-4 text-gray-400 ml-1" />
                            <select
                                className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer font-medium pr-8"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                            >
                                <option value="all">All Roles</option>
                                <option value="doctor">Doctors</option>
                                <option value="patient">Patients</option>
                                <option value="admin">Admins</option>
                            </select>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-gray-50/30">
                        <TableRow>
                            <TableHead className="pl-6 font-bold py-4">User Information</TableHead>
                            <TableHead className="font-bold">Access Role</TableHead>
                            <TableHead className="font-bold">Specialization</TableHead>
                            <TableHead className="font-bold">Joined Date</TableHead>
                            <TableHead className="text-right pr-6 font-bold">Quick Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProfiles.length > 0 ? (
                            filteredProfiles.map((user) => (
                                <TableRow key={user.id} className="hover:bg-blue-50/30 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border-2 border-white shadow-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-none">{user.name}</p>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {user.id.substring(0, 8)}...
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-600 font-medium">
                                            {user.specialization || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-500">
                                            {new Date(user.created_at || Date.now()).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                                                <Shield className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-gray-50">
                                                <UserIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="py-20 text-center">
                                    <div className="max-w-xs mx-auto">
                                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                                            <UserIcon className="h-6 w-6 text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">No users found</h3>
                                        <p className="text-sm text-gray-500">Try adjusting your search terms or filters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
