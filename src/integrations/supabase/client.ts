// Este arquivo foi modificado para suportar migração local (Lovable -> PHP/MySQL)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Cliente Original (Fallback)
const originalSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Proxy de Compatibilidade Local
export const supabase: any = new Proxy(originalSupabase, {
  get(target, prop) {
    // Interceptar AUTH (Logout/Session)
    if (prop === 'auth') {
      return {
        ...target.auth,
        getSession: async () => {
          const user = localStorage.getItem('local_user');
          return { data: { session: user ? { user: JSON.parse(user) } : null }, error: null };
        },
        signInWithPassword: async ({ email, password }: any) => {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (data.user) {
            localStorage.setItem('local_user', JSON.stringify(data.user));
            localStorage.setItem('local_auth_token', data.access_token);
            return { data: { user: data.user, session: data }, error: null };
          }
          return { data: { user: null, session: null }, error: data.error || 'Erro' };
        },
        signUp: async ({ email, password, options }: any) => {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name: options?.data?.full_name })
          });
          const data = await res.json();
          return { data: { user: data.success ? { email } : null }, error: data.error ? { message: data.error } : null };
        },
        signOut: async () => {
          localStorage.removeItem('local_user');
          localStorage.removeItem('local_auth_token');
          return { error: null };
        },
        onAuthStateChange: (callback: any) => {
          const user = localStorage.getItem('local_user');
          if (user) callback('SIGNED_IN', { user: JSON.parse(user) });
          return { data: { subscription: { unsubscribe: () => { } } } };
        }
      };
    }

    // Interceptar consultas de Tabelas (from)
    if (prop === 'from') {
      return (tableName: string) => {
        return {
          select: (columns: string = '*') => ({
            eq: (field: string, value: any) => ({
              single: async () => {
                const res = await fetch(`/api/${tableName}?${field}=eq.${value}`);
                const data = await res.json();
                return { data: Array.isArray(data) ? data[0] : data, error: null };
              },
              maybeSingle: async () => {
                const res = await fetch(`/api/${tableName}?${field}=eq.${value}`);
                const data = await res.json();
                return { data: Array.isArray(data) ? data[0] : (data || null), error: null };
              },
              then: async (onData: any) => {
                const res = await fetch(`/api/${tableName}?${field}=eq.${value}`);
                const data = await res.json();
                return onData({ data, error: null });
              }
            }),
            then: async (onData: any) => {
              const res = await fetch(`/api/${tableName}`);
              const data = await res.json();
              return onData({ data, error: null });
            }
          }),
          insert: (values: any) => ({
            select: () => ({
              single: async () => {
                const res = await fetch(`/api/${tableName}`, {
                  method: 'POST',
                  body: JSON.stringify(values)
                });
                const data = await res.json();
                return { data, error: null };
              }
            })
          }),
          update: (values: any) => ({
            eq: (field: string, value: any) => ({
              then: async (onData: any) => {
                const res = await fetch(`/api/${tableName}?${field}=eq.${value}`, {
                  method: 'PUT',
                  body: JSON.stringify(values)
                });
                const data = await res.json();
                return onData({ data, error: null });
              }
            })
          })
        };
      };
    }

    return (target as any)[prop];
  }
});