/**
 * Adjusts the brightness of a hex color.
 *
 * @param {string} hex - Hex color string (e.g. #3b82f6)
 * @param {number} percent - Percentage to adjust (positive for lighter, negative for darker)
 * @returns {string} - Adjusted hex color string
 */
export const adjustColorBrightness = (hex, percent) => {
    if (!hex || typeof hex !== 'string' || hex.charAt(0) !== '#') return '#3b82f6';

    // Normalize hex length
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
    }

    let R = parseInt(cleanHex.substring(0, 2), 16);
    let G = parseInt(cleanHex.substring(2, 4), 16);
    let B = parseInt(cleanHex.substring(4, 6), 16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = Math.min(255, Math.max(0, R));
    G = Math.min(255, Math.max(0, G));
    B = Math.min(255, Math.max(0, B));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
};
