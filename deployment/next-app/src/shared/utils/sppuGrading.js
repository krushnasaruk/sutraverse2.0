/**
 * Utility functions for SPPU 2019 Pattern Grading System
 */

/**
 * Calculates the SPPU Grade and Grade Point based on percentage
 * @param {number} marksObtained - The total marks obtained
 * @param {number} maxMarks - The maximum possible marks
 * @returns {object} { grade: string, points: number, color: string }
 */
export function getSPPUGrade(marksObtained, maxMarks) {
    if (maxMarks === 0) return { grade: '-', points: 0, color: 'var(--text-muted)' };

    const percentage = (marksObtained / maxMarks) * 100;

    if (percentage >= 80) return { grade: 'O', points: 10, color: '#10b981' };      // Outstanding
    if (percentage >= 70) return { grade: 'A+', points: 9, color: '#dc2626' };      // Excellent
    if (percentage >= 60) return { grade: 'A', points: 8, color: '#991b1b' };       // Very Good
    if (percentage >= 55) return { grade: 'B+', points: 7, color: '#b91c1c' };      // Good
    if (percentage >= 50) return { grade: 'B', points: 6, color: '#f59e0b' };       // Above Average
    if (percentage >= 45) return { grade: 'C', points: 5, color: '#f97316' };       // Average
    if (percentage >= 40) return { grade: 'P', points: 4, color: '#fb923c' };       // Pass
    return { grade: 'F', points: 0, color: '#ef4444' };                             // Fail
}

/**
 * Calculate SGPA (Semester Grade Point Average)
 * Assumes equal credits (e.g. 3) for each subject if exact credits aren't provided
 * @param {Array<{ points: number }>} subjectGrades
 * @returns {number} SGPA rounded to 2 decimal places
 */
export function calculateSGPA(subjectGrades) {
    if (!subjectGrades || subjectGrades.length === 0) return 0;
    
    // For now, assuming equal weight (3 credits) for all subjects
    const CREDIT_PER_SUBJECT = 3;
    
    let totalCreditPoints = 0;
    let totalCredits = 0;

    subjectGrades.forEach(sg => {
        totalCreditPoints += (sg.points * CREDIT_PER_SUBJECT);
        totalCredits += CREDIT_PER_SUBJECT;
    });

    if (totalCredits === 0) return 0;
    return Math.round((totalCreditPoints / totalCredits) * 100) / 100;
}
