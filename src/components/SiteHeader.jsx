import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, Megaphone, Sun, Moon } from 'lucide-react'
import { cn } from '../lib/utils'
import { usePortal } from '../contexts/PortalDataContext'
import { useTheme } from '../contexts/ThemeContext'

const nav = [
  { href: '/', label: 'صفحه اصلی' },
  { href: '/lounge', label: 'سالن مطالعه' },
  {
    href: '/services',
    label: 'خدمات تحصیلی',
    children: [
      { href: '/services', label: 'معرفی خدمات تحصیلی' },
      { href: '/active-scholarships', label: '🎓 بورسیه‌های فعال' },
    ],
  },
  { href: '/achievements', label: 'دستاوردها' },
  {
    href: '/about',
    label: 'درباره ما',
    children: [
      { href: '/about#glance', label: 'نگاهی به پژوهش' },
      { href: '/about#story', label: 'داستان ما' },
      { href: '/about#mission', label: 'ماموریت و چشم‌انداز' },
      { href: '/about#audiences', label: 'مخاطبان ما' },
      { href: '/about#hope', label: 'نمایشگاه امید' },
      { href: '/about#cooperation', label: 'درخواست همکاری' },
      { href: '/about#founder', label: 'پیام بنیان‌گذار' },
    ],
  },
  { href: '#footer-main', label: 'ارتباط با ما', isAnchor: true },
]

function isActive(pathname, href) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * === رفع باگ گزارش‌شده (نسخه‌ی دوم/دقیق‌شده): نوار اعلانیه از نظر عرض ===
 * توضیح قبلی من اشتباه بود — مشکل ارتفاع هدر نبود. مشکل واقعی این بود که
 * روی <p> کلاس truncate گذاشته شده بود (white-space: nowrap +
 * overflow: hidden + سه‌نقطه‌ی پایانی). یعنی وقتی عرض صفحه (مثلاً روی
 * موبایل) از عرض کامل متن اعلانیه کمتر بود، فقط کلمات ابتدایی دیده
 * می‌شدند و بقیه‌ی متن — بدون هیچ راهی برای کاربر جهت دیدنش — برای همیشه
 * پشت «...» پنهان می‌ماند.
 *
 * راه‌حل: به‌جای بریدن متن، وقتی عرض واقعی متن از عرض محفظه‌اش بیشتر
 * باشد (اندازه‌گیری واقعی با ResizeObserver، نه فرض ثابت)، متن به‌آرامی
 * به‌صورت افقی اسکرول می‌شود (مثل نوار اخبار) تا تمام کلمات — از اول تا
 * آخر — دیر یا زود روی هر عرض صفحه‌ای دیده شوند. اگر متن کوتاه باشد و
 * جا شود، هیچ انیمیشنی اجرا نمی‌شود و فقط عادی نمایش داده می‌شود.
 *
 * === نکته‌ی فیزیک RTL/LTR (طبق همان تجربه‌ی HallGallery.jsx) ===
 * محاسبه‌ی transform: translateX(-50%) برای لوپ بی‌درز، بر پایه‌ی این
 * فرض نوشته می‌شود که محفظه از چپ به راست پیش می‌رود (یک فرض LTR). برای
 * اینکه این ریاضیات مستقل از جهت کلی سایت (dir="rtl" در index.html)
 * درست کار کند، فقط همین محفظه‌ی کوچک با dir="ltr" ایزوله می‌شود — متن
 * فارسی/دری داخلش با dir="rtl" مجزا مشخص شده تا حروف و ترتیب کلمات
 * کاملاً درست و خوانا بماند (dir روی مکانیزم حرکت اثر می‌گذارد، نه روی
 * ترتیب نویسه‌های یک رشته‌ی قویاً راست‌به‌چپ مثل فارسی).
 */
function AnnouncementMarquee({ text }) {
  const containerRef = useRef(null)
  const measureRef = useRef(null)
  const [marquee, setMarquee] = useState({ needed: false, durationSec: 12 })

  useLayoutEffect(() => {
    const container = containerRef.current
    const measureEl = measureRef.current
    if (!container || !measureEl) return undefined

    // سرعت ثابت مطالعه (پیکسل بر ثانیه) — نه یک مدت‌زمان حدسی برای کل
    // نوار؛ این‌طور اعلانیه‌های کوتاه سریع و اعلانیه‌های بلند با همان
    // سرعت خوانا (نه سریع‌تر/کندتر) رد می‌شوند.
    const PIXELS_PER_SECOND = 55
    const MIN_DURATION_SEC = 6

    const measure = () => {
      const containerWidth = container.clientWidth
      const textWidth = measureEl.scrollWidth
      const overflowing = textWidth > containerWidth + 2
      setMarquee({
        needed: overflowing,
        durationSec: Math.max(MIN_DURATION_SEC, textWidth / PIXELS_PER_SECOND),
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [text])

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 overflow-hidden">
      {/* عنصر نامرئی صرفاً برای اندازه‌گیری عرض واقعی متن — هیچ اثر بصری ندارد */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="invisible absolute start-0 top-0 whitespace-nowrap text-[11px] font-medium sm:text-xs"
      >
        {text}
      </span>

      {marquee.needed ? (
        // متن جا نمی‌شود: فقط این‌جا مکانیزم اسکرول با محفظه‌ی dir="ltr"
        // مجزا فعال می‌شود (طبق توضیح فیزیک RTL/LTR بالا).
        <div dir="ltr" className="overflow-hidden">
          <div
            className="announcement-marquee flex w-max items-center gap-14 whitespace-nowrap text-[11px] font-medium hover:[animation-play-state:paused] sm:text-xs"
            style={{ animationDuration: `${marquee.durationSec}s` }}
          >
            <span dir="rtl">{text}</span>
            <span dir="rtl" aria-hidden="true">
              {text}
            </span>
          </div>
        </div>
      ) : (
        // متن به‌راحتی جا می‌شود: همان نمایش ساده و راست‌چین قبلی، بدون
        // بریدن و بدون نیاز به هیچ مکانیزم حرکتی.
        <p className="truncate text-[11px] font-medium sm:text-xs">{text}</p>
      )}
    </div>
  )
}

export function SiteHeader() {
  const { pathname } = useLocation()
  const { portalData } = usePortal()
  const { isDark, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  // === اتصال اعلانیه متحرک سقف سایت به پنل ادمین (announcement) ===
  // اگر ادمین متن را در پنل خالی/حذف کند، نواری نمایش داده نمی‌شود؛ کاربر
  // هم می‌تواند با دکمه × آن را برای همین بازدید فعلی ببندد (حالت محلی،
  // ذخیره نمی‌شود و در بازدید بعدی دوباره نمایش داده خواهد شد).
  // === رفع باگ گزارش‌شده: تیک نمایش/عدم‌نمایش نوار اعلان ===
  // علاوه بر متن، اکنون یک پرچم مستقل (announcementEnabled) هم باید true
  // باشد؛ پیش‌فرض true است تا اگر ادمین هنوز این فیلد جدید را ذخیره نکرده
  // (adminData?.announcementEnabled === undefined)، رفتار فعلی سایت
  // (نمایش خودکار وقتی متنی هست) بدون تغییر بماند.
  const [dismissed, setDismissed] = useState(false)
  const announcementText = portalData?.announcement || ''
  const isAnnouncementEnabled = portalData?.announcementEnabled !== false

  useEffect(() => {
    setDismissed(false)
  }, [announcementText])
  // === رفع باگ: قبلاً یک boolean مشترک بین همه آیتم‌های دارای زیرمنو بود
  // (چون فقط «خدمات تحصیلی» زیرمنو داشت، دیده نمی‌شد؛ حالا که «درباره ما»
  // هم زیرمنو گرفته، هر آیتم باید مستقل باز/بسته شود). با نگه‌داشتن href
  // آیتمی که بازست (یا null اگر هیچ‌کدام باز نیست) هر آکاردئون مستقل عمل می‌کند.
  const [openDropdownHref, setOpenDropdownHref] = useState(null)

  // === رفع باگ گزارش‌شده: نوار اعلانیه/هدر روی موبایل «نصفه» دیده می‌شد ===
  // علت واقعی این نبود که خودِ نوار اعلانیه بریده می‌شد؛ مشکل این بود که
  // هیرو هر صفحه (Hero.jsx و PageHero.jsx) یک فاصله‌ی بالای ثابت و هاردکد
  // (pt-28 / sm:pt-36 / lg:pt-40) داشت که فقط برای حالتی حساب شده بود که
  // نوار اعلانیه خاموش است. وقتی ادمین یک اعلانیه فعال می‌کند، هدر fixed
  // یک ردیف اضافه (همان نوار سبز) می‌گیرد و بلندتر می‌شود، اما چون فاصله‌ی
  // بالای هیرو عدد ثابتی بود و خودش را با ارتفاع واقعی هدر تطبیق نمی‌داد،
  // ابتدای عنوان هر صفحه دقیقاً زیر هدر می‌رفت و نصفه دیده می‌شد — این روی
  // موبایل بیشتر به چشم می‌آمد چون کوچک‌ترین مقدار pt (پت-۲۸) برای موبایل
  // تعریف شده بود و کمترین فاصله‌ی اضافه را داشت.
  //
  // راه‌حل ریشه‌ای (نه یک عدد حدسی جدید): با ResizeObserver ارتفاع واقعی
  // هدر (نوار ناوبری + نوار اعلانیه اگر فعال باشد + فاصله‌ی امن بالای
  // صفحه‌ی نوچ‌دار) در هر لحظه اندازه‌گیری و در متغیر CSS سراسری
  // --header-clearance (تعریف‌شده در index.css) ذخیره می‌شود. Hero.jsx و
  // PageHero.jsx اکنون فاصله‌ی بالای خود را از همین متغیر می‌خوانند، پس
  // چه اعلانیه روشن باشد چه خاموش، چه روی موبایل چه دسکتاپ، فاصله همیشه
  // دقیقاً به‌اندازه‌ی ارتفاع واقعی هدر + کمی فاصله‌ی نفس (breathing room)
  // خواهد بود — نه یک عدد ثابت که فقط برای یک حالت خاص درست از آب درآمده بود.
  const headerRef = useRef(null)

  useLayoutEffect(() => {
    const node = headerRef.current
    if (!node) return undefined

    const BREATHING_ROOM_PX = 40

    const updateClearance = () => {
      const height = node.offsetHeight
      document.documentElement.style.setProperty('--header-clearance', `${height + BREATHING_ROOM_PX}px`)
    }

    updateClearance()

    const observer = new ResizeObserver(updateClearance)
    observer.observe(node)
    return () => observer.disconnect()
    // announcementText/isAnnouncementEnabled/dismissed تغییر ارتفاع هدر را
    // باعث می‌شوند (ظاهر/پنهان‌شدن نوار اعلانیه)؛ ResizeObserver خودش این
    // تغییرات را می‌گیرد، ولی این‌ها را به‌عنوان وابستگی هم اضافه می‌کنیم
    // تا بلافاصله بعد از رندر مجدد (نه فقط بعد از رسیدن رویداد observer)
    // یک بار محاسبه‌ی فوری هم انجام شود.
  }, [announcementText, isAnnouncementEnabled, dismissed])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setOpenDropdownHref(null)
  }, [pathname])

  const currentLogo =
    pathname === '/services' || pathname === '/active-scholarships'
      ? '/images/logo-services.png'
      : '/images/logo-lounge.png'

  const cta =
    pathname === '/lounge'
      ? { href: '#lounge-form-section', label: 'ثبت‌نام آنلاین سالن' }
      : pathname === '/services' || pathname === '/active-scholarships'
        ? { href: '#service-form-section', label: 'وقت مشاوره بگیرید' }
        : { href: '#footer-main', label: 'ارتباط با پذیرش مجتمع' }

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-[max(1rem,env(safe-area-inset-top))]"
    >
      {announcementText && isAnnouncementEnabled && !dismissed && (
        <div className="mx-auto mb-2 flex max-w-6xl items-center gap-2.5 rounded-2xl bg-primary px-3.5 py-2 text-primary-foreground sm:rounded-3xl sm:px-5">
          <Megaphone className="size-4 shrink-0" aria-hidden="true" />
          <AnnouncementMarquee text={announcementText} />
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="بستن اعلانیه"
            className="flex size-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-primary-foreground/15"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
      <nav
        aria-label="ناوبری اصلی"
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl px-3 py-2.5 transition-all duration-500 sm:gap-4 sm:rounded-3xl sm:px-5 sm:py-3',
          scrolled ? 'glass-strong shadow-[0_18px_50px_-30px_oklch(0.24_0.05_165/0.55)]' : 'glass',
        )}
      >
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-card text-foreground sm:size-10">
            <img
              src={currentLogo}
              alt="لوگو مجتمع پژوهش"
              className="h-full w-full object-contain p-1"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.textContent = '🏛️'
              }}
            />
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-sm font-semibold tracking-tight">مجتمع پژوهش</span>
            <span className="truncate text-[11px] text-muted-foreground">سالن مطالعه و خدمات تحصیلی</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-0.5 xl:flex">
          {nav.map((item) => {
            const active = !item.isAnchor && isActive(pathname, item.href)
            return (
              <li key={item.href + item.label} className="group relative">
                {item.isAnchor ? (
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
                    )}
                  >
                    {item.label}
                    {item.children && <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />}
                  </Link>
                )}

                {item.children && (
                  <div className="pointer-events-none absolute end-0 top-full pt-2 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                    <ul className="glass-strong w-56 rounded-2xl p-2">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link
                            to={c.href}
                            className="block rounded-xl px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-secondary hover:text-secondary-foreground"
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'روشن کردن حالت روز' : 'روشن کردن حالت شب'}
            title={isDark ? 'حالت روز' : 'حالت شب'}
            className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-card/60 text-foreground transition-colors hover:bg-secondary sm:size-10"
          >
            {isDark ? <Sun className="size-4 sm:size-5" /> : <Moon className="size-4 sm:size-5" />}
          </button>
          <a
            href={cta.href}
            className="hidden rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 sm:text-sm md:inline-flex md:px-5"
          >
            {cta.label}
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
            className="flex size-9 items-center justify-center rounded-2xl border border-border bg-card/60 text-foreground sm:size-10 xl:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="glass-strong mx-auto mt-2 max-w-6xl rounded-3xl p-3 xl:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="mb-1 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm text-foreground/80 transition-colors hover:bg-secondary"
          >
            <span>{isDark ? 'حالت روز' : 'حالت شب'}</span>
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href + item.label}>
                {item.isAnchor ? (
                  <a
                    href={item.href}
                    className="block rounded-2xl px-4 py-3 text-sm text-foreground/80 transition-colors hover:bg-secondary"
                  >
                    {item.label}
                  </a>
                ) : item.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDropdownHref((current) => (current === item.href ? null : item.href))
                      }
                      aria-expanded={openDropdownHref === item.href}
                      className={cn(
                        'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-secondary',
                        isActive(pathname, item.href) ? 'text-primary' : 'text-foreground/80',
                      )}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform',
                          openDropdownHref === item.href && 'rotate-180',
                        )}
                      />
                    </button>
                    {openDropdownHref === item.href && (
                      <ul className="mb-1 ms-4 border-s border-border/70 ps-3">
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              to={c.href}
                              className="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      'block rounded-2xl px-4 py-3 text-sm transition-colors hover:bg-secondary',
                      isActive(pathname, item.href) ? 'text-primary' : 'text-foreground/80',
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            <li className="mt-1">
              <a
                href={cta.href}
                className="block rounded-2xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
              >
                {cta.label}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
