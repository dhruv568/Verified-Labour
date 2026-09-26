'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoleDetailRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/admin?section=roles&roleId=${params.id}`);
  }, [router, params.id]);

  return null;
}
