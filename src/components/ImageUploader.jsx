import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * کامپوننت مستقل آپلود عکس — برای هر جای پنل ادمین که نیاز به تصویر
 * دارد (فیلدهای تک‌عکسی مثل bgLounge/bgServices/bgScholarships/
 * bgAchievements/mainHeroImage و همچنین آرایه‌های تصویری مثل
 * aboutPageImages و loungeGalleryImages) قابل استفاده مجدد است.
 *
 * رفتار:
 * ۱. کاربر فایل را انتخاب می‌کند → پیش‌نمایش محلی آنی نمایش داده می‌شود.
 * ۲. فایل در باکت عمومی Supabase Storage به نام "portal-images" آپلود
 *    می‌شود.
 * ۳. پس از موفقیت، URL عمومی نهایی از طریق onUploadComplete(url) به
 *    کامپوننت والد (AdminDashboard.jsx) برگردانده می‌شود؛ خودِ این
 *    کامپوننت هیچ استیت جهانی نگه نمی‌دارد — والد تصمیم می‌گیرد آن URL
 *    را کجا ذخیره کند (یک فیلد تکی یا یک آیتم داخل آرایه).
 *
 * Props:
 * - currentUrl: آدرس فعلی تصویر (برای نمایش پیش‌نمایش اولیه)
 * - onUploadComplete(url): کال‌بک اجباری، بعد از آپلود موفق صدا زده می‌شود
 * - label: برچسب اختیاری (فقط برای alt تصویر پیش‌نمایش استفاده می‌شود)
 */
/**
 * === اضافه (رفع مشکل گزارش‌شده: لود کند عکس‌ها) ===
 * عکس ورودی را حداکثر تا عرض/ارتفاع MAX_DIMENSION کوچک و به JPEG با
 * کیفیت JPEG_QUALITY فشرده می‌کند — کاملاً سمت مرورگر، بدون هیچ سرویس یا
 * وابستگی جدید (فقط canvas بومی مرورگر). png های خیلی کوچک/شفاف (مثل
 * لوگو) عمداً فشرده نمی‌شوند چون تبدیل به JPEG شفافیت را از بین می‌برد؛
 * فقط عکس‌های واقعاً بزرگ (بک‌گراندها، گالری، بورسیه و…) فشرده می‌شوند.
 * در صورت هر خطایی، فایل اصلی بدون تغییر برگردانده می‌شود.
 */
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
const SKIP_COMPRESSION_MIN_BYTES = 350 * 1024; // زیر ۳۵۰ کیلوبایت اصلاً زحمت فشرده‌سازی ارزشش را ندارد

function compressImageIfPossible(file) {
  return new Promise((resolve) => {
    if (file.size < SKIP_COMPRESSION_MIN_BYTES) return resolve(file);
    // PNG با شفافیت (مثل لوگو/آیکون) تبدیل به JPEG نمی‌شود تا شفافیت از بین نرود.
    if (file.type === 'image/png' && file.size < 1024 * 1024) return resolve(file);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob || blob.size >= file.size) {
              // اگر فشرده‌سازی چیزی کوچک‌تر از اصل تولید نکرد، همان فایل اصلی حفظ شود
              resolve(file);
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg' }
            );
            resolve(compressedFile);
          },
          'image/jpeg',
          JPEG_QUALITY
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

export default function ImageUploader({ currentUrl, onUploadComplete, label }) {
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // === رفع باگ: پیش‌نمایش با تغییر بیرونی currentUrl هماهنگ نمی‌شد ===
  // قبلاً previewUrl فقط یک‌بار (در mount) از currentUrl مقداردهی می‌شد.
  // اگر بعداً همین مقدار از بیرون عوض می‌شد (مثلاً fetchPortalData یک
  // نسخه‌ی تازه‌تر از Supabase می‌آورد)، این تصویر کوچک هیچ‌وقت به‌روز
  // نمی‌شد — یعنی ادمین می‌توانست یک پیش‌نمایش قدیمی/نادرست ببیند بدون
  // اینکه بفهمد آیا چیزی که واقعاً ذخیره شده همین است یا نه.
  useEffect(() => {
    setPreviewUrl(currentUrl || '');
  }, [currentUrl]);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // ۵ مگابایت

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');

    // === اعتبارسنجی نوع و حجم فایل، پیش از هرگونه آپلود ===
    // چون این پروژه بک‌اند اختصاصی ندارد و مستقیماً از مرورگر به Supabase
    // Storage آپلود می‌شود، هیچ لایه‌ی دیگری فایل انتخابی را بررسی نمی‌کند.
    // بدون این چک، یک فایل با پسوند جعلی (مثلاً غیرتصویری با نام x.jpg) یا
    // یک فایل حجیم می‌توانست مستقیم به باکت عمومی portal-images آپلود شود.
    if (!file.type || !file.type.startsWith('image/')) {
      setErrorMessage('فقط فایل تصویری مجاز است. لطفاً یک فایل با فرمت عکس (jpg, png, webp و مشابه) انتخاب کنید.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // === رفع باگ گزارش‌شده: عکس‌های شکسته («؟») روی موبایل ===
    // آیفون‌ها به‌صورت پیش‌فرض عکس‌های گالری را با فرمت HEIC/HEIF ذخیره
    // می‌کنند. این فرمت MIME معتبر image/heic دارد پس از چک بالا رد
    // می‌شود و مستقیم در Supabase ذخیره می‌شود، ولی روی خیلی از مرورگرها/
    // دستگاه‌ها (و برخلاف تصور رایج، حتی خودِ سافاری در بعضی نسخه‌ها/زمینه‌ها)
    // دیکود نمی‌شود و آیکون شکسته («؟») نشان می‌دهد. چون این پروژه هیچ
    // مرحله‌ی تبدیل فرمت سمت سرور ندارد (آپلود مستقیم مرورگر→Supabase)،
    // امن‌ترین راه این است که این فرمت از همین‌جا رد شود و ادمین راهنمایی
    // شود عکس را با فرمت jpg/png/webp انتخاب کند (اکثر گوشی‌ها/برنامه‌ها
    // گزینه‌ی «ذخیره به‌عنوان JPEG» یا تبدیل خودکار هنگام اشتراک‌گذاری دارند).
    const isHeic =
      /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '');
    if (isHeic) {
      setErrorMessage(
        'فرمت HEIC/HEIF (فرمت پیش‌فرض عکس آیفون) روی خیلی از مرورگرها/دستگاه‌ها به‌درستی نمایش داده نمی‌شود. لطفاً عکس را با فرمت JPG یا PNG انتخاب کنید (معمولاً از تنظیمات دوربین یا هنگام اشتراک‌گذاری عکس قابل تغییر است).'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('حجم فایل بیش از حد مجاز است. لطفاً عکسی با حجم حداکثر ۵ مگابایت انتخاب کنید.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // پیش‌نمایش آنی و محلی، پیش از تکمیل آپلود واقعی
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      // === اضافه (رفع مشکل گزارش‌شده: لود کند عکس‌ها در سایت) ===
      // بزرگ‌ترین اقدام مؤثر و بی‌خطر (بدون تغییر معماری/بدون نیاز به
      // سرویس جدید): قبل از آپلود، خودِ عکس در مرورگر ادمین کوچک و
      // فشرده می‌شود — عکس‌های موبایل معمولاً ۳ تا ۸ مگابایت‌اند و در
      // ابعادی (مثلاً ۴۰۰۰×۳۰۰۰) بسیار بزرگ‌تر از چیزی هستند که هیچ‌جای
      // این سایت واقعاً نمایش می‌دهد (بزرگ‌ترین بلوک تصویر حداکثر حدود
      // ۱۹۲۰px عرض دارد). فشرده‌سازی حجم واقعی فایل را که کاربر نهایی
      // باید دانلود کند، معمولاً ۷۰-۹۰٪ کاهش می‌دهد — دقیقاً جایی که کند
      // بودن لود اولیه عکس‌ها از آن‌جا می‌آید. اگر فشرده‌سازی به هر دلیلی
      // (فرمت پشتیبانی‌نشده در canvas و…) شکست بخورد، به‌صورت امن به
      // آپلود فایل اصلی برمی‌گردیم؛ آپلود هرگز به‌خاطر این مرحله متوقف
      // نمی‌شود.
      const fileToUpload = await compressImageIfPossible(file);
      const fileExt = fileToUpload === file ? (file.name.split('.').pop() || 'jpg').toLowerCase() : 'jpg';
      const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portal-images')
        .upload(safeFileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('portal-images')
        .getPublicUrl(safeFileName);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        throw new Error('دریافت آدرس عمومی تصویر از سوپابیس ناموفق بود.');
      }

      setPreviewUrl(publicUrl);

      if (typeof onUploadComplete === 'function') {
        onUploadComplete(publicUrl);
      }
    } catch (err) {
      console.error('خطا در آپلود تصویر به Supabase Storage:', err);
      setErrorMessage(err?.message || 'خطا در آپلود تصویر. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f1f3f5',
          border: '1px solid #ced4da',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label || 'پیش‌نمایش تصویر'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span style={{ fontSize: '18px', color: '#adb5bd' }}>🖼️</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 160px', minWidth: '160px' }}>
        <label
          style={{
            display: 'inline-block',
            padding: '8px 14px',
            backgroundColor: isUploading ? '#94b8a5' : '#2d6a4f',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: '700',
            cursor: isUploading ? 'default' : 'pointer',
            textAlign: 'center',
            fontFamily: 'inherit',
            width: 'fit-content'
          }}
        >
          {isUploading ? '⏳ در حال آپلود...' : '📤 انتخاب و آپلود عکس'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>
        {errorMessage && (
          <span style={{ fontSize: '11.5px', color: '#dc3545', fontWeight: '700' }}>{errorMessage}</span>
        )}
      </div>
    </div>
  );
}