import { createContext } from 'react';

export const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@brightloopsoftware.com',
    password: 'BrightAdmin@2026!',
    userKey: 'admin'
  },
  staff: {
    email: 'operations@brightloopsoftware.com',
    password: 'BrightStaff@2026!',
    userKey: 'staff'
  },
  customer: {
    email: 'marcus@acmecorp.com',
    password: 'BrightCust@2026!',
    userKey: 'customer'
  }
};

