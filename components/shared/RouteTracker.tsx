'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export const LAST_ROUTE_KEY = 'khata_last_route';

// শুধু এই route-গুলোই "resume" করার যোগ্য — settings/edit/new-এর মতো
// transient/form পেজ-এ cold-start-এ ফেরত পাঠানো হয় না।
function isResumableRoute(pathname: string, search: string): boolean {
  if (pathname === '/notebook/view') {
    return search.includes('id=');
  }
  if (pathname === '/history') {
    return true;
  }
  return false;
}

function RouteTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    if (isResumableRoute(pathname, search)) {
      const full = search ? `${pathname}?${search}` : pathname;
      try {
        localStorage.setItem(LAST_ROUTE_KEY, full);
      } catch {
        // localStorage unavailable (private mode ইত্যাদি) — চুপচাপ ignore
      }
    }
  }, [pathname, searchParams]);

  return null;
}

// এই component app-এর সব পাতায় mount থাকে, প্রতিটা route বদলে সবশেষ "resumable"
// screen-টা localStorage-এ রেখে দেয় — Home page cold-start-এ এটা পড়ে সেখানে ফেরত পাঠায়।
export function RouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteTrackerInner />
    </Suspense>
  );
}
