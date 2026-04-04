create table if not exists public.admin_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists admin_state_updated_at_idx on public.admin_state (updated_at desc);

insert into public.admin_state (id, payload, updated_at)
values (
  'default',
  jsonb_build_object(
    'revision', 1,
    'updatedAt', now()::text,
    'products', '[]'::jsonb,
    'offers', '[]'::jsonb,
    'orders', '[]'::jsonb,
    'leads', '[]'::jsonb,
    'settings', jsonb_build_object(
      'whatsappNumber', '966500000000',
      'supportEmail', 'support@siraljamal.sa',
      'footerContactTitle', 'أتيلية العطر',
      'workingHoursLabel', 'يوميًا من 10 صباحًا حتى 11 مساءً',
      'currencyCode', 'SAR',
      'currencySymbol', 'ر.س',
      'lowStockThreshold', 8,
      'smartMode', true,
      'adminPin', '1234',
      'walletName', 'المحفظة الرئيسية',
      'walletAccountNumber', '777123456',
      'paymentMethods', jsonb_build_array(
        jsonb_build_object(
          'id', 'jeeb',
          'name', 'جيب',
          'provider', 'محفظة جيب',
          'accountName', 'متجر سر الجمال',
          'accountNumber', '777123456',
          'instructions', 'حوّلي المبلغ كاملًا ثم اكتبي رقم العملية أو المرجع كما ظهر لك في التطبيق.',
          'isEnabled', true
        ),
        jsonb_build_object(
          'id', 'jawali',
          'name', 'جوالي',
          'provider', 'محفظة جوالي',
          'accountName', 'متجر سر الجمال',
          'accountNumber', '771234567',
          'instructions', 'بعد التحويل عبر جوالي أدخلي اسم المحوّل ورقم المرجع لتأكيد الطلب بسرعة.',
          'isEnabled', true
        ),
        jsonb_build_object(
          'id', 'kuraimi',
          'name', 'الكريمي',
          'provider', 'الكريمي / موبايل موني',
          'accountName', 'متجر سر الجمال',
          'accountNumber', '3400123456',
          'instructions', 'يمكنك التحويل من تطبيق الكريمي أو أي فرع ثم تدوين رقم الحوالة في الحقل المخصص.',
          'isEnabled', true
        ),
        jsonb_build_object(
          'id', 'flousak',
          'name', 'فلوسك',
          'provider', 'محفظة فلوسك',
          'accountName', 'متجر سر الجمال',
          'accountNumber', '780123456',
          'instructions', 'حوّلي المبلغ عبر تطبيق فلوسك ثم اكتبي اسم المحوّل ورقم المرجع لتأكيد الطلب.',
          'isEnabled', true
        ),
        jsonb_build_object(
          'id', 'wallet-default',
          'name', 'المحفظة الرئيسية',
          'provider', 'تحويل محفظة',
          'accountName', 'متجر سر الجمال',
          'accountNumber', '777123456',
          'instructions', 'حوّلي المبلغ ثم أضيفي مرجع العملية واسم المحوّل لإتمام الطلب.',
          'isEnabled', true
        )
      )
    ),
    'auditLogs', '[]'::jsonb
  ),
  now()
)
on conflict (id) do nothing;