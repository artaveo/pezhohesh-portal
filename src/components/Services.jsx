import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Globe2, Compass, FileCheck2, GraduationCap, ArrowLeft } from 'lucide-react'

/**
 * === رفع نقض‌ها ===
 * ۱. «چوکی» در آیتم اول → «صندلی» (جدول واژگان دری افغانستان)
 * ۲. آیتم پنجم قبلاً «آزمون‌های زبان (آیلتس/تافل)» بود که اصلاً جزو ۹ خدمت
 *    واقعی ServiceCatalog.jsx نیست (نقض Zero Fabrication). به‌جای اختراع
 *    عنوان جدید، یکی از ۹ خدمت واقعی و تأییدشده (اخذ ادمیشن دانشگاه) که
 *    هنوز در این پیش‌نمایش نماینده‌ای نداشت انتخاب و عیناً کپی شد.
 * ۳. (بخش ۹) آیتم اول ادعا می‌کرد سالن «عایق صدا» دارد؛ چون سالن هیچ
 *    عایق‌بندی آکوستیک واقعی‌ای ندارد، این ادعا با توصیف واقعی («فضای
 *    آرام») جایگزین شد — بدون کوچک‌ترین ادعای فنی جدید.
 */
const items = [
  {
    icon: BookOpen,
    title: 'سالن مطالعه آرام',
    desc: 'نور ملایم، فضای آرام و اینترنت پرسرعت — هر صندلی خالی، جای شماست.',
    href: '/lounge',
  },
  {
    icon: Globe2,
    title: 'اخذ بورسیه بین‌المللی',
    desc: 'شناسایی فرصت‌ها، تدوین رزومه علمی و مکاتبه با استاد راهنما.',
    href: '/active-scholarships',
  },
  {
    icon: Compass,
    title: 'مشاوره تحصیلی',
    desc: 'انتخاب رشته، برنامه‌ریزی مطالعه و پایش هفتگی پیشرفت.',
    href: '/services',
  },
  {
    icon: FileCheck2,
    title: 'دوسیه‌سازی و مدارک',
    desc: 'ترجمه، انگیزه‌نامه، توصیه‌نامه و آماده‌سازی کامل اپلیکیشن.',
    href: '/services',
  },
  {
    icon: GraduationCap,
    title: 'اخذ ادمیشن دانشگاه',
    desc: 'مشاوره و تسهیل فرآیند اخذ پذیرش رسمی از دانشگاه‌های معتبر بین‌المللی.',
    href: '/services',
  },
]

export function Services() {
  return (
    <section id="services" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-[0.2em] text-primary">خدمات ما</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
              همه‌چیز برای یک مسیر تحصیلی بی‌دغدغه
            </h2>
          </div>
          <Link
            to="/services"
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary"
          >
            مشاهده صفحه خدمات
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-[1.5rem] sm:col-span-2 sm:rounded-[1.75rem] lg:col-span-1 lg:row-span-2">
            <img
              src="/images/hero-lounge.jpg"
              alt="نمای داخلی سالن مطالعه"
              className="h-full min-h-56 w-full object-cover sm:min-h-64"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />

            {/* کپشن با پس‌زمینه شیشه‌ای — به‌جای سایه‌ی متن، یک پنل روشن
                زیر متن قرار دارد تا روی هر عکسی خوانا بماند */}
            <div className="glass-strong absolute inset-x-3 bottom-3 rounded-xl p-3.5 sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:p-4">
              <p className="text-sm font-medium sm:text-base">محیطی که تمرکز را می‌سازد</p>
              <Link
                to="/lounge"
                className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-primary transition-colors hover:text-primary/80 sm:text-sm"
              >
                مشاهده سالن
                <ArrowLeft className="size-3.5 sm:size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {items.map(({ icon: Icon, title, desc, href }) => (
            <Link
              key={title}
              to={href}
              className="glass group rounded-[1.5rem] p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-card sm:rounded-[1.75rem] sm:p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-colors duration-500 group-hover:bg-primary group-hover:text-primary-foreground sm:size-11">
                <Icon className="size-4.5 sm:size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-medium tracking-tight sm:mt-5 sm:text-base">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
