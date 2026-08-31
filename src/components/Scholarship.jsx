import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'

const destinations = [
  { country: 'چین', detail: 'CSC — شهریه + معاش ماهانه' },
  { country: 'ترکیه', detail: 'Türkiye Bursları — بورس دولتی کامل' },
  { country: 'جاپان', detail: 'MEXT — معافیت کامل شهریه' },
  { country: 'آلمان', detail: 'DAAD — کمک‌هزینه تحصیلات تکمیلی' },
]

const included = [
  'ارزیابی رایگان دوسیه و شانس پذیرش',
  'تدوین انگیزه‌نامه و رزومه علمی اختصاصی',
  'مکاتبه هدفمند با استاد راهنما',
  'پیگیری ویزا و اسکان تا لحظه سفر',
]

export function Scholarship() {
  return (
    <section id="scholarship" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-10">
          <div className="relative">
            <div className="overflow-hidden rounded-[1.5rem] border border-border/60 sm:rounded-[2rem]">
              <img
                src="/images/hero-scholarships.jpg"
                alt="محصلان مجموعه پژوهش"
                className="h-56 w-full object-cover sm:h-72 lg:h-[420px]"
              />
            </div>
            <div className="glass-strong absolute inset-x-4 -bottom-5 rounded-xl p-4 sm:inset-x-5 sm:-bottom-6 sm:rounded-2xl sm:p-5 lg:inset-x-8">
              <p className="text-xs font-medium sm:text-sm">پوشش مالی</p>
              <p className="mt-1 text-base font-semibold tracking-tight text-primary sm:text-lg">کامل یا جزئی، بسته به برنامه</p>
            </div>
          </div>

          <div className="pt-10 sm:pt-8 lg:pt-0">
            <p className="text-xs font-medium tracking-[0.2em] text-primary">بورسیه بین‌المللی</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
              دوسیه‌ای که کمیته پذیرش را قانع می‌کند
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
              روی رشته، دانشگاه و استاد مناسب تمرکز می‌کنیم؛ بعد دوسیه‌ای می‌سازیم که نقطه قوت شما را
              دقیق نشان دهد.
            </p>

            <ul className="mt-6 space-y-2.5 sm:mt-8 sm:space-y-3">
              {included.map((i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  <span className="text-foreground/80">{i}</span>
                </li>
              ))}
            </ul>

            {/* === رفع محدودیت ظاهری «فقط ۴ کشور» (بخش ۹) ===
                این چهار مقصد نمونه‌های واقعی و تأییدشده‌اند، اما چیدمان
                قبلی (بدون هیچ توضیحی) این تصور را می‌داد که کل خدمات
                بورسیه پژوهش محدود به همین چهار کشور است. این خط توضیحی
                صراحتاً می‌گوید این‌ها فقط نمونه‌اند، نه سقف خدمات. */}
            <p className="mt-7 text-xs font-medium text-muted-foreground sm:mt-9">
              نمونه‌ای از مسیرهای فعال بورسیه — محدود به همین چهار کشور نیستیم؛ در کشورهای متنوع دیگر
              جهان نیز بسته به فرصت‌های موجود، خدمات بورسیه ارائه می‌دهیم.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-2.5">
              {destinations.map((d) => (
                <div key={d.country} className="glass rounded-xl px-3.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                  <p className="text-sm font-medium">{d.country}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{d.detail}</p>
                </div>
              ))}
            </div>

            <Link
              to="/active-scholarships"
              className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary sm:mt-8"
            >
              فهرست بورسیه‌های فعال
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
