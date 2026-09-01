import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminDataProvider } from './contexts/AdminDataContext';
import { PortalDataProvider } from './contexts/PortalDataContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PortalLayout from './layouts/PortalLayout';

/**
 * === رفع ریشه‌ای مشکل ۱ (Fetch تکراری) — بخش چیدمان Providerها ===
 * AdminDataProvider تنها مسئول فراخوانی واقعی fetchPortalData() از
 * Supabase است (منبع واحد حقیقت). PortalDataProvider اکنون مستقیماً
 * همین‌جا، به‌عنوان فرزند بلافصل AdminDataProvider سوار می‌شود — و دیگر
 * درون PortalLayout.jsx تودرتو نیست — تا صراحتاً در ریشه اپلیکیشن
 * مشخص باشد که هر دو Context از یک درخت داده واحد تغذیه می‌شوند.
 * PortalDataProvider خودش دیگر هیچ درخواست شبکه‌ای مستقلی به Supabase
 * نمی‌زند (برای جزئیات به contexts/AdminDataContext.jsx و
 * contexts/PortalDataContext.jsx مراجعه کنید).
 *
 * نکته دیگر: پیش‌تر در این فایل، تابع checkDatabaseConnection() به‌صورت
 * کاملاً بی‌قیدوشرط و در همان لحظه لود ماژول (یعنی حتی در نسخه نهایی/
 * پروداکشن) اجرا می‌شد و یک کوئری اضافه و صرفاً برای تست کنسول به جدول
 * portal_settings می‌زد. این کد هیچ نقش عملکردی در اپلیکیشن نداشت و
 * صرفاً یک درخواست شبکه‌ای غیرضروری دیگر بر تعداد فراخوانی‌های Supabase
 * تحمیل می‌کرد؛ به همین دلیل حذف شد (به همراه ایمپورت بلااستفاده‌ی
 * supabaseClient که فقط همین تابع از آن استفاده می‌کرد).
 */
export default function AppRouter() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AdminDataProvider>
          <PortalDataProvider>
            <AdminAuthProvider>
              <PortalLayout />
            </AdminAuthProvider>
          </PortalDataProvider>
        </AdminDataProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
