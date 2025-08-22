import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Key untuk localStorage (session tracking)
const SESSION_KEY_PREFIX = 'naskah_viewed_';

/**
 * Mencatat view untuk naskah tertentu
 * @param {string} naskahId - ID naskah yang dibuka
 * @returns {Promise<boolean>} - true jika berhasil increment view
 */
export const trackNaskahView = async (naskahId) => {
  try {
    // Cek apakah sudah pernah dibuka dalam sesi ini
    const sessionKey = SESSION_KEY_PREFIX + naskahId;
    const hasViewedInSession = sessionStorage.getItem(sessionKey);
    
    if (hasViewedInSession) {
      console.log('Already viewed in this session:', naskahId);
      return false; // Tidak increment jika sudah dilihat dalam sesi ini
    }

    // Update view count di Firestore
    const naskahRef = doc(db, 'naskah', naskahId);
    
    // Gunakan increment() untuk atomic update
    await updateDoc(naskahRef, {
      totalViews: increment(1),
      lastViewed: new Date()
    });

    // Tandai bahwa sudah dilihat dalam sesi ini
    sessionStorage.setItem(sessionKey, new Date().toISOString());
    
    console.log('View tracked for naskah:', naskahId);
    return true;
    
  } catch (error) {
    console.error('Error tracking view:', error);
    
    // Jika field totalViews belum ada, buat dengan nilai 1
    if (error.code === 'not-found') {
      try {
        const naskahRef = doc(db, 'naskah', naskahId);
        await updateDoc(naskahRef, {
          totalViews: 1,
          lastViewed: new Date()
        });
        
        sessionStorage.setItem(SESSION_KEY_PREFIX + naskahId, new Date().toISOString());
        return true;
      } catch (createError) {
        console.error('Error creating view field:', createError);
        return false;
      }
    }
    return false;
  }
};

/**
 * Mendapatkan jumlah views untuk naskah tertentu
 * @param {string} naskahId - ID naskah
 * @returns {Promise<number>} - Jumlah views
 */
export const getNaskahViews = async (naskahId) => {
  try {
    const naskahRef = doc(db, 'naskah', naskahId);
    const docSnap = await getDoc(naskahRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.totalViews || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting views:', error);
    return 0;
  }
};

/**
 * Format angka views untuk display yang lebih readable
 * @param {number} views - Jumlah views
 * @returns {string} - Format views (contoh: "1.2K", "5.5M")
 */
export const formatViews = (views) => {
  if (!views || views === 0) return '0';
  
  if (views < 1000) {
    return views.toString();
  } else if (views < 1000000) {
    return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else if (views < 1000000000) {
    return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else {
    return (views / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
};

/**
 * Cek apakah naskah sudah dilihat dalam sesi ini
 * @param {string} naskahId - ID naskah
 * @returns {boolean} - true jika sudah dilihat
 */
export const hasViewedInSession = (naskahId) => {
  const sessionKey = SESSION_KEY_PREFIX + naskahId;
  return !!sessionStorage.getItem(sessionKey);
};

/**
 * Clear session tracking untuk testing
 * @param {string} naskahId - ID naskah (optional, jika tidak ada maka clear semua)
 */
export const clearViewSession = (naskahId = null) => {
  if (naskahId) {
    sessionStorage.removeItem(SESSION_KEY_PREFIX + naskahId);
  } else {
    // Clear all view sessions
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(SESSION_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

/**
 * Get popular naskah berdasarkan views
 * @param {Array} naskahList - List semua naskah
 * @param {number} limit - Jumlah maksimal yang dikembalikan
 * @returns {Array} - Naskah yang diurutkan berdasarkan views
 */
export const getPopularNaskah = (naskahList, limit = 6) => {
  return [...naskahList]
    .sort((a, b) => {
      const viewsA = a.totalViews || 0;
      const viewsB = b.totalViews || 0;
      return viewsB - viewsA;
    })
    .slice(0, limit);
};

