import React, { useState } from 'react'
import { Check, Info } from 'lucide-react'
import { submitPortalRequest } from '../services/portalService'
import { usePortal } from '../contexts/PortalDataContext'
import { toNumber } from '../lib/utils'

/**
 * === منطق واقعی حفظ‌شده از StudyLoungePage.jsx قدیمی ===
 * محاسبه فاکتور زنده (calculateTotal) و ارسال فرم (submitPortalRequest)
 * دقیقاً همان منطق قبلی است؛ فقط پوسته بصری با Tailwind بازطراحی شده.
 *
 * === اتصال قیمت پایه به پنل ادمین ===
 * priceDaily/priceMonthly/priceAdmission اکنون از portalData خوانده
 * می‌شوند (مقدار پیش‌فرض دقیقاً همان اعداد قبلی است، پس بدون تغییر در
 * پنل، محاسبه و نمایش قبلی عیناً حفظ می‌شود). نرخ اینترنت اضافی (۴۰۰
 * نامحدود / ۲۰ به‌ازای هر گیگابایت) فیلد اختصاصی در پنل ادمین ندارد،
 * پس همچنان هاردکد باقی مانده است.
 */

export function HallMembership() {
  const { portalData } = usePortal()
  const priceDailyStr = portalData?.priceDaily || '۳۰'
  const priceMonthlyStr = portalData?.priceMonthly || '۲۵۰'
  const priceAdmissionStr = portalData?.priceAdmission || '۵۰'
  const priceDaily = toNumber(priceDailyStr, 30)
  const priceMonthly = toNumber(priceMonthlyStr, 250)
  const priceAdmission = toNumber(priceAdmissionStr, 50)

  const plans = [
    {
      name: 'عضویت روزانه',
      price: priceDailyStr,
      unit: 'افغانی — برای یک روز',
      desc: 'مناسب روزهای پرفشار امتحان یا وقتی فقط چند روز به فضای آرام نیاز دارید.',
      // === بخش ۱۰: دسترسی به فضای مباحثه اکنون در هر دو نوع عضویت است ===
      // قبلاً عضویت روزانه فقط «دسترسی به کانتین» داشت و فضای مباحثه فقط
      // برای عضویت ماهانه ذکر شده بود — در حالی که فضای مباحثه بخشی از
      // امکانات عمومی سالن است (نگاه کنید به HallAmenities.jsx) و محدود
      // به یک نوع عضویت نیست.
      features: ['ورود آزاد در تمام ساعات کاری همان روز', 'دسترسی به کانتین و فضای مباحثه', 'اینترنت پرسرعت'],
    },
    {
      name: 'عضویت ماهانه',
      price: priceMonthlyStr,
      unit: 'افغانی — برای یک ماه',
      desc: 'انتخاب اکثر محصلان؛ مناسب کسانی که مطالعه روزانه و برنامه بلندمدت دارند.',
      featured: true,
      features: [
        'ورود نامحدود در تمام روزهای ماه',
        `حق‌الداخله ${priceAdmissionStr} افغانی فقط برای محصل جدید`,
        'دسترسی به کانتین و فضای مباحثه',
      ],
    },
  ]

  const [name, setName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [gender, setGender] = useState('male')
  const [planType, setPlanType] = useState('monthly')
  const [isNewMember, setIsNewMember] = useState(true)
  const [internetType, setInternetType] = useState('none')
  const [gbAmount, setGbAmount] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  // === ضدهرزنامه: هانی‌پات + تله زمانی ===
  // «website» فیلدی است که فقط بات‌های خودکار فرم‌ساز پر می‌کنند (برای
  // کاربر با CSS کاملاً مخفی است). formLoadedAt هم لحظه mount شدن فرم را
  // نگه می‌دارد تا submitPortalRequest بتواند ارسال‌های غیرطبیعی سریع را
  // تشخیص دهد.
  const [honeypot, setHoneypot] = useState('')
  const [formLoadedAt] = useState(() => Date.now())

  const calculateTotal = () => {
    let total = 0
    if (planType === 'monthly') {
      total += priceMonthly
      if (isNewMember) total += priceAdmission
      if (internetType === 'unlimited') total += 400
      if (internetType === 'gb') total += gbAmount * 20
    } else if (planType === 'daily') {
      total += priceDaily
      if (internetType === 'gb') total += gbAmount * 20
    }
    return total
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitPortalRequest({
        type: 'lounge',
        name,
        phone: contactPhone,
        details: { gender, planType, isNewMember, internetType, gbAmount, total: calculateTotal() },
        summary: `${planType === 'monthly' ? 'عضویت ماهانه' : 'عضویت روزانه'} — مجموع: ${calculateTotal()} افغانی`,
        honeypot,
        formLoadedAt,
      })
      alert('درخواست شما ثبت شد. تیم پذیرش پس از بررسی با شما تماس می‌گیرد.')
      setName('')
      setContactPhone('')
    } catch (err) {
      alert(err.message || 'خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="membership" className="relative py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-[0.2em] text-primary">عضویت</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:mt-4 sm:text-3xl lg:text-4xl">
              دو نوع عضویت، بدون پیچیدگی
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
            صندلی‌ها اختصاصی نیستند. با عضویت فعال وارد می‌شوید و هر جای خالی که دوست داشتید می‌نشینید.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <article
              key={p.name}
              className={
                p.featured
                  ? 'relative overflow-hidden rounded-[1.5rem] bg-primary p-5 text-primary-foreground sm:rounded-[2rem] sm:p-7 lg:p-9'
                  : 'glass relative overflow-hidden rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-7 lg:p-9'
              }
            >
              {p.featured && (
                <span className="absolute end-5 top-5 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[10px] font-medium sm:end-6 sm:top-6 sm:text-[11px]">
                  پرطرفدار
                </span>
              )}

              <p className={p.featured ? 'text-xs opacity-85 sm:text-sm' : 'text-xs text-muted-foreground sm:text-sm'}>{p.name}</p>
              <p className="mt-3 flex items-baseline gap-2 sm:mt-4">
                <span className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{p.price}</span>
              </p>
              <p className={p.featured ? 'mt-1 text-[11px] opacity-85 sm:text-xs' : 'mt-1 text-[11px] text-muted-foreground sm:text-xs'}>
                {p.unit}
              </p>
              <p className={p.featured ? 'mt-4 text-xs leading-relaxed opacity-90 sm:mt-5 sm:text-sm' : 'mt-4 text-xs leading-relaxed text-muted-foreground sm:mt-5 sm:text-sm'}>
                {p.desc}
              </p>

              <ul className="mt-5 space-y-2.5 sm:mt-7 sm:space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs leading-relaxed sm:gap-3 sm:text-sm">
                    <span
                      className={
                        p.featured
                          ? 'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 sm:size-5'
                          : 'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary sm:size-5'
                      }
                    >
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                    <span className={p.featured ? 'opacity-95' : 'text-foreground/80'}>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="glass mt-4 flex items-start gap-3 rounded-2xl p-4 sm:mt-6 sm:p-5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:size-8">
            <Info className="size-3.5 sm:size-4" aria-hidden="true" />
          </span>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            عضویت روزانه در محل پذیرش و عضویت ماهانه با تماس تلفنی یا مراجعه حضوری فعال می‌شود. در
            روزهای شلوغ، ورود بر اساس ظرفیت باقی‌مانده سالن است.
          </p>
        </div>

        {/* فرم ثبت‌نام آنلاین با محاسبه زنده فاکتور — منطق کاملاً واقعی */}
        <div id="lounge-form-section" className="mt-10 scroll-mt-28 sm:mt-16">
          <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-border/70 bg-card p-5 sm:rounded-[2rem] sm:p-8">
            <h3 className="text-center text-lg font-semibold sm:text-xl">فورم آنلاین درخواست ثبت‌نام سالن</h3>
            <p className="mt-2 text-center text-xs text-muted-foreground sm:text-sm">
              مشخصات خود را وارد کنید تا فاکتور زنده برایتان محاسبه شود.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 text-right sm:mt-8">
              {/* فیلد هانی‌پات — برای کاربر واقعی نامرئی و از تب‌ناوبری خارج است؛
                  فقط بات‌های خودکار معمولاً این را هم پر می‌کنند. */}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="نام کامل خود را بنویسید"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium sm:text-sm">شماره تماس</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  placeholder="07XXXXXXXX"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">بخش سالن</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="male">بخش اختصاصی آقایان</option>
                    <option value="female">بخش اختصاصی بانوان</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">مدت زمان عضویت</label>
                  <div className="flex h-[42px] items-center gap-4 text-sm">
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <input type="radio" name="plan" checked={planType === 'monthly'} onChange={() => setPlanType('monthly')} />
                      ماهانه
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <input type="radio" name="plan" checked={planType === 'daily'} onChange={() => setPlanType('daily')} />
                      روزانه
                    </label>
                  </div>
                </div>
              </div>

              {planType === 'monthly' && (
                <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-accent/40 p-3 text-xs text-accent-foreground sm:text-sm">
                  <input
                    type="checkbox"
                    checked={isNewMember}
                    onChange={(e) => setIsNewMember(e.target.checked)}
                    className="mt-0.5"
                  />
                  محصل جدید هستم ({priceAdmissionStr} افغانی حق‌الداخله ثبت دوسیه ماه اول اضافه شود)
                </label>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium sm:text-sm">اینترنت اضافی</label>
                  <select
                    value={internetType}
                    onChange={(e) => setInternetType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="none">بدون اینترنت اضافی</option>
                    <option value="unlimited">نامحدود ماهانه (۴۰۰ افغانی)</option>
                    <option value="gb">حجمی (هر گیگابایت ۲۰ افغانی)</option>
                  </select>
                </div>
                {internetType === 'gb' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium sm:text-sm">تعداد گیگابایت</label>
                    <input
                      type="number"
                      min="1"
                      value={gbAmount}
                      onChange={(e) => setGbAmount(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3.5">
                <span className="text-sm font-semibold text-secondary-foreground sm:text-base">
                  جمع کل فاکتور: {calculateTotal()} افغانی
                </span>
                <span className="text-[11px] text-muted-foreground sm:text-xs">پرداخت حضوری در سالن</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {submitting ? 'در حال ارسال...' : 'ارسال و ثبت‌نام اولیه'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
