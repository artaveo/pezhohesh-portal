import React from 'react'
import { Link } from 'react-router-dom'
import {
  UserRound,
  CalendarClock,
  Target,
  ClipboardCheck,
  Brain,
  School,
  GraduationCap,
  FileStack,
  Plane,
} from 'lucide-react'
import { usePortal } from '../contexts/PortalDataContext'

/**
 * === فاز ۴ — زیرساخت خواندن از پنل ادمین (بدون افزودن فیلد جدید) ===
 * دقیقاً همان الگوی AboutUsPage.jsx / AchievementsPage.jsx: یک آبجکت
 * `data` با متن‌های فعلیِ هاردکد به‌عنوان مقدار پیش‌فرض ساخته می‌شود و در
 * انتها `...portalData` اسپرد می‌گردد — تا هر کلیدی که در آینده به
 * AdminDashboard.jsx اضافه شود (مثلاً catalogTitle)، بدون نیاز به تغییر
 * دوباره‌ی این فایل، خودکار جایگزین مقدار پیش‌فرض شود.
 *
 * دو نکته نسبت به الگوی مرجع:
 * ۱. این کامپوننت (برخلاف AboutUsPage/AchievementsPage) یک صفحه مستقل
 *    نیست و فرمی هم برای ارسال درخواست ندارد؛ پس به‌جای useAdminData()
 *    (که addPendingRequest هم برمی‌گرداند و اینجا لازم نیست)، از
 *    usePortal() استفاده شد — دقیقاً همان هوکی که ServiceFooter.jsx (یک
 *    کامپوننت هم‌سطح در همین صفحه) برای خواندن portalData به کار می‌برد.
 * ۲. آرایه services (که هر آیتمش یک کامپوننت آیکون React دارد) عیناً
 *    مثل الگوی glanceFigures در AboutUsPage.jsx و SEED_ELITE_DATA در
 *    AchievementsPage.jsx، به‌صورت یک ثابت جدا در بیرون data نگه داشته
 *    شد؛ چون آیکون یک کامپوننت React است، نه متنی که بتواند از
 *    Supabase/پنل ادمین (که فقط JSON ساده برمی‌گرداند) بیاید.
 *
 * فعلاً هیچ کلیدی برای این بخش در AdminDashboard.jsx تعریف نشده، پس
 * portalData این دو کلید را ندارد و data === همان مقادیر پیش‌فرض زیر؛
 * ظاهر صفحه ۱۰۰٪ بدون تغییر می‌ماند.
 */
const services = [
  { icon: UserRound, title: 'مشاوره‌های انفرادی (VIP)', desc: 'جلسات حضوری و اختصاصی تک‌به‌تک برای آنالیز وضعیت علمی محصل.' },
  { icon: CalendarClock, title: 'برنامه‌ریزی درسی منظم', desc: 'طراحی جدول مطالعه روزانه، هفتگی و ماهانه متناسب با زمان و توان شما.' },
  { icon: Target, title: 'تعیین هدف و نقشه مسیر', desc: 'ترسیم دقیق مسیر رسیدن به کادرهای برتر طب، انجینیری و اقتصاد.' },
  { icon: ClipboardCheck, title: 'پیگیری و ارزیابی دوام‌دار', desc: 'بررسی هفتگی گزارش کارهای خانگی و ساعات مطالعه توسط پشتیبانان.' },
  { icon: Brain, title: 'مدیریت زمان و انگیزه', desc: 'آموزش روش‌های علمی حل مشکل عدم تمرکز، استرس آزمون و انرژی روانی.' },
  { icon: School, title: 'انتخاب رشته و دانشگاه', desc: 'هدایت تخصصی بر اساس کودهای کانکور و پکیج‌های بورسیه خارجی.' },
  { icon: GraduationCap, title: 'اخذ ادمیشن دانشگاه', desc: 'مشاوره و تسهیل فرآیند اخذ پذیرش رسمی از دانشگاه‌های معتبر بین‌المللی.' },
  { icon: FileStack, title: 'ثبت‌نام بورسیه‌های خارجی', desc: 'هدایت، ثبت‌نام و پیگیری همه‌جانبه دوسیه‌های بورسیه تحصیلی.', href: '/active-scholarships' },
  { icon: Plane, title: 'خدمات سیاحتی و زیارتی', desc: 'اخذ ویزا، صدور تکت‌های مسافرتی و اجرای سفرهای عمره و عتبات عالیات.' },
]

export function ServiceCatalog() {
  const { portalData } = usePortal()

  const data = {
    catalogEyebrow: 'فهرست خدمات',
    catalogTitle: 'محورهای اصلی خدمات تخصصی مشاوره پژوهش',
    ...portalData,
  }

  return (
    <section id="catalog" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.2em] text-primary">{data.catalogEyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
            {data.catalogTitle}
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, desc, href }) => {
            const Wrapper = href ? Link : 'div'
            return (
              <Wrapper
                key={title}
                {...(href ? { to: href } : {})}
                className="glass group flex flex-col rounded-[1.5rem] p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-card sm:rounded-[1.75rem] sm:p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-colors duration-500 group-hover:bg-primary group-hover:text-primary-foreground sm:size-11">
                  <Icon className="size-4.5 sm:size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-medium tracking-tight sm:mt-5 sm:text-base">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{desc}</p>
              </Wrapper>
            )
          })}
        </div>
      </div>
    </section>
  )
}
