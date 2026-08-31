import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { updatePortalSettings, getLocalPortalData, fetchPortalData, isEmailContact } from '../services/portalService';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAdminData } from '../contexts/AdminDataContext';
import { COUNTRIES, getFlagEmoji, getCountryLabel } from '../data/countries';
import ImageUploader from '../components/ImageUploader';
import { SEED_SERVICES_FAQ } from './AcademicServicesPage';

/**
 * === فاز ۳ دور سوم دیباگ: پنل مجزای دپارتمان خدمات تحصیلی ===
 *
 * این یک پنل ادمین کاملاً مستقل و محدودتر است، برای ادمین‌هایی که فقط باید
 * محتوای صفحه‌ی «خدمات تحصیلی» و «بورسیه‌های فعال» را مدیریت کنند — بدون
 * دسترسی به تنظیمات سالن مطالعه، صفحه اصلی، دستاوردها یا تصاویر درباره ما.
 *
 * === اصل طراحی مهم: صفر تغییر در الگوی موجود ===
 * هر state، هر handler و تقریباً هر خط JSX این فایل عیناً از AdminDashboard.jsx
 * کپی شده — نه بازنویسی یا «بهبود» شده. این عمدی است: AdminDashboard.jsx از
 * چند دور دیباگ واقعی عبور کرده (باگ‌های واقعی مثل «بورسیه‌های جدید هرگز
 * ذخیره نمی‌شدند» یا «حذف ناخواسته‌ی داده» در همین کد رفع شده‌اند)، پس
 * کوچک‌ترین بازنویسی «تمیزتر» همان باگ‌های رفع‌شده را دوباره زنده می‌کند.
 * تنها تفاوت واقعی با AdminDashboard.jsx: (۱) فقط state/بخش‌های مربوط به
 * خدمات تحصیلی + بورسیه‌ها اینجا وجود دارد، (۲) تابع ذخیره فقط همین کلیدها
 * را می‌فرستد، نه هر ~۶۰ کلید پورتال را.
 *
 * === چرا امن است که این‌جا فقط زیرمجموعه‌ای از کلیدها ذخیره شود؟ ===
 * updatePortalSettings (در services/portalService.js) هر کلید را جداگانه
 * و مستقل upsert می‌کند (نه یک بلاک واحد) — پس فرستادن فقط ۱۵ کلید مرتبط
 * با خدمات/بورسیه، هیچ اثری روی کلیدهای دیگر (bgLounge, mainHeroImage و
 * غیره) در دیتابیس نمی‌گذارد. همچنین setPortalData (از AdminDataContext)
 * یک merge است (`{...currentData, ...value}`) نه replace — پس ارسال یک
 * آبجکت جزئی به آن، بقیه‌ی داده‌ی مشترک را در تب باز کاربر پاک نمی‌کند.
 */

// === کپی مستقیم از AdminDashboard.jsx — تبدیل شماره تماس محلی افغانستان به فرمت wa.me ===
function toEnglishDigits(value) {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  return (value || '').toString().replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)));
}

function formatWhatsappNumber(phone) {
  const digitsOnly = toEnglishDigits(phone).replace(/\D/g, '');
  if (!digitsOnly) return '';
  if (digitsOnly.startsWith('93')) return digitsOnly;
  if (digitsOnly.startsWith('0')) return `93${digitsOnly.slice(1)}`;
  return `93${digitsOnly}`;
}

function openWhatsapp(phone) {
  const formatted = formatWhatsappNumber(phone);
  if (!formatted) {
    alert('شماره تماس این درخواست نامعتبر است.');
    return;
  }
  window.open(`https://wa.me/${formatted}`, '_blank', 'noopener,noreferrer');
}

function openEmailContact(email, subjectContext) {
  if (!isEmailContact(email)) {
    alert('ایمیل این درخواست نامعتبر است.');
    return;
  }
  const subject = subjectContext ? `پاسخ به ${subjectContext} — مجتمع پژوهش` : 'پاسخ از مجتمع پژوهش';
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}`;
  window.open(gmailComposeUrl, '_blank', 'noopener,noreferrer');
}

// این پنل فقط دو نوع درخواست می‌بیند (consultation / scholarship-consulting)
// پس فقط همین دو برچسب لازم است — نسخه‌ی کامل (با lounge/achievement/...)
// در AdminDashboard.jsx است.
const REQUEST_TYPE_LABELS = {
  'scholarship-consulting': 'ارزیابی دوسیه بورسیه',
  consultation: 'مشاوره تحصیلی',
};
function getRequestTypeLabel(type) {
  return REQUEST_TYPE_LABELS[type] || 'درخواست مشاوره';
}

function typeBadgeStyle(backgroundColor, color, extra = {}) {
  return {
    display: 'inline-block',
    fontSize: '12px',
    lineHeight: '1.7',
    fontWeight: '600',
    fontFamily: "'Vazirmatn', sans-serif",
    backgroundColor,
    color,
    padding: '3px 10px',
    borderRadius: '5px',
    marginLeft: '10px',
    whiteSpace: 'nowrap',
    ...extra,
  };
}

// همان تابع getRequestDetailLines از AdminDashboard.jsx، فقط با دو case
// (consultation/scholarship-consulting) که واقعاً برای این پنل رخ می‌دهند.
function getRequestDetailLines(form) {
  const d = form.details || {};
  switch (form.type) {
    case 'consultation':
      return [
        { icon: '🏫', label: 'مقطع/صنف', value: d.gradeLabel || d.grade },
        { icon: '🎯', label: 'هدف تحصیلی', value: d.goalLabel || d.goal },
        { icon: '⚠️', label: 'چالش اصلی', value: d.mainIssueLabel || d.mainIssue },
        { icon: '🕐', label: 'زمان تماس مناسب', value: d.callTimeLabel || d.callTime },
      ];
    case 'scholarship-consulting':
      return [
        { icon: '🎓', label: 'مقطع مورد نظر', value: d.degreeLabel || d.degree },
        { icon: '📄', label: 'بورسیه مورد نظر', value: d.scholarshipTitle || 'مشخص نشده' },
        // === اضافه (رفع باگ گزارش‌شده): فیلد سن فرم ===
        { icon: '🎂', label: 'سن', value: d.age && d.age !== 'نامشخص' ? d.age : null },
      ];
    default:
      return [];
  }
}

// کپی از AdminDashboard.jsx — فقط راهنمای متنی اندازه پیکسل، هیچ state ندارد.
function SizeHint({ text }) {
  if (!text) return null;
  return (
    <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '5px', fontWeight: '500' }}>
      📐 اندازه پیشنهادی: {text}
    </span>
  );
}

const NAV_ITEMS = [
  { key: 'services', icon: '🎓', label: 'خدمات تحصیلی' },
  { key: 'scholarships', icon: '🎓📄', label: 'بورسیه‌های فعال' },
];

export default function ServicesAdminDashboard() {
  const { logout, currentAdminEmail } = useAdminAuth();
  const { setPortalData: setSharedPortalData } = useAdminData();
  const [adminData, setAdminPortalData] = useState(() => getLocalPortalData());

  const [activePage, setActivePage] = useState('services');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  useEffect(() => {
    if (saveToast && saveToast.type === 'success') {
      const timer = setTimeout(() => setSaveToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveToast]);

  // ============================================================
  // بخش «خدمات تحصیلی» — عیناً کپی از AdminDashboard.jsx
  // ============================================================
  const [legacyDeletedSeedServicesFaqIds] = useState(adminData?.deletedSeedServicesFaqIds || []);
  const [legacyServicesFaqList] = useState(adminData?.servicesFaqList || []);
  const [servicesFaqUnified, setServicesFaqUnified] = useState(() => {
    if (Array.isArray(adminData?.servicesFaqUnified)) return adminData.servicesFaqUnified;
    const deletedIds = adminData?.deletedSeedServicesFaqIds || [];
    const seeds = SEED_SERVICES_FAQ.filter((f) => !deletedIds.includes(f.id)).map((f) => ({ id: `seed-${f.id}`, q: f.q, a: f.a, isDefault: true }));
    const extras = (adminData?.servicesFaqList || []).filter((f) => f && f.q).map((f) => ({ id: `extra-${f.id}`, q: f.q, a: f.a, isDefault: false }));
    return [...seeds, ...extras];
  });
  const handleUpdateServicesFaqText = (id, field, value) => {
    setServicesFaqUnified((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };
  const handleRemoveServicesFaqUnified = (id) => {
    setServicesFaqUnified((prev) => prev.filter((f) => f.id !== id));
  };
  const [newServicesFaqQuestion, setNewServicesFaqQuestion] = useState('');
  const [newServicesFaqAnswer, setNewServicesFaqAnswer] = useState('');
  const handleAddServicesFaqUnified = () => {
    if (!newServicesFaqQuestion.trim() || !newServicesFaqAnswer.trim()) return alert('لطفاً هم متن سوال و هم متن پاسخ را وارد کنید.');
    setServicesFaqUnified((prev) => [...prev, { id: `new-${Date.now()}`, q: newServicesFaqQuestion.trim(), a: newServicesFaqAnswer.trim(), isDefault: false }]);
    setNewServicesFaqQuestion('');
    setNewServicesFaqAnswer('');
  };

  const [servicesPlansList, setServicesPlansList] = useState(() => {
    if (Array.isArray(adminData?.servicesPlansList)) return adminData.servicesPlansList;
    return [
      { id: 'seed-plan-1', name: 'پکیج مشاوره تک‌جلسه', desc: 'بررسی وضعیت و ارائه راهکارهای سریع', featured: false },
      { id: 'seed-plan-2', name: 'پکیج مشاوره دوام‌دار ماهانه', desc: 'برنامه‌ریزی کامل درسی همراه با پیگیری هفتگی', featured: true },
    ];
  });
  const handleUpdateServicesPlan = (id, field, value) => {
    setServicesPlansList((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const handleRemoveServicesPlan = (id) => {
    setServicesPlansList((prev) => prev.filter((p) => p.id !== id));
  };
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanFeatured, setNewPlanFeatured] = useState(false);
  const handleAddServicesPlan = () => {
    if (!newPlanName.trim()) return alert('لطفاً نام پکیج را وارد کنید.');
    setServicesPlansList((prev) => [...prev, { id: `new-plan-${Date.now()}`, name: newPlanName.trim(), desc: newPlanDesc.trim(), featured: newPlanFeatured }]);
    setNewPlanName('');
    setNewPlanDesc('');
    setNewPlanFeatured(false);
  };

  const [bgServices, setBgServices] = useState(adminData?.bgServices || '/hero-services.jpg');
  const [servicesPhone, setServicesPhone] = useState(adminData?.servicesPhone || '۰۷۲۸۱۰۱۵۶۴');
  const [servicesTelegram, setServicesTelegram] = useState(adminData?.servicesTelegram || 'https://t.me');
  const [servicesFacebook, setServicesFacebook] = useState(adminData?.servicesFacebook || 'https://facebook.com');
  // === اضافه (رفع باگ گزارش‌شده): لینک اینستاگرام دپارتمان خدمات تحصیلی ===
  const [servicesInstagram, setServicesInstagram] = useState(adminData?.servicesInstagram || 'https://instagram.com');
  const [servicesPhone2, setServicesPhone2] = useState(adminData?.servicesPhone2 || '۰۷۳۳XXXXXX');

  // ============================================================
  // بخش «بورسیه‌های فعال» — عیناً کپی از AdminDashboard.jsx
  // ============================================================
  const [bgScholarships, setBgScholarships] = useState(adminData?.bgScholarships || '/hero-scholarships.jpg');
  const [docsGuideTitle, setDocsGuideTitle] = useState(adminData?.docsGuideTitle || '📚 راهنمای جامع آماده‌سازی مدارک و دوسیه تحصیلی');
  const [docsGuideDesc, setDocsGuideDesc] = useState(adminData?.docsGuideDesc || 'تیم مشاوران پژوهش شما را در نگارش انگیزه‌نامه، توصیه‌نامه و رزومه استاندارد یاری می‌رساند.');
  const [docsGuideCard1Title, setDocsGuideCard1Title] = useState(adminData?.docsGuideCard1Title || '✍️ انگیزه‌نامه تخصصی');
  const [docsGuideCard1Desc, setDocsGuideCard1Desc] = useState(adminData?.docsGuideCard1Desc || 'تبیین اهداف آکادمیک و متقاعدسازی کمیته بورسیه بر اساس استانداردهای بین‌المللی.');
  const [docsGuideCard2Title, setDocsGuideCard2Title] = useState(adminData?.docsGuideCard2Title || '📄 رزومه (CV) آکادمیک');
  const [docsGuideCard2Desc, setDocsGuideCard2Desc] = useState(adminData?.docsGuideCard2Desc || 'ساختاربندی تجارب، مقالات و مهارت‌ها با فرمت‌های بین‌المللی.');
  const [scholarshipsList, setScholarshipsList] = useState(adminData?.scholarshipsList || []);

  const [newTitle, setNewTitle] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newDegree, setNewDegree] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newFunding, setNewFunding] = useState('full');
  const [newLang, setNewLang] = useState('انگلیسی');
  const [newRequireLang, setNewRequireLang] = useState('نیازمند مدرک زبان');
  // === اضافه (رفع باگ گزارش‌شده): محدودیت سنی هر بورسیه (نگاه کنید به AdminDashboard.jsx) ===
  const [newAgeLimit, setNewAgeLimit] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDocs, setNewDocs] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [editingScholarshipId, setEditingScholarshipId] = useState(null);
  const [deletedScholarshipIds, setDeletedScholarshipIds] = useState([]);

  const [countryQuery, setCountryQuery] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const filteredCountries = (countryQuery.trim()
    ? COUNTRIES.filter((c) => {
        const q = countryQuery.trim().toLowerCase();
        return (
          c.nameFa.includes(countryQuery.trim()) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q)
        );
      })
    : COUNTRIES
  ).slice(0, 8);

  const selectedCountryLabel = newCountry
    ? (COUNTRIES.find((c) => c.code === newCountry)?.nameFa || newCountry)
    : '';

  const handleAddScholarship = () => {
    if (!newCountry || !newDegree) return alert('لطفاً مشخصات بورسیه (کشور و مقطع) را کامل وارد کنید.');

    const itemData = {
      country: newCountry,
      degree: newDegree,
      deadline: newDeadline || 'نامشخص',
      status: newStatus,
      title: newTitle || `بورسیه دولتی کشور ${getCountryLabel(newCountry)}`,
      provider: newProvider || 'نامشخص',
      funding: newFunding,
      lang: newLang,
      requireLang: newRequireLang,
      ageLimit: newAgeLimit || 'بدون محدودیت سنی اعلام‌شده',
      sourceUrl: '#',
      lastCheck: '۱۴۰۵/۰۶/۰۱',
      desc: newDesc || 'پوشش کامل هزینه‌های تحصیلی متناسب با شرایط اعلامی.',
      docs: newDocs || 'اسناد تحصیلی استاندارد، ریز نمرات و اسناد تذکره/پاسپورت.',
      image_url: newImageUrl || ''
    };

    if (editingScholarshipId) {
      setScholarshipsList(
        scholarshipsList.map((item) => (item.id === editingScholarshipId ? { ...item, ...itemData } : item))
      );
    } else {
      setScholarshipsList([...scholarshipsList, { id: Date.now(), created_at: new Date().toISOString(), ...itemData }]);
    }

    resetScholarshipForm();
  };

  const handleEditScholarship = (sch) => {
    setEditingScholarshipId(sch.id);
    setNewCountry(sch.country || '');
    setCountryQuery('');
    setNewDegree(sch.degree || '');
    setNewDeadline(sch.deadline || '');
    setNewStatus(sch.status || 'active');
    setNewTitle(sch.title || '');
    setNewProvider(sch.provider || '');
    setNewFunding(sch.funding || 'full');
    setNewLang(sch.lang || 'انگلیسی');
    setNewRequireLang(sch.requireLang || 'نیازمند مدرک زبان');
    setNewAgeLimit(sch.ageLimit || '');
    setNewDesc(sch.desc || '');
    setNewDocs(sch.docs || '');
    setNewImageUrl(sch.image_url || '');
  };

  const resetScholarshipForm = () => {
    setEditingScholarshipId(null);
    setNewCountry(''); setCountryQuery(''); setNewDegree(''); setNewDeadline('');
    setNewTitle(''); setNewProvider(''); setNewDesc(''); setNewDocs(''); setNewImageUrl('');
    setNewFunding('full'); setNewLang('انگلیسی'); setNewRequireLang('نیازمند مدرک زبان'); setNewAgeLimit(''); setNewStatus('active');
  };

  const handleRemoveScholarship = (id) => {
    setScholarshipsList(scholarshipsList.filter(item => item.id !== id));
    setDeletedScholarshipIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (editingScholarshipId === id) resetScholarshipForm();
  };

  // ============================================================
  // درخواست‌های معلق این دپارتمان (consultation + scholarship-consulting)
  // === فاز ۳ دور سوم دیباگ: نمایش دوگانه ===
  // این پنل و پنل ارشد (AdminDashboard.jsx) هردو مستقیماً از جدول
  // portal_requests می‌خوانند و هردو همین دو نوع درخواست را می‌بینند.
  // تایید/حذف از هرکدام، بلافاصله در دیتابیس واقعی اعمال می‌شود؛ پنل دیگر
  // با بارگذاری/رفرش بعدی متوجه می‌شود (هماهنگی زنده بین دو تب پیاده‌سازی
  // نشده — دقیقاً همان محدودیتی که در پنل ارشد هم از قبل وجود داشت).
  // ============================================================
  const [pendingForms, setPendingItems] = useState([]);
  const [requestsError, setRequestsError] = useState('');
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const loadPendingRequests = async () => {
    setIsLoadingRequests(true);
    setRequestsError('');
    try {
      const { data, error } = await supabase
        .from('portal_requests')
        .select('*')
        .eq('status', 'pending')
        .in('type', ['consultation', 'scholarship-consulting'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingItems(data || []);
    } catch (error) {
      console.error('Error loading requests from Supabase:', error);
      setRequestsError(error.message);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleReview = async (id, status) => {
    try {
      const { error } = await supabase
        .from('portal_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setPendingItems((items) => items.filter((item) => item.id !== id));
      // === اضافه (رفع باگ گزارش‌شده): اگر آرشیو باز است، بلافاصله رفرش شود ===
      if (isArchiveOpen) loadArchivedRequests();
    } catch (error) {
      console.error('Error updating request status in Supabase:', error);
      alert('خطا در به‌روزرسانی وضعیت: ' + error.message);
    }
  };

  // === اضافه (رفع باگ گزارش‌شده): بخش آرشیو، اختصاصی همین دو نوع درخواست ===
  // دقیقاً همان الگوی AdminDashboard.jsx (archivedForms/isArchiveOpen)، با
  // این تفاوت که کوئری فقط type های 'consultation' و 'scholarship-consulting'
  // را می‌خواند — یعنی آرشیو این پنل فقط شامل همین دو صفحه (خدمات تحصیلی و
  // بورسیه‌های فعال) است، نه ثبت‌نام سالن/دستاورد/همکاری که اصلاً به این
  // دپارتمان محدود مربوط نمی‌شوند.
  const [archivedForms, setArchivedForms] = useState([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  const loadArchivedRequests = async () => {
    setIsLoadingArchive(true);
    setArchiveError('');
    try {
      const { data, error } = await supabase
        .from('portal_requests')
        .select('*')
        .in('status', ['approved', 'rejected'])
        .in('type', ['consultation', 'scholarship-consulting'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setArchivedForms(data || []);
    } catch (error) {
      console.error('Error loading archived requests from Supabase:', error);
      setArchiveError(error.message);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const handleToggleArchive = () => {
    const opening = !isArchiveOpen;
    setIsArchiveOpen(opening);
    if (opening) loadArchivedRequests();
  };

  // در AdminDashboard.jsx، handleApproveRequest یک شاخه‌ی اضافه برای
  // type === 'achievement_submission' دارد (پرکردن فرم افزودن دستاورد).
  // این پنل هرگز چنین درخواستی نمی‌بیند (فقط consultation/scholarship-
  // consulting)، پس همان شاخه‌ی ساده (else) کافی است.
  const handleApproveRequest = (form) => handleReview(form.id, 'approved');

  const servicesPendingForms = pendingForms;

  useEffect(() => {
    loadPendingRequests();

    fetchPortalData((freshData) => {
      setAdminPortalData(freshData);
      if (freshData) {
        if (freshData.bgServices) setBgServices(freshData.bgServices);
        if (freshData.servicesPhone) setServicesPhone(freshData.servicesPhone);
        if (freshData.servicesTelegram) setServicesTelegram(freshData.servicesTelegram);
        if (freshData.servicesFacebook) setServicesFacebook(freshData.servicesFacebook);
        if (freshData.servicesInstagram) setServicesInstagram(freshData.servicesInstagram);
        if (freshData.servicesPhone2) setServicesPhone2(freshData.servicesPhone2);
        if (freshData.servicesFaqUnified) setServicesFaqUnified(freshData.servicesFaqUnified);
        if (freshData.servicesPlansList) setServicesPlansList(freshData.servicesPlansList);
        if (freshData.bgScholarships) setBgScholarships(freshData.bgScholarships);
        if (freshData.scholarshipsList) setScholarshipsList(freshData.scholarshipsList);
        if (freshData.docsGuideTitle) setDocsGuideTitle(freshData.docsGuideTitle);
        if (freshData.docsGuideDesc) setDocsGuideDesc(freshData.docsGuideDesc);
        if (freshData.docsGuideCard1Title) setDocsGuideCard1Title(freshData.docsGuideCard1Title);
        if (freshData.docsGuideCard1Desc) setDocsGuideCard1Desc(freshData.docsGuideCard1Desc);
        if (freshData.docsGuideCard2Title) setDocsGuideCard2Title(freshData.docsGuideCard2Title);
        if (freshData.docsGuideCard2Desc) setDocsGuideCard2Desc(freshData.docsGuideCard2Desc);
      }
    });
  }, []);

  // === تابع ذخیره محدود — فقط کلیدهای این دپارتمان ===
  // برخلاف AdminDashboard.jsx (که ~۶۰ کلید می‌فرستد)، این‌جا فقط همان
  // کلیدهایی ارسال می‌شوند که در همین پنل قابل‌ویرایش‌اند. این هم برای
  // وضوح است هم یک لایه‌ی دفاعی: حتی اگر روزی یک باگ باعث شود این
  // کامپوننت state نادرستی برای یک کلید خارج از حوزه‌اش داشته باشد، آن
  // کلید اصلاً در updates وجود ندارد، پس هرگز نوشته نمی‌شود.
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveToast(null);
    try {
      const updates = [
        { key: 'bgServices', value: bgServices },
        { key: 'servicesPhone', value: servicesPhone },
        { key: 'servicesTelegram', value: servicesTelegram },
        { key: 'servicesFacebook', value: servicesFacebook },
        { key: 'servicesInstagram', value: servicesInstagram },
        { key: 'servicesPhone2', value: servicesPhone2 },
        { key: 'deletedSeedServicesFaqIds', value: legacyDeletedSeedServicesFaqIds },
        { key: 'servicesFaqList', value: legacyServicesFaqList },
        { key: 'servicesFaqUnified', value: servicesFaqUnified },
        { key: 'servicesPlansList', value: servicesPlansList },
        { key: 'bgScholarships', value: bgScholarships },
        { key: 'docsGuideTitle', value: docsGuideTitle },
        { key: 'docsGuideDesc', value: docsGuideDesc },
        { key: 'docsGuideCard1Title', value: docsGuideCard1Title },
        { key: 'docsGuideCard1Desc', value: docsGuideCard1Desc },
        { key: 'docsGuideCard2Title', value: docsGuideCard2Title },
        { key: 'docsGuideCard2Desc', value: docsGuideCard2Desc },
        { key: 'scholarshipsList', value: scholarshipsList, deletedIds: deletedScholarshipIds },
      ];

      await updatePortalSettings(updates);
      setDeletedScholarshipIds([]);

      const partialSnapshot = {
        bgServices, servicesPhone, servicesTelegram, servicesFacebook, servicesInstagram, servicesPhone2,
        deletedSeedServicesFaqIds: legacyDeletedSeedServicesFaqIds,
        servicesFaqList: legacyServicesFaqList,
        servicesFaqUnified, servicesPlansList,
        bgScholarships,
        docsGuideTitle, docsGuideDesc, docsGuideCard1Title, docsGuideCard1Desc, docsGuideCard2Title, docsGuideCard2Desc,
        scholarshipsList,
      };

      setAdminPortalData((prev) => ({ ...prev, ...partialSnapshot }));
      // setSharedPortalData یک merge است (نگاه کنید به AdminDataContext.jsx:
      // updatePortalData → {...currentData, ...value}) — پس ارسال همین
      // آبجکت جزئی، بقیه‌ی داده‌ی مشترک (سالن/صفحه اصلی/دستاوردها/درباره
      // ما) را در تب باز کاربر پاک نمی‌کند.
      setSharedPortalData(partialSnapshot);

      setSaveToast({
        type: 'success',
        message: '🚀 تنظیمات دپارتمان خدمات تحصیلی و بورسیه‌ها با موفقیت در دیتابیس Supabase ذخیره شدند.',
      });
    } catch (error) {
      setSaveToast({ type: 'error', message: 'خطا در ذخیره ابری: ' + error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: "'Vazirmatn', 'Segoe UI', Tahoma, sans-serif", backgroundColor: '#f4f6f9', height: '100vh', overflow: 'hidden', display: 'flex', margin: 0, padding: 0 }}>
      <style>{`
        @keyframes pj-spin { to { transform: rotate(360deg); } }
        @keyframes pj-toast-in { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {saveToast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            maxWidth: '560px',
            width: 'calc(100% - 32px)',
            backgroundColor: saveToast.type === 'success' ? '#eafaf1' : saveToast.type === 'error' ? '#fdecea' : '#eaf2fb',
            border: `1px solid ${saveToast.type === 'success' ? '#2d6a4f' : saveToast.type === 'error' ? '#dc3545' : '#2b6cb0'}`,
            color: saveToast.type === 'success' ? '#1b4332' : saveToast.type === 'error' ? '#7a1f27' : '#1a3b5c',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: '600',
            lineHeight: '1.8',
            animation: 'pj-toast-in 0.25s ease-out',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">
            {saveToast.type === 'success' ? '✅' : saveToast.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span style={{ flex: 1 }}>{saveToast.message}</span>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            aria-label="بستن پیام"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '17px', color: 'inherit', fontWeight: '800', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* سایدبار — عمداً با رنگ/آیکون متفاوت از پنل ارشد (👑 در برابر 🎓)
          تا هیچ‌وقت این دو پنل با هم اشتباه گرفته نشوند. */}
      <aside style={{ width: window.innerWidth < 768 ? '80px' : '260px', backgroundColor: '#1a3b5c', color: '#fff', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1px solid #2b6cb0' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid #2b6cb0', paddingBottom: '16px', marginBottom: '10px' }}>
          <span style={{ fontSize: '32px' }}>🎓</span>
          <h3 style={{ margin: '8px 0 0 0', fontSize: '15px', fontWeight: '800', display: window.innerWidth < 768 ? 'none' : 'block' }}>پنل دپارتمان خدمات تحصیلی</h3>
          <span style={{ fontSize: '11px', color: '#bcdcf7', fontWeight: '500', display: window.innerWidth < 768 ? 'none' : 'block' }}>مجتمع آموزشی پژوهش</span>
          {currentAdminEmail && (
            <span style={{ fontSize: '10.5px', color: '#8fb8db', fontWeight: '500', display: window.innerWidth < 768 ? 'none' : 'block', marginTop: '4px', wordBreak: 'break-all' }}>{currentAdminEmail}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              style={{
                padding: '12px',
                backgroundColor: activePage === item.key ? '#2b6cb0' : 'transparent',
                color: '#fff',
                border: activePage === item.key ? 'none' : '1px solid transparent',
                borderRadius: '6px',
                fontWeight: activePage === item.key ? '800' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'inherit',
                textAlign: 'right',
                width: '100%',
              }}
            >
              <span>{item.icon}</span> <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>{item.label}</span>
            </button>
          ))}
          <a href="/" style={{ padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontWeight: '500', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span>🌐</span> <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>مشاهده سایت اصلی</span>
          </a>
          <button
            type="button"
            onClick={logout}
            style={{ padding: '12px', color: '#fff', backgroundColor: 'transparent', border: '1px solid #dc3545', borderRadius: '6px', fontWeight: '700', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' }}
          >
            <span>🚪</span> <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>خروج از حساب</span>
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: window.innerWidth < 768 ? '16px' : '32px', overflowY: 'auto', direction: 'ltr' }}>
        <div style={{ direction: 'rtl' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#fff', padding: '16px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
            <h2 style={{ margin: 0, fontSize: window.innerWidth < 768 ? '16px' : '20px', fontWeight: '800', color: '#112a1d' }}>🎓 مدیریت دپارتمان خدمات تحصیلی و بورسیه‌ها</h2>
            <span style={{ fontSize: '13px', backgroundColor: '#eaf2fb', color: '#1a3b5c', padding: '6px 12px', borderRadius: '20px', fontWeight: '700' }}>دسترسی محدود دپارتمانی</span>
          </header>

          <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {activePage === 'services' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🎓 مدیریت اختصاصی دپارتمان خدمات تحصیلی و مشاوره</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* === جدید (بخش ۱۶): درخواست‌های مشاوره ثبت‌شده از فرم همین صفحه === */}
                {/* قبلاً این درخواست‌ها (type: 'consultation') در «تالار بررسی
                    عمومی» پایین صفحه، قاطی با ثبت‌نام سالن/دستاورد/همکاری
                    نمایش داده می‌شدند. چون مستقیماً به همین دپارتمان تعلق
                    دارند، اکنون همین‌جا، مستقل از صف عمومی، مدیریت می‌شوند. */}
                <div style={{ borderBottom: '1px dashed #e9ecef', paddingBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '8px' }}>📥 درخواست‌های مشاوره ثبت‌شده از فرم همین صفحه</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {isLoadingRequests && <p style={{ textAlign: 'center', fontSize: '12.5px' }}>در حال دریافت درخواست‌ها…</p>}
                    {servicesPendingForms.map((form) => {
                      const contactIsEmail = isEmailContact(form.phone);
                      // === اضافه (بخش ۱۷): شماره تماس مستقیماً لینک واتساپ ===
                      // علاوه بر دکمه‌ی سبز «باز کردن واتساپ»، خودِ شماره
                      // نمایش داده‌شده هم یک لینک مستقیم wa.me است تا ادمین
                      // بتواند مستقیم با کلیک روی شماره به واتساپ کاربر برود.
                      const whatsappHref = !contactIsEmail ? `https://wa.me/${formatWhatsappNumber(form.phone)}` : null;
                      const detailLines = getRequestDetailLines(form).filter((line) => line.value);
                      return (
                        <div key={form.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', gap: '12px' }}>
                          <div style={{ textAlign: 'right', minWidth: '220px', flex: 1 }}>
                            <div style={{ marginBottom: '6px' }}>
                              <span style={typeBadgeStyle('#eaf2fb', '#1a3b5c')}>{getRequestTypeLabel(form.type)}</span>
                            </div>
                            <strong style={{ fontSize: '14px', color: '#112a1d' }}>
                              {form.name}{' '}
                              <span style={{ fontWeight: '500', color: '#555' }}>
                                ({contactIsEmail ? '📧' : '📞'}{' '}
                                {whatsappHref ? (
                                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{ color: '#128C7E', textDecoration: 'underline' }}>
                                    <bdi dir="ltr">{form.phone}</bdi>
                                  </a>
                                ) : (
                                  <bdi dir="ltr">{form.phone}</bdi>
                                )})
                              </span>
                            </strong>
                            {/* === اضافه (بخش ۱۸): نمایش کامل و خوانای جزئیات فرم === */}
                            {/* دیگر فقط summary خام (که گاهی کد انگلیسی فرم بود، نه
                                برچسب فارسی) نشان داده نمی‌شود؛ همه‌ی فیلدهای واقعی
                                فرم با برچسب کامل فارسی، دقیقاً مثل پنل بورسیه‌ها. */}
                            {detailLines.length > 0 && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {detailLines.map((line) => (
                                  <span key={line.label} style={{ fontSize: '12px', color: '#333', lineHeight: '1.7' }}>
                                    {line.icon} {line.label}: <strong style={{ fontWeight: '700' }}>{line.value}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {contactIsEmail ? (
                              <button type="button" onClick={() => openEmailContact(form.phone, form.summary)} style={{ padding: '6px 14px', backgroundColor: '#c53030', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>📧 ارسال ایمیل</button>
                            ) : (
                              <button type="button" onClick={() => openWhatsapp(form.phone)} style={{ padding: '6px 14px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>💬 باز کردن واتساپ</button>
                            )}
                            <button type="button" onClick={() => handleApproveRequest(form)} style={{ padding: '6px 14px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>✔️ تایید و آرشیو</button>
                            <button type="button" onClick={() => handleReview(form.id, 'rejected')} style={{ padding: '6px 14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>حذف درخواست</button>
                          </div>
                        </div>
                      );
                    })}
                    {servicesPendingForms.length === 0 && !isLoadingRequests && (
                      <p style={{ fontSize: '12.5px', color: '#2d6a4f', textAlign: 'center', margin: '6px 0', fontWeight: '700' }}>✨ هیچ درخواست معلقی برای این دپارتمان وجود ندارد.</p>
                    )}
                  </div>
                  {/* === اضافه (رفع باگ گزارش‌شده): دکمه‌ی آرشیو، مخصوص همین دپارتمان === */}
                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={handleToggleArchive}
                      style={{ padding: '6px 14px', backgroundColor: isArchiveOpen ? '#495057' : '#f1f3f5', color: isArchiveOpen ? '#fff' : '#495057', border: '1px solid #ced4da', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                    >
                      📂 {isArchiveOpen ? 'بستن آرشیو' : 'مشاهده آرشیو درخواست‌های بررسی‌شده این دپارتمان'}
                    </button>
                  </div>
                  {isArchiveOpen && (
                    <div style={{ marginTop: '14px', backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                      <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0', fontWeight: '500' }}>
                        فقط درخواست‌های «مشاوره تحصیلی» و «ارزیابی دوسیه بورسیه» که تایید یا حذف شده‌اند — آخرین ۱۰۰ مورد.
                      </p>
                      {isLoadingArchive && <p style={{ textAlign: 'center' }}>در حال دریافت آرشیو…</p>}
                      {archiveError && <p style={{ color: '#dc3545', textAlign: 'center' }}>{archiveError}</p>}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {archivedForms.map((form) => {
                          const contactIsEmail = isEmailContact(form.phone);
                          const isApproved = form.status === 'approved';
                          const submittedDate = form.created_at ? new Date(form.created_at).toLocaleDateString('fa-IR') : '';
                          const detailLines = getRequestDetailLines(form).filter((line) => line.value);
                          return (
                            <div key={form.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e9ecef', gap: '10px', opacity: 0.85 }}>
                              <div style={{ textAlign: 'right', flex: 1, minWidth: '220px' }}>
                                <div style={{ marginBottom: '6px' }}>
                                  <span style={typeBadgeStyle('#eaf2fb', '#1a3b5c')}>{getRequestTypeLabel(form.type)}</span>
                                  <span style={typeBadgeStyle(isApproved ? '#eafaf1' : '#fdecea', isApproved ? '#1b4332' : '#7a1f27')}>
                                    {isApproved ? '✔️ تاییدشده' : '🗑 حذف‌شده'}
                                  </span>
                                </div>
                                <strong style={{ fontSize: '13.5px', color: '#112a1d' }}>
                                  {form.name}
                                  {form.phone && (
                                    <span style={{ fontWeight: '500', color: '#555' }}>
                                      {' '}
                                      ({contactIsEmail ? '📧' : '📞'} <bdi dir="ltr">{form.phone}</bdi>)
                                    </span>
                                  )}
                                </strong>
                                {submittedDate && <span style={{ fontSize: '11.5px', color: '#999', marginRight: '8px' }}>— {submittedDate}</span>}
                                {detailLines.length > 0 ? (
                                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {detailLines.map((line) => (
                                      <span key={line.label} style={{ fontSize: '11.5px', color: '#333', lineHeight: '1.7' }}>
                                        {line.icon} {line.label}: <strong style={{ fontWeight: '700' }}>{line.value}</strong>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '12px', color: '#555', margin: '4px 0 0 0', fontWeight: '500' }}>{form.summary}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {archivedForms.length === 0 && !isLoadingArchive && (
                          <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', margin: '10px 0' }}>هنوز هیچ درخواستی آرشیو نشده است.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>تصویر پس‌زمینه هدر خدمات تحصیلی:</label>
                    <ImageUploader currentUrl={bgServices} onUploadComplete={(url) => setBgServices(url)} label="پس‌زمینه خدمات تحصیلی" />
                    <SizeHint text="حداقل ۱۹۲۰×۸۰۰، افقی عریض" />
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>📞 شماره تلفن مستقیم نوبت‌دهی مشاوره تحصیلی:</label>
                    <input type="text" value={servicesPhone} onChange={(e) => setServicesPhone(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک تلگرام اختصاصی دپارتمان مشاوره:</label>
                    <input type="text" value={servicesTelegram} onChange={(e) => setServicesTelegram(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک فیسبوک اختصاصی دپارتمان مشاوره:</label>
                    <input type="text" value={servicesFacebook} onChange={(e) => setServicesFacebook(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                  {/* === اضافه (رفع باگ گزارش‌شده): لینک اینستاگرام دپارتمان مشاوره === */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>لینک اینستاگرام اختصاصی دپارتمان مشاوره:</label>
                    <input type="text" value={servicesInstagram} onChange={(e) => setServicesInstagram(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>📞 تلفن پشتیبانی دوسیه‌سازی و انگیزه‌نامه بورسیه (مرکز ۲):</label>
                  <input type="text" value={servicesPhone2} onChange={(e) => setServicesPhone2(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', direction: 'ltr' }} />
                </div>

                {/* === جدید (بخش ۱۵): مدیریت یکپارچه پلن‌ها/پکیج‌های تعرفه === */}
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '4px' }}>💳 مدیریت یکپارچه پلن‌ها و تعرفه‌های مشاوره</span>
                  <p style={{ fontSize: '11.5px', color: '#666', margin: '0 0 12px 0' }}>
                    همه‌ی پکیج‌ها — چه از قبل روی سایت بوده‌اند چه تازه اضافه کرده‌اید — همین‌جا و همگی به یک شکل قابل‌ویرایش مستقیم (نام، توضیح، برجسته‌بودن) و حذف‌شدنی‌اند. تیک «برجسته» یعنی همان پکیجی که با حاشیه‌ی پررنگ سبز روی سایت متمایز نمایش داده می‌شود.
                  </p>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #ced4da', marginBottom: '12px' }}>
                    {servicesPlansList.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>هیچ پکیجی ثبت نشده است.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {servicesPlansList.map((p) => (
                          <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => handleUpdateServicesPlan(p.id, 'name', e.target.value)}
                              placeholder="نام پکیج"
                              style={{ flex: '1 1 200px', minWidth: '160px', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: '700' }}
                            />
                            <input
                              type="text"
                              value={p.desc}
                              onChange={(e) => handleUpdateServicesPlan(p.id, 'desc', e.target.value)}
                              placeholder="توضیح کوتاه پکیج"
                              style={{ flex: '2 1 240px', minWidth: '200px', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: '700', color: '#1b4332', flexShrink: 0, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={Boolean(p.featured)}
                                onChange={(e) => handleUpdateServicesPlan(p.id, 'featured', e.target.checked)}
                              />
                              ⭐ برجسته
                            </label>
                            <button type="button" onClick={() => handleRemoveServicesPlan(p.id)} style={{ flexShrink: 0, padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ backgroundColor: '#f4fbf7', padding: '14px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '8px' }}>➕ افزودن پکیج جدید نامحدود</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="text" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="نام پکیج (مثلاً: پکیج فشرده کانکور)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      <input type="text" value={newPlanDesc} onChange={(e) => setNewPlanDesc(e.target.value)} placeholder="توضیح کوتاه پکیج" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#1b4332', cursor: 'pointer' }}>
                        <input type="checkbox" checked={newPlanFeatured} onChange={(e) => setNewPlanFeatured(e.target.checked)} />
                        ⭐ این پکیج برجسته نمایش داده شود
                      </label>
                      <button type="button" onClick={handleAddServicesPlan} style={{ padding: '10px 18px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>افزودن پکیج</button>
                    </div>
                  </div>
                </div>

                {/* === اصلاح (بخش ۱۶): مدیریت یکپارچه و کاملاً قابل‌ویرایش سوالات پرتکرار خدمات تحصیلی === */}
                <div style={{ borderTop: '1px dashed #e9ecef', paddingTop: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d6a4f', display: 'block', marginBottom: '4px' }}>❓ مدیریت یکپارچه سوالات پرتکرار خدمات تحصیلی</span>
                  <p style={{ fontSize: '11.5px', color: '#666', margin: '0 0 12px 0' }}>
                    همه‌ی سوالات — چه از قبل روی سایت بوده‌اند چه تازه اضافه کرده‌اید — همین‌جا و همگی به یک شکل قابل‌ویرایش مستقیم متن سوال و پاسخ‌اند. سوال‌های جدید دقیقاً در ادامه‌ی همین لیست (به همان ترتیب زیر) اضافه می‌شوند، نه در بخشی جدا.
                  </p>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '14px', borderRadius: '8px', border: '1px solid #ced4da', marginBottom: '12px' }}>
                    {servicesFaqUnified.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>هیچ سوالی ثبت نشده است.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {servicesFaqUnified.map((f, idx) => (
                          <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#fff', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: f.isDefault ? '#7a5c00' : '#1a5276' }}>
                                {idx + 1}. {f.isDefault ? '📌 پیش‌فرض سایت' : '✍️ افزوده‌ی ادمین'}
                              </span>
                              <button type="button" onClick={() => handleRemoveServicesFaqUnified(f.id)} style={{ flexShrink: 0, padding: '5px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف</button>
                            </div>
                            <input
                              type="text"
                              value={f.q}
                              onChange={(e) => handleUpdateServicesFaqText(f.id, 'q', e.target.value)}
                              placeholder="متن سوال"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: '700' }}
                            />
                            <textarea
                              value={f.a}
                              onChange={(e) => handleUpdateServicesFaqText(f.id, 'a', e.target.value)}
                              placeholder="متن پاسخ"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '12.5px', height: '50px', resize: 'vertical' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#f4fbf7', padding: '14px', borderRadius: '8px', border: '1px solid #b7e4c7' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1b4332', display: 'block', marginBottom: '8px' }}>➕ افزودن سوال و پاسخ جدید نامحدود</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="text" value={newServicesFaqQuestion} onChange={(e) => setNewServicesFaqQuestion(e.target.value)} placeholder="متن سوال" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      <textarea value={newServicesFaqAnswer} onChange={(e) => setNewServicesFaqAnswer(e.target.value)} placeholder="متن پاسخ" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit', height: '55px', resize: 'vertical' }} />
                      <button type="button" onClick={handleAddServicesFaqUnified} style={{ padding: '10px 18px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>افزودن سوال</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
            {activePage === 'scholarships' && (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#2d6a4f', borderBottom: '2px solid #f4f6f9', paddingBottom: '8px', fontWeight: '800', fontSize: '15px' }}>🌍 دایرکتوری داینامیک اعلام و حذف لایو بورسیه‌های سایت</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '700', fontSize: '13px' }}>تصویر پس‌زمینه هدر دپارتمان بورسیه‌ها:</label>
                  <ImageUploader currentUrl={bgScholarships} onUploadComplete={(url) => setBgScholarships(url)} label="پس‌زمینه بورسیه‌ها" />
                  <SizeHint text="حداقل ۱۹۲۰×۸۰۰، افقی عریض" />
                </div>

                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', border: editingScholarshipId ? '2px solid #f0ad4e' : '1px solid #ced4da' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: editingScholarshipId ? '#8a5a00' : '#2d6a4f', display: 'block', marginBottom: '12px' }}>
                    {editingScholarshipId ? '✏️ در حال ویرایش بورسیه — پس از تغییر، «ذخیره تغییرات» را بزنید:' : '➕ فرم ثبت و انتشار فوری بورسیه جدید روی پورتال:'}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 2, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>عنوان کامل بورسیه:</label>
                        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="مثلاً: بورسیه دولتی برتر روسیه" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>مرجع اعطا کننده:</label>
                        <input type="text" value={newProvider} onChange={(e) => setNewProvider(e.target.value)} placeholder="مثلاً: وزارت علوم روسیه" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>کشور مقصد بورسیه:</label>
                        <input
                          type="text"
                          value={isCountryDropdownOpen ? countryQuery : selectedCountryLabel}
                          onChange={(e) => { setCountryQuery(e.target.value); setNewCountry(''); setIsCountryDropdownOpen(true); }}
                          onFocus={() => { setCountryQuery(''); setIsCountryDropdownOpen(true); }}
                          onBlur={() => setTimeout(() => setIsCountryDropdownOpen(false), 150)}
                          placeholder="جست‌وجوی نام کشور (فارسی یا انگلیسی)..."
                          autoComplete="off"
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                        {isCountryDropdownOpen && (
                          <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, backgroundColor: '#fff', border: '1px solid #ced4da', borderRadius: '6px', marginTop: '4px', maxHeight: '220px', overflowY: 'auto', zIndex: 50, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                            {filteredCountries.length === 0 ? (
                              <div style={{ padding: '10px', fontSize: '12.5px', color: '#888' }}>کشوری یافت نشد</div>
                            ) : (
                              filteredCountries.map((c) => (
                                <div
                                  key={c.code}
                                  onMouseDown={() => { setNewCountry(c.code); setCountryQuery(''); setIsCountryDropdownOpen(false); }}
                                  style={{ padding: '9px 12px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                  <span>{getFlagEmoji(c.code)}</span>
                                  <span>{c.nameFa}</span>
                                  <span style={{ color: '#999', fontSize: '11px' }}>({c.nameEn})</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>مقطع و رشته تحصیلی:</label>
                        <input type="text" value={newDegree} onChange={(e) => setNewDegree(e.target.value)} placeholder="مثلاً: ماستری و دکترا" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>آخرین مهلت ثبت‌نام / ددلاین:</label>
                        <input type="text" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} placeholder="مثلاً: ۱۵ حوت ۱۴۰۵" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>نوع پوشش مالی:</label>
                        <select value={newFunding} onChange={(e) => setNewFunding(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', backgroundColor: '#fff' }}>
                          <option value="full">full (فول فاند)</option>
                          <option value="partial">partial (پارشال)</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>زبان تدریس:</label>
                        <input type="text" value={newLang} onChange={(e) => setNewLang(e.target.value)} placeholder="مثلاً: انگلیسی / چینی" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>شرایط مدرک زبان:</label>
                        <input type="text" value={newRequireLang} onChange={(e) => setNewRequireLang(e.target.value)} placeholder="بدون نیاز اولیه به مدرک" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      {/* === اضافه (رفع باگ گزارش‌شده): محدودیت سنی === */}
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>🎂 محدودیت سنی:</label>
                        <input type="text" value={newAgeLimit} onChange={(e) => setNewAgeLimit(e.target.value)} placeholder="مثلاً: زیر ۳۵ سال / بدون محدودیت" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>تب وضعیت نمایش:</label>
                        <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', backgroundColor: '#fff' }}>
                          <option value="active">فرصت فعال 🔥</option>
                          <option value="soon">به‌زودی ⏳</option>
                          <option value="archived">آرشیو شده 📦</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>✨ توضیحات مزایا و پوشش (داخل پاپ‌آپ):</label>
                      <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="پوشش ۱۰۰٪ شهریه، لیلیه مجهز..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box', height: '55px', resize: 'vertical' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>📁 اسناد و مدارک مورد نیاز (داخل پاپ‌آپ):</label>
                      <input type="text" value={newDocs} onChange={(e) => setNewDocs(e.target.value)} placeholder="دیپلوم مکتب، ریز نمرات ۳ ساله..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '700' }}>🖼️ عکس کارت بورسیه (پرچم/نمای دانشگاه مقصد):</label>
                      <ImageUploader currentUrl={newImageUrl} onUploadComplete={(url) => setNewImageUrl(url)} label="عکس بورسیه" />
                      <SizeHint text="حداقل ۱۰۰۰×۵۰۰، افقی عریض" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={handleAddScholarship} style={{ flex: 1, padding: '11px 20px', backgroundColor: editingScholarshipId ? '#f0ad4e' : '#2d6a4f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', marginTop: '4px' }}>
                        {editingScholarshipId ? '💾 ذخیره تغییرات بورسیه' : '➕ درج لایو بورسیه در لیست'}
                      </button>
                      {editingScholarshipId && (
                        <button type="button" onClick={resetScholarshipForm} style={{ padding: '11px 18px', backgroundColor: '#e9ecef', color: '#495057', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', marginTop: '4px' }}>
                          لغو ویرایش
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#112a1d', display: 'block', marginBottom: '8px' }}>📋 لیست بورسیه‌های زنده روی سایت (ویرایش یا حذف آنی):</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {scholarshipsList.map((sch) => (
                      <div key={sch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: sch.id === editingScholarshipId ? '#fff8e6' : '#fff', border: sch.id === editingScholarshipId ? '1px solid #f0ad4e' : '1px solid #e9ecef', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          {sch.image_url ? (
                            <img src={sch.image_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <span title="این بورسیه هنوز عکس ندارد" style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#fff3cd', color: '#856404', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🖼️</span>
                          )}
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#112a1d' }}>🎓 بورسیه {getCountryLabel(sch.country)} ({sch.degree}) — ددلاین ثبت نام: {sch.deadline}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button type="button" onClick={() => handleEditScholarship(sch)} style={{ padding: '6px 14px', backgroundColor: '#f0ad4e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>ویرایش</button>
                          <button type="button" onClick={() => handleRemoveScholarship(sch.id)} style={{ padding: '6px 14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit' }}>حذف فوری از سایت</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* === جدید: بخش «راهنمای جامع آماده‌سازی مدارک» همین صفحه === */}
                <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed #ced4da' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#112a1d', display: 'block', marginBottom: '10px' }}>📚 بخش «راهنمای آماده‌سازی مدارک» (پایین همین صفحه):</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', fontSize: '12.5px' }}>عنوان کلی بخش:</label>
                      <input type="text" value={docsGuideTitle} onChange={(e) => setDocsGuideTitle(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', fontSize: '12.5px' }}>توضیح زیر عنوان:</label>
                      <textarea value={docsGuideDesc} onChange={(e) => setDocsGuideDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', fontSize: '12.5px' }}>کارت اول - عنوان:</label>
                        <input type="text" value={docsGuideCard1Title} onChange={(e) => setDocsGuideCard1Title(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }} />
                        <textarea value={docsGuideCard1Desc} onChange={(e) => setDocsGuideCard1Desc(e.target.value)} rows={2} placeholder="توضیح کارت اول" style={{ width: '100%', marginTop: '6px', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '700', fontSize: '12.5px' }}>کارت دوم - عنوان:</label>
                        <input type="text" value={docsGuideCard2Title} onChange={(e) => setDocsGuideCard2Title(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }} />
                        <textarea value={docsGuideCard2Desc} onChange={(e) => setDocsGuideCard2Desc(e.target.value)} rows={2} placeholder="توضیح کارت دوم" style={{ width: '100%', marginTop: '6px', padding: '9px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* دکمه اصلی ذخیره تغییرات این دپارتمان */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '14px 28px',
                  backgroundColor: isSaving ? '#6c9ac2' : '#1a3b5c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '15px',
                  cursor: isSaving ? 'wait' : 'pointer',
                  fontWeight: '700',
                  boxShadow: isSaving ? '0 2px 8px rgba(26,59,92,0.15)' : '0 4px 12px rgba(26,59,92,0.2)',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {isSaving ? (
                  <>
                    <span
                      aria-hidden="true"
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2.5px solid rgba(255,255,255,0.45)',
                        borderTopColor: '#fff',
                        display: 'inline-block',
                        animation: 'pj-spin 0.7s linear infinite',
                      }}
                    />
                    در حال ذخیره روی سرور… لطفاً صبر کنید
                  </>
                ) : (
                  <>💾 ذخیره آنی و اعمال لایو تغییرات دپارتمان</>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
