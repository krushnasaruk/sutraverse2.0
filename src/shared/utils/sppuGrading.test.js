import { describe, it, expect } from 'vitest';
import { getSPPUGrade, calculateSGPA } from './sppuGrading';

describe('SPPU Grading Utility', () => {
  describe('getSPPUGrade', () => {
    it('should return O for 80% and above', () => {
      const result = getSPPUGrade(80, 100);
      expect(result.grade).toBe('O');
      expect(result.points).toBe(10);
    });

    it('should return A+ for 70-79%', () => {
      const result = getSPPUGrade(75, 100);
      expect(result.grade).toBe('A+');
    });

    it('should return F for below 40%', () => {
      const result = getSPPUGrade(39, 100);
      expect(result.grade).toBe('F');
      expect(result.points).toBe(0);
    });

    it('should handle zero max marks', () => {
      const result = getSPPUGrade(10, 0);
      expect(result.grade).toBe('-');
    });
  });

  describe('calculateSGPA', () => {
    it('should calculate average points correctly', () => {
      const grades = [
        { points: 10 },
        { points: 8 },
        { points: 6 }
      ];
      expect(calculateSGPA(grades)).toBe(8.00);
    });

    it('should return 0 for empty array', () => {
      expect(calculateSGPA([])).toBe(0);
    });
  });
});
