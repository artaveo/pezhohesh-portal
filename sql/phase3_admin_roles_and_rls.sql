-- ============================================================================
-- فاز ۳ دور سوم دیباگ — نقش‌های ادمین + اجرای واقعی محدودیت در سطح دیتابیس
-- ============================================================================
-- این اسکریپت را در Supabase → SQL Editor اجرا کنید (نه از طریق فایل کد).
-- قبل از اجرا در پروژه‌ی زنده، پیشنهاد می‌شود یک‌بار در یک پروژه‌ی تست/staging
-- امتحان کنید، چون Policyهای RLS فعلی شما دقیقاً از این‌جا قابل مشاهده نیست
-- و ممکن است نام‌گذاری Policyهای موجودتان با DROP POLICY زیر یکی نباشد —
-- در آن صورت، ابتدا این کوئری را بزنید تا نام‌های واقعی را ببینید:
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'portal_settings';
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'portal_scholarships';
--   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'portal_requests';
-- و بخش‌های DROP POLICY IF EXISTS را با نام‌های واقعی خودتان جایگزین کنید.

-- ----------------------------------------------------------------------------
-- ۱. افزودن ستون role به admin_users
-- ----------------------------------------------------------------------------
alter table public.admin_users
  add column if not exists role text not null default 'super_admin';

alter table public.admin_users
  drop constraint if exists admin_users_role_check;

alter table public.admin_users
  add constraint admin_users_role_check check (role in ('super_admin', 'services_admin'));

-- هر ادمین موجود که قبل از این تغییر ثبت شده، به‌صورت خودکار 'super_admin'
-- می‌ماند (چون default همین است) — هیچ ادمین فعلی دسترسی‌اش را از دست نمی‌دهد.

-- برای اضافه‌کردن اولین ادمین دپارتمانی، بعد از اینکه حساب Auth او را از
-- طریق Supabase Dashboard → Authentication ساختید، این را اجرا کنید
-- (user_id را از همان‌جا کپی کنید):
--
-- insert into public.admin_users (user_id, role) values ('<UUID-حساب-جدید>', 'services_admin');


-- ----------------------------------------------------------------------------
-- ۲. تابع کمکی: نقش کاربر جاری چیست؟
-- ----------------------------------------------------------------------------
create or replace function public.current_admin_role()
returns text
language sql
security definer
stable
as $$
  select role from public.admin_users where user_id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- ۳. تابع کمکی: آیا این کلید portal_settings برای services_admin مجاز است؟
-- ----------------------------------------------------------------------------
-- دقیقاً همان کلیدهایی که ServicesAdminDashboard.jsx می‌فرستد (بخش «خدمات
-- تحصیلی» + «بورسیه‌های فعال»). اگر بعداً فیلد جدیدی به آن پنل اضافه شد،
-- کلیدش را هم اینجا اضافه کنید — وگرنه ذخیره‌اش برای services_admin با
-- خطای دسترسی رد خواهد شد (fail-closed، نه fail-open).
create or replace function public.is_key_allowed_for_services_admin(key_name text)
returns boolean
language sql
immutable
as $$
  select key_name in (
    'bgServices', 'servicesPhone', 'servicesTelegram', 'servicesFacebook', 'servicesPhone2',
    'deletedSeedServicesFaqIds', 'servicesFaqList', 'servicesFaqUnified', 'servicesPlansList',
    'bgScholarships', 'docsGuideTitle', 'docsGuideDesc',
    'docsGuideCard1Title', 'docsGuideCard1Desc', 'docsGuideCard2Title', 'docsGuideCard2Desc'
  );
$$;

-- ----------------------------------------------------------------------------
-- ۴. Policy جدید UPDATE/INSERT روی portal_settings
-- ----------------------------------------------------------------------------
-- نام Policy فرضی زیر را با نام Policy واقعی نوشتن فعلی‌تان جایگزین کنید
-- (نتیجه‌ی کوئری بخش بالای فایل).
drop policy if exists "admin_write_portal_settings" on public.portal_settings;

create policy "admin_write_portal_settings"
on public.portal_settings
for all
to authenticated
using (
  public.current_admin_role() = 'super_admin'
  or (public.current_admin_role() = 'services_admin' and public.is_key_allowed_for_services_admin(key))
)
with check (
  public.current_admin_role() = 'super_admin'
  or (public.current_admin_role() = 'services_admin' and public.is_key_allowed_for_services_admin(key))
);

-- SELECT روی portal_settings باید برای همه (حتی anon) باز بماند — سایت
-- عمومی از همین جدول محتوایش را می‌خواند. اگر از قبل چنین Policyای دارید
-- دست نزنید؛ اگر نه، این را اضافه کنید:
drop policy if exists "public_read_portal_settings" on public.portal_settings;
create policy "public_read_portal_settings"
on public.portal_settings
for select
to anon, authenticated
using (true);


-- ----------------------------------------------------------------------------
-- ۵. Policy روی portal_scholarships — هر دو نقش دسترسی کامل دارند
-- ----------------------------------------------------------------------------
-- طبق تصمیم صریح کاربر، بورسیه‌ها زیرمجموعه‌ی دپارتمان خدمات تحصیلی‌اند؛
-- پس services_admin هم باید بتواند insert/update/delete کند، نه فقط super_admin.
drop policy if exists "admin_write_portal_scholarships" on public.portal_scholarships;
create policy "admin_write_portal_scholarships"
on public.portal_scholarships
for all
to authenticated
using (public.current_admin_role() in ('super_admin', 'services_admin'))
with check (public.current_admin_role() in ('super_admin', 'services_admin'));

drop policy if exists "public_read_portal_scholarships" on public.portal_scholarships;
create policy "public_read_portal_scholarships"
on public.portal_scholarships
for select
to anon, authenticated
using (true);


-- ----------------------------------------------------------------------------
-- ۶. Policy روی portal_requests — نمایش دوگانه + محدودیت نوع برای services_admin
-- ----------------------------------------------------------------------------
-- anon باید بتواند insert کند (فرم‌های عمومی سایت) — این را دست نزنید اگر دارید:
drop policy if exists "public_insert_portal_requests" on public.portal_requests;
create policy "public_insert_portal_requests"
on public.portal_requests
for insert
to anon, authenticated
with check (true);

-- SELECT/UPDATE برای super_admin: همه‌ی ردیف‌ها.
-- SELECT/UPDATE برای services_admin: فقط ردیف‌هایی که type مربوط به همین
-- دپارتمان است (consultation / scholarship-consulting) — یعنی حتی اگر یک
-- ادمین دپارتمانی مستقیم به API درخواست بزند، هرگز نمی‌تواند یک ثبت‌نام
-- سالن یا درخواست همکاری را ببیند/تغییر دهد.
drop policy if exists "admin_read_portal_requests" on public.portal_requests;
create policy "admin_read_portal_requests"
on public.portal_requests
for select
to authenticated
using (
  public.current_admin_role() = 'super_admin'
  or (public.current_admin_role() = 'services_admin' and type in ('consultation', 'scholarship-consulting'))
);

drop policy if exists "admin_update_portal_requests" on public.portal_requests;
create policy "admin_update_portal_requests"
on public.portal_requests
for update
to authenticated
using (
  public.current_admin_role() = 'super_admin'
  or (public.current_admin_role() = 'services_admin' and type in ('consultation', 'scholarship-consulting'))
)
with check (
  public.current_admin_role() = 'super_admin'
  or (public.current_admin_role() = 'services_admin' and type in ('consultation', 'scholarship-consulting'))
);


-- ============================================================================
-- چک‌لیست تایید بعد از اجرا
-- ============================================================================
-- [ ] یک ادمین موجود (super_admin) هنوز می‌تواند همه‌چیز را در پنل ارشد ذخیره کند.
-- [ ] یک حساب تازه با role='services_admin'، وقتی از UI پنل دپارتمانی ذخیره
--     می‌کند، موفق می‌شود.
-- [ ] همان حساب services_admin، اگر مستقیم از کنسول مرورگر بخواهد کلید
--     'bgLounge' را در portal_settings آپدیت کند، با خطای RLS رد می‌شود.
-- [ ] همان حساب، اگر بخواهد یک ردیف portal_requests با type='lounge' را
--     select/update کند، چیزی برنمی‌گردد / رد می‌شود.
-- [ ] یک بازدیدکننده‌ی ناشناس (anon) هنوز می‌تواند فرم بفرستد (insert) و
--     محتوای عمومی سایت را بخواند (select روی portal_settings/portal_scholarships).
