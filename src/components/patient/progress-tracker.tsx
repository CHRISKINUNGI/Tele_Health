'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { QueueStage } from '@/lib/types';

interface ProgressTrackerProps {
    currentStage: QueueStage;
    estimatedWaitMinutes: number;
}

const stages = [
    { key: 'check_in', label: 'Check-in', icon: '✅' },
    { key: 'nurse_review', label: 'Nurse Review', icon: '🩺' },
    { key: 'waiting', label: 'Waiting', icon: '⏳' },
    { key: 'in_consultation', label: 'In Consultation', icon: '👨‍⚕️' },
    { key: 'completed', label: 'Completed', icon: '✅' },
] as const;

export function ProgressTracker({ currentStage, estimatedWaitMinutes }: ProgressTrackerProps) {
    const currentIndex = stages.findIndex(s => s.key === currentStage);
    const progress = ((currentIndex + 1) / stages.length) * 100;

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-center text-muted-foreground">
                    {Math.round(progress)}% Complete
                </p>
            </div>

            {/* Stage Steps */}
            <div className="space-y-3">
                {stages.map((stage, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div
                            key={stage.key}
                            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${isCurrent
                                    ? 'border-blue-500 bg-blue-50'
                                    : isCompleted
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 bg-white'
                                }`}
                        >
                            <div
                                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isCurrent
                                        ? 'bg-blue-500 text-white'
                                        : isCompleted
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {isCompleted ? '✓' : stage.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                                {isCurrent && (
                                    <p className="text-sm text-blue-600 mt-1">
                                        {currentStage === 'in_consultation'
                                            ? 'With doctor now'
                                            : `Est. wait: ${estimatedWaitMinutes} min`}
                                    </p>
                                )}
                                {isCompleted && (
                                    <p className="text-sm text-green-600 mt-1">Completed</p>
                                )}
                                {isPending && (
                                    <p className="text-sm text-gray-500 mt-1">Pending</p>
                                )}
                            </div>
                            {isCurrent && (
                                <div className="flex-shrink-0">
                                    <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
