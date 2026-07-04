import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// During web static rendering (SSR in Node) there is no `window`, so we must
// not touch AsyncStorage/localStorage. Only persist sessions on the client.
const isClient = typeof window !== 'undefined';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    if (__DEV__) {
      console.warn(
        '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
          'Supabase is disabled until you add them to your .env file.',
      );
    }
    return null;
  }

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      storage: isClient ? AsyncStorage : undefined,
      autoRefreshToken: isClient,
      persistSession: isClient,
      detectSessionInUrl: false,
    },
  });
}

// `null` until you provide credentials. Guard usages with `if (supabase)` or
// check `isSupabaseConfigured` before calling into it.
export const supabase = createSupabaseClient();
