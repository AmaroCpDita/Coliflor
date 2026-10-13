import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Message } from '../lib/types';

interface InboxState {
  key: string;
  readIds: string[];
  dismissedIds: string[];
}

function readInbox(key: string): InboxState {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    const ids = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
    return { key, readIds: ids(saved?.readIds), dismissedIds: ids(saved?.dismissedIds) };
  } catch {
    return { key, readIds: [], dismissedIds: [] };
  }
}

export function useNotificationInbox(logs: Message[], storageKey: string, viewerId?: string) {
  const [state, setState] = useState(() => readInbox(storageKey));
  const inbox = state.key === storageKey ? state : readInbox(storageKey);

  useEffect(() => {
    setState(readInbox(storageKey));
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) setState(readInbox(storageKey));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [storageKey]);

  useEffect(() => {
    if (state.key !== storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // The inbox still works for this session when local storage is unavailable.
    }
  }, [state, storageKey]);

  const visibleLogs = useMemo(() => {
    const hidden = new Set(inbox.dismissedIds);
    return logs.filter((log) => !hidden.has(log.id));
  }, [logs, inbox.dismissedIds]);
  const unreadIds = useMemo(() => {
    const read = new Set(inbox.readIds);
    return new Set(
      visibleLogs
        .filter((log) => viewerId && log.sender_id !== viewerId && !read.has(log.id))
        .map((log) => log.id),
    );
  }, [visibleLogs, inbox.readIds, viewerId]);

  const updateIds = useCallback(
    (field: 'readIds' | 'dismissedIds', ids: string[]) => {
      setState((previous) => {
        const current = previous.key === storageKey ? previous : readInbox(storageKey);
        return { ...current, [field]: [...new Set([...ids, ...current[field]])].slice(0, 1000) };
      });
    },
    [storageKey],
  );

  return {
    visibleLogs,
    unreadIds,
    hasUnread: unreadIds.size > 0,
    markRead: (id: string) => updateIds('readIds', [id]),
    markAllRead: () =>
      updateIds(
        'readIds',
        visibleLogs.map((log) => log.id),
      ),
    dismiss: (id: string) => updateIds('dismissedIds', [id]),
    clearAll: () =>
      updateIds(
        'dismissedIds',
        visibleLogs.map((log) => log.id),
      ),
  };
}
