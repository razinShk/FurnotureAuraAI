/**
 * IndexedDB & Local Storage persistent manager for FurnitureAura AI Studio.
 * Handles high-resolution canvas states without hitting localStorage 5MB quota limits.
 */

const DB_NAME = 'FurnitureAuraStudioDB';
const DB_VERSION = 1;
const STORE_SESSIONS = 'studio_sessions';
const STORE_CREATIONS = 'recent_creations';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CREATIONS)) {
        const creationStore = db.createObjectStore(STORE_CREATIONS, { keyPath: 'id' });
        creationStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

/**
 * 1. Save Active In-Progress Room Editing Session
 */
export async function saveCurrentStudioSession(sessionData) {
  try {
    const db = await openDB();
    const payload = {
      id: 'active_session',
      ...sessionData,
      updatedAt: Date.now()
    };

    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SESSIONS, 'readwrite');
        const store = tx.objectStore(STORE_SESSIONS);
        store.put(payload);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }

    // Fallback: localStorage (trimmed)
    try {
      const trimmed = { ...sessionData, dataUrl: sessionData.dataUrl?.slice(0, 500000) };
      localStorage.setItem('aura_active_session', JSON.stringify(trimmed));
    } catch (e) {}
    return true;
  } catch (err) {
    console.warn('Error saving studio session:', err);
    return false;
  }
}

/**
 * 2. Load Active In-Progress Room Editing Session
 */
export async function loadCurrentStudioSession() {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SESSIONS, 'readonly');
        const store = tx.objectStore(STORE_SESSIONS);
        const req = store.get('active_session');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    }

    const local = localStorage.getItem('aura_active_session');
    if (local) {
      return JSON.parse(local);
    }
  } catch (err) {
    console.warn('Error loading studio session:', err);
  }
  return null;
}

/**
 * 3. Clear Active Session (when user clicks "New Room")
 */
export async function clearCurrentStudioSession() {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      tx.objectStore(STORE_SESSIONS).delete('active_session');
    }
    localStorage.removeItem('aura_active_session');
  } catch (err) {
    console.warn('Error clearing studio session:', err);
  }
}

/**
 * 4. Save Recent Creation to Library
 */
export async function saveRecentCreation(creation) {
  try {
    const item = {
      id: creation.id || 'creation_' + Date.now(),
      title: creation.title || 'Architectural Living Room',
      thumbnail: creation.thumbnail,
      stagedItems: creation.stagedItems || [],
      currentRoomTotal: creation.currentRoomTotal || 0,
      versionHistory: creation.versionHistory || [],
      componentPins: creation.componentPins || [],
      activeVersionIndex: creation.activeVersionIndex || 0,
      updatedAt: Date.now()
    };

    const db = await openDB();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction(STORE_CREATIONS, 'readwrite');
        tx.objectStore(STORE_CREATIONS).put(item);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }

    // Also update localStorage recent list for fast sync
    try {
      const existing = JSON.parse(localStorage.getItem('aura_recent_creations') || '[]');
      const filtered = existing.filter(c => c.id !== item.id);
      // Keep thumbnail trimmed if stored in localStorage
      const liteItem = {
        ...item,
        thumbnail: item.thumbnail?.startsWith('data:') && item.thumbnail.length > 200000 
          ? item.thumbnail.slice(0, 200000) 
          : item.thumbnail
      };
      const updated = [liteItem, ...filtered].slice(0, 15);
      localStorage.setItem('aura_recent_creations', JSON.stringify(updated));
    } catch (e) {}

    return item;
  } catch (err) {
    console.warn('Error saving recent creation:', err);
    return null;
  }
}

/**
 * 5. Fetch All Recent Creations
 */
export async function getRecentCreations() {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CREATIONS, 'readonly');
        const store = tx.objectStore(STORE_CREATIONS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(list);
        };
        req.onerror = () => resolve([]);
      });
    }

    return JSON.parse(localStorage.getItem('aura_recent_creations') || '[]');
  } catch (err) {
    console.warn('Error reading recent creations:', err);
    return [];
  }
}

/**
 * 6. Delete a Recent Creation
 */
export async function deleteRecentCreation(id) {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_CREATIONS, 'readwrite');
      tx.objectStore(STORE_CREATIONS).delete(id);
    }

    const existing = JSON.parse(localStorage.getItem('aura_recent_creations') || '[]');
    const updated = existing.filter(c => c.id !== id);
    localStorage.setItem('aura_recent_creations', JSON.stringify(updated));
    return true;
  } catch (err) {
    console.warn('Error deleting creation:', err);
    return false;
  }
}
