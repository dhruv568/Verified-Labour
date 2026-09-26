'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RolesPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?section=roles');
  }, [router]);

  return null;
}
