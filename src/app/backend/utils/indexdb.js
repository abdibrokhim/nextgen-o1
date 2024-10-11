// Function to open IndexedDB
export const openDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('textDatabase', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('texts', { keyPath: 'id' });
        };
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Function to save text to IndexedDB
export const saveTextToIndexedDB = (db, id, text) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['texts'], 'readwrite');
        const store = transaction.objectStore('texts');
        const request = store.put({ id: id, text: text });
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Function to get text from IndexedDB
export const getTextFromIndexedDB = (db, id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['texts'], 'readonly');
        const store = transaction.objectStore('texts');
        const request = store.get(id);
        request.onsuccess = (event) => {
            if (request.result) {
                resolve(request.result.text);
            } else {
                reject('Text not found in IndexedDB');
            }
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Function to delete text from IndexedDB
export const deleteTextFromIndexedDB = (db, id) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['texts'], 'readwrite');
        const store = transaction.objectStore('texts');
        const request = store.delete(id);
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// IndexedDB Utility Functions
export const openVoiceDatabase = async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('audioDatabase', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('audios', { keyPath: 'id' });
      };
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
export const saveAndPlayAudio = async (blob) => {
    const db = await openVoiceDatabase();
    const audioId = 'audio_' + Date.now();
  
    // Save to IndexedDB
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(['audios'], 'readwrite');
      const store = transaction.objectStore('audios');
      const request = store.put({ id: audioId, audio: blob });
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  
    // Create URL and play
    const audioURL = URL.createObjectURL(blob);
    const audio = new Audio(audioURL);
    audio.play();
  
    // Cleanup after playback
    audio.addEventListener('ended', async () => {
      URL.revokeObjectURL(audioURL);
      const transaction = db.transaction(['audios'], 'readwrite');
      const store = transaction.objectStore('audios');
      store.delete(audioId);
      console.log('Audio deleted from IndexedDB after playback.');
    });
}