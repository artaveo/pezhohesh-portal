import React from 'react'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { usePortal } from '../contexts/PortalDataContext'
import { PageHero } from '../components/PageHero'
import { HallAmenities } from '../components/HallAmenities'
import { HallGallery } from '../components/HallGallery'
import { HallMembership } from '../components/HallMembership'
import { HallRules } from '../components/HallRules'
import { CtaBand } from '../components/CtaBand'

export default function StudyLoungePage() {
  useScrollToTop()

  // === فاز۲: اتصال بک‌گراند هیرو به فیلد bgLounge پنل ادمین ===
  // فال‌بک دقیقاً همان مسیر عکس قبلی است تا وقتی ادمین چیزی ست نکرده،
  // ظاهر صفحه عیناً مثل قبل بماند.
  const { portalData } = usePortal()
  const loungeBgImage = portalData?.bgLounge || '/images/hero-lounge.jpg'

  // === بخش ۱۰: ساعات کاری هیرو، مشترک با صفحه اصلی ===
  // «۸ صبح تا ۱۲ شب» ادعای نادرستی بود که پیش‌تر در صفحه اصلی هم اصلاح
  // شد (نگاه کنید به Hero.jsx → heroHoursWeekday/heroHoursFriday). چون
  // این‌جا و صفحه اصلی هر دو دارند یک واقعیت فیزیکی یکسان (ساعات کاری
  // همان یک سالن) را توصیف می‌کنند، از همان دو فیلد پنل ادمین استفاده
  // می‌شود — نه یک فیلد جداگانه و تکراری — تا هر تغییری در پنل، همزمان
  // هر دو صفحه را به‌روز نگه دارد.
  const heroHoursWeekday = portalData?.heroHoursWeekday || 'شنبه تا پنج‌شنبه ۶ صبح تا ۷ شام'
  const heroHoursFriday = portalData?.heroHoursFriday || 'جمعه‌ها ۹ صبح تا ۳ بعدازظهر'
  const loungeEyebrow = `ظرفیت آزاد — ${heroHoursWeekday}، ${heroHoursFriday}`

  // === بخش ۱۰: آمار چهارگانه هیرو، اکنون از پنل ادمین ===
  // «ساعت کاری روزانه» از ۱۶ (که با ساعات واقعی هم‌خوانی نداشت) به ۱۳
  // اصلاح شد. روی آمار «نوع عضویت» هنگام هاور موس یک راهنمای کوچک
  // («عضویت روزانه و ماهانه») نشان داده می‌شود — نگاه کنید به
  // PageHero.jsx برای پیاده‌سازی این تولتیپ اختیاری.
  const hallStat1Number = portalData?.hallStat1Number || '۷'
  const hallStat1Label = portalData?.hallStat1Label || 'روز هفته باز'
  const hallStat2Number = portalData?.hallStat2Number || '۱۳'
  const hallStat2Label = portalData?.hallStat2Label || 'ساعت کاری روزانه'
  const hallStat3Number = portalData?.hallStat3Number || '۲'
  const hallStat3Label = portalData?.hallStat3Label || 'نوع عضویت'
  const hallStat3Hint = portalData?.hallStat3Hint || 'عضویت روزانه و ماهانه'
  const hallStat4Number = portalData?.hallStat4Number || '۲'
  const hallStat4Label = portalData?.hallStat4Label || 'بخش خانم/آقا'

  return (
    <>
      <PageHero
        eyebrow={loungeEyebrow}
        title={
          <>
            سالن مطالعه‌ای که برای
            <span className="mt-2 block text-primary">تمرکز عمیق ساخته شده</span>
          </>
        }
        desc="بدون صندلی ثابت و بدون میز اختصاصی. با عضویت روزانه یا ماهانه وارد می‌شوید و روی هر صندلی خالی که دوست داشتید می‌نشینید."
        crumbs={[{ href: '/lounge', label: 'سالن مطالعه' }]}
        stats={[
          { value: hallStat1Number, label: hallStat1Label },
          { value: hallStat2Number, label: hallStat2Label },
          { value: hallStat3Number, label: hallStat3Label, hint: hallStat3Hint },
          { value: hallStat4Number, label: hallStat4Label },
        ]}
        bgImage={loungeBgImage}
      />

      <section className="pb-2 sm:pb-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-border/60 sm:rounded-[2rem]">
            <img
              src={loungeBgImage}
              alt="نمای سالن مطالعه"
              className="h-56 w-full object-cover sm:h-72 lg:h-[26rem]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
            {/* === رفع باگ گزارش‌شده: کپشن روی عکس در موبایل تقریباً نیمی از عکس را می‌پوشاند ===
                علت: این کارت (بر خلاف نمونه‌ی مشابه در Hero.jsx صفحه‌ی اصلی که
                همیشه یک ردیف افقی است) در موبایل flex-col بود، یعنی عنوان،
                توضیح، و بج «صندلی آزاد» هرسه زیر هم می‌آمدند و ارتفاع کارت را
                چند برابر می‌کردند. راه‌حل دقیقاً همان الگوی اثبات‌شده‌ی
                Hero.jsx است: یک ردیف افقی ثابت در همه‌ی سایزها (متن سمت
                راست/چپ با truncate، بج همیشه کنار آن)، که در موبایل هم کارت
                را کوچک و ظریف نگه می‌دارد. */}
            <div className="glass-strong absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl p-2.5 sm:inset-x-4 sm:bottom-4 sm:gap-3 sm:rounded-2xl sm:p-4">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium sm:text-sm">نشستن آزاد در تمام سالن</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">
                  سالن اصلی بی‌صدا، فضای مباحثه و کانتین — جدا از یکدیگر
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[9px] font-medium text-primary sm:px-3 sm:py-1.5 sm:text-xs">
                صندلی آزاد
              </span>
            </div>
          </div>
        </div>
      </section>

      <HallAmenities />
      <HallGallery />
      <HallMembership />
      <HallRules />

      <CtaBand
        title="امروز عضو شوید و همین امروز مطالعه را شروع کنید"
        desc="برای عضویت روزانه کافی است به پذیرش مراجعه کنید. برای عضویت ماهانه تماس بگیرید تا در همان روز فعال شود."
        primary={{ href: '/services', label: 'خدمات تحصیلی ما' }}
        phone={portalData?.loungePhone}
      />
    </>
  )
}
