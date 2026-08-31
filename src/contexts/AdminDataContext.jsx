import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchPortalData, getLocalPortalData, submitPortalRequest } from '../services/portalService';

const AdminDataContext = createContext(null);

/**
 * === منبع واحد حقیقتِ داده‌های پورتال (Single Source of Truth) ===
 *
 * رفع ریشه‌ای مشکل ۱ (Fetch تکراری):
 * پیش از این، هم AdminDataContext و هم PortalDataContext مستقل از هم
 * fetchPortalData() را صدا می‌زدند و دقیقاً همان تنظیمات و لیست بورسیه‌ها
 * دو بار از Supabase خوانده می‌شد. اکنون فقط همین Provider — که در
 * App.jsx بالاترین سطح درخت کامپوننت را اشغال می‌کند — مسئول فراخوانی
 * واقعی fetchPortalData() است. PortalDataContext.jsx دیگر هیچ درخواست
 * شبکه‌ای مستقلی نمی‌زند و صرفاً همین دیتای از پیش دریافت‌شده را از طریق
 * useAdminData() مصرف می‌کند (نگاه کنید به PortalDataContext.jsx).
 */
export function AdminDataProvider({ children }) {
  // Pages own their approved static fallback content. The context starts with an
  // empty object so fallback content can render immediately without waiting for Supabase.
  const [portalData, setPortalDataState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPortalData() {
      try {
        const formattedSettings = await fetchPortalData();

        if (isMounted) {
          // Commit the complete server snapshot in one update. No intermediate
          // null/empty replacement is rendered, so fallback UI never flashes away.
          setPortalDataState((currentData) => ({
            ...currentData,
            ...formattedSettings
          }));
          setIsHydrated(true);
        }
      } catch (err) {
        console.error('خطا در فراخوانی دیتابیس ابری سوپابیس:', err?.message || err);

        // === رفع بخشی از ریشه مشکل ۳ ===
        // قبلاً در این catch هیچ کاری با portalData انجام نمی‌شد؛ یعنی اگر
        // fetchPortalData به‌طور کامل شکست می‌خورد (یا خطای غیرمنتظره‌ای
        // پرتاب می‌کرد)، portalData برای همیشه در همان مقدار اولیه خالی
        // ({}) باقی می‌ماند. اکنون در این حالت، حداقل آخرین دیتای
        // کش‌شده/استاتیک محلی (getLocalPortalData) به‌عنوان جایگزین اعمال
        // می‌شود تا portalData هرگز کاملاً خالی نماند.
        if (isMounted) {
          setPortalDataState((currentData) => ({
            ...getLocalPortalData(),
            ...currentData
          }));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPortalData();

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePortalData = useCallback((value) => {
    setPortalDataState((currentData) => ({
      ...currentData,
      ...(value || {})
    }));
  }, []);

  /**
   * رفع ریشه‌ای مشکل ۴:
   * addPendingRequest پیش از این در AdminDataContext اصلاً وجود نداشت،
   * در حالی که AcademicServicesPage.jsx آن را از useAdminData() می‌گرفت
   * و صدا می‌زد (خطای "addPendingRequest is not a function" در زمان اجرا).
   * منطق داخلی آن دقیقاً معادل submitPortalRequest موجود در
   * portalService.js است (ثبت در جدول portal_requests سوپابیس، همراه با
   * پشتیبانی کامل از صف آفلاین)؛ به همین دلیل مستقیماً همان تابع را
   * فراخوانی می‌کند تا هیچ منطقی تکراری یا ناهم‌خوان نوشته نشود.
   */
  const addPendingRequest = useCallback((payload) => submitPortalRequest(payload), []);

  const value = useMemo(
    () => ({
      portalData,
      setPortalData: updatePortalData,
      addPendingRequest,
      isLoading,
      isHydrated
    }),
    [portalData, updatePortalData, addPendingRequest, isLoading, isHydrated]
  );

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used inside AdminDataProvider');
  }
  return context;
}
