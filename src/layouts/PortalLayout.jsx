import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import { ServiceFooter } from '../components/ServiceFooter'
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

// === رفع باگ گزارش‌شده (خیلی مهم) ===
// در بررسی کد مشخص شد که ServicesAdminDashboard.jsx (پنل محدود دپارتمان
// خدمات تحصیلی — یک فایل کامل و آماده، ۷۲ کیلوبایت) هیچ‌جای این فایل
// import یا render نمی‌شد؛ مسیر «/admin» صرف‌نظر از currentAdminRole
// همیشه فقط <AdminDashboard /> (پنل کامل ارشد) را نشان می‌داد. یعنی
// سیم‌کشی «کدام ادمین کدام پنل را ببیند» اصلاً به این فایل وصل نشده بود.
// این تابع کوچک همان تصمیم را می‌گیرد: ادمین ارشد → پنل کامل، ادمین
// محدود خدمات تحصیلی → پنل محدود. اگر role به هر دلیلی نامشخص/جدید بود
// (مثلاً null موقت حین بررسی)، به‌صورت امن پنل محدودتر نشان داده می‌شود
// تا هرگز یک نقش ناشناخته به‌اشتباه دسترسی کامل نگیرد.
function AdminRoute({ currentAdminRole }) {
  if (currentAdminRole === 'super_admin') return <AdminDashboard />
  return <ServicesAdminDashboard />
}

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

          <Route
            path="/admin"
            element={!isAdminAuthenticated ? <LoginPage /> : <AdminRoute currentAdminRole={currentAdminRole} />}
          />
        </Routes>
      </main>

      {/* === یک فوتر دقیق per section، نه سراسری کورکورانه ===
          - خدمات تحصیلی/بورسیه‌ها → فوتر اختصاصی همان دپارتمان
          - پنل ادمین/لاگین → بدون فوتر (صفحه کاری داخلی، نه صفحه عمومی)
          - بقیه صفحات → فوتر جامع سایت */}
      {!isAdminRoute && (isServiceSection ? <ServiceFooter /> : <SiteFooter />)}
    </div>
  )
}
