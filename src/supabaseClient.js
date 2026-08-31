import { createClient } from '@supabase/supabase-js';

// آدرس و کلید سوپابیس اکنون از متغیرهای محیطی Vite خوانده می‌شوند
// و دیگر به‌صورت متن ساده در کد فرانت‌اند نوشته نشده‌اند.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'متغیرهای محیطی VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY تنظیم نشده‌اند. ' +
    'لطفاً فایل .env را در ریشهٔ پروژه بسازید (نمونه در .env.example).'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // نشست به‌صورت استاندارد و امن توسط خود SDK سوپابیس (JWT واقعی) مدیریت می‌شود
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
