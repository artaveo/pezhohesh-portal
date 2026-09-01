import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { ServiceFooter } from '../components/ServiceFooter'
import { ThemePreferencePrompt } from '../components/ThemePreferencePrompt'
import MainHomePage from '../pages/MainHomePage'
import StudyLoungePage from '../pages/StudyLoungePage'
import AcademicServicesPage from '../pages/AcademicServicesPage'
import AboutUsPage from '../pages/AboutUsPage'
import AchievementsPage from '../pages/AchievementsPage'
import ActiveScholarshipsPage from '../pages/ActiveScholarshipsPage'
import LoginPage from '../pages/LoginPage'
import AdminDashboard from '../pages/AdminDashboard'
import ServicesAdminDashboard from '../pages/ServicesAdminDashboard'

const SERVICE_ROUTES = ['/services', '/active-scholarships']

export default function PortalLayout() {
  const { isAdminAuthenticated, currentAdminRole } = useAdminAuth()
  const { pathname, hash } = useLocation()

  // === هماهنگ با ناوبری انکر «درباره ما» (SiteHeader.jsx) ===
  // قبلاً این افکت روی هر تغییر مسیر، بی‌قید‌وشرط صفحه را به بالا
  // می‌برد؛ همین رفتار با اسکرول نرم به بخش هدف (که خود AboutUsPage.jsx
  // بر اساس location.hash انجام می‌دهد) تداخل می‌کرد و کاربر را همیشه
  // به بالای صفحه برمی‌گرداند، نه به بخش مورد نظر. اکنون این اسکرول
  // خودکار فقط وقتی اجرا می‌شود که URL هش نداشته باشد.
  React.useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  const isServiceSection = SERVICE_ROUTES.includes(pathname)
  const isAdminRoute = pathname === '/admin'

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* === رفع باگ: هدر سایت روی پنل ادمین می‌افتاد ===
          SiteHeader با position: fixed نوشته شده (همیشه روی محتوای زیرش
          شناور می‌ماند)، در حالی که AdminDashboard.jsx خودش یک چیدمان
          کاملاً مستقل و تمام‌صفحه (height: 100vh, overflow: hidden) دارد
          و اصلاً انتظار هدر سایت را بالای خودش ندارد. نتیجه این بود که
          نوار ناوبری/لوگوی سایت روی عنوان و سایدبار پنل ادمین می‌افتاد و
          متن‌های آن را می‌پوشاند. همان منطق isAdminRoute که پیش‌تر فقط
          برای مخفی‌کردن فوتر استفاده می‌شد («پنل ادمین/لاگین → بدون فوتر»
          را ببینید پایین‌تر)، اکنون برای هدر هم اعمال شد تا مسیر /admin
          (چه صفحه لاگین چه خودِ داشبورد) کاملاً بدون کروم عمومی سایت
          باشد — دقیقاً همان فلسفه‌ی «صفحه کاری داخلی، نه صفحه عمومی». */}
      {!isAdminRoute && <SiteHeader />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<MainHomePage />} />
          <Route path="/lounge" element={<StudyLoungePage />} />
          <Route path="/services" element={<AcademicServicesPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/active-scholarships" element={<ActiveScholarshipsPage />} />

          {/* === رفع باگ: پنل دپارتمانی (services_admin) همیشه پنل ارشد کامل را می‌دید ===
              AdminAuthContext.jsx نقش واقعی کاربر (super_admin / services_admin) را
              از قبل درست از جدول admin_users می‌خواند و در currentAdminRole نگه
              می‌دارد، اما این مسیر هرگز به آن مقدار نگاه نمی‌کرد و بی‌قید‌وشرط
              AdminDashboard (پنل کامل) را رندر می‌کرد — یعنی هر دو نقش، صرف‌نظر
              از role واقعی‌شان در دیتابیس، وارد همان یک پنل ارشد می‌شدند. اکنون
              فقط وقتی currentAdminRole برابر 'services_admin' است، پنل محدود
              دپارتمانی (ServicesAdminDashboard) نمایش داده می‌شود؛ در غیر این
              صورت (super_admin یا مقدار پیش‌فرض قدیمی) رفتار قبلی دقیقاً حفظ
              شده — هیچ ادمین ارشد فعلی چیزی را از دست نمی‌دهد. */}
          <Route
            path="/admin"
            element={
              !isAdminAuthenticated ? (
                <LoginPage />
              ) : currentAdminRole === 'services_admin' ? (
                <ServicesAdminDashboard />
              ) : (
                <AdminDashboard />
              )
            }
          />
        </Routes>
      </main>

      {/* === یک فوتر دقیق per section، نه سراسری کورکورانه ===
          - خدمات تحصیلی/بورسیه‌ها → فوتر اختصاصی همان دپارتمان
          - پنل ادمین/لاگین → بدون فوتر (صفحه کاری داخلی، نه صفحه عمومی)
          - بقیه صفحات → فوتر جامع سایت */}
      {!isAdminRoute && (isServiceSection ? <ServiceFooter /> : <SiteFooter />)}

      {/* === درخواست تم برای بازدیدکننده‌ی تازه (ThemePreferencePrompt.jsx) ===
          فقط روی صفحات عمومی؛ پنل ادمین/لاگین طبق همان فلسفه‌ی «صفحه کاری
          داخلی» بالا، بدون کروم عمومی سایت می‌ماند. خودِ کامپوننت هم فقط
          یک‌بار (تا وقتی کاربر انتخابی نکرده) چیزی رندر می‌کند. */}
      {!isAdminRoute && <ThemePreferencePrompt />}
    </div>
  )
}
