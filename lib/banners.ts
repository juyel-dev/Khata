import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase/config';

export interface AdminBanner {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  title?: string;
  order: number;
  active: boolean;
}

const CACHE_KEY = 'khata_banners_cache';
export const MAX_BANNER_SLIDES = 5;
export const MAX_TIP_SLIDES = 3;

interface BannerCache {
  at: number;
  items: AdminBanner[];
}

function readCache(): AdminBanner[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BannerCache;
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items.filter((b) => b && b.imageUrl);
  } catch {
    return [];
  }
}

function writeCache(items: AdminBanner[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items } satisfies BannerCache));
  } catch {
    // storage full/blocked — ignore, tips will show
  }
}

/**
 * Admin-এর বসানো ব্যানার ছবি আনে (সর্বোচ্চ ৫টা)।
 * নেট না থাকলে বা Firebase সেট না থাকলে শেষবারের জমানো তালিকা দেয়।
 */
export async function getAdminBanners(): Promise<AdminBanner[]> {
  const cached = readCache();
  if (!isFirebaseConfigured || !db) return cached;
  try {
    const snap = await getDocs(query(collection(db, 'banners'), limit(10)));
    const items = snap.docs
      .map((d) => ({ id: d.id, order: 999, active: true, ...(d.data() as object) }) as AdminBanner)
      .filter((b) => b.active !== false && typeof b.imageUrl === 'string' && b.imageUrl.length > 0)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .slice(0, MAX_BANNER_SLIDES);
    writeCache(items);
    return items;
  } catch {
    return cached;
  }
}
