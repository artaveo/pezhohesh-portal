import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useAdminData } from '../contexts/AdminDataContext'
import { PageHero } from '../components/PageHero'
import { ServiceCatalog } from '../components/ServiceCatalog'
import { CtaBand } from '../components/CtaBand'
import { SEED_ELITE_DATA } from './AchievementsPage'

/**
 * === فاز ۴ — زیرساخت خواندن از پنل ادمین ===
 * دقیقاً همان منطق AboutUsPage.jsx / AchievementsPage.jsx: تمام متن‌های
 * ثابتِ این صفحه (عنوان‌ها، توضیحات، آزمایه‌های استاتیک بدون آیکون مثل
 * steps) داخل یک آبجکت data به‌عنوان مقدار پیش‌فرض جمع شدند و در انتها
 * ...portalData روی آن اسپرد می‌شود؛ یعنی هر کلیدی که در آینده به
 * AdminDashboard.jsx اضافه شود (با همین نام‌ها)، بدون نیاز به تغییر
 * دوباره‌ی این فایل، خودکار جایگزین مقدار پیش‌فرض می‌شود.
 *
 * === رفع بازخورد کاربر (بخش ۱۵) ===
 * پیش‌تر این کامنت می‌گفت «plans»، «faq» و عکس بلوک دوم هیرو عمداً و
 * برای همیشه هاردکد باقی مانده‌اند چون فیلد ادمین ندارند. اکنون هر سه
 * قابل مدیریت از پنل‌اند:
 *  ۱. عکس بلوک دوم هیرو دیگر مسیر ثابت جداگانه‌ای نیست؛ دقیقاً مثل
 *     StudyLoungePage.jsx و AcademicServicesPage خودش، از همان یک فیلد
 *     ادمین (bgServices) تغذیه می‌شود — چون از نظر ادمین این «همان یک
 *     عکس هدر خدمات تحصیلی» است، نه دو عکس جدا. (ریشه‌ی باگ گزارش‌شده
 *     «ادمین عکس را عوض می‌کند، پیام موفقیت می‌آید ولی صفحه تغییر
 *     نمی‌کند» دقیقاً همین بود: عکس واقعاً روی PageHero عوض می‌شد، اما
 *     همان تصویر بزرگ و چشمگیر زیرِ هیرو — که کاربر واقعاً با آن ارزیابی
 *     می‌کرد — به یک مسیر ثابت جدا اشاره داشت.)
 *  ۲. «plans» اکنون از data.plans/hardcode بیرون آمده و از
 *     portalData.servicesPlansList می‌آید (افزودن/ویرایش/حذف نامحدود از
 *     پنل)؛ اگر ادمین هنوز چیزی ذخیره نکرده، همان دو پلن قبلی fallback
 *     می‌مانند.
 *  ۳. «faq» اکنون دقیقاً همان الگوی تأییدشده‌ی HallRules.jsx (seed +
 *     hide + افزودن نامحدود) را دارد: دو سوال قبلی به SEED_SERVICES_FAQ
 *     (پایین همین فایل) منتقل شدند، با data.deletedSeedServicesFaqIds
 *     قابل پنهان‌سازی‌اند، و data.servicesFaqList هر سوال دلخواه دیگری
 *     را اضافه می‌کند.
 *
 * نکاتی که عامدانه از data بیرون ماندند (تطابق با الگوی خودِ فایل‌های
 * مرجع):
 *  ۱. متن‌های مکانیک فرم — placeholder ورودی‌ها، برچسب گزینه‌های select،
 *     پیام‌های alert() و متن حالت «در حال ارسال...» — دقیقاً مثل فرم
 *     «درخواست همکاری» در AboutUsPage.jsx، همچنان مستقیم در JSX هاردکد
 *     ماندند (چون آن فایل هم دقیقاً همین بخش‌ها را وارد data نکرده).
 *  ۲. لینک‌های داخلی (href مسیرهای CtaBand/دکمه‌ها) دست‌نخورده باقی
 *     ماندند؛ اینها مسیر برنامه‌اند نه محتوای متنی قابل‌ویرایش.
 */

// === سوالات پیش‌فرض بخش «پرسش‌های متداول» — دقیقاً معادل الگوی
// SEED_HALL_FAQ در HallRules.jsx: هر سوال یک id ثابت دارد تا با
// data.deletedSeedServicesFaqIds قابل پنهان‌سازی (نه حذف واقعی از کد)
// باشد، بدون اینکه ترتیب یا شناسه‌ی سوالات دیگر به‌هم بریزد.
export const SEED_SERVICES_FAQ = [
  {
    id: 1,
    q: 'آیا جلسات مشاوره آنلاین برگزار می‌شود یا حضوری؟',
    a: 'به انتخاب شما، هم حضوری در دفتر مرکزی مجموعه و هم آنلاین (برای محصلان خارج از کابل) برگزار می‌شود.',
  },
  {
    id: 2,
    q: 'آیا برنامه‌ریزی درسی برای هر محصل شخصی‌سازی می‌شود؟',
    a: 'بله. مشاوران ما بر اساس صنف درسی، نقاط قوت و ضعف و زمان‌های آزاد شما، پکیج کاملاً منحصربه‌فرد طراحی می‌کنند.',
  },
]

export default function AcademicServicesPage() {
  useScrollToTop()

  const [studentName, setStudentName] = useState('')
  const [phone, setPhone] = useState('')
  const [grade, setGrade] = useState('12')
  const [goal, setGoal] = useState('kanoor')
  const [mainIssue, setMainIssue] = useState('focus')
  const [callTime, setCallTime] = useState('morning')
  const [submitting, setSubmitting] = useState(false)
  // === ضدهرزنامه: هانی‌پات + تله زمانی (نگاه کنید به توضیح مشابه در HallMembership.jsx) ===
  const [honeypot, setHoneypot] = useState('')
  const [formLoadedAt] = useState(() => Date.now())

  const { addPendingRequest, portalData } = useAdminData()

  const data = {
    heroEyebrow: 'اولین جلسه مشاوره رایگان است',
    heroTitleLine1: 'برنامه‌ریزی دقیق برای',
    heroTitleLine2: 'رسیدن به هدف تحصیلی شما',
    heroDesc:
      'دپارتمان مشاوره پژوهش، آمادگی کانکور، امتحانات مکتب، آزمون‌های سمستر دانشگاه، انتخاب رشته و بورسیه‌های بین‌المللی را پوشش می‌دهد.',
    crumbLabel: 'خدمات تحصیلی',
    bgServices: '/images/hero-services.jpg',

    featuredCaptionTitle: 'مشاوره اختصاصی و راهنمایی گام‌به‌گام',
    featuredCaptionDesc: 'حضوری در مجموعه یا آنلاین',

    processEyebrow: 'مسیر همکاری',
    processTitle: 'روند همکاری و مراحل گام‌به‌گام',
    steps: [
      { step: '۱', title: 'ثبت درخواست آنلاین', desc: 'فرم پایین همین صفحه را پر می‌کنید.' },
      { step: '۲', title: 'جلسه شناخت اولیه', desc: 'بررسی سابقه تحصیلی و هدف شما.' },
      { step: '۳', title: 'طراحی برنامه اختصاصی', desc: 'نقشه راه متناسب با شرایط شما.' },
      { step: '۴', title: 'پیگیری و ارزیابی دوره‌ای', desc: 'گزارش پیشرفت به‌صورت منظم.' },
    ],

    pricingEyebrow: 'تعرفه‌ها',
    pricingTitle: 'پلن‌ها و تعرفه‌های دپارتمان مشاوره',
    pricingDesc: 'انتخاب پکیج متناسب با اهداف تحصیلی شما',
    // پیش‌فرض fallback — فقط وقتی نمایش داده می‌شود که ادمین هنوز حتی
    // یک‌بار از پنل جدید (servicesPlansList) ذخیره نکرده باشد.
    plans: [
      { id: 'fallback-1', name: 'پکیج مشاوره تک‌جلسه', desc: 'بررسی وضعیت و ارائه راهکارهای سریع' },
      { id: 'fallback-2', name: 'پکیج مشاوره دوام‌دار ماهانه', desc: 'برنامه‌ریزی کامل درسی همراه با پیگیری هفتگی', featured: true },
    ],

    testimonialTitle: 'تجربه محصلان موفق دپارتمان مشاوره',
    testimonialQuote:
      '«تکنیک‌های مدیریت زمان و کنترل استرس که در جلسات مشاوره انفرادی یاد گرفتم، بیشترین نقش را در قبولی من در کادر طب دندان داشت.»',
    testimonialAuthor: '— علی (محصل موفق کانکور)',

    faqTitle: 'پرسش‌های متداول',

    formTitle: 'فورم درخواست نوبت مشاوره تحصیلی',
    formDesc: 'تیم پشتیبانی ما پس از بررسی فرم، جهت تایید ساعت حضور با شما تماس می‌گیرد.',

    ctaTitle: 'یک جلسه ارزیابی رایگان، شروع همه‌چیز است',
    ctaDesc:
      'در این جلسه سابقه تحصیلی، هدف و بازه زمانی شما بررسی می‌شود و صادقانه می‌گوییم چه مسیری واقع‌بینانه است.',
    ctaPrimaryLabel: 'بورسیه‌های فعال',

    ...portalData,
  }

  // === پلن‌های تعرفه — منبع واقعی: portalData.servicesPlansList (پنل ادمین) ===
  // اگر ادمین هنوز چیزی ذخیره نکرده، همان دو پکیج قبلی (data.plans) بدون
  // هیچ تغییری نمایش داده می‌شوند.
  const displayedPlans =
    Array.isArray(portalData?.servicesPlansList) && portalData.servicesPlansList.length > 0
      ? portalData.servicesPlansList
      : data.plans

  // === پرسش‌های متداول — اکنون یکپارچه (بخش ۱۶) ===
  // اگر ادمین حداقل یک‌بار از پنل جدید ذخیره کرده باشد، portalData.servicesFaqUnified
  // منبع واحد و کامل حقیقت است (شامل ویرایش‌های مستقیم روی سوالات پیش‌فرض).
  // در غیر این صورت (قبل از اولین ذخیره‌ی پنل جدید)، دقیقاً همان ترکیب قدیمی
  // (seed منهای پنهان‌شده‌ها + servicesFaqList قبلی) نمایش داده می‌شود تا
  // ظاهر فعلی سایت تغییری نکند — دقیقاً همان الگوی HallRules.jsx.
  const hasUnifiedServicesFaq = Array.isArray(portalData?.servicesFaqUnified)
  let displayedFaq
  if (hasUnifiedServicesFaq) {
    displayedFaq = portalData.servicesFaqUnified.filter((f) => f && f.q && f.a)
  } else {
    const deletedSeedServicesFaqIds = Array.isArray(portalData?.deletedSeedServicesFaqIds)
      ? portalData.deletedSeedServicesFaqIds
      : []
    const seedFaqItems = SEED_SERVICES_FAQ.filter((f) => !deletedSeedServicesFaqIds.includes(f.id))
    const customFaqItems = Array.isArray(portalData?.servicesFaqList) ? portalData.servicesFaqList : []
    displayedFaq = [...seedFaqItems, ...customFaqItems]
  }

  // === نظرات محصلان — تغذیه از تالار افتخارات واقعی (بخش ۱۵) ===
  // دقیقاً همان الگوی Stories.jsx (صفحه اصلی)، اما با پرچم اختصاصی خودِ
  // این صفحه (showOnServices / servicesFeaturedSeedIds) تا انتخاب ادمین
  // برای صفحه اصلی و این صفحه کاملاً مستقل از هم بمانند. طراحی کارت
  // («border-r-4 border-primary») عمداً با طراحی کارت‌های صفحه‌ی
  // «دستاوردها» (article با تگ/نوع/سال) و صفحه‌ی اصلی (کارت شیشه‌ای)
  // متفاوت است — دقیقاً همان قالب موجود این صفحه، فقط اکنون پویا.
  const deletedSeedEliteIds = Array.isArray(portalData?.deletedSeedEliteIds) ? portalData.deletedSeedEliteIds : []
  const servicesFeaturedSeedIds = Array.isArray(portalData?.servicesFeaturedSeedIds)
    ? portalData.servicesFeaturedSeedIds
    : []
  const seedServiceItems = SEED_ELITE_DATA.filter(
    (item) => !deletedSeedEliteIds.includes(item.id) && servicesFeaturedSeedIds.includes(item.id)
  )
  const adminServiceItems = Array.isArray(portalData?.achievementsEliteList)
    ? portalData.achievementsEliteList.filter((item) => item.showOnServices)
    : []
  // حداکثر ۳ نظر تا چیدمان کارت‌ها به‌هم نریزد.
  const serviceTestimonials = [...seedServiceItems, ...adminServiceItems].slice(0, 3).map((item) => ({
    id: item.id,
    name: item.name,
    role: item.title,
    quote: item.quote || item.desc,
  }))
  const hasRealTestimonials = serviceTestimonials.length > 0

  // === اضافه (بخش ۱۸): برچسب‌های فارسی خوانا برای پنل ادمین ===
  // قبلاً details فقط کدهای خام select (مثل 'kanoor'، '12') را می‌فرستاد؛
  // پنل ادمین یا باید همان کد انگلیسی نامفهوم را نشان می‌داد یا نیاز به
  // نگاشت جداگانه در فایل دیگری داشت. اکنون دقیقاً مثل فرم بورسیه
  // (ActiveScholarshipsPage.jsx → degreeLabel)، برچسب فارسی همراه خودِ
  // کد در details ذخیره می‌شود تا پنل ادمین بدون هیچ نگاشت اضافه‌ای متن
  // کامل و خوانا را مستقیماً نمایش دهد.
  const GRADE_LABELS = { '12': 'صنف دوازدهم / فارغ مکتب', uni: 'محصل (دانشگاه)', other: 'سایر مقاطع' }
  const GOAL_LABELS = {
    kanoor: 'موفقیت در کانکور',
    scholar: 'اخذ بورسیه بین‌المللی',
    skills: 'تقویت روش‌های مطالعه',
    admission: 'اخذ ادمیشن دانشگاه',
    travel: 'خدمات سیاحتی و ویزا',
  }
  const MAIN_ISSUE_LABELS = {
    focus: 'عدم تمرکز و فراموشی',
    time: 'کمبود وقت و نبود تقسیم اوقات',
    stress: 'استرس امتحانات',
  }
  const CALL_TIME_LABELS = { morning: 'قبل از چاشت (۸ الی ۱۲)', afternoon: 'بعد از چاشت (۱۲ الی ۵)' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const gradeLabel = GRADE_LABELS[grade] || grade
      const goalLabel = GOAL_LABELS[goal] || goal
      await addPendingRequest({
        type: 'consultation',
        name: studentName,
        phone,
        details: {
          grade,
          gradeLabel,
          goal,
          goalLabel,
          mainIssue,
          mainIssueLabel: MAIN_ISSUE_LABELS[mainIssue] || mainIssue,
          callTime,
          callTimeLabel: CALL_TIME_LABELS[callTime] || callTime,
        },
        summary: `${gradeLabel} — ${goalLabel}`,
        honeypot,
        formLoadedAt,
      })
      alert('درخواست مشاوره شما ثبت شد.')
      setStudentName('')
      setPhone('')
    } catch (err) {
      alert(err.message || 'خطا در ثبت درخواست.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow={data.heroEyebrow}
        title={
          <>
            {data.heroTitleLine1}
            <span className="mt-2 block text-primary">{data.heroTitleLine2}</span>
          </>
        }
        desc={data.heroDesc}
        crumbs={[{ href: '/services', label: data.crumbLabel }]}
        bgImage={data.bgServices}
      />

      {/* === رفع باگ گزارش‌شده: تغییر عکس هیرو از پنل ادمین در صفحه دیده نمی‌شد ===
          این عکس قبلاً به مسیر ثابت /images/hero-services.jpg اشاره داشت،
          کاملاً مستقل از فیلد ادمین bgServices؛ در نتیجه وقتی ادمین عکس هیرو
          را عوض می‌کرد، پیام موفقیت درست بود (چون bgServices واقعاً ذخیره و
          روی پس‌زمینه‌ی کم‌رنگ PageHero بالای صفحه اعمال می‌شد)، ولی همین
          عکس بزرگ و پررنگ — که در عمل معیار اصلی ارزیابیِ کاربر بود —
          هیچ‌وقت عوض نمی‌شد. راه‌حل دقیقاً همان الگوی اثبات‌شده در
          StudyLoungePage.jsx است: همین یک عکس بلوک دوم هم از همان فیلد
          bgServices (یعنی data.bgServices) بخواند، نه یک مسیر جدا. */}
      <section className="pb-2 sm:pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 sm:rounded-[2rem]">
            <img
              src={data.bgServices}
              alt="جلسه مشاوره تحصیلی در مجموعه پژوهش"
              className="h-48 w-full object-cover sm:h-64 lg:h-80"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
            <div className="glass-strong absolute inset-x-3 bottom-3 rounded-xl p-3.5 sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:p-5">
              <p className="text-xs font-medium sm:text-sm">{data.featuredCaptionTitle}</p>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{data.featuredCaptionDesc}</p>
            </div>
          </div>
        </div>
      </section>

      <ServiceCatalog />

      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.2em] text-primary">{data.processEyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
              {data.processTitle}
            </h2>
          </div>

          <ol className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {data.steps.map((s) => (
              <li key={s.step} className="glass rounded-[1.5rem] p-5 sm:rounded-[1.75rem] sm:p-6">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:size-9 sm:text-sm">
                  {s.step}
                </span>
                <h3 className="mt-3.5 text-sm font-medium tracking-tight sm:mt-4 sm:text-base">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative border-y border-border/70 bg-card/40 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-xs font-medium tracking-[0.2em] text-primary">{data.pricingEyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
            {data.pricingTitle}
          </h2>
          <p className="mt-3 text-xs text-muted-foreground sm:text-sm">{data.pricingDesc}</p>

          <div className="mt-8 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
            {displayedPlans.map((p) => (
              <div
                key={p.id || p.name}
                className={
                  p.featured
                    ? 'rounded-[1.5rem] border-2 border-primary bg-card p-5 text-right sm:rounded-[1.75rem] sm:p-7'
                    : 'glass rounded-[1.5rem] p-5 text-right sm:rounded-[1.75rem] sm:p-7'
                }
              >
                <h3 className="text-sm font-medium sm:text-base">{p.name}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{p.desc}</p>
                <a
                  href="#service-form-section"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground sm:text-sm"
                >
                  ثبت‌نام و تعیین وقت
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            {data.testimonialTitle}
          </h2>
          {/* === رفع بازخورد کاربر (بخش ۱۵): نظرات محصلان اکنون از تالار
              افتخارات واقعی می‌آید، تا ۳ مورد هم‌زمان، با همان استایل
              منحصربه‌فرد این صفحه (کارت با حاشیه‌ی راست پررنگ) که عمداً با
              کارت‌های صفحه «دستاوردها» و صفحه اصلی فرق دارد. تا وقتی ادمین
              چیزی برای این صفحه انتخاب نکرده، همان نقل‌قول قبلی (ثابت) بدون
              هیچ تغییری دیده می‌شود. */}
          <div className={hasRealTestimonials ? 'mt-8 grid gap-4 text-right sm:mt-10 sm:grid-cols-2 lg:grid-cols-3' : 'mt-8 sm:mt-10'}>
            {hasRealTestimonials ? (
              serviceTestimonials.map((t) => (
                <figure
                  key={t.id}
                  className="glass flex h-full flex-col justify-between rounded-[1.5rem] border-r-4 border-primary p-5 text-right sm:rounded-[1.75rem] sm:p-6"
                >
                  <blockquote className="text-sm leading-relaxed text-foreground/85">«{t.quote}»</blockquote>
                  <figcaption className="mt-4 text-xs font-medium text-muted-foreground">
                    {t.name}
                    {t.role ? ` — ${t.role}` : ''}
                  </figcaption>
                </figure>
              ))
            ) : (
              <figure className="glass mx-auto max-w-2xl rounded-[1.5rem] border-r-4 border-primary p-5 text-right sm:rounded-[1.75rem] sm:p-6">
                <blockquote className="text-sm leading-relaxed text-foreground/85">{data.testimonialQuote}</blockquote>
                <figcaption className="mt-4 text-xs font-medium text-muted-foreground">{data.testimonialAuthor}</figcaption>
              </figure>
            )}
          </div>

          {/* لینک جدید: مشاهده همه دستاوردها — زیر نظرات کاربران همین صفحه،
              به صفحه‌ی کامل «دستاوردها» ارجاع می‌دهد. */}
          <div className="mt-8 sm:mt-10">
            <Link
              to="/achievements"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              مشاهده همه دستاورد‌ها
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border/70 bg-card/40 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            {data.faqTitle}
          </h2>
          <div className="mt-8 space-y-2.5 sm:mt-10 sm:space-y-3">
            {displayedFaq.map((item) => (
              <details key={item.id} className="glass group rounded-2xl px-4 py-3.5 open:bg-card sm:px-5 sm:py-4">
                <summary className="cursor-pointer text-xs font-medium sm:text-sm">{item.q}</summary>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="service-form-section" className="relative scroll-mt-28 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 sm:rounded-[2rem] sm:p-8">
            <h3 className="text-center text-lg font-semibold sm:text-xl">{data.formTitle}</h3>
            <p className="mt-2 text-center text-xs text-muted-foreground sm:text-sm">{data.formDesc}</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 text-right sm:mt-8">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium sm:text-sm">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  {/* === رفع باگ گزارش‌شده: این فیلد فقط شماره تماس قبول می‌کرد ===
                      اعتبارسنجی واقعی در portalService.js (CONTACT_ALLOWS_EMAIL_REQUEST_TYPES)
                      اکنون هم شماره و هم ایمیل را برای type: 'consultation' می‌پذیرد؛
                      این‌جا فقط برچسب/placeholder با همان منطق هماهنگ شدند. */}
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">شماره تماس / ایمیل</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="07XXXXXXXX یا example@email.com"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">صنف/مقطع فعلی</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="12">صنف دوازدهم / فارغ مکتب</option>
                    <option value="uni">محصل (دانشگاه)</option>
                    <option value="other">سایر مقاطع</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">هدف تحصیلی اصلی</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="kanoor">موفقیت در کانکور</option>
                    <option value="scholar">اخذ بورسیه بین‌المللی</option>
                    <option value="skills">تقویت روش‌های مطالعه</option>
                    <option value="admission">اخذ ادمیشن دانشگاه</option>
                    <option value="travel">خدمات سیاحتی و ویزا</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">بزرگ‌ترین چالش فعلی</label>
                  <select
                    value={mainIssue}
                    onChange={(e) => setMainIssue(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="focus">عدم تمرکز و فراموشی</option>
                    <option value="time">کمبود وقت و نبود تقسیم اوقات</option>
                    <option value="stress">استرس امتحانات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium sm:text-sm">زمان مناسب تماس</label>
                <select
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="morning">قبل از چاشت (۸ الی ۱۲)</option>
                  <option value="afternoon">بعد از چاشت (۱۲ الی ۵)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submitting ? 'در حال ارسال...' : 'ارسال درخواست و تعیین وقت'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <CtaBand
        title={data.ctaTitle}
        desc={data.ctaDesc}
        primary={{ href: '/active-scholarships', label: data.ctaPrimaryLabel }}
        phone={data.servicesPhone}
      />
    </>
  )
}
