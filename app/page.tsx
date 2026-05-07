'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HickoryBrand from '../components/HickoryBrand';

export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'center' | 'animating'>('center');

  useEffect(() => {
    const holdTimer = setTimeout(() => {
      setPhase('animating');
    }, 1200);
    return () => clearTimeout(holdTimer);
  }, []);

  useEffect(() => {
    if (phase === 'animating') {
      const redirectTimer = setTimeout(() => {
        router.push('/select-user');
      }, 900);
      return () => clearTimeout(redirectTimer);
    }
  }, [phase, router]);

  const isCentered = phase === 'center';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#f5f6f5',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: isCentered ? '50%' : '2rem',
          left: isCentered ? '50%' : '2rem',
          transform: isCentered ? 'translate(-50%, -50%)' : 'translate(0, 0)',
          transition:
            'top 0.8s cubic-bezier(0.4, 0, 0.2, 1), left 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            transform: isCentered ? 'scale(4.25)' : 'scale(1)',
            transformOrigin: 'center center',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <HickoryBrand />
        </div>
      </div>
    </div>
  );
}
