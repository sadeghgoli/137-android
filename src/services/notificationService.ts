import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../constants';
import type { AppNotification } from '../types/domain';
import { ensureRequestsSeeded } from './requestService';

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    requestId: 'req-app-1',
    title: 'چاله خیابان',
    status: 'in_progress',
    paraf: 'اقدام اصلاحی در برنامه امروز قرار گرفت.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    read: false,
  },
  {
    id: 'n2',
    requestId: 'req-phone-1',
    title: 'روشنایی معابر',
    status: 'referred',
    paraf: 'به واحد خدمات شهری ارجاع شد.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    read: true,
  },
];

async function readAll(): Promise<AppNotification[]> {
  const raw = await AsyncStorage.getItem(StorageKeys.notifications);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

async function writeAll(items: AppNotification[]): Promise<void> {
  await AsyncStorage.setItem(StorageKeys.notifications, JSON.stringify(items));
}

export async function ensureNotificationsSeeded(): Promise<void> {
  await ensureRequestsSeeded();
  const existing = await readAll();
  if (existing.length === 0) {
    await writeAll(SEED_NOTIFICATIONS);
  }
}

export async function listNotifications(): Promise<AppNotification[]> {
  await ensureNotificationsSeeded();
  const items = await readAll();
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getUnreadCount(): Promise<number> {
  const items = await listNotifications();
  return items.filter((item) => !item.read).length;
}

export async function markNotificationRead(id: string): Promise<void> {
  const items = await readAll();
  const next = items.map((item) =>
    item.id === id ? { ...item, read: true } : item,
  );
  await writeAll(next);
}

export async function addNotification(
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & {
    id?: string;
  },
): Promise<void> {
  const items = await readAll();
  items.unshift({
    id: notification.id ?? `n-${Date.now()}`,
    requestId: notification.requestId,
    title: notification.title,
    status: notification.status,
    paraf: notification.paraf,
    createdAt: new Date().toISOString(),
    read: false,
  });
  await writeAll(items);
}
