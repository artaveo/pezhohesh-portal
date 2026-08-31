import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLocalPortalData } from '../services/portalService';
import { useAdminData } from './AdminDataContext';

const PortalDataContext = createContext(null);

/**
 * === رفع ریشه‌ای مشکل ۱ (Fetch تکراری) ===
 * پیش‌تر این Context کاملاً مستقل از AdminDataContext، خودش هم
 * fetchPortalData() را در یک useEffect جداگانه صدا می‌زد؛ یعنی همان
 * دیتای Supabase (هم portal_settings و هم portal_scholarships) دقیقاً
 * دو بار در هر بار باز شدن سایت خوانده می‌شد: یک بار توسط
 * AdminDataProvider و یک بار توسط همین PortalDataProvider.
 *
 * اکنون تنها AdminDataProvider (که در App.jsx بالاتر از این Provider
 * سوار می‌شود) مسئول فراخوانی واقعی fetchPortalData() است.
 * PortalDataProvider دیگر هیچ درخواست شبکه‌ای مستقلی انجام نمی‌دهد و
 * فقط دو کار می‌کند:
 *   ۱. برای حفظ دقیق رفتار Static-First قبلی، بلافاصله و به‌صورت همگام
 *      دیتای محلی/کش‌شده را با getLocalPortalData() می‌خواند تا
 *      ActiveScholarshipsPage بدون کوچک‌ترین تأخیر و دقیقاً مثل قبل
 *      رندر شود.
 *   ۲. با useAdminData() به همان دیتایی که AdminDataProvider از Supabase
 *      گرفته «گوش می‌دهد» و به محض هیدریت‌شدن (isHydrated=true) همان
 *      مقدار را — بدون هیچ فراخوانی شبکه‌ای اضافه — در استیت داخلی خودش
 *      اعمال می‌کند.
 *
 * شکل خروجی usePortal() (نام‌های portalData / setPortalData / loading)
 * دقیقاً مثل قبل باقی مانده تا ActiveScholarshipsPage.jsx بدون نیاز به
 * هیچ تغییری کار کند.
 */
export function PortalDataProvider({ children }) {
  // ۱. مقدار اولیه فوراً از فایل استاتیک/لوکال خوانده می‌شود تا سایت آنی باز شود
  //    (Static-First دقیقاً حفظ شده — بدون تغییر نسبت به نسخه قبلی)
  const [portalData, setPortalData] = useState(getLocalPortalData());

  // ۲. اتصال به همان منبع واحدی که AdminDataProvider از Supabase گرفته است
  const { portalData: sharedPortalData, isLoading: isSharedLoading, isHydrated } = useAdminData();

  useEffect(() => {
    // فقط وقتی منبع واحد واقعاً از Supabase هیدریت شد، دیتای تازه را
    // (بدون هیچ فراخوانی جدید fetchPortalData) روی استیت محلی این
    // Provider اعمال کن — دقیقاً همان لحظه‌ای که قبلاً fetchPortalData
    // خودِ این فایل resolve می‌شد.
    if (isHydrated) {
      setPortalData((current) => ({ ...current, ...sharedPortalData }));
    }
  }, [isHydrated, sharedPortalData]);

  return (
    <PortalDataContext.Provider value={{ portalData, setPortalData, loading: isSharedLoading }}>
      {children}
    </PortalDataContext.Provider>
  );
}

// هوک اختصاصی برای استفاده آسان در تمام صفحات پورتال (امضای خروجی بدون تغییر)
export function usePortal() {
  const context = useContext(PortalDataContext);
  if (!context) {
    throw new Error("usePortal باید در داخل PortalDataProvider استفاده شود.");
  }
  return context;
}
