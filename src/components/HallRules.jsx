import React from 'react'
import { usePortal } from '../contexts/PortalDataContext'

// === بخش ۱۰: قوانین و سوالات پرتکرار اکنون کاملاً از پنل ادمین قابل مدیریت‌اند ===
// قبلاً «rules» و «faq» دو آرایه‌ی کاملاً هاردکد بودند؛ فقط rule1/rule2
// (دو فیلد آزاد) به‌صورت جداگانه از پنل به ابتدای لیست قوانین اضافه
// می‌شدند و «faq» هیچ اتصالی به پنل ادمین نداشت. اکنون همان الگویی که
// برای دستاوردهای نمونه (SEED_ELITE_DATA در AchievementsPage.jsx) جواب
// داد، اینجا هم پیاده شده: هر ۵ قانون و هر ۳ سوال پیش‌فرض یک id ثابت
// دارند و با data.deletedSeedRuleIds / data.deletedSeedFaqIds قابل
// پنهان‌سازی‌اند (بدون نیاز به حذف واقعی از کد)، و ادمین می‌تواند هر
// تعداد قانون/سوال دلخواه دیگر هم از طریق data.hallRulesList و
// data.hallFaqList اضافه کند. rule1/rule2 برای سازگاری با گذشته دقیقاً
// به همان شکل قبلی (همیشه ابتدای لیست) حفظ شدند.
export const SEED_HALL_RULES = [
  { id: 1, text: 'گفت‌وگو و تماس تلفنی در سالن ممنوع است؛ فضای مباحثه برای همین کارها آماده است.' },
  { id: 2, text: 'صندلی‌ها اختصاصی نیستند؛ در هر ورود، اولین جای خالی مناسب شماست.' },
  { id: 3, text: 'خوردن و آشامیدن فقط در کانتین انجام می‌شود.' },
  { id: 4, text: 'موبایل روی حالت بی‌صدا و هدفون بدون شنیده شدن صدا باشد.' },
  { id: 5, text: 'کارت عضویت را در هر ورود همراه داشته باشید.' },
]

export const SEED_HALL_FAQ = [
  {
    id: 1,
    q: 'آیا پس از ثبت‌نام، جایگاه مشخص و ثابتی به من داده می‌شود؟',
    a: 'خیر، هیچ جایگاه فیزیکی از پیش تعیین یا اختصاصی داده نمی‌شود. محصلان با داشتن اشتراک فعال، پس از مراجعه می‌توانند از هر کدام از میزهای خالی و آماده در سالن استفاده کنند.',
  },
  {
    id: 2,
    q: 'آیا امکان بازدید حضوری قبل از ثبت‌نام وجود دارد؟',
    a: 'بله، همه‌روزه در ساعات کاری مجموعه می‌توانید جهت بررسی محیط، روشنایی و کیفیت امکانات به آدرس ما مراجعه کنید.',
  },
  {
    id: 3,
    q: 'برای نهایی کردن ثبت‌نام چه مدارکی لازم است؟',
    a: 'همراه داشتن یک قطعه عکس جدید و یک کاپی تذکره تابعیت جهت تکمیل دوسیه در دفتر مجموعه الزامی است.',
  },
]

// شماره‌گذاری فارسی — با قوانین سریع + پیش‌فرض + دلخواه، ممکن است تعداد
// زیادی آیتم وجود داشته باشد؛ برای اعداد بزرگ‌تر از ۹ به رقم انگلیسی
// برمی‌گردیم (نایاب، ولی امن).
const persianDigits = ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
function toPersianOrdinal(i) {
  return persianDigits[i] || String(i + 1)
}

export function HallRules() {
  const { portalData } = usePortal()

  // === بخش ۱۱ (رفع باگ گزارش‌شده): یکپارچه‌سازی کامل «قوانین سالن» ===
  // قبلاً قوانین از سه منبع جدا ترکیب می‌شدند (rule1/rule2 ثابت، ۵ قانون
  // پیش‌فرض فقط با قابلیت پنهان‌کردن، و یک لیست جداگانه برای قوانین
  // دلخواه) — یعنی برای ویرایش متن یک قانون پیش‌فرض، هیچ راهی جز
  // پنهان‌کردنش و نوشتن دوباره از صفر در «قانون سریع» یا «قانون جدید»
  // وجود نداشت. اکنون data.hallRulesUnified یک آرایه‌ی تخت و یکپارچه از
  // {id, text} است — همه‌ی قوانین (چه پیش‌فرض چه دلخواه) در همین یک لیست
  // زندگی می‌کنند و همگی به یک شکل، مستقیماً در پنل ادمین قابل ویرایش
  // متن، حذف و افزودن‌اند.
  //
  // === سازگاری با گذشته ===
  // اگر ادمین هنوز حتی یک‌بار هم از پنل جدید ذخیره نکرده باشد (یعنی
  // hallRulesUnified هنوز اصلاً وجود ندارد)، همان ترکیب قدیمی (rule1/
  // rule2 + ۵ قانون پیش‌فرض منهای موارد پنهان‌شده) نمایش داده می‌شود تا
  // ظاهر فعلی سایت هیچ تغییری نکند. به‌محض اولین ذخیره از پنل ادمین
  // (که پنل، این لیست را با همان ترتیب قبلی seed می‌کند)، این لیست منبع
  // واحد و همیشگی حقیقت می‌شود.
  const hasUnifiedRulesList = Array.isArray(portalData?.hallRulesUnified)
  let displayedRules
  if (hasUnifiedRulesList) {
    displayedRules = portalData.hallRulesUnified.map((r) => r?.text).filter((t) => Boolean(t && t.trim()))
  } else {
    const adminQuickRules = [portalData?.rule1, portalData?.rule2].filter((r) => Boolean(r && r.trim()))
    const deletedSeedRuleIds = Array.isArray(portalData?.deletedSeedRuleIds) ? portalData.deletedSeedRuleIds : []
    const seedRuleTexts = SEED_HALL_RULES.filter((r) => !deletedSeedRuleIds.includes(r.id)).map((r) => r.text)
    displayedRules = [...adminQuickRules, ...seedRuleTexts]
  }

  // === سوالات پرتکرار (بدون تغییر — این بخش قبلاً تأیید شد که درست کار می‌کند) ===
  // ۱) ۳ سوال پیش‌فرض، منهای هرکدام که ادمین صریحاً پنهان کرده.
  // ۲) هر سوال/پاسخ دلخواه دیگری که ادمین از پنل اضافه کرده.
  const deletedSeedFaqIds = Array.isArray(portalData?.deletedSeedFaqIds) ? portalData.deletedSeedFaqIds : []
  const seedFaqItems = SEED_HALL_FAQ.filter((f) => !deletedSeedFaqIds.includes(f.id))
  const customFaqItems = Array.isArray(portalData?.hallFaqList) ? portalData.hallFaqList : []
  const displayedFaq = [...seedFaqItems, ...customFaqItems]

  return (
    <section id="rules" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-primary">قوانین سالن</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
              سکوت، نتیجه احترام جمعی است
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4">
              چند قانون ساده که رعایتشان کیفیت مطالعه همه را حفظ می‌کند.
            </p>

            {displayedRules.length > 0 && (
              <ul className="mt-6 space-y-2.5 sm:mt-8 sm:space-y-3">
                {displayedRules.map((r, i) => (
                  <li key={i + '-' + r} className="glass flex items-start gap-3 rounded-2xl p-3.5 sm:p-4">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-medium text-secondary-foreground">
                      {toPersianOrdinal(i)}
                    </span>
                    <span className="text-xs leading-relaxed text-foreground/80 sm:text-sm">{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div id="faq">
            <p className="text-xs font-medium tracking-[0.2em] text-primary">سوالات پرتکرار</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
              پاسخ کوتاه به پرسش‌های رایج
            </h2>

            {displayedFaq.length > 0 && (
              <div className="mt-6 space-y-2.5 sm:mt-8 sm:space-y-3">
                {displayedFaq.map((item) => (
                  <details key={item.id} className="glass group rounded-2xl px-4 py-3.5 transition-colors duration-500 open:bg-card sm:px-5 sm:py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xs font-medium sm:text-sm">
                      {item.q}
                      <span aria-hidden="true" className="relative flex size-5 shrink-0 items-center justify-center text-primary">
                        <span className="absolute h-px w-3 bg-current" />
                        <span className="absolute h-3 w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
                      </span>
                    </summary>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.a}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
