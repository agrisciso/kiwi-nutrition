import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://uarlalinghlqnbthrsfq.supabase.co';
const SUPABASE_ANON_KEY= 'sb_publishable_MLDe92OHZ99PWYPOi5dqOA_F2Sef3kX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
