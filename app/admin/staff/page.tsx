'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?section=staff');
  }, [router]);

  return null;
}
