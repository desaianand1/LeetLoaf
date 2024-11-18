import Browser from 'webextension-polyfill';
import { fetchStorage } from '@/utils/storage-helper';

export interface QueueItem {
  id: string;
  problemId: string;
  submissionId: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
}

export class SyncQueue {
  private processing = false;

  async add(problemId: string, submissionId: string): Promise<void> {
    const item: QueueItem = {
      id: `${problemId}-${submissionId}-${Date.now()}`,
      problemId,
      submissionId,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    };

    const queue = await fetchStorage<QueueItem[]>('syncQueue') || [];
    
    // Don't add if already in queue
    if (queue.some((i: QueueItem) => i.problemId === problemId && i.submissionId === submissionId)) {
      return;
    }

    await Browser.storage.local.set({
      ["syncQueue"]: [...queue, item]
    });
  }

  async getNext(): Promise<QueueItem | null> {
    const queue = await fetchStorage<QueueItem[]>('syncQueue') || [];
    return queue.find((item: QueueItem) => item.status === 'pending') || null;
  }

  async updateStatus(itemId: string, status: QueueItem['status']): Promise<void> {
    const queue = await fetchStorage<QueueItem[]>('syncQueue') || [];
    const updatedQueue = queue.map((item: QueueItem) =>
      item.id === itemId ? { ...item, status } : item
    );
    await Browser.storage.local.set({ [SyncQueue.QUEUE_KEY]: updatedQueue });
  }

  async clean(): Promise<void> {
    const queue = await fetchStorage<QueueItem[]>('syncQueue') || [];
    const cleanedQueue = queue
      .filter((item: QueueItem) => 
        item.status !== 'completed' || 
        Date.now() - new Date(item.timestamp).getTime() < 24 * 60 * 60 * 1000 // Keep completed items for 24h
      )
      .slice(-1000); // Keep last 1000 items max

    await Browser.storage.local.set({ ['syncQueue']: cleanedQueue });
  }

  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const queue = await fetchStorage<QueueItem[]>('syncQueue') || [];
    return queue.reduce((acc: Record<string, number>, item: QueueItem) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    });
  }
}