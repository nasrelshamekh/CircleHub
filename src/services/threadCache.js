import { queryKeys } from "@/lib/queryKeys";
import { decryptMessageContent, peekDecrypted } from "@/services/messageCrypto";

// Persists sanitized conversation list + recent thread page-1 snapshots in IndexedDB so opening a
// conversation after a reload renders immediately (0 ms) while React Query revalidates in the background.
//
// Security invariant: decrypted `plaintext` fields are NEVER written to IndexedDB. Only server-equivalent
// `ENC:v1:...` ciphertexts are stored on disk, and `hydrateThreadCache` decrypts them back into memory
// through the non-extractable WebCrypto private key in `circlehub-keyvault`.

const DB_NAME = "circlehub-msgcache";
const STORE_NAME = "snapshots";
const DB_VERSION = 1;
const OPEN_TIMEOUT_MS = 2500;
const MAX_CACHED_THREADS = 15;
const PERSIST_DEBOUNCE_MS = 800;

let dbPromise = null;

function openCacheDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve) => {
            if (typeof window === "undefined" || !("indexedDB" in window)) {
                dbPromise = null;
                resolve(null);
                return;
            }

            let settled = false;
            const finish = (db) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(db);
            };

            const timer = setTimeout(() => {
                dbPromise = null;
                finish(null);
            }, OPEN_TIMEOUT_MS);

            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onupgradeneeded = () => {
                    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                        request.result.createObjectStore(STORE_NAME, { keyPath: "userId" });
                    }
                };
                request.onsuccess = () => {
                    const db = request.result;
                    db.onversionchange = () => {
                        db.close();
                        dbPromise = null;
                    };
                    finish(db);
                };
                request.onerror = () => {
                    dbPromise = null;
                    finish(null);
                };
                request.onblocked = () => {
                    dbPromise = null;
                    finish(null);
                };
            } catch {
                dbPromise = null;
                finish(null);
            }
        });
    }
    return dbPromise;
}

function sanitizeMessageForDisk(message) {
    if (!message || typeof message !== "object") return null;
    // Never write decrypted plaintext or ephemeral UI flags to disk.
    const wireMessage = { ...message };
    delete wireMessage.plaintext;
    delete wireMessage.pending;
    delete wireMessage.failed;
    delete wireMessage.realId;
    return wireMessage;
}

function sanitizeThreadPageForDisk(page) {
    if (!page || typeof page !== "object") return null;
    const sanitized = { ...page };
    delete sanitized._markedReadNewestId;
    sanitized.messages = Array.isArray(page.messages)
        ? page.messages.map(sanitizeMessageForDisk).filter(Boolean)
        : [];
    return sanitized;
}

async function hydrateThreadPageFromDisk(page) {
    if (!page || !Array.isArray(page.messages)) return page;

    const messages = await Promise.all(
        page.messages.map(async (message) => {
            if (!message?.content) return message;
            const settled = peekDecrypted(message.content);
            if (settled !== null) {
                return { ...message, plaintext: settled };
            }
            const plaintext = await decryptMessageContent(message.content);
            return { ...message, plaintext };
        })
    );

    return {
        ...page,
        messages,
        _markedReadNewestId: null,
    };
}

async function readSnapshot(userId) {
    if (!userId) return null;
    const db = await openCacheDb();
    if (!db) return null;

    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), OPEN_TIMEOUT_MS);
        const finish = (val) => {
            clearTimeout(timer);
            resolve(val);
        };

        try {
            const req = db
                .transaction(STORE_NAME, "readonly")
                .objectStore(STORE_NAME)
                .get(String(userId));
            req.onsuccess = () => finish(req.result ?? null);
            req.onerror = () => finish(null);
        } catch {
            dbPromise = null;
            finish(null);
        }
    });
}

async function writeSnapshot(record) {
    const db = await openCacheDb();
    if (!db) return;

    await new Promise((resolve) => {
        const timer = setTimeout(resolve, OPEN_TIMEOUT_MS);
        const finish = () => {
            clearTimeout(timer);
            resolve();
        };

        try {
            const req = db
                .transaction(STORE_NAME, "readwrite")
                .objectStore(STORE_NAME)
                .put(record);
            req.onsuccess = finish;
            req.onerror = finish;
        } catch {
            dbPromise = null;
            finish();
        }
    });
}

export async function clearThreadCache() {
    const db = await openCacheDb();
    if (!db) return;

    await new Promise((resolve) => {
        const timer = setTimeout(resolve, OPEN_TIMEOUT_MS);
        const finish = () => {
            clearTimeout(timer);
            resolve();
        };

        try {
            const req = db
                .transaction(STORE_NAME, "readwrite")
                .objectStore(STORE_NAME)
                .clear();
            req.onsuccess = finish;
            req.onerror = finish;
        } catch {
            dbPromise = null;
            finish();
        }
    });
}

export async function hydrateThreadCache(queryClient, userId) {
    if (!queryClient || !userId) return;

    const snapshot = await readSnapshot(userId);
    if (!snapshot) return;

    if (Array.isArray(snapshot.conversations)) {
        const listKey = queryKeys.conversations();
        const currentState = queryClient.getQueryState(listKey);

        // Stamp `updatedAt: 1` so IndexedDB-hydrated data renders immediately (0 ms) while
        // remaining stale relative to `staleTime`, guaranteeing an immediate background
        // revalidation for any messages received while the tab was closed.
        if (!currentState?.dataUpdatedAt) {
            queryClient.setQueryData(listKey, snapshot.conversations, {
                updatedAt: 1,
            });
        }

        // Pre-decrypt conversation list preview ciphertexts so row previews mount settled.
        for (const conv of snapshot.conversations) {
            if (conv?.lastMessage?.content) {
                decryptMessageContent(conv.lastMessage.content).catch(() => undefined);
            }
        }
    }

    if (Array.isArray(snapshot.threads)) {
        await Promise.all(
            snapshot.threads.map(async (entry) => {
                if (!entry?.id || !entry?.firstPage) return;
                const threadKey = queryKeys.conversation(entry.id);
                const existing = queryClient.getQueryState(threadKey);

                if (existing?.dataUpdatedAt) {
                    return;
                }

                const hydratedPage = await hydrateThreadPageFromDisk(entry.firstPage);
                const latestState = queryClient.getQueryState(threadKey);
                if (latestState?.dataUpdatedAt) {
                    return;
                }

                queryClient.setQueryData(
                    threadKey,
                    {
                        pages: [hydratedPage],
                        pageParams: [1],
                    },
                    { updatedAt: 1 }
                );
            })
        );
    }
}

function collectSnapshotFromQueryClient(queryClient, userId) {
    const listKey = queryKeys.conversations();
    const listState = queryClient.getQueryState(listKey);
    const conversations = Array.isArray(listState?.data) ? listState.data : null;

    const allThreadQueries = queryClient.getQueriesData({
        queryKey: queryKeys.conversations(),
    });

    const threadEntries = [];
    for (const [key, data] of allThreadQueries) {
        if (!Array.isArray(key) || key.length !== 3) continue;
        const threadId = key[2];
        const firstPage = data?.pages?.[0];
        if (!threadId || !firstPage) continue;

        const state = queryClient.getQueryState(key);
        const sanitizedPage = sanitizeThreadPageForDisk(firstPage);
        if (!sanitizedPage) continue;

        threadEntries.push({
            id: String(threadId),
            updatedAt: state?.dataUpdatedAt || Date.now(),
            firstPage: sanitizedPage,
        });
    }

    threadEntries.sort((a, b) => b.updatedAt - a.updatedAt);

    if (!conversations && threadEntries.length === 0) return null;

    return {
        userId: String(userId),
        savedAt: Date.now(),
        conversations,
        conversationsUpdatedAt: listState?.dataUpdatedAt || Date.now(),
        threads: threadEntries.slice(0, MAX_CACHED_THREADS),
    };
}

export function attachThreadCachePersistence(queryClient, userId) {
    if (!queryClient || !userId) return () => {};

    let timer = null;
    let disposed = false;

    const flush = () => {
        timer = null;
        if (disposed) return;
        const snapshot = collectSnapshotFromQueryClient(queryClient, userId);
        if (snapshot) {
            writeSnapshot(snapshot).catch(() => undefined);
        }
    };

    const scheduleFlush = () => {
        if (disposed || timer !== null) return;
        timer = setTimeout(flush, PERSIST_DEBOUNCE_MS);
    };

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        const key = event?.query?.queryKey;
        if (!Array.isArray(key) || key[0] !== "messages" || key[1] !== "conversations") {
            return;
        }
        if (event.type === "updated" && event.action?.type === "success") {
            scheduleFlush();
        }
    });

    return () => {
        disposed = true;
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        unsubscribe();
    };
}
