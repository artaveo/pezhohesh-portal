import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePortal } from '../contexts/PortalDataContext'
import { cn } from '../lib/utils'

/**
 * === بخش ۱۴: بازنویسی کامل موتور حرکت گالری سالن مطالعه ===
 * نسخه‌های قبلی همه بر پایه‌ی CSS @keyframes بودند (چه با درصد، چه با
 * متغیر CSS اندازه‌گیری‌شده). مشکل ریشه‌ای آن رویکرد این بود که یک
 * انیمیشن CSS در حال اجرا را نمی‌شود «به دست کاربر داد» تا بکشدش — و
 * چون حالا قابلیت کشیدن با دست (drag) هم خواسته شده، تنها راه درست این
 * است که موقعیت مسیر متحرک را خودِ جاوااسکریپت، فریم‌به‌فریم، محاسبه و
 * مستقیم روی transform اعمال کند؛ همان یک عدد (offsetRef.current) هم
 * منبع حرکت خودکار است، هم منبع کشیدن با دست — یعنی رها کردن دست دقیقاً
 * از همان‌جا که کاربر ول کرد ادامه می‌دهد، بدون هیچ پرش یا مکث.
 *
 * بی‌درزی لوپ با محاسبه‌ی mod (باقی‌مانده) تضمین می‌شود: در هر فریم،
 * offset با «% lapWidth» به بازه‌ی [0, lapWidth) برگردانده می‌شود — یعنی
 * از نظر ریاضی هرگز نمی‌تواند از این بازه خارج شود. برای اینکه در تمام
 * این بازه، صفحه همیشه پر بماند، به‌جای حدس زدن عرض صفحه، عرض *واقعی*
 * محفظه‌ی نمایش (viewport این گالری، نه کل پنجره‌ی مرورگر) با
 * getBoundingClientRect اندازه‌گیری می‌شود و تعداد کپی‌های لازم دقیقاً
 * بر همان اساس محاسبه می‌شود.
 *
 * منبع دیتا (portalData.loungeGalleryImages) و رفتار «اگر عکسی نیست، کل
 * بخش رندر نشود» دقیقاً مثل قبل حفظ شده‌اند.
 */

// سرعت پیشروی خودکار — پیکسل بر ثانیه. عددی ملایم و پیوسته.
// === رفع بازخورد کاربر: سرعت قبلی (۴۰) زیاد بود؛ به نصف کاهش یافت. ===
const PIXELS_PER_SECOND = 20
// اگر مجموع جابه‌جایی انگشت/موس از این کمتر بود، «کلیک» حساب می‌شود
// (برای باز کردن لایت‌باکس)؛ بیشتر از این، «کشیدن» حساب می‌شود.
const DRAG_CLICK_THRESHOLD = 6

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e) => setReduced(e.matches)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [])
  return reduced
}

// اندازه‌گیری واقعی عرض یک عنصر (نه فرمول نظری)، با ResizeObserver همراه
// تا با تغییر سایز صفحه یا محتوا، فوراً به‌روز شود.
function useMeasuredWidth(dependencyKey) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.getBoundingClientRect().width)
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencyKey])
  return [ref, width]
}

// یک «دور کامل» عکس‌ها — این کامپوننت به تعداد copiesNeeded پشت‌سرهم
// رندر می‌شود (یک نسخه‌ی اندازه‌گیری‌شونده‌ی اول + بقیه صرفاً کپی‌های
// بصری برای پوشاندن کامل صفحه در طول چرخه‌ی حرکت).
function GalleryLap({ images, forwardedRef, isDuplicate, onOpen }) {
  return (
    <div ref={forwardedRef} className="flex shrink-0" aria-hidden={isDuplicate || undefined}>
      {images.map((url, i) => (
        <div
          key={i}
          role="button"
          tabIndex={isDuplicate ? -1 : 0}
          onClick={() => onOpen(i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onOpen(i)
          }}
          className="glass me-3 w-[170px] shrink-0 overflow-hidden rounded-[1.25rem] transition-transform duration-500 hover:-translate-y-1 min-[420px]:w-[200px] min-[420px]:rounded-[1.5rem] sm:me-4 sm:w-[300px] sm:rounded-[1.75rem]"
        >
          {/* === رفع بازخورد کاربر: اندازه عکس در موبایل کمی بزرگ بود و در
              چرخش تقریباً فقط یک عکس دیده می‌شد ===
              راه‌حل دو بخشی است: ۱) عرض کارت در موبایل کوچک‌تر شد (و در یک
              پله‌ی میانی هم تعریف شد) تا همیشه لبه‌ی عکس بعدی هم دیده شود و
              کاربر بفهمد می‌تواند بکشد. ۲) ارتفاع دیگر یک عدد ثابت
              جداگانه (h-48/h-60) نیست، بلکه با aspect-[4/3] (همان نسبت
              دقیق ۲۴۰:۱۹۲ قبلی) به‌صورت خودکار از روی عرض محاسبه می‌شود —
              یعنی برای هر عرضی (کوچک‌ترین موبایل تا بزرگ‌ترین دسکتاپ) عکس
              همیشه با همان نسبت درست کراپ می‌شود، بدون نیاز به تعریف
              دستی ارتفاع برای هر breakpoint جدید. */}
          <img
            src={url}
            alt="عکس واقعی از داخل سالن مطالعه پژوهش"
            draggable={false}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}

// === Lightbox اختصاصی گالری سالن، با پیش‌نمایش محو دو طرف ===
// عمداً یک کامپوننت مستقل و محلی است (نه Lightbox مشترک صفحه «درباره
// ما») چون آن یکی چنین پیش‌نمایش محوی ندارد و تغییر آن، صفحه‌ی دیگری را
// هم تحت تأثیر قرار می‌داد؛ ساختار کلی (کیبورد/اسکرول قفل/سوایپ لمسی) اما
// از همان الگوی تأییدشده کپی شده تا در کل سایت یکدست بماند.
function GalleryLightbox({ images, index, onClose, onPrev, onNext }) {
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
  const total = images.length
  const hasMultiple = total > 1
  const current = images[index]
  const prevSrc = hasMultiple ? images[(index - 1 + total) % total] : null
  const nextSrc = hasMultiple ? images[(index + 1) % total] : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="نمایش بزرگ‌شده عکس سالن مطالعه"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-foreground/85 p-4 backdrop-blur-md transition-opacity duration-300 sm:p-8',
        entered ? 'opacity-100' : 'opacity-0'
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن"
        className="glass absolute left-4 top-4 z-20 flex size-10 items-center justify-center rounded-full text-foreground/90 transition-transform duration-200 hover:scale-105 sm:left-6 sm:top-6"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      {/* پیش‌نمایش محو عکس قبلی — سمت راست */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          aria-label="عکس قبلی"
          className="absolute inset-y-0 right-0 z-0 hidden w-1/3 items-center justify-end overflow-hidden sm:flex"
        >
          <img
            src={prevSrc}
            alt=""
            aria-hidden="true"
            className={cn(
              'h-2/3 w-4/5 scale-90 rounded-2xl object-cover blur-md transition-all duration-500',
              entered ? 'translate-x-[35%] opacity-35' : 'translate-x-[55%] opacity-0'
            )}
          />
        </button>
      )}
      {/* پیش‌نمایش محو عکس بعدی — سمت چپ */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          aria-label="عکس بعدی"
          className="absolute inset-y-0 left-0 z-0 hidden w-1/3 items-center justify-start overflow-hidden sm:flex"
        >
          <img
            src={nextSrc}
            alt=""
            aria-hidden="true"
            className={cn(
              'h-2/3 w-4/5 scale-90 rounded-2xl object-cover blur-md transition-all duration-500',
              entered ? '-translate-x-[35%] opacity-35' : '-translate-x-[55%] opacity-0'
            )}
          />
        </button>
      )}

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            aria-label="عکس قبلی"
            className="glass absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground/90 transition-transform duration-200 hover:scale-105 sm:right-6"
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
            className="glass absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground/90 transition-transform duration-200 hover:scale-105 sm:left-6"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        </>
      )}

      <figure
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative z-10 flex max-h-full max-w-full flex-col items-center transition-all duration-300',
          entered ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        <img
          key={current}
          src={current}
          alt="عکس واقعی از داخل سالن مطالعه پژوهش"
          className="max-h-[70vh] w-auto max-w-[85vw] rounded-2xl object-contain shadow-2xl sm:max-h-[78vh] sm:max-w-[55vw]"
        />
        {hasMultiple && (
          <figcaption className="glass mt-4 rounded-full px-4 py-2 text-center text-xs text-foreground/90 sm:text-sm">
            {index + 1} / {total}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

export function HallGallery() {
  const { portalData } = usePortal()
  const rawImages = Array.isArray(portalData?.loungeGalleryImages) ? portalData.loungeGalleryImages : []
  const urls = rawImages.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)

  const [lightboxIndex, setLightboxIndex] = useState(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const canLoop = urls.length > 1
  const lap = urls

  const [lapRef, lapWidth] = useMeasuredWidth(urls.join('|'))
  // === اندازه‌گیری عرض واقعی محفظه‌ی نمایش (نه حدس زدن عرض کل پنجره) ===
  const [containerRef, containerWidth] = useMeasuredWidth('gallery-viewport')

  // === تعداد کپی‌های لازم برای پوشاندن کامل صفحه در تمام لحظات چرخه ===
  // برای اینکه هیچ لحظه‌ای از حرکت (offset از ۰ تا lapWidth) صفحه خالی
  // نباشد، باید حداقل (lapWidth + عرض محفظه) پیکسل محتوا رندر شده باشد.
  // یک کپی اضافه هم به‌عنوان حاشیه‌ی اطمینان اضافه شده است.
  const copiesNeeded =
    canLoop && lapWidth > 0 ? Math.max(3, Math.ceil((lapWidth + containerWidth) / lapWidth) + 1) : 1

  const canRunLoop = canLoop && lapWidth > 0

  const trackRef = useRef(null)
  const offsetRef = useRef(0)
  const lastFrameRef = useRef(null)
  const draggingRef = useRef(false)
  const pointerRef = useRef({ id: null, startX: 0, startOffset: 0, moved: 0 })

  // === تنها منبع حقیقتِ موقعیت مسیر متحرک ===
  // این حلقه هم پیشروی خودکار را انجام می‌دهد، هم موقعیت کشیده‌شده با
  // دست را روی صفحه اعمال می‌کند — چون transform مستقیماً روی DOM نوشته
  // می‌شود (نه با state)، هیچ رندر مجدد React لازم نیست و رها کردن دست
  // دقیقاً از همان‌جا که ول شد ادامه پیدا می‌کند.
  useEffect(() => {
    if (!canRunLoop) return
    let rafId
    const tick = (time) => {
      if (lastFrameRef.current == null) lastFrameRef.current = time
      const dt = (time - lastFrameRef.current) / 1000
      lastFrameRef.current = time
      if (!draggingRef.current && !prefersReducedMotion) {
        offsetRef.current += PIXELS_PER_SECOND * dt
      }
      offsetRef.current = ((offsetRef.current % lapWidth) + lapWidth) % lapWidth
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafId)
      lastFrameRef.current = null
    }
  }, [canRunLoop, lapWidth, prefersReducedMotion])

  const handlePointerDown = (e) => {
    // === رفع باگ گزارش‌شده: کلیک روی عکس‌های گالری دیگر بزرگ نمی‌شد ===
    // ریشه‌ی باگ: قبلاً pointerRef.current فقط داخل شرط canRunLoop ریست
    // می‌شد. یعنی اگر یک بار (حتی خیلی جزئی) روی گالری کشیده می‌شد و بعد
    // از آن، به هر دلیلی (مثلاً یک ری‌مِژر لحظه‌ای عرض توسط
    // ResizeObserver) canRunLoop لحظه‌ای false می‌شد، همین «return» زودتر
    // اجرا می‌شد و مقدار قبلیِ pointerRef.current.moved (بالاتر از حد
    // آستانه‌ی کلیک) برای همیشه باقی می‌ماند — یعنی openLightbox از آن به
    // بعد هر کلیکی را اشتباهاً «کشیدن» تشخیص می‌داد و لایت‌باکس دیگر هرگز
    // باز نمی‌شد. راه‌حل: این ریست همیشه (چه canRunLoop باشد چه نباشد)
    // همان اول تابع انجام شود، پیش از هر return زودهنگام.
    pointerRef.current = { id: e.pointerId, startX: e.clientX, startOffset: offsetRef.current, moved: 0 }
    if (!canRunLoop) return
    draggingRef.current = true
    // === رفع باگ گزارش‌شده: با موس کلیک باز نمی‌کرد (با لمس/تاچ درست بود) ===
    // وقتی pointerId با setPointerCapture به همین ظرف بیرونی «قفل» می‌شود،
    // در برخی مرورگرها رویداد click که بلافاصله بعد از رهاشدن دکمه شلیک
    // می‌شود، به‌جای خودِ کارت عکس، روی همین ظرف بیرونی (که capture کرده)
    // هدف‌گیری می‌شود؛ چون این ظرف onClick ندارد، کلیک عملاً گم می‌شود و
    // openLightbox هرگز صدا زده نمی‌شود. این رفتار مخصوص pointerType
    // «mouse» است — لمس/قلم درگیر این مشکل نیستند (برای همین با تاچ درست
    // کار می‌کرد). راه‌حل: capture را فقط برای انواع غیر-موس نگه می‌داریم؛
    // کشیدن با ماوس همچنان کار می‌کند (چون نشانگر معمولاً داخل محدوده‌ی
    // گالری می‌ماند)، و کلیک با ماوس دوباره به‌درستی به کارت می‌رسد.
    if (e.pointerType !== 'mouse') {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    e.currentTarget.style.cursor = 'grabbing'
  }

  const handlePointerMove = (e) => {
    if (!draggingRef.current || pointerRef.current.id !== e.pointerId) return
    const dx = e.clientX - pointerRef.current.startX
    pointerRef.current.moved = Math.abs(dx)
    offsetRef.current = pointerRef.current.startOffset - dx
  }

  const endDrag = (e) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(pointerRef.current.id)
    } catch {
      /* noop */
    }
    e.currentTarget.style.cursor = 'grab'
    // توجه: moved همین الان صفر نمی‌شود چون رویداد click (که بلافاصله بعد
    // از pointerup شلیک می‌شود) هنوز به همین مقدار نیاز دارد تا تشخیص دهد
    // این یک کشیدن واقعی بوده نه یک کلیک. صفرشدنش به تیک بعدی موکول می‌شود.
    setTimeout(() => {
      pointerRef.current.moved = 0
    }, 0)
  }

  const openLightbox = (i) => {
    if (pointerRef.current.moved > DRAG_CLICK_THRESHOLD) return
    setLightboxIndex(i)
  }
  const closeLightbox = () => setLightboxIndex(null)
  const step = (delta) =>
    setLightboxIndex((current) => (current === null ? null : (current + delta + urls.length) % urls.length))

  if (urls.length === 0) return null

  return (
    <section id="gallery" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-[0.2em] text-primary">نمای واقعی سالن</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
            چند نگاه از داخل سالن مطالعه
          </h2>
        </div>

        {/* === رفع ریشه‌ای باگ اصلی (پرش/خالی‌شدن صفحه در لوپ) ===
            کل سایت dir="rtl" است (index.html). این یعنی این <div> بدون
            جهت صریح، به‌صورت پیش‌فرض RTL است؛ چون عرض واقعی نوار عکس‌ها
            (track) از عرض همین محفظه بیشتر است، مرورگر آن را از سمت
            «شروع منطقی» که در RTL همان لبه‌ی راست است می‌چسباند و به چپ
            سرریز می‌کند. اما محاسبه‌ی transform: translateX(-offset) در
            useEffect بالا کاملاً بر این فرض نوشته شده که نوار از لبه‌ی
            چپ محفظه شروع می‌شود و به راست ادامه دارد (یعنی یک فرض LTR).
            این دو ناسازگاری باعث می‌شد لبه‌ی «چسبیده» واقعی نوار هر لحظه
            جابه‌جا به‌نظر برسد: همان چیزی که کاربر به‌صورت «پرش ناگهانی»،
            «خالی‌شدن یک سمت صفحه در لحظه‌ی ریست لوپ»، و «کشیدن با ماوس/
            انگشت که دقیق دنبال نمی‌کند» گزارش کرد. راه‌حل استاندارد و
            رایج برای کاروسل‌های حرکتی داخل سایت‌های RTL همین است: مکانیزم
            حرکت را با dir="ltr" مستقل از جهت کلی صفحه می‌کنیم (فقط همین
            محفظه‌ی گالری، نه بقیه‌ی سایت)، تا لبه‌ی چپِ نوار همیشه دقیقاً
            همان‌جایی باشد که ریاضیات translateX انتظار دارد. از آن‌جا که
            محتوای داخل کارت‌ها فقط عکس است (بدون متن جهت‌دار)، این تغییر
            هیچ اثر بصری روی خواندن/چیدمان RTL بقیه‌ی سایت یا حتی همین
            بخش (تیتر بالای گالری) ندارد — فقط مکانیزم حرکتِ خودِ نوار را
            درست می‌کند. */}
        <div
          ref={containerRef}
          dir="ltr"
          className="mt-8 touch-pan-y select-none overflow-hidden sm:mt-12"
          style={{ cursor: canRunLoop ? 'grab' : 'default' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            ref={trackRef}
            className="flex"
            style={{ width: 'max-content', willChange: canRunLoop ? 'transform' : undefined }}
          >
            {Array.from({ length: canLoop ? copiesNeeded : 1 }).map((_, copyIndex) => (
              <GalleryLap
                key={copyIndex}
                images={lap}
                forwardedRef={copyIndex === 0 ? lapRef : undefined}
                isDuplicate={copyIndex > 0}
                onOpen={openLightbox}
              />
            ))}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={urls}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />
      )}
    </section>
  )
}
