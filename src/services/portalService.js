import { supabase } from '../supabaseClient';
import {
  STATIC_PORTAL_CONFIG,
  PORTAL_STORAGE_KEY,
  PENDING_QUEUE_KEY,
  PORTAL_SETTINGS_TABLE,
  PORTAL_SCHOLARSHIPS_TABLE,
  PORTAL_REQUESTS_TABLE
} from '../config/staticPortalConfig.js';

/**
 * ۱. خواندن فوری داده‌ها (Static-First)
 * این تابع بدون هیچ تأخیری ابتدا دیتای کش‌شده و در غیر این صورت دیتای استاتیک را برمی‌گرداند.
 * (بدون تغییر نسبت به نسخه قبلی — Static-First دقیقاً حفظ شده است)
 */
export function getLocalPortalData() {
  try {
    const cachedData = localStorage.getItem(PORTAL_STORAGE_KEY);
    return cachedData ? JSON.parse(cachedData) : { ...STATIC_PORTAL_CONFIG };
  } catch (error) {
    console.error("خطا در خواندن حافظه محلی، استفاده از دیتای استاتیک اولیه:", error);
    return { ...STATIC_PORTAL_CONFIG };
  }
}

/**
 * ۲. دریافت داده‌های تازه از دیتابیس در پس‌زمینه (Background Hydration)
 * این تابع ابتدا دیتای محلی را برای رندر آنی برمی‌گرداند و سپس دیتابیس را چک می‌کند.
 * (منطق داخلی بدون تغییر — فقط نام جداول از ثابت‌های متمرکز خوانده می‌شود)
 * @param {Function} onBackgroundUpdate - کالبک برای زمانی که دیتای جدیدی یافت شد و باید بدون رفرش اعمال شود.
 */
export async function fetchPortalData(onBackgroundUpdate = null) {
  // الف) دریافت فوری دیتای موجود برای جلوگیری از معطلی کاربر
  const currentData = getLocalPortalData();
  let hasChanges = false;

  // ساخت یک نسخه جدید از دیتا برای مقایسه
  const freshSettings = { ...currentData };

  try {
    // ب) استعلام موازی تنظیمات و بورسیه‌ها در پس‌زمینه برای حداکثر سرعت
    const [settingsResponse, scholarshipsResponse] = await Promise.all([
      supabase.from(PORTAL_SETTINGS_TABLE).select('key, value'),
      supabase.from(PORTAL_SCHOLARSHIPS_TABLE).select('*')
    ]);

    // === رفع باگ: خطای خواندن settings/scholarships کاملاً بی‌صدا بود ===
    // قبلاً اگر settingsResponse.error یا scholarshipsResponse.error مقدار
    // داشت (مثلاً به‌خاطر یک Row Level Security policy که SELECT را برای
    // کاربر anon مسدود می‌کند، یا نام جدول اشتباه)، کد فقط بی‌سروصدا از
    // آن بلوک رد می‌شد؛ freshSettings همان دیتای قدیمی/کش‌شده (یا حتی
    // seed استاتیک اولیه) می‌ماند و هیچ خطایی در Console دیده نمی‌شد —
    // یعنی از دید بازدیدکننده و حتی ادمین، انگار «سایت بی هیچ خطایی، فقط
    // دیتای قدیمی» نشان می‌داد. اکنون این خطا با جزئیات دقیق Supabase در
    // Console لاگ می‌شود تا در DevTools قابل مشاهده و ریشه‌یابی باشد.
    if (settingsResponse.error) {
      console.error('خطا در خواندن جدول portal_settings از Supabase:', settingsResponse.error);
    }
    if (scholarshipsResponse.error) {
      console.error('خطا در خواندن جدول portal_scholarships از Supabase:', scholarshipsResponse.error);
    }

    // ج) پردازش تنظیمات متنی و قیمت‌ها
    //
    // === رفع باگ: portal_settings.value همیشه از نوع text است ===
    // قبلاً مقدار خام رشته‌ای مستقیماً در state می‌نشست. برای فیلدهای
    // ساده (رشته/عدد) مشکلی نداشت، ولی فیلدهای آبجکتی/آرایه‌ای
    // (homeTestimonial, achievementsEliteList, aboutPageImages,
    // loungeGalleryImages و مشابه) هرگز JSON.parse نمی‌شدند و به‌صورت
    // رشته خام (یا نامعتبر) در برنامه استفاده می‌شدند. اکنون هر مقدار
    // با JSON.parse خوانده می‌شود؛ اگر مقدار قدیمی یک رشته خام
    // (غیر-JSON) بود، parse شکست می‌خورد و همان رشته خام به‌عنوان
    // fallback امن استفاده می‌شود — یعنی دیتای قدیمی هرگز خراب نمی‌شود.
    if (!settingsResponse.error && settingsResponse.data) {
      settingsResponse.data.forEach((item) => {
        let parsedValue = item.value;
        try {
          parsedValue = JSON.parse(item.value);
        } catch (parseErr) {
          // مقدار قدیمی/خام غیر-JSON بود؛ همان‌طور که هست استفاده می‌شود.
          parsedValue = item.value;
        }

        if (freshSettings[item.key] !== parsedValue) {
          freshSettings[item.key] = parsedValue;
          hasChanges = true;
        }
      });
    }

    // د) پردازش لیست بورسیه‌ها
    if (!scholarshipsResponse.error && scholarshipsResponse.data) {
      const dbScholarshipsStr = JSON.stringify(scholarshipsResponse.data);
      const localScholarshipsStr = JSON.stringify(freshSettings.scholarshipsList);

      if (dbScholarshipsStr !== localScholarshipsStr) {
        freshSettings.scholarshipsList = scholarshipsResponse.data;
        hasChanges = true;
      }
    }

    // هـ) اگر ادمین دیتایی را تغییر داده بود، حافظه را بروز کرده و کامپوننت را باخبر می‌کنیم
    if (hasChanges) {
      localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(freshSettings));
      if (typeof onBackgroundUpdate === 'function') {
        onBackgroundUpdate(freshSettings);
      }
    }
  } catch (e) {
    // این catch از قبل هم درست کار می‌کرد: حتی در صورت شکست کامل شبکه،
    // freshSettings هرگز خالی نیست (چون از روی currentData/getLocalPortalData ساخته شده).
    console.warn("ارتباط با دیتابیس برقرار نشد. سیستم ۱۰۰٪ بر پایه دیتای استاتیک پایدار است.", e);
  }

  // خروجی اولیه همیشه دیتای موجود است تا سرعت فدای دیتابیس نشود
  return freshSettings;
}

/**
 * ۳. بروزرسانی تنظیمات پورتال توسط ادمین در دیتابیس ابری
 *
 * === رفع ریشه‌ای باگ بحرانی شماره ۲ ===
 * قبلاً خط «if (item.key === 'scholarshipsList') continue;» باعث می‌شد
 * تغییرات لیست بورسیه‌ها هرگز به Supabase ارسال نشود و فقط در localStorage
 * همان مرورگر ادمین باقی بماند (یعنی فقط خود ادمین آن را می‌دید، و با
 * رفرش یا از مرورگر دیگر، تغییرات ناپدید می‌شد). اکنون این کلید به‌طور
 * اختصاصی و صحیح، با درج/به‌روزرسانی/حذف واقعی ردیف‌ها در جدول
 * portal_scholarships همگام می‌شود (تابع syncScholarshipsList پایین‌تر).
 *
 * === رفع بخشی از ریشه مشکل ۳ (خطاهای خاموش در مسیر ذخیره) ===
 * قبلاً خطاهای Supabase برای هر کلید فقط با console.error لاگ می‌شد و
 * هرگز به فراخوانندهٔ تابع (AdminDashboard.jsx) گزارش نمی‌شد؛ در نتیجه
 * پیام موفقیت به ادمین نشان داده می‌شد حتی اگر ذخیره واقعاً شکست خورده
 * بود. اکنون در پایان، اگر حتی یک کلید با خطا مواجه شود، یک Error با
 * فهرست دقیق کلیدهای ناموفق throw می‌شود. AdminDashboard.jsx از قبل یک
 * try/catch دور فراخوانی همین تابع دارد (بدون نیاز به هیچ تغییری در آن
 * فایل) و همین catch موجود، خطای واقعی را به ادمین نشان می‌دهد.
 */
export async function updatePortalSettings(updates) {
  const localData = getLocalPortalData();

  // اعمال آنی در دیتای محلی ادمین (بازخورد فوری در همان مرورگر — بدون تغییر)
  updates.forEach(item => {
    localData[item.key] = item.value;
  });
  localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(localData));

  const failedKeys = [];

  // ارسال ردیف به ردیف به دیتابیس
  for (const item of updates) {
    if (item.key === 'scholarshipsList') {
      try {
        await syncScholarshipsList(item.value, item.deletedIds || []);
      } catch (err) {
        console.error('خطا در همگام‌سازی لیست بورسیه‌ها با دیتابیس:', err);
        // پیام واقعی Supabase (مثلاً «ستون X در جدول یافت نشد») هم در alert
        // نشان داده می‌شود تا خطا بدون نیاز به باز کردن Console قابل تشخیص باشد.
        failedKeys.push(`scholarshipsList — ${describeSupabaseError(err)}`);
      }
      continue;
    }

    try {
      // === رفع باگ: نوشتن همیشه با JSON.stringify ===
      // چون ستون value از نوع text است، اکنون هر مقدار (رشته، عدد،
      // آبجکت یا آرایه) قبل از ارسال با JSON.stringify کدگذاری می‌شود
      // تا در سمت خواندن (fetchPortalData) با JSON.parse به همان شکل
      // اصلی بازسازی شود — بدون این کار، فیلدهای آبجکتی/آرایه‌ای
      // (مثلاً homeTestimonial یا aboutPageImages) یا اصلاً ذخیره
      // نمی‌شدند یا به شکل نامعتبر «[object Object]» می‌نشستند.
      const { error } = await supabase
        .from(PORTAL_SETTINGS_TABLE)
        .upsert({ key: item.key, value: JSON.stringify(item.value) }, { onConflict: 'key' });

      if (error) throw error;
    } catch (err) {
      console.error(`خطا در آپدیت کلید ${item.key} در دیتابیس:`, err);
      failedKeys.push(`${item.key} — ${describeSupabaseError(err)}`);
    }
  }

  if (failedKeys.length > 0) {
    throw new Error(
      `ذخیره برخی از تنظیمات در دیتابیس ابری Supabase ناموفق بود:\n${failedKeys.join('\n')}\n\n` +
      'این تغییرات فقط به‌صورت موقت در همین مرورگر ذخیره شدند و برای سایر بازدیدکنندگان پورتال قابل مشاهده نخواهند بود.'
    );
  }
}

/**
 * استخراج خوانا و مفید پیام خطای PostgREST/Supabase (شامل message, details,
 * hint در صورت وجود) تا وقتی چیزی مثل «ستون در schema cache یافت نشد» رخ
 * می‌دهد، خودِ پیام دقیق به ادمین نمایش داده شود، نه فقط یک متن عمومی.
 */
function describeSupabaseError(err) {
  if (!err) return 'خطای نامشخص';
  const parts = [err.message, err.details, err.hint].filter(Boolean);
  return parts.length > 0 ? parts.join(' | ') : 'خطای نامشخص';
}

/**
 * تابع کمکی داخلی: همگام‌سازی لیست بورسیه‌ها با جدول portal_scholarships.
 *
 * === رفع باگ بحرانی: حذف ناخواسته داده ===
 * نسخه‌ی قبلی این تابع، ابتدا id تمام ردیف‌های *موجود در دیتابیس* را
 * می‌خواند و هر ردیفی که در آرایه‌ی محلی scholarshipsList نبود را حذف
 * می‌کرد («دیف کامل لیست در برابر دیتابیس»). این روش خطرناک بود چون
 * AdminDashboard.jsx در هر بار «ذخیره تغییرات» (حتی وقتی فقط شماره تلفن
 * عوض شده بود) همیشه scholarshipsList فعلی‌اش را هم ارسال می‌کرد؛ اگر به
 * هر دلیلی (رقابت زمانی هیدریت‌شدن، خطای شبکه، رفرش ناقص) استیت محلی این
 * لیست کامل/تازه نبود، ذخیره‌ی هر تنظیمات دیگری می‌توانست بورسیه‌های واقعی
 * را از دیتابیس پاک کند — دقیقاً همین اتفاق افتاد (۴ بورسیه واقعی با یک
 * ذخیره‌ی ناقص جایگزین یک ردیف تستی شدند).
 *
 * راه‌حل: دیگر هیچ حذفی بر اساس «مقایسه با دیتابیس» انجام نمی‌شود. حذف فقط
 * برای id هایی اتفاق می‌افتد که صراحتاً و آگاهانه توسط ادمین از طریق دکمه‌ی
 * «حذف» علامت خورده‌اند (deletedIds، که AdminDashboard.jsx آن را جداگانه
 * ردیابی و ارسال می‌کند). یعنی حتی اگر استیت محلی ناقص/قدیمی باشد، هیچ
 * ردیف واقعی‌ای که ادمین آگاهانه حذف نکرده، هرگز پاک نمی‌شود.
 *
 * @param {Array} scholarshipsList آرایه‌ی فعلی بورسیه‌ها (insert/update می‌شوند)
 * @param {Array} deletedIds فقط id هایی که ادمین صراحتاً حذف کرده (delete می‌شوند)
 */
async function syncScholarshipsList(scholarshipsList, deletedIds = []) {
  // الف) حذف فقط همان ردیف‌هایی که صراحتاً توسط ادمین علامت حذف خورده‌اند
  if (deletedIds && deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(PORTAL_SCHOLARSHIPS_TABLE)
      .delete()
      .in('id', deletedIds);

    if (deleteError) throw deleteError;
  }

  // ب) درج ردیف‌های جدید و به‌روزرسانی ردیف‌های موجود در لیست فعلی
  if (scholarshipsList && scholarshipsList.length > 0) {
    const { error: upsertError } = await supabase
      .from(PORTAL_SCHOLARSHIPS_TABLE)
      .upsert(scholarshipsList, { onConflict: 'id' });

    if (upsertError) throw upsertError;
  }
}

/**
 * ۴. ارسال فرم‌های ثبت‌نام با سیستم قرنطینه آفلاین (Offline Queue)
 * (بدون تغییر منطقی — صف آفلاین دقیقاً مثل قبل حفظ شده؛ فقط نام جدول
 * از ثابت متمرکز خوانده می‌شود)
 *
 * === اضافه‌شده: ضدهرزنامه + اعتبارسنجی ورودی ===
 * چون این پروژه بک‌اند اختصاصی ندارد (مستقیماً از مرورگر به Supabase
 * insert می‌شود)، این لایه‌ها سمت کلاینت اضافه شدند. مهم: این‌ها یک
 * بات مصمم را ۱۰۰٪ متوقف نمی‌کنند (چون قابل دور زدن با درخواست مستقیم
 * به API هستند)، ولی جلوی اکثریت بات‌های ساده/فرم‌ساز خودکار و
 * ارسال‌های تصادفی/تکراری را می‌گیرند. برای محافظت واقعی سمت سرور،
 * باید یک Supabase Edge Function یا RLS policy مبتنی بر rate-limit
 * اضافه شود (خارج از دامنه یک پروژه فقط-کلاینت).
 *
 *   الف) هانی‌پات: فیلد مخفی `honeypot` که فقط بات‌های خودکار پر می‌کنند.
 *        اگر پر باشد، به‌جای رد کردن آشکار (که به بات لو می‌دهد)، یک
 *        موفقیت ساختگی برگردانده می‌شود و هیچ ردیفی درج نمی‌شود.
 *   ب)  تله زمانی: `formLoadedAt` (زمان mount شدن فرم) با زمان ارسال
 *       مقایسه می‌شود؛ ارسال در کمتر از ۳ ثانیه پس از باز شدن فرم، رفتار
 *       غیرانسانی در نظر گرفته می‌شود (همان رفتار «موفقیت ساختگی»).
 *   ج)  محدودیت نرخ سمت کلاینت: حداکثر یک ارسال موفق برای هر «نوع» فرم
 *       در هر ۲۰ ثانیه از همان مرورگر (بر اساس localStorage).
 *   د)  اعتبارسنجی/پاک‌سازی: نام اجباری. شماره تماس هم اجباری و با محدودیت
 *       طول است؛ باید عمدتاً عددی باشد (بعد از تبدیل ارقام فارسی) — به‌جز
 *       انواع درخواستی که در CONTACT_ALLOWS_EMAIL_REQUEST_TYPES هستند
 *       (فعلاً فقط «درخواست همکاری»)، که یک ایمیل معتبر هم به‌جای شماره
 *       پذیرفته می‌شود، دقیقاً همان‌طور که برچسب آن فرم («شماره تماس یا
 *       ایمیل») وعده می‌دهد. خطاها با پیام فارسی throw می‌شوند تا فرم‌ها
 *       (که همین پیام را alert می‌کنند) بدون تغییر بمانند.
 */
const RATE_LIMIT_MS = 20000;
const MIN_HUMAN_FILL_MS = 3000;
const MAX_NAME_LENGTH = 80;
const MAX_PHONE_LENGTH = 20;
// ایمیل معمولاً از ۲۰ کاراکتر بلندتر است؛ اگر همان محدودیت شماره تماس روی
// آن اعمال می‌شد، ایمیل‌های واقعی قبل از ذخیره ناقص/نامعتبر بریده می‌شدند.
const MAX_EMAIL_LENGTH = 100;
const MAX_SUMMARY_LENGTH = 300;

function toEnglishDigitsShared(value) {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  return (value ?? '').toString().replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
}

// === رفع باگ: فرم «درخواست همکاری» می‌گفت «شماره تماس یا ایمیل» ولی این
// تابع همیشه فقط اعتبارسنجی شماره تلفن انجام می‌داد؛ اگر کسی ایمیل وارد
// می‌کرد (که هیچ ۸ رقم پشت‌سرهم ندارد)، همیشه رد می‌شد. isEmailContact یک
// تشخیص ساده و کافی برای این مورد است (نه اعتبارسنجی کامل RFC ایمیل).
export function isEmailContact(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? '').toString().trim());
}

// انواع درخواستی که فیلد «تماس» آن‌ها صراحتاً هم شماره و هم ایمیل را
// می‌پذیرد (دقیقاً مطابق برچسب فرم مربوطه).
// === به‌روزرسانی (رفع باگ گزارش‌شده) ===
// قبلاً فقط «درخواست همکاری» (AboutUsPage.jsx) این قابلیت را داشت. طبق
// درخواست صریح کاربر، فرم «مشاوره تحصیلی» (AcademicServicesPage.jsx →
// type: 'consultation') و فرم «ارزیابی بورسیه» (ActiveScholarshipsPage.jsx
// → type: 'scholarship-consulting') هم اکنون به همین لیست اضافه شدند تا
// کاربر بتواند به‌جای شماره تماس، یک ایمیل معتبر وارد کند. «ثبت‌نام سالن»
// (type: 'lounge') عمداً از این لیست خارج ماند، چون آن فرم هیچ‌وقت چنین
// درخواستی نداشت.
const CONTACT_ALLOWS_EMAIL_REQUEST_TYPES = new Set([
  'cooperation_request',
  'consultation',
  'scholarship-consulting',
]);

// حذف تگ‌های HTML/اسکریپت از ورودی متنی آزاد (نام، خلاصه). چون React خودش
// در رندر escape می‌کند این یک لایه دفاع‌درعمق اضافه است، نه تنها خط دفاعی.
function stripHtml(value) {
  return (value ?? '').toString().replace(/<[^>]*>/g, '').trim();
}

function isRateLimited(type) {
  try {
    const key = `portal_last_submit_${type || 'generic'}`;
    const last = Number(localStorage.getItem(key) || 0);
    return Date.now() - last < RATE_LIMIT_MS;
  } catch {
    return false;
  }
}

function markSubmitted(type) {
  try {
    localStorage.setItem(`portal_last_submit_${type || 'generic'}`, String(Date.now()));
  } catch {
    // localStorage در دسترس نیست (مثلاً حالت خصوصی مرورگر)؛ بی‌خطر نادیده گرفته می‌شود
  }
}

// انواع درخواست‌هایی که فرمشان اصلاً فیلد تلفن ندارد (مثل ثبت دستاورد محصل،
// که هدفش انتشار داستان موفقیت است، نه تماسِ بازگشتی) — برای این‌ها شماره
// تماس اختیاری است. برای بقیه (مشاوره، ثبت‌نام سالن، همکاری) که تماس
// بازگشتی ضروری است، همچنان الزامی می‌ماند.
const PHONE_OPTIONAL_REQUEST_TYPES = new Set(['achievement_submission']);

export async function submitPortalRequest(payload) {
  const name = stripHtml(payload.name).slice(0, MAX_NAME_LENGTH);
  const rawContact = (payload.phone ?? '').toString().trim();
  const phoneDigitsOnly = toEnglishDigitsShared(payload.phone).replace(/[^\d+]/g, '');
  const summary = stripHtml(payload.summary).slice(0, MAX_SUMMARY_LENGTH);
  const isPhoneOptional = PHONE_OPTIONAL_REQUEST_TYPES.has(payload.type);
  const allowsEmailContact = CONTACT_ALLOWS_EMAIL_REQUEST_TYPES.has(payload.type);
  const contactIsEmail = allowsEmailContact && isEmailContact(rawContact);
  const maxContactLength = contactIsEmail ? MAX_EMAIL_LENGTH : MAX_PHONE_LENGTH;

  if (!name) {
    throw new Error('لطفاً نام و نام خانوادگی را وارد کنید.');
  }
  // اگر این نوع درخواست ایمیل را هم به‌جای شماره تماس می‌پذیرد و کاربر یک
  // ایمیل معتبر وارد کرده، دیگر نیازی به عبور از اعتبارسنجی شماره تلفن نیست.
  if (!contactIsEmail) {
    if (!isPhoneOptional) {
      const phoneInvalid =
        !phoneDigitsOnly || phoneDigitsOnly.replace(/\D/g, '').length < 8 || phoneDigitsOnly.length > MAX_PHONE_LENGTH;
      if (phoneInvalid) {
        throw new Error(
          allowsEmailContact
            ? 'لطفاً یک شماره تماس معتبر یا یک ایمیل معتبر وارد کنید.'
            : 'لطفاً یک شماره تماس معتبر وارد کنید.'
        );
      }
    } else if (phoneDigitsOnly && (phoneDigitsOnly.replace(/\D/g, '').length < 8 || phoneDigitsOnly.length > MAX_PHONE_LENGTH)) {
      // اگرچه اختیاری است، اگر خودِ کاربر چیزی وارد کرده، همان چیز باید معتبر باشد
      throw new Error('شماره تماس واردشده معتبر نیست.');
    }
  }
  if (isRateLimited(payload.type)) {
    throw new Error('یک درخواست مشابه به‌تازگی ارسال شده. لطفاً کمی صبر کنید و دوباره تلاش کنید.');
  }

  // === تشخیص بات (بدون اطلاع‌رسانی آشکار به فرستنده) ===
  const isHoneypotFilled = Boolean(payload.honeypot);
  const isTooFast =
    typeof payload.formLoadedAt === 'number' && Date.now() - payload.formLoadedAt < MIN_HUMAN_FILL_MS;

  if (isHoneypotFilled || isTooFast) {
    // موفقیت ساختگی: هیچ ردیفی درج نمی‌شود ولی فرستنده (احتمالاً بات) متوجه رد شدن نمی‌شود
    return { success: true, status: 'sent' };
  }

  const requestData = {
    id: payload.id || crypto.randomUUID(),
    type: payload.type,
    name,
    phone: payload.phone ? rawContact.slice(0, maxContactLength) : '',
    details: payload.details || {},
    summary,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // چک کردن اتصال اینترنت مرورگر
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    queueOfflineRequest(requestData);
    markSubmitted(payload.type);
    return { success: false, status: 'queued', message: "آفلاین هستید. فرم شما در حافظه ذخیره شد و پس از اتصال اینترنت ارسال می‌شود." };
  }

  try {
    const { error } = await supabase
      .from(PORTAL_REQUESTS_TABLE)
      .insert([requestData]);

    if (error) throw error;
    markSubmitted(payload.type);
    return { success: true, status: 'sent' };
  } catch (e) {
    console.warn("خطا در شبکه. فرم به صف آفلاین منتقل شد:", e);
    queueOfflineRequest(requestData);
    markSubmitted(payload.type);
    return { success: false, status: 'queued', message: "خطا در ارسال. فرم در صف ذخیره شد تا خودکار همگام‌سازی شود." };
  }
}

/**
 * تابع کمکی برای ذخیره درخواست‌ها در صف آفلاین localStorage
 */
function queueOfflineRequest(requestData) {
  try {
    const queue = JSON.parse(localStorage.getItem(PENDING_QUEUE_KEY) || '[]');
    if (!queue.some(item => item.id === requestData.id)) {
      queue.push(requestData);
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (err) {
    console.error("خطا در ذخیره در صف آفلاین:", err);
  }
}

/**
 * ۵. همگام‌سازی خودکار صف آفلاین به محض متصل شدن اینترنت
 * (بدون تغییر منطقی)
 */
export async function syncOfflineQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  try {
    const queue = JSON.parse(localStorage.getItem(PENDING_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    console.log("اینترنت متصل شد. در حال ارسال فرم‌های ذخیره شده در صف...");
    const remaining = [];

    for (const req of queue) {
      try {
        const { error } = await supabase
          .from(PORTAL_REQUESTS_TABLE)
          .insert([req]);

        if (error) throw error;
      } catch (e) {
        console.error(`همگام‌سازی برای درخواست شماره ${req.id} ناموفق بود:`, e);
        remaining.push(req);
      }
    }

    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remaining));
    console.log("عملیات همگام‌سازی پایان یافت.");
  } catch (err) {
    console.error("خطا در همگام‌سازی صف آفلاین:", err);
  }
}

// ثبت رویدادهای وضعیت شبکه مرورگر برای همگام‌سازی خودکار
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineQueue);
  if (navigator.onLine) {
    syncOfflineQueue();
  }
}
