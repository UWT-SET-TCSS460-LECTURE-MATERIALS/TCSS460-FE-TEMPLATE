'use client';

import useLocalStorage from 'hooks/useLocalStorage';
import React, { createContext, ReactNode, useContext } from 'react';
import { IMessage, MessageContextProps } from 'types/message';

const EMPTY_MSG = {
  name: 'Empty',
  priority: 0,
  message: 'Empty'
};

const initialState: MessageContextProps = {
  ...EMPTY_MSG,
  onChangeMessage: () => {},
  clearContext: () => {}
};

// Create context
const MessageContext = createContext(initialState);

type MessageProviderProps = {
  children: ReactNode;
};

// Create a provider component
export const MessageProvider = ({ children }: MessageProviderProps) => {
  const [message, setMessage] = useLocalStorage('tcss460-msg', EMPTY_MSG);

  function onChangeMessage(message: IMessage) {
    setMessage(message);
  }

  function clearContext() {
    setMessage(EMPTY_MSG);
  }

  return <MessageContext.Provider value={{ ...message, onChangeMessage, clearContext }}>{children}</MessageContext.Provider>;
};

// Custom hook to use the context
export const useMessage = () => useContext(MessageContext);
