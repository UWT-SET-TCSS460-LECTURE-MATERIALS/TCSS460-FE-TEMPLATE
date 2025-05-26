'use client';

import { useMessage } from 'contexts/MessageContext';

// ==============================|| PAGE ||============================== //

export default function MessagesPage() {
  const { name, message } = useMessage();

  return (
    <div>
      <h1>{name}</h1>
      <p>{message}</p>
    </div>
  );
}
