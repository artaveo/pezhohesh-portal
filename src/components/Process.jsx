import React from 'react'

const steps = [
  {
    step: '۱',
    title: 'جلسه ارزیابی',
    desc: 'بررسی سابقه تحصیلی، هدف و بازه زمانی شما در یک جلسه رایگان.',
  },
  {
    step: '۲',
    title: 'نقشه راه اختصاصی',
    desc: 'انتخاب دانشگاه‌ها، فهرست مدارک و تقویم اقدامات ماه‌به‌ماه.',
  },
  {
    step: '۳',
    title: 'اجرا و مطالعه',
    desc: 'استفاده از سالن مطالعه، آماده‌سازی زبان و تکمیل مستندات.',
  },
  {
    step: '۴',
    title: 'پذیرش و سفر',
    desc: 'ارسال اپلیکیشن، پیگیری پاسخ‌ها، ویزا و اسکان.',
  },
]

export function Process() {
  return (
    <section id="process" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.2em] text-primary">مسیر همکاری</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
            چهار گام شفاف، بدون سردرگمی
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <ol className="grid gap-3 sm:grid-cols-2">
            {steps.map((s) => (
              <li
                key={s.step}
                className="glass relative rounded-[1.5rem] p-5 transition-colors duration-500 hover:bg-card sm:rounded-[1.75rem] sm:p-6"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:size-9 sm:text-sm">
                  {s.step}
                </span>
                <h3 className="mt-3.5 text-sm font-medium tracking-tight sm:mt-4 sm:text-base">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{s.desc}</p>
              </li>
            ))}
          </ol>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 sm:rounded-[1.75rem]">
            <img
              src="/images/hero-services.jpg"
              alt="جلسه مشاوره تحصیلی"
              className="h-56 w-full object-cover sm:h-72 lg:h-full"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
            <div className="glass-strong absolute inset-x-3 bottom-3 rounded-xl p-3.5 sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:p-4">
              <p className="text-xs font-medium sm:text-sm">اولین جلسه مشاوره رایگان است</p>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">حضوری در مجموعه یا آنلاین</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
