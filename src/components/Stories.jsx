import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePortal } from '../contexts/PortalDataContext'
import { SEED_ELITE_DATA } from '../pages/AchievementsPage'

// === بخش ۹: این بخش اکنون از تالار افتخارات واقعی تغذیه می‌شود ===
// قبلاً این ۳ روایت («سارا محمدی»/«امیرحسین رضایی»/«نگار کیانی») کاملاً
// هاردکد و بدون هیچ ارتباطی با تالار افتخارات واقعی (AchievementsPage.jsx)
// بودند. اکنون همان منبع داده‌ی دستاوردها (SEED_ELITE_DATA + دستاوردهایی
// که ادمین از پنل اضافه کرده) برای همین بخش هم استفاده می‌شود — اما با
// همین طراحی کارتیِ فعلی (کارت شیشه‌ای با نقل‌قول)، که عمداً با طراحی
// کارت‌های صفحه‌ی «دستاوردها» (article با تگ/نوع/سال) متفاوت می‌ماند.
//
// === کنترل کامل از پنل ادمین ===
// ۱) هر دستاورد نمونه‌ی پیش‌فرض (SEED_ELITE_DATA) فقط وقتی اینجا نشان داده
//    می‌شود که هم از سایت (deletedSeedEliteIds) حذف نشده باشد و هم صریحاً
//    برای «صفحه اصلی» انتخاب شده باشد (homeFeaturedSeedIds؛ پیش‌فرض دو
//    نمونه‌ی اول — دقیقاً همان دو موردی که پیش از این تغییر هم در پنل
//    ادمین به‌عنوان مقدار پیش‌فرض این فیلد در نظر گرفته شد).
// ۲) هر دستاورد افزوده‌شده‌ی ادمین (achievementsEliteList) فقط وقتی اینجا
//    نشان داده می‌شود که ادمین هنگام افزودن (یا بعداً از همان لیست)
//    تیک «نمایش در صفحه اصلی هم» را زده باشد (item.showOnHome === true).
//    پیش‌فرض این تیک خاموش است، یعنی افزودن یک دستاورد جدید مثل قبل فقط
//    در صفحه‌ی دستاوردها منتشر می‌شود مگر ادمین صراحتاً بخواهد.
const DEFAULT_HOME_FEATURED_SEED_IDS = [1, 2]

export function Stories() {
  const { portalData } = usePortal()
  // === اتصال نظر مشتری صفحه اصلی (homeTestimonial) به پنل ادمین ===
  // این یک نظر تکی و admin-editable است، جدا از دستاوردهای زیر. فقط
  // وقتی ادمین واقعاً نام و متن نقل‌قول را ثبت کرده باشد نمایش داده
  // می‌شود (تا کارت خالی/نیمه‌کاره روی سایت زنده دیده نشود)، و به‌عنوان
  // کارت ویژه (برجسته) اول لیست اضافه می‌شود.
  const adminTestimonial = portalData?.homeTestimonial
  const hasAdminTestimonial = Boolean(adminTestimonial?.name && adminTestimonial?.quote)

  const deletedSeedIds = Array.isArray(portalData?.deletedSeedEliteIds) ? portalData.deletedSeedEliteIds : []
  const homeFeaturedSeedIds = Array.isArray(portalData?.homeFeaturedSeedIds)
    ? portalData.homeFeaturedSeedIds
    : DEFAULT_HOME_FEATURED_SEED_IDS

  const seedHomeItems = SEED_ELITE_DATA.filter(
    (item) => !deletedSeedIds.includes(item.id) && homeFeaturedSeedIds.includes(item.id)
  )
  const adminHomeItems = Array.isArray(portalData?.achievementsEliteList)
    ? portalData.achievementsEliteList.filter((item) => item.showOnHome)
    : []

  // حداکثر ۳ دستاورد برای حفظ همان چیدمان فعلی (۳ یا ۴ ستونه)
  const quotes = [...seedHomeItems, ...adminHomeItems].slice(0, 3).map((item) => ({
    name: item.name,
    role: item.title,
    text: item.quote || item.desc,
  }))

  return (
    <section id="stories" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-[0.2em] text-primary">نتایج</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
            روایت کسانی که رسیدند
          </h2>
        </div>

        {(hasAdminTestimonial || quotes.length > 0) && (
          <div
            className={
              hasAdminTestimonial
                ? 'mt-8 grid gap-3 sm:mt-12 sm:gap-4 md:grid-cols-2 lg:grid-cols-4'
                : 'mt-8 grid gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3'
            }
          >
            {hasAdminTestimonial && (
              <figure className="relative flex h-full flex-col justify-between rounded-[1.5rem] bg-primary p-5 text-primary-foreground transition-transform duration-500 hover:-translate-y-1 sm:rounded-[1.75rem] sm:p-6">
                <span className="absolute end-5 top-5 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[10px] font-medium sm:text-[11px]">
                  تازه‌ترین
                </span>
                <blockquote className="text-sm leading-relaxed opacity-95">«{adminTestimonial.quote}»</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-primary-foreground/20 pt-4 sm:mt-6 sm:pt-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-sm font-medium sm:size-10">
                    {adminTestimonial.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{adminTestimonial.name}</span>
                  </span>
                </figcaption>
              </figure>
            )}
            {quotes.map((q) => (
              <figure
                key={q.name}
                className="glass flex h-full flex-col justify-between rounded-[1.5rem] p-5 transition-transform duration-500 hover:-translate-y-1 sm:rounded-[1.75rem] sm:p-6"
              >
                <blockquote className="text-sm leading-relaxed text-foreground/85">«{q.text}»</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border/70 pt-4 sm:mt-6 sm:pt-5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-medium text-primary sm:size-10">
                    {q.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{q.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{q.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* === لینک به تالار افتخارات کامل (بخش ۹) === */}
        <Link
          to="/achievements"
          className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary sm:mt-10"
        >
          مشاهده همه دستاوردها
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
