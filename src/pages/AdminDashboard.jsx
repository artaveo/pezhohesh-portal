import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { updatePortalSettings, getLocalPortalData, fetchPortalData, isEmailContact } from '../services/portalService';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAdminData } from '../contexts/AdminDataContext';
import { COUNTRIES, getFlagEmoji, getCountryLabel } from '../data/countries';
import ImageUploader from '../components/ImageUploader';
import { SEED_ELITE_DATA } from './AchievementsPage';
import { SEED_HALL_RULES, SEED_HALL_FAQ } from '../components/HallRules';
import { SEED_SERVICES_FAQ } from './AcademicServicesPage';

// === تعریف ثابت گروه‌بندی‌شده جایگاه‌های تصویر صفحه درباره ما ===
// این ساختار فقط برای رندر UI پنل ادمین استفاده می‌شود (دسته‌بندی زیر
// زیرعنوان‌های مطابق با بخش‌های واقعی AboutUsPage.jsx). مقدار نهایی که
// در portalData ذخیره می‌شود همان آرایه تخت aboutPageImages (۴۰ آبجکت
// { key, label, url }) است.
//
// === رفع باگ گزارش‌شده: «فقط ۳ عکس، بدون مشخص کردن کدوم عکس مال کجاست» ===
// دو مشکل جدا بود که هر دو اینجا رفع شد:
//  ۱) چند بخش واقعی صفحه (نمایشگاه امید با ۸ عکس، مخاطبان با ۴ کارت، نگاه
//     کلی با ۴ عکس، مأموریت با ۴ عکس، همکاری با ۳ عکس) در AboutUsPage.jsx
//     از قبل کاملاً وصل بودند (abt('hope-4') و مشابه‌ها) ولی پنل ادمین
//     اصلاً برایشان جایگاهی نداشت — یعنی این عکس‌ها همیشه placeholder
//     می‌ماندند، نه به این خاطر که چیزی خراب بود، بلکه چون اصلاً راهی برای
//     آپلودشان وجود نداشت. حالا اضافه شدند.
//  ۲) برچسب‌های قبلی («تصویر ۱»، «تصویر ۲»، «تصویر ۳») نمی‌گفتند این عکس
//     دقیقاً کجای صفحه دیده می‌شود. حالا هرجا صفحه یک عنوان/کپشن واقعی برای
//     آن تصویر دارد (مثلاً کپشن‌های نمایشگاه امید، یا عنوان کارت‌های
//     همکاری/مأموریت)، همان متن دقیق به‌عنوان برچسب استفاده شده — دیگر حدس
//     زدن لازم نیست. جاهایی که صفحه فقط «بزرگ/دوم/سوم» دارد (موزاییک‌های
//     دختران/کانکور/کتابخانه/فعالیت‌ها)، برچسب همین نقش را صریح می‌گوید.
//
// === سه کلید که عمداً از این پنل حذف شدند (نه اضافه) ===
// در بررسی مشخص شد این سه کلید در پنل قبلی وجود داشتند ولی هیچ‌جای
// AboutUsPage.jsx به آن‌ها اشاره نمی‌کرد — یعنی آپلود در آن‌ها هم دقیقاً
// همان باگ «آپلود می‌کنم ولی هیچی تغییر نمی‌کند» را داشت:
//   intro      — هیچ تصویر اختصاصی برای «معرفی پژوهش در یک نگاه» در چیدمان فعلی نیست
//   story-3    — «داستان ما» فقط ۲ فصل مستند دارد (پیش از ۱۴۰۱ / ۱۴۰۱)، فصل سومی ساخته نشد
//   cooperation — بخش «همکاری» فقط ۳ عکس partner-1..3 دارد، کاور مستقل ندارد
// اگر بعداً خواستید هرکدام واقعاً به صفحه اضافه شوند، باید هم‌زمان هم اینجا
// کلید برگردد هم AboutUsPage.jsx یک <ImgTag>/<ImageFrame> واقعی برایش
// بگیرد — نه فقط یکی از این دو طرف، که دوباره همین باگ را می‌سازد.
const ABOUT_IMAGE_GROUPS = [
  {
    title: 'هیرو',
    items: [
      { key: 'hero', label: 'تصویر پس‌زمینه هیرو (بالای صفحه، پشت عنوان اصلی)' }
    ]
  },
  {
    title: 'نگاه کلی (بنتوی ۴ عکس)',
    items: [
      { key: 'glance-1', label: 'نگاه کلی - عکس بزرگ («سالن اصلی — ۲۷۰ متر مربع»)' },
      { key: 'glance-2', label: 'نگاه کلی - عکس کوچک دوم («ورودی مجموعه پژوهش»)' },
      { key: 'glance-3', label: 'نگاه کلی - عکس کوچک سوم («کتاب‌ها و منابع مطالعه»)' },
      { key: 'glance-4', label: 'نگاه کلی - عکس عریض چهارم («فضای مطالعه و مشاوره»)' }
    ]
  },
  {
    title: 'داستان شکل‌گیری (۲ فصل)',
    items: [
      { key: 'story-1', label: 'داستان - فصل اول («پیش از ۱۴۰۱: یک قلیان‌خانه در همین مکان»)' },
      { key: 'story-2', label: 'داستان - فصل دوم («۱۴۰۱: از قلیان‌خانه تا خانه امید»)' }
    ]
  },
  {
    title: 'مأموریت، چشم‌انداز و ارزش‌ها',
    items: [
      { key: 'values-wide', label: 'مأموریت - بنر پس‌زمینه بزرگ بالای این بخش' },
      { key: 'values-1', label: 'مأموریت - کارت «🎯 مأموریت»' },
      { key: 'values-2', label: 'مأموریت - کارت «👁️ چشم‌انداز»' },
      { key: 'values-3', label: 'مأموریت - کارت «💎 ارزش‌های اصلی»' }
    ]
  },
  {
    title: 'مخاطبان و استفاده‌کنندگان (۴ کارت)',
    items: [
      { key: 'audience-1', label: 'مخاطبان - کارت «داوطلبان کانکور»' },
      { key: 'audience-2', label: 'مخاطبان - کارت «محصلین دانشگاه‌ها»' },
      { key: 'audience-3', label: 'مخاطبان - کارت «زبان‌آموزان»' },
      { key: 'audience-4', label: 'مخاطبان - کارت «شاگردان مکاتب»' }
    ]
  },
  {
    title: 'ادامه یادگیری در روزهای دشوار (دختران)',
    items: [
      { key: 'girls-1', label: 'دختران - عکس بزرگ عمودی (اصلی)' },
      { key: 'girls-2', label: 'دختران - عکس کوچک دوم' },
      { key: 'girls-3', label: 'دختران - عکس کوچک سوم' }
    ]
  },
  {
    title: 'آمادگی کانکور و مطالعه منظم',
    items: [
      { key: 'exam-1', label: 'آمادگی کانکور - عکس بزرگ عمودی (اصلی)' },
      { key: 'exam-2', label: 'آمادگی کانکور - عکس کوچک دوم' },
      { key: 'exam-3', label: 'آمادگی کانکور - عکس کوچک سوم' }
    ]
  },
  {
    title: 'کتابخانه و منابع مطالعه',
    items: [
      { key: 'library-1', label: 'کتابخانه - عکس بزرگ عمودی (اصلی)' },
      { key: 'library-2', label: 'کتابخانه - عکس کوچک دوم' },
      { key: 'library-3', label: 'کتابخانه - عکس کوچک سوم' }
    ]
  },
  {
    title: 'نمایشگاه امید (۸ عکس)',
    items: [
      { key: 'hope-1', label: 'نمایشگاه امید - کاور بزرگ («نمایشگاه سه‌روزه امید»)' },
      { key: 'hope-2', label: 'نمایشگاه امید - «روزهای سال نو»' },
      { key: 'hope-3', label: 'نمایشگاه امید - «همکاری اعضای پژوهش»' },
      { key: 'hope-4', label: 'نمایشگاه امید - «دیزاین و آماده‌سازی سالن»' },
      { key: 'hope-5', label: 'نمایشگاه امید - «روز اول نمایشگاه»' },
      { key: 'hope-6', label: 'نمایشگاه امید - «روز دوم نمایشگاه»' },
      { key: 'hope-7', label: 'نمایشگاه امید - «روز سوم و پایانی»' },
      { key: 'hope-8', label: 'نمایشگاه امید - «روحیه و انگیزه جوانان»' }
    ]
  },
  {
    title: 'فعالیت‌های انجام‌شده',
    items: [
      { key: 'activities-1', label: 'فعالیت‌ها - عکس بزرگ عمودی (اصلی)' },
      { key: 'activities-2', label: 'فعالیت‌ها - عکس کوچک دوم' },
      { key: 'activities-3', label: 'فعالیت‌ها - عکس کوچک سوم' }
    ]
  },
  {
    title: 'چالش‌های اصلی و پیام بنیان‌گذار',
    items: [
      { key: 'challenges', label: 'چالش‌های اصلی پژوهش (عکس تکی کنار متن)' },
      { key: 'founder', label: 'پیام بنیان‌گذار (عکس کنار نقل‌قول)' }
    ]
  },
  {
    title: 'همکاری (۳ کارت گروه همکار)',
    items: [
      { key: 'partner-1', label: 'همکاری - کارت «نهادها و سازمان‌ها»' },
      { key: 'partner-2', label: 'همکاری - کارت «افراد خیر و حامیان»' },
      { key: 'partner-3', label: 'همکاری - کارت «استادان و فعالان فرهنگی»' }
    ]
  }
];

const DEFAULT_ABOUT_IMAGES = ABOUT_IMAGE_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ key: item.key, label: item.label, url: '/about-placeholder.jpg' }))
);

// === فاز ۲ دور سوم دیباگ: منوی ۷گانه کشویی (فقط ظاهر/چیدمان) ===
// این آرایه صرفاً فهرست آیتم‌های منوی کشویی ناوبری جدید است؛ هیچ داده یا
// کلید ذخیره‌سازی به آن مرتبط نیست. activePage (در کامپوننت اصلی) فقط
// تعیین می‌کند کدام بخش موجود از فرم فعلی نمایش داده شود (رندر شرطی روی
// همان بلوک‌های فعلی)؛ خودِ فیلدها/state ها دقیقاً همان‌هایی هستند که بودند.
const NAV_ITEMS = [
  { key: 'general', icon: '📢', label: 'عمومی و پیام‌های مراجعین' },
  { key: 'home', icon: '🏠', label: 'صفحه اصلی' },
  { key: 'lounge', icon: '📖', label: 'سالن مطالعه' },
  { key: 'services', icon: '🎓', label: 'خدمات تحصیلی' },
  { key: 'scholarships', icon: '🎓📄', label: 'بورسیه‌های فعال' },
  { key: 'achievements', icon: '🏆', label: 'دستاوردها' },
  { key: 'about', icon: '🖼️', label: 'درباره ما' },
];

// === فاز ۲ دور سوم دیباگ: کار ۱ — گروه‌بندی درختی درخواست‌های صفحه «عمومی» ===
// فقط تعیین می‌کند هر درخواست بر اساس form.type زیر کدام زیرگروه نمایشی
// (تزئینی) قرار بگیرد؛ هیچ فیلتر/state ذخیره‌سازی موجودی (مثل
// generalPendingForms) تغییر نمی‌کند، این فقط یک لایه‌ی نمایشی اضافه روی
// همان آرایه‌های موجود است.
const REQUEST_SUBGROUPS = [
  { key: 'lounge', icon: '📖', title: 'مربوط به سالن مطالعه', match: (t) => t === 'lounge' },
  { key: 'services', icon: '🎓', title: 'مربوط به خدمات تحصیلی/بورسیه', match: (t) => t === 'consultation' || t === 'scholarship-consulting' },
  { key: 'achievement', icon: '🏆', title: 'ثبت دستاورد', match: (t) => t === 'achievement_submission' },
  { key: 'cooperation', icon: '🤝', title: 'درخواست همکاری (درباره ما)', match: (t) => t === 'cooperation_request' },
];

// === فاز ۲ دور سوم دیباگ: کار ۳ — برچسب اندازه دقیق کنار هر ImageUploader ===
// فقط یک رشته‌ی راهنمای متنی کوچک برمی‌گرداند؛ به هیچ state یا کلید
// Supabase مرتبط نیست.
function SizeHint({ text }) {
  if (!text) return null;
  return (
    <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '5px', fontWeight: '500' }}>
      📐 اندازه پیشنهادی: {text}
    </span>
  );
}

// نگاشت هر جایگاه تصویر صفحه «درباره ما» به اندازه‌ی پیکسلی پیشنهادی —
// بر اساس کلاس CSS واقعی مصرف‌کننده‌اش در AboutUsPage.jsx (ImageMosaic،
// ImageFrame، یا کلاس‌های اختصاصی هر بخش).
const ABOUT_IMAGE_SIZE_HINTS = {
  hero: 'حداقل ۱۹۲۰×۱۰۸۰، افقی عریض (۱۶:۹)',
  'glance-1': 'حداقل ۱۴۰۰×۱۴۰۰، تقریباً مربع (کاشی بزرگ)',
  'glance-2': 'حداقل ۱۰۰۰×۶۰۰، افقی',
  'glance-3': 'حداقل ۱۰۰۰×۶۰۰، افقی',
  'glance-4': 'حداقل ۱۶۰۰×۶۰۰، افقی عریض',
  'story-1': 'حداقل ۱۰۰۰×۷۰۰، افقی',
  'story-2': 'حداقل ۱۰۰۰×۷۰۰، افقی',
  'values-wide': 'حداقل ۱۹۲۰×۸۰۰، افقی عریض (بنر)',
  'values-1': 'حداقل ۹۰۰×۶۰۰، افقی',
  'values-2': 'حداقل ۹۰۰×۶۰۰، افقی',
  'values-3': 'حداقل ۹۰۰×۶۰۰، افقی',
  'audience-1': 'حداقل ۸۰۰×۱۰۰۰، عمودی',
  'audience-2': 'حداقل ۸۰۰×۱۰۰۰، عمودی',
  'audience-3': 'حداقل ۸۰۰×۱۰۰۰، عمودی',
  'audience-4': 'حداقل ۸۰۰×۱۰۰۰، عمودی',
  'girls-1': 'حداقل ۹۰۰×۱۲۰۰، عمودی (۳:۴)',
  'girls-2': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'girls-3': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'exam-1': 'حداقل ۹۰۰×۱۲۰۰، عمودی (۳:۴)',
  'exam-2': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'exam-3': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'library-1': 'حداقل ۹۰۰×۱۲۰۰، عمودی (۳:۴)',
  'library-2': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'library-3': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'hope-1': 'حداقل ۲۱۰۰×۸۰۰، افقی خیلی عریض (سینمایی)',
  'hope-2': 'حداقل ۱۰۰۰×۱۰۰۰، مربع',
  'hope-3': 'حداقل ۹۰۰×۱۲۰۰، عمودی (۳:۴)',
  'hope-4': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'hope-5': 'حداقل ۸۰۰×۱۰۰۰، عمودی (۴:۵)',
  'hope-6': 'حداقل ۱۰۰۰×۸۰۰، افقی (۵:۴)',
  'hope-7': 'حداقل ۹۰۰×۱۲۰۰، عمودی (۳:۴)',
  'hope-8': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'activities-1': 'حداقل ۹۰۰×۱۲۰۰، عمودی (۳:۴)',
  'activities-2': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  'activities-3': 'حداقل ۱۲۸۰×۷۲۰، افقی (۱۶:۹)',
  challenges: 'حداقل ۱۰۰۰×۷۵۰، افقی (۴:۳)',
  founder: 'حداقل ۸۰۰×۱۰۰۰، عمودی',
  'partner-1': 'حداقل ۱۰۰۰×۶۰۰، افقی',
  'partner-2': 'حداقل ۱۰۰۰×۶۰۰، افقی',
  'partner-3': 'حداقل ۱۰۰۰×۶۰۰، افقی',
};

// === فاز ۲ دور سوم دیباگ: کار ۱ — یک زیرگروه قابل‌جمع‌شدن (بسته پیش‌فرض) ===
// کاملاً تزئینی/چیدمانی؛ children همان آیتم‌هایی است که از قبل رندر
// می‌شدند، فقط داخل یک آکاردئون بسته‌شونده قرار می‌گیرند.
function RequestSubgroup({ icon, title, count, isOpen, onToggle, children }) {
  return (
    <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          border: 'none',
          borderBottom: isOpen ? '1px solid #e9ecef' : 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: '800',
          fontSize: '13px',
          color: '#112a1d',
        }}
      >
        <span>{icon} {title} ({count})</span>
        <span style={{ fontSize: '11px', color: '#666' }}>{isOpen ? '▲ بستن' : '▼ نمایش'}</span>
      </button>
      {isOpen && (
        <div style={{ padding: count > 0 ? '14px 16px' : '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {count > 0 ? children : (
            <p style={{ fontSize: '12.5px', color: '#999', textAlign: 'center', margin: '14px 0' }}>موردی در این زیرگروه نیست.</p>
          )}
        </div>
      )}
    </div>
  );
}

// === تبدیل شماره تماس محلی افغانستان به فرمت بین‌المللی wa.me ===
// ورودی می‌تواند با یا بدون صفر ابتدایی، با ارقام فارسی/انگلیسی یا با
// فاصله/خط‌تیره باشد؛ خروجی همیشه رشته‌ای فقط عددی با پیش‌شماره ۹۳ است.
function toEnglishDigits(value) {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  return (value || '').toString().replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
}

function formatWhatsappNumber(phone) {
  const digitsOnly = toEnglishDigits(phone).replace(/\D/g, '');
  if (!digitsOnly) return '';
  if (digitsOnly.startsWith('93')) return digitsOnly;
  if (digitsOnly.startsWith('0')) return `93${digitsOnly.slice(1)}`;
  return `93${digitsOnly}`;
}

function openWhatsapp(phone) {
  const formatted = formatWhatsappNumber(phone);
  if (!formatted) {
    alert('شماره تماس این درخواست نامعتبر است.');
    return;
  }
  window.open(`https://wa.me/${formatted}`, '_blank', 'noopener,noreferrer');
}

// === رفع درخواست: باز شدن جیمیل، نه هر برنامه پیش‌فرض ایمیل سیستم‌عامل ===
// mailto: هرچه را که مرورگر/سیستم‌عامل به‌عنوان برنامه پیش‌فرض ایمیل تنظیم
// کرده باز می‌کند (که می‌تواند خالی از نتیجه باشد اگر چیزی تنظیم نشده)، نه
// لزوماً جیمیل. اکنون مستقیماً پنجره‌ی «نوشتن ایمیل جدید» جیمیل در وب باز
// می‌شود — دقیقاً همان الگوی window.open که برای واتساپ استفاده شده.
function openEmailContact(email, subjectContext) {
  if (!isEmailContact(email)) {
    alert('ایمیل این درخواست نامعتبر است.');
    return;
  }
  const subject = subjectContext ? `پاسخ به ${subjectContext} — مجتمع پژوهش` : 'پاسخ از مجتمع پژوهش';
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}`;
  window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');
}

// === برچسب دقیق نوع هر درخواست معلق ===
// قبلاً این برچسب فقط بین «lounge» و همه‌چیز دیگر («درخواست مشاوره») فرق
// می‌گذاشت؛ یعنی «ثبت دستاورد» و «درخواست همکاری» هر دو به‌اشتباه «درخواست
// مشاوره» نشان داده می‌شدند و ادمین نمی‌توانست از روی همین برچسب تشخیص دهد
// کدام دکمه (ایمیل/واتساپ/انتشار) برایش معنی دارد.
const REQUEST_TYPE_LABELS = {
  lounge: 'ثبت‌نام سالن',
  achievement_submission: 'ثبت دستاورد',
  cooperation_request: 'درخواست همکاری',
  'scholarship-consulting': 'ارزیابی دوسیه بورسیه',
  consultation: 'مشاوره تحصیلی',
};
function getRequestTypeLabel(type) {
  return REQUEST_TYPE_LABELS[type] || 'درخواست مشاوره';
}

// نگاشت مقدار «دپارتمان» فرم ثبت دستاورد (AchievementsPage.jsx) به یک
// برچسب کوتاه مناسب برای فیلد «برچسب‌ها»ی تالار افتخارات.
const DEPARTMENT_TAG_LABELS = {
  lounge: 'سالن مطالعه',
  consulting: 'مشاوره',
  both: 'سالن مطالعه, مشاوره',
};

// === اضافه (بخش ۱۸): برچسب فارسی نوع دستاورد، برای نمایش خوانا در پنل ===
const ACHIEVEMENT_TYPE_LABELS = {
  konkur: 'قبولی و کامیاب شدن در کانکور سراسری',
  scholarship: 'اخذ پذیرش یا بورسیه تحصیلی خارجی',
  progress: 'ارتقای چشمگیر معدل مکتب یا سمستر دانشگاه',
  other: 'سایر افتخارات و رقابت‌های علمی',
};

// === اضافه (بخش ۱۸): استایل یکپارچه و خواناتر برای همه‌ی بج‌های کوچک نوع/وضعیت ===
// بازخورد کاربر: متن این بج‌های خیلی کوچک (۱۰.۵–۱۱px، وزن ۷۰۰) و متن
// بلافاصله‌ی کناری‌شان (مثلاً نام مراجع) گاهی طوری رندر می‌شد که انگار
// حرف اول/آخر کلمه بریده شده. علت دقیق آن ترکیبی از سه عامل است: فونت
// بسیار کوچک + وزن خیلی ضخیم برای اسکریپت فارسی (که در این اندازه به
// سختی hinting می‌شود) + فاصله‌ی خیلی کم بین بج و متن مجاورش. راه‌حل:
// اندازه‌ی کمی بزرگ‌تر (۱۲px)، وزن نیمه‌ضخیم به‌جای تمام‌ضخیم (۶۰۰ به‌جای
// ۷۰۰)، fontFamily صریح (نه صرفاً inherit)، و فاصله‌ی بیشتر تا متن مجاور.
function typeBadgeStyle(backgroundColor, color, extra = {}) {
  return {
    display: 'inline-block',
    fontSize: '12px',
    lineHeight: '1.7',
    fontWeight: '600',
    fontFamily: "'Vazirmatn', sans-serif",
    backgroundColor,
    color,
    padding: '3px 10px',
    borderRadius: '5px',
    marginLeft: '10px',
    whiteSpace: 'nowrap',
    ...extra,
  };
}

// === اضافه (بخش ۱۸): تجزیه‌ی details هر درخواست به خط‌های خوانای فارسی ===
// قبلاً پنل ادمین برای اکثر انواع درخواست فقط «نام + یک خط summary» نشان
// می‌داد (و آن summary هم گاهی مقدار خام فرم مثل «kanoor» یا «bachelor»
// بود، نه برچسب فارسی‌اش). این تابع، مستقل از این‌که درخواست در صف عمومی
// باشد یا در بخش اختصاصی خدمات تحصیلی، همان یک منبع واحد حقیقت است که
// تمام فیلدهای واقعی فرم را با برچسب فارسی کامل برمی‌گرداند — یعنی هر دو
// لیست (صف عمومی و صف خدمات تحصیلی) از این پس دقیقاً یک‌جور و به همان
// اندازه دقیق، اطلاعات کامل فرم را نشان می‌دهند.
function getRequestDetailLines(form) {
  const d = form.details || {};
  switch (form.type) {
    case 'consultation':
      return [
        { icon: '🏫', label: 'مقطع/صنف', value: d.gradeLabel || d.grade },
        { icon: '🎯', label: 'هدف تحصیلی', value: d.goalLabel || d.goal },
        { icon: '⚠️', label: 'چالش اصلی', value: d.mainIssueLabel || d.mainIssue },
        { icon: '🕐', label: 'زمان تماس مناسب', value: d.callTimeLabel || d.callTime },
      ];
    case 'scholarship-consulting':
      return [
        { icon: '🎓', label: 'مقطع مورد نظر', value: d.degreeLabel || d.degree },
        { icon: '📄', label: 'بورسیه مورد نظر', value: d.scholarshipTitle || 'مشخص نشده' },
        // === اضافه (رفع باگ گزارش‌شده): فیلد سن فرم ===
        { icon: '🎂', label: 'سن', value: d.age && d.age !== 'نامشخص' ? d.age : null },
      ];
    case 'lounge':
      return [
        { icon: '🚻', label: 'بخش', value: d.gender === 'female' ? 'اختصاصی بانوان' : 'اختصاصی آقایان' },
        { icon: '🗓️', label: 'نوع عضویت', value: d.planType === 'monthly' ? 'عضویت ماهانه' : 'عضویت روزانه' },
        { icon: '🆕', label: 'محصل جدید؟', value: d.isNewMember ? 'بله (حق‌الداخله شامل است)' : 'خیر (عضو قبلی)' },
        {
          icon: '📶',
          label: 'اینترنت اضافه',
          value:
            d.internetType === 'unlimited'
              ? 'نامحدود ماهانه'
              : d.internetType === 'gb'
                ? `حجمی — ${d.gbAmount} گیگابایت`
                : 'ندارد',
        },
        { icon: '💰', label: 'مجموع فاکتور', value: d.total != null ? `${d.total} افغانی` : null },
      ];
    case 'cooperation_request':
      return [
        { icon: '🏢', label: 'نوع درخواست‌کننده', value: d.applicantType === 'organization' ? 'نهاد / موسسه / سازمان' : d.applicantType === 'person' ? 'شخص / حامی' : d.applicantType },
        { icon: '👤', label: 'شخص رابط', value: d.contactPerson },
        { icon: '🤝', label: 'زمینه همکاری', value: d.cooperationArea },
        { icon: '💬', label: 'پیام', value: d.message },
      ];
    case 'achievement_submission':
      return [
        { icon: '🏆', label: 'نوع دستاورد', value: ACHIEVEMENT_TYPE_LABELS[d.achievementType] || d.achievementType },
        { icon: '🏛️', label: 'دپارتمان مرتبط', value: DEPARTMENT_TAG_LABELS[d.department] || d.department },
        { icon: '📝', label: 'توضیحات محصل', value: d.achievementDetails },
      ];
    default:
      return [];
  }
}

export default function AdminDashboard() {
  const { logout, currentAdminEmail, setAdminAuthenticated } = useAdminAuth();
  // === رفع باگ گزارش‌شده (بخش ۱۱): تغییرات ذخیره‌شده در سایت زنده دیده نمی‌شوند ===
  // این پنل تا امروز کاملاً مستقل از AdminDataContext/PortalDataContext کار
  // می‌کرد (فقط یک state محلی — adminData/setAdminPortalData — داشت).
  // یعنی وقتی ادمین چیزی ذخیره می‌کرد، فقط همین صفحه‌ی پنل به‌روز می‌شد؛
  // اگر کاربر بدون رفرش کامل مرورگر بین «/admin» و صفحات عمومی (که
  // portalData را از همان Context مشترک با usePortal() می‌خوانند) جابه‌جا
  // می‌شد، صفحات عمومی دیتای قدیمی را نشان می‌دادند تا یک رفرش کامل. اکنون
  // بعد از هر ذخیره‌ی موفق، همان دیتای تازه با setSharedPortalData هم در
  // Context مشترک اعمال می‌شود — بدون نیاز به رفرش صفحه.
  const { setPortalData: setSharedPortalData } = useAdminData();

  // ۱. پیاده‌سازی مستقیم State مدیریت داده‌های تنظیمات پورتال (جایگزین دیتای قدیمی)
  const [adminData, setAdminPortalData] = useState(() => getLocalPortalData());

  // ۱. استیت‌های عمومی و اعلانات متحرک سقف سایت مجتمع پژوهش (۱۰۰٪ فونداسیون فایل ششم)
  const [address, setAddress] = useState(adminData?.globalAddress || 'کابل، ناحیه سیزدهم، ایستگاه سرپل، جوار شفاخانه وطن، مجموعه تحصیلی پژوهش');
  const [announcement, setAnnouncement] = useState(adminData?.announcement || '📢 اطلاعیه زنده: ثبت‌نام دوره جدید بورسیه‌های دولتی چین آغاز شد. جهت کسب اطلاعات به دپارتمان خدمات تحصیلی مراجعه کنید.');
  // === اضافه (رفع باگ گزارش‌شده): تیک روشن/خاموش نوار اعلان ===
  // قبلاً تنها راه «خاموش کردن» نوار اعلان این بود که ادمین متن را کامل
  // پاک کند (چون SiteHeader.jsx فقط وقتی announcementText خالی باشد نواری
  // نشان نمی‌دهد). این باعث می‌شد با هر بار خاموش/روشن کردن، متن قبلی از
  // بین برود. اکنون یک پرچم مستقل (announcementEnabled) این کار را می‌کند؛
  // متن اعلان دست‌نخورده در فیلد خودش باقی می‌ماند، فقط نمایش/عدم‌نمایش آن
  // کنترل می‌شود. پیش‌فرض true است تا رفتار فعلی سایت (که همیشه اعلان را
  // نشان می‌داد) بدون تغییر بماند.
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    adminData?.announcementEnabled !== undefined ? adminData.announcementEnabled : true
  );

  // === تصویر هیروی صفحه اصلی (جدید) ===
  const [mainHeroImage, setMainHeroImage] = useState(adminData?.mainHeroImage || '/hero-main.png');

  // === جدید (بخش ۹): آمار سه‌گانه هیروی صفحه اصلی، از پنل ادمین قابل ویرایش ===
  // قبلاً این سه آمار (اعزام موفق محصلین/ظرفیت فعلی سالن/کشور مقصد) یک
  // آرایه‌ی کاملاً هاردکد داخل Hero.jsx بودند. مقدار «ظرفیت فعلی سالن» با
  // ظرفیت واقعی امروز (+۱۲۰) و «کشور مقصد» از یک عدد ثابت («۴» که با هر
  // بورسیه‌ی جدید منسوخ می‌شد) به «بدون مرز» به‌روزرسانی شد.
  const [heroStat1Number, setHeroStat1Number] = useState(adminData?.heroStat1Number || '+۴۵');
  const [heroStat1Label, setHeroStat1Label] = useState(adminData?.heroStat1Label || 'اعزام موفق محصلین');
  const [heroStat2Number, setHeroStat2Number] = useState(adminData?.heroStat2Number || '+۱۲۰');
  const [heroStat2Label, setHeroStat2Label] = useState(adminData?.heroStat2Label || 'ظرفیت فعلی سالن');
  const [heroStat3Number, setHeroStat3Number] = useState(adminData?.heroStat3Number || 'بدون مرز');
  const [heroStat3Label, setHeroStat3Label] = useState(adminData?.heroStat3Label || 'کشور مقصد');

  // === جدید (بخش ۹): کپشن ساعات کاری زیر تصویر هیروی صفحه اصلی ===
  // قبلاً این کپشن ادعا می‌کرد سالن «۷ روز هفته — ۸ صبح تا ۱۲ شب» باز
  // است که با ساعات کاری واقعی هم‌خوانی نداشت. مقدار پیش‌فرض جدید دقیقاً
  // همان ساعات کاری واقعی سالن (شنبه تا پنج‌شنبه، جدا از جمعه‌ها) است.
  const [heroHoursWeekday, setHeroHoursWeekday] = useState(adminData?.heroHoursWeekday || 'شنبه تا پنج‌شنبه ۶ صبح تا ۷ شام');
  const [heroHoursFriday, setHeroHoursFriday] = useState(adminData?.heroHoursFriday || 'جمعه‌ها ۹ صبح تا ۳ بعدازظهر');

  // === جدید (بخش ۱۰): آمار چهارگانه هیروی صفحه اختصاصی سالن مطالعه ===
  // قبلاً این چهار آمار (روز هفته باز/ساعت کاری روزانه/نوع عضویت/بخش
  // خانم‌آقا) یک آرایه‌ی هاردکد داخل StudyLoungePage.jsx بودند. عدد «ساعت
  // کاری روزانه» از ۱۶ (که با ساعات کاری واقعی هم‌خوانی نداشت) به ۱۳
  // اصلاح شد. «hallStat3Hint» متن کوچکی است که فقط وقتی موس روی آمار
  // «نوع عضویت» می‌رود نمایش داده می‌شود (نگاه کنید به PageHero.jsx).
  const [hallStat1Number, setHallStat1Number] = useState(adminData?.hallStat1Number || '۷');
  const [hallStat1Label, setHallStat1Label] = useState(adminData?.hallStat1Label || 'روز هفته باز');
  const [hallStat2Number, setHallStat2Number] = useState(adminData?.hallStat2Number || '۱۳');
  const [hallStat2Label, setHallStat2Label] = useState(adminData?.hallStat2Label || 'ساعت کاری روزانه');
  const [hallStat3Number, setHallStat3Number] = useState(adminData?.hallStat3Number || '۲');
  const [hallStat3Label, setHallStat3Label] = useState(adminData?.hallStat3Label || 'نوع عضویت');
  const [hallStat3Hint, setHallStat3Hint] = useState(adminData?.hallStat3Hint || 'عضویت روزانه و ماهانه');
  const [hallStat4Number, setHallStat4Number] = useState(adminData?.hallStat4Number || '۲');
  const [hallStat4Label, setHallStat4Label] = useState(adminData?.hallStat4Label || 'بخش خانم/آقا');

  // ۲. استیت‌های کاملاً تفکیک‌شده و مستقل دپارتمان سالن مطالعه (کتابخانه - ۱۰۰٪ فونداسیون فایل ششم)
  const [bgLounge, setBgLounge] = useState(adminData?.bgLounge || '/hero-lounge.jpg');
  const [loungePhone, setLoungePhone] = useState(adminData?.loungePhone || '۰۷۷۲۵۷۲۰۵۴');
  // === رفع باگ گزارش‌شده (بخش ۹): شماره دوم سالن مطالعه اصلاً در این پنل قابل ویرایش نبود ===
  // SiteFooter.jsx از قبل منتظر portalData.loungePhone2 بود (شماره دوم را
  // کنار شماره اول در فوتر صفحه اصلی/سالن/دستاوردها/درباره ما نشان
  // می‌دهد)، اما هیچ‌جای این پنل فیلدی برایش نمی‌ساخت — یعنی این شماره
  // فقط از طریق مقدار پیش‌فرض staticPortalConfig.js قابل تنظیم بود، نه
  // از پنل. اکنون این فیلد هم مثل شماره اول این‌جا قابل ویرایش است.
  const [loungePhone2, setLoungePhone2] = useState(adminData?.loungePhone2 || '۰۷۸۹۶۰۱۲۴۵');
  const [loungeTelegram, setLoungeTelegram] = useState(adminData?.loungeTelegram || 'https://t.me');
  const [loungeFacebook, setLoungeFacebook] = useState(adminData?.loungeFacebook || 'https://facebook.com');
  // === اضافه (رفع باگ گزارش‌شده): لینک اینستاگرام سالن مطالعه ===
  // قبلاً این لینک هیچ فیلد ادمینی نداشت و در SiteFooter.jsx مستقیم
  // هاردکد بود («https://instagram.com»)؛ همان مقدار به‌عنوان پیش‌فرض
  // این فیلد باقی ماند تا تا وقتی ادمین چیزی ثبت نکرده، ظاهر فعلی سایت
  // تغییری نکند.
  const [loungeInstagram, setLoungeInstagram] = useState(adminData?.loungeInstagram || 'https://instagram.com');
  const [priceDaily, setPriceDaily] = useState(adminData?.priceDaily || '۳۰');
  const [priceMonthly, setPriceMonthly] = useState(adminData?.priceMonthly || '۲۵۰');
  const [priceAdmission, setPriceAdmission] = useState(adminData?.priceAdmission || '۵۰');
  const [rule1, setRule1] = useState(adminData?.rule1 || 'رعایت سکوت مطلق در تمامی ابعاد سالن الزامی و اجباری است.');
  const [rule2, setRule2] = useState(adminData?.rule2 || 'استفاده از موبایل به صورت صدادار یا پاسخ‌گویی به تماس ممنوع است.');

  // === این دو (deletedSeedRuleIds / hallRulesList قدیمی) دیگر در پنل ===
  // === ویرایش نمی‌شوند؛ فقط برای «مهاجرت یک‌باره» به لیست یکپارچه‌ی ===
  // === جدید (پایین‌تر) و fallback نمایش عمومی (در HallRules.jsx برای ===
  // === سایت‌هایی که هنوز هرگز ذخیره نکرده‌اند) نگه داشته شده‌اند. ===
  const [deletedSeedRuleIds] = useState(adminData?.deletedSeedRuleIds || []);
  const [legacyHallRulesList] = useState(adminData?.hallRulesList || []);

  // === جدید (بخش ۱۱ — رفع باگ گزارش‌شده): یکپارچه‌سازی کامل «قوانین سالن» ===
  // قبلاً قوانین در سه بخش جدا مدیریت می‌شدند: «دو قانون سریع» (rule1/
  // rule2، متن آزاد)، «۵ قانون پیش‌فرض» (فقط قابل پنهان‌کردن، نه ویرایش
  // متن) و «قوانین دلخواه» (hallRulesList، فقط افزودن/حذف). ادمین به‌درستی
  // گزارش داد که این تفکیک گیج‌کننده است و می‌خواهد همه‌ی قوانین — چه
  // پیش‌فرض چه جدید — در یک‌جا و همگی به یک شکل قابل‌ویرایشِ مستقیم متن
  // باشند. اکنون data.hallRulesUnified یک آرایه‌ی تخت {id, text} است که
  // تنها منبع حقیقت قوانین است.
  //
  // مهاجرت یک‌باره: این مقدار اولیه فقط یک‌بار (در اولین بارگذاری پنل پس
  // از این تغییر) محاسبه می‌شود — دقیقاً همان قوانینی که همین الان روی
  // سایت زنده دیده می‌شوند (rule1/rule2 + ۵ قانون پیش‌فرضِ پنهان‌نشده +
  // هر قانون دلخواهی که قبلاً از بخش «قوانین نامحدود» اضافه شده بود) در
  // یک لیست یکپارچه و ترتیب‌دار جمع می‌شوند. از همان اولین «ذخیره آنی»
  // به بعد، adminData.hallRulesUnified همیشه موجود است و این مهاجرت
  // دیگر هرگز دوباره اجرا نمی‌شود (از تکرار/تکثیر قوانین جلوگیری می‌شود).
  const [hallRulesUnified, setHallRulesUnified] = useState(() => {
    if (Array.isArray(adminData?.hallRulesUnified)) return adminData.hallRulesUnified;
    const quick = [adminData?.rule1, adminData?.rule2]
      .filter((r) => Boolean(r && r.trim()))
      .map((text) => ({ id: `quick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text }));
    const seededDeletedIds = adminData?.deletedSeedRuleIds || [];
    const seeds = SEED_HALL_RULES.filter((r) => !seededDeletedIds.includes(r.id)).map((r) => ({ id: `seed-${r.id}`, text: r.text }));
    const extras = (adminData?.hallRulesList || []).filter((r) => r && r.text).map((r) => ({ id: `extra-${r.id}`, text: r.text }));
    return [...quick, ...seeds, ...extras];
  });
  const handleUpdateHallRuleText = (id, text) => {
    setHallRulesUnified((prev) => prev.map((r) => (r.id === id ? { ...r, text } : r)));
  };
  const handleRemoveHallRuleUnified = (id) => {
    setHallRulesUnified((prev) => prev.filter((r) => r.id !== id));
  };
  const [newRuleText, setNewRuleText] = useState('');
  const handleAddHallRuleUnified = () => {
    if (!newRuleText.trim()) return alert('لطفاً متن قانون را وارد کنید.');
    setHallRulesUnified((prev) => [...prev, { id: `new-${Date.now()}`, text: newRuleText.trim() }]);
    setNewRuleText('');
  };

  // === جدید (بخش ۱۰): مدیریت کامل «سوالات پرتکرار» سالن مطالعه ===
  // قبلاً faq در HallRules.jsx کاملاً هاردکد بود و هیچ فیلدی در این پنل
  // برایش وجود نداشت. اکنون دقیقاً همان الگوی قوانین: پنهان‌کردن هرکدام از
  // ۳ سوال پیش‌فرض (deletedSeedFaqIds) و افزودن هر تعداد سوال/پاسخ دلخواه
  // دیگر (hallFaqList).
  const [deletedSeedFaqIds, setDeletedSeedFaqIds] = useState(adminData?.deletedSeedFaqIds || []);
  const handleToggleSeedFaq = (id) => {
    setDeletedSeedFaqIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const [hallFaqList, setHallFaqList] = useState(adminData?.hallFaqList || []);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const handleAddHallFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return alert('لطفاً هم متن سوال و هم متن پاسخ را وارد کنید.');
    setHallFaqList((prev) => [...prev, { id: Date.now(), q: newFaqQuestion.trim(), a: newFaqAnswer.trim() }]);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };
  const handleRemoveHallFaq = (id) => {
    setHallFaqList((prev) => prev.filter((f) => f.id !== id));
  };

  // === اصلاح (بخش ۱۶): یکپارچه‌سازی «سوالات پرتکرار» خدمات تحصیلی ===
  // بازخورد کاربر: سوال/پاسخ‌های پیش‌فرض فقط قابل «پنهان‌کردن» بودند، نه
  // ویرایش مستقیم متن؛ و سوال‌های تازه‌ی ادمین در یک بخش کاملاً جدا («سوالات
  // ثبت‌شده از همین پنل») ظاهر می‌شدند، نه در ادامه‌ی همان لیست. راه‌حل
  // دقیقاً همان الگوی اثبات‌شده‌ی hallRulesUnified (بالا): یک آرایه‌ی تخت
  // و یکپارچه از {id, q, a, isDefault} — همه‌ی سوالات (چه پیش‌فرض چه
  // دلخواه) در یک لیست، به یک شکل مستقیماً قابل‌ویرایش متن، و به همان
  // ترتیب نمایش داده می‌شوند. isDefault فقط برای یک برچسب کوچک راهنما
  // («پیش‌فرض سایت» / «افزوده‌ی ادمین») نگه داشته می‌شود؛ هیچ اثر دیگری
  // روی رفتار ندارد.
  //
  // مهاجرت یک‌باره: دقیقاً مثل hallRulesUnified، این مقدار اولیه فقط یک‌بار
  // از دیتای قدیمی (SEED_SERVICES_FAQ منهای پنهان‌شده‌ها + servicesFaqList
  // قبلی) ساخته می‌شود. فیلدهای قدیمی (deletedSeedServicesFaqIds/
  // servicesFaqList) برای سازگاری با گذشته همچنان در payload ذخیره
  // می‌شوند (بدون UI مستقیم)، دقیقاً مثل legacyHallRulesList.
  const [legacyDeletedSeedServicesFaqIds] = useState(adminData?.deletedSeedServicesFaqIds || []);
  const [legacyServicesFaqList] = useState(adminData?.servicesFaqList || []);
  const [servicesFaqUnified, setServicesFaqUnified] = useState(() => {
    if (Array.isArray(adminData?.servicesFaqUnified)) return adminData.servicesFaqUnified;
    const deletedIds = adminData?.deletedSeedServicesFaqIds || [];
    const seeds = SEED_SERVICES_FAQ.filter((f) => !deletedIds.includes(f.id)).map((f) => ({ id: `seed-${f.id}`, q: f.q, a: f.a, isDefault: true }));
    const extras = (adminData?.servicesFaqList || []).filter((f) => f && f.q).map((f) => ({ id: `extra-${f.id}`, q: f.q, a: f.a, isDefault: false }));
    return [...seeds, ...extras];
  });
  const handleUpdateServicesFaqText = (id, field, value) => {
    setServicesFaqUnified((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };
  const handleRemoveServicesFaqUnified = (id) => {
    setServicesFaqUnified((prev) => prev.filter((f) => f.id !== id));
  };
  const [newServicesFaqQuestion, setNewServicesFaqQuestion] = useState('');
  const [newServicesFaqAnswer, setNewServicesFaqAnswer] = useState('');
  const handleAddServicesFaqUnified = () => {
    if (!newServicesFaqQuestion.trim() || !newServicesFaqAnswer.trim()) return alert('لطفاً هم متن سوال و هم متن پاسخ را وارد کنید.');
    setServicesFaqUnified((prev) => [...prev, { id: `new-${Date.now()}`, q: newServicesFaqQuestion.trim(), a: newServicesFaqAnswer.trim(), isDefault: false }]);
    setNewServicesFaqQuestion('');
    setNewServicesFaqAnswer('');
  };

  // === جدید (بخش ۱۵): مدیریت یکپارچه «پلن‌ها/پکیج‌های تعرفه» خدمات تحصیلی ===
  // دقیقاً همان الگوی hallRulesUnified بالا: یک آرایه‌ی تخت که هم دو پکیج
  // قبلاً هاردکد (تا وقتی ادمین ذخیره نکرده) را به‌عنوان مقدار اولیه seed
  // می‌کند، هم مستقیماً هر آیتم آن (نام/توضیح/برجسته‌بودن) قابل‌ویرایش
  // است، هم افزودن/حذف کارت جدید را پشتیبانی می‌کند — همه در یک لیست.
  const [servicesPlansList, setServicesPlansList] = useState(() => {
    if (Array.isArray(adminData?.servicesPlansList)) return adminData.servicesPlansList;
    return [
      { id: 'seed-plan-1', name: 'پکیج مشاوره تک‌جلسه', desc: 'بررسی وضعیت و ارائه راهکارهای سریع', featured: false },
      { id: 'seed-plan-2', name: 'پکیج مشاوره دوام‌دار ماهانه', desc: 'برنامه‌ریزی کامل درسی همراه با پیگیری هفتگی', featured: true },
    ];
  });
  const handleUpdateServicesPlan = (id, field, value) => {
    setServicesPlansList((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const handleRemoveServicesPlan = (id) => {
    setServicesPlansList((prev) => prev.filter((p) => p.id !== id));
  };
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanFeatured, setNewPlanFeatured] = useState(false);
  const handleAddServicesPlan = () => {
    if (!newPlanName.trim()) return alert('لطفاً نام پکیج را وارد کنید.');
    setServicesPlansList((prev) => [...prev, { id: `new-plan-${Date.now()}`, name: newPlanName.trim(), desc: newPlanDesc.trim(), featured: newPlanFeatured }]);
    setNewPlanName('');
    setNewPlanDesc('');
    setNewPlanFeatured(false);
  };

  // === گالری عکس‌های واقعی سالن مطالعه (جدید — قابل افزودن/حذف) ===
  const [loungeGalleryImages, setLoungeGalleryImages] = useState(adminData?.loungeGalleryImages || []);

  // ۳. استیت‌های کاملاً تفکیک‌شده و مستقل دپارتمان خدمات تحصیلی و مشاوره‌ها (۱۰۰٪ فونداسیون فایل ششم)
  const [bgServices, setBgServices] = useState(adminData?.bgServices || '/hero-services.jpg');
  const [servicesPhone, setServicesPhone] = useState(adminData?.servicesPhone || '۰۷۲۸۱۰۱۵۶۴');
  const [servicesTelegram, setServicesTelegram] = useState(adminData?.servicesTelegram || 'https://t.me');
  const [servicesFacebook, setServicesFacebook] = useState(adminData?.servicesFacebook || 'https://facebook.com');
  // === اضافه (رفع باگ گزارش‌شده): لینک اینستاگرام دپارتمان خدمات تحصیلی ===
  const [servicesInstagram, setServicesInstagram] = useState(adminData?.servicesInstagram || 'https://instagram.com');
  const [servicesPhone2, setServicesPhone2] = useState(adminData?.servicesPhone2 || '۰۷۳۳XXXXXX');

  // ۴. استیت‌های دپارتمان بورسیه‌های فعال بین‌المللی و مدیریت کارتی دوره‌ها (۱۰۰٪ فونداسیون فایل ششم با حفظ دیتای اولیه)
  const [bgScholarships, setBgScholarships] = useState(adminData?.bgScholarships || '/hero-scholarships.jpg');
  // === جدید: بخش «📚 راهنمای جامع آماده‌سازی مدارک» در صفحه بورسیه‌ها ===
  // قبلاً این عنوان/توضیح و دو کارت (انگیزه‌نامه/رزومه) کاملاً هاردکد در
  // ActiveScholarshipsPage.jsx بودند و از این پنل قابل ویرایش نبودند.
  const [docsGuideTitle, setDocsGuideTitle] = useState(adminData?.docsGuideTitle || '📚 راهنمای جامع آماده‌سازی مدارک و دوسیه تحصیلی');
  const [docsGuideDesc, setDocsGuideDesc] = useState(adminData?.docsGuideDesc || 'تیم مشاوران پژوهش شما را در نگارش انگیزه‌نامه، توصیه‌نامه و رزومه استاندارد یاری می‌رساند.');
  const [docsGuideCard1Title, setDocsGuideCard1Title] = useState(adminData?.docsGuideCard1Title || '✍️ انگیزه‌نامه تخصصی');
  const [docsGuideCard1Desc, setDocsGuideCard1Desc] = useState(adminData?.docsGuideCard1Desc || 'تبیین اهداف آکادمیک و متقاعدسازی کمیته بورسیه بر اساس استانداردهای بین‌المللی.');
  const [docsGuideCard2Title, setDocsGuideCard2Title] = useState(adminData?.docsGuideCard2Title || '📄 رزومه (CV) آکادمیک');
  const [docsGuideCard2Desc, setDocsGuideCard2Desc] = useState(adminData?.docsGuideCard2Desc || 'ساختاربندی تجارب، مقالات و مهارت‌ها با فرمت‌های بین‌المللی.');
  // نکته: این آرایه فقط قبل از هیدریت‌شدن از Supabase به‌صورت آنی نمایش داده
  // می‌شود؛ محتوای واقعی بورسیه‌ها ۱۰۰٪ توسط ادمین از همین پنل (افزودن/
  // ویرایش/حذف) مدیریت می‌شود، پس دیگر یک آرایه‌ی نمونه با فیلدهای ناقص
  // اینجا هاردکد نشد (چون شکل فیلدش هم با فرم ویرایش جدید هم‌خوان نبود).
  const [scholarshipsList, setScholarshipsList] = useState(adminData?.scholarshipsList || []);

  // فیلدهای تکمیلی و غنیِ فایل پنجم جهت تزریق هوشمند به پاپ‌آ‌پ‌ها و کارت‌ها
  const [newTitle, setNewTitle] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newDegree, setNewDegree] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newFunding, setNewFunding] = useState('full');
  const [newLang, setNewLang] = useState('انگلیسی');
  const [newRequireLang, setNewRequireLang] = useState('نیازمند مدرک زبان');
  // === اضافه (رفع باگ گزارش‌شده): محدودیت سنی هر بورسیه ===
  // فیلد آزاد متنی است (نه عدد صرف)، چون محدودیت‌های واقعی معمولاً بازه‌ای
  // یا شرطی‌اند («زیر ۳۵ سال»، «بدون محدودیت سنی»، «۱۸ تا ۳۰ برای لیسانس»)
  // و یک عدد تنها نمی‌تواند این تنوع را پوشش دهد.
  const [newAgeLimit, setNewAgeLimit] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDocs, setNewDocs] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  // === رفع کمبود گزارش‌شده: فرم افزودن بورسیه فیلد عکس نداشت ===
  // ستون image_url از قبل در جدول portal_scholarships وجود دارد ولی این فرم
  // هیچ‌وقت آن را پر نمی‌کرد؛ به همین دلیل بورسیه‌های ثبت‌شده از این پنل
  // همیشه بدون عکس اختصاصی می‌ماندند. اکنون با همان ImageUploader آماده‌ی
  // پروژه (دقیقاً همان الگوی bgScholarships) وصل شد.
  const [newImageUrl, setNewImageUrl] = useState('');
  // === رفع کمبود دوم: امکان «ویرایش» یک بورسیه‌ی موجود ===
  // قبلاً پنل ادمین فقط «افزودن ردیف جدید» و «حذف ردیف» داشت؛ برای اصلاح
  // یک بورسیه‌ی موجود (مثلاً تغییر ددلاین یا تصویر) باید حذف و از صفر
  // دوباره اضافه می‌شد (و id عوض می‌شد). اکنون با این استیت، همان فرم
  // «افزودن» برای «ویرایش» هم استفاده می‌شود: وقتی غیر null باشد یعنی در
  // حال ویرایش همان id هستیم، نه افزودن یک ردیف کاملاً جدید.
  const [editingScholarshipId, setEditingScholarshipId] = useState(null);
  // === بخش دوم رفع باگ حذف ناخواسته ===
  // فقط id هایی که ادمین صراحتاً با دکمه «حذف فوری از سایت» علامت زده در
  // این آرایه جمع می‌شوند و همراه ذخیره‌ی نهایی به syncScholarshipsList
  // فرستاده می‌شوند؛ portalService.js دیگر خودش تصمیم نمی‌گیرد چه چیزی
  // «باید» حذف شود، فقط دقیقاً همین لیست را حذف می‌کند.
  const [deletedScholarshipIds, setDeletedScholarshipIds] = useState([]);

  // === باکس جست‌وجوی کشور (جایگزین باکس متن آزاد قبلی) ===
  const [countryQuery, setCountryQuery] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const filteredCountries = (countryQuery.trim()
    ? COUNTRIES.filter((c) => {
        const q = countryQuery.trim().toLowerCase();
        return (
          c.nameFa.includes(countryQuery.trim()) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
        );
      })
    : COUNTRIES
  ).slice(0, 8);

  const selectedCountryLabel = newCountry
    ? (COUNTRIES.find((c) => c.code === newCountry)?.nameFa || newCountry)
    : '';

  // ۵. استیت‌های تالار افتخارات و آمار ۳ گانه نخبگان کنکور و دانشگاه (۱۰۰٪ فونداسیون فایل ششم)
  const [bgAchievements, setBgAchievements] = useState(adminData?.bgAchievements || '/hero-achievements.jpg');
  const [stat1Num, setStat1Num] = useState(adminData?.stat1Number || '+۴۵ تن');
  const [stat1Lab, setStat1Lab] = useState(adminData?.stat1Label || 'قبولی در کادرهای برتر کانکور');
  const [stat2Num, setStat2Num] = useState(adminData?.stat2Number || '+۳۰ محصل');
  const [stat2Lab, setStat2Lab] = useState(adminData?.stat2Label || 'اعزام موفق به بورسیه‌های دولتی');
  const [stat3Num, setStat3Num] = useState(adminData?.stat3Number || '۹۸٪');
  const [stat3Lab, setStat3Lab] = useState(adminData?.stat3Label || 'رشد و ارتقای معدل اعضای سالن');

  // === ۶. تالار دستاوردها/نظرات نخبگان (جدید — قابل افزودن/حذف، معادل eliteData) ===
  const [achievementsEliteList, setAchievementsEliteList] = useState(adminData?.achievementsEliteList || []);
  const [newEliteName, setNewEliteName] = useState('');
  const [newEliteType, setNewEliteType] = useState('konkur');
  const [newEliteTitle, setNewEliteTitle] = useState('');
  const [newEliteYear, setNewEliteYear] = useState('');
  const [newEliteDesc, setNewEliteDesc] = useState('');
  const [newEliteQuote, setNewEliteQuote] = useState('');
  const [newEliteTags, setNewEliteTags] = useState('');
  // === جدید (بخش ۹): انتشار هم‌زمان در صفحه اصلی ===
  // این تیک مشخص می‌کند که دستاورد جدید، علاوه بر صفحه‌ی دستاوردها (که
  // همیشه منتشر می‌شود)، در بخش «روایت کسانی که رسیدند»ی صفحه‌ی اصلی هم
  // نشان داده شود یا نه. پیش‌فرض خاموش است تا رفتار قبلی (فقط صفحه‌ی
  // دستاوردها) برای دستاوردهایی که ادمین درباره‌شان تصمیم آگاهانه نگرفته،
  // تغییر نکند.
  const [newEliteShowOnHome, setNewEliteShowOnHome] = useState(false);
  // === جدید (بخش ۱۵): انتشار هم‌زمان در صفحه خدمات تحصیلی ===
  // دقیقاً همان منطق newEliteShowOnHome، اما برای بخش «تجربه محصلان موفق
  // دپارتمان مشاوره» در AcademicServicesPage.jsx. این دو تیک کاملاً
  // مستقل از هم‌اند — یک دستاورد می‌تواند هم‌زمان در صفحه اصلی، هم در
  // صفحه خدمات تحصیلی، هیچ‌کدام، یا فقط یکی از این دو نمایش داده شود.
  const [newEliteShowOnServices, setNewEliteShowOnServices] = useState(false);

  const handleAddElite = () => {
    if (!newEliteName || !newEliteTitle) {
      return alert('لطفاً حداقل نام و عنوان دستاورد را وارد کنید.');
    }
    const newItem = {
      id: Date.now(),
      name: newEliteName,
      type: newEliteType,
      title: newEliteTitle,
      year: newEliteYear || '۱۴۰۵',
      desc: newEliteDesc || '',
      quote: newEliteQuote || '',
      tags: newEliteTags.split(',').map((t) => t.trim()).filter(Boolean),
      showOnHome: newEliteShowOnHome,
      showOnServices: newEliteShowOnServices
    };
    setAchievementsEliteList([...achievementsEliteList, newItem]);
    setNewEliteName(''); setNewEliteType('konkur'); setNewEliteTitle(''); setNewEliteYear('');
    setNewEliteDesc(''); setNewEliteQuote(''); setNewEliteTags(''); setNewEliteShowOnHome(false); setNewEliteShowOnServices(false);
  };

  const handleRemoveElite = (id) => {
    setAchievementsEliteList(achievementsEliteList.filter((item) => item.id !== id));
  };

  // === جدید (بخش ۹): تغییر انتشار «صفحه اصلی» برای یک دستاورد از قبل ثبت‌شده ===
  // دقیقاً همان درخواست: امکان اینکه ادمین از همین لیست («دستاوردهای
  // ثبت‌شده از همین پنل»)، بدون نیاز به حذف/افزودن دوباره، تصمیم بگیرد
  // یک دستاورد که از قبل در صفحه‌ی دستاوردها منتشر شده، در صفحه‌ی اصلی هم
  // نمایش داده شود یا نه.
  const handleToggleEliteShowOnHome = (id) => {
    setAchievementsEliteList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, showOnHome: !item.showOnHome } : item))
    );
  };

  // === جدید (بخش ۱۵): معادل بالا برای صفحه خدمات تحصیلی ===
  const handleToggleEliteShowOnServices = (id) => {
    setAchievementsEliteList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, showOnServices: !item.showOnServices } : item))
    );
  };

  // === رفع باگ گزارش‌شده: دستاوردهای نمونه سایت اصلاً قابل حذف نبودند ===
  // AchievementsPage.jsx از قبل منتظر data.deletedSeedEliteIds بود (سه
  // دستاورد نمونه هاردکد — احمد رفیعی/زهرا رضایی/جاوید کریمی — را در برابر
  // این آرایه فیلتر می‌کند)، ولی هیچ‌جای این پنل چنین آرایه‌ای نمی‌ساخت یا
  // نمایش نمی‌داد؛ یعنی دکمه‌ی «حذف» بالا (handleRemoveElite) فقط روی
  // achievementsEliteList (آیتم‌های خودِ ادمین) کار می‌کرد، نه روی این ۳ نمونه.
  // اکنون این سه مورد جداگانه، با دکمه‌ی حذف/بازگرداندن، نمایش داده می‌شوند.
  const [deletedSeedEliteIds, setDeletedSeedEliteIds] = useState(adminData?.deletedSeedEliteIds || []);

  const handleToggleSeedElite = (id) => {
    setDeletedSeedEliteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // === جدید (بخش ۹): انتخاب دستاوردهای نمونه‌ی پیش‌فرض برای نمایش در صفحه اصلی ===
  // این آرایه، جدا و مستقل از deletedSeedEliteIds (که حذف کامل از سایت
  // است)، فقط مشخص می‌کند کدام‌یک از سه نمونه‌ی پیش‌فرض در بخش «روایت
  // کسانی که رسیدند»ی صفحه‌ی اصلی هم دیده شوند. مقدار پیش‌فرض («۱» و «۲»)
  // دقیقاً همان چیزی است که Stories.jsx تا وقتی ادمین چیزی تغییر نداده
  // نشان می‌دهد، پس بدون هیچ اقدامی از سمت ادمین، صفحه اصلی همیشه یکی دو
  // نمونه‌ی واقعی از تالار افتخارات دارد.
  const [homeFeaturedSeedIds, setHomeFeaturedSeedIds] = useState(adminData?.homeFeaturedSeedIds || [1, 2]);

  const handleToggleSeedEliteOnHome = (id) => {
    setHomeFeaturedSeedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // === جدید (بخش ۱۵): معادل بالا برای صفحه خدمات تحصیلی ===
  // بدون پیش‌فرض ([]) — بر خلاف صفحه اصلی که از قبل دو نمونه فعال داشت،
  // این بخش از صفحه خدمات تحصیلی کاملاً جدید است، پس تا ادمین صراحتاً
  // انتخاب نکند، هیچ نمونه‌ی پیش‌فرضی روی آن ظاهر نمی‌شود (رفع نقض
  // Zero Fabrication).
  const [servicesFeaturedSeedIds, setServicesFeaturedSeedIds] = useState(adminData?.servicesFeaturedSeedIds || []);

  const handleToggleSeedEliteOnServices = (id) => {
    setServicesFeaturedSeedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // === ۷. نظر مشتری صفحه اصلی (جدید — یک آبجکت تکی، بدون افزودن/حذف) ===
  const [testimonialName, setTestimonialName] = useState(adminData?.homeTestimonial?.name || '');
  const [testimonialQuote, setTestimonialQuote] = useState(adminData?.homeTestimonial?.quote || '');

  // === ۸. آمار ۴گانه بخش «نگاه کلی» صفحه درباره ما (جدید) ===
  // رفع باگ گزارش‌شده: این ۴ آمار (ساعت فعالیت، مساحت، تعداد خدمت، کشور
  // مقصد بورسیه) قبلاً کاملاً هاردکد بودند در AboutUsPage.jsx و از این پنل
  // اصلاً قابل دسترسی نبودند. مقدار پیش‌فرض «کشور مقصد» هم دیگر یک عدد ثابت
  // نیست (چون فهرست بورسیه‌ها می‌تواند از چند کشور تا ده‌ها کشور تغییر
  // کند)؛ اگر ادمین ترجیح داد یک عدد دقیق بگذارد، همین‌جا قابل تغییر است.
  const [glanceStat1Value, setGlanceStat1Value] = useState(adminData?.glanceStat1Value || '۱۶ ساعت');
  const [glanceStat1Label, setGlanceStat1Label] = useState(adminData?.glanceStat1Label || 'فعالیت روزانه سالن');
  const [glanceStat2Value, setGlanceStat2Value] = useState(adminData?.glanceStat2Value || '۲۷۰ متر');
  const [glanceStat2Label, setGlanceStat2Label] = useState(adminData?.glanceStat2Label || 'مساحت سالن مطالعه');
  const [glanceStat3Value, setGlanceStat3Value] = useState(adminData?.glanceStat3Value || '۹ خدمت');
  const [glanceStat3Label, setGlanceStat3Label] = useState(adminData?.glanceStat3Label || 'خدمت تخصصی مشاوره تحصیلی');
  const [glanceStat4Value, setGlanceStat4Value] = useState(adminData?.glanceStat4Value || 'بدون مرز');
  const [glanceStat4Label, setGlanceStat4Label] = useState(adminData?.glanceStat4Label || 'کشور مقصد بورسیه، هرجا فرصت باشد');

  // === ۹. مدیریت جایگاه‌های تصویر صفحه درباره ما (جدید — آرایه ثابت) ===
  const [aboutPageImages, setAboutPageImages] = useState(adminData?.aboutPageImages || DEFAULT_ABOUT_IMAGES);

  const handleAboutImageUpload = (key, url) => {
    setAboutPageImages((prev) => prev.map((img) => (img.key === key ? { ...img, url } : img)));
  };

  const getAboutImageUrl = (key) => {
    const found = aboutPageImages.find((img) => img.key === key);
    return found ? found.url : '/about-placeholder.jpg';
  };

  // تابع مدیریت درج/ویرایش لایو بورسیه با حفظ فونداسیون متنی فایل ششم + تزریق فیلدهای غنی فایل پنجم
  const handleAddScholarship = () => {
    if (!newCountry || !newDegree) return alert('لطفاً مشخصات بورسیه (کشور و مقطع) را کامل وارد کنید.');

    const itemData = {
      country: newCountry,
      degree: newDegree,
      deadline: newDeadline || 'نامشخص',
      status: newStatus,
      title: newTitle || `بورسیه دولتی کشور ${getCountryLabel(newCountry)}`,
      provider: newProvider || 'نامشخص',
      funding: newFunding,
      lang: newLang,
      requireLang: newRequireLang,
      ageLimit: newAgeLimit || 'بدون محدودیت سنی اعلام‌شده',
      sourceUrl: '#',
      lastCheck: '۱۴۰۵/۰۶/۰۱',
      desc: newDesc || 'پوشش کامل هزینه‌های تحصیلی متناسب با شرایط اعلامی.',
      docs: newDocs || 'اسناد تحصیلی استاندارد، ریز نمرات و اسناد تذکره/پاسپورت.',
      image_url: newImageUrl || ''
    };

    if (editingScholarshipId) {
      // حالت ویرایش: id قبلی حفظ می‌شود، فقط فیلدها به‌روزرسانی می‌شوند
      // (created_at ردیف قبلی هم دست‌نخورده باقی می‌ماند، چون در itemData نیست)
      setScholarshipsList(
        scholarshipsList.map((item) => (item.id === editingScholarshipId ? { ...item, ...itemData } : item))
      );
    } else {
      // === رفع باگ واقعی: بورسیه‌های جدید هرگز واقعاً در Supabase ذخیره نمی‌شدند ===
      // جدول portal_scholarships ستون created_at را NOT NULL تعریف کرده،
      // ولی این ردیف جدید هرگز مقداری برای آن نمی‌فرستاد؛ نتیجه‌اش خطای
      // دقیق «null value in column "created_at" ... violates not-null
      // constraint» در همان alert خطای ذخیره‌سازی بود — یعنی آن بورسیه
      // فقط لحظه‌ای در همین پنل دیده می‌شد و هرگز واقعاً در Supabase درج
      // نمی‌شد، پس هیچ‌وقت روی سایت عمومی هم ظاهر نمی‌شد.
      setScholarshipsList([...scholarshipsList, { id: Date.now(), created_at: new Date().toISOString(), ...itemData }]);
    }

    resetScholarshipForm();
  };

  // پر کردن فرم با اطلاعات یک بورسیه‌ی موجود برای ویرایش
  const handleEditScholarship = (sch) => {
    setEditingScholarshipId(sch.id);
    setNewCountry(sch.country || '');
    setCountryQuery('');
    setNewDegree(sch.degree || '');
    setNewDeadline(sch.deadline || '');
    setNewStatus(sch.status || 'active');
    setNewTitle(sch.title || '');
    setNewProvider(sch.provider || '');
    setNewFunding(sch.funding || 'full');
    setNewLang(sch.lang || 'انگلیسی');
    setNewRequireLang(sch.requireLang || 'نیازمند مدرک زبان');
    setNewAgeLimit(sch.ageLimit || '');
    setNewDesc(sch.desc || '');
    setNewDocs(sch.docs || '');
    setNewImageUrl(sch.image_url || '');
  };

  const resetScholarshipForm = () => {
    setEditingScholarshipId(null);
    setNewCountry(''); setCountryQuery(''); setNewDegree(''); setNewDeadline('');
    setNewTitle(''); setNewProvider(''); setNewDesc(''); setNewDocs(''); setNewImageUrl('');
    setNewFunding('full'); setNewLang('انگلیسی'); setNewRequireLang('نیازمند مدرک زبان'); setNewAgeLimit(''); setNewStatus('active');
  };

  const handleRemoveScholarship = (id) => {
    setScholarshipsList(scholarshipsList.filter(item => item.id !== id));
    setDeletedScholarshipIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (editingScholarshipId === id) resetScholarshipForm();
  };

  // ۱. بارگذاری لیست فرم‌های آنلاین مستقیماً از جدول portal_requests سوپابیس
  const [pendingForms, setPendingItems] = useState([]);
  const [requestsError, setRequestsError] = useState('');
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // === بازخورد بصری دکمه «ذخیره آنی» ===
  // قبلاً هیچ نشانه‌ای در حین ارسال درخواست به Supabase وجود نداشت (نه
  // تغییر رنگ، نه غیرفعال شدن، نه اسپینر)؛ فقط در پایان یک alert() ظاهر
  // می‌شد. برای شبکه‌های کند، این یعنی چند ثانیه دکمه کاملاً «مرده» به نظر
  // می‌رسید. isSaving رنگ/متن/غیرفعال‌بودن دکمه را کنترل می‌کند؛ saveToast
  // یک نوار پیام غیرمسدودکننده (بالای صفحه) به‌جای alert() نشان می‌دهد.
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null); // { type: 'success' | 'error' | 'info', message: string }

  useEffect(() => {
    if (saveToast && saveToast.type === 'success') {
      const timer = setTimeout(() => setSaveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  const loadPendingRequests = async () => {
    setIsLoadingRequests(true);
    setRequestsError('');
    try {
      const { data, error } = await supabase
        .from('portal_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingItems(data || []);
    } catch (error) {
      console.error("Error loading requests from Supabase:", error);
      setRequestsError(error.message);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // === پاسخ به «این کجا آرشیو می‌شود؟» ===
  // قبلاً «تایید» فقط status ردیف را در جدول portal_requests سوپابیس روی
  // approved می‌گذاشت — یعنی از صفِ بررسی پنهان می‌شد ولی هیچ جای دیگری در
  // خودِ پنل ادمین نمی‌شد آن را دوباره دید (فقط با باز کردن مستقیم دیتابیس
  // سوپابیس قابل مشاهده بود). اکنون یک بخش «آرشیو درخواست‌های بررسی‌شده»
  // اضافه شده که همان ردیف‌ها (approved/rejected) را از همان جدول می‌خواند
  // و نمایش می‌دهد — یعنی «آرشیو» یک مکان واقعی و قابل‌مشاهده در خودِ پنل شد.
  const [archivedForms, setArchivedForms] = useState([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // === فاز ۲ دور سوم دیباگ: state های صرفاً تزئینی منوی ۷گانه و آکاردئون‌ها ===
  // activePage تعیین می‌کند کدام بخشِ همان فرم قبلی نمایش داده شود؛ هیچ‌کدام
  // از این state ها در ذخیره‌سازی (Supabase) شرکت نمی‌کنند.
  const [activePage, setActivePage] = useState('general');
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [openPendingGroups, setOpenPendingGroups] = useState({ lounge: false, services: false, achievement: false, cooperation: false });
  const [openArchiveGroups, setOpenArchiveGroups] = useState({ lounge: false, services: false, achievement: false, cooperation: false });
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  const loadArchivedRequests = async () => {
    setIsLoadingArchive(true);
    setArchiveError('');
    try {
      const { data, error } = await supabase
        .from('portal_requests')
        .select('*')
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setArchivedForms(data || []);
    } catch (error) {
      console.error('Error loading archived requests from Supabase:', error);
      setArchiveError(error.message);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const handleToggleArchive = () => {
    const opening = !isArchiveOpen;
    setIsArchiveOpen(opening);
    if (opening) loadArchivedRequests();
  };

  const handleReview = async (id, status) => {
    try {
      const { error } = await supabase
        .from('portal_requests')
        .update({ status: status })
        .eq('id', id);

      if (error) throw error;

      setPendingItems((items) => items.filter((item) => item.id !== id));
      // اگر آرشیو همین الان باز است، ردیف تازه‌تاییدشده را هم بلافاصله در
      // همان‌جا نشان می‌دهیم — نیازی به بستن و باز کردن دوباره نیست.
      if (isArchiveOpen) loadArchivedRequests();
    } catch (error) {
      console.error("Error updating request status in Supabase:", error);
      alert('خطا در به‌روزرسانی وضعیت: ' + error.message);
    }
  };

  // === رفع باگ گزارش‌شده: دکمه «تایید و انتشار» واقعاً چیزی منتشر نمی‌کرد ===
  // این دکمه فقط status را در Supabase روی approved می‌گذاشت و از صف پنهان
  // می‌کرد — برای «ثبت‌نام سالن»/«مشاوره»/«همکاری» درست همین کافی است (این‌ها
  // صرفاً درخواست تماسِ بازگشتی‌اند، مفهوم «انتشار» ندارند). اما فرم «ثبت
  // دستاورد» (AchievementsPage.jsx) به فرستنده صریحاً وعده می‌دهد که «پس از
  // تایید مدیریت، در تالار افتخارات منتشر خواهد شد» — و این وعده هیچ‌وقت
  // عملی نمی‌شد. اکنون برای type === 'achievement_submission'، اطلاعات
  // درخواست در همان فرم «➕ افزودن دستاورد جدید» (پایین همین صفحه) از پیش
  // پر می‌شود و ادمین به آن هدایت می‌شود. عمداً به‌صورت خودکار به
  // achievementsEliteList اضافه نمی‌شود، چون دانش‌آموز هیچ «عنوان» کوتاه
  // عمومی نفرستاده (فقط یک توضیح آزاد) — نوشتن آن عنوان یک قدم ویرایشی
  // انسانی لازم دارد تا کیفیت متن عمومی سایت افت نکند.
  const handleApproveRequest = (form) => {
    if (form.type === 'achievement_submission') {
      setNewEliteName(form.name || '');
      setNewEliteType(form.details?.achievementType || 'konkur');
      setNewEliteYear('');
      setNewEliteTitle('');
      setNewEliteDesc(form.details?.achievementDetails || '');
      setNewEliteQuote('');
      setNewEliteTags(DEPARTMENT_TAG_LABELS[form.details?.department] || '');
      setNewEliteShowOnHome(false);
      setNewEliteShowOnServices(false);
      handleReview(form.id, 'approved');
      if (typeof document !== 'undefined') {
        const target = document.getElementById('elite-form-section');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setSaveToast({
        type: 'info',
        message:
          'اطلاعات این دستاورد در فرم «افزودن دستاورد جدید» پر شد. یک عنوان کوتاه بنویسید، مشخص کنید در صفحه اصلی و/یا صفحه خدمات تحصیلی هم نمایش داده شود یا فقط در تالار افتخارات، سپس «افزودن به تالار افتخارات» و در پایان حتماً «ذخیره آنی» را هم بزنید تا در سایت عمومی منتشر شود.',
      });
    } else {
      handleReview(form.id, 'approved');
    }
  };

  useEffect(() => {
    loadPendingRequests();

    fetchPortalData((freshData) => {
      setAdminPortalData(freshData);

      if (freshData) {
        if (freshData.globalAddress) setAddress(freshData.globalAddress);
        if (freshData.announcement) setAnnouncement(freshData.announcement);
        if (freshData.announcementEnabled !== undefined) setAnnouncementEnabled(freshData.announcementEnabled);
        if (freshData.mainHeroImage) setMainHeroImage(freshData.mainHeroImage);
        if (freshData.heroStat1Number) setHeroStat1Number(freshData.heroStat1Number);
        if (freshData.heroStat1Label) setHeroStat1Label(freshData.heroStat1Label);
        if (freshData.heroStat2Number) setHeroStat2Number(freshData.heroStat2Number);
        if (freshData.heroStat2Label) setHeroStat2Label(freshData.heroStat2Label);
        if (freshData.heroStat3Number) setHeroStat3Number(freshData.heroStat3Number);
        if (freshData.heroStat3Label) setHeroStat3Label(freshData.heroStat3Label);
        if (freshData.heroHoursWeekday) setHeroHoursWeekday(freshData.heroHoursWeekday);
        if (freshData.heroHoursFriday) setHeroHoursFriday(freshData.heroHoursFriday);
        if (freshData.hallStat1Number) setHallStat1Number(freshData.hallStat1Number);
        if (freshData.hallStat1Label) setHallStat1Label(freshData.hallStat1Label);
        if (freshData.hallStat2Number) setHallStat2Number(freshData.hallStat2Number);
        if (freshData.hallStat2Label) setHallStat2Label(freshData.hallStat2Label);
        if (freshData.hallStat3Number) setHallStat3Number(freshData.hallStat3Number);
        if (freshData.hallStat3Label) setHallStat3Label(freshData.hallStat3Label);
        if (freshData.hallStat3Hint) setHallStat3Hint(freshData.hallStat3Hint);
        if (freshData.hallStat4Number) setHallStat4Number(freshData.hallStat4Number);
        if (freshData.hallStat4Label) setHallStat4Label(freshData.hallStat4Label);
        if (freshData.bgLounge) setBgLounge(freshData.bgLounge);
        if (freshData.loungePhone) setLoungePhone(freshData.loungePhone);
        if (freshData.loungePhone2) setLoungePhone2(freshData.loungePhone2);
        if (freshData.loungeTelegram) setLoungeTelegram(freshData.loungeTelegram);
        if (freshData.loungeFacebook) setLoungeFacebook(freshData.loungeFacebook);
        if (freshData.loungeInstagram) setLoungeInstagram(freshData.loungeInstagram);
        if (freshData.priceDaily) setPriceDaily(freshData.priceDaily);
        if (freshData.priceMonthly) setPriceMonthly(freshData.priceMonthly);
        if (freshData.priceAdmission) setPriceAdmission(freshData.priceAdmission);
        if (freshData.rule1) setRule1(freshData.rule1);
        if (freshData.rule2) setRule2(freshData.rule2);
        if (freshData.hallRulesUnified) setHallRulesUnified(freshData.hallRulesUnified);
        if (freshData.deletedSeedFaqIds) setDeletedSeedFaqIds(freshData.deletedSeedFaqIds);
        if (freshData.hallFaqList) setHallFaqList(freshData.hallFaqList);
        if (freshData.loungeGalleryImages) setLoungeGalleryImages(freshData.loungeGalleryImages);
        if (freshData.bgServices) setBgServices(freshData.bgServices);
        if (freshData.servicesPhone) setServicesPhone(freshData.servicesPhone);
        if (freshData.servicesTelegram) setServicesTelegram(freshData.servicesTelegram);
        if (freshData.servicesFacebook) setServicesFacebook(freshData.servicesFacebook);
        if (freshData.servicesInstagram) setServicesInstagram(freshData.servicesInstagram);
        if (freshData.servicesPhone2) setServicesPhone2(freshData.servicesPhone2);
        if (freshData.servicesFaqUnified) setServicesFaqUnified(freshData.servicesFaqUnified);
        if (freshData.servicesPlansList) setServicesPlansList(freshData.servicesPlansList);
        if (freshData.bgScholarships) setBgScholarships(freshData.bgScholarships);
        if (freshData.bgAchievements) setBgAchievements(freshData.bgAchievements);
        if (freshData.stat1Number) setStat1Num(freshData.stat1Number);
        if (freshData.stat1Label) setStat1Lab(freshData.stat1Label);
        if (freshData.stat2Number) setStat2Num(freshData.stat2Number);
        if (freshData.stat2Label) setStat2Lab(freshData.stat2Label);
        if (freshData.stat3Number) setStat3Num(freshData.stat3Number);
        if (freshData.stat3Label) setStat3Lab(freshData.stat3Label);
        if (freshData.scholarshipsList) setScholarshipsList(freshData.scholarshipsList);
        if (freshData.achievementsEliteList) setAchievementsEliteList(freshData.achievementsEliteList);
        if (freshData.deletedSeedEliteIds) setDeletedSeedEliteIds(freshData.deletedSeedEliteIds);
        if (freshData.homeFeaturedSeedIds) setHomeFeaturedSeedIds(freshData.homeFeaturedSeedIds);
        if (freshData.servicesFeaturedSeedIds) setServicesFeaturedSeedIds(freshData.servicesFeaturedSeedIds);
        if (freshData.homeTestimonial) {
          setTestimonialName(freshData.homeTestimonial.name || '');
          setTestimonialQuote(freshData.homeTestimonial.quote || '');
        }
        if (freshData.glanceStat1Value) setGlanceStat1Value(freshData.glanceStat1Value);
        if (freshData.glanceStat1Label) setGlanceStat1Label(freshData.glanceStat1Label);
        if (freshData.glanceStat2Value) setGlanceStat2Value(freshData.glanceStat2Value);
        if (freshData.glanceStat2Label) setGlanceStat2Label(freshData.glanceStat2Label);
        if (freshData.glanceStat3Value) setGlanceStat3Value(freshData.glanceStat3Value);
        if (freshData.glanceStat3Label) setGlanceStat3Label(freshData.glanceStat3Label);
        if (freshData.glanceStat4Value) setGlanceStat4Value(freshData.glanceStat4Value);
        if (freshData.glanceStat4Label) setGlanceStat4Label(freshData.glanceStat4Label);
        if (freshData.aboutPageImages) setAboutPageImages(freshData.aboutPageImages);
        if (freshData.docsGuideTitle) setDocsGuideTitle(freshData.docsGuideTitle);
        if (freshData.docsGuideDesc) setDocsGuideDesc(freshData.docsGuideDesc);
        if (freshData.docsGuideCard1Title) setDocsGuideCard1Title(freshData.docsGuideCard1Title);
        if (freshData.docsGuideCard1Desc) setDocsGuideCard1Desc(freshData.docsGuideCard1Desc);
        if (freshData.docsGuideCard2Title) setDocsGuideCard2Title(freshData.docsGuideCard2Title);
        if (freshData.docsGuideCard2Desc) setDocsGuideCard2Desc(freshData.docsGuideCard2Desc);
      }
    });
  }, []);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveToast(null);
    try {
      const updates = [
        { key: 'globalAddress', value: address },
        { key: 'announcement', value: announcement },
        { key: 'announcementEnabled', value: announcementEnabled },
        { key: 'mainHeroImage', value: mainHeroImage },
        { key: 'heroStat1Number', value: heroStat1Number },
        { key: 'heroStat1Label', value: heroStat1Label },
        { key: 'heroStat2Number', value: heroStat2Number },
        { key: 'heroStat2Label', value: heroStat2Label },
        { key: 'heroStat3Number', value: heroStat3Number },
        { key: 'heroStat3Label', value: heroStat3Label },
        { key: 'heroHoursWeekday', value: heroHoursWeekday },
        { key: 'heroHoursFriday', value: heroHoursFriday },
        { key: 'hallStat1Number', value: hallStat1Number },
        { key: 'hallStat1Label', value: hallStat1Label },
        { key: 'hallStat2Number', value: hallStat2Number },
        { key: 'hallStat2Label', value: hallStat2Label },
        { key: 'hallStat3Number', value: hallStat3Number },
        { key: 'hallStat3Label', value: hallStat3Label },
        { key: 'hallStat3Hint', value: hallStat3Hint },
        { key: 'hallStat4Number', value: hallStat4Number },
        { key: 'hallStat4Label', value: hallStat4Label },
        { key: 'bgLounge', value: bgLounge },
        { key: 'loungePhone', value: loungePhone },
        { key: 'loungePhone2', value: loungePhone2 },
        { key: 'loungeTelegram', value: loungeTelegram },
        { key: 'loungeFacebook', value: loungeFacebook },
        { key: 'loungeInstagram', value: loungeInstagram },
        { key: 'priceDaily', value: priceDaily },
        { key: 'priceMonthly', value: priceMonthly },
        { key: 'priceAdmission', value: priceAdmission },
        { key: 'rule1', value: rule1 },
        { key: 'rule2', value: rule2 },
        { key: 'deletedSeedRuleIds', value: deletedSeedRuleIds },
        { key: 'hallRulesList', value: legacyHallRulesList },
        { key: 'hallRulesUnified', value: hallRulesUnified },
        { key: 'deletedSeedFaqIds', value: deletedSeedFaqIds },
        { key: 'hallFaqList', value: hallFaqList },
        { key: 'loungeGalleryImages', value: loungeGalleryImages },
        { key: 'bgServices', value: bgServices },
        { key: 'servicesPhone', value: servicesPhone },
        { key: 'servicesTelegram', value: servicesTelegram },
        { key: 'servicesFacebook', value: servicesFacebook },
        { key: 'servicesInstagram', value: servicesInstagram },
        { key: 'servicesPhone2', value: servicesPhone2 },
        { key: 'deletedSeedServicesFaqIds', value: legacyDeletedSeedServicesFaqIds },
        { key: 'servicesFaqList', value: legacyServicesFaqList },
        { key: 'servicesFaqUnified', value: servicesFaqUnified },
        { key: 'servicesPlansList', value: servicesPlansList },
        { key: 'servicesFeaturedSeedIds', value: servicesFeaturedSeedIds },
        { key: 'bgScholarships', value: bgScholarships },
        { key: 'docsGuideTitle', value: docsGuideTitle },
        { key: 'docsGuideDesc', value: docsGuideDesc },
        { key: 'docsGuideCard1Title', value: docsGuideCard1Title },
        { key: 'docsGuideCard1Desc', value: docsGuideCard1Desc },
        { key: 'docsGuideCard2Title', value: docsGuideCard2Title },
        { key: 'docsGuideCard2Desc', value: docsGuideCard2Desc },
        { key: 'bgAchievements', value: bgAchievements },
        { key: 'stat1Number', value: stat1Num },
        { key: 'stat1Label', value: stat1Lab },
        { key: 'stat2Number', value: stat2Num },
        { key: 'stat2Label', value: stat2Lab },
        { key: 'stat3Number', value: stat3Num },
        { key: 'stat3Label', value: stat3Lab },
        { key: 'scholarshipsList', value: scholarshipsList, deletedIds: deletedScholarshipIds },
        { key: 'achievementsEliteList', value: achievementsEliteList },
        { key: 'deletedSeedEliteIds', value: deletedSeedEliteIds },
        { key: 'homeFeaturedSeedIds', value: homeFeaturedSeedIds },
        { key: 'homeTestimonial', value: { name: testimonialName, quote: testimonialQuote } },
        { key: 'glanceStat1Value', value: glanceStat1Value },
        { key: 'glanceStat1Label', value: glanceStat1Label },
        { key: 'glanceStat2Value', value: glanceStat2Value },
        { key: 'glanceStat2Label', value: glanceStat2Label },
        { key: 'glanceStat3Value', value: glanceStat3Value },
        { key: 'glanceStat3Label', value: glanceStat3Label },
        { key: 'glanceStat4Value', value: glanceStat4Value },
        { key: 'glanceStat4Label', value: glanceStat4Label },
        { key: 'aboutPageImages', value: aboutPageImages }
      ];

      await updatePortalSettings(updates);
      // ذخیره موفق شد، پس id هایی که حذف شده بودند دیگر در دیتابیس نیستند —
      // ردیاب حذف صریح را خالی می‌کنیم تا در ذخیره‌ی بعدی دوباره ارسال نشوند.
      setDeletedScholarshipIds([]);

      const freshSnapshot = {
        globalAddress: address,
        announcement,
        announcementEnabled,
        mainHeroImage,
        heroStat1Number, heroStat1Label, heroStat2Number, heroStat2Label, heroStat3Number, heroStat3Label,
        heroHoursWeekday, heroHoursFriday,
        hallStat1Number, hallStat1Label, hallStat2Number, hallStat2Label,
        hallStat3Number, hallStat3Label, hallStat3Hint, hallStat4Number, hallStat4Label,
        bgLounge, loungePhone, loungePhone2, loungeTelegram, loungeFacebook, loungeInstagram,
        priceDaily, priceMonthly, priceAdmission, rule1, rule2,
        deletedSeedRuleIds, hallRulesList: legacyHallRulesList, hallRulesUnified, deletedSeedFaqIds, hallFaqList,
        loungeGalleryImages,
        bgServices, servicesPhone, servicesTelegram, servicesFacebook, servicesInstagram, servicesPhone2,
        deletedSeedServicesFaqIds: legacyDeletedSeedServicesFaqIds, servicesFaqList: legacyServicesFaqList, servicesFaqUnified, servicesPlansList, servicesFeaturedSeedIds,
        bgScholarships, bgAchievements,
        docsGuideTitle, docsGuideDesc, docsGuideCard1Title, docsGuideCard1Desc, docsGuideCard2Title, docsGuideCard2Desc,
        stat1Number: stat1Num, stat1Label: stat1Lab,
        stat2Number: stat2Num, stat2Label: stat2Lab,
        stat3Number: stat3Num, stat3Label: stat3Lab,
        scholarshipsList,
        achievementsEliteList,
        deletedSeedEliteIds,
        homeFeaturedSeedIds,
        homeTestimonial: { name: testimonialName, quote: testimonialQuote },
        glanceStat1Value, glanceStat1Label,
        glanceStat2Value, glanceStat2Label,
        glanceStat3Value, glanceStat3Label,
        glanceStat4Value, glanceStat4Label,
        aboutPageImages
      };

      setAdminPortalData(freshSnapshot);
      // === رفع باگ گزارش‌شده (بخش ۱۱) ===
      // همان دیتای تازه، بلافاصله در Context مشترک هم اعمال می‌شود تا اگر
      // کاربر بدون رفرش کامل به صفحات عمومی برود (که از همین Context با
      // usePortal() می‌خوانند)، بلافاصله نتیجه‌ی به‌روز را ببیند.
      setSharedPortalData(freshSnapshot);

      setSaveToast({
        type: 'success',
        message: '🚀 پایگاه داده ابری آپدیت شد! تمام مبالغ فاکتور، لوایح، تصاویر و شماره‌های اختصاصی با موفقیت در دیتابیس Supabase ذخیره شدند.',
      });
    } catch (error) {
      setSaveToast({ type: 'error', message: 'خطا در ذخیره ابری: ' + error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // === تاریخچه (بخش ۱۶/۱۷) ===
  // در دو مرحله‌ی قبلی، درخواست‌های مشاوره (consultation) و بورسیه
  // (scholarship-consulting) اول از صف عمومی جدا و مستقل مدیریت شدند
  // («🎓 مدیریت اختصاصی دپارتمان خدمات تحصیلی»)، سپس به‌طور کامل از صف
  // عمومی حذف شدند تا فقط همان‌جا دیده شوند.
  // === فاز ۳ دور سوم دیباگ: بازگشت به نمایش دوگانه ===
  // طبق درخواست صریح کاربر، این رفتار دوباره عوض شد: این درخواست‌ها اکنون
  // باید هم در صف عمومی (پنل ارشد) هم در پنل مجزای دپارتمان خدمات تحصیلی
  // (ServicesAdminDashboard.jsx) دیده شوند — چون یک ادمین ارشد هم باید
  // بتواند کل صف را یک‌جا مرور کند. servicesPendingForms برای بخش «🎓
  // مدیریت اختصاصی دپارتمان خدمات تحصیلی» همین‌جا و برای پنل جدید هردو
  // استفاده می‌شود؛ generalPendingForms دیگر چیزی را حذف نمی‌کند (پایین‌تر).
  const servicesPendingForms = pendingForms.filter(
    (form) => form.type === 'consultation' || form.type === 'scholarship-consulting'
  );
  // === فاز ۳ دور سوم دیباگ: نمایش دوگانه درخواست‌های دپارتمان خدمات تحصیلی ===
  // قبلاً این‌جا یک فیلتر معکوس بود که consultation/scholarship-consulting
  // را از صف عمومی حذف می‌کرد؛ طبق درخواست صریح کاربر، این درخواست‌ها
  // اکنون باید هم در پنل ارشد (همین‌جا) هم در پنل مجزای دپارتمان خدمات
  // تحصیلی (ServicesAdminDashboard.jsx) دیده شوند — نه فقط در یکی. حذف
  // این فیلتر اثر جانبی مفیدی هم دارد: زیرگروه «🎓 مربوط به خدمات
  // تحصیلی/بورسیه» در REQUEST_SUBGROUPS (بالای فایل) تا امروز همیشه ۰
  // مورد نشان می‌داد، دقیقاً چون همین فیلتر از قبل این نوع درخواست‌ها را
  // از generalPendingForms حذف کرده بود؛ اکنون آن زیرگروه هم درست پر
  // می‌شود. تایید/حذف یک درخواست از هرکدام از دو پنل، بلافاصله در جدول
  // واقعی portal_requests اعمال می‌شود؛ پنل دیگر با بارگذاری/رفرش بعدی
  // آن را می‌بیند.
  const generalPendingForms = pendingForms;

  // === فاز ۲ دور سوم دیباگ: کار ۱ — گروه‌بندی درختی درخواست‌های صفحه «عمومی» ===
  // هیچ فیلتر جدیدی روی داده‌ی خام اضافه نشد؛ فقط همان generalPendingForms/
  // archivedForms موجود، برای نمایش، بر اساس REQUEST_SUBGROUPS به ۴ دسته
  // تقسیم می‌شوند. مقدار و ترتیب آیتم‌های داخل هر گروه دقیقاً همان است.
  const pendingRequestGroups = REQUEST_SUBGROUPS.map((group) => ({
    ...group,
    items: generalPendingForms.filter((form) => group.match(form.type)),
  }));
  const archivedRequestGroups = REQUEST_SUBGROUPS.map((group) => ({
    ...group,
    items: archivedForms.filter((form) => group.match(form.type)),
  }));

  // === فاز ۲ دور سوم دیباگ: همان JSX دقیق قبلیِ هر کارت درخواست/آرشیو، فقط
  // به یک تابع رندر منتقل شد تا هم در حالت تخت (در صورت نیاز) هم داخل هر
  // زیرگروه قابل استفاده باشد — بدون هیچ تغییری در منطق یا دکمه‌ها. ===
  const renderPendingRequestCard = (form) => {
    const contactIsEmail = isEmailContact(form.phone);
    const isAchievement = form.type === 'achievement_submission';
    const whatsappHref = !contactIsEmail && form.phone ? `https://wa.me/${formatWhatsappNumber(form.phone)}` : null;
    const detailLines = getRequestDetailLines(form).filter((line) => line.value);
    return (
      <div key={form.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', gap: '12px' }}>
        <div style={{ textAlign: 'right', minWidth: '220px', flex: 1 }}>
          <div style={{ marginBottom: '6px' }}>
            <span style={typeBadgeStyle('#e2e3e5', '#383d41')}>{getRequestTypeLabel(form.type)}</span>
          </div>
          <strong style={{ fontSize: '14px', color: '#112a1d' }}>
            {form.name}
            {form.phone && (
              <span style={{ fontWeight: '500', color: '#555' }}>
                {' '}
                ({contactIsEmail ? '📧' : '📞'}{' '}
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{ color: '#128C7E', textDecoration: 'underline' }}>
                    <bdi dir="ltr">{form.phone}</bdi>
                  </a>
                ) : (
                  <bdi dir="ltr">{form.phone}</bdi>
                )})
              </span>
            )}
          </strong>
          {detailLines.length > 0 ? (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {detailLines.map((line) => (
                <span key={line.label} style={{ fontSize: '12px', color: '#333', lineHeight: '1.7' }}>
                  {line.icon} {line.label}: <strong style={{ fontWeight: '700' }}>{line.value}</strong>
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12.5px', color: '#555', margin: '4px 0 0 0', fontWeight: '500' }}>{form.summary}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {contactIsEmail ? (
            <button type="button" onClick={() => openEmailContact(form.phone, form.summary)} style={{ padding: '6px 14px', backgroundColor: '#c53030', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>📧 ارسال ایمیل</button>
          ) : (
            <button type="button" onClick={() => openWhatsapp(form.phone)} style={{ padding: '6px 14px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>💬 باز کردن واتساپ</button>
          )}
          <button type="button" onClick={() => handleApproveRequest(form)} style={{ padding: '6px 14px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
            {isAchievement ? '✅ تایید و افزودن به تالار افتخارات' : '✔️ تایید و آرشیو'}
          </button>
          <button type="button" onClick={() => handleReview(form.id, 'rejected')} style={{ padding: '6px 14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>حذف درخواست</button>
        </div>
      </div>
    );
  };

  const renderArchivedRequestCard = (form) => {
    const contactIsEmail = isEmailContact(form.phone);
    const isApproved = form.status === 'approved';
    const submittedDate = form.created_at ? new Date(form.created_at).toLocaleDateString('fa-IR') : '';
    const detailLines = getRequestDetailLines(form).filter((line) => line.value);
    return (
      <div key={form.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', gap: '10px', opacity: 0.85 }}>
        <div style={{ textAlign: 'right', flex: 1, minWidth: '220px' }}>
          <div style={{ marginBottom: '6px' }}>
            <span style={typeBadgeStyle('#e2e3e5', '#383d41')}>{getRequestTypeLabel(form.type)}</span>
            <span style={typeBadgeStyle(isApproved ? '#eafaf1' : '#fdecea', isApproved ? '#1b4332' : '#7a1f27')}>
              {isApproved ? '✔️ تاییدشده' : '🗑 حذف‌شده'}
            </span>
          </div>
          <strong style={{ fontSize: '13.5px', color: '#112a1d' }}>
            {form.name}
            {form.phone && (
              <span style={{ fontWeight: '500', color: '#555' }}>
                {' '}
                ({contactIsEmail ? '📧' : '📞'} <bdi dir="ltr">{form.phone}</bdi>)
              </span>
            )}
          </strong>
          {submittedDate && <span style={{ fontSize: '11.5px', color: '#999', marginRight: '8px' }}>— {submittedDate}</span>}
          {detailLines.length > 0 ? (
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {detailLines.map((line) => (
                <span key={line.label} style={{ fontSize: '11.5px', color: '#333', lineHeight: '1.7' }}>
                  {line.icon} {line.label}: <strong style={{ fontWeight: '700' }}>{line.value}</strong>
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#555', margin: '4px 0 0 0', fontWeight: '500' }}>{form.summary}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: "'Vazirmatn', 'Segoe UI', Tahoma, sans-serif", backgroundColor: '#f4f6f9', height: '100vh', overflow: 'hidden', display: 'flex', margin: 0, padding: 0 }}>
      {/* کیفریم‌های اسپینر دکمه ذخیره و ورود نرم نوار پیام؛ چون این فایل
          صرفاً از inline style استفاده می‌کند، تنها راه تعریف یک انیمیشن
          چرخشی همین یک بار تزریق <style> است. */}
      <style>{`
        @keyframes pj-spin { to { transform: rotate(360deg); } }
        @keyframes pj-toast-in { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {saveToast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            maxWidth: '560px',
            width: 'calc(100% - 32px)',
            backgroundColor: saveToast.type === 'success' ? '#eafaf1' : saveToast.type === 'error' ? '#fdecea' : '#eaf2fb',
            border: `1px solid ${saveToast.type === 'success' ? '#2d6a4f' : saveToast.type === 'error' ? '#dc3545' : '#2b6cb0'}`,
            color: saveToast.type === 'success' ? '#1b4332' : saveToast.type === 'error' ? '#7a1f27' : '#1a3b5c',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: '600',
            lineHeight: '1.8',
            animation: 'pj-toast-in 0.25s ease-out',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
            {saveToast.type === 'success' ? '✅' : saveToast.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span style={{ flex: 1 }}>{saveToast.message}</span>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            aria-label="بستن پیام"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', color: 'inherit', fontWeight: '800', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* سایدبار لوکس، فلت و سازمانی کنترل پنل ارشد پورتال پژوهش */}
      <aside style={{ width: window.innerWidth < 768 ? '80px' : '260px', backgroundColor: '#112a1d', color: '#fff', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1px solid #2d6a4f' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid #2d6a4f', paddingBottom: '16px', marginBottom: '10px' }}>
          <span style={{ fontSize: '32px' }}>👑</span>
          <h3 style={{ margin: '8px 0 0 0', fontSize: '16px', fontWeight: '800', display: window.innerWidth < 768 ? 'none' : 'block' }}>کنترل پنل ارشد</h3>
          <span style={{ fontSize: '11px', color: '#b7e4c7', fontWeight: '500', display: window.innerWidth < 768 ? 'none' : 'block' }}>مجتمع آموزشی پژوهش</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '12px', backgroundColor: '#2d6a4f', borderRadius: '6px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📝</span> <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>تنظیمات استاندارد</span>
          </div>
          <a href="/" style={{ padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontWeight: '500', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌐</span> <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>مشاهده سایت اصلی</span>
          </a>
          <button
            type="button"
            onClick={logout}
            style={{ padding: '12px', color: '#fff', backgroundColor: 'transparent', border: '1px solid #dc3545', textDecoration: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' }}
          >
            <span>🚪</span> <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>خروج از حساب</span>
          </button>
        </div>
      </aside>

      {/* محتوای مرکزی داشبورد */}
      <main style={{ flex: 1, padding: window.innerWidth < 768 ? '16px' : '32px', overflowY: 'auto', direction: 'ltr' }}>
        <div style={{ direction: 'rtl' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef', position: 'relative' }}>
            <h2 style={{ margin: 0, fontSize: window.innerWidth < 768 ? '16px' : '20px', fontWeight: '800', color: '#112a1d' }}>⚙️ سیستم مدیریت محتوای همه‌جانبه و تفکیک‌شده پورتال</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', backgroundColor: '#eafaf1', color: '#2d6a4f', padding: '6px 12px', borderRadius: '20px', fontWeight: '700', display: window.innerWidth < 768 ? 'none' : 'inline-block' }}>نسخه نهایی تجاری</span>
              {/* === فاز ۲ دور سوم دیباگ: منوی کشویی ۷گانه ناوبری === */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsNavMenuOpen((open) => !open)}
                  aria-haspopup="true"
                  aria-expanded={isNavMenuOpen}
                  aria-label="منوی بخش‌های پنل"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    backgroundColor: isNavMenuOpen ? '#eafaf1' : '#f8f9fa',
                    color: '#112a1d',
                    fontSize: '20px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ⋮
                </button>
                {isNavMenuOpen && (
                  <>
                    {/* لایه‌ی شفاف پشت منو، فقط برای بستن با کلیک بیرون */}
                    <div
                      onClick={() => setIsNavMenuOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      aria-hidden="true"
                    />
                    <div
                      role="menu"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        /* === رفع باگ گزارش‌شده: منو از سمت چپ صفحه بیرون می‌زد ===
                           چون هدر خودش display:flex است و direction:rtl را از
                           والد به ارث می‌برد، ترتیب بصری فرزندانش برعکس
                           می‌شود — یعنی این دکمه‌ی ⋮ در عمل نزدیک لبه‌ی چپ
                           هدر رندر می‌شود، نه راست. لنگر کردن منو با right:0
                           باعث می‌شد این باکس ۲۶۰ پیکسلی از همان لبه‌ی چپِ
                           دکمه، باز هم به چپ (بیرون از صفحه) کشیده شود. با
                           left:0 منو از همان‌جا به سمت راست (داخل صفحه) باز
                           می‌شود و همیشه کامل دیده می‌شود. */
                        left: 0,
                        width: 'min(260px, calc(100vw - 24px))',
                        maxHeight: 'min(70vh, 400px)',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        backgroundColor: '#fff',
                        border: '1px solid #e9ecef',
                        borderRadius: '10px',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.16)',
                        zIndex: 50,
                      }}
                    >
                      {NAV_ITEMS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setActivePage(item.key);
                            setIsNavMenuOpen(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '13px 16px',
                            border: 'none',
                            borderBottom: '1px solid #f4f6f9',
                            backgroundColor: activePage === item.key ? '#eafaf1' : '#fff',
                            color: activePage === item.key ? '#1b4332' : '#112a1d',
                            fontFamily: 'inherit',
                            fontSize: '13px',
                            fontWeight: activePage === item.key ? '800' : '600',
                            cursor: 'pointer',
                            textAlign: 'right',
                          }}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* تنظیمات عمومی پورتال و اعلانات زنده سقف — فقط صفحه «عمومی» */}
            {activePage === 'general' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>📢 تنظیمات عمومی پورتال و نوار اعلانات متحرک سقف</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>
                    <span>متن نوار اعلانات متحرک زنده (سقف کل صفحات):</span>
                    {/* === اضافه (رفع باگ گزارش‌شده): تیک نمایش/عدم‌نمایش نوار اعلان === */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '12px', color: announcementEnabled ? '#2d6a4f' : '#888', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={announcementEnabled}
                        onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                        style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                      />
                      نمایش نوار اعلان
                    </span>
                  </label>
                  <input type="text" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>آدرس فیزیکی دفاتر مجتمع پژوهش (فوتر کل سایت):</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
            )}

            {/* تصویر هیروی صفحه اصلی (mainHeroImage) — منتقل‌شده به صفحه «صفحه اصلی» (فقط چیدمان، همان state) */}
            {activePage === 'home' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🖼️ تصویر هیروی صفحه اصلی</h4>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>🖼️ تصویر هیروی صفحه اصلی (mainHeroImage):</label>
              <ImageUploader currentUrl={mainHeroImage} onUploadComplete={(url) => setMainHeroImage(url)} label="هیروی صفحه اصلی" />
              <SizeHint text="حداقل ۱۲۰۰×۱۴۰۰، عمودی (۴:۵)" />
            </div>
            )}

            {/* === جدید (بخش ۹): هیروی صفحه اصلی — آمار سه‌گانه و ساعات کاری نمایشی — صفحه «صفحه اصلی» === */}
            {activePage === 'home' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🏠 هیروی صفحه اصلی (آمار سه‌گانه و ساعات کاری زیر عکس)</h4>
              <p style={{ fontSize: '12px', color: '#666', margin: '10px 0 16px 0' }}>
                همان سه آمار بالای صفحه اصلی (اعزام موفق محصلین، ظرفیت فعلی سالن، کشور مقصد) و کپشن دو
                خطی ساعات کاری زیر عکس هیرو. این‌ها جدا از آمار مشابه در صفحه «دستاوردها» هستند.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>🎓 آمار اول (اعزام موفق محصلین)</span>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>عدد/مقدار:</label>
                  <input type="text" value={heroStat1Number} onChange={(e) => setHeroStat1Number(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>توضیح زیر آن:</label>
                  <input type="text" value={heroStat1Label} onChange={(e) => setHeroStat1Label(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>📖 آمار دوم (ظرفیت فعلی سالن)</span>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>عدد/مقدار:</label>
                  <input type="text" value={heroStat2Number} onChange={(e) => setHeroStat2Number(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>توضیح زیر آن:</label>
                  <input type="text" value={heroStat2Label} onChange={(e) => setHeroStat2Label(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ backgroundColor: '#fffbea', padding: '14px', borderRadius: '8px', border: '1px solid #f0e3ad' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#7a5c00', display: 'block', marginBottom: '10px' }}>🌍 آمار سوم (کشور مقصد)</span>
                  <p style={{ fontSize: '11px', color: '#7a5c00', margin: '0 0 8px 0' }}>
                    توصیه: به‌جای یک عدد ثابت (که با اضافه‌شدن هر بورسیه جدید منسوخ می‌شود)، از عبارتی
                    مثل «بدون مرز» استفاده کنید؛ مگر بخواهید خودتان دستی به‌روزش کنید.
                  </p>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>عدد/مقدار:</label>
                  <input type="text" value={heroStat3Number} onChange={(e) => setHeroStat3Number(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>توضیح زیر آن:</label>
                  <input type="text" value={heroStat3Label} onChange={(e) => setHeroStat3Label(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>🕗 ساعات کاری — خط اول (شنبه تا پنج‌شنبه):</label>
                  <input type="text" value={heroHoursWeekday} onChange={(e) => setHeroHoursWeekday(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>🕗 ساعات کاری — خط دوم (جمعه‌ها):</label>
                  <input type="text" value={heroHoursFriday} onChange={(e) => setHeroHoursFriday(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
            )}

            {/* ۱. تنظیمات اختصاصی دپارتمان سالن مطالعه و کتابخانه — فقط صفحه «سالن مطالعه» */}
            {activePage === 'lounge' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>📖 مدیریت اختصاصی دپارتمان سالن مطالعه و کتابخانه</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>تصویر پس‌زمینه هدر سالن مطالعه:</label>
                    <ImageUploader currentUrl={bgLounge} onUploadComplete={(url) => setBgLounge(url)} label="پس‌زمینه سالن مطالعه" />
                    <SizeHint text="حداقل ۱۹۲۰×۸۰۰، افقی عریض" />
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>📞 شماره تلفن اول سالن — همین شماره در دکمه‌های «تماس/واتساپ» صفحه اصلی، سالن، دستاوردها و درباره ما (بخش فعال‌سازی عضویت) و هم به‌عنوان شماره اول در فوتر این صفحات استفاده می‌شود:</label>
                    <input type="text" value={loungePhone} onChange={(e) => setLoungePhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>📞 شماره تلفن دوم سالن (اختیاری) — فقط در فوتر صفحه اصلی/سالن/دستاوردها/درباره ما، کنار شماره اول نمایش داده می‌شود؛ در هیچ دکمه تماس/واتساپ استفاده نمی‌شود:</label>
                    <input type="text" value={loungePhone2} onChange={(e) => setLoungePhone2(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک تلگرام اختصاصی سالن مطالعه:</label>
                    <input type="text" value={loungeTelegram} onChange={(e) => setLoungeTelegram(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک فیسبوک اختصاصی سالن مطالعه:</label>
                    <input type="text" value={loungeFacebook} onChange={(e) => setLoungeFacebook(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                  {/* === اضافه (رفع باگ گزارش‌شده): لینک اینستاگرام سالن مطالعه === */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک اینستاگرام اختصاصی سالن مطالعه:</label>
                    <input type="text" value={loungeInstagram} onChange={(e) => setLoungeInstagram(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>💵 نرخ عضویت روزانه (افغانی):</label>
                    <input type="number" value={priceDaily} onChange={(e) => setPriceDaily(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 'bold' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>💵 نرخ عضویت ماهانه (افغانی):</label>
                    <input type="number" value={priceMonthly} onChange={(e) => setPriceMonthly(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 'bold' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>حق‌الداخله دوسیه ماه اول (افغانی):</label>
                    <input type="number" value={priceAdmission} onChange={(e) => setPriceAdmission(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 'bold' }} />
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '12px' }}>
                  <p style={{ fontSize: '11.5px', color: '#666', margin: 0 }}>
                    📜 مدیریت قوانین سالن و ❓ سوالات پرتکرار به یک بخش اختصاصی جدید («📖➕ صفحه اختصاصی سالن مطالعه»، پایین همین صفحه) منتقل شد تا همه‌ی کنترل‌های صفحه سالن مطالعه یک‌جا باشند.
                  </p>
                </div>

                {/* گالری عکس‌های واقعی سالن مطالعه (جدید) */}
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '700', fontSize: '13px' }}>🖼️ گالری عکس‌های واقعی سالن مطالعه (loungeGalleryImages):</label>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef', marginBottom: '14px' }}>
                    <span style={{ fontSize: '12.5px', color: '#666', display: 'block', marginBottom: '8px' }}>➕ افزودن عکس جدید به گالری:</span>
                    <ImageUploader
                      onUploadComplete={(url) => setLoungeGalleryImages((prev) => [...prev, url])}
                      label="عکس گالری سالن مطالعه"
                    />
                    <SizeHint text="حداقل ۱۰۰۰×۷۵۰، افقی (۴:۳)" />
                  </div>
                  {loungeGalleryImages.length === 0 ? (
                    <p style={{ fontSize: '12.5px', color: '#999', margin: 0 }}>هنوز عکسی به گالری اضافه نشده است.</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {loungeGalleryImages.map((imgUrl, idx) => (
                        <div key={`${imgUrl}-${idx}`} style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e9ecef' }}>
                          <img src={imgUrl} alt={`گالری سالن ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => setLoungeGalleryImages((prev) => prev.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: '2px', left: '2px', width: '20px', height: '20px', borderRadius: '50%', border: 'none', backgroundColor: '#dc3545', color: '#fff', fontSize: '11px', cursor: 'pointer', lineHeight: 1, fontFamily: 'inherit' }}
                            title="حذف عکس"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* === جدید (بخش ۱۰): صفحه اختصاصی سالن مطالعه — آمار هیرو، قوانین و سوالات متداول — فقط صفحه «سالن مطالعه» === */}
            {activePage === 'lounge' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>📖➕ صفحه اختصاصی سالن مطالعه (آمار هیرو، قوانین و سوالات متداول)</h4>

              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>آمار چهارگانه هیروی صفحه سالن (ساعات کاری همین بالا از فیلد مشترک با صفحه اصلی خوانده می‌شود)</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>📅 آمار اول (روز هفته باز)</span>
                  <input type="text" value={hallStat1Number} onChange={(e) => setHallStat1Number(e.target.value)} placeholder="عدد" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <input type="text" value={hallStat1Label} onChange={(e) => setHallStat1Label(e.target.value)} placeholder="توضیح" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>🕐 آمار دوم (ساعت کاری روزانه)</span>
                  <input type="text" value={hallStat2Number} onChange={(e) => setHallStat2Number(e.target.value)} placeholder="عدد" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <input type="text" value={hallStat2Label} onChange={(e) => setHallStat2Label(e.target.value)} placeholder="توضیح" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ backgroundColor: '#f4fbf7', padding: '14px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>🪪 آمار سوم (نوع عضویت)</span>
                  <input type="text" value={hallStat3Number} onChange={(e) => setHallStat3Number(e.target.value)} placeholder="عدد" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <input type="text" value={hallStat3Label} onChange={(e) => setHallStat3Label(e.target.value)} placeholder="توضیح" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: '#2d6a4f', fontWeight: '700' }}>متن کوچک هنگام هاور موس روی این آمار:</label>
                  <input type="text" value={hallStat3Hint} onChange={(e) => setHallStat3Hint(e.target.value)} placeholder="مثلاً: عضویت روزانه و ماهانه" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>🚻 آمار چهارم (بخش خانم/آقا)</span>
                  <input type="text" value={hallStat4Number} onChange={(e) => setHallStat4Number(e.target.value)} placeholder="عدد" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <input type="text" value={hallStat4Label} onChange={(e) => setHallStat4Label(e.target.value)} placeholder="توضیح" style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '4px' }}>📜 مدیریت یکپارچه قوانین سالن</span>
                <p style={{ fontSize: '11.5px', color: '#666', margin: '0 0 12px 0' }}>
                  همه‌ی قوانین — چه از قبل روی سایت بوده‌اند چه تازه اضافه کرده‌اید — همین‌جا و همگی به یک شکل قابل‌ویرایش مستقیم متن، جابه‌جایی‌ناپذیر ولی حذف‌شدنی هستند. برای تغییر متن هر قانون، مستقیماً داخل باکس آن تایپ کنید؛ تغییرات با «ذخیره آنی» پایین صفحه ثبت می‌شوند.
                </p>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #ced4da', marginBottom: '12px' }}>
                  {hallRulesUnified.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>هیچ قانونی ثبت نشده است.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {hallRulesUnified.map((r, idx) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ flexShrink: 0, width: '22px', textAlign: 'center', fontSize: '11.5px', fontWeight: '700', color: '#2d6a4f' }}>{idx + 1}.</span>
                          <input
                            type="text"
                            value={r.text}
                            onChange={(e) => handleUpdateHallRuleText(r.id, e.target.value)}
                            style={{ flex: 1, minWidth: '160px', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px' }}
                          />
                          <button type="button" onClick={() => handleRemoveHallRuleUnified(r.id)} style={{ flexShrink: 0, padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: '#f4fbf7', padding: '14px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '8px' }}>➕ افزودن قانون جدید نامحدود</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input type="text" value={newRuleText} onChange={(e) => setNewRuleText(e.target.value)} placeholder="متن قانون جدید را بنویسید" style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    <button type="button" onClick={handleAddHallRuleUnified} style={{ padding: '10px 18px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>افزودن</button>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '10px' }}>❓ مدیریت کامل سوالات پرتکرار سالن</span>
                <div style={{ backgroundColor: '#fffbea', padding: '14px', borderRadius: '8px', border: '1px solid #f0e3ad', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#7a5c00', display: 'block', marginBottom: '4px' }}>📌 ۳ سوال پیش‌فرض سایت</span>
                  <p style={{ fontSize: '11.5px', color: '#7a5c00', margin: '0 0 10px 0' }}>
                    این‌ها از قبل در کد سایت نوشته شده‌اند. هر کدام را می‌توانید پنهان یا دوباره آشکار کنید.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {SEED_HALL_FAQ.map((f) => {
                      const isHidden = deletedSeedFaqIds.includes(f.id);
                      return (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', backgroundColor: '#fff', border: '1px solid #f0e3ad', borderRadius: '6px', flexWrap: 'wrap', gap: '10px', opacity: isHidden ? 0.6 : 1 }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#112a1d' }}>
                            {f.q} {isHidden && <em style={{ color: '#999', fontWeight: '500' }}>— پنهان است</em>}
                          </span>
                          <button type="button" onClick={() => handleToggleSeedFaq(f.id)} style={{ padding: '5px 12px', backgroundColor: isHidden ? '#495057' : '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>
                            {isHidden ? '↩️ بازگرداندن' : '🗑 پنهان کردن'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #ced4da' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '8px' }}>➕ افزودن سوال و پاسخ جدید نامحدود</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <input type="text" value={newFaqQuestion} onChange={(e) => setNewFaqQuestion(e.target.value)} placeholder="متن سوال" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    <textarea value={newFaqAnswer} onChange={(e) => setNewFaqAnswer(e.target.value)} placeholder="متن پاسخ" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', height: '55px', resize: 'vertical' }} />
                    <button type="button" onClick={handleAddHallFaq} style={{ padding: '10px 18px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>افزودن سوال</button>
                  </div>
                  {hallFaqList.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>هنوز سوال اضافه‌ای ثبت نشده است.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {hallFaqList.map((f) => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '6px', flexWrap: 'wrap', gap: '10px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#112a1d' }}>{f.q}</span>
                          <button type="button" onClick={() => handleRemoveHallFaq(f.id)} style={{ padding: '5px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* ۲. تنظیمات اختصاصی دپارتمان خدمات تحصیلی و مشاوره‌های تخصصی — فقط صفحه «خدمات تحصیلی» */}
            {activePage === 'services' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🎓 مدیریت اختصاصی دپارتمان خدمات تحصیلی و مشاوره</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* === جدید (بخش ۱۶): درخواست‌های مشاوره ثبت‌شده از فرم همین صفحه === */}
                {/* قبلاً این درخواست‌ها (type: 'consultation') در «تالار بررسی
                    عمومی» پایین صفحه، قاطی با ثبت‌نام سالن/دستاورد/همکاری
                    نمایش داده می‌شدند. چون مستقیماً به همین دپارتمان تعلق
                    دارند، اکنون همین‌جا، مستقل از صف عمومی، مدیریت می‌شوند. */}
                <div style={{ borderBottom: '1px dashed #e9ecef', paddingBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '8px' }}>📥 درخواست‌های مشاوره ثبت‌شده از فرم همین صفحه</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {isLoadingRequests && <p style={{ textAlign: 'center', fontSize: '12.5px' }}>در حال دریافت درخواست‌ها…</p>}
                    {servicesPendingForms.map((form) => {
                      const contactIsEmail = isEmailContact(form.phone);
                      // === اضافه (بخش ۱۷): شماره تماس مستقیماً لینک واتساپ ===
                      // علاوه بر دکمه‌ی سبز «باز کردن واتساپ»، خودِ شماره
                      // نمایش داده‌شده هم یک لینک مستقیم wa.me است تا ادمین
                      // بتواند مستقیم با کلیک روی شماره به واتساپ کاربر برود.
                      const whatsappHref = !contactIsEmail ? `https://wa.me/${formatWhatsappNumber(form.phone)}` : null;
                      const detailLines = getRequestDetailLines(form).filter((line) => line.value);
                      return (
                        <div key={form.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', gap: '12px' }}>
                          <div style={{ textAlign: 'right', minWidth: '220px', flex: 1 }}>
                            <div style={{ marginBottom: '6px' }}>
                              <span style={typeBadgeStyle('#eaf2fb', '#1a3b5c')}>{getRequestTypeLabel(form.type)}</span>
                            </div>
                            <strong style={{ fontSize: '14px', color: '#112a1d' }}>
                              {form.name}{' '}
                              <span style={{ fontWeight: '500', color: '#555' }}>
                                ({contactIsEmail ? '📧' : '📞'}{' '}
                                {whatsappHref ? (
                                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{ color: '#128C7E', textDecoration: 'underline' }}>
                                    <bdi dir="ltr">{form.phone}</bdi>
                                  </a>
                                ) : (
                                  <bdi dir="ltr">{form.phone}</bdi>
                                )})
                              </span>
                            </strong>
                            {/* === اضافه (بخش ۱۸): نمایش کامل و خوانای جزئیات فرم === */}
                            {/* دیگر فقط summary خام (که گاهی کد انگلیسی فرم بود، نه
                                برچسب فارسی) نشان داده نمی‌شود؛ همه‌ی فیلدهای واقعی
                                فرم با برچسب کامل فارسی، دقیقاً مثل پنل بورسیه‌ها. */}
                            {detailLines.length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {detailLines.map((line) => (
                                  <span key={line.label} style={{ fontSize: '12px', color: '#333', lineHeight: '1.7' }}>
                                    {line.icon} {line.label}: <strong style={{ fontWeight: '700' }}>{line.value}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {contactIsEmail ? (
                              <button type="button" onClick={() => openEmailContact(form.phone, form.summary)} style={{ padding: '6px 14px', backgroundColor: '#c53030', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>📧 ارسال ایمیل</button>
                            ) : (
                              <button type="button" onClick={() => openWhatsapp(form.phone)} style={{ padding: '6px 14px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>💬 باز کردن واتساپ</button>
                            )}
                            <button type="button" onClick={() => handleApproveRequest(form)} style={{ padding: '6px 14px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>✔️ تایید و آرشیو</button>
                            <button type="button" onClick={() => handleReview(form.id, 'rejected')} style={{ padding: '6px 14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>حذف درخواست</button>
                          </div>
                        </div>
                      );
                    })}
                    {servicesPendingForms.length === 0 && !isLoadingRequests && (
                      <p style={{ fontSize: '12.5px', color: '#2d6a4f', textAlign: 'center', margin: '6px 0', fontWeight: '700' }}>✨ هیچ درخواست معلقی برای این دپارتمان وجود ندارد.</p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>تصویر پس‌زمینه هدر خدمات تحصیلی:</label>
                    <ImageUploader currentUrl={bgServices} onUploadComplete={(url) => setBgServices(url)} label="پس‌زمینه خدمات تحصیلی" />
                    <SizeHint text="حداقل ۱۹۲۰×۸۰۰، افقی عریض" />
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>📞 شماره تلفن مستقیم نوبت‌دهی مشاوره تحصیلی:</label>
                    <input type="text" value={servicesPhone} onChange={(e) => setServicesPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک تلگرام اختصاصی دپارتمان مشاوره:</label>
                    <input type="text" value={servicesTelegram} onChange={(e) => setServicesTelegram(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک فیسبوک اختصاصی دپارتمان مشاوره:</label>
                    <input type="text" value={servicesFacebook} onChange={(e) => setServicesFacebook(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                  {/* === اضافه (رفع باگ گزارش‌شده): لینک اینستاگرام دپارتمان مشاوره === */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک اینستاگرام اختصاصی دپارتمان مشاوره:</label>
                    <input type="text" value={servicesInstagram} onChange={(e) => setServicesInstagram(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>📞 تلفن پشتیبانی دوسیه‌سازی و انگیزه‌نامه بورسیه (مرکز ۲):</label>
                  <input type="text" value={servicesPhone2} onChange={(e) => setServicesPhone2(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                </div>

                {/* === جدید (بخش ۱۵): مدیریت یکپارچه پلن‌ها/پکیج‌های تعرفه === */}
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '4px' }}>💳 مدیریت یکپارچه پلن‌ها و تعرفه‌های مشاوره</span>
                  <p style={{ fontSize: '11.5px', color: '#666', margin: '0 0 12px 0' }}>
                    همه‌ی پکیج‌ها — چه از قبل روی سایت بوده‌اند چه تازه اضافه کرده‌اید — همین‌جا و همگی به یک شکل قابل‌ویرایش مستقیم (نام، توضیح، برجسته‌بودن) و حذف‌شدنی‌اند. تیک «برجسته» یعنی همان پکیجی که با حاشیه‌ی پررنگ سبز روی سایت متمایز نمایش داده می‌شود.
                  </p>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #ced4da', marginBottom: '12px' }}>
                    {servicesPlansList.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>هیچ پکیجی ثبت نشده است.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {servicesPlansList.map((p) => (
                          <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => handleUpdateServicesPlan(p.id, 'name', e.target.value)}
                              placeholder="نام پکیج"
                              style={{ flex: '1 1 200px', minWidth: '160px', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: '700' }}
                            />
                            <input
                              type="text"
                              value={p.desc}
                              onChange={(e) => handleUpdateServicesPlan(p.id, 'desc', e.target.value)}
                              placeholder="توضیح کوتاه پکیج"
                              style={{ flex: '2 1 240px', minWidth: '200px', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700', color: '#1b4332', flexShrink: 0, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(p.featured)}
                                onChange={(e) => handleUpdateServicesPlan(p.id, 'featured', e.target.checked)}
                              />
                              ⭐ برجسته
                            </label>
                            <button type="button" onClick={() => handleRemoveServicesPlan(p.id)} style={{ flexShrink: 0, padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ backgroundColor: '#f4fbf7', padding: '14px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '8px' }}>➕ افزودن پکیج جدید نامحدود</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="text" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="نام پکیج (مثلاً: پکیج فشرده کانکور)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      <input type="text" value={newPlanDesc} onChange={(e) => setNewPlanDesc(e.target.value)} placeholder="توضیح کوتاه پکیج" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#1b4332', cursor: 'pointer' }}>
                        <input type="checkbox" checked={newPlanFeatured} onChange={(e) => setNewPlanFeatured(e.target.checked)} />
                        ⭐ این پکیج برجسته نمایش داده شود
                      </label>
                      <button type="button" onClick={handleAddServicesPlan} style={{ padding: '10px 18px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>افزودن پکیج</button>
                    </div>
                  </div>
                </div>

                {/* === اصلاح (بخش ۱۶): مدیریت یکپارچه و کاملاً قابل‌ویرایش سوالات پرتکرار خدمات تحصیلی === */}
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '4px' }}>❓ مدیریت یکپارچه سوالات پرتکرار خدمات تحصیلی</span>
                  <p style={{ fontSize: '11.5px', color: '#666', margin: '0 0 12px 0' }}>
                    همه‌ی سوالات — چه از قبل روی سایت بوده‌اند چه تازه اضافه کرده‌اید — همین‌جا و همگی به یک شکل قابل‌ویرایش مستقیم متن سوال و پاسخ‌اند. سوال‌های جدید دقیقاً در ادامه‌ی همین لیست (به همان ترتیب زیر) اضافه می‌شوند، نه در بخشی جدا.
                  </p>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #ced4da', marginBottom: '12px' }}>
                    {servicesFaqUnified.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>هیچ سوالی ثبت نشده است.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {servicesFaqUnified.map((f, idx) => (
                          <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: f.isDefault ? '#7a5c00' : '#1a5276' }}>
                                {idx + 1}. {f.isDefault ? '📌 پیش‌فرض سایت' : '✍️ افزوده‌ی ادمین'}
                              </span>
                              <button type="button" onClick={() => handleRemoveServicesFaqUnified(f.id)} style={{ flexShrink: 0, padding: '5px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف</button>
                            </div>
                            <input
                              type="text"
                              value={f.q}
                              onChange={(e) => handleUpdateServicesFaqText(f.id, 'q', e.target.value)}
                              placeholder="متن سوال"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: '700' }}
                            />
                            <textarea
                              value={f.a}
                              onChange={(e) => handleUpdateServicesFaqText(f.id, 'a', e.target.value)}
                              placeholder="متن پاسخ"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px', height: '50px', resize: 'vertical' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#f4fbf7', padding: '14px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '8px' }}>➕ افزودن سوال و پاسخ جدید نامحدود</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="text" value={newServicesFaqQuestion} onChange={(e) => setNewServicesFaqQuestion(e.target.value)} placeholder="متن سوال" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      <textarea value={newServicesFaqAnswer} onChange={(e) => setNewServicesFaqAnswer(e.target.value)} placeholder="متن پاسخ" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', height: '55px', resize: 'vertical' }} />
                      <button type="button" onClick={handleAddServicesFaqUnified} style={{ padding: '10px 18px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>افزودن سوال</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* ۳. دایرکتوری داینامیک مدیریت بورسیه‌ها و ثبت با فیلدهای توسعه‌یافته کارتی — فقط صفحه «بورسیه‌های فعال» */}
            {activePage === 'scholarships' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🌍 دایرکتوری داینامیک اعلام و حذف لایو بورسیه‌های سایت</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>تصویر پس‌زمینه هدر دپارتمان بورسیه‌ها:</label>
                  <ImageUploader currentUrl={bgScholarships} onUploadComplete={(url) => setBgScholarships(url)} label="پس‌زمینه بورسیه‌ها" />
                  <SizeHint text="حداقل ۱۹۲۰×۸۰۰، افقی عریض" />
                </div>

                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: editingScholarshipId ? '2px solid #f0ad4e' : '1px solid #ced4da' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: editingScholarshipId ? '#8a5a00' : '#2d6a4f', display: 'block', marginBottom: '12px' }}>
                    {editingScholarshipId ? '✏️ در حال ویرایش بورسیه — پس از تغییر، «ذخیره تغییرات» را بزنید:' : '➕ فرم ثبت و انتشار فوری بورسیه جدید روی پورتال:'}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 2, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>عنوان کامل بورسیه:</label>
                        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="مثلاً: بورسیه دولتی برتر روسیه" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>مرجع اعطا کننده:</label>
                        <input type="text" value={newProvider} onChange={(e) => setNewProvider(e.target.value)} placeholder="مثلاً: وزارت علوم روسیه" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>کشور مقصد بورسیه:</label>
                        <input
                          type="text"
                          value={isCountryDropdownOpen ? countryQuery : selectedCountryLabel}
                          onChange={(e) => { setCountryQuery(e.target.value); setNewCountry(''); setIsCountryDropdownOpen(true); }}
                          onFocus={() => { setCountryQuery(''); setIsCountryDropdownOpen(true); }}
                          onBlur={() => setTimeout(() => setIsCountryDropdownOpen(false), 150)}
                          placeholder="جست‌وجوی نام کشور (فارسی یا انگلیسی)..."
                          autoComplete="off"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                        {isCountryDropdownOpen && (
                          <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, backgroundColor: '#fff', border: '1px solid #ced4da', borderRadius: '6px', marginTop: '4px', maxHeight: '220px', overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                            {filteredCountries.length === 0 ? (
                              <div style={{ padding: '10px', fontSize: '12.5px', color: '#888' }}>کشوری یافت نشد</div>
                            ) : (
                              filteredCountries.map((c) => (
                                <div
                                  key={c.code}
                                  onMouseDown={() => { setNewCountry(c.code); setCountryQuery(''); setIsCountryDropdownOpen(false); }}
                                  style={{ padding: '9px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  <span>{getFlagEmoji(c.code)}</span>
                                  <span>{c.nameFa}</span>
                                  <span style={{ color: '#999', fontSize: '11px' }}>({c.nameEn})</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>مقطع و رشته تحصیلی:</label>
                        <input type="text" value={newDegree} onChange={(e) => setNewDegree(e.target.value)} placeholder="مثلاً: ماستری و دکترا" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>آخرین مهلت ثبت‌نام / ددلاین:</label>
                        <input type="text" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} placeholder="مثلاً: ۱۵ حوت ۱۴۰۵" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>نوع پوشش مالی:</label>
                        <select value={newFunding} onChange={(e) => setNewFunding(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', backgroundColor: '#fff' }}>
                          <option value="full">full (فول فاند)</option>
                          <option value="partial">partial (پارشال)</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>زبان تدریس:</label>
                        <input type="text" value={newLang} onChange={(e) => setNewLang(e.target.value)} placeholder="مثلاً: انگلیسی / چینی" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>شرایط مدرک زبان:</label>
                        <input type="text" value={newRequireLang} onChange={(e) => setNewRequireLang(e.target.value)} placeholder="بدون نیاز اولیه به مدرک" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      {/* === اضافه (رفع باگ گزارش‌شده): محدودیت سنی === */}
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>🎂 محدودیت سنی:</label>
                        <input type="text" value={newAgeLimit} onChange={(e) => setNewAgeLimit(e.target.value)} placeholder="مثلاً: زیر ۳۵ سال / بدون محدودیت" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>تب وضعیت نمایش:</label>
                        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', backgroundColor: '#fff' }}>
                          <option value="active">فرصت فعال 🔥</option>
                          <option value="soon">به‌زودی ⏳</option>
                          <option value="archived">آرشیو شده 📦</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>✨ توضیحات مزایا و پوشش (داخل پاپ‌آپ):</label>
                      <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="پوشش ۱۰۰٪ شهریه، لیلیه مجهز..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box', height: '55px', resize: 'vertical' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>📁 اسناد و مدارک مورد نیاز (داخل پاپ‌آپ):</label>
                      <input type="text" value={newDocs} onChange={(e) => setNewDocs(e.target.value)} placeholder="دیپلوم مکتب، ریز نمرات ۳ ساله..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>🖼️ عکس کارت بورسیه (پرچم/نمای دانشگاه مقصد):</label>
                      <ImageUploader currentUrl={newImageUrl} onUploadComplete={(url) => setNewImageUrl(url)} label="عکس بورسیه" />
                      <SizeHint text="حداقل ۱۰۰۰×۵۰۰، افقی عریض" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={handleAddScholarship} style={{ flex: 1, padding: '11px 20px', backgroundColor: editingScholarshipId ? '#f0ad4e' : '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', marginTop: '4px' }}>
                        {editingScholarshipId ? '💾 ذخیره تغییرات بورسیه' : '➕ درج لایو بورسیه در لیست'}
                      </button>
                      {editingScholarshipId && (
                        <button type="button" onClick={resetScholarshipForm} style={{ padding: '11px 18px', backgroundColor: '#e9ecef', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', marginTop: '4px' }}>
                          لغو ویرایش
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#112a1d', display: 'block', marginBottom: '8px' }}>📋 لیست بورسیه‌های زنده روی سایت (ویرایش یا حذف آنی):</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {scholarshipsList.map((sch) => (
                      <div key={sch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: sch.id === editingScholarshipId ? '#fff8e6' : '#fff', border: sch.id === editingScholarshipId ? '1px solid #f0ad4e' : '1px solid #e9ecef', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          {sch.image_url ? (
                            <img src={sch.image_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <span title="این بورسیه هنوز عکس ندارد" style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#fff3cd', color: '#856404', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🖼️</span>
                          )}
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#112a1d' }}>🎓 بورسیه {getCountryLabel(sch.country)} ({sch.degree}) — ددلاین ثبت نام: {sch.deadline}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button type="button" onClick={() => handleEditScholarship(sch)} style={{ padding: '6px 14px', backgroundColor: '#f0ad4e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>ویرایش</button>
                          <button type="button" onClick={() => handleRemoveScholarship(sch.id)} style={{ padding: '6px 14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف فوری از سایت</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* === جدید: بخش «راهنمای جامع آماده‌سازی مدارک» همین صفحه === */}
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed #ced4da' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#112a1d', display: 'block', marginBottom: '10px' }}>📚 بخش «راهنمای آماده‌سازی مدارک» (پایین همین صفحه):</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', fontSize: '12.5px' }}>عنوان کلی بخش:</label>
                      <input type="text" value={docsGuideTitle} onChange={(e) => setDocsGuideTitle(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', fontSize: '12.5px' }}>توضیح زیر عنوان:</label>
                      <textarea value={docsGuideDesc} onChange={(e) => setDocsGuideDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', fontSize: '12.5px' }}>کارت اول - عنوان:</label>
                        <input type="text" value={docsGuideCard1Title} onChange={(e) => setDocsGuideCard1Title(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }} />
                        <textarea value={docsGuideCard1Desc} onChange={(e) => setDocsGuideCard1Desc(e.target.value)} rows={2} placeholder="توضیح کارت اول" style={{ width: '100%', marginTop: '6px', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', fontSize: '12.5px' }}>کارت دوم - عنوان:</label>
                        <input type="text" value={docsGuideCard2Title} onChange={(e) => setDocsGuideCard2Title(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }} />
                        <textarea value={docsGuideCard2Desc} onChange={(e) => setDocsGuideCard2Desc(e.target.value)} rows={2} placeholder="توضیح کارت دوم" style={{ width: '100%', marginTop: '6px', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* ۴. مدیریت آمار عددی تالار افتخارات و باشگاه نخبگان مجتمع پژوهش — فقط صفحه «دستاوردها» */}
            {activePage === 'achievements' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🏆 مدیریت آمار عددی و شاخص‌های موفقیت تالار افتخارات نخبگان</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>تصویر پس‌زمینه هدر تالار افتخارات (bgAchievements):</label>
                  <ImageUploader currentUrl={bgAchievements} onUploadComplete={(url) => setBgAchievements(url)} label="پس‌زمینه دستاوردها" />
                  <SizeHint text="حداقل ۱۹۲۰×۸۰۰، افقی عریض" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: '#f4fbf7', padding: '16px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px', color: '#1b4332' }}>عدد آمار کانکور (مثلاً ۴۵+ تن):</label>
                    <input type="text" value={stat1Num} onChange={(e) => setStat1Num(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 'bold' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px', color: '#1b4332' }}>توضیح متنی آمار اول:</label>
                    <input type="text" value={stat1Lab} onChange={(e) => setStat1Lab(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: '#f4fbf7', padding: '16px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px', color: '#1b4332' }}>عدد آمار بورسیه (مثلاً ۳۰+ محصل):</label>
                    <input type="text" value={stat2Num} onChange={(e) => setStat2Num(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 'bold' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px', color: '#1b4332' }}>توضیح متنی آمار دوم:</label>
                    <input type="text" value={stat2Lab} onChange={(e) => setStat2Lab(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: '#f4fbf7', padding: '16px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px', color: '#1b4332' }}>درصد رشد معدل (مثلاً ۹۸٪):</label>
                    <input type="text" value={stat3Num} onChange={(e) => setStat3Num(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontWeight: 'bold' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px', color: '#1b4332' }}>توضیح متنی آمار سوم:</label>
                    <input type="text" value={stat3Lab} onChange={(e) => setStat3Lab(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                </div>

                {/* ۴-الف. مدیریت لیست دستاوردها/نظرات نخبگان (جدید) */}
                <div id="elite-form-section" style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#112a1d', display: 'block', marginBottom: '12px' }}>🌟 مدیریت تالار دستاوردها و نظرات نخبگان (achievementsEliteList):</span>

                  <div style={{ backgroundColor: '#fffbea', padding: '16px', borderRadius: '8px', border: '1px solid #f0e3ad', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#7a5c00', display: 'block', marginBottom: '4px' }}>📌 دستاوردهای نمونه پیش‌فرض سایت</span>
                    <p style={{ fontSize: '12px', color: '#7a5c00', margin: '0 0 12px 0' }}>
                      این‌ها ۳ نمونه‌ی از قبل نوشته‌شده در کد سایت‌اند (نه از این پنل اضافه شده‌اند)، برای همین در لیست
                      پایین («دستاوردهای ثبت‌شده») دیده نمی‌شوند. «حذف از سایت» هر کدام را برای همیشه از صفحه‌ی عمومی
                      (هم دستاوردها، هم صفحه اصلی) پنهان می‌کند؛ اگر بعداً پشیمان شدید، همین‌جا «بازگرداندن» را بزنید.
                      دکمه‌ی «نمایش در صفحه اصلی» جداگانه است: فقط مشخص می‌کند همین نمونه، علاوه بر صفحه‌ی دستاوردها،
                      در بخش «روایت کسانی که رسیدند»ی صفحه‌ی اصلی هم دیده شود یا نه. دکمه‌ی «نمایش در خدمات تحصیلی»
                      هم دقیقاً همین‌طور، ولی برای بخش «تجربه محصلان موفق دپارتمان مشاوره» در صفحه‌ی خدمات تحصیلی —
                      این دو کاملاً مستقل از هم‌اند.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {SEED_ELITE_DATA.map((elite) => {
                        const isHidden = deletedSeedEliteIds.includes(elite.id);
                        const isOnHome = homeFeaturedSeedIds.includes(elite.id);
                        const isOnServices = servicesFeaturedSeedIds.includes(elite.id);
                        return (
                          <div key={elite.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#fff', border: '1px solid #f0e3ad', borderRadius: '6px', flexWrap: 'wrap', gap: '10px', opacity: isHidden ? 0.6 : 1 }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#112a1d' }}>
                              🎯 {elite.name} — {elite.title} ({elite.year}) {isHidden && <em style={{ color: '#999', fontWeight: '500' }}>— در حال حاضر پنهان است</em>}
                              {!isHidden && isOnHome && <em style={{ color: '#2d6a4f', fontWeight: '500' }}> — 🏠 در صفحه اصلی هم فعال است</em>}
                              {!isHidden && isOnServices && <em style={{ color: '#1a5276', fontWeight: '500' }}> — 🎓 در خدمات تحصیلی هم فعال است</em>}
                            </span>
                            <span style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {!isHidden && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSeedEliteOnHome(elite.id)}
                                  style={{ padding: '6px 14px', backgroundColor: isOnHome ? '#2d6a4f' : '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}
                                >
                                  {isOnHome ? '🏠 نمایش در صفحه اصلی: فعال' : '🏠 نمایش در صفحه اصلی: غیرفعال'}
                                </button>
                              )}
                              {!isHidden && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSeedEliteOnServices(elite.id)}
                                  style={{ padding: '6px 14px', backgroundColor: isOnServices ? '#1a5276' : '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}
                                >
                                  {isOnServices ? '🎓 نمایش در خدمات تحصیلی: فعال' : '🎓 نمایش در خدمات تحصیلی: غیرفعال'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleToggleSeedElite(elite.id)}
                                style={{ padding: '6px 14px', backgroundColor: isHidden ? '#495057' : '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}
                              >
                                {isHidden ? '↩️ بازگرداندن' : '🗑 حذف از سایت'}
                              </button>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #ced4da', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '12px' }}>➕ فرم افزودن دستاورد/نظر جدید:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>نام نخبه:</label>
                          <input type="text" value={newEliteName} onChange={(e) => setNewEliteName(e.target.value)} placeholder="مثلاً: احمد رفیعی" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>نوع دستاورد:</label>
                          <select value={newEliteType} onChange={(e) => setNewEliteType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', backgroundColor: '#fff' }}>
                            <option value="konkur">قبولی کانکور</option>
                            <option value="scholarship">بورسیه بین‌المللی</option>
                            <option value="progress">پیشرفت تحصیلی</option>
                            <option value="other">سایر دستاوردها</option>
                          </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>سال:</label>
                          <input type="text" value={newEliteYear} onChange={(e) => setNewEliteYear(e.target.value)} placeholder="۱۴۰۵" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>عنوان دستاورد:</label>
                        <input type="text" value={newEliteTitle} onChange={(e) => setNewEliteTitle(e.target.value)} placeholder="مثلاً: کادر طب معالج دانشگاه طبی کابل" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>توضیح کوتاه:</label>
                        <textarea value={newEliteDesc} onChange={(e) => setNewEliteDesc(e.target.value)} placeholder="خلاصه‌ای از مسیر موفقیت..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box', height: '55px', resize: 'vertical' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>نقل‌قول مستقیم (اختیاری):</label>
                        <input type="text" value={newEliteQuote} onChange={(e) => setNewEliteQuote(e.target.value)} placeholder="مثلاً: محیط پژوهش تمرکز مرا چند برابر کرد." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>برچسب‌ها (با کاما جدا کنید):</label>
                        <input type="text" value={newEliteTags} onChange={(e) => setNewEliteTags(e.target.value)} placeholder="سالن مطالعه, کانکور" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      {/* === جدید (بخش ۹ + ۱۵): سه گزینه انتشار — این دستاورد همیشه در صفحه‌ی
                          دستاوردها منتشر می‌شود؛ این دو تیک مستقل مشخص می‌کنند آیا در صفحه
                          اصلی (بخش «روایت کسانی که رسیدند») و/یا صفحه خدمات تحصیلی (بخش
                          «تجربه محصلان موفق دپارتمان مشاوره») هم نمایش داده شود یا نه. === */}
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#f4fbf7', padding: '12px 14px', borderRadius: '8px', border: '1px solid #b7e4c7', fontSize: '12.5px', fontWeight: '700', color: '#1b4332', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newEliteShowOnHome}
                          onChange={(e) => setNewEliteShowOnHome(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <span>
                          🏠 همچنین در صفحه اصلی هم نمایش داده شود
                          <br />
                          <span style={{ fontWeight: '500', color: '#2d6a4f' }}>
                            تیک‌نخورده = فقط در صفحه دستاوردها منتشر شود. تیک‌خورده = هم در صفحه دستاوردها، هم در صفحه اصلی (با طراحی متفاوت مخصوص صفحه اصلی).
                          </span>
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#eaf2fb', padding: '12px 14px', borderRadius: '8px', border: '1px solid #a9cce3', fontSize: '12.5px', fontWeight: '700', color: '#1a3b5c', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newEliteShowOnServices}
                          onChange={(e) => setNewEliteShowOnServices(e.target.checked)}
                          style={{ marginTop: '2px' }}
                        />
                        <span>
                          🎓 همچنین در صفحه خدمات تحصیلی هم نمایش داده شود
                          <br />
                          <span style={{ fontWeight: '500', color: '#1a5276' }}>
                            تیک‌خورده = علاوه بر صفحه دستاوردها، در بخش «تجربه محصلان موفق دپارتمان مشاوره»ی صفحه خدمات تحصیلی هم نمایش داده می‌شود (با طراحی متفاوت مخصوص همان صفحه).
                          </span>
                        </span>
                      </label>
                      <button type="button" onClick={handleAddElite} style={{ width: '100%', padding: '11px 20px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>افزودن به تالار افتخارات</button>
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '10px' }}>📋 دستاوردهای ثبت‌شده از همین پنل</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {achievementsEliteList.length === 0 ? (
                      <p style={{ fontSize: '12.5px', color: '#999', margin: 0 }}>هنوز دستاوردی ثبت نشده است.</p>
                    ) : (
                      achievementsEliteList.map((elite) => (
                        <div key={elite.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', flexWrap: 'wrap', gap: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#112a1d' }}>
                            🎯 {elite.name} — {elite.title} ({elite.year})
                            {elite.showOnHome && <em style={{ color: '#2d6a4f', fontWeight: '500' }}> — 🏠 در صفحه اصلی هم فعال است</em>}
                            {elite.showOnServices && <em style={{ color: '#1a5276', fontWeight: '500' }}> — 🎓 در خدمات تحصیلی هم فعال است</em>}
                          </span>
                          <span style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleEliteShowOnHome(elite.id)}
                              style={{ padding: '6px 14px', backgroundColor: elite.showOnHome ? '#2d6a4f' : '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}
                            >
                              {elite.showOnHome ? '🏠 نمایش در صفحه اصلی: فعال' : '🏠 نمایش در صفحه اصلی: غیرفعال'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleEliteShowOnServices(elite.id)}
                              style={{ padding: '6px 14px', backgroundColor: elite.showOnServices ? '#1a5276' : '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}
                            >
                              {elite.showOnServices ? '🎓 نمایش در خدمات تحصیلی: فعال' : '🎓 نمایش در خدمات تحصیلی: غیرفعال'}
                            </button>
                            <button type="button" onClick={() => handleRemoveElite(elite.id)} style={{ padding: '6px 14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف</button>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* انتخاب دستاوردهای نمونه برای صفحه اصلی — نسخه‌ی فشرده و فقط-انتخاب همان
                کنترل‌های «نمایش در صفحه اصلی» که در صفحه «دستاوردها» کامل دیده می‌شوند؛
                هیچ handler یا state جدیدی ندارد، فقط همان‌ها را اینجا هم در دسترس
                می‌گذارد تا طبق نگاشت درخواستی، در صفحه «صفحه اصلی» هم قابل انتخاب باشد. */}
            {activePage === 'home' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🏆 انتخاب دستاوردهای نمونه برای نمایش در صفحه اصلی</h4>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 14px 0' }}>
                مدیریت کامل تالار افتخارات (افزودن/حذف/ویرایش) در صفحه «🏆 دستاوردها» انجام می‌شود؛ این‌جا فقط برای
                دسترسی سریع، همان دکمه‌ی «نمایش در صفحه اصلی» تکرار شده است.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SEED_ELITE_DATA.filter((elite) => !deletedSeedEliteIds.includes(elite.id)).map((elite) => (
                  <div key={`home-seed-${elite.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '6px', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#112a1d' }}>🎯 {elite.name} — {elite.title} ({elite.year})</span>
                    <button
                      type="button"
                      onClick={() => handleToggleSeedEliteOnHome(elite.id)}
                      style={{ padding: '6px 14px', backgroundColor: homeFeaturedSeedIds.includes(elite.id) ? '#2d6a4f' : '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}
                    >
                      {homeFeaturedSeedIds.includes(elite.id) ? '🏠 نمایش در صفحه اصلی: فعال' : '🏠 نمایش در صفحه اصلی: غیرفعال'}
                    </button>
                  </div>
                ))}
                {achievementsEliteList.map((elite) => (
                  <div key={`home-custom-${elite.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '6px', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#112a1d' }}>🎯 {elite.name} — {elite.title} ({elite.year})</span>
                    <button
                      type="button"
                      onClick={() => handleToggleEliteShowOnHome(elite.id)}
                      style={{ padding: '6px 14px', backgroundColor: elite.showOnHome ? '#2d6a4f' : '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}
                    >
                      {elite.showOnHome ? '🏠 نمایش در صفحه اصلی: فعال' : '🏠 نمایش در صفحه اصلی: غیرفعال'}
                    </button>
                  </div>
                ))}
                {SEED_ELITE_DATA.filter((elite) => !deletedSeedEliteIds.includes(elite.id)).length === 0 && achievementsEliteList.length === 0 && (
                  <p style={{ fontSize: '12.5px', color: '#999', margin: 0 }}>هنوز دستاوردی برای انتخاب وجود ندارد.</p>
                )}
              </div>
            </div>
            )}

            {/* ۴-ب. نظر مشتری صفحه اصلی (جدید) — فقط صفحه «صفحه اصلی» */}
            {activePage === 'home' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>💬 نظر مشتری برای صفحه اصلی (homeTestimonial)</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>نام گوینده نظر:</label>
                  <input type="text" value={testimonialName} onChange={(e) => setTestimonialName(e.target.value)} placeholder="مثلاً: محمد (محصل کامیاب دانشگاه طبی کابل)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ flex: '1 1 100%' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>متن نقل‌قول:</label>
                  <textarea value={testimonialQuote} onChange={(e) => setTestimonialQuote(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', height: '70px', resize: 'vertical' }} />
                </div>
              </div>
            </div>
            )}

            {/* ۴-ج. آمار ۴گانه «نگاه کلی» صفحه درباره ما (جدید) — فقط صفحه «درباره ما» */}
            {activePage === 'about' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 4px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>📊 آمار «نگاه کلی» صفحه درباره ما</h4>
              <p style={{ fontSize: '12px', color: '#666', margin: '10px 0 16px 0' }}>
                همان ۴ کارت آماری بالای صفحه «درباره ما» (ساعت فعالیت، مساحت، تعداد خدمت، کشور مقصد بورسیه). آیکن هر
                کارت ثابت است؛ فقط عدد و توضیح زیرش از اینجا قابل تغییر است.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>⏰ آمار اول (فعالیت روزانه)</span>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>عدد/مقدار:</label>
                  <input type="text" value={glanceStat1Value} onChange={(e) => setGlanceStat1Value(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>توضیح زیر آن:</label>
                  <input type="text" value={glanceStat1Label} onChange={(e) => setGlanceStat1Label(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>📐 آمار دوم (مساحت)</span>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>عدد/مقدار:</label>
                  <input type="text" value={glanceStat2Value} onChange={(e) => setGlanceStat2Value(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>توضیح زیر آن:</label>
                  <input type="text" value={glanceStat2Label} onChange={(e) => setGlanceStat2Label(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '10px' }}>🎓 آمار سوم (تعداد خدمت)</span>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>عدد/مقدار:</label>
                  <input type="text" value={glanceStat3Value} onChange={(e) => setGlanceStat3Value(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>توضیح زیر آن:</label>
                  <input type="text" value={glanceStat3Label} onChange={(e) => setGlanceStat3Label(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ backgroundColor: '#fffbea', padding: '14px', borderRadius: '8px', border: '1px solid #f0e3ad' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#7a5c00', display: 'block', marginBottom: '10px' }}>🌍 آمار چهارم (کشور مقصد بورسیه)</span>
                  <p style={{ fontSize: '11px', color: '#7a5c00', margin: '0 0 8px 0' }}>
                    توصیه: به‌جای یک عدد ثابت (مثلاً «۴ کشور»)، از عبارتی استفاده کنید که با اضافه/کم‌شدن بورسیه‌ها
                    منسوخ نشود؛ مگر بخواهید خودتان دستی به‌روزش کنید.
                  </p>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>عدد/مقدار:</label>
                  <input type="text" value={glanceStat4Value} onChange={(e) => setGlanceStat4Value(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '8px' }} />
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11.5px', fontWeight: '700' }}>توضیح زیر آن:</label>
                  <input type="text" value={glanceStat4Label} onChange={(e) => setGlanceStat4Label(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
            )}

            {/* ۵. مدیریت تصاویر صفحه درباره ما (گروه‌بندی‌شده، هر جایگاه دقیقاً مطابق یک عکس واقعی در صفحه) — فقط صفحه «درباره ما» */}
            {activePage === 'about' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🖼️ مدیریت تصاویر صفحه درباره ما (aboutPageImages)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {ABOUT_IMAGE_GROUPS.map((group) => (
                  <div key={group.title} style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '12px' }}>{group.title}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {group.items.map((item) => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#495057', minWidth: '160px' }}>{item.label}</span>
                          <div style={{ flex: '1 1 240px' }}>
                            <ImageUploader
                              currentUrl={getAboutImageUrl(item.key)}
                              onUploadComplete={(url) => handleAboutImageUpload(item.key, url)}
                              label={item.label}
                            />
                            <SizeHint text={ABOUT_IMAGE_SIZE_HINTS[item.key]} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* دکمه اصلی ذخیره تغییرات پورتال */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '14px 28px',
                  backgroundColor: isSaving ? '#6c9a82' : '#2d6a4f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  cursor: isSaving ? 'wait' : 'pointer',
                  fontWeight: '700',
                  boxShadow: isSaving ? '0 2px 8px rgba(45,106,79,0.15)' : '0 4px 12px rgba(45,106,79,0.2)',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {isSaving ? (
                  <>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2.5px solid rgba(255,255,255,0.45)',
                        borderTopColor: '#fff',
                        display: 'inline-block',
                        animation: 'pj-spin 0.7s linear infinite',
                      }}
                    />
                    در حال ذخیره روی سرور… لطفاً صبر کنید
                  </>
                ) : (
                  <>💾 ذخیره آنی و اعمال لایو تغییرات بر روی پورتال پژوهش</>
                )}
              </button>
            </div>
          </form>

          {/* ۶. تالار بررسی و قرنطینه فرم‌های معلق ارسالی مراجعین آنلاین — فقط صفحه «عمومی» */}
          {activePage === 'general' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef', marginTop: '24px' }}>
            <div style={{ marginBottom: '8px' }}>
              <h4 style={{ margin: 0, color: '#112a1d', fontWeight: '800', fontSize: '15px' }}>📥 تالار بررسی و تایید درخواست‌های معلق مراجعین</h4>
            </div>
            <p style={{ fontSize: '12.5px', color: '#666', margin: '0 0 16px 0', fontWeight: '500' }}>اطلاعات فرم‌های آنلاین پس از تایید مدیریت سازمانی مجتمع به دیتابیس اصلی سایت متصل خواهند شد.</p>
            {isLoadingRequests && <p style={{ textAlign: 'center' }}>در حال دریافت درخواست‌ها…</p>}
            {requestsError && <p style={{ color: '#dc3545', textAlign: 'center' }}>{requestsError}</p>}
            {/* === فاز ۲ دور سوم دیباگ: کار ۱ — ۴ زیرگروه قابل‌جمع‌شدن (بسته پیش‌فرض) === */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingRequestGroups.map((group) => (
                <RequestSubgroup
                  key={group.key}
                  icon={group.icon}
                  title={group.title}
                  count={group.items.length}
                  isOpen={openPendingGroups[group.key]}
                  onToggle={() => setOpenPendingGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                >
                  {group.items.map(renderPendingRequestCard)}
                </RequestSubgroup>
              ))}
              {generalPendingForms.length === 0 && !isLoadingRequests && (
                <p style={{ fontSize: '13px', color: '#2d6a4f', textAlign: 'center', margin: '10px 0', fontWeight: '700' }}>✨ هیچ درخواست معلقی در صف بررسی وجود ندارد.</p>
              )}
            </div>
            {/* === فاز ۲ دور سوم دیباگ: کار ۲ — دکمه آرشیو، بلافاصله بعد از لیست زیرگروه‌ها === */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleToggleArchive}
                style={{ padding: '6px 14px', backgroundColor: isArchiveOpen ? '#495057' : '#f1f3f5', color: isArchiveOpen ? '#fff' : '#495057', border: '1px solid #ced4da', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                📂 {isArchiveOpen ? 'بستن آرشیو' : 'مشاهده آرشیو درخواست‌های بررسی‌شده'}
              </button>
            </div>
          </div>
          )}

          {activePage === 'general' && isArchiveOpen && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef', marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#112a1d', fontWeight: '800', fontSize: '15px' }}>📂 آرشیو درخواست‌های بررسی‌شده</h4>
              <p style={{ fontSize: '12.5px', color: '#666', margin: '0 0 16px 0', fontWeight: '500' }}>
                همان درخواست‌هایی که «تایید» یا «حذف» شده‌اند — یعنی «تایید و آرشیو» دقیقاً یعنی این‌جا. این لیست فقط
                برای مرور است؛ اقدامی رویش انجام نمی‌شود. آخرین ۱۰۰ مورد نمایش داده می‌شود.
              </p>
              {isLoadingArchive && <p style={{ textAlign: 'center' }}>در حال دریافت آرشیو…</p>}
              {archiveError && <p style={{ color: '#dc3545', textAlign: 'center' }}>{archiveError}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {archivedRequestGroups.map((group) => (
                  <RequestSubgroup
                    key={group.key}
                    icon={group.icon}
                    title={group.title}
                    count={group.items.length}
                    isOpen={openArchiveGroups[group.key]}
                    onToggle={() => setOpenArchiveGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                  >
                    {group.items.map(renderArchivedRequestCard)}
                  </RequestSubgroup>
                ))}
                {archivedForms.length === 0 && !isLoadingArchive && (
                  <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', margin: '10px 0' }}>هنوز هیچ درخواستی آرشیو نشده است.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}