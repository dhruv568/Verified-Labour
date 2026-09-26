'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffDetailRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin?section=staff&staffId=${params.id}`);
  }, [router, params.id]);

  return null;
}
