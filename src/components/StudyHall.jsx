import React from 'react'
import { Link } from 'react-router-dom'
import { Wifi, Coffee, VolumeX, Lamp, Snowflake, Zap, ArrowLeft, Info } from 'lucide-react'
import { usePortal } from '../contexts/PortalDataContext'

// === رفع نقض Zero Fabrication (بخش ۹) ===
// «عایق‌بندی آکوستیک سالن» یک ادعای فنی مشخص بود (نصب مصالح عایق صدا)
// که سالن فاقد آن است. برچسب «سکوت مطلق» (که توصیف فضای واقعاً ساکت
// سالن است، نه یک ادعای زیرساختی) دست‌نخورده ماند؛ فقط توضیح زیرش با
// یک توصیف واقعی و بدون ادعای فنی جایگزین شد.
const features = [
  { icon: VolumeX, label: 'سکوت مطلق', hint: 'محیطی آرام و بی‌سروصدا برای تمرکز' },
  { icon: Lamp, label: 'نور ملایم و استاندارد', hint: 'نور یکنواخت در کل سالن' },
  { icon: Wifi, label: 'اینترنت پرسرعت', hint: 'پلن روزانه، ماهانه و حجمی' },
  { icon: Zap, label: 'برق پایدار', hint: 'یوپی‌اس و سولر' },
  { icon: Snowflake, label: 'تهویه و گرمایش', hint: 'دمای مناسب در هر فصل' },
  { icon: Coffee, label: 'کانتین مجهز', hint: 'چای، قهوه و نوشیدنی' },
]

export function StudyHall() {
  const { portalData } = usePortal()
  // === اتصال قیمت‌های نمایشی به پنل ادمین (priceDaily/priceMonthly/priceAdmission) ===
  // مقدار پیش‌فرض هر سه فیلد دقیقاً همان اعداد قبلاً هاردکدشده است، پس تا
  // وقتی ادمین چیزی تغییر نداده، نمایش عمومی بدون تغییر می‌ماند.
  const priceDaily = portalData?.priceDaily || '۳۰'
  const priceMonthly = portalData?.priceMonthly || '۲۵۰'
  const priceAdmission = portalData?.priceAdmission || '۵۰'

  const plans = [
    { name: 'عضویت روزانه', price: priceDaily, unit: 'افغانی / هر روز', note: 'ورود آزاد در ساعات کاری' },
    {
      name: 'عضویت ماهانه',
      price: priceMonthly,
      unit: 'افغانی / هر ماه',
      note: `حق‌الداخله ${priceAdmission} افغانی فقط برای محصل جدید`,
      featured: true,
    },
  ]

  return (
    <section id="hall" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-5 sm:rounded-[2.25rem] sm:p-6 lg:p-10">
          <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-60" />

          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-primary">سالن مطالعه</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
                جایی که هر ساعت مطالعه، حساب می‌شود
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
                فضایی طراحی‌شده بر پایه ارگونومی و آرامش بصری. صندلی‌ها اختصاصی نیستند؛ هر جای خالی که
                دوست داشتید بنشینید و مطالعه را شروع کنید.
              </p>

              <ul className="mt-6 grid gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3">
                {features.map(({ icon: Icon, label, hint }) => (
                  <li key={label} className="glass flex items-center gap-3 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-9">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium sm:text-sm">{label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground sm:text-xs">{hint}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* اشاره کوتاه به پلن‌های اینترنت — جزئیات کامل در صفحه سالن */}
              <div className="glass mt-4 flex items-start gap-2.5 rounded-2xl p-3.5 sm:mt-5 sm:p-4">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  اینترنت به‌صورت پلن نامحدود ماهانه یا حجمی قابل افزودن است؛ جزئیات کامل قیمت‌ها در{' '}
                  <Link to="/lounge" className="font-medium text-primary hover:underline">
                    صفحه سالن مطالعه
                  </Link>
                  .
                </p>
              </div>

              <Link
                to="/lounge"
                className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary sm:mt-8"
              >
                صفحه کامل سالن مطالعه
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-3 sm:gap-4">
              <div className="overflow-hidden rounded-[1.5rem] border border-border/60 sm:rounded-[1.75rem]">
                <img
                  src="/images/hero-lounge.jpg"
                  alt="میزهای مطالعه در سالن مطالعه"
                  className="h-48 w-full object-cover sm:h-56 lg:h-64"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((p) => (
                  <div
                    key={p.name}
                    className={
                      p.featured
                        ? 'rounded-2xl bg-primary p-4 text-primary-foreground sm:p-5'
                        : 'glass rounded-2xl p-4 sm:p-5'
                    }
                  >
                    <p className={p.featured ? 'text-xs opacity-80' : 'text-xs text-muted-foreground'}>
                      {p.name}
                    </p>
                    <p className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{p.price}</p>
                    <p className={p.featured ? 'text-[11px] opacity-80' : 'text-[11px] text-muted-foreground'}>
                      {p.unit}
                    </p>
                    <p className={p.featured ? 'mt-2.5 text-[11px] opacity-90 sm:mt-3 sm:text-xs' : 'mt-2.5 text-[11px] text-muted-foreground sm:mt-3 sm:text-xs'}>
                      {p.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
