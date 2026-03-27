'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardPath } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [user, isLoading, router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div className="spinner-lg spinner" />
    </div>
  );
}
