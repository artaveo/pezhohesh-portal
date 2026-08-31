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

const SERVICE_ROUTES = ['/services', '/active-scholarships']

export default function PortalLayout() {
  const { isAdminAuthenticated } = useAdminAuth()
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
      {/* === رفع باگ ظاهری: هدر عمومی سایت (لوگو/منو/نوار اعلانیه) قبلاً
          بدون هیچ شرطی رندر می‌شد و روی پنل ادمین (/admin) هم می‌نشست و
          بخشی از محتوای پنل را می‌پوشاند. حالا دقیقاً مثل فوتر، فقط وقتی
          مسیر ادمین نیست نمایش داده می‌شود. */}
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
            element={!isAdminAuthenticated ? <LoginPage /> : <AdminDashboard />}
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
