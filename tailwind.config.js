/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // === رفع باگ: تعدیل‌کننده شفافیت (/NN) روی این رنگ‌ها کار نمی‌کرد ===
        // قبلاً هرکدام مستقیم به var(--x) اشاره می‌کردند (یک رشته‌ی کامل
        // رنگ oklch)؛ تیلویند فقط زمانی می‌تواند «/NN» را به یک رنگ سفارشی
        // اضافه کند که همان رنگ با الگوی rgb(var(--x) / <alpha-value>)
        // تعریف شده باشد و متغیرش فقط سه عدد کانال نگه دارد. متغیرهای
        // «-rgb» معادل دقیق (نه تخمینی) همان رنگ‌های oklch اصلی‌اند —
        // در index.css با ابزار تبدیل رنگ محاسبه شدند، رنگ‌ها بدون تغییر
        // مانده‌اند. یعنی هم کلاس‌های بدون شفافیت (bg-primary) و هم با
        // شفافیت (bg-primary/15) از این پس واقعاً یک رنگ CSS تولید می‌کنند.
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        input: 'rgb(var(--input-rgb) / <alpha-value>)',
        ring: 'rgb(var(--ring-rgb) / <alpha-value>)',
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground-rgb) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground-rgb) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground-rgb, 249 253 251) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground-rgb) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground-rgb) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground-rgb) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground-rgb) / <alpha-value>)',
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) * 0.6)',
        md: 'calc(var(--radius) * 0.8)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) * 1.4)',
        '2xl': 'calc(var(--radius) * 1.8)',
        '3xl': 'calc(var(--radius) * 2.2)',
        '4xl': 'calc(var(--radius) * 2.6)',
      },
      fontFamily: {
        sans: ['Vazirmatn', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Vazirmatn', 'ui-serif', 'serif'],
      },
      keyframes: {
        rise: {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        rise: 'rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        'float-slow': 'floaty 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
