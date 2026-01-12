import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configuration directe - Plus simple et plus fiable
const supabaseUrl = 'https://inhzfdufjhuihtuykwmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHpmZHVmamh1aWh0dXlrd213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDIxMzksImV4cCI6MjA3NTc3ODEzOX0.UexWMIDnDYXcqHqzWY0NywMWHgt1_fZahWXqsD352_U';

console.log('✅ [Supabase] Configuration chargée');
console.log('📡 [Supabase] URL:', supabaseUrl);
console.log('🔑 [Supabase] API Key:', supabaseAnonKey ? 'Présente (' + supabaseAnonKey.substring(0, 20) + '...)' : 'ABSENTE!');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('✅ [Supabase] Client créé avec succès');