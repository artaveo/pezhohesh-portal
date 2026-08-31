import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { formatWhatsappNumber } from '../lib/utils'

/**
 * === رفع دو مشکل واقعی ===
 * ۱. phone قبلاً یک رشته‌ی از پیش فرمت‌شده و کاملاً هاردکد بود
 *    («(+93)772572054» — شماره‌ی سالن مطالعه) و هیچ صفحه‌ای که از
 *    CtaBand استفاده می‌کرد، prop مربوطه را واقعاً پاس نمی‌داد؛ نتیجه
 *    این بود که این شماره، بدون توجه به این‌که CtaBand در کدام صفحه/
 *    دپارتمان است، همه‌جا عیناً تکرار می‌شد و از پنل ادمین هم قابل
 *    ویرایش نبود. اکنون phone همان مقدار خامِ ذخیره‌شده در پنل ادمین
 *    است (دقیقاً همان چیزی که servicesPhone/loungePhone هستند) و هر
 *    صفحه، شماره‌ی دپارتمان واقعی خودش را پاس می‌دهد (نگاه کنید به
 *    نحوه‌ی فراخوانی CtaBand در هر صفحه).
 * ۲. دکمه‌ی تماس آیکن تلفن + لینک tel: داشت. اکنون دقیقاً مثل
 *    ServiceFooter.jsx به یک لینک واتساپ (wa.me) با همان تابع مشترک
 *    formatWhatsappNumber تبدیل شد — با کلیک، واتساپ باز می‌شود؛ خودِ
 *    شماره هم به‌صورت متن (بدون نیاز به کلیک) قابل خواندن می‌ماند.
 *
 * === اضافه (بخش ۱۹): دکمه‌ی لینک دوم اختیاری (secondary) ===
 * تا امروز فقط یک دکمه‌ی اصلی (primary) قابل تنظیم بود. صفحه‌ی
 * «دستاوردها» نیاز داشت علاوه بر لینک «عضویت در سالن مطالعه»، یک لینک
 * دوم به «خدمات تحصیلی» هم اضافه کند (چون کاربر ممکن است به‌جای سالن،
 * دنبال مشاوره تحصیلی باشد). به‌جای هاردکد این حالت در خودِ CtaBand،
 * یک prop اختیاری secondary اضافه شد که پیش‌فرضش null است — یعنی هر
 * صفحه‌ی دیگری که secondary را پاس نمی‌دهد، دقیقاً همان ظاهر قبلی
 * (فقط primary + دکمه‌ی واتساپ) را دارد، بدون کوچک‌ترین تغییری.
 */
export function CtaBand({
  id = 'cta',
  title = 'عضویت خود را فعال کنید و مسیر را شروع کنید',
  desc = 'ظرفیت سالن محدود است. عضویت روزانه یا ماهانه را انتخاب کنید یا با ما تماس بگیرید تا در کمتر از ۲۴ ساعت زمان جلسه ارزیابی رایگان را هماهنگ کنیم.',
  primary = { href: '/lounge', label: 'شرایط عضویت' },
  secondary = null,
  phone = '۰۷۷۲۵۷۲۰۵۴',
}) {
  const whatsappNumber = formatWhatsappNumber(phone)
  const whatsappHref = `https://wa.me/${whatsappNumber}`
  const displayNumber = whatsappNumber ? `(+93)${whatsappNumber.replace(/^93/, '')}` : ''

  return (
    <section id={id} className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-primary px-5 py-10 text-primary-foreground sm:rounded-[2.25rem] sm:px-8 sm:py-14 lg:px-12 lg:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(50% 60% at 85% 10%, oklch(1 0 0 / 0.28), transparent 70%), radial-gradient(45% 55% at 10% 90%, oklch(1 0 0 / 0.18), transparent 70%)',
            }}
          />

          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl lg:text-4xl">{title}</h2>
              <p className="mt-3 text-xs leading-relaxed opacity-90 sm:mt-4 sm:text-sm lg:text-base">{desc}</p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3 lg:flex-col">
              <Link
                to={primary.href}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary-foreground px-6 py-3 text-sm font-medium text-primary transition-transform duration-300 hover:-translate-y-0.5 sm:px-7 sm:py-3.5"
              >
                {primary.label}
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
              </Link>
              {secondary && (
                <Link
                  to={secondary.href}
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/35 px-6 py-3 text-sm font-medium transition-colors hover:bg-primary-foreground/10 sm:px-7 sm:py-3.5"
                >
                  {secondary.label}
                  <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
                </Link>
              )}
              {whatsappNumber && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  dir="ltr"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/35 px-6 py-3 text-sm font-medium transition-colors hover:bg-primary-foreground/10 sm:px-7 sm:py-3.5"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {displayNumber}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
