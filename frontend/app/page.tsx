'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-transparent border-b-2 border-l-transparent" />
    </div>
  );
}
