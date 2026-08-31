/**
 * منبع واحد اطلاعات کشورها برای دپارتمان بورسیه‌های پژوهش.
 *
 * === چرا این فایل ساخته شد ===
 * پیش از این، فیلد «کشور» در فرم پنل ادمین یک باکس متن کاملاً آزاد بود
 * (هرچه تایپ می‌شد عیناً ذخیره می‌شد: «چین»، «China»، «china»، با یا
 * بدون غلط املایی)، در حالی که فیلتر کشورها و آیکون پرچم در صفحه‌ی
 * عمومی (ActiveScholarshipsPage.jsx) به یک فهرست کاملاً ثابت و
 * هاردکدشده (فقط china/japan/turkey/germany، دقیقاً به انگلیسی و با
 * حروف کوچک) وابسته بود. نتیجه: هر تفاوت کوچک در نگارش (فارسی/انگلیسی/
 * حروف بزرگ‌وکوچک) باعث می‌شد فیلتر و آیکون کار نکنند.
 *
 * این فایل یک فهرست استاندارد از کشورها (کد دو-حرفی ISO 3166-1 + نام
 * فارسی + نام انگلیسی) و چند تابع کمکی ارائه می‌دهد تا:
 *   ۱. پنل ادمین بتواند یک باکس جست‌وجوی کشور (نه متن آزاد) نمایش دهد.
 *   ۲. صفحه‌ی عمومی بتواند فیلتر و آیکون پرچم را به‌صورت پویا و مقاوم
 *      در برابر تفاوت زبان/املا (فارسی، انگلیسی، کد، حروف بزرگ/کوچک)
 *      از روی همین یک منبع بسازد — چه دیتای جدید (کد استاندارد) باشد،
 *      چه دیتای قدیمی/آزاد که قبلاً ذخیره شده (مثل «چین» یا «china»).
 *
 * فهرست زیر شامل کشورهای همسایه، مقاصد رایج تحصیلی و بورسیه‌ای، و
 * کشورهای عمده‌ی منطقه و جهان است. افزودن کشور جدید فقط یعنی یک خط به
 * آرایه‌ی COUNTRIES اضافه کنی — هیچ‌جای دیگر کد نیازی به تغییر ندارد.
 */
export const COUNTRIES = [
  { code: 'AF', nameFa: 'افغانستان', nameEn: 'Afghanistan' },
  { code: 'IR', nameFa: 'ایران', nameEn: 'Iran' },
  { code: 'PK', nameFa: 'پاکستان', nameEn: 'Pakistan' },
  { code: 'CN', nameFa: 'چین', nameEn: 'China' },
  { code: 'JP', nameFa: 'جاپان', nameEn: 'Japan' },
  { code: 'KR', nameFa: 'کره جنوبی', nameEn: 'South Korea' },
  { code: 'TR', nameFa: 'ترکیه', nameEn: 'Turkey' },
  { code: 'DE', nameFa: 'آلمان', nameEn: 'Germany' },
  { code: 'FR', nameFa: 'فرانسه', nameEn: 'France' },
  { code: 'GB', nameFa: 'بریتانیا', nameEn: 'United Kingdom' },
  { code: 'US', nameFa: 'آمریکا', nameEn: 'United States' },
  { code: 'CA', nameFa: 'کانادا', nameEn: 'Canada' },
  { code: 'AU', nameFa: 'استرالیا', nameEn: 'Australia' },
  { code: 'IT', nameFa: 'ایتالیا', nameEn: 'Italy' },
  { code: 'ES', nameFa: 'اسپانیا', nameEn: 'Spain' },
  { code: 'NL', nameFa: 'هلند', nameEn: 'Netherlands' },
  { code: 'RU', nameFa: 'روسیه', nameEn: 'Russia' },
  { code: 'IN', nameFa: 'هند', nameEn: 'India' },
  { code: 'MY', nameFa: 'مالزی', nameEn: 'Malaysia' },
  { code: 'ID', nameFa: 'اندونزی', nameEn: 'Indonesia' },
  { code: 'SA', nameFa: 'عربستان سعودی', nameEn: 'Saudi Arabia' },
  { code: 'AE', nameFa: 'امارات متحده عربی', nameEn: 'United Arab Emirates' },
  { code: 'QA', nameFa: 'قطر', nameEn: 'Qatar' },
  { code: 'KW', nameFa: 'کویت', nameEn: 'Kuwait' },
  { code: 'EG', nameFa: 'مصر', nameEn: 'Egypt' },
  { code: 'JO', nameFa: 'اردن', nameEn: 'Jordan' },
  { code: 'IQ', nameFa: 'عراق', nameEn: 'Iraq' },
  { code: 'TJ', nameFa: 'تاجیکستان', nameEn: 'Tajikistan' },
  { code: 'UZ', nameFa: 'ازبکستان', nameEn: 'Uzbekistan' },
  { code: 'KZ', nameFa: 'قزاقستان', nameEn: 'Kazakhstan' },
  { code: 'KG', nameFa: 'قرقیزستان', nameEn: 'Kyrgyzstan' },
  { code: 'TM', nameFa: 'ترکمنستان', nameEn: 'Turkmenistan' },
  { code: 'AT', nameFa: 'اتریش', nameEn: 'Austria' },
  { code: 'CH', nameFa: 'سوئیس', nameEn: 'Switzerland' },
  { code: 'SE', nameFa: 'سوئد', nameEn: 'Sweden' },
  { code: 'NO', nameFa: 'نروژ', nameEn: 'Norway' },
  { code: 'FI', nameFa: 'فنلاند', nameEn: 'Finland' },
  { code: 'DK', nameFa: 'دانمارک', nameEn: 'Denmark' },
  { code: 'BE', nameFa: 'بلژیک', nameEn: 'Belgium' },
  { code: 'PL', nameFa: 'لهستان', nameEn: 'Poland' },
  { code: 'CZ', nameFa: 'جمهوری چک', nameEn: 'Czech Republic' },
  { code: 'HU', nameFa: 'مجارستان', nameEn: 'Hungary' },
  { code: 'GR', nameFa: 'یونان', nameEn: 'Greece' },
  { code: 'PT', nameFa: 'پرتغال', nameEn: 'Portugal' },
  { code: 'IE', nameFa: 'ایرلند', nameEn: 'Ireland' },
  { code: 'RO', nameFa: 'رومانی', nameEn: 'Romania' },
  { code: 'UA', nameFa: 'اوکراین', nameEn: 'Ukraine' },
  { code: 'AZ', nameFa: 'آذربایجان', nameEn: 'Azerbaijan' },
  { code: 'GE', nameFa: 'گرجستان', nameEn: 'Georgia' },
  { code: 'AM', nameFa: 'ارمنستان', nameEn: 'Armenia' },
  { code: 'TH', nameFa: 'تایلند', nameEn: 'Thailand' },
  { code: 'SG', nameFa: 'سنگاپور', nameEn: 'Singapore' },
  { code: 'PH', nameFa: 'فیلیپین', nameEn: 'Philippines' },
  { code: 'VN', nameFa: 'ویتنام', nameEn: 'Vietnam' },
  { code: 'BD', nameFa: 'بنگلادش', nameEn: 'Bangladesh' },
  { code: 'LK', nameFa: 'سریلانکا', nameEn: 'Sri Lanka' },
  { code: 'NP', nameFa: 'نپال', nameEn: 'Nepal' },
  { code: 'NZ', nameFa: 'نیوزیلند', nameEn: 'New Zealand' },
  { code: 'ZA', nameFa: 'آفریقای جنوبی', nameEn: 'South Africa' },
  { code: 'BR', nameFa: 'برزیل', nameEn: 'Brazil' },
  { code: 'MX', nameFa: 'مکزیک', nameEn: 'Mexico' },
  { code: 'AR', nameFa: 'آرژانتین', nameEn: 'Argentina' },
  { code: 'HK', nameFa: 'هنگ‌کنگ', nameEn: 'Hong Kong' },
  { code: 'TW', nameFa: 'تایوان', nameEn: 'Taiwan' },
  { code: 'IL', nameFa: 'اسرائیل', nameEn: 'Israel' },
  { code: 'LB', nameFa: 'لبنان', nameEn: 'Lebanon' },
  { code: 'BH', nameFa: 'بحرین', nameEn: 'Bahrain' },
  { code: 'OM', nameFa: 'عمان', nameEn: 'Oman' },
  { code: 'MN', nameFa: 'مغولستان', nameEn: 'Mongolia' }
];

/**
 * ساخت پرچم امجی از روی کد دو-حرفی کشور، بدون نیاز به نگهداری امجی
 * جداگانه برای هر کشور در دیتا (یعنی هیچ‌وقت نمی‌شود «فراموش» کرد
 * پرچم یک کشور جدید را اضافه کنیم — چون خودکار ساخته می‌شود).
 */
export function getFlagEmoji(code) {
  if (!code || code.length !== 2) return '📍';
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function normalize(value) {
  return (value || '').toString().trim().toLowerCase();
}

// نگاشت جست‌وجوی سریع: هر کلید نرمال‌شده (کد / نام فارسی / نام انگلیسی)
// به آبجکت کامل کشور اشاره می‌کند تا جست‌وجو با هر نوع نگارشی کار کند.
const LOOKUP = new Map();
COUNTRIES.forEach((country) => {
  LOOKUP.set(normalize(country.code), country);
  LOOKUP.set(normalize(country.nameFa), country);
  LOOKUP.set(normalize(country.nameEn), country);
});

/**
 * تلاش برای یافتن کشور معتبر از روی هر مقداری که ممکن است در دیتابیس
 * ذخیره شده باشد — چه کد استاندارد («CN»)، چه نام فارسی («چین»)، چه
 * نام انگلیسی («China»/«china»)، مستقل از حروف بزرگ/کوچک و فاصله‌ی
 * اضافه. اگر چیزی پیدا نشود null برمی‌گرداند (نه خطا) تا فراخواننده
 * خودش تصمیم بگیرد چطور دیتای ناشناخته/قدیمی را نمایش دهد.
 */
export function resolveCountry(rawValue) {
  if (!rawValue) return null;
  return LOOKUP.get(normalize(rawValue)) || null;
}

/** برچسب فارسی قابل‌نمایش برای یک مقدار خام کشور — هرگز خالی نیست. */
export function getCountryLabel(rawValue) {
  const found = resolveCountry(rawValue);
  if (found) return found.nameFa;
  return rawValue || 'نامشخص';
}

/** آیکون پرچم برای یک مقدار خام کشور — اگر شناخته نشود، آیکون خنثی. */
export function getCountryFlag(rawValue) {
  const found = resolveCountry(rawValue);
  return found ? getFlagEmoji(found.code) : '📍';
}

/**
 * کلید یکتای نرمال‌شده برای گروه‌بندی/فیلتر کردن. اگر کشور شناخته‌شده
 * باشد، کد استاندارد («CN») برگردانده می‌شود تا نگارش‌های مختلف («چین»،
 * «China»، «china») همه زیر یک گزینه‌ی فیلتر واحد جمع شوند؛ در غیر این
 * صورت خودِ مقدار نرمال‌شده (برای دیتای ناشناخته) برگردانده می‌شود.
 */
export function getCountryFilterKey(rawValue) {
  const found = resolveCountry(rawValue);
  return found ? found.code : normalize(rawValue);
}
