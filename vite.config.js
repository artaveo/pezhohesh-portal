import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // === فاز PWA / آفلاین‌فرست ===
    // این پلاگین کاملاً افزودنی (additive) است؛ هیچ فایل موجودی را در زمان
    // توسعه (dev) تغییر نمی‌دهد. فقط در build خروجی نهایی (dist)، یک
    // Service Worker تولید می‌کند و تگ‌های لازم (لینک مانیفست + اسکریپت
    // ثبت SW) را خودش به index.html تزریق می‌کند — یعنی خودِ فایل
    // index.html در سورس دست‌نخورده باقی می‌ماند.
    //
    // تصمیم generateSW به‌جای injectManifest:
    // هیچ منطق سفارشی/غیراستاندارد سرویس‌ورکر (مثل push notification یا
    // background sync دلخواه) در این فاز لازم نیست — همه‌چیز با قوانین
    // routing اعلانی Workbox (declarative runtimeCaching) قابل تعریف است.
    // در نتیجه generateSW ساده‌تر، کم‌خطاتر و برای نگهداری توسط توسعه‌دهنده‌ی
    // غیرمتخصص در Service Worker (خودت) مناسب‌تر است. اگر در آینده نیاز به
    // کنترل کاملاً دستی روی fetch handler پیدا شد، می‌شود به injectManifest
    // مهاجرت کرد.
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // در حالت توسعه (dev) کاملاً غیرفعال — تا HMR/Vite dev server با
      // هیچ رفتار کش/SW تداخل نکند. تست واقعی PWA فقط با build+preview
      // انجام می‌شود (به راهنمای تست در پاسخ نهایی مراجعه کن).
      devOptions: {
        enabled: false
      },

      manifest: {
        name: 'مجتمع پژوهش',
        short_name: 'پژوهش',
        description: 'سالن مطالعه، مشاوره تحصیلی، بورسیه‌ها و دستاوردهای محصلین — مجتمع پژوهش',
        lang: 'fa',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // theme_color: همان رنگ اصلی برند «مجتمع پژوهش» (#257D61) — روی
        // نوار آدرس مرورگر موبایل و splash screen اپ نصب‌شده دیده می‌شود.
        // background_color: عمداً سفید نگه داشته شده (نه #257D61)، چون
        // این رنگ فقط پس‌زمینه‌ی صفحه‌ی بارگذاری اولیه (splash) قبل از
        // رندر شدن React است و سفید معمولاً خواناتر/خنثی‌تر از یک رنگ
        // تیره پررنگ برای آن لحظه‌ی کوتاه است. اگر ترجیح می‌دهی همین‌جا
        // هم #257D61 باشد، فقط کافیست مقدار زیر را جایگزین کنی.
        background_color: '#ffffff',
        theme_color: '#257D61',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        // فایل‌های استاتیک بیلد (خروجی Vite در dist) که در اولین بازدید
        // پیش‌کش (precache) می‌شوند: باندل‌های JS/CSS، خودِ index.html،
        // و هر آیکون/تصویر استاتیکی که در پوشه public/ باشد (مثل
        // favicon.svg). این آدرس‌ها همیشه fingerprint شده‌اند، پس
        // نسخه‌ی جدید بیلد به‌طور خودکار جایگزین نسخه‌ی قبلی می‌شود —
        // بدون نیاز به تغییر منطق موجود پروژه.
        globPatterns: [
          '**/*.{js,css,html,ico,svg,png,webp,woff,woff2}'
        ],

        // === Navigation Fallback (App Shell برای SPA) ===
        // چون این پروژه یک SPA با BrowserRouter است (نه چند صفحه HTML
        // جدا)، وقتی کاربر آفلاین باشد و مستقیماً یا با رفرش به مسیرهایی
        // مثل /lounge یا /services برود، خودِ مرورگر باید بداند این‌ها را
        // به همان index.html پیش‌کش‌شده هدایت کند تا React Router بتواند
        // مسیر را کلاینت‌ساید رندر کند. این دقیقاً همان چیزی است که باعث
        // می‌شود «صفحات دیده‌شده در بازدید دوم آفلاین باز شوند».
        //
        // مسیر /admin عمداً از این fallback مستثنی شده — طبق محدودیت
        // صریح پروژه («پنل ادمین کلاً از هر نوع کش مستثنی باشد»)، حتی
        // shell خالی HTML هم نباید برای این مسیر از کش سرو شود؛ اگر
        // کاربر آفلاین باشد و به /admin برود، باید رفتار طبیعی مرورگر
        // (خطای عدم اتصال) را ببیند، نه یک shell کش‌شده.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/admin/],

        // === هیچ Runtime Caching Rule ای برای Supabase REST API (جداول
        // portal_settings / portal_scholarships / portal_requests /
        // admin_users) تعریف نشده — این یک تصمیم آگاهانه است، نه فراموشی:
        //
        // ۱. fetchPortalData() در portalService.js (خواندن
        //    portal_settings + portal_scholarships) دقیقاً همان یک
        //    فراخوانی مشترک است که هم صفحات عمومی و هم خودِ
        //    AdminDashboard برای پر کردن فرم‌هایش استفاده می‌کنند
        //    (AdminDataContext.jsx، Single Source of Truth). طبق تصمیم
        //    صریح تو، این دو جدول عمداً از هر لایه کش Workbox خارج
        //    نگه داشته شدند — چون لایه‌ی Static-First/Background
        //    Hydration که از قبل در همان portalService.js وجود دارد
        //    (localStorage با کلید PORTAL_STORAGE_KEY)، همین الان دقیقاً
        //    همان رفتار stale-while-revalidate (نمایش فوری نسخه محلی +
        //    جایگزینی با نسخه تازه در پس‌زمینه) را برای بازدیدکننده
        //    تامین می‌کند — بدون این‌که ادمین را در معرض ریسک دیدن دیتای
        //    قدیمی هنگام باز کردن پنل قرار دهد.
        // ۲. portal_requests (فرم‌های در انتظار بررسی + آرشیو در
        //    AdminDashboard.jsx) و admin_users فقط از خودِ پنل ادمین
        //    خوانده می‌شوند و هیچ صفحه عمومی به آن‌ها دسترسی ندارد؛
        //    چون هیچ runtimeCaching rule ای برای دامنه/مسیر Supabase
        //    REST تعریف نکرده‌ایم، Workbox اصلاً این درخواست‌ها را
        //    intercept نمی‌کند و مستقیم و بدون واسطه به شبکه می‌روند —
        //    دقیقاً همان رفتار فعلی پروژه، بدون هیچ تغییری.
        // ۳. «صف آفلاین فرم‌ها» (queueOfflineRequest/syncOfflineQueue) هم
        //    از همین قاعده مستثنی نشده چون اصلاً هیچ‌وقت GET نمی‌زند
        //    (فقط insert/update با POST/PATCH که به‌صورت پیش‌فرض توسط
        //    Workbox کش نمی‌شوند) — این فاز چیزی به آن اضافه نکرده است.
        runtimeCaching: [
          {
            // فقط عکس‌های ذخیره‌شده در باکت عمومی Supabase Storage
            // (portal-images) — یعنی همان عکس‌هایی که ادمین از طریق
            // ImageUploader.jsx آپلود می‌کند (گالری سالن مطالعه، هیرو
            // صفحات، ۴۰ اسلات درباره ما، دستاوردها و غیره).
            urlPattern: ({ url }) => /\/storage\/v1\/object\/public\//.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-images',
              expiration: {
                // طبق تصمیم صریح: نگهداری بلندمدت (۹۰ روز) و حداکثر ۳۰۰
                // ورودی؛ وقتی به سقف برسد یا مرورگر با کمبود فضا مواجه
                // شود، قدیمی‌ترین ورودی‌ها خودکار حذف می‌شوند
                // (purgeOnQuotaError) — عکس‌های خیلی قدیم‌تر از سقف سنی
                // هم به‌مرور از کش پاک می‌شوند، اما خودِ فایل در Supabase
                // Storage دست‌نخورده باقی می‌ماند.
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 90,
                purgeOnQuotaError: true
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],

        // کش‌های قدیمی نسخه‌ی قبلی بیلد (که دیگر در precache manifest
        // فعلی نیستند) به‌طور خودکار پاک می‌شوند تا فضای مرورگر کاربر
        // بی‌دلیل پر نشود.
        cleanupOutdatedCaches: true,
        clientsClaim: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
