import React from 'react'
import { Monitor, Sun, Moon, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

/**
 * === درخواست تم برای بازدیدکننده‌ی تازه ===
 * فقط یک‌بار، برای کاربری که هنوز هیچ انتخاب صریحی درباره‌ی تم سایت
 * نکرده، نمایش داده می‌شود (promptVisible از ThemeContext.jsx می‌آید —
 * دقیقاً یعنی «هنوز چیزی در localStorage ذخیره نشده»). هر کدام از سه
 * گزینه که انتخاب شود (یا حتی با × بسته شود)، دیگر هرگز دوباره دیده
 * نمی‌شود؛ رفتار پیش‌فرض سایت (پیرو تنظیم دستگاه) هم دست‌نخورده می‌ماند —
 * این فقط یک تأیید آگاهانه و راهی برای اطلاع کاربر از وجود این قابلیت
 * است، نه تغییری در منطق پیش‌فرض.
 *
 * جایگاه: پایین صفحه (نه بالا، تا با هدر/نوار اعلانیه‌ی سقف سایت که خودش
 * ارتفاع متغیر دارد تداخلی نداشته باشد) — الگوی استاندارد و آشنا برای
 * این نوع درخواست‌های غیرمسدودکننده (مشابه بنر رضایت کوکی).
 *
 * === تصمیم عمدی: رنگ خودِ کارت، برعکسِ تم واقعی صفحه است ===
 * اگر سایت (بر اساس تنظیم دستگاه) روشن باز شده، این کارت خودش تیره
 * است؛ اگر سایت تیره باز شده، این کارت خودش روشن است. هدف: هم جلب
 * توجه بیشتر با همان اولین نگاه (چون رنگش با بقیه‌ی صفحه یکی نیست)،
 * هم نمایش زنده‌ی «نمونه»ی همون گزینه‌ی مقابل، دقیقاً همان لحظه‌ای که
 * از کاربر می‌خواهیم بین‌شان انتخاب کند. این کار با کلاس‌های مستقل
 * .theme-dark / .theme-light (تعریف‌شده در index.css، دقیقاً همان
 * توکن‌های رنگی html.dark و :root ولی قابل‌اعمال روی هر عنصر دیگر هم)
 * انجام می‌شود — نه با تغییر تم واقعی سایت، فقط یک بازتعریف موضعی
 * روی همین یک کارت. به همین دلیل هم از جلوه‌ی شیشه‌ای نیمه‌شفاف
 * (glass-strong که رنگش را با color-mix از پس‌زمینه‌ی واقعی صفحه
 * می‌گیرد) استفاده نشده و به‌جایش یک کارت کاملاً مات و توپر دارد —
 * تا رنگ معکوس‌شده، تمیز و بدون قاطی‌شدن با پس‌زمینه‌ی واقعی دیده شود.
 */
export function ThemePreferencePrompt() {
  const { theme, promptVisible, chooseTheme, dismissPrompt } = useTheme()

  if (!promptVisible) return null

  const inverseThemeClass = theme === 'dark' ? 'theme-light' : 'theme-dark'

  const options = [
    { mode: 'system', label: 'هماهنگ با دستگاهم', Icon: Monitor },
    { mode: 'light', label: 'روشن', Icon: Sun },
    { mode: 'dark', label: 'تاریک', Icon: Moon },
  ]

  return (
    <div
      role="dialog"
      aria-label="انتخاب ظاهر سایت"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-sm pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:end-4 sm:bottom-5"
    >
      <div
        className={`${inverseThemeClass} rise relative rounded-3xl border border-border bg-card p-4 text-foreground shadow-[0_25px_60px_-25px_rgba(0,0,0,0.55)] sm:p-5`}
      >
        <button
          type="button"
          onClick={dismissPrompt}
          aria-label="بستن این پیام"
          className="absolute end-3 top-3 flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>

        <p className="pe-8 text-sm font-semibold tracking-tight text-foreground">ظاهر سایت را انتخاب کنید</p>
        <p className="mt-1.5 pe-8 text-xs leading-relaxed text-muted-foreground">
          می‌توانید تم سایت را با دستگاه‌تان هماهنگ نگه دارید یا خودتان روشن یا تاریک را انتخاب کنید. هر
          زمانی که بخواهید نیز از دکمه‌ی بالای صفحه قابل تغییر است.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {options.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => chooseTheme(mode)}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3 text-[11px] font-medium text-foreground transition-colors hover:border-primary hover:bg-secondary"
            >
              <Icon className="size-4 text-primary" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
