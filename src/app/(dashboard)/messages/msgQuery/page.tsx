'use client';

import { useSearchParams } from 'next/navigation';

// ==============================|| PAGE ||============================== //

export default function MessagesPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();

  const search = searchParams.get('msg');

  const message = search && JSON.parse(search);

  return (
    <div>
      <h1>{message.name}</h1>
      <p>{message.message}</p>
    </div>
  );
}
