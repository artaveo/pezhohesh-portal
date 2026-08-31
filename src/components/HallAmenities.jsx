import React from 'react'
import { VolumeX, Lamp, Wifi, Zap, Snowflake, Coffee, MessageCircle, Landmark } from 'lucide-react'

// === رفع نقض Zero Fabrication (بخش ۱۰) ===
// «عایق‌بندی آکوستیک و کفپوش نرم» یک ادعای فنی مشخص بود (نصب مصالح عایق
// صدا) که سالن فاقد آن است — دقیقاً همان اصلاحی که قبلاً برای همین ادعا
// در صفحه اصلی (StudyHall.jsx) انجام شد. برچسب «سکوت مطلق» توصیف واقعی
// فضای ساکت سالن است، نه یک ادعای زیرساختی، و دست‌نخورده ماند.
const amenities = [
  { icon: VolumeX, label: 'سکوت مطلق', hint: 'محیطی آرام و بی‌سروصدا برای تمرکز' },
  { icon: Lamp, label: 'نور ملایم و استاندارد', hint: 'روشنایی یکنواخت در کل سالن' },
  { icon: Wifi, label: 'اینترنت پرسرعت', hint: 'با پلن روزانه، ماهانه و حجمی' },
  { icon: Zap, label: 'برق پایدار', hint: 'یوپی‌اس و سولر برای قطعی‌های برق' },
  { icon: Snowflake, label: 'تهویه و گرمایش', hint: 'دمای مناسب در هر فصل' },
  { icon: Coffee, label: 'کانتین مجهز', hint: 'چای، قهوه و نوشیدنی' },
  { icon: MessageCircle, label: 'فضای مباحثه', hint: 'مجزا از سالن اصلی، برای گفت‌وگو' },
  { icon: Landmark, label: 'نمازخانه مجزا', hint: 'فضای آرام برای ادای نماز' },
]

export function HallAmenities() {
  return (
    <section id="amenities" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.2em] text-primary">امکانات</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
            هرچه برای چند ساعت تمرکز پیوسته لازم است
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {amenities.map(({ icon: Icon, label, hint }) => (
            <div
              key={label}
              className="glass flex items-start gap-3 rounded-2xl p-4 transition-transform duration-500 hover:-translate-y-1 sm:gap-3.5 sm:p-5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-10 sm:rounded-2xl">
                <Icon className="size-4 sm:size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{hint}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
