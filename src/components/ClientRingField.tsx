'use client';
import dynamic from 'next/dynamic';

const RingField = dynamic(() => import('@/components/RingField'), {
  ssr: false,
});

export default function ClientRingField({
  works,
}: {
  works: { _meta: { path: string }; repo: string }[];
}) {
  return <RingField works={works} />;
}
