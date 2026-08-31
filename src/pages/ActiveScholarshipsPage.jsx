import React, { useState } from 'react'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { useAdminData } from '../contexts/AdminDataContext'
import { usePortal } from '../contexts/PortalDataContext'
import { getCountryLabel, getCountryFlag } from '../data/countries'
import { PageHero } from '../components/PageHero'
import { CtaBand } from '../components/CtaBand'
import { GraduationCap, CalendarClock, Languages, FileText, Users } from 'lucide-react'

/**
 * === اتصال به دیتای واقعی Supabase (فاز۲) ===
 * قبلاً این صفحه یک آرایه‌ی هاردکد محلی داشت. آن آرایه از اینجا حذف شد؛
 * محتوای بورسیه‌ها (چه تعداد، چه کشور، چه وضعیت) دیگر اینجا هاردکد نیست و
 * ۱۰۰٪ از جدول portal_scholarships خوانده می‌شود — افزودن/ویرایش/حذف
 * بورسیه‌ها کاملاً کار پنل ادمین است، نه این فایل.
 *
 * زیرساخت خواندن از Supabase از قبل در پروژه آماده بود و فقط بلااستفاده
 * مانده بود: fetchPortalData() (در services/portalService.js) از قبل
 * portal_scholarships را می‌خواند و در portalData.scholarshipsList
 * می‌گذارد، و AdminDataProvider/PortalDataProvider از قبل در App.jsx
 * سوار شده‌اند. اینجا فقط با usePortal() به همان دیتای آماده وصل می‌شویم؛
 * هیچ فراخوانی شبکه‌ای جدیدی اضافه نشد.
 *
 * نگاشت فیلدهای واقعی جدول به کارت نمایشی:
 *   title, provider  → همان‌طور که هست
 *   country          → از طریق getCountryLabel() چون ادمین این مقدار را
 *                      به‌صورت کد کشور (مثل «CN») ذخیره می‌کند، نه نام فارسی
 *   degree           → همان‌طور که هست
 *   desc             → متن «پوشش مالی» (قبلاً fund نام داشت)
 *   deadline, status → همان‌طور که هست (status: active | soon | archived)
 *   image_url        → عکس کارت؛ اگر خالی بود (فرم فعلی ادمین این فیلد را
 *                      نمی‌گیرد)، به تصویر عمومی هدر بورسیه‌ها بازمی‌گردیم
 *                      تا کارت هرگز بدون عکس نماند
 */
const FALLBACK_SCHOLARSHIP_IMAGE = '/images/hero-scholarships.jpg'

const statusTabs = [
  { key: 'active', label: '🔥 فرصت‌های فعال' },
  { key: 'soon', label: '⏳ به‌زودی باز می‌شود' },
  { key: 'archived', label: '📦 آرشیو / پایان‌یافته' },
]

const statusBadge = {
  active: { text: 'فعال', textCls: 'text-primary' },
  soon: { text: 'به‌زودی', textCls: 'text-accent-foreground' },
  archived: { text: 'آرشیو', textCls: 'text-foreground/70' },
}

// === اضافه (بخش ۱۷): برچسب فارسی مقطع، برای نمایش خوانا در خلاصه/پنل ادمین ===
const DEGREE_LABELS = { bachelor: 'لیسانس', masters: 'ماستری', phd: 'دوکتورا' }

export default function ActiveScholarshipsPage() {
  useScrollToTop()
  const [tab, setTab] = useState('active')

  const { portalData } = usePortal()
  const scholarships = portalData.scholarshipsList || []
  const filtered = scholarships.filter((s) => s.status === tab)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  // === اضافه (رفع باگ گزارش‌شده): فیلد سن کاربر ===
  // فقط یک عدد ساده که همراه بقیه‌ی جزئیات درخواست در details ذخیره
  // می‌شود؛ هیچ اعتبارسنجی سختگیرانه‌ای روی آن نیست (چون هدف صرفاً کمک
  // به ارزیابی اولیه توسط مشاوران است، نه یک قانون ورودی).
  const [age, setAge] = useState('')
  const [degree, setDegree] = useState('bachelor')
  // === اضافه (بخش ۱۷): فیلد «بورسیه مورد نظر» ===
  // گزینه‌ها به‌صورت خودکار از همان لیست واقعی بورسیه‌ها ساخته می‌شوند —
  // فقط مواردی که «فعال» یا «به‌زودی باز می‌شود»اند (آرشیوشده‌ها معنی
  // ندارد کاربر برایشان درخواست بدهد). با افزودن/حذف بورسیه از پنل ادمین،
  // این لیست خودکار به‌روز می‌ماند، بدون نیاز به هیچ تغییری در این فایل.
  const [scholarshipChoice, setScholarshipChoice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { addPendingRequest } = useAdminData()

  const selectableScholarships = scholarships.filter((s) => s.status === 'active' || s.status === 'soon')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const chosenScholarship = selectableScholarships.find((s) => String(s.id) === String(scholarshipChoice))
      const degreeLabel = DEGREE_LABELS[degree] || degree
      await addPendingRequest({
        type: 'scholarship-consulting',
        name,
        phone,
        details: {
          degree,
          degreeLabel,
          age: age || 'نامشخص',
          scholarshipId: chosenScholarship?.id || null,
          scholarshipTitle: chosenScholarship?.title || 'مشخص نشده',
        },
        summary: chosenScholarship
          ? `درخواست ارزیابی بورسیه — ${degreeLabel} — ${chosenScholarship.title}`
          : `درخواست ارزیابی بورسیه — ${degreeLabel}`,
      })
      alert('درخواست ارزیابی شما ثبت شد.')
      setName('')
      setPhone('')
      setAge('')
      setScholarshipChoice('')
    } catch (err) {
      alert(err.message || 'خطا در ثبت درخواست.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="زیرمجموعه خدمات تحصیلی"
        title={
          <>
            بورسیه‌های فعال
            <span className="mt-2 block text-primary">با مهلت و شرایط شفاف</span>
          </>
        }
        desc="فرصت‌های بورسیه را پیش از انتشار عمومی رصد می‌کنیم و فقط مواردی را فهرست می‌کنیم که مسیر اقدامشان روشن و واقع‌بینانه است."
        crumbs={[
          { href: '/services', label: 'خدمات تحصیلی' },
          { href: '/active-scholarships', label: 'بورسیه‌های فعال' },
        ]}
        bgImage={portalData?.bgScholarships || '/images/hero-scholarships.jpg'}
      />

      {/* === رفع باگ گزارش‌شده: «هیرو»ی این صفحه ناقص بود === */}
      {/* فیلد ادمین bgScholarships از قبل کاملاً درست کار می‌کرد (آپلود و
          ذخیره‌اش بی‌نقص بود) و حتی روی پس‌زمینه‌ی کم‌رنگ بالای PageHero هم
          واقعاً اعمال می‌شد — اما بر خلاف StudyLoungePage.jsx و
          AcademicServicesPage.jsx، این صفحه اصلاً بلوک عکس بزرگ زیر هیرو
          را نداشت؛ یعنی از دید کاربر «چیزی اضافه نمی‌شد»، چون آن عکس
          بزرگ و چشمگیر که واقعاً معیار ارزیابی است، اینجا اصلاً وجود
          نداشت. راه‌حل دقیقاً همان الگوی اثبات‌شده‌ی خودِ این دو صفحه:
          همان یک فیلد (bgScholarships) را در یک بلوک عکسِ تمام‌عرض نمایش
          می‌دهد. */}
      <section className="pb-2 sm:pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 sm:rounded-[2rem]">
            <img
              src={portalData?.bgScholarships || '/images/hero-scholarships.jpg'}
              alt="محصلان مجموعه پژوهش در حال بررسی فرصت‌های بورسیه"
              className="h-48 w-full object-cover sm:h-64 lg:h-80"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
            <div className="glass-strong absolute inset-x-3 bottom-3 rounded-xl p-3.5 sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:p-5">
              <p className="text-xs font-medium sm:text-sm">پایش و راستی‌آزمایی روزانه فرصت‌ها</p>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">فقط بورسیه‌های دارای مسیر اقدام روشن فهرست می‌شوند</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {statusTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  tab === t.key
                    ? 'rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground sm:text-sm'
                    : 'glass rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm'
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-4 md:grid-cols-2">
            {filtered.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                فعلاً موردی در این دسته وجود ندارد.
              </p>
            ) : (
              filtered.map((s) => {
                const countryLabel = getCountryLabel(s.country)
                const countryFlag = getCountryFlag(s.country)
                return (
                  <article
                    key={s.id}
                    className="glass flex flex-col overflow-hidden rounded-[1.5rem] transition-all duration-500 hover:-translate-y-1 sm:rounded-[1.75rem]"
                  >
                    <div className="relative h-36 w-full sm:h-40">
                      <img
                        src={s.image_url || FALLBACK_SCHOLARSHIP_IMAGE}
                        alt={`دانشگاه مقصد بورسیه ${countryLabel}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent" />
                      <span className={`glass absolute end-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-[11px] ${statusBadge[s.status]?.textCls || statusBadge.active.textCls}`}>
                        {statusBadge[s.status]?.text || statusBadge.active.text}
                      </span>
                      {/* === رفع باگ گزارش‌شده ===
                          ۱) پرچم کشور: getCountryFlag() از قبل در countries.js آماده
                             بود ولی هیچ‌جا استفاده نمی‌شد؛ اکنون کنار نام کشور نمایش
                             داده می‌شود.
                          ۲) خوانایی نام کشور: قبلاً متن سفید ساده مستقیم روی گرادیان
                             بود که میزان کنتراست/خوانایی‌اش کاملاً به روشنی/تیرگی خودِ
                             عکس پشت‌سرش وابسته بود (روی عکس‌های روشن تقریباً محو
                             می‌شد). اکنون داخل یک بج شیشه‌ای مستقل (glass-strong،
                             blur+سایه‌ی خودش) قرار گرفته که کنتراستش از پس‌زمینه‌ی
                             خودِ عکس مستقل است. */}
                      <span className="glass-strong absolute inset-x-3 bottom-2.5 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-foreground shadow-sm sm:text-sm">
                        <span aria-hidden="true">{countryFlag}</span>
                        {countryLabel}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className="text-sm font-medium tracking-tight text-balance sm:text-base">{s.title}</h3>
                      <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{s.provider}</p>

                      <dl className="mt-4 grid gap-2.5 border-t border-border/70 pt-4 sm:grid-cols-2 sm:gap-3">
                        <div className="flex items-start gap-2">
                          <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                          <div className="min-w-0">
                            <dt className="text-[10px] text-muted-foreground sm:text-[11px]">مقطع</dt>
                            <dd className="text-[11px] font-medium sm:text-xs">{s.degree}</dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:col-span-2">
                          <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                          <div className="min-w-0">
                            <dt className="text-[10px] text-muted-foreground sm:text-[11px]">{s.deadline}</dt>
                            <dd className="text-[11px] text-muted-foreground sm:text-xs">{s.desc}</dd>
                          </div>
                        </div>
                        {/* === اضافه (رفع باگ گزارش‌شده) ===
                            زبان تدریس (s.lang) و مدارک لازم (s.docs) از قبل در پنل
                            ادمین قابل‌ثبت بودند ولی این‌جا اصلاً نمایش داده نمی‌شدند.
                            محدودیت سنی (s.ageLimit) کاملاً فیلد جدیدی است. */}
                        {s.lang && (
                          <div className="flex items-start gap-2">
                            <Languages className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                            <div className="min-w-0">
                              <dt className="text-[10px] text-muted-foreground sm:text-[11px]">زبان تدریس</dt>
                              <dd className="text-[11px] font-medium sm:text-xs">{s.lang}</dd>
                            </div>
                          </div>
                        )}
                        {s.ageLimit && (
                          <div className="flex items-start gap-2">
                            <Users className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                            <div className="min-w-0">
                              <dt className="text-[10px] text-muted-foreground sm:text-[11px]">محدودیت سنی</dt>
                              <dd className="text-[11px] font-medium sm:text-xs">{s.ageLimit}</dd>
                            </div>
                          </div>
                        )}
                        {s.docs && (
                          <div className="flex items-start gap-2 sm:col-span-2">
                            <FileText className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                            <div className="min-w-0">
                              <dt className="text-[10px] text-muted-foreground sm:text-[11px]">مدارک لازم</dt>
                              <dd className="text-[11px] text-muted-foreground sm:text-xs">{s.docs}</dd>
                            </div>
                          </div>
                        )}
                      </dl>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </section>

      <section className="relative border-y border-border/70 bg-card/40 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
            {portalData?.docsGuideTitle || '📚 راهنمای جامع آماده‌سازی مدارک و دوسیه تحصیلی'}
          </h2>
          <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
            {portalData?.docsGuideDesc || 'تیم مشاوران پژوهش شما را در نگارش انگیزه‌نامه، توصیه‌نامه و رزومه استاندارد یاری می‌رساند.'}
          </p>
          <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
            <div className="glass rounded-2xl border-t-4 border-primary p-4 text-right sm:p-5">
              <h3 className="text-sm font-semibold sm:text-base">
                {portalData?.docsGuideCard1Title || '✍️ انگیزه‌نامه تخصصی'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {portalData?.docsGuideCard1Desc || 'تبیین اهداف آکادمیک و متقاعدسازی کمیته بورسیه بر اساس استانداردهای بین‌المللی.'}
              </p>
            </div>
            <div className="glass rounded-2xl border-t-4 border-primary p-4 text-right sm:p-5">
              <h3 className="text-sm font-semibold sm:text-base">
                {portalData?.docsGuideCard2Title || '📄 رزومه (CV) آکادمیک'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {portalData?.docsGuideCard2Desc || 'ساختاربندی تجارب، مقالات و مهارت‌ها با فرمت‌های بین‌المللی.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="service-form-section" className="relative scroll-mt-28 py-14 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 sm:rounded-[2rem] sm:p-8">
            <h3 className="text-center text-lg font-semibold sm:text-xl">فورم درخواست ارزیابی دوسیه بورسیه</h3>
            <p className="mt-2 text-center text-xs text-muted-foreground sm:text-sm">
              جهت کسب معلومات و ارزیابی اولیه، لطفاً فورم زیر را تکمیل کنید تا متخصصین ما با شما تماس بگیرند.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 text-right sm:mt-8">
              <div>
                <label className="mb-1.5 block text-xs font-medium sm:text-sm">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  {/* === رفع باگ گزارش‌شده: این فیلد فقط شماره تماس قبول می‌کرد ===
                      همان منطق فرم مشاوره تحصیلی (AcademicServicesPage.jsx)؛
                      اعتبارسنجی واقعی در portalService.js انجام می‌شود. */}
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">شماره تماس / ایمیل (واتساپ)</label>
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
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">مقطع مورد نظر</label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="bachelor">لیسانس بورسیه</option>
                    <option value="masters">ماستری بورسیه</option>
                    <option value="phd">دوکتورا بورسیه</option>
                  </select>
                </div>
              </div>
              {/* === اضافه (رفع باگ گزارش‌شده): فیلد سن === */}
              <div>
                <label className="mb-1.5 block text-xs font-medium sm:text-sm">سن شما</label>
                <input
                  type="number"
                  min="10"
                  max="80"
                  dir="ltr"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="مثلاً: 22"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              {/* === اضافه (بخش ۱۷): بورسیه مورد نظر — گزینه‌ها زنده از همان
                  لیست واقعی «فعال»/«به‌زودی» ساخته می‌شوند، پس با هر
                  افزودن/حذف بورسیه از پنل ادمین خودکار به‌روز می‌ماند. === */}
              <div>
                <label className="mb-1.5 block text-xs font-medium sm:text-sm">بورسیه مورد نظر</label>
                <select
                  value={scholarshipChoice}
                  onChange={(e) => setScholarshipChoice(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">مشخص نیست / راهنمایی عمومی می‌خواهم</option>
                  {selectableScholarships.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {getCountryLabel(s.country)}
                      {s.status === 'soon' ? ' (به‌زودی)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submitting ? 'در حال ارسال...' : 'ثبت نهایی درخواست ارزیابی'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* === شماره تماس این بخش از فیلد servicesPhone می‌آید ===
          بورسیه‌ها زیرمجموعه‌ی همان دپارتمان خدمات تحصیلی‌اند، پس همان
          شماره (که از پیش در پنل ادمین قابل ویرایش است، پیش‌فرض
          ۰۷۲۸۱۰۱۵۶۴) اینجا هم استفاده می‌شود — نه شماره‌ی سالن مطالعه که
          قبلاً به‌صورت هاردکد در CtaBand بود. */}
      <CtaBand
        title="شرایط خود را رایگان بسنجید"
        desc="مدارک و سابقه تحصیلی‌تان را بررسی می‌کنیم و می‌گوییم کدام بورسیه‌های این فهرست برای شما شانس واقعی دارند."
        primary={{ href: '/achievements', label: 'دستاوردهای ما' }}
        phone={portalData?.servicesPhone}
      />
    </>
  )
}
