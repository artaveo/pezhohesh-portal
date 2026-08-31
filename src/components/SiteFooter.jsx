import React from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Mail, MapPin, Phone, Send, Instagram, Facebook, MessageCircle } from 'lucide-react'
import { usePortal } from '../contexts/PortalDataContext'
import { formatWhatsappNumber } from '../lib/utils'

const columns = [
  {
    title: 'صفحه‌ها',
    links: [
      { href: '/', label: 'صفحه اصلی' },
      { href: '/lounge', label: 'سالن مطالعه' },
      { href: '/services', label: 'خدمات تحصیلی' },
      { href: '/active-scholarships', label: 'بورسیه‌های فعال' },
    ],
  },
  {
    title: 'مجموعه',
    links: [
      { href: '/about', label: 'درباره ما' },
      { href: '/achievements', label: 'دستاوردها' },
      { href: '/admin', label: 'پنل مدیریت' },
    ],
  },
]

/**
 * فوتر جامع سایت — روی صفحه اصلی، سالن مطالعه، دستاوردها و درباره ما
 * نمایش داده می‌شود (نه روی خدمات تحصیلی/بورسیه‌ها که فوتر اختصاصی
 * خودشان را دارند — نگاه کنید به ServiceFooter.jsx).
 */
export function SiteFooter() {
  const { portalData } = usePortal()
  const address =
    portalData?.globalAddress ||
    'کابل، ناحیه سیزدهم، ایستگاه سرپل، جوار شفاخانه وطن، مجموعه تحصیلی پژوهش'
  // === اتصال شماره اول سالن مطالعه به پنل ادمین (loungePhone) ===
  // طبق تصمیم موجود در staticPortalConfig.js، این فیلد فقط یک شماره نگه
  // می‌دارد؛ شماره اول از پنل خوانده و با همان قالب +۹۳ فرمت می‌شود
  // (مشابه servicesPhone در ServiceFooter.jsx).
  const loungePhoneRaw = portalData?.loungePhone || '۰۷۷۲۵۷۲۰۵۴'
  const loungePhoneDisplay = `(+93)${formatWhatsappNumber(loungePhoneRaw).replace(/^93/, '')}`
  // === رفع باگ: شماره دوم قابل‌ویرایش نبود ===
  // قبلاً شماره دوم (۰۷۸۹۶۰۱۲۴۵) مستقیم در JSX هاردکد بود و هیچ فیلدی
  // در پنل ادمین آن را کنترل نمی‌کرد. اکنون از portalData.loungePhone2
  // خوانده می‌شود (دقیقاً همان الگوی servicesPhone2 در ServiceFooter.jsx)
  // — اگر مقدار خالی شود، فقط یک شماره نشان داده می‌شود، نه یک «/» بی‌مورد.
  const loungePhone2Raw = portalData?.loungePhone2 ?? '۰۷۸۹۶۰۱۲۴۵'
  const hasLoungePhone2 = Boolean(loungePhone2Raw && String(loungePhone2Raw).trim())
  const loungePhone2Display = hasLoungePhone2
    ? `(+93)${formatWhatsappNumber(loungePhone2Raw).replace(/^93/, '')}`
    : ''
  // === اتصال لینک تلگرام/فیسبوک/اینستاگرام دپارتمان سالن مطالعه به پنل ادمین ===
  // === رفع باگ گزارش‌شده: اینستاگرام فیلد اختصاصی در پنل ادمین نداشت ===
  // قبلاً این‌جا همیشه لینک عمومی هاردکد «https://instagram.com» بود. اکنون
  // از portalData.loungeInstagram (فیلد جدید پنل ادمین) خوانده می‌شود؛
  // مقدار پیش‌فرض دقیقاً همان لینک عمومی قبلی است، پس تا وقتی ادمین چیزی
  // ثبت نکرده هیچ تغییری در نمایش ایجاد نمی‌شود. واتساپ همچنان فیلد
  // اختصاصی ندارد و لینک عمومی قبلی برایش باقی می‌ماند.
  const social = [
    { href: portalData?.loungeTelegram || 'https://t.me', label: 'تلگرام', icon: Send },
    { href: portalData?.loungeInstagram || 'https://instagram.com', label: 'اینستاگرام', icon: Instagram },
    { href: portalData?.loungeFacebook || 'https://facebook.com', label: 'فیسبوک', icon: Facebook },
    { href: 'https://wa.me', label: 'واتساپ', icon: MessageCircle },
  ]

  return (
    <footer id="footer-main" className="border-t border-border/70 bg-card/40 pt-10 pb-6 sm:pt-14 sm:pb-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[1.2fr_1.8fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold tracking-tight">پژوهش</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              مجموعه پژوهش؛ فضایی آرام برای مطالعه، رشد فکری و امیدآفرینی، همراه با مشاوره
              تحصیلی و پیگیری بورسیه‌های بین‌المللی.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span dir="ltr">
                  {loungePhoneDisplay}
                  {hasLoungePhone2 ? ` / ${loungePhone2Display}` : ''}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <a href="mailto:pshlibraryhall@gmail.com" dir="ltr" className="transition-colors hover:text-foreground">
                  pshlibraryhall@gmail.com
                </a>
              </li>
            </ul>

            {/* === رفع باگ گزارش‌شده: زیر لوگوی هر شبکه اجتماعی اسم آن هم نوشته شود ===
                قبلاً فقط آیکون‌ها بدون هیچ برچسب متنی کنارشان نمایش داده
                می‌شدند. اکنون هر آیکون یک برچسب کوچک زیرش دارد (طراحی حرفه‌ای:
                ستون عمودی آیکون+نام، نه فقط ردیف آیکون خام). */}
            <div className="mt-6 flex items-center gap-3">
              {social.map(({ href, label, icon: Icon }) => (
                <a
                  key={href + label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors group-hover:bg-secondary group-hover:text-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
                </a>
              ))}
            </div>
            {/* === خط راهنمای دپارتمان (بخش ۳.۷) ===
                این ۳ آیکون (تلگرام/اینستاگرام/فیسبوک) صفحات اختصاصی دپارتمان
                سالن مطالعه‌اند، نه دپارتمان خدمات تحصیلی — طبق تصمیم کاربر
                این یادآوری فقط برای همین سه آیکون است، نه شماره تماس/واتساپ. */}
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground/80">
              صفحات تلگرام، اینستاگرام و فیسبوک بالا، مخصوص دپارتمان سالن مطالعه پژوهش‌اند.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-8">
            {columns.map((c) => (
              <div key={c.title}>
                <p className="text-sm font-medium">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link to={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 border-t border-border/70 pt-6 text-center sm:mt-12">
          <p className="text-xs text-muted-foreground">© ۱۴۰۵ مجموعه پژوهش — تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </footer>
  )
}
