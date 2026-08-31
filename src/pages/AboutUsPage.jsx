import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  Clock,
  Globe2,
  Target,
  Eye,
  Gem,
  Sparkles,
  Building2,
  Mic,
  HandHeart,
  Quote,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react'
import { useAdminData } from '../contexts/AdminDataContext'
import { PageHero } from '../components/PageHero'
import { cn } from '../lib/utils'

/**
 * درباره ما — دیزاین بخش تصاویر بر اساس مرجع‌های جدید کاربر بازسازی شد:
 * about-glance.tsx, about-story.tsx, about-mission.tsx, about-audiences.tsx,
 * hope-gallery.tsx, about-partners.tsx, founder-note.tsx.
 *
 * طبق تأکید کاربر، این بازطراحی فقط روی چیدمان/اندازه/تعداد تصاویر است —
 * محتوای متنی همان اطلاعات واقعی قبلی است. هرجا مرجع طراحی عدد، اسم یا رویداد
 * فرضی داشت (مثلاً «۲٬۴۰۰+ عضو»، تایم‌لاین ۴ ساله با تاریخ‌های ساختگی، ۸ عکس
 * با کپشن‌های داستان مهاجرت فرضی، یا نام «امید رحیمی» برای بنیان‌گذار)، آن با
 * داده واقعی جایگزین یا حذف شد — نه کپی مستقیم.
 *
 * === اتصال تصاویر به پنل ادمین (فاز ۳ دیباگ اتصال پنل ادمین) ===
 * این ۷ بخش (+ «چالش‌ها») حالا اسلات‌های تصویری متعدد و مجزا دارند. عکس هر
 * اسلات دیگر یک فایل استاتیک ثابت روی public/images/about/... نیست؛ از
 * data.aboutPageImages می‌آید — همان آرایه‌ای که useAdminData() از پنل ادمین
 * (AdminDashboard.jsx → ABOUT_IMAGE_GROUPS) برمی‌گرداند. تابع abt(key) این
 * آرایه را با resolveAboutImage جست‌وجو می‌کند؛ اگر ادمین چیزی برای آن key
 * آپلود نکرده باشد، همان placeholderImage مشترک دیده می‌شود (نه خطا، نه جای
 * خالی، نه کرش صفحه). فهرست کامل کلیدها و اینکه کدام‌ها هنوز در پنل ادمین
 * جایگاه ندارند، پایین همین فایل، در کامنت انتهایی است.
 */

const placeholderImage = '/images/about-placeholder.jpg' // تنها عکس واقعی موجود پروژه

// === سنتینل پیش‌فرض پنل ادمین (فاز ۳) ===
// AdminDashboard.jsx (ثابت DEFAULT_ABOUT_IMAGES) هر یک از ۲۶ اسلات آپلود‌نشده
// را از قبل با همین url ثابت پر می‌کند (نه رشته خالی)، تا خودِ پنل هیچ‌وقت
// جای خالی نشان ندهد. این مسیر با placeholderImage همین صفحه یکی نیست و قرار
// نیست باشد؛ برای همین این مقدار را هم «آپلود نشده» در نظر می‌گیریم — اگر
// چنین فایلی روی public/ اصلاً وجود نداشته باشد، تصویر شکسته دیده نمی‌شود.
const ADMIN_DEFAULT_PLACEHOLDER_URL = '/about-placeholder.jpg'

// === تابع resolve واقعی (فاز ۳ — قدم ۱) ===
// تابعی خالص و بدون وابستگی به Hook: آرایه‌ی تخت aboutPageImages (که از
// useAdminData() → portalData.aboutPageImages می‌آید) و یک key می‌گیرد و url
// واقعی را برمی‌گرداند. اگر آیتمی با آن key پیدا نشود، url نداشته باشد، یا
// هنوز همان سنتینل پیش‌فرض پنل باشد (یعنی ادمین چیزی برای آن آپلود نکرده)،
// دقیقاً همان placeholderImage قبلی برگردانده می‌شود — هیچ‌وقت جای خالی یا
// لینک شکسته دیده نمی‌شود. به‌صورت دفاعی، اگر جایی هنوز کلید با پسوند فایل
// صدا زده شود (الگوی قدیمی مثل 'founder.png')، پسوند حذف می‌شود.
function resolveAboutImage(images, key, fallback = placeholderImage) {
  if (!key) return fallback
  const cleanKey = key.replace(/\.[a-z0-9]+$/i, '')
  const match = Array.isArray(images) ? images.find((img) => img?.key === cleanKey) : null
  if (!match || !match.url || match.url === ADMIN_DEFAULT_PLACEHOLDER_URL) {
    return fallback
  }
  return match.url
}

function ImgTag({ src, alt, className, onClick }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.target.style.display = 'none'
      }}
      onClick={onClick}
      className={className}
    />
  )
}

function Eyebrow({ children }) {
  return <p className="text-xs font-medium tracking-[0.2em] text-primary">{children}</p>
}

// === کامپوننت‌های عمومی برای بخش‌هایی که طراحی جدید نگرفتند (بخش ۳.۹ قبلی) ===
// فاز ۳ — قدم ۲: این دو کامپوننت مستقیماً useAdminData() را صدا می‌زنند (دقیقاً
// همان Context که خودِ AboutUsPage مصرف می‌کند) تا بدون نیاز به پاس دادن آرایه‌ی
// aboutPageImages در هر لایه، وقتی imageKey/keys داده شود بتوانند عکس واقعی
// آپلودشده در پنل ادمین را نشان دهند. اگر کلیدی داده نشود، رفتار قبلی (همان
// placeholder مشترک) دقیقاً حفظ می‌شود.
//
// === درخواست کاربر: «روی هر عکس کلیک بشه باید بزرگ بشه» ===
// اگر onExpand داده شود، یک آیکن بزرگنمایی همیشه‌محسوس (نه فقط با hover،
// چون در موبایل hover معنا ندارد) روی گوشه‌ی عکس نشان داده می‌شود و کلیک
// روی خودِ عکس یا همان آیکن، Lightbox را با onExpand باز می‌کند.
// فاز بازخورد کاربر: قبلاً همه‌ی قاب‌ها (چه در ImageMosaic چه در فراخوانی‌های
// تکی) دقیقاً یک نسبت‌تصویر ثابت داشتند (aspect-[4/3])؛ همین یکنواختی باعث
// می‌شد کل صفحه «مربع‌مربع» به‌نظر برسد. اکنون aspectClassName این نسبت را
// قابل‌تغییر می‌کند، و fillHeight به یک قاب اجازه می‌دهد به‌جای نسبت‌ثابت،
// ارتفاع واقعی سلول گرید والدش را پر کند (برای عکس‌های بلند/عمودی که باید
// هم‌قد دو عکس کنارشان بشوند).
// === رفع باگ گزارش‌شده (بخش ۱۹): «نوار سایه سبز کمرنگ» گیج‌کننده زیر عکس‌ها ===
// قبلاً هر قاب یک لایه‌ی تزئینی جدا داشت: یک مربع کمی چرخانده‌شده و نیمه‌شفاف
// به رنگ primary (bg-primary/15) که از پشت هر عکس با inset-2.5 بیرون می‌زد —
// قصد طراحی اولیه شبیه‌سازی «کارت پولاروید» بود، اما وقتی اندازه‌ی دو قاب
// کوچک با قاب بزرگ کنارشان (به‌خاطر باگ چیدمان زیر) هم‌خوانی نداشت، این لایه‌ی
// سبزِ بیرون‌زده به‌جای یک جزئیات ظریف، به یک نوار گنگ و نامفهوم دیده می‌شد.
// راه‌حل: به‌جای رنگ تزئینی جداگانه، یک سایه‌ی نرم استاندارد (shadow) مستقیم
// روی خودِ قاب عکس گذاشته شد — همان حس عمق/برجستگی حرفه‌ای، بدون هیچ رنگ یا
// شکل مبهم اضافه.
function ImageFrame({ alt, className = '', imageKey, resolvedSrc, onExpand, aspectClassName = 'aspect-[4/3]', fillHeight = false }) {
  const { portalData } = useAdminData()
  const src =
    resolvedSrc !== undefined ? resolvedSrc : imageKey ? resolveAboutImage(portalData.aboutPageImages, imageKey) : placeholderImage
  return (
    <div className={cn('group relative', fillHeight && 'h-full', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-[1.5rem] border border-border/60 shadow-[0_18px_40px_-22px_rgba(20,35,28,0.35)] sm:rounded-[1.75rem]',
          fillHeight && 'h-full'
        )}
      >
        <ImgTag
          src={src}
          alt={alt}
          onClick={onExpand}
          className={cn(
            fillHeight ? 'h-full' : aspectClassName,
            'w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105',
            onExpand && 'cursor-zoom-in'
          )}
        />
        {onExpand && <ExpandHint />}
      </div>
    </div>
  )
}

// keys: آرایه‌ی ۳تایی از کلیدهای واقعی پنل ادمین، مثلاً
// keys={['girls-1', 'girls-2', 'girls-3']}. اگر کوتاه‌تر از ۳ باشد، بقیه
// جایگاه‌ها بدون imageKey رندر می‌شوند و همان placeholder مشترک دیده می‌شود
// (کرش نمی‌کند). onOpenLightbox اختیاری است؛ اگر داده شود، هر سه عکس این
// موزاییک قابل‌کلیک و بزرگ‌شدنی می‌شوند و دکمه‌های قبلی/بعدی Lightbox بین
// همین سه‌تا جابه‌جا می‌شوند.
//
// === رفع باگ گزارش‌شده (بخش ۱۹): سایز نامتناسب و فاصله‌ی زیاد بین دو عکس کوچک ===
// علت ریشه‌ای: چیدمان قبلی از یک گرید تک‌سطحی با grid-rows-2 + row-span-2
// استفاده می‌کرد، در حالی که عکس بزرگ به‌جای نسبت‌تصویر ثابت، fillHeight
// (h-full) داشت — یعنی ارتفاعش را از خودِ ردیف‌های گرید می‌گرفت. چون آن
// ردیف‌ها هم auto-sized بودند (بر اساس محتوای همان لحظه)، این یک وابستگی
// دوری (circular) در محاسبه‌ی ارتفاع ایجاد می‌کرد که مرورگر را مجبور به
// حدس می‌زد — نتیجه‌اش دقیقاً همان «سایز عجیب و فاصله‌ی نامتناسب» بود.
// راه‌حل استاندارد برای موزاییک نامتقارن: عکس بزرگ یک نسبت‌تصویر ثابت و
// واقعی می‌گیرد (aspect-[3/4])، ارتفاع واقعی و قطعی خودش را می‌سازد؛ ستون
// کناری (با items-stretch پیش‌فرض گرید) دقیقاً به همان ارتفاعِ قطعی کشیده
// می‌شود، و فقط از همان‌جا دو عکس کوچک با h-full/grid-rows-2 داخلی، دقیقاً
// نصف آن ارتفاعِ (اکنون قطعی) را پر می‌کنند — دیگر هیچ حدسی در کار نیست.
function ImageMosaic({ altPrefix, className = '', keys = [], onOpenLightbox }) {
  const { portalData } = useAdminData()
  const labels = [`${altPrefix} — تصویر اصلی`, `${altPrefix} — تصویر دوم`, `${altPrefix} — تصویر سوم`]
  const images = keys.map((key, i) => ({
    src: resolveAboutImage(portalData.aboutPageImages, key),
    alt: labels[i] || altPrefix,
  }))
  return (
    <div className={cn('grid grid-cols-2 items-stretch gap-3 sm:gap-4', className)}>
      <ImageFrame
        alt={images[0]?.alt}
        resolvedSrc={images[0]?.src}
        aspectClassName="aspect-[3/4]"
        onExpand={onOpenLightbox ? () => onOpenLightbox(images, 0) : undefined}
      />
      <div className="grid h-full grid-rows-2 gap-3 sm:gap-4">
        <ImageFrame
          alt={images[1]?.alt}
          resolvedSrc={images[1]?.src}
          fillHeight
          onExpand={onOpenLightbox ? () => onOpenLightbox(images, 1) : undefined}
        />
        <ImageFrame
          alt={images[2]?.alt}
          resolvedSrc={images[2]?.src}
          fillHeight
          onExpand={onOpenLightbox ? () => onOpenLightbox(images, 2) : undefined}
        />
      </div>
    </div>
  )
}

// آیکن گوشه‌ای «بزرگ‌نمایی» — همیشه کمی دیده می‌شود (برای موبایل که hover
// ندارد) و روی دسکتاپ با hover کامل واضح می‌شود.
function ExpandHint() {
  return (
    <span
      aria-hidden="true"
      className="glass pointer-events-none absolute left-2.5 top-2.5 flex size-8 items-center justify-center rounded-full text-foreground/80 opacity-70 transition-opacity duration-300 group-hover:opacity-100 sm:size-9"
    >
      <Maximize2 className="size-3.5 sm:size-4" />
    </span>
  )
}

function TagList({ items }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
          {item}
        </span>
      ))}
    </div>
  )
}

function DotList({ items }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// === Lightbox سراسری («روی هر عکس کلیک بشه باید بزرگ بشه») ===
// یک مودال تک‌نمونه‌ای که کل صفحه (از بنتوی «نگاه کلی» تا عکس بنیان‌گذار)
// در آن مشترک است. images یک آرایه‌ی {src, alt} است تا وقتی گروه بیش از یک
// عکس دارد (مثلاً موزاییک‌های ۳تایی یا گالری ۸تایی امید)، دکمه‌های
// قبلی/بعدی معنا داشته باشند؛ برای یک عکس تنها (مثلاً بنیان‌گذار)، همان
// آرایه‌ی تک‌عضوی کار می‌کند و دکمه‌های ناوبری خودشان پنهان می‌شوند.
function Lightbox({ images, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onNext()
      else if (e.key === 'ArrowRight') onPrev()
    }
    document.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, onNext, onPrev])

  // === انیمیشن ورود بدون نیاز به کیفریم اضافه در Tailwind config ===
  // چون این پروژه پلاگین tailwindcss-animate ندارد، «pop-in» با یک تیک
  // تأخیری state پیاده شده: رندر اول با opacity-0/scale-95، سپس یک فریم
  // بعد به opacity-100/scale-100 می‌رود؛ transition-all کار بقیه را می‌کند.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const touchStartX = useRef(null)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta > 0) onPrev()
      else onNext()
    }
    touchStartX.current = null
  }

  if (!images || images.length === 0) return null
  const current = images[index] || images[0]
  const hasMultiple = images.length > 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.alt || 'نمایش بزرگ‌شده تصویر'}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-md transition-opacity duration-300 sm:p-8',
        entered ? 'opacity-100' : 'opacity-0'
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن"
        className="glass absolute left-4 top-4 flex size-10 items-center justify-center rounded-full text-foreground/90 transition-transform duration-200 hover:scale-105 sm:left-6 sm:top-6"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            aria-label="عکس قبلی"
            className="glass absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground/90 transition-transform duration-200 hover:scale-105 sm:right-6"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            aria-label="عکس بعدی"
            className="glass absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground/90 transition-transform duration-200 hover:scale-105 sm:left-6"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        </>
      )}

      <figure
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex max-h-full max-w-full flex-col items-center transition-all duration-300',
          entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        <img
          key={current.src}
          src={current.src}
          alt={current.alt || ''}
          className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl sm:max-h-[78vh]"
        />
        {(current.alt || hasMultiple) && (
          <figcaption className="glass mt-4 rounded-full px-4 py-2 text-center text-xs text-foreground/90 sm:text-sm">
            {current.alt}
            {hasMultiple && <span className="mr-2 text-foreground/60">— {index + 1} / {images.length}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

// === ری‌ویل مرحله‌ای هنگام اسکرول (برای گالری «نمایشگاه امید») ===
// از IntersectionObserver استفاده می‌کند تا هر قاب فقط یک‌بار — همان لحظه‌ای
// که وارد دیدرس می‌شود — از حالت محو/جابه‌جا به حالت کامل برسد؛ با تأخیر
// پلکانی بر اساس ایندکس، یک ورود «هماهنگ» به‌جای چندین افکت پراکنده ساخته
// می‌شود. اگر کاربر «کاهش حرکت» را در سیستم‌عاملش فعال کرده باشد، همه‌چیز
// بدون انیمیشن، یک‌جا نمایان می‌شود.
function useRevealOnScroll(count) {
  const containerRef = useRef(null)
  const [visible, setVisible] = useState(() => new Array(count).fill(false))

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setVisible(new Array(count).fill(true))
      return
    }

    const node = containerRef.current
    if (!node) return
    const items = Array.from(node.querySelectorAll('[data-reveal-index]'))
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const idx = Number(entry.target.dataset.revealIndex)
          setVisible((prev) => {
            if (prev[idx]) return prev
            const next = [...prev]
            next[idx] = true
            return next
          })
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -60px 0px' }
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [count])

  return { containerRef, visible }
}

// === دیتای بخش «نگاه کلی» (about-glance.tsx) — فاز بازخورد کاربر ===
// این ۴ آمار قبلاً کاملاً هاردکد بودند (نه از پنل ادمین قابل ویرایش، نه حتی
// به data.* وصل). اکنون به data.glanceStat1..4 Value/Label منتقل شدند
// (پایین‌تر، داخل تابع کامپوننت، بعد از data ساخته می‌شوند) تا از پنل ادمین
// قابل ویرایش باشند. مقدار پیش‌فرض «کشور مقصد» هم عوض شد: عدد ثابت «۴ کشور»
// به تعداد فعلیِ ۴ بورسیه‌ی نمونه (چین/جاپان/ترکیه/آلمان) وابسته بود و با
// هر افزودن/حذف بورسیه از پنل، منسوخ می‌شد؛ چون فهرست بورسیه‌ها می‌تواند از
// چند کشور تا ۱۲۰+ کشور تغییر کند، مقدار پیش‌فرض جدید به‌جای یک عدد ثابت،
// دامنه‌ی کار را توصیف می‌کند — و مثل بقیه، کاملاً از پنل قابل بازنویسی است.

const remainingAudienceTags = ['استادان و اهل علم', 'دختران و پسران', 'جوانان و نوجوانان', 'علاقه‌مندان کتاب و فرهنگ']

// فاز ۳ — قدم ۱: storyChapters, missionCards, audienceCards, hopeFrames و
// partnerTracks از اینجا به داخل بدنه‌ی تابع AboutUsPage() منتقل شدند، چون
// همه‌شان با abt() تصویر واقعی می‌گیرند و abt() اکنون به data.aboutPageImages
// (که از useAdminData() می‌آید) نیاز دارد — این مقدار فقط داخل کامپوننت در
// دسترس است، نه در scope ماژول. متن/کپشن‌ها بدون تغییر همان‌جا مانده‌اند.

const cooperationTypeOptions = [
  { value: 'organization', label: 'نهاد / موسسه / سازمان' },
  { value: 'person', label: 'شخص / حامی' },
]

export default function AboutUsPage() {
  const { portalData, addPendingRequest } = useAdminData()

  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const target = document.querySelector(hash)
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }, [hash])

  // === Lightbox سراسری صفحه («روی هر عکس کلیک بشه باید بزرگ بشه») ===
  const [lightbox, setLightbox] = useState(null) // { images: [{src, alt}], index } | null
  const openLightbox = (images, index = 0) => setLightbox({ images, index })
  const closeLightbox = () => setLightbox(null)
  const stepLightbox = (delta) =>
    setLightbox((current) =>
      current ? { ...current, index: (current.index + delta + current.images.length) % current.images.length } : current
    )

  const data = {
    heroTitle: 'پژوهش؛ خانه مطالعه، فرهنگ، رشد و امید',
    heroDesc: 'فراتر از یک سالن مطالعه؛ فضایی آرام، فرهنگی و آموزشی برای مطالعه، رشد فکری و امیدآفرینی.',

    aboutTitle: 'پژوهش در یک نگاه',
    aboutText:
      'کتابخانه و سالن مطالعه پژوهش یک فضای آرام، فرهنگی و آموزشی برای جوانان، نوجوانان، شاگردان، محصلین، استادان و علاقه‌مندان مطالعه است. این مرکز با هدف ایجاد محیط سالم برای درس، تحقیق، رشد فکری و امیدآفرینی ایجاد شده است. پژوهش تنها محل نشستن و خواندن نیست؛ بلکه خانه‌ای برای فرهنگ، رشد، نظم، آگاهی و تلاش برای آینده بهتر.',

    // === ۴ آمار بخش «نگاه کلی» — قابل ویرایش از پنل ادمین ===
    // مقدار «کشور مقصد» دیگر یک عدد ثابت نیست (چون فهرست بورسیه‌ها می‌تواند
    // در طول زمان از چند کشور تا ده‌ها کشور تغییر کند)؛ به‌جایش دامنه‌ی کار
    // را توصیف می‌کند. اگر ادمین ترجیح داد یک عدد مشخص بگذارد، از همین پنل
    // قابل تغییر است.
    glanceStat1Value: '۱۶ ساعت',
    glanceStat1Label: 'فعالیت روزانه سالن',
    glanceStat2Value: '۲۷۰ متر',
    glanceStat2Label: 'مساحت سالن مطالعه',
    glanceStat3Value: '۹ خدمت',
    glanceStat3Label: 'خدمت تخصصی مشاوره تحصیلی',
    glanceStat4Value: 'بدون مرز',
    glanceStat4Label: 'کشور مقصد بورسیه، هرجا فرصت باشد',

    missionTitle: '🎯 مأموریت',
    missionDesc: 'فراهم‌سازی محیطی آرام، منظم، فرهنگی و انگیزشی برای مطالعه، رشد فردی، آگاهی و ادامه مسیر آموزشی جوانان.',
    visionTitle: '👁️ چشم‌انداز',
    visionDesc: 'تبدیل شدن به یکی از مراکز قابل اعتماد فرهنگی و آموزشی؛ مرکزی برای مطالعه، امید و آینده‌سازی.',
    valueTitle: '💎 ارزش‌های اصلی',
    valueDesc: 'آرامش و تمرکز، امید و انگیزه، نظم و برنامه‌ریزی، فرهنگ کتاب‌خوانی، رشد جوانان و مسئولیت اجتماعی.',
    beliefTitle: 'باور ما',
    beliefDesc: 'اگر یک جوان فرصت مطالعه، آرامش و انگیزه داشته باشد، می‌تواند آینده خود و جامعه‌اش را بهتر بسازد.',

    audiences: [
      'استادان و اهل علم',
      'محصلین دانشگاه‌ها',
      'داوطلبان کانکور',
      'شاگردان مکاتب',
      'زبان‌آموزان',
      'دختران و پسران',
      'جوانان و نوجوانان',
      'علاقه‌مندان کتاب و فرهنگ',
    ],

    girlsTitle: 'ادامه یادگیری در روزهای دشوار',
    girlsDesc:
      'پس از محدود شدن آموزش دختران، بسیاری از فرصت‌های آموزشی از دسترس آنان خارج شد. پژوهش تلاش کرده است فضایی امن، آرام و محترمانه فراهم کند تا دختران بتوانند با وجود دشواری‌ها، مسیر یادگیری، زبان‌آموزی و رشد فردی خود را ادامه دهند.',

    examTitle: 'آمادگی کانکور و مطالعه منظم',
    examDesc:
      'در این ماه‌ها، بیشتر مراجعه‌کنندگان پژوهش را جوانانی تشکیل می‌دهند که برای کانکور و امتحانات مهم آماده می‌شوند. افزایش مراجعه‌کنندگان باعث کمبود جا، صندلی، میز، روشنایی و امکانات مناسب می‌گردد. فصل خزان و زمستان، فصل تلاش جدی داوطلبان کانکور است. پژوهش تلاش می‌کند برای این جوانان فضایی آرام، منظم و دور از مزاحمت فراهم سازد؛ جایی که بتوانند با تمرکز، امید و استمرار برای آینده خود تلاش کنند.',
    examTags: ['جا، صندلی و میز', 'روشنایی', 'گرمایش و سرمایش', 'سولر'],

    libraryTitle: 'کتابخانه و منابع مطالعه',
    libraryDesc:
      'پژوهش تلاش می‌کند کتاب‌خوانی و رابطه جوانان با منابع آموزشی و فرهنگ را تقویت کند. کتاب‌ها، قفسه‌ها، نمایشگاه‌ها و فضای مطالعه، همه بخشی از هویت فرهنگی این مرکز هستند.',
    books: [
      'کتاب‌های درسی و کمک‌درسی',
      'منابع زبان و یادگیری',
      'کتاب‌های رشد فردی و انگیزشی',
      'کتاب‌های ادبی، رمان و آثار فرهنگی',
      'منابع عمومی برای شاگردان، محصلین و علاقه‌مندان مطالعه',
    ],

    hopeTitle: 'نمایشگاه امید',
    hopeDesc:
      'پس از تکمیل دیزاین و آماده‌سازی سالن، پژوهش با همکاری شماری از اعضا، نمایشگاه سه‌روزه‌ای به نام «امید» را در روزهای سال نو برگزار کرد. هدف این برنامه ایجاد انگیزه، امید و روحیه مثبت برای جوانان و نوجوانان بود. نمایشگاه امید نشان داد که پژوهش تنها یک سالن مطالعه نیست؛ بلکه می‌خواهد دریچه‌ای از امید، هنر، فرهنگ و آگاهی برای نسل جوان باشد.',

    activitiesTitle: 'فعالیت‌های انجام‌شده؛ از نشست علمی تا فعالیت اجتماعی',
    activities: [
      'برگزاری چندین سیمینار علمی و غیرعلمی برای رشد آگاهی و انگیزه جوانان',
      'راه‌اندازی نمایشگاه‌های فرهنگی و هنری',
      'تقدیر از اعضا و جوانان فعال برای تشویق تلاش، نظم و مشارکت',
      'پروژه جمع‌آوری لباس‌های استفاده‌شده برای خانواده‌های نیازمند',
      'ایجاد فضای گفت‌وگو، معرفی کتاب، هنر و تجربه‌های سازنده برای جوانان',
    ],

    challengesTitle: 'چالش‌های اصلی پژوهش',
    challenges: [
      'فیس ۲۵۰ افغانی هر عضو در برابر هزینه‌های سنگین ماهانه؛ شامل کرایه، آب، برق، صفایی، مدیریت، ترمیمات، گرمایش، سرمایش و نگهداری وسایل',
      'مشکل گرمایش و سرمایش در سالن بزرگ ۲۷۰ متری',
      'کمبود برق، به‌ویژه در زمستان و ساعات پرمصرف',
      'ضعف ظرفیت سولر برای روشنایی، تهویه و چارج وسایل اعضا',
      'هزینه ترمیم، نگهداری و مواد مصرفی روزمره',
    ],

    needsTitle: 'نیازهای مهم برای دوام و بهبود خدمات',
    needs: [
      { title: 'کتاب و منابع آموزشی', desc: 'کتاب‌های درسی، کانکور، زبان، کمپیوتر، رشد فردی و منابع عمومی' },
      { title: 'انرژی و روشنایی', desc: 'پنل سولر، اینورتر، چراغ‌های مطالعه و سیستم برق منظم' },
      { title: 'گرمایش و سرمایش', desc: 'وسایل مناسب، پرده ضخیم، عایق‌بندی و تهویه بهتر برای فصل‌ها' },
      { title: 'برنامه‌های آموزشی', desc: 'ورکشاپ‌های روش مطالعه، مدیریت وقت، مهارت‌های زندگی و زبان' },
      { title: 'حمایت از اعضای کم‌توان', desc: 'پرداخت فیس عضویت شاگردان و محصلین نیازمند بدون آسیب به کرامت آنان' },
      { title: 'تجهیزات آموزشی', desc: 'قفسه، میز، صندلی، پرنتر، وسایل اداری و سیستم صوتی ساده' },
    ],

    cooperationTitle: 'فرصت‌های همکاری',
    cooperationDesc:
      'پژوهش آماده همکاری با نهادهای فرهنگی، آموزشی، خیریه، اجتماعی، افراد خیر، استادان، فعالان فرهنگی، مهاجرین و هر نهادی است که به رشد جوانان و تداوم فرهنگ مطالعه باور دارد. کمک به جوانان نه فقط کمک به یک مکان، بلکه حمایت از آینده آنان است.',
    supportOptions: [
      'یک عضو برای یک ماه: ۲۵۰ افغانی',
      'ده عضو برای یک ماه: ۲۵۰۰ افغانی',
      'پنجاه عضو برای یک ماه: ۱۲۵۰۰ افغانی',
      'صد عضو برای یک ماه: ۲۵۰۰۰ افغانی',
    ],
    cooperationAreas: [
      'حمایت از عضویت شاگردان کم‌توان',
      'کتاب، قفسه، میز، صندلی، پرنتر و وسایل آموزشی',
      'تقویت سیستم سولری، روشنایی و تهویه',
      'حمایت از نمایشگاه‌ها، نشست‌ها، برنامه‌های انگیزشی و ورکشاپ‌ها',
    ],
    cooperationFormAreas: [
      'حمایت از عضویت شاگردان و محصلین نیازمند',
      'حمایت تجهیزاتی و تأمین کتاب و منابع آموزشی',
      'تقویت سیستم سولری، روشنایی و تهویه',
      'حمایت از نمایشگاه‌ها، نشست‌ها و برنامه‌های فرهنگی',
      'برگزاری ورکشاپ‌ها و برنامه‌های آموزشی',
      'سایر زمینه‌های همکاری',
    ],

    transparencyTitle: 'تعهد به شفافیت و حفظ کرامت',
    transparencyItems: [
      'ارائه گزارش مصرف و نحوه استفاده از همکاری‌ها',
      'مستندسازی برنامه‌ها با عکس و گزارش کوتاه',
      'شریک‌سازی گزارش ماهانه فعالیت‌ها با نهاد همکار',
      'حفظ کرامت شاگردان و اعضای کم‌توان بدون تحقیر یا افشای غیرضروری وضعیت آنان',
    ],

    // توجه: مرجع طراحی برای بنیان‌گذار یک نام فرضی («امید رحیمی») گذاشته بود.
    // چون در Core هیچ نام مستندی برای بنیان‌گذار نیامده، آن نام حذف شد و فقط
    // عنوان واقعی «بنیان‌گذار مجتمع پژوهش» جایگزین آن است.
    founderTitle: 'پیام بنیان‌گذار',
    founderText:
      'این مکان با هزینه شخصی، تلاش چندین‌ساله و تحمل ماه‌ها کرایه و مصارف از جیب خالی ایجاد و حفظ شد؛ نه برای منفعت شخصی، بلکه با امید خدمت به وطن، جامعه و نسل جوان کشور. پژوهش از دل یک قلیان‌خانه به خانه‌ای برای کتاب، مطالعه، فرهنگ و امید تبدیل شد.',
    founderTextSecondary:
      'ما با تمام وجود می‌کوشیم این اداره را با وجود مشکلات فراوان سرپا نگه داریم تا جوانان، دختران و پسران بتوانند از آن استفاده مفید کنند.',

    ...portalData,
  }

  // فاز ۳ — قدم ۱: abt() اکنون یک closure است که به data.aboutPageImages
  // (خروجی نهایی پنل ادمین) دسترسی دارد و resolveAboutImage را صدا می‌زند.
  const abt = (key, fallback) => resolveAboutImage(data.aboutPageImages, key, fallback)

  // === دیتای بخش «نگاه کلی» — بنتوی ۴ عکس ===
  // قبلاً این ۴ عکس مستقیم داخل JSX با abt() صدا زده می‌شدند؛ به آرایه
  // تبدیل شدند تا هم کد تکراری کمتر شود و هم بشود گروهشان را به Lightbox داد
  // (کلیک روی هرکدام، در همین ۴تا قبلی/بعدی می‌رود).
  const glanceImages = [
    { src: abt('glance-1'), alt: 'نمای کلی سالن مطالعه پژوهش', caption: 'سالن اصلی — ۲۷۰ متر مربع' },
    { src: abt('glance-2'), alt: 'ورودی مجموعه پژوهش' },
    { src: abt('glance-3'), alt: 'کتاب‌ها و منابع مطالعه' },
    { src: abt('glance-4'), alt: 'فضای مطالعه و مشاوره پژوهش' },
  ]

  // فاز بازخورد کاربر: این ۴ آمار حالا از data.glanceStat1..4 می‌آیند (که
  // خودشان یا مقدار پیش‌فرض بالا هستند یا چیزی که ادمین از پنل نوشته است).
  // آیکن‌ها ثابت می‌مانند (انتخاب تصویری، نه متنی، پس جایی برای ویرایش از
  // پنل ندارند)؛ فقط عدد/برچسب زیرشان قابل تغییر است.
  const glanceFigures = [
    { icon: Clock, value: data.glanceStat1Value, label: data.glanceStat1Label },
    { icon: Users, value: data.glanceStat2Value, label: data.glanceStat2Label },
    { icon: GraduationCap, value: data.glanceStat3Value, label: data.glanceStat3Label },
    { icon: Globe2, value: data.glanceStat4Value, label: data.glanceStat4Label },
  ]

  // === دیتای بخش «داستان ما» (about-story.tsx) ===
  // مرجع طراحی یک تایم‌لاین ۴ مرحله‌ای با سال‌های ساختگی (۱۳۹۶ تا ۱۴۰۴) داشت.
  // واقعیت پژوهش یک نقطه‌ی زمانی مستند دارد (۱۴۰۱)، نه ۴ مرحله؛ برای همین همان
  // یک پاراگراف واقعی را در ۲ فصل طبیعی (پیش از ۱۴۰۱ / ۱۴۰۱) تقسیم کردم — بدون
  // افزودن هیچ تاریخ یا رویداد جدید.
  const storyChapters = [
    {
      badge: 'پیش از ۱۴۰۱',
      title: 'یک قلیان‌خانه در همین مکان',
      text: 'پیش از پژوهش، این مکان یک قلیان‌خانه بود. با غیرقانونی اعلام شدن فعالیت قلیان‌خانه‌ها، این فضا دیگر به شکل قبلی قابل استفاده نبود.',
      img: abt('story-1'),
    },
    {
      badge: '۱۴۰۱',
      title: 'از قلیان‌خانه تا خانه امید',
      text: 'در ماه دهم ۱۴۰۱ خورشیدی، با هزینه شخصی و تلاش پیگیر، همین مکان به فضای فرهنگی، آموزشی و آرامی برای مطالعه جوانان و نوجوانان تبدیل شد؛ در روزگاری که جامعه با ناامیدی و نگرانی نسبت به آینده روبه‌رو بود.',
      img: abt('story-2'),
    },
  ]

  // === دیتای بخش «مأموریت» (about-mission.tsx) — مستقیم از مقادیر واقعی سایت ===
  const missionCards = [
    { icon: Target, key: 'mission', img: abt('values-1') },
    { icon: Eye, key: 'vision', img: abt('values-2') },
    { icon: Gem, key: 'value', img: abt('values-3') },
  ]

  // === دیتای بخش «مخاطبان» (about-audiences.tsx) — ۴ مورد از ۸ مخاطب واقعی، هر
  // کدام با یک توضیح کوتاه و واقع‌بینانه؛ ۴ مورد باقی به‌صورت تگ ساده نمایش
  // داده می‌شود تا هیچ‌کدام از ۸ مخاطب واقعی حذف نشود. توجه: پنل ادمین فقط
  // audience-1..3 دارد (نه audience-4)، پس تصویر چهارمین کارت همچنان
  // placeholder می‌ماند تا این دسته هم در پنل اضافه شود. ===
  const audienceCards = [
    {
      tag: 'داوطلبان کانکور',
      title: 'داوطلبان کانکور',
      desc: 'فضایی بی‌صدا برای ساعت‌های طولانی مطالعه در فصل آمادگی کانکور.',
      img: abt('audience-1'),
    },
    {
      tag: 'محصلین دانشگاه‌ها',
      title: 'محصلین دانشگاه‌ها',
      desc: 'میز و اینترنت پایدار برای مطالعه، تحقیق و پیگیری پروژه‌های درسی.',
      img: abt('audience-2'),
    },
    {
      tag: 'زبان‌آموزان',
      title: 'زبان‌آموزان',
      desc: 'محیطی آرام برای تمرین منظم و آمادگی آزمون‌های زبان.',
      img: abt('audience-3'),
    },
    {
      tag: 'شاگردان مکاتب',
      title: 'شاگردان مکاتب',
      desc: 'فضایی منظم برای مرور درس‌ها و عادت مطالعه روزانه از سنین مکتب.',
      img: abt('audience-4'),
    },
  ]

  // === دیتای بخش «نمایشگاه امید» (hope-gallery.tsx) — مرجع طراحی ۸ کپشن از یک
  // داستان فرضی مهاجرت تحصیلی داشت («لحظه باز کردن نامه پذیرش»، «ویزا بعد از
  // هفت ماه»، ...). واقعیت پژوهش یک نمایشگاه فرهنگی سه‌روزه به‌نام «امید» است؛
  // کپشن‌ها را از همان یک پاراگراف واقعی گرفتم، نه از روایت ساختگی. توجه: پنل
  // ادمین فقط hope-1..3 دارد؛ hope-4..8 محدودیت شناخته‌شده‌ی فاز ۳ است و
  // همچنان placeholder می‌مانند تا این بخش هم در پنل تکمیل شود.
  //
  // === بازطراحی دوم (بازخورد کاربر: «هنوز همه مربع‌مربع نشون داده میشن») ===
  // نسخه‌ی قبلی از grid-flow-dense با کلاس‌های span فقط از sm به بالا
  // استفاده می‌کرد؛ روی موبایل (پایه، بدون sm:) اکثر قاب‌ها اصلاً span
  // نمی‌گرفتند و همان مربع‌های قبلی باقی می‌ماندند. اکنون یک الگوی
  // قابل‌پیش‌بینی و بدون حدس‌وگمانِ چیدمانِ خودکار انتخاب شد: hope-1 یک
  // کاور سینمایی تمام‌عرض جداگانه است (همیشه، در همه‌ی سایزها)، و ۷ قاب
  // باقی‌مانده در یک masonry واقعی (columns-*، نه grid) قرار می‌گیرند —
  // هرکدام یک نسبت‌تصویر متفاوت (عمودی/مربع/افقی) دارد، پس هیچ‌وقت به
  // «همه‌چیز یک‌شکل» برنمی‌گردد، در هیچ سایز صفحه‌ای.
  const heroHopeFrame = {
    img: abt('hope-1'),
    caption: 'نمایشگاه سه‌روزه امید',
    tag: 'کاور نمایشگاه',
  }
  const hopeMasonryFrames = [
    { img: abt('hope-2'), caption: 'روزهای سال نو', tag: 'لحظه‌ها', aspect: 'aspect-square', tilt: '-rotate-1' },
    { img: abt('hope-3'), caption: 'همکاری اعضای پژوهش', tag: 'پشت صحنه', aspect: 'aspect-[3/4]', tilt: '' },
    { img: abt('hope-4'), caption: 'دیزاین و آماده‌سازی سالن', tag: 'روز صفر', aspect: 'aspect-video', tilt: '' },
    { img: abt('hope-5'), caption: 'روز اول نمایشگاه', tag: 'روز ۱', aspect: 'aspect-[4/5]', tilt: '' },
    { img: abt('hope-6'), caption: 'روز دوم نمایشگاه', tag: 'روز ۲', aspect: 'aspect-[5/4]', tilt: 'rotate-1' },
    { img: abt('hope-7'), caption: 'روز سوم و پایانی', tag: 'روز ۳', aspect: 'aspect-[3/4]', tilt: '' },
    { img: abt('hope-8'), caption: 'روحیه و انگیزه جوانان', tag: 'جمع‌بندی', aspect: 'aspect-video', tilt: '' },
  ]
  // آرایه‌ی کامل فقط برای شمارش/گروه‌بندی Lightbox (ایندکس ۰ = کاور، ۱..۷ = masonry)
  const hopeFrames = [heroHopeFrame, ...hopeMasonryFrames]
  const hopeReveal = useRevealOnScroll(hopeFrames.length)

  // === دیتای بخش «همکاری» (about-partners.tsx) — ۳ گروه واقعی همکار، مستقیم از
  // همان جمله واقعی cooperationDesc («نهادهای فرهنگی، آموزشی، خیریه، اجتماعی،
  // افراد خیر، استادان، فعالان فرهنگی، مهاجرین») دسته‌بندی شد؛ چیز جدیدی اضافه
  // نشد. ===
  const partnerTracks = [
    {
      icon: Building2,
      title: 'نهادها و سازمان‌ها',
      desc: 'نهادهای فرهنگی، آموزشی، خیریه و اجتماعی که می‌خواهند به رشد جوانان و تداوم فرهنگ مطالعه کمک کنند.',
      img: abt('partner-1'),
    },
    {
      icon: HandHeart,
      title: 'افراد خیر و حامیان',
      desc: 'افراد خیری که مایل‌اند هزینه عضویت شاگردان و محصلین کم‌توان را حمایت کنند.',
      img: abt('partner-2'),
    },
    {
      icon: Mic,
      title: 'استادان و فعالان فرهنگی',
      desc: 'استادان، فعالان فرهنگی و مهاجرینی که می‌خواهند در قالب نشست، ورکشاپ یا همکاری داوطلبانه کنار پژوهش باشند.',
      img: abt('partner-3'),
    },
  ]

  const missionCardsWithData = missionCards.map((c) => {
    const map = {
      mission: { title: data.missionTitle, desc: data.missionDesc },
      vision: { title: data.visionTitle, desc: data.visionDesc },
      value: { title: data.valueTitle, desc: data.valueDesc },
    }
    return { ...c, ...map[c.key] }
  })

  // === فرم «درخواست همکاری» — به portal_requests وصل است ===
  const [applicantType, setApplicantType] = useState('')
  const [coopName, setCoopName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contact, setContact] = useState('')
  const [cooperationArea, setCooperationArea] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCooperationSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addPendingRequest({
        type: 'cooperation_request',
        name: coopName,
        phone: contact,
        details: { applicantType, contactPerson, cooperationArea, message },
        summary: cooperationArea || 'درخواست همکاری',
      })
      alert('درخواست همکاری شما ثبت شد. از طریق راه‌های ارتباطی رسمی با شما تماس گرفته خواهد شد.')
      setApplicantType('')
      setCoopName('')
      setContactPerson('')
      setContact('')
      setCooperationArea('')
      setMessage('')
    } catch (err) {
      alert(err.message || 'خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="پژوهش؛ خانه مطالعه، فرهنگ، رشد و امید"
        title={data.heroTitle}
        desc={data.heroDesc}
        crumbs={[{ href: '/about', label: 'درباره ما' }]}
        bgImage={abt('hero', data.mainHeroImage || '/images/hero-main.png')}
      />

      {/* === رفع باگ گزارش‌شده: هیروی این صفحه هم مثل بورسیه‌های فعال ناقص بود === */}
      {/* فیلد ادمین (aboutPageImages → کلید «hero») همان چیزی است که پس‌زمینه‌ی
          کم‌رنگ بالای PageHero را هم تغذیه می‌کند و کاملاً درست کار می‌کرد؛ اما
          این صفحه — بر خلاف StudyLoungePage.jsx، AcademicServicesPage.jsx و
          ActiveScholarshipsPage.jsx — بلوک عکس بزرگ زیر هیرو را اصلاً نداشت.
          راه‌حل دقیقاً همان الگوی اثبات‌شده‌ی آن سه صفحه: همان یک عکس (کلید
          hero) در یک قاب تمام‌عرض نمایش داده می‌شود — با همین تفاوت که، برای
          یکدستی با بقیه‌ی همین صفحه، از الگوی خودِ این فایل (ImgTag +
          ExpandHint + Lightbox) استفاده شده، نه یک عکس ساده‌ی غیرقابل‌کلیک. */}
      <section className="pb-2 sm:pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <figure className="group relative overflow-hidden rounded-[1.5rem] border border-border/60 sm:rounded-[2rem]">
            <ImgTag
              src={abt('hero', data.mainHeroImage || '/images/hero-main.png')}
              alt="فضای مجتمع آموزشی پژوهش"
              onClick={() =>
                openLightbox(
                  [{ src: abt('hero', data.mainHeroImage || '/images/hero-main.png'), alt: 'فضای مجتمع آموزشی پژوهش' }],
                  0
                )
              }
              className="h-48 w-full cursor-zoom-in object-cover transition-transform duration-700 group-hover:scale-105 sm:h-64 lg:h-80"
            />
            <ExpandHint />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
            <figcaption className="glass-strong pointer-events-none absolute inset-x-3 bottom-3 rounded-xl p-3.5 sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:p-5">
              <p className="text-xs font-medium sm:text-sm">فضایی برای رشد، تمرکز و امید</p>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">نگاهی به مجموعه پژوهش</p>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ۱. نگاه کلی — بنتوی ۴ عکس + آمار واقعی (about-glance.tsx) */}
      <section id="glance" className="relative scroll-mt-24 py-14 sm:scroll-mt-28 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>نگاه کلی</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{data.aboutTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
              {data.aboutText}
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            <figure
              className="group relative overflow-hidden rounded-[2rem] border border-border/60 sm:col-span-2 lg:row-span-2"
            >
              <ImgTag
                src={glanceImages[0].src}
                alt={glanceImages[0].alt}
                onClick={() => openLightbox(glanceImages, 0)}
                className="h-64 w-full cursor-zoom-in object-cover transition-transform duration-700 hover:scale-[1.03] sm:h-full sm:min-h-[26rem]"
              />
              <ExpandHint />
              <figcaption className="glass pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl px-5 py-3.5 text-sm">
                {glanceImages[0].caption}
              </figcaption>
            </figure>

            <figure className="group relative overflow-hidden rounded-[1.75rem] border border-border/60">
              <ImgTag
                src={glanceImages[1].src}
                alt={glanceImages[1].alt}
                onClick={() => openLightbox(glanceImages, 1)}
                className="h-44 w-full cursor-zoom-in object-cover transition-transform duration-700 hover:scale-105 sm:h-52"
              />
              <ExpandHint />
            </figure>

            <figure className="group relative overflow-hidden rounded-[1.75rem] border border-border/60">
              <ImgTag
                src={glanceImages[2].src}
                alt={glanceImages[2].alt}
                onClick={() => openLightbox(glanceImages, 2)}
                className="h-44 w-full cursor-zoom-in object-cover transition-transform duration-700 hover:scale-105 sm:h-52"
              />
              <ExpandHint />
            </figure>

            <figure className="group relative overflow-hidden rounded-[1.75rem] border border-border/60 sm:col-span-2">
              <ImgTag
                src={glanceImages[3].src}
                alt={glanceImages[3].alt}
                onClick={() => openLightbox(glanceImages, 3)}
                className="h-44 w-full cursor-zoom-in object-cover transition-transform duration-700 hover:scale-105 sm:h-52"
              />
              <ExpandHint />
            </figure>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {glanceFigures.map(({ icon: Icon, value, label }) => (
              <div key={label} className="glass rounded-2xl px-5 py-5">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                <dd className="mt-3 text-2xl font-semibold tracking-tight">{value}</dd>
                <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ۲. داستان ما — تایم‌لاین ۲ فصلی واقعی (about-story.tsx) */}
      <section id="story" className="relative scroll-mt-24 bg-card/40 py-14 sm:scroll-mt-28 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>مسیر ما</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">داستان ما</h2>
          </div>

          <ol className="mt-10 space-y-4 sm:mt-12">
            {storyChapters.map((c, i) => (
              <li
                key={c.badge}
                className="glass grid gap-6 overflow-hidden rounded-[2rem] p-4 sm:p-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center"
              >
                <figure className={cn('group relative overflow-hidden rounded-[1.5rem] border border-border/50', i % 2 === 1 && 'lg:order-2')}>
                  <ImgTag
                    src={c.img}
                    alt={c.title}
                    onClick={() => openLightbox(storyChapters.map((s) => ({ src: s.img, alt: s.title })), i)}
                    className="h-52 w-full cursor-zoom-in object-cover transition-transform duration-700 hover:scale-105 sm:h-64"
                  />
                  <ExpandHint />
                </figure>
                <div className={i % 2 === 1 ? 'lg:order-1 lg:pr-2' : 'lg:pl-2'}>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {c.badge}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-balance sm:text-2xl">{c.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">{c.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ۳. مأموریت — بنر بزرگ + ۳ کارت (about-mission.tsx) */}
      <section id="mission" className="relative scroll-mt-24 py-14 sm:scroll-mt-28 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-border/60">
            <ImgTag src={abt('values-wide')} alt="فضای آرام سالن مطالعه پژوهش" className="h-64 w-full object-cover sm:h-80" />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10"
            />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <Eyebrow>مأموریت</Eyebrow>
              <h2 className="mt-4 max-w-3xl text-2xl leading-[1.35] font-semibold tracking-tight text-balance sm:text-4xl">
                {data.beliefDesc}
              </h2>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {missionCardsWithData.map(({ icon: Icon, title, desc, img }, i) => (
              <article key={title} className="group glass overflow-hidden rounded-[1.75rem] transition-transform duration-500 hover:-translate-y-1">
                <div className="relative">
                  <ImgTag
                    src={img}
                    alt={title}
                    onClick={() => openLightbox(missionCardsWithData.map((m) => ({ src: m.img, alt: m.title })), i)}
                    className="h-44 w-full cursor-zoom-in object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <ExpandHint />
                </div>
                <div className="p-6">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-medium">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-primary/10 p-5 text-center sm:rounded-[1.75rem] sm:p-8">
            <h4 className="text-sm font-semibold text-primary sm:text-base">{data.beliefTitle}</h4>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80 sm:text-base">{data.beliefDesc}</p>
          </div>
        </div>
      </section>

      {/* ۴. مخاطبان — گالری ۴ کارت پرتره (about-audiences.tsx) */}
      <section id="audiences" className="relative scroll-mt-24 bg-card/40 py-14 sm:scroll-mt-28 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>مخاطبان</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              مخاطبان و استفاده‌کنندگان
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
              پژوهش خانه مشترک اهل مطالعه است؛ جایی برای استاد، محصل، جوان، نوجوان، دختر و پسر؛ از همه اقشار و
              طبقات جامعه.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {audienceCards.map((a, i) => (
              <article
                key={a.title}
                onClick={() => openLightbox(audienceCards.map((c) => ({ src: c.img, alt: c.title })), i)}
                className="group relative cursor-zoom-in overflow-hidden rounded-[1.75rem] border border-border/60"
              >
                <ImgTag src={a.img} alt={a.title} className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-96" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"
                />
                <ExpandHint />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="glass inline-flex rounded-full px-3 py-1 text-[11px] text-foreground/80">{a.tag}</span>
                  <h3 className="mt-3 text-base font-medium text-balance">{a.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">{a.desc}</p>
                </div>
              </article>
            ))}
          </div>

          <TagList items={remainingAudienceTags} />
        </div>
      </section>

      {/* ۵. ادامه یادگیری در روزهای دشوار (بدون طراحی جدید) */}
      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">{data.girlsTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{data.girlsDesc}</p>
          </div>
          <ImageMosaic altPrefix="حمایت از آموزش دختران" keys={['girls-1', 'girls-2', 'girls-3']} onOpenLightbox={openLightbox} />
        </div>
      </section>

      {/* ۶. آمادگی کانکور (بدون طراحی جدید) */}
      <section className="relative bg-card/40 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:items-center">
          <ImageMosaic altPrefix="آمادگی کانکور و مطالعه منظم" keys={['exam-1', 'exam-2', 'exam-3']} onOpenLightbox={openLightbox} />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">{data.examTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{data.examDesc}</p>
            <TagList items={data.examTags} />
          </div>
        </div>
      </section>

      {/* ۷. کتابخانه (بدون طراحی جدید) */}
      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">{data.libraryTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{data.libraryDesc}</p>
            <DotList items={data.books} />
          </div>
          <ImageMosaic altPrefix="کتابخانه و منابع مطالعه" keys={['library-1', 'library-2', 'library-3']} onOpenLightbox={openLightbox} />
        </div>
      </section>

      {/* ۸. نمایشگاه امید — دیوار گالری نامتقارن با ۸ قاب متنوع، ری‌ویل
          پلکانی هنگام اسکرول و Lightbox (بازطراحی بر اساس بازخورد کاربر) */}
      <section id="hope" className="relative scroll-mt-24 bg-card/40 py-14 sm:scroll-mt-28 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-foreground/70">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              آلبوم نمایشگاه پژوهش
            </span>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{data.hopeTitle}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">{data.hopeDesc}</p>
          </div>

          <div ref={hopeReveal.containerRef}>
            {/* کاور سینمایی — همیشه تمام‌عرض و متمایز، در هیچ سایزی به مربع کوچک تبدیل نمی‌شود */}
            <figure
              data-reveal-index={0}
              onClick={() => openLightbox(hopeFrames.map((h) => ({ src: h.img, alt: h.caption })), 0)}
              className={cn(
                'group relative mt-10 aspect-[16/8] cursor-zoom-in overflow-hidden rounded-[2rem] border border-border/60 transition-all duration-700 ease-out sm:mt-12 sm:aspect-[21/8]',
                hopeReveal.visible[0] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              )}
            >
              <ImgTag
                src={heroHopeFrame.img}
                alt={heroHopeFrame.caption}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent"
              />
              <ExpandHint />
              <span className="glass absolute right-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-medium text-foreground/80">
                {heroHopeFrame.tag}
              </span>
              <figcaption className="absolute inset-x-5 bottom-5 text-base font-medium sm:text-lg">{heroHopeFrame.caption}</figcaption>
            </figure>

            {/* Masonry واقعی برای ۷ عکس باقی‌مانده — نسبت‌تصویر هرکدام واقعاً فرق دارد */}
            <div className="mt-4 columns-2 gap-3 sm:mt-5 sm:columns-3 sm:gap-4 lg:columns-4">
              {hopeMasonryFrames.map((f, idx) => {
                const i = idx + 1
                return (
                  <figure
                    key={f.caption}
                    data-reveal-index={i}
                    style={{ transitionDelay: hopeReveal.visible[i] ? `${idx * 70}ms` : '0ms' }}
                    onClick={() => openLightbox(hopeFrames.map((h) => ({ src: h.img, alt: h.caption })), i)}
                    className={cn(
                      'group relative mb-3 block cursor-zoom-in overflow-hidden rounded-[1.75rem] border border-border/60 break-inside-avoid transition-all duration-700 ease-out sm:mb-4',
                      f.tilt,
                      hopeReveal.visible[i] ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                    )}
                  >
                    <ImgTag
                      src={f.img}
                      alt={f.caption}
                      className={cn('w-full object-cover transition-transform duration-700 group-hover:scale-110', f.aspect)}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                    <ExpandHint />
                    <span className="glass absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-foreground/80">
                      {f.tag}
                    </span>
                    <figcaption className="absolute inset-x-4 bottom-4 translate-y-2 text-sm font-medium opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      {f.caption}
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ۹. فعالیت‌های انجام‌شده (بدون طراحی جدید) */}
      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            {data.activitiesTitle}
          </h2>
          <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {data.activities.map((item, idx) => (
              <div key={item} className="glass rounded-[1.5rem] p-5 sm:rounded-[1.75rem] sm:p-6">
                <span className="text-xs font-semibold text-primary">۰{idx + 1}</span>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item}</p>
              </div>
            ))}
          </div>
          <ImageMosaic
            altPrefix="فعالیت‌های فرهنگی و آموزشی پژوهش"
            className="mt-8 sm:mt-12"
            keys={['activities-1', 'activities-2', 'activities-3']}
            onOpenLightbox={openLightbox}
          />
        </div>
      </section>

      {/* ۱۰. چالش‌ها (بدون طراحی جدید) */}
      <section className="relative bg-card/40 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">{data.challengesTitle}</h2>
            <DotList items={data.challenges} />
          </div>
          <ImageFrame
            alt="چالش‌های اصلی پژوهش"
            imageKey="challenges"
            onExpand={() => openLightbox([{ src: abt('challenges'), alt: 'چالش‌های اصلی پژوهش' }], 0)}
          />
        </div>
      </section>

      {/* ۱۱. نیازها (بدون طراحی جدید) */}
      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            {data.needsTitle}
          </h2>
          <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {data.needs.map((item) => (
              <article key={item.title} className="glass rounded-[1.5rem] p-5 sm:rounded-[1.75rem] sm:p-6">
                <span className="text-sm font-semibold">{item.title}</span>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ۱۲. همکاری — ۳ کارت گروه همکار (about-partners.tsx) */}
      <section id="cooperation" className="relative scroll-mt-24 bg-card/40 py-14 sm:scroll-mt-28 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Eyebrow>همکاری</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{data.cooperationTitle}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
                {data.cooperationDesc}
              </p>
            </div>
            <a href="#cooperation-form" className="group inline-flex items-center gap-2 text-sm font-medium text-primary">
              شروع گفت‌وگو
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:mt-12 lg:grid-cols-3">
            {partnerTracks.map(({ icon: Icon, title, desc, img }, i) => (
              <article key={title} className="group glass overflow-hidden rounded-[1.75rem] transition-transform duration-500 hover:-translate-y-1">
                <div className="relative">
                  <ImgTag
                    src={img}
                    alt={title}
                    onClick={() => openLightbox(partnerTracks.map((p) => ({ src: p.img, alt: p.title })), i)}
                    className="h-48 w-full cursor-zoom-in object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <ExpandHint />
                  <span className="glass absolute right-4 bottom-4 flex size-11 items-center justify-center rounded-2xl text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-base font-medium">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold sm:text-base">حمایت از عضویت شاگردان کم‌توان</h3>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {data.supportOptions.map((item) => (
                  <div key={item} className="glass rounded-xl px-3.5 py-2.5 text-xs text-foreground/80 sm:text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold sm:text-base">حمایت تجهیزاتی و برنامه‌ای</h3>
              <DotList items={data.cooperationAreas} />
            </div>
          </div>
        </div>
      </section>

      {/* ۱۳. فرم درخواست همکاری */}
      <section id="cooperation-form" className="relative scroll-mt-24 bg-card/40 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="glass rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-8">
            <h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">درخواست همکاری</h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              اشخاص، نهادها، موسسات و حامیان محترم می‌توانند زمینه همکاری مورد نظر خود را از طریق این فرم با
              پژوهش در میان بگذارند.
            </p>

            <form onSubmit={handleCooperationSubmit} className="mt-6 flex flex-col gap-4 text-right sm:mt-8">
              <div>
                <label htmlFor="coop-type" className="mb-1.5 block text-xs font-medium text-foreground/80">
                  نوع درخواست‌کننده
                </label>
                <select
                  id="coop-type"
                  required
                  value={applicantType}
                  onChange={(e) => setApplicantType(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="">انتخاب کنید</option>
                  {cooperationTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="coop-name" className="mb-1.5 block text-xs font-medium text-foreground/80">
                    نام شخص یا نهاد
                  </label>
                  <input
                    id="coop-name"
                    type="text"
                    required
                    autoComplete="organization"
                    value={coopName}
                    onChange={(e) => setCoopName(e.target.value)}
                    placeholder="نام کامل را وارد کنید"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="coop-contact-name" className="mb-1.5 block text-xs font-medium text-foreground/80">
                    نام مسئول / نماینده (اختیاری)
                  </label>
                  <input
                    id="coop-contact-name"
                    type="text"
                    autoComplete="name"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="نام و نام خانوادگی"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="coop-contact" className="mb-1.5 block text-xs font-medium text-foreground/80">
                  شماره تماس یا ایمیل
                </label>
                <input
                  id="coop-contact"
                  type="text"
                  required
                  autoComplete="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="شماره تماس یا ایمیل رسمی"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="coop-area" className="mb-1.5 block text-xs font-medium text-foreground/80">
                  زمینه مورد نظر برای همکاری
                </label>
                <select
                  id="coop-area"
                  required
                  value={cooperationArea}
                  onChange={(e) => setCooperationArea(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="">انتخاب زمینه همکاری</option>
                  {data.cooperationFormAreas.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="coop-message" className="mb-1.5 block text-xs font-medium text-foreground/80">
                  توضیحات یا پیشنهاد همکاری
                </label>
                <textarea
                  id="coop-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="خلاصه‌ای از پیشنهاد، هدف یا نوع همکاری مورد نظر خود را بنویسید..."
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submitting ? 'در حال ارسال...' : 'ارسال درخواست همکاری'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ۱۴. شفافیت (بدون طراحی جدید) */}
      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">{data.transparencyTitle}</h2>
          <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
            {data.transparencyItems.map((item) => (
              <div key={item} className="glass rounded-[1.5rem] p-5 sm:rounded-[1.75rem] sm:p-6">
                <p className="text-sm leading-relaxed text-foreground/85">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ۱۵. پیام بنیان‌گذار — عکس + نقل‌قول (founder-note.tsx) */}
      <section id="founder" className="relative scroll-mt-24 py-14 sm:scroll-mt-28 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card p-4 sm:p-6">
            <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
              <figure className="group relative overflow-hidden rounded-[1.75rem] border border-border/50">
                <ImgTag
                  src={abt('founder')}
                  alt="سالن پژوهش"
                  onClick={() => openLightbox([{ src: abt('founder'), alt: 'پیام بنیان‌گذار مجتمع پژوهش' }], 0)}
                  className="h-80 w-full cursor-zoom-in object-cover sm:h-[28rem]"
                />
                <ExpandHint />
              </figure>
              <div className="lg:pl-2">
                <Eyebrow>{data.founderTitle}</Eyebrow>
                <Quote className="mt-6 size-8 text-primary/40" aria-hidden="true" />
                <blockquote className="mt-4 space-y-4 text-base leading-relaxed text-pretty sm:text-lg">
                  <p>{data.founderText}</p>
                  <p className="text-sm text-muted-foreground sm:text-base">{data.founderTextSecondary}</p>
                </blockquote>
                <figcaption className="mt-8 border-t border-border/60 pt-5">
                  <p className="text-sm font-medium">بنیان‌گذار مجتمع پژوهش</p>
                </figcaption>
              </div>
            </div>
          </div>
        </div>
      </section>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={() => stepLightbox(-1)}
          onNext={() => stepLightbox(1)}
        />
      )}
    </>
  )
}

/**
 * === فهرست کلیدهای تصویر این صفحه و وضعیت اتصال‌شان به پنل ادمین ===
 * همه از data.aboutPageImages (پنل ادمین) resolve می‌شوند. تمام کلیدهایی
 * که این صفحه واقعاً استفاده می‌کند اکنون در ABOUT_IMAGE_GROUPS
 * (AdminDashboard.jsx) جایگاه دارند — یک اسکریپت تطبیقی خودکار این را
 * تأیید کرده (۴۰ کلید، بدون هیچ کم یا زیاد). سه کلید (intro, story-3,
 * cooperation) که در نسخه‌ی قدیمی پنل بودند ولی هیچ‌جای این چیدمان به
 * آن‌ها اشاره نمی‌کرد، عمداً حذف شدند تا همان باگ «آپلود می‌کنم ولی هیچی
 * تغییر نمی‌کند» را دوباره نسازند.
 *
 * === رفع باگ hero (بازخورد کاربر: «آپلود میکنم ولی هیچی عوض نمیشه») ===
 * دو مشکل جدا بود:
 *  ۱) PageHero.jsx اصلاً bgImage نمی‌گرفت این صفحه — رفع شد (فاز قبلی).
 *  ۲) حتی بعد از رفع (۱)، چون fallback عمداً undefined بود، تا وقتی ادمین
 *     چیزی آپلود نکرده بود، این بخش کاملاً بدون عکس (فقط گرادیان) می‌ماند
 *     و «خیلی خالی» به‌نظر می‌رسید. اکنون fallback همان mainHeroImage
 *     (عکس هیروی صفحه اصلی) است — دقیقاً مثل الگوی بقیه‌ی صفحات
 *     (bgAchievements/bgScholarships/...)، تا این بخش هیچ‌وقت خالی نباشد،
 *     ولی به‌محض آپلود یک عکس اختصاصی از پنل، همان اولویت دارد.
 * اگر بعد از این هم عکس آپلودی در صفحه‌ی زنده دیده نشد (نه با fallback، با
 * fallback که طبیعی و درست است)، احتمال اصلی یک تنظیم زیرساختی است، نه
 * باگ در این فایل: در Supabase Storage → باکت «portal-images» باید Public
 * باشد. تست سریع: روی پیش‌نمایش عکس در پنل ادمین راست‌کلیک → «باز کردن
 * تصویر در تب جدید»؛ اگر همان‌جا هم باز نشد (۴۰۳/۴۰۴)، مشکل از تنظیمات
 * باکت است، نه از کد.
 *
 * === Lightbox سراسری + بازطراحی گالری «نمایشگاه امید» (بازخورد کاربر) ===
 * - همه‌ی عکس‌های این صفحه (بنتوی نگاه کلی، داستان، مأموریت، مخاطبان، هر ۴
 *   موزاییک دختران/کانکور/کتابخانه/فعالیت‌ها، چالش‌ها، نمایشگاه امید، همکاری،
 *   بنیان‌گذار) کلیک‌پذیرند و در یک Lightbox تمام‌صفحه با ناوبری قبلی/بعدی
 *   (کیبورد، دکمه، سوایپ لمسی) و دکمه بستن باز می‌شوند.
 * - گالری «نمایشگاه امید» یک کاور سینمایی تمام‌عرض + یک masonry واقعی
 *   (columns-*) با ۷ نسبت‌تصویر واقعاً متفاوت است، نه یک گرید یکنواخت.
 * - آمار ۴گانه‌ی بخش «نگاه کلی» (ساعت/مساحت/خدمت/کشور مقصد) از
 *   data.glanceStat1..4 Value/Label می‌آید و از پنل ادمین قابل ویرایش است؛
 *   مقدار پیش‌فرض «کشور مقصد» دیگر عدد ثابت نیست («بدون مرز»)، چون فهرست
 *   بورسیه‌ها می‌تواند در طول زمان از چند کشور تا ده‌ها کشور تغییر کند.
 */
