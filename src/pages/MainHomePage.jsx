import React from 'react'
import { useScrollToTop } from '../hooks/useScrollToTop'
import { usePortal } from '../contexts/PortalDataContext'
import { Hero } from '../components/Hero'
import { Services } from '../components/Services'
import { StudyHall } from '../components/StudyHall'
import { Scholarship } from '../components/Scholarship'
import { Process } from '../components/Process'
import { Stories } from '../components/Stories'
import { CtaBand } from '../components/CtaBand'

/**
 * صفحه اصلی — بازسازی کامل با ساختار نسخه v0 (منبع ساختاری جدید).
 * فعلاً محتوا مطابق پیش‌فرض‌های طراحی است؛ اتصال به دیتای ادمین/Supabase
 * طبق برنامه، در فاز بعدی (بک‌اند) روی همین ساختار اضافه می‌شود.
 */
export default function MainHomePage() {
  useScrollToTop()

  // === شماره تماس این CtaBand عمومی از فیلد loungePhone می‌آید ===
  // قبلاً CtaBand بدون هیچ prop ای صدا زده می‌شد و مقدار پیش‌فرض هاردکد
  // خودش (که همان شماره سالن مطالعه بود) را نشان می‌داد؛ رفتار بصری فعلی
  // با این تغییر دقیقاً حفظ می‌شود، فقط اکنون از پنل ادمین قابل ویرایش است.
  const { portalData } = usePortal()

  return (
    <>
      <Hero />
      <Services />
      <StudyHall />
      <Scholarship />
      <Process />
      <Stories />
      <CtaBand phone={portalData?.loungePhone} />
    </>
  )
}
