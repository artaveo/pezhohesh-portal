import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// === تبدیل رشته‌ی عددی فارسی/انگلیسی (مثلاً از پنل ادمین) به عدد ===
// قیمت‌های قابل‌ویرایش در پنل ادمین (priceDaily/priceMonthly/priceAdmission)
// به‌صورت رشته با ارقام فارسی ذخیره می‌شوند (مثلاً '۲۵۰'). برای محاسبات
// عددی (مثل فاکتور زنده ثبت‌نام سالن) باید ابتدا به عدد انگلیسی تبدیل
// شوند. اگر مقدار قابل تبدیل نبود، fallback امن استفاده می‌شود.
export function toNumber(value, fallback = 0) {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const normalized = (value ?? '').toString().replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
  const parsed = parseInt(normalized.replace(/[^\d]/g, ''), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// === تبدیل شماره تماس محلی افغانستان به فرمت بین‌المللی wa.me ===
// نسخه‌ی مشترک همان تابعی که قبلاً فقط داخل AdminDashboard.jsx بود؛
// اکنون در فوتر دپارتمان خدمات تحصیلی (ServiceFooter.jsx) هم برای ساخت
// لینک واتساپ از روی شماره‌ی ذخیره‌شده در پنل استفاده می‌شود.
export function formatWhatsappNumber(phone) {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = (phone || '').toString().replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
  const digitsOnly = englishDigits.replace(/\D/g, '');
  if (!digitsOnly) return '';
  if (digitsOnly.startsWith('93')) return digitsOnly;
  if (digitsOnly.startsWith('0')) return `93${digitsOnly.slice(1)}`;
  return `93${digitsOnly}`;
}
