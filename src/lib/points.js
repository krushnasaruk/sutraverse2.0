import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

// ==========================================
// GAMIFICATION CONFIGURATION
// ==========================================

export const XP_AWARDS = {
    UPLOAD: 50,
    DOWNLOAD: 10,
    COMMUNITY_POST: 10,
    COMMUNITY_REPLY: 5,
};

export const BADGES = [
    { id: 'novice', name: 'Novice', icon: '🌱', minPoints: 0 },
    { id: 'contributor', name: 'Contributor', icon: '📝', minPoints: 50 },
    { id: 'scholar', name: 'Scholar', icon: '📚', minPoints: 150 },
    { id: 'expert', name: 'Expert', icon: '🎓', minPoints: 300 },
    { id: 'legend', name: 'Campus Legend', icon: '👑', minPoints: 500 },
];

/**
 * Calculates user level and current badges based on total points.
 * Level formula: Math.floor(Math.sqrt(points / 10)) + 1
 */
export const getUserLevelAndBadges = (points = 0) => {
    const level = Math.floor(Math.sqrt(points / 10)) + 1;
    const nextLevelPoints = Math.pow(level, 2) * 10;
    
    // Find highest earned badge
    let currentBadge = BADGES[0];
    const earnedBadges = [];
    
    for (const badge of BADGES) {
        if (points >= badge.minPoints) {
            currentBadge = badge;
            earnedBadges.push(badge);
        }
    }

    return {
        level,
        currentPoints: points,
        nextLevelPoints,
        progressToNextLevel: Math.min(100, Math.round((points / nextLevelPoints) * 100)),
        currentBadge,
        earnedBadges: earnedBadges.reverse(), // Most recent first
    };
};

// ==========================================
// POINT AWARD ACTIONS
// ==========================================

/**
 * Handles the download point logic:
 * 1. Increments the download count of the file.
 * 2. Awards points to the uploader if a different user is downloading.
 */
export const awardDownloadPoints = async (fileId, uploaderUID, currentUserUID) => {
    if (!db || !fileId) return;

    try {
        const fileRef = doc(db, 'files', fileId);
        await updateDoc(fileRef, {
            downloads: increment(1)
        });

        if (uploaderUID && uploaderUID !== currentUserUID) {
            const uploaderRef = doc(db, 'users', uploaderUID);
            await updateDoc(uploaderRef, {
                points: increment(XP_AWARDS.DOWNLOAD)
            });
        }
    } catch (error) {
        console.warn('Point award failed:', error.message);
    }
};

/**
 * Awards XP for creating a new community post.
 */
export const awardCommunityPostPoints = async (userId) => {
    if (!db || !userId) return;
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            points: increment(XP_AWARDS.COMMUNITY_POST)
        });
    } catch (error) {
        console.warn('Community post XP award failed:', error.message);
    }
};

/**
 * Awards XP for replying to a community post.
 */
export const awardCommunityReplyPoints = async (userId) => {
    if (!db || !userId) return;
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            points: increment(XP_AWARDS.COMMUNITY_REPLY)
        });
    } catch (error) {
        console.warn('Community reply XP award failed:', error.message);
    }
};

/**
 * Awards XP for uploading a file (Notes, PYQ, Assignment).
 */
export const awardUploadPoints = async (userId) => {
    if (!db || !userId) return;
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            points: increment(XP_AWARDS.UPLOAD)
        });
    } catch (error) {
        console.warn('Upload XP award failed:', error.message);
    }
};
