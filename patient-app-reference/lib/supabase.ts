// Nirog patient app (Expo) — Supabase client.
// Drop into your Expo repo. This points at the SAME project as the doctor
// portal, so a QueueEntry the patient inserts here is the exact row the
// doctor's portal watches live. Only the anon key is used on the client;
// Row-Level Security decides what each signed-in user may read/write.
//
// deps: npm i @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Same values as the doctor portal's NEXT_PUBLIC_SUPABASE_* (safe to ship).
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no URL-based auth on native
  },
});
