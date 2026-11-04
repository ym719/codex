import type { Artwork } from '../types';

const DB_NAME = 'art-archive';
let connection: Promise<IDBDatabase> | undefined;
let initialization: Promise<void> | undefined;

function openDB(): Promise<IDBDatabase> {
  if (!connection) {
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('artworks', { keyPath: 'id' });
        request.result.createObjectStore('settings');
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          connection = undefined;
        };
        resolve(db);
      };
      request.onerror = () => {
        connection = undefined;
        reject(request.error);
      };
      request.onblocked = () => {
        connection = undefined;
        reject(new Error('请关闭其他 Art Archive 标签页后重试。'));
      };
    });
  }
  return connection;
}

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function finished(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error('保存未完成，请重试。'));
    tx.onerror = () => reject(tx.error);
  });
}

export async function initializeLibrary(seed: () => Promise<Artwork[]>): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      const db = await openDB();
      if (await result(db.transaction('settings').objectStore('settings').get('initialized')))
        return;
      const artworks = await seed();
      const tx = db.transaction(['artworks', 'settings'], 'readwrite');
      const done = finished(tx);
      // Check again inside the write transaction so simultaneous tabs cannot re-seed a collection.
      const check = tx.objectStore('settings').get('initialized');
      check.onsuccess = () => {
        if (check.result) return;
        artworks.forEach((art) => tx.objectStore('artworks').put(art));
        tx.objectStore('settings').put(true, 'initialized');
      };
      await done;
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

export async function getArtworks(): Promise<Artwork[]> {
  const db = await openDB();
  return result(db.transaction('artworks').objectStore('artworks').getAll());
}
export async function saveArtwork(artwork: Artwork): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('artworks', 'readwrite');
  const done = finished(tx);
  tx.objectStore('artworks').put(artwork);
  await done;
}
export async function deleteArtworks(ids: string[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('artworks', 'readwrite');
  const done = finished(tx);
  ids.forEach((id) => tx.objectStore('artworks').delete(id));
  await done;
}
export async function restoreArtworks(artworks: Artwork[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['artworks', 'settings'], 'readwrite');
  const done = finished(tx);
  tx.objectStore('artworks').clear();
  artworks.forEach((artwork) => tx.objectStore('artworks').put(artwork));
  tx.objectStore('settings').put(true, 'initialized');
  await done;
}
export function storageError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError')
    return '浏览器存储空间不足。请先导出备份，再删除不需要的作品。';
  return error instanceof Error
    ? error.message
    : '暂时无法访问本地档案，请检查浏览器是否允许本地存储后重试。';
}
