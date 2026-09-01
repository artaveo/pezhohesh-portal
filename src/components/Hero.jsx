import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Star } from 'lucide-react'
import { usePortal } from '../contexts/PortalDataContext'

export function Hero() {
  const { portalData } = usePortal()
  // === اتصال تصویر هیروی صفحه اصلی به پنل ادمین (mainHeroImage) ===
  // مقدار پیش‌فرض دقیقاً همان مسیر قبلاً هاردکدشده است، پس تا وقتی ادمین
  // چیزی در این فیلد ثبت نکرده، ظاهر فعلی هیرو بدون هیچ تغییری می‌ماند.
  const heroImage = portalData?.mainHeroImage || '/images/hero-main.png'

  // === رفع نقض Zero Fabrication + اتصال به پنل ادمین (بخش ۹) ===
  // این سه آمار قبلاً یک آرایه‌ی کاملاً هاردکد و خارج از کامپوننت بودند و
  // از پنل ادمین اصلاً قابل ویرایش نبودند. اکنون هر سه (عدد + برچسب) از
  // portalData می‌آیند؛ مقادیر پیش‌فرض دقیقاً همان چیزی است که تا امروز
  // روی سایت دیده می‌شد یا با آن جایگزین شد:
  //  ۱) «اعزام موفق محصلین» بدون تغییر می‌ماند (+۴۵).
  //  ۲) «ظرفیت فعلی سالن» طبق ظرفیت واقعی امروز به +۱۲۰ به‌روزرسانی شد.
  //  ۳) «کشور مقصد» از یک عدد ثابت («۴») که با هر بورسیه‌ی جدید منسوخ
  //     می‌شد، به «بدون مرز» تغییر کرد — دقیقاً همان عبارتی که پیش‌تر
  //     برای آمار مشابه در صفحه «درباره ما» (glanceStat4Value) هم انتخاب
  //     شده بود، تا سایت در این ادعا یکدست باشد.
  const heroStat1Number = portalData?.heroStat1Number || '+۴۵'
  const heroStat1Label = portalData?.heroStat1Label || 'اعزام موفق محصلین'
  const heroStat2Number = portalData?.heroStat2Number || '+۱۲۰'
  const heroStat2Label = portalData?.heroStat2Label || 'ظرفیت فعلی سالن'
  const heroStat3Number = portalData?.heroStat3Number || 'بدون مرز'
  const heroStat3Label = portalData?.heroStat3Label || 'کشور مقصد'
  const stats = [
    { value: heroStat1Number, label: heroStat1Label },
    { value: heroStat2Number, label: heroStat2Label },
    { value: heroStat3Number, label: heroStat3Label },
  ]

  // === رفع نقض Zero Fabrication + اتصال به پنل ادمین (بخش ۹) ===
  // کپشن پایین تصویر هیرو قبلاً ادعا می‌کرد سالن «۷ روز هفته — ۸ صبح تا
  // ۱۲ شب» باز است که با ساعات کاری واقعی سالن هم‌خوانی نداشت. اکنون این
  // متن از پنل ادمین قابل ویرایش است و مقدار پیش‌فرض آن دقیقاً ساعات کاری
  // واقعی سالن (شنبه تا پنج‌شنبه و جمعه‌ها جداگانه) است.
  const heroHoursWeekday = portalData?.heroHoursWeekday || 'شنبه تا پنج‌شنبه ۶ صبح تا ۷ شام'
  const heroHoursFriday = portalData?.heroHoursFriday || 'جمعه‌ها ۹ صبح تا ۳ بعدازظهر'

  return (
    <section
      id="top"
      className="relative overflow-hidden pb-14 sm:pb-20"
      style={{ paddingTop: 'var(--header-clearance)' }}
    >
      <div aria-hidden="true" className="aurora absolute inset-0 -z-10" />
      <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="rise">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] text-foreground/70 sm:px-4 sm:text-xs">
              <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              عضویت پذیرفته می‌شود
            </span>

            <h1 className="mt-5 text-3xl leading-[1.2] font-semibold tracking-tight text-balance sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl">
              فضایی آرام برای تمرکز،
              <span className="mt-2 block text-primary">مسیری روشن تا دانشگاه‌های جهان</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty sm:mt-6 sm:text-base lg:text-lg">
              سالن مطالعه آرام با عضویت روزانه و ماهانه، مشاوره تحصیلی گام‌به‌گام و دوسیه‌سازی حرفه‌ای
              برای اخذ بورسیه‌های بین‌المللی — همه در مجموعه پژوهش.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link
                to="/lounge"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_40px_-22px_oklch(0.53_0.093_168/0.9)] transition-transform duration-300 hover:-translate-y-0.5 sm:px-7 sm:py-3.5"
              >
                سالن مطالعه
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
              </Link>
              {/* === رفع تداخل منطقی (بخش ۹) ===
                  دکمه دوم قبلاً مستقیماً به «بورسیه‌های فعال» می‌رفت، در
                  حالی که بورسیه‌ها خودشان زیرمجموعه‌ی همان دپارتمان «خدمات
                  تحصیلی»‌اند. اکنون این دکمه به صفحه‌ی جامع خدمات تحصیلی
                  می‌رود (که از همان‌جا لینک بورسیه‌های فعال هم در دسترس
                  است)، تا سلسله‌مراتب واقعی صفحات حفظ شود. */}
              <Link
                to="/services"
                className="glass inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:px-7 sm:py-3.5"
              >
                خدمات تحصیلی
              </Link>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-3 sm:mt-12 sm:gap-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-[11px] text-muted-foreground sm:text-xs">{s.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rise relative" style={{ animationDelay: '150ms' }}>
            <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-[0_50px_90px_-60px_oklch(0.24_0.05_165/0.7)] sm:rounded-[2rem]">
              <img
                src={heroImage}
                alt="محصلان مجموعه پژوهش"
                className="h-[300px] w-full object-cover sm:h-[420px] lg:h-[520px]"
                onError={(e) => {
                  // === رفع باگ گزارش‌شده: عکس شکسته («؟») بدون هیچ fallback ===
                  // این تصویر تنها عکس دیناميک/آپلودی صفحه اصلی است (baseImage
                  // ثابت‌های بقیه‌ی صفحه اصلی هستند)؛ قبلاً onError نداشت، پس
                  // اگر آدرس آن به هر دلیلی (فرمت رد شده، حذف فایل و…) شکست،
                  // کاربر فقط آیکون شکسته‌ی خام مرورگر را می‌دید. اکنون دقیقاً
                  // مثل الگوی PageHero.jsx به تصویر ثابت پیش‌فرض سوییچ می‌کند.
                  if (e.target.src.endsWith('/images/hero-main.png')) return
                  e.target.src = '/images/hero-main.png'
                }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent"
              />

              <div className="glass-strong absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl p-2.5 sm:inset-x-4 sm:bottom-4 sm:gap-3 sm:rounded-2xl sm:p-4">
                {/* === رفع باگ گزارش‌شده (نسخه موبایل): کپشن روی عکس خیلی بزرگ شده بود ===
                    وقتی ساعات کاری به دو خط (شنبه‌تاپنج‌شنبه + جمعه‌ها) تقسیم
                    شد، این کارت از ۲ خط به ۳ خط رشد کرد. روی هیروی دسکتاپ
                    (۵۲۰px ارتفاع) این تفاوت محسوس نیست، اما روی هیروی موبایل
                    (فقط ۳۰۰px ارتفاع) همان کارت به‌طرز نامتناسبی بزرگ و زشت
                    به‌نظر می‌رسید. راه‌حل: خط دوم (جمعه‌ها) فقط از sm به بالا
                    نمایش داده می‌شود؛ در موبایل کارت دوباره ظریف و کوچک (۲ خط)
                    می‌ماند، و در تبلت/دسکتاپ جزئیات کامل هر دو خط دیده می‌شود. */}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium sm:text-sm">سالن مطالعه بی‌صدا</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">{heroHoursWeekday}</p>
                  <p className="mt-0.5 hidden truncate text-[10px] text-muted-foreground sm:block sm:text-xs">{heroHoursFriday}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[9px] font-medium text-primary sm:px-3 sm:py-1.5 sm:text-xs">
                  ظرفیت آزاد
                </span>
              </div>
            </div>

            <div className="glass-strong float-slow absolute -start-4 top-10 hidden items-center gap-2.5 rounded-2xl px-4 py-3 lg:flex">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Star className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-medium">رضایت از خدمات</p>
                <p className="text-[11px] text-muted-foreground">۹۸٪</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
