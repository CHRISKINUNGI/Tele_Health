'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings, Save, ShieldAlert, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminSettingsProps {
    inPersonCapacity: number;
    onUpdateCapacity: (capacity: number) => void;
}

export function AdminSettings({ inPersonCapacity, onUpdateCapacity }: AdminSettingsProps) {
    const [capacity, setCapacity] = useState(inPersonCapacity);
    const [autoReassign, setAutoReassign] = useState(true);
    const [threshold, setThreshold] = useState(20);

    const handleSave = () => {
        onUpdateCapacity(capacity);
        toast.success('System settings updated successfully');
    };

    return (
        <Card className="border-gray-200">
            <CardHeader className="border-b bg-gray-50/50 py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500" />
                    System Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                {/* Physical Resource Management */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                        <BarChart3 className="h-4 w-4" />
                        Facility Resources
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Max Waiting Room Capacity</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(parseInt(e.target.value))}
                                    className="max-w-[120px]"
                                />
                                <span className="flex items-center text-sm text-gray-500">Patients</span>
                            </div>
                            <p className="text-xs text-gray-500">Used to calculate utilization metrics on the main dashboard.</p>
                        </div>
                    </div>
                </div>

                {/* Automation Rules */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                        <ShieldAlert className="h-4 w-4" />
                        Intelligent Automation
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="space-y-0.5">
                                <Label className="text-base">Auto-Flag Delay Threshold</Label>
                                <p className="text-sm text-gray-500">Automatically flag appointments if delay exceeds {threshold} mins.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    value={threshold}
                                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                                    className="w-16 h-8 text-center px-0"
                                />
                                <span className="text-sm font-medium">min</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <div className="space-y-0.5">
                                <Label className="text-base text-gray-900 cursor-pointer" htmlFor="auto-reassign">
                                    Predictive Load Balancing
                                </Label>
                                <p className="text-sm text-gray-500">Monitor queue density and suggest preemptive reassignments.</p>
                            </div>
                            <Switch
                                id="auto-reassign"
                                checked={autoReassign}
                                onCheckedChange={setAutoReassign}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 font-bold gap-2">
                        <Save className="h-4 w-4" />
                        Apply Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
