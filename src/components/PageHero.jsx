import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Sparkles } from 'lucide-react'

/**
 * هیرو صفحات داخلی — پورت‌شده از v0-page-hero.tsx.
 * محتوا از props می‌آید تا هر صفحه دیتای واقعی خودش را پاس بدهد.
 */
export function PageHero({ eyebrow, title, desc, crumbs = [], stats, bgImage }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-16 lg:pt-40">
      {/* === فاز۲: پس‌زمینه عکسی اختیاری ===
          فقط وقتی bgImage داده شود رندر می‌شود؛ اگر داده نشود رفتار قبلی
          (بدون تصویر پس‌زمینه) کاملاً بدون تغییر می‌ماند.

          === رفع دو باگ واقعی (بازخورد کاربر) ===
          ۱) گرادیان قبلی فقط لبه‌ی پایینی را با رنگ تیره (foreground) کم‌رنگ
             می‌کرد و به‌سمت بالا کاملاً transparent می‌شد — دقیقاً همان‌جایی
             که عنوان و توضیح صفحه (بلافاصله بعد از crumbs) قرار می‌گیرند،
             یعنی متن اصلی هیچ محافظتی نداشت. چون رنگ متن این سایت تیره است
             (نه سفید)، تیره‌کردن پس‌زمینه هم کمکی نمی‌کرد؛ فقط روشن‌کردن
             پس‌زمینه (با رنگ background، دقیقاً همان تکنیکی که در بقیه‌ی
             این پروژه روی عکس‌ها استفاده شده) واقعاً کنتراست متن تیره را
             تضمین می‌کند. گرادیان تازه کل کارت متن را می‌پوشاند، نه فقط لبه.
          ۲) onError نداشت؛ اگر آدرس تصویر (مثلاً به‌خاطر تنظیمات دسترسی
             باکت Supabase Storage) قابل بارگذاری نباشد، به‌جای مخفی‌شدن
             تمیز، آیکن شکسته‌ی مرورگر دیده می‌شد. */}
      {bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            aria-hidden="true"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-gradient-to-b from-background/80 via-background/45 to-background/75"
          />
        </>
      )}
      <div aria-hidden="true" className="aurora absolute inset-0 -z-10" />
      <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {crumbs.length > 0 && (
          <nav aria-label="مسیر صفحه" className="mb-5 sm:mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link to="/" className="transition-colors hover:text-foreground">
                  صفحه اصلی
                </Link>
              </li>
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1">
                  <ChevronLeft className="size-3.5 opacity-50" aria-hidden="true" />
                  {i === crumbs.length - 1 ? (
                    <span className="text-foreground/70">{c.label}</span>
                  ) : (
                    <Link to={c.href} className="transition-colors hover:text-foreground">
                      {c.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="rise max-w-3xl">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] text-foreground/70 sm:px-4 sm:text-xs">
            <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {eyebrow}
          </span>

          <h1 className="mt-5 text-3xl leading-[1.25] font-semibold tracking-tight text-balance sm:mt-6 sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty sm:mt-5 sm:text-base lg:text-lg">
            {desc}
          </p>
        </div>

        {stats && (
          <dl className="rise mt-8 grid grid-cols-2 gap-2.5 sm:mt-12 sm:grid-cols-4 sm:gap-3" style={{ animationDelay: '120ms' }}>
            {stats.map((s) => (
              <div key={s.label} className="group relative glass rounded-xl px-4 py-3.5 sm:rounded-2xl sm:px-5 sm:py-4">
                <dd className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">{s.value}</dd>
                <dt className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{s.label}</dt>
                {/* === بخش ۱۰: راهنمای کوچک اختیاری روی هاور === این فقط وقتی
                    رندر می‌شود که خودِ صفحه‌ی فراخوان یک stat.hint بدهد؛
                    برای صفحاتی که hint نمی‌دهند (اکثر استفاده‌های فعلی
                    PageHero)، ظاهر و رفتار کاملاً بدون تغییر می‌ماند. */}
                {s.hint && (
                  <span
                    role="tooltip"
                    className="glass-strong pointer-events-none absolute -top-2 left-1/2 z-10 w-max max-w-[170px] -translate-x-1/2 -translate-y-full rounded-xl px-3 py-2 text-center text-[11px] leading-relaxed text-foreground opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100"
                  >
                    {s.hint}
                  </span>
                )}
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
