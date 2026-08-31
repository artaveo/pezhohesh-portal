import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const AdminAuthContext = createContext(null);

/**
 * منبع حقیقتِ «ادمین بودن» همیشه سمت سرور بررسی می‌شود:
 * جدول admin_users با RLS طوری تنظیم شده که فقط اگر رکورد کاربر جاری
 * در آن ثبت شده باشد، کوئری چیزی برمی‌گرداند. هیچ کاربری نمی‌تواند
 * برای خودش رکورد بسازد (بدون Policy درج برای نقش authenticated).
 *
 * === فاز ۳ دور سوم دیباگ: افزودن نقش (role) ===
 * قبلاً این تابع فقط true/false برمی‌گرداند (یعنی «آیا اصلاً ادمین است؟»).
 * برای پشتیبانی از پنل دوم و محدودترِ «دپارتمان خدمات تحصیلی»، اکنون
 * ستون role هم از admin_users خوانده می‌شود. اگر رکورد وجود نداشته باشد
 * → null (ادمین نیست). اگر رکورد باشد ولی role هنوز ست نشده باشد (همه‌ی
 * ادمین‌های قبل از این تغییر) → پیش‌فرض 'super_admin' در نظر گرفته
 * می‌شود، تا هیچ ادمین فعلی با این تغییر دسترسی‌اش را از دست ندهد یا
 * غافلگیر نشود.
 */
async function verifyAdminRole(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('خطا در بررسی نقش ادمین:', error.message);
    return null;
  }
  if (!data) return null;
  return data.role || 'super_admin';
}

export function AdminAuthProvider({ children }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentAdminEmail, setCurrentAdminEmail] = useState(null);
  // === فاز ۳ دور سوم دیباگ: نقش ادمین جاری ===
  // 'super_admin' یا 'services_admin'. تا وقتی ورود موفق نشده، null است.
  // PortalLayout.jsx بر اساس همین مقدار تصمیم می‌گیرد کدام داشبورد
  // (AdminDashboard کامل یا ServicesAdminDashboard محدود) نمایش داده شود.
  const [currentAdminRole, setCurrentAdminRole] = useState(null);

  // === خروج خودکار بعد از بی‌فعالیتی (Idle Timeout) ===
  // چون پنل ادمین اطلاعات شخصی مراجعین (نام/شماره تماس) را نشان می‌دهد
  // و ممکن است روی یک سیستم مشترک/عمومی باز بماند، بعد از IDLE_TIMEOUT_MS
  // میلی‌ثانیه بدون هیچ فعالیت واقعی (موس/کیبورد/لمس/اسکرول)، نشست
  // به‌صورت خودکار بسته می‌شود. مسیر /admin خودش به محض false شدن
  // isAdminAuthenticated کاربر را به صفحه ورود برمی‌گرداند (نگاه کنید
  // به PortalLayout.jsx)، پس نیازی به ناوبری دستی اینجا نیست.
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // ۱۵ دقیقه — در صورت نیاز قابل تغییر

  // === رفع باگ گزارش‌شده: ورود گاهی ادمین را در پنل نادرست می‌گذاشت ===
  // ریشه: initSession() (چک نشست موجود، هنگام mount) و onAuthStateChange
  // (رویداد لحظه‌ای ورود/خروج) هر دو async هستند و هر دو مستقل verifyAdminRole
  // را صدا می‌زنند. اگر مرورگر از قبل یک نشست معتبرِ ادمین دیگر (مثلاً
  // ادمین محدود خدمات تحصیلی) در حافظه داشته باشد، initSession() همان لحظه
  // شروع به بررسی آن می‌کند؛ اگر تا قبل از پایان این بررسی، کاربر با حساب
  // متفاوتی (مثلاً ادمین ارشد) از فرم لاگین وارد شود، ممکن است پاسخِ
  // دیرترِ initSession (برای نشست قدیمی) بعد از پاسخِ درستِ login() برسد و
  // state صحیح را با نقش نادرست/قدیمی Overwrite کند. راه‌حل: یک شمارنده‌ی
  // یکتا (authCheckIdRef) — فقط آخرین درخواستی که شروع شده مجاز است در
  // نهایت state را تغییر دهد؛ هر پاسخ قدیمی‌تر که دیرتر برسد نادیده گرفته
  // می‌شود.
  const authCheckIdRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const myCheckId = ++authCheckIdRef.current;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = await verifyAdminRole(session.user.id);
        if (isMounted && myCheckId === authCheckIdRef.current) {
          setIsAdminAuthenticated(Boolean(role));
          setCurrentAdminEmail(role ? session.user.email : null);
          setCurrentAdminRole(role);
        }
      }
      if (isMounted) setIsCheckingSession(false);
    }

    initSession();

    // هر تغییر در نشست واقعی سوپابیس (ورود/خروج/انقضای توکن) به‌صورت زنده دنبال می‌شود
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const myCheckId = ++authCheckIdRef.current;
      if (session?.user) {
        const role = await verifyAdminRole(session.user.id);
        if (isMounted && myCheckId === authCheckIdRef.current) {
          setIsAdminAuthenticated(Boolean(role));
          setCurrentAdminEmail(role ? session.user.email : null);
          setCurrentAdminRole(role);
        }
      } else if (isMounted) {
        setIsAdminAuthenticated(false);
        setCurrentAdminEmail(null);
        setCurrentAdminRole(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * ورود واقعی از طریق Supabase Auth با ایمیل و رمز اختصاصی هر ادمین.
   * هیچ ایمیلی در کد هاردکد نیست؛ هر ادمین حساب Auth مستقل خودش را دارد
   * و باید در جدول admin_users هم ثبت شده باشد تا دسترسی پنل را بگیرد.
   */
  const login = useCallback(async (email, password) => {
    if (!email || !password) {
      return { success: false, message: 'ایمیل و رمز عبور هر دو الزامی است.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error || !data?.session?.user) {
      return { success: false, message: 'ایمیل یا رمز عبور اشتباه است.' };
    }

    const role = await verifyAdminRole(data.session.user.id);
    if (!role) {
      // نشست معتبر است ولی این حساب در فهرست ادمین‌ها نیست → بلافاصله خروج
      await supabase.auth.signOut();
      return { success: false, message: 'این حساب دسترسی مدیریتی ندارد.' };
    }

    // === بخشی از رفع باگ گزارش‌شده (نگاه کنید به توضیح بالای useEffect) ===
    // این ورود صریح کاربر است؛ آن را جدیدترین درخواست معتبر اعلام می‌کنیم
    // تا هیچ بررسی قدیمی‌تر (initSession یا رویداد onAuthStateChange که
    // هم‌زمان با signInWithPassword بالا شلیک می‌شود) نتواند این state
    // درست را بعداً بازنویسی کند.
    authCheckIdRef.current += 1;
    setIsAdminAuthenticated(true);
    setCurrentAdminEmail(data.session.user.email);
    setCurrentAdminRole(role);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // همان منطق guard بالا: خروج صریح هم باید جدیدترین رویداد باشد تا یک
    // بررسی نقش قدیمی و هنوز در حال اجرا نتواند بعد از خروج دوباره state را «true» کند.
    authCheckIdRef.current += 1;
    setIsAdminAuthenticated(false);
    setCurrentAdminEmail(null);
    setCurrentAdminRole(null);
  }, []);

  // فقط وقتی ادمین واقعاً وارد شده، به رویدادهای فعالیت گوش می‌دهیم —
  // روی صفحات عمومی سایت هیچ listener اضافه‌ای ثبت نمی‌شود.
  useEffect(() => {
    if (!isAdminAuthenticated) return undefined;

    let idleTimer = null;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        logout();
        // alert بعد از خروج نمایش داده می‌شود تا ادمین بفهمد چرا به‌طور
        // ناگهانی به صفحه ورود برگشته (نه به‌خاطر خطا).
        alert('به دلیل عدم فعالیت، از پنل مدیریت خارج شدید. لطفاً دوباره وارد شوید.');
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [isAdminAuthenticated, logout]);

  // سازگاری با کدهای دیگر پروژه (مثل AdminDashboard.jsx) که setAdminAuthenticated
  // را از کانتکست می‌گیرند. دیگر امکان جعل «true» از بیرون وجود ندارد؛
  // فقط خروج واقعی (false) را انجام می‌دهد.
  const setAdminAuthenticated = useCallback((value) => {
    if (value) {
      console.warn(
        'setAdminAuthenticated(true) نادیده گرفته شد. ورود ادمین فقط از طریق login() و Supabase Auth مجاز است.'
      );
      return;
    }
    logout();
  }, [logout]);

  const value = useMemo(
    () => ({
      isAdminAuthenticated,
      isCheckingSession,
      currentAdminEmail,
      currentAdminRole,
      login,
      logout,
      setAdminAuthenticated
    }),
    [isAdminAuthenticated, isCheckingSession, currentAdminEmail, currentAdminRole, login, logout, setAdminAuthenticated]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  }
  return context;
}
