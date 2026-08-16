import { LOCALE_STORAGE_KEY } from '../i18n/locale';
import { VOICE_STORAGE_KEY } from '../i18n/voice-preference';
import type { StorageLike } from './save-store';

export const WRITER_PREFERENCE_KEY = 'unwritten.prototype.local-writer.v1';
export const SAVE_STORAGE_KEY = 'unwritten.prototype.save.v1';
export const DIAGNOSTIC_STORAGE_KEY = 'unwritten.prototype.diagnostic';

const PLAYTHROUGH_KEYS = [SAVE_STORAGE_KEY, DIAGNOSTIC_STORAGE_KEY, WRITER_PREFERENCE_KEY, VOICE_STORAGE_KEY];

function deleteDatabase(factory: IDBFactory, name: string) {
  return new Promise<void>((resolve) => {
    const request = factory.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

export async function resetPlaythrough(storage: StorageLike) {
  const locale = storage.getItem(LOCALE_STORAGE_KEY);
  for (const key of PLAYTHROUGH_KEYS) storage.removeItem(key);
  if (locale) storage.setItem(LOCALE_STORAGE_KEY, locale);
  try {
    if (typeof caches !== 'undefined') {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    }
  } catch { /* the save is already gone; leftover model bytes are best-effort */ }
  try {
    if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
      const databases = await indexedDB.databases();
      await Promise.all(databases.flatMap((database) => database.name ? [deleteDatabase(indexedDB, database.name)] : []));
    }
  } catch { /* same: language and a fresh clearing matter more than a stubborn cache */ }
}
