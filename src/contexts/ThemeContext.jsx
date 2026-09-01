import React, { createContext, useContext, useEffect, useState } from 'react'

/**
 * === تم شب/روز — منبع واحد حقیقت برای تیره/روشن بودن سایت ===
 *
 * === تصمیم نهایی (بعد از یک رفت‌وبرگشت): پیش‌فرض خودکار می‌ماند ===
 * سایت برای هر بازدیدکننده‌ای که هنوز صریحاً از داخل خود سایت انتخابی
 * نکرده، همان تنظیم شب/روز دستگاه/مرورگرش (prefers-color-scheme) را
 * دنبال می‌کند — همان رفتاری که همیشه بود. تنها چیزی که این‌بار اضافه
 * شده، یک درخواست حرفه‌ای و یک‌باره (ThemePreferencePrompt.jsx) برای
 * بازدیدکننده‌ی تازه است تا خودش صریحاً انتخاب کند: «هماهنگ با دستگاهم»
 * (یعنی همین رفتار خودکار قبلی، آگاهانه تأیید شده)، «روشن»، یا «تاریک».
 * دکمه‌ی خورشید/ماه بالای سایت (SiteHeader.jsx) هم همیشه در دسترس است و
 * هر وقت بخواهند می‌توانند نظرشان را عوض کنند.
 *
 * سه‌حالته: mode یکی از 'system' | 'light' | 'dark' است.
 *  - 'system' یعنی «پیرو دستگاه»: هم پیش‌فرض اولیه (بازدیدکننده‌ی تازه)
 *    است، هم گزینه‌ای است که می‌توان از داخل درخواست/دکمه صریحاً انتخاب
 *    کرد؛ در هر دو حالت زنده (بدون نیاز به رفرش) با تغییر تنظیم سیستم‌عامل
 *    کاربر هماهنگ می‌ماند.
 *  - 'light' / 'dark' یعنی کاربر صریحاً خودش یکی از این دو را انتخاب کرده
 *    (چه از داخل درخواست اولیه، چه بعداً از دکمه‌ی هدر) و دیگر تابع
 *    تنظیمات سیستم‌عامل نیست.
 *
 * نکته‌ی هماهنگی با ضدفلاش: یک اسکریپت کوچک داخل index.html، پیش از
 * رندر ری‌اکت، همین کلید localStorage را می‌خواند و طبق همین سه‌حالت،
 * کلاس `dark` را زودتر از رندر (در صورت لزوم) روی <html> می‌گذارد — تا
 * هنگام رفرش صفحه، رنگ اشتباه برای یک لحظه فلاش نزند.
 *
 * STORAGE_KEY عمداً یک نام اختصاصی پروژه دارد (نه صرفاً "theme") تا با
 * کلیدهای احتمالی دیگر کتابخانه‌ها/افزونه‌ها در localStorage تداخل نکند.
 * نبودن این کلید در localStorage دقیقاً به معنای «بازدیدکننده‌ی تازه‌ای
 * است که هنوز درخواست تم را ندیده» است — همان چیزی که promptVisible را
 * تعیین می‌کند.
 */
const STORAGE_KEY = 'pazhuhesh-theme'

const ThemeContext = createContext(undefined)

function resolveSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // localStorage ممکن است در دسترس نباشد (حالت خصوصی/محدودشده‌ی مرورگر)
  }
  return null
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => readStoredMode() ?? 'system')
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  // اگر تا الان هیچ مقداری در localStorage ذخیره نشده، یعنی این بازدیدکننده
  // هنوز درخواست انتخاب تم را ندیده — پس باید نشانش بدهیم.
  const [promptVisible, setPromptVisible] = useState(() => readStoredMode() === null)

  // اعمال تم مؤثر (بر اساس mode) روی <html>، رنگ نوار مرورگر، و — وقتی
  // mode === 'system' است — گوش‌دادن زنده به تغییر تنظیم سیستم‌عامل.
  useEffect(() => {
    const applyEffectiveTheme = (effective) => {
      setTheme(effective)
      const root = document.documentElement
      if (effective === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) {
        meta.setAttribute('content', effective === 'dark' ? '#0C1612' : '#257D61')
      }
    }

    if (mode === 'system') {
      applyEffectiveTheme(resolveSystemTheme())
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = (e) => applyEffectiveTheme(e.matches ? 'dark' : 'light')
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    }

    applyEffectiveTheme(mode)
    return undefined
  }, [mode])

  const persistMode = (nextMode) => {
    setMode(nextMode)
    try {
      localStorage.setItem(STORAGE_KEY, nextMode)
    } catch {
      // اگر localStorage در دسترس نباشد، انتخاب فقط برای همین بازدید اعمال
      // می‌شود و دفعه‌ی بعد دوباره درخواست تم نشان داده خواهد شد — قابل
      // قبول است، چون کارکرد اصلی سایت نباید به آن وابسته باشد.
    }
    setPromptVisible(false)
  }

  // دکمه‌ی هدر: بین روشن/تاریک واقعی (بر اساس آنچه الان دیده می‌شود) جابه‌جا
  // می‌کند و این را به‌عنوان یک انتخاب صریح ذخیره می‌کند (دیگر 'system' نیست).
  const toggleTheme = () => persistMode(theme === 'dark' ? 'light' : 'dark')

  // انتخاب صریح از داخل درخواست اولیه: 'system' | 'light' | 'dark'
  const chooseTheme = (nextMode) => persistMode(nextMode)

  // بستن درخواست بدون انتخاب آشکار = تأیید ضمنی همان حالت خودکار فعلی؛
  // رفتار سایت هیچ تغییری نمی‌کند، فقط دیگر دوباره از کاربر پرسیده نمی‌شود.
  const dismissPrompt = () => persistMode(mode)

  return (
    <ThemeContext.Provider
      value={{ theme, mode, isDark: theme === 'dark', toggleTheme, chooseTheme, promptVisible, dismissPrompt }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (ctx === undefined) {
    throw new Error('useTheme باید داخل ThemeProvider استفاده شود')
  }
  return ctx
}
