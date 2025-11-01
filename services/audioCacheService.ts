let db: IDBDatabase;

const DB_NAME = 'AudioCacheDB';
const STORE_NAME = 'audioStore';

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = (event) => {
            console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
            reject("IndexedDB error");
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const saveAudio = async (id: string, audioData: ArrayBuffer): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id, audioData });

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error("Failed to save audio:", request.error);
            reject(request.error);
        };
    });
};

export const getAudio = async (id: string): Promise<ArrayBuffer | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result ? request.result.audioData : null);
        };
        request.onerror = () => {
            console.error("Failed to get audio:", request.error);
            reject(request.error);
        };
    });
};

/**
 * Generates a SHA-256 hash of a string.
 * Used to create a unique, fixed-length ID for caching based on the summary text.
 * @param text The string to hash.
 * @returns A promise that resolves with the hex string of the hash.
 */
export const sha256 = async (text: string): Promise<string> => {
    const textAsBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};