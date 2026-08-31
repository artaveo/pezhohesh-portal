import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Mail, MapPin, MessageCircle, Phone, Send, Instagram, Facebook } from 'lucide-react'
import { usePortal } from '../contexts/PortalDataContext'
import { formatWhatsappNumber } from '../lib/utils'

const links = [
  { href: '/services', label: 'معرفی خدمات تحصیلی' },
  { href: '/active-scholarships', label: 'بورسیه‌های فعال' },
  { href: '/', label: 'صفحه اصلی مجموعه' },
  { href: '/lounge', label: 'سالن مطالعه' },
]

/**
 * فوتر اختصاصی دپارتمان خدمات تحصیلی و بورسیه‌ها — جدا از فوتر جامع
 * سایت (SiteFooter). فقط روی صفحات /services و /active-scholarships
 * نمایش داده می‌شود (نگاه کنید به PortalLayout.jsx).
 *
 * === به‌روزرسانی (بخش ۳.۷) ===
 * قبلاً این فوتر فقط یک خط تماس واتساپ داشت. اکنون، مثل SiteFooter، یک
 * ردیف کامل ۴ آیکون سوشال هم دارد — با این تفاوت عمدی که هر aria-label
 * صراحتاً نام همین دپارتمان را می‌گوید (نه فقط نام شبکه)، تا هم از نظر
 * دسترسی‌پذیری و هم برندینگ، کاربر بلافاصله بفهمد وارد صفحه سوشال کدام
 * دپارتمان می‌شود.
 */
export function ServiceFooter() {
  const { portalData } = usePortal()
  // === رفع باگ: شماره اشتباه دپارتمان ===
  // این فوتر قبلاً از ۰۷۷۲۵۷۲۰۵۴ استفاده می‌کرد که شماره واقعی دپارتمان
  // «سالن مطالعه» است، نه «خدمات تحصیلی». شماره واقعی و تأییدشده‌ی خدمات
  // تحصیلی ۰۷۲۸۱۰۱۵۶۴ است؛ همین مقدار الان fallback پیش‌فرض این فیلد در
  // پنل ادمین (servicesPhone) هم هست.
  const servicesPhoneRaw = portalData?.servicesPhone || '۰۷۲۸۱۰۱۵۶۴'
  const whatsappHref = `https://wa.me/${formatWhatsappNumber(servicesPhoneRaw)}`
  const servicesPhoneDisplay = `(+93)${formatWhatsappNumber(servicesPhoneRaw).replace(/^93/, '')}`
  // === اتصال شماره تماس دوم خدمات تحصیلی (servicesPhone2) ===
  // این فیلد در پنل ادمین از قبل ساخته شده اما تا امروز هیچ کامپوننتی
  // آن را نمی‌خواند. مقدار پیش‌فرض ادمین یک placeholder («۰۷۳۳XXXXXX»)
  // است، نه یک شماره واقعی؛ پس فقط وقتی مقداری تنظیم شده *و* با همین
  // placeholder برابر نیست، خط دوم نمایش داده می‌شود.
  // فرض حل ابهام: چون معلوم نیست این شماره واتساپ دارد یا نه (برخلاف
  // servicesPhone که تأییدشده واتساپ‌دار است)، این یکی به‌صورت متن ساده و
  // فقط با لینک tel: نمایش داده می‌شود، بدون آیکون/لینک واتساپ.
  const SERVICES_PHONE_2_PLACEHOLDER = '۰۷۳۳XXXXXX'
  const hasServicesPhone2 = Boolean(
    portalData?.servicesPhone2 && portalData.servicesPhone2 !== SERVICES_PHONE_2_PLACEHOLDER
  )
  const servicesPhone2Display = hasServicesPhone2
    ? `(+93)${formatWhatsappNumber(portalData.servicesPhone2).replace(/^93/, '')}`
    : ''
  const address =
    portalData?.globalAddress ||
    'کابل، ناحیه سیزدهم، ایستگاه سرپل، جوار شفاخانه وطن، مجموعه تحصیلی پژوهش'

  // === رفع باگ گزارش‌شده: اینستاگرام فیلد اختصاصی در پنل ادمین نداشت ===
  // مشابه SiteFooter.jsx؛ اکنون از portalData.servicesInstagram می‌آید.
  // === رفع باگ گزارش‌شده: زیر لوگو اسم شبکه هم نوشته شود ===
  // aria-label همان توضیح کامل قبلی (نام دپارتمان + شبکه) برای دسترسی‌پذیری
  // را حفظ می‌کند؛ label یک نسخه‌ی کوتاه فقط برای برچسب قابل‌مشاهده زیر
  // آیکون است (نسخه‌ی بلند زیر هر آیکون کوچک، شکسته/زشت می‌شد).
  const social = [
    { href: portalData?.servicesTelegram || 'https://t.me', label: 'تلگرام', ariaLabel: 'تلگرام دپارتمان خدمات تحصیلی', icon: Send },
    { href: portalData?.servicesInstagram || 'https://instagram.com', label: 'اینستاگرام', ariaLabel: 'اینستاگرام دپارتمان خدمات تحصیلی', icon: Instagram },
    { href: portalData?.servicesFacebook || 'https://facebook.com', label: 'فیسبوک', ariaLabel: 'فیسبوک دپارتمان خدمات تحصیلی', icon: Facebook },
    { href: whatsappHref, label: 'واتساپ', ariaLabel: 'واتساپ دپارتمان خدمات تحصیلی', icon: MessageCircle },
  ]

  return (
    <footer id="footer-main" className="border-t border-border/70 bg-card/40 pt-10 pb-6 sm:pt-14 sm:pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[1.2fr_1.8fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold tracking-tight">دپارتمان خدمات تحصیلی پژوهش</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              مشاوره تحصیلی، دوسیه‌سازی و پیگیری بورسیه‌های بین‌المللی — بخشی از مجموعه پژوهش.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 transition-colors hover:text-foreground"
                >
                  <MessageCircle className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span dir="ltr">{servicesPhoneDisplay} — واتساپ</span>
                </a>
              </li>
              {hasServicesPhone2 && (
                <li className="flex items-center gap-2.5">
                  <a
                    href={`tel:+${formatWhatsappNumber(portalData.servicesPhone2)}`}
                    className="flex items-center gap-2.5 transition-colors hover:text-foreground"
                  >
                    <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span dir="ltr">{servicesPhone2Display}</span>
                  </a>
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <a href="mailto:pshlibraryhall@gmail.com" dir="ltr" className="transition-colors hover:text-foreground">
                  pshlibraryhall@gmail.com
                </a>
              </li>
            </ul>

            <div className="mt-6 flex items-center gap-2">
              {social.map(({ href, label, icon: Icon }) => (
                <a
                  key={href + label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground/80">
              صفحات تلگرام، اینستاگرام، فیسبوک و واتساپ بالا، مخصوص دپارتمان خدمات تحصیلی و بورسیه‌هاست.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">دسترسی سریع</p>
            <ul className="mt-4 grid grid-cols-2 gap-2.5">
              {links.map((l) => (
                <li key={l.href + l.label}>
                  <Link to={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 border-t border-border/70 pt-6 text-center sm:mt-12">
          <p className="text-xs text-muted-foreground">© ۱۴۰۵ دپارتمان خدمات تحصیلی — بخشی از مجموعه پژوهش.</p>
        </div>
      </div>
    </footer>
  )
}
