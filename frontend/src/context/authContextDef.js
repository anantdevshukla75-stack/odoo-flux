import { createContext } from 'react';

export const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@odooflux.local',
    password: 'Password123!',
    userKey: 'admin'
  },
  staff: {
    email: 'staff@odooflux.local',
    password: 'Password123!',
    userKey: 'staff'
  },
  customer: {
    email: 'customer@odooflux.local',
    password: 'Password123!',
    userKey: 'customer'
  },
  legacyAdmin: {
    email: 'admin@brightloopsoftware.com',
    password: 'BrightAdmin@2026!',
    userKey: 'admin'
  },
  legacyStaff: {
    email: 'operations@brightloopsoftware.com',
    password: 'BrightStaff@2026!',
    userKey: 'staff'
  },
  legacyCustomer: {
    email: 'marcus@acmecorp.com',
    password: 'BrightCust@2026!',
    userKey: 'customer'
  }
};
