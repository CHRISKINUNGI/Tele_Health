'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';
import {
    convertQuestionnaireToSymptomData,
    calculatePriorityScore
} from '../utils/priority-calculator';

/**
 * Submit symptom check-in and calculate priority
 */
export async function submitSymptomCheckIn(
    appointmentId: string,
    answers: {
        severity: 'critical' | 'moderate' | 'mild' | 'minimal';
        duration: 'week_plus' | 'three_to_seven' | 'one_to_two' | 'under_24';
        preExisting: 'multiple_serious' | 'one_serious' | 'minor' | 'none';
    }
) {
    const supabase = await createClient();

    // Convert questionnaire to symptom data
    const symptomData = convertQuestionnaireToSymptomData(
        answers.severity,
        answers.duration,
        answers.preExisting
    );

    // Calculate priority score
    const priorityScore = calculatePriorityScore(symptomData);

    // Update appointment
    const { data, error } = await supabase
        .from('appointments')
        .update({
            symptom_data: symptomData,
            priority_score: priorityScore,
        })
        .eq('id', appointmentId)
        .select()
        .single();

    if (error) {
        console.error('Error submitting symptom check-in:', error);
        throw new Error('Failed to submit symptom check-in');
    }

    revalidatePath('/admin');
    revalidatePath('/provider');
    revalidatePath('/patient');

    return {
        ...data,
        priorityScore,
        symptomData,
    };
}

/**
 * Get symptom check-in data for an appointment
 */
export async function getSymptomCheckIn(appointmentId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('appointments')
        .select('symptom_data, priority_score')
        .eq('id', appointmentId)
        .single();

    if (error) {
        console.error('Error fetching symptom check-in:', error);
        throw new Error('Failed to fetch symptom check-in');
    }

    return data;
}
