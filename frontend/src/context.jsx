import { createContext, useContext } from 'react';
export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const AppContext = createContext(null);
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('CampusLink context is missing');
  return value;
}

