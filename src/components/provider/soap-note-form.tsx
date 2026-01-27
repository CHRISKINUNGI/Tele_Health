'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, CheckCircle, Clock } from 'lucide-react';
import { saveClinicalNote, finalizeClinicalNote } from '@/lib/actions/clinical-notes';
import { toast } from 'sonner';
import type { ClinicalNote, VitalSigns } from '@/lib/types';

interface SOAPNoteFormProps {
    appointmentId: string;
    doctorId: string;
    patientId: string;
    initialData?: ClinicalNote | null;
}

export function SOAPNoteForm({
    appointmentId,
    doctorId,
    patientId,
    initialData
}: SOAPNoteFormProps) {
    const [loading, setLoading] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(initialData ? new Date(initialData.updated_at) : null);

    // SOAP State
    const [subjective, setSubjective] = useState(initialData?.subjective || '');
    const [objective, setObjective] = useState(initialData?.objective || '');
    const [assessment, setAssessment] = useState(initialData?.assessment || '');
    const [plan, setPlan] = useState(initialData?.plan || '');

    // Vitals State
    const [vitals, setVitals] = useState<VitalSigns>(initialData?.vital_signs || {
        blood_pressure: '',
        heart_rate: undefined,
        temperature: undefined,
        respiratory_rate: undefined,
        oxygen_saturation: undefined,
        weight: undefined,
        height: undefined
    });

    const handleSave = async (finalize = false) => {
        setLoading(true);
        try {
            const data = {
                id: initialData?.id,
                appointmentId,
                doctorId,
                patientId,
                subjective,
                objective,
                assessment,
                plan,
                vitalSigns: vitals,
                isFinalized: finalize
            };

            await saveClinicalNote(data);
            setLastSaved(new Date());

            toast(finalize ? "Note Finalized" : "Note Saved", {
                description: finalize
                    ? "The clinical note has been finalized and is now visible to the patient."
                    : "Progress has been saved successfully.",
            });
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error("Error saving note", {
                description: "Failed to save the note. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    // Auto-save logic (simulated)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (subjective || objective || assessment || plan) {
                // handleSave(); // Trigger auto-save
            }
        }, 30000); // 30 seconds

        return () => clearTimeout(timer);
    }, [subjective, objective, assessment, plan]);

    return (
        <Card className="w-full h-full flex flex-col border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Clinical Documentation</CardTitle>
                    <p className="text-gray-500 text-sm mt-1">Structured SOAP format for professional encounters</p>
                </div>
                <div className="flex items-center gap-3">
                    {lastSaved && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-2">
                            <Clock className="h-3.5 w-3.5" />
                            Last saved: {lastSaved.toLocaleTimeString()}
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => handleSave(false)}
                        disabled={loading}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button
                        onClick={() => handleSave(true)}
                        disabled={loading || initialData?.is_finalized}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <CheckCircle className="h-4 w-4" />
                        Finalize Note
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="px-0 flex-1 overflow-y-auto">
                <Tabs defaultValue="soap" className="w-full">
                    <TabsList className="bg-gray-100 p-1 rounded-lg mb-6">
                        <TabsTrigger value="soap" className="rounded-md">SOAP Note</TabsTrigger>
                        <TabsTrigger value="vitals" className="rounded-md">Vital Signs</TabsTrigger>
                        <TabsTrigger value="history" className="rounded-md">Patient History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="soap" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="subjective" className="text-sm font-semibold text-gray-700">Subjective (S)</Label>
                                <p className="text-xs text-gray-500 mb-2">Patient's chief complaint, history of present illness, symptoms reported.</p>
                                <Textarea
                                    id="subjective"
                                    value={subjective}
                                    onChange={(e) => setSubjective(e.target.value)}
                                    placeholder="Enter subjective observations..."
                                    className="min-h-[200px] bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="objective" className="text-sm font-semibold text-gray-700">Objective (O)</Label>
                                <p className="text-xs text-gray-500 mb-2">Physical exam findings, vital signs, test results, observable data.</p>
                                <Textarea
                                    id="objective"
                                    value={objective}
                                    onChange={(e) => setObjective(e.target.value)}
                                    placeholder="Enter objective findings..."
                                    className="min-h-[200px] bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="assessment" className="text-sm font-semibold text-gray-700">Assessment (A)</Label>
                                <p className="text-xs text-gray-500 mb-2">Diagnosis, differential diagnosis, clinical reasoning.</p>
                                <Textarea
                                    id="assessment"
                                    value={assessment}
                                    onChange={(e) => setAssessment(e.target.value)}
                                    placeholder="Enter assessment and diagnosis..."
                                    className="min-h-[200px] bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="plan" className="text-sm font-semibold text-gray-700">Plan (P)</Label>
                                <p className="text-xs text-gray-500 mb-2">Treatment, medications, follow-up instructions, patient education.</p>
                                <Textarea
                                    id="plan"
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    placeholder="Enter treatment plan..."
                                    className="min-h-[200px] bg-white"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="vitals">
                        <Card className="border border-gray-200">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="bp">Blood Pressure (mmHg)</Label>
                                        <Input
                                            id="bp"
                                            value={vitals.blood_pressure}
                                            onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                                            placeholder="120/80"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hr">Heart Rate (bpm)</Label>
                                        <Input
                                            id="hr"
                                            type="number"
                                            value={vitals.heart_rate || ''}
                                            onChange={(e) => setVitals({ ...vitals, heart_rate: parseInt(e.target.value) })}
                                            placeholder="72"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="temp">Temperature (°F)</Label>
                                        <Input
                                            id="temp"
                                            type="number"
                                            step="0.1"
                                            value={vitals.temperature || ''}
                                            onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) })}
                                            placeholder="98.6"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rr">Respiratory Rate</Label>
                                        <Input
                                            id="rr"
                                            type="number"
                                            value={vitals.respiratory_rate || ''}
                                            onChange={(e) => setVitals({ ...vitals, respiratory_rate: parseInt(e.target.value) })}
                                            placeholder="16"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="o2">Oxygen Saturation (%)</Label>
                                        <Input
                                            id="o2"
                                            type="number"
                                            value={vitals.oxygen_saturation || ''}
                                            onChange={(e) => setVitals({ ...vitals, oxygen_saturation: parseInt(e.target.value) })}
                                            placeholder="98"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="weight">Weight (lbs)</Label>
                                        <Input
                                            id="weight"
                                            type="number"
                                            value={vitals.weight || ''}
                                            onChange={(e) => setVitals({ ...vitals, weight: parseFloat(e.target.value) })}
                                            placeholder="150"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <div className="bg-white border rounded-lg p-12 text-center">
                            <p className="text-gray-500 italic">Historical data panel will be implemented next.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
