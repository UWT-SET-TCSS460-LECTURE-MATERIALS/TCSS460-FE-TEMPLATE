import { ReactNode } from 'react';

// ==============================|| AUTH TYPES ||============================== //

export type GuardProps = {
  children: ReactNode;
};

export type UserProfile = {
  id?: string;
  email?: string;
  avatar?: string;
  image?: string;
  name?: string;
  role?: string;
  tier?: string;
};
