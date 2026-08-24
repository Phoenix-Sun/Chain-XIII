import type { SaveEnvelope } from "../../domain/save";
import { parseSave, serializeSave } from "../../domain/save";

const DATABASE_NAME = "chain-xiii";
const STORE_NAME = "save-slots";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("此環境不支援 IndexedDB"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

export async function saveToIndexedDb(slotId: string, save: SaveEnvelope): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(serializeSave(save), slotId);
    await transactionComplete(transaction);
  } finally { database.close(); }
}

export async function loadFromIndexedDb(slotId: string): Promise<SaveEnvelope | null> {
  const database = await openDatabase();
  try {
    const value = await requestResult(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(slotId));
    return typeof value === "string" ? parseSave(value) : null;
  } finally { database.close(); }
}

export async function deleteFromIndexedDb(slotId: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(slotId);
    await transactionComplete(transaction);
  } finally { database.close(); }
}
