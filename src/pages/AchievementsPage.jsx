import React, { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useAdminData } from '../contexts/AdminDataContext'
import { PageHero } from '../components/PageHero'
import { CtaBand } from '../components/CtaBand'

const filterTabs = [
  { key: 'all', label: 'همه دستاوردها' },
  { key: 'konkur', label: 'قبولی کانکور' },
  { key: 'scholarship', label: 'بورسیه‌های بین‌المللی' },
  { key: 'progress', label: 'پیشرفت تحصیلی' },
  { key: 'other', label: 'سایر دستاوردها' },
]

// === دیتای نمونه/seed اولیه (بدون کوچک‌ترین دست‌کاری در اصل واقعیت‌ها) ===
// نکته: عنوان مورد اول از «پوهنتون» به «دانشگاه» و کلمه «کنکور» در سرتاسر
// این فایل به «کانکور» اصلاح شد — طبق جدول واژگان تأییدشده پروژه (بخش ۳.۱).
// === جدید: این آیتم‌ها اکنون از پنل ادمین قابل‌حذف‌اند ===
// قبلاً این آرایه کاملاً هاردکد بود و هیچ راهی برای حذفش از پنل ادمین
// وجود نداشت. اکنون با همان الگوی deletedScholarshipIds (که برای
// بورسیه‌های نمونه استفاده می‌شود)، هر آیتم با شناسه‌ی id خودش در
// data.deletedSeedEliteIds قابل حذفِ دائمی است — بدون نیاز به حذف
// واقعی این آرایه از کد.
export const SEED_ELITE_DATA = [
  {
    id: 1,
    name: 'احمد رفیعی',
    type: 'konkur',
    title: 'کادر طب معالج دانشگاه طبی کابل',
    year: '۱۴۰۴',
    desc: 'عضو فعال سالن مطالعه و دوره مشاوره‌های تخصصی برنامه‌ریزی کانکور پژوهش.',
    quote: 'محیط بی‌حاشیه پورتال پژوهش تمرکز مرا چند برابر کرد.',
    tags: ['سالن مطالعه', 'کانکور'],
  },
  {
    id: 2,
    name: 'زهرا رضایی',
    type: 'scholarship',
    title: 'کامیاب بورسیه دولتی چین (رشته مهندسی کامپیوتر)',
    year: '۱۴۰۵',
    desc: 'تنظیم دوسیه تحصیلی و اخذ پذیرش رایگان ۱۰۰٪ تحت نظر دپارتمان خدمات تحصیلی پژوهش.',
    quote: 'هدایت درست اساتید در مصاحبه، مسیر مرا کاملاً روشن ساخت.',
    tags: ['مشاوره', 'بورسیه'],
  },
  {
    id: 3,
    name: 'جاوید کریمی',
    type: 'progress',
    title: 'ارتقای معدل صنف دوازدهم از ۷۵ به ۹۴',
    year: '۱۴۰۴',
    desc: 'استفاده مستمر از فضای سایلنت سالن مطالعه و تکنیک‌های مدیریت زمان مشاورین پژوهش.',
    quote: 'نظم فضا، انگیزه خستگی‌ناپذیری به من بخشید.',
    tags: ['سالن مطالعه', 'پیشرفت'],
  },
]

const achievementTypeOptions = [
  { value: 'konkur', label: 'قبولی و کامیاب شدن در کانکور سراسری' },
  { value: 'scholarship', label: 'اخذ پذیرش یا بورسیه تحصیلی خارجی' },
  { value: 'progress', label: 'ارتقای چشمگیر معدل مکتب یا سمستر دانشگاه' },
  { value: 'other', label: 'سایر افتخارات و رقابت‌های علمی' },
]

const departmentOptions = [
  { value: 'lounge', label: 'اشتراک در سالن مطالعه و کتابخانه' },
  { value: 'consulting', label: 'استفاده از خدمات مشاوره و برنامه‌ریزی درسی' },
  { value: 'both', label: 'استفاده هم‌زمان از هر دو دپارتمان مجموعه' },
]

// (تصویر بنر گالری تالار افتخارات دیگر اینجا ثابت نیست — چون اکنون
// عکس/عنوان/کپشنش ۱۰۰٪ از پنل ادمین قابل‌ویرایش‌اند، داخل خودِ کامپوننت
// از data ساخته می‌شود؛ تصاویر بخش «داستان موفقیت منتخب» هم همین‌طور.)

function FallbackImage({ image, alt, className, eager = false }) {
  return (
    <img
      src={image.src}
      alt={alt}
      className={className}
      {...(eager ? {} : { loading: 'lazy', decoding: 'async' })}
      onError={(e) => {
        if (!e.target.dataset.fallbackApplied) {
          e.target.dataset.fallbackApplied = '1'
          e.target.src = image.fallback
        } else {
          e.target.style.display = 'none'
        }
      }}
    />
  )
}

export default function AchievementsPage() {
  useScrollToTop()

  const { portalData, addPendingRequest } = useAdminData()

  // آمار و عناوین قابل‌ویرایش از پنل ادمین — عیناً همان کلیدهای قبلی
  // (stat1Number/stat1Label/...)، تا اتصال portalData در فاز۲ بدون
  // تغییر نام کلید کار کند.
  const data = {
    heroTitle: 'تلاش محصلان فرزانه، بزرگ‌ترین افتخار مجموعه ماست',
    heroDesc:
      'نتایج واقعی و مستند داوطلبان کانکور و کامیاب‌شدگان بورسیه‌های بین‌المللی که با تکیه بر تلاش خود و زیرساخت علمی پژوهش به این جایگاه رسیدند.',
    stat1Number: '+۴۵ تن',
    stat1Label: 'قبولی در کادرهای برتر کانکور',
    stat2Number: '+۳۰ محصل',
    stat2Label: 'اعزام موفق به بورسیه‌های دولتی',
    stat3Number: '۹۸٪',
    stat3Label: 'رشد و ارتقای معدل اعضای سالن',
    filterTitle: 'فیلتر و بررسی دستاوردهای مستند نخبگان پژوهش',
    // === جدید: fallback عکس/عنوان/متن کپشن گالری + کل بخش «داستان موفقیت منتخب» ===
    // این‌ها دقیقاً همان متن/مسیر قبلیِ هاردکد هستند؛ فقط اکنون به‌جای
    // آن‌که در JSX ثابت باشند، از پنل ادمین قابل بازنویسی‌اند.
    achievementsGalleryImage: '/images/achievements/hall.png',
    achievementsGalleryTitle: 'تالار افتخارات پژوهش',
    achievementsGalleryCaption: 'هر داستان دستاورد در این‌جا، حاصل تلاش یک محصل و همراهی مجموعه پژوهش است.',
    featuredStoryTitle: 'روایت عبور از سد کانکور با اراده پولادین',
    featuredStoryText:
      'یکی از متقاضیان صنف دوازدهم که در ماه‌های نخست آمادگی کانکور با چالش شدید عدم تمرکز و کمبود وقت مواجه بود، پس از پیوستن به دپارتمان مشاوره‌ی پژوهش و استفاده منظم از تکنیک‌های مدیریت زمان، توانست گام‌به‌گام ساعات مطالعه مفید خود را ارتقا دهد. وی با حضور مداوم در فضای آرام مجموعه، در نهایت موفق به کسب امتیاز عالی و قبولی در رشته طب معالج دانشگاه کابل گردید. این روایت اثبات می‌کند که بستر منظم و هدایت اصولی، مسیر موفقیت را هموار می‌سازد.',
    featuredStoryImage: '/images/achievements/story.png',
    featuredStoryImageCaption: 'ساعت‌های خاموشِ سالن مطالعه، همان جایی است که نتیجه ساخته می‌شود.',
    featuredStoryLaurelImage: '/images/achievements/laurel.png',
    featuredStoryResultText:
      'نتیجه نهایی: قبولی در رشته طب معالج دانشگاه کابل، پس از یک دوره کامل برنامه‌ریزی و مطالعه منظم در سالن مجموعه.',
    ...portalData,
  }

  // تصویر بنر گالری تالار افتخارات — اکنون از پنل ادمین می‌آید؛ اگر ادمین
  // چیزی آپلود نکرده باشد، دقیقاً به همان مسیر قبلیِ هاردکد برمی‌گردد.
  const galleryImage = { src: data.achievementsGalleryImage || '/images/achievements/hall.png', fallback: '/images/hero-main.png' }

  // تصاویر بخش «داستان موفقیت منتخب» — اکنون از پنل ادمین می‌آیند؛ اگر
  // ادمین چیزی آپلود نکرده باشد، دقیقاً به همان مسیر قبلیِ هاردکد
  // برمی‌گردند (fallback دوم onError هم مثل قبل حفظ شده).
  const storyImage = { src: data.featuredStoryImage || '/images/achievements/story.png', fallback: '/images/hero-lounge.jpg' }
  const laurelImage = { src: data.featuredStoryLaurelImage || '/images/achievements/laurel.png', fallback: '/images/about-placeholder.jpg' }

  // === رفع باگ: قبلاً این صفحه فقط از ثابت هاردکد eliteData می‌خواند و
  // هرچه ادمین از پنل («تالار دستاوردها») اضافه می‌کرد، هیچ اثری روی این
  // صفحه‌ی عمومی نداشت. اکنون دستاوردهای نمونه (SEED_ELITE_DATA) همچنان
  // به‌عنوان پایه حفظ می‌شوند — مگر آن‌که ادمین صریحاً حذفشان کرده باشد
  // (data.deletedSeedEliteIds) — و هر دستاورد جدیدی که ادمین از طریق پنل
  // اضافه کرده باشد (data.achievementsEliteList)، بعد از آن‌ها نمایش
  // داده می‌شود.
  const deletedSeedIds = Array.isArray(data.deletedSeedEliteIds) ? data.deletedSeedEliteIds : []
  const combinedEliteData = [
    ...SEED_ELITE_DATA.filter((item) => !deletedSeedIds.includes(item.id)),
    ...(Array.isArray(data.achievementsEliteList) ? data.achievementsEliteList : []),
  ]

  const [activeFilter, setActiveFilter] = useState('all')
  const filteredElites =
    activeFilter === 'all' ? combinedEliteData : combinedEliteData.filter((item) => item.type === activeFilter)

  // === فرم ثبت دستاورد — قبلاً mock بود (فقط alert، هیچ ذخیره‌ای رخ نمی‌داد) ===
  // اکنون از همان مسیر عمومی portal_requests استفاده می‌کند (addPendingRequest،
  // دقیقاً همان تابعی که فرم مشاوره تحصیلی/بورسیه استفاده می‌کنند). رکورد با
  // status: 'pending' ثبت می‌شود، یعنی پیش از تایید دستی ادمین، هیچ محتوایی
  // خودکار در تالار افتخارات عمومی منتشر نمی‌شود.
  const [fullName, setFullName] = useState('')
  const [achievementType, setAchievementType] = useState('konkur')
  const [department, setDepartment] = useState('lounge')
  const [achievementDetails, setAchievementDetails] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!consent) return
    setSubmitting(true)
    try {
      await addPendingRequest({
        type: 'achievement_submission',
        name: fullName,
        details: { achievementType, department, achievementDetails },
        summary: achievementTypeOptions.find((o) => o.value === achievementType)?.label || '',
      })
      alert('محصل گرامی، دستاورد شما ثبت شد و پس از بررسی و تایید مدیریت، در تالار افتخارات منتشر خواهد شد.')
      setFullName('')
      setAchievementDetails('')
      setConsent(false)
    } catch (err) {
      alert(err.message || 'خطا در ثبت دستاورد. لطفاً دوباره تلاش کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="تالار افتخارات پژوهش"
        title={data.heroTitle}
        desc={data.heroDesc}
        crumbs={[{ href: '/achievements', label: 'دستاوردها' }]}
        stats={[
          { value: data.stat1Number, label: data.stat1Label },
          { value: data.stat2Number, label: data.stat2Label },
          { value: data.stat3Number, label: data.stat3Label },
        ]}
        bgImage={portalData?.bgAchievements || '/images/hero-achievements.jpg'}
      />

      {/* بنر گالری تالار افتخارات */}
      <section className="relative pb-2 sm:pb-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 sm:rounded-[2.25rem]">
            <FallbackImage
              image={galleryImage}
              alt="دیوار گالری با لوح‌ها و نامه‌های پذیرش قاب‌شده در تالار افتخارات مجموعه"
              className="h-56 w-full object-cover sm:h-72 lg:h-80"
              eager
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/15 to-transparent"
            />

            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-3 sm:inset-x-6 sm:bottom-6">
              <span className="glass-strong grid size-11 shrink-0 place-items-center rounded-2xl">
                <Trophy className="size-5 text-primary" aria-hidden="true" />
              </span>
              <div className="glass-strong flex-1 rounded-2xl px-4 py-3">
                <p className="text-sm font-medium">{data.achievementsGalleryTitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {data.achievementsGalleryCaption}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* فیلتر دسته‌بندی */}
      <section className="relative pb-2 pt-8 sm:pb-4 sm:pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-4 text-center text-xs font-medium tracking-[0.15em] text-primary sm:mb-5 sm:text-sm">
            {data.filterTitle}
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {filterTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveFilter(t.key)}
                className={
                  activeFilter === t.key
                    ? 'rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground sm:text-sm'
                    : 'glass rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm'
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* کارت‌های نخبگان */}
      <section className="relative py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {filteredElites.map((elite) => (
              <article
                key={elite.id}
                className="glass flex h-full flex-col rounded-[1.5rem] p-5 transition-transform duration-500 hover:-translate-y-1 sm:rounded-[1.75rem] sm:p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold tracking-tight">{elite.name}</h3>
                  <span className="shrink-0 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
                    {elite.year}
                  </span>
                </div>

                <h4 className="mt-3 text-sm font-medium leading-relaxed text-primary">{elite.title}</h4>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{elite.desc}</p>

                {elite.quote && (
                  <blockquote className="mt-4 rounded-xl border-e-2 border-primary bg-secondary/60 p-3 text-xs leading-relaxed text-foreground/80">
                    «{elite.quote}»
                  </blockquote>
                )}

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {elite.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-secondary px-2 py-1 text-[11px] text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* داستان موفقیت منتخب */}
      <section className="relative border-y border-border/70 bg-card/40 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            داستان‌های موفقیت منتخب؛ مسیر تلاش تا پیروزی
          </h2>

          <div className="mt-8 grid items-stretch gap-4 sm:mt-12 lg:grid-cols-[1fr_1.25fr]">
            <div className="relative min-h-64 overflow-hidden rounded-[1.75rem] border border-border/60 sm:rounded-[2rem] lg:min-h-full">
              <FallbackImage
                image={storyImage}
                alt="محصلی که شب‌هنگام زیر نور چراغ مطالعه در سالن آرام مجموعه درس می‌خواند"
                className="absolute inset-0 size-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent"
              />
              <div className="glass-strong absolute inset-x-4 bottom-4 rounded-2xl px-4 py-3">
                <p className="text-xs leading-relaxed">
                  {data.featuredStoryImageCaption}
                </p>
              </div>
            </div>

            <div className="glass relative overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-8 lg:p-10">
              <div aria-hidden="true" className="aurora pointer-events-none absolute inset-0 opacity-45" />

              <div className="relative">
                <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-medium">
                  <Trophy className="size-3.5 text-primary" aria-hidden="true" />
                  روایت منتخب
                </span>

                <h3 className="mt-4 text-base font-semibold tracking-tight text-balance sm:text-lg">
                  {data.featuredStoryTitle}
                </h3>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-justify">
                  {data.featuredStoryText}
                </p>

                <div className="mt-7 flex items-center gap-4 border-t border-border/70 pt-5">
                  <FallbackImage
                    image={laurelImage}
                    alt="کلاه فراغت روی کتاب‌ها در کنار لوح فارغ‌التحصیلی"
                    className="size-16 shrink-0 rounded-2xl border border-border/60 object-cover sm:size-20"
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {data.featuredStoryResultText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* فرم ثبت دستاورد */}
      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="glass rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-8">
            <h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">
              فورم آنلاین گزارش و ثبت دستاورد محصلان
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              اعضا و محصلان گرامی مجموعه پژوهش می‌توانند نتایج موفقیت و قبولی خود را جهت انتشار در تالار
              افتخارات برای ما ارسال کنند.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 text-right sm:mt-8">
              <div>
                <label htmlFor="ach-name" className="mb-1.5 block text-xs font-medium text-foreground/80">
                  نام و نام خانوادگی کامل
                </label>
                <input
                  id="ach-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام کامل خود را بنویسید"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ach-type" className="mb-1.5 block text-xs font-medium text-foreground/80">
                    نوع دستاورد علمی
                  </label>
                  <select
                    id="ach-type"
                    value={achievementType}
                    onChange={(e) => setAchievementType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                  >
                    {achievementTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ach-dept" className="mb-1.5 block text-xs font-medium text-foreground/80">
                    دپارتمان مورد استفاده شما
                  </label>
                  <select
                    id="ach-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                  >
                    {departmentOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="ach-details" className="mb-1.5 block text-xs font-medium text-foreground/80">
                  توضیحات دقیق دستاورد (رشته، دانشگاه یا نمره کسب‌شده)
                </label>
                <textarea
                  id="ach-details"
                  rows={3}
                  required
                  value={achievementDetails}
                  onChange={(e) => setAchievementDetails(e.target.value)}
                  placeholder="خلاصه‌ای از نمره، رتبه، کادر یا دانشگاه قبولی خود را بنویسید"
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <label className="flex items-start gap-2.5 rounded-xl bg-accent px-3.5 py-3 text-xs leading-relaxed text-accent-foreground">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                اینجانب تایید می‌کنم که اطلاعات فوق پس از بررسی، جهت اعتمادسازی و تشویق سایر محصلان در
                سایت منتشر شود.
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submitting ? 'در حال ارسال...' : 'ارسال رسمی دستاورد علمی'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <CtaBand
        title="شما هم مسیر موفقیت علمی خود را همین امروز شروع کنید"
        desc="با عضویت در سالن مطالعه پژوهش یا استفاده از بسته‌های مشاوره انفرادی، گام اول را محکم بردارید."
        primary={{ href: '/lounge', label: 'عضویت در سالن مطالعه' }}
        secondary={{ href: '/services', label: 'خدمات تحصیلی' }}
        phone={data.loungePhone}
      />
    </>
  )
}
