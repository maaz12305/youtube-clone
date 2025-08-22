'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function WatchContent() {
  const videoSrc = useSearchParams().get('v');
  const videoPrefix = 'https://storage.googleapis.com/testing1295-processed-videos/';

  return (
    <div>
      <h1>Watch Page</h1>
      <video controls src={`${videoPrefix}${videoSrc}`} />
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchContent />
    </Suspense>
  );
}
