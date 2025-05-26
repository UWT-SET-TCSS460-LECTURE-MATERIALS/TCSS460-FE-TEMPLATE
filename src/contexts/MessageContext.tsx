'use client';

import React, { createContext, ReactNode, useContext, useState } from 'react';
import { IMessage, MessageContextProps } from 'types/message';

const EMPTY_MSG = {
  name: 'Empty',
  priority: 0,
  message: 'Empty'
};

const initialState: MessageContextProps = {
  ...EMPTY_MSG,
  onChangeMessage: () => {}
};

// Create context
const MessageContext = createContext(initialState);

type ConfigProviderProps = {
  children: ReactNode;
};

// Create a provider component
export const MessageProvider = ({ children }: ConfigProviderProps) => {
  const [message, setMessage] = useState(EMPTY_MSG);

  function onChangeMessage(message: IMessage) {
    setMessage(message);
  }

  return <MessageContext.Provider value={{ ...message, onChangeMessage }}>{children}</MessageContext.Provider>;
};

// Custom hook to use the context
export const useMessage = () => useContext(MessageContext);
