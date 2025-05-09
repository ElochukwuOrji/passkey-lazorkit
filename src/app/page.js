'use client';
import dynamic from 'next/dynamic';

const HomeNoSSR = dynamic(() => import('../components/HomePage'), {
  ssr: false,
});

export default function Page() {
  return <HomeNoSSR />;
}