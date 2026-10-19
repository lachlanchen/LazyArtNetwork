[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt شبكة إثبات حصة متوافقة مع Ethereum لمجتمع LazyingArt. تُستخدم عملتها الأصلية LazyArtCoin ‏(LAC) لدفع الرسوم والتفويض إلى المدققين. يوفّر Fun/D منحاً للمبدعين ممولة بالكامل مسبقاً وتُصرف على مدى زمني محدد.

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## استخدام LazyArt

أنشئ محفظة في MetaMask واحتفظ بنسختها الاحتياطية، ثم اتصل بـ LazyArt لإرسال LAC أو التفويض أو سحب مكافآت الرسوم أو نشر عقد Solidity. توزّع الحنفية 100 LAC مرة واحدة لكل عنوان من مخصص إجمالي قدره 100,000 LAC. تضم المجموعة النشطة حتى 32 مدققاً، ويستغرق إلغاء التفويض 24 ساعة. تعتمد المكافآت على رسوم الشبكة وعمولة المدقق.

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## البناء والاختبار

يلزم Node.js 20.19+ أو 22.12+ وnpm وPython 3. تُترجم الأوامر العقود وتُجري اختبارات معزولة وتبني الموقع؛ ولا تنشر عقوداً أو تنفق أموالاً. للانضمام إلى الشبكة الحالية اتبع دليل العقدة وتحقق من ملف التكوين الأولي المنشور. تنشئ نصوص التهيئة شبكة جديدة مستقلة، ولا يجوز أن تستبدل مجلد عقدة موجودة.

```sh
npm ci
npm test
npm run build:web
```

## التنفيذ والحالة

يستخدم الإجماع Cosmos EVM v0.7.3 دون تعديل، مع وحدات التحصيص في Cosmos SDK وCometBFT. يضم المستودع أدوات الشبكة وبوابة المحفظة والحنفية الأصلية وعقود Fun/D ومرشح Ethereum v2: إصداراً محدوداً وحوكمة مؤجلة وميزانيات خزينة ومنحاً ومطالبات موقعة وضماناً لمهام الروبوتات والوكلاء.

LAC الأصلي وLAC على Ethereum أصلان منفصلان. عقود Ethereum v2 وضمانات الانتقال المعتمدة بنصاب توقيعات هي شيفرة مرشحة، ولم تُنشر على Ethereum بعد. يحرر الانتقال احتياطيات ممولة مسبقاً ولا يكرر الأرصدة. تغطي الاختبارات المحاسبة ومنع إعادة التنفيذ وحدود التحويل. يتطلب التفعيل نشر الطرفين وتحديد المخصصات. الشبكة تجربة مجتمعية ولا تعد بعائد ثابت. تبقى أرصدة Ethereum الحالية كما هي.

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## دعم المشروع

تدعم المساهمات مواصلة التطوير، ولا تشتري رموزاً أو تعد بمكافآت.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## الاستشهاد

إذا استخدمت البرنامج في بحث، يُرجى الاستشهاد بهذا المستودع. [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```
