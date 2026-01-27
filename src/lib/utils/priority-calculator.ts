import { SymptomData } from '../types';

/**
 * Calculate priority score based on 3-question symptom check-in
 * 
 * Scoring breakdown:
 * - Severity: 0-40 points
 * - Duration: 0-30 points
 * - Pre-existing conditions: 0-30 points
 * 
 * Total: 0-100 points
 * Scores above 70 are flagged as urgent
 */
export function calculatePriorityScore(symptomData: SymptomData): number {
    const { severity, duration, preExisting } = symptomData;

    // Validate inputs
    if (severity < 0 || severity > 40) {
        throw new Error('Severity must be between 0 and 40');
    }
    if (duration < 0 || duration > 30) {
        throw new Error('Duration must be between 0 and 30');
    }
    if (preExisting < 0 || preExisting > 30) {
        throw new Error('Pre-existing conditions must be between 0 and 30');
    }

    const totalScore = severity + duration + preExisting;

    return Math.min(100, Math.max(0, totalScore));
}

/**
 * Determine priority level based on score
 */
export function getPriorityLevel(score: number): 'urgent' | 'high' | 'medium' | 'low' {
    if (score >= 70) return 'urgent';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
}

/**
 * Convert symptom questionnaire responses to SymptomData
 * 
 * Question 1: Severity (How severe are your symptoms?)
 * - Critical/Severe: 40
 * - Moderate: 25
 * - Mild: 10
 * - Minimal: 5
 * 
 * Question 2: Duration (How long have you had these symptoms?)
 * - More than 1 week: 30
 * - 3-7 days: 20
 * - 1-2 days: 10
 * - Less than 24 hours: 5
 * 
 * Question 3: Pre-existing conditions (Do you have relevant pre-existing conditions?)
 * - Yes, multiple serious conditions: 30
 * - Yes, one serious condition: 20
 * - Yes, minor conditions: 10
 * - No: 0
 */
export function convertQuestionnaireToSymptomData(
    severityAnswer: 'critical' | 'moderate' | 'mild' | 'minimal',
    durationAnswer: 'week_plus' | 'three_to_seven' | 'one_to_two' | 'under_24',
    preExistingAnswer: 'multiple_serious' | 'one_serious' | 'minor' | 'none'
): SymptomData {
    const severityMap = {
        critical: 40,
        moderate: 25,
        mild: 10,
        minimal: 5,
    };

    const durationMap = {
        week_plus: 30,
        three_to_seven: 20,
        one_to_two: 10,
        under_24: 5,
    };

    const preExistingMap = {
        multiple_serious: 30,
        one_serious: 20,
        minor: 10,
        none: 0,
    };

    return {
        severity: severityMap[severityAnswer],
        duration: durationMap[durationAnswer],
        preExisting: preExistingMap[preExistingAnswer],
    };
}
