import { describe, it, expect } from 'vitest';
import { adjustColorBrightness } from './colors';

describe('Color Utilities', () => {
  describe('adjustColorBrightness', () => {
    it('should make color darker with negative percentage', () => {
      // #FFFFFF (255, 255, 255) -> -50% -> #7f7f7f (127, 127, 127) approx
      const result = adjustColorBrightness('#FFFFFF', -50);
      expect(result.toLowerCase()).toBe('#7f7f7f');
    });

    it('should make color lighter with positive percentage', () => {
      // #808080 (128, 128, 128) -> +50% -> #c0c0c0 (192, 192, 192)
      const result = adjustColorBrightness('#808080', 50);
      expect(result.toLowerCase()).toBe('#c0c0c0');
    });

    it('should handle short hex codes', () => {
      const result = adjustColorBrightness('#000', 50);
      expect(result).toBe('#000000'); // black stays black at +50% of 0
    });

    it('should cap at #FFFFFF', () => {
      const result = adjustColorBrightness('#FFFFFF', 50);
      expect(result.toLowerCase()).toBe('#ffffff');
    });

    it('should cap at #000000', () => {
      const result = adjustColorBrightness('#000000', -50);
      expect(result).toBe('#000000');
    });

    it('should return default if invalid hex', () => {
      expect(adjustColorBrightness('invalid', 10)).toBe('#3b82f6');
    });
  });
});
