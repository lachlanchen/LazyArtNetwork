[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [中文 (简体)](README.zh-Hans.md) · [中文（繁體）](README.zh-Hant.md) · [Deutsch](README.de.md) · [Русский](README.ru.md)

[![LazyingArt banner — apps and four buddies](https://lazying.art/media/brand/lazyingart-intro.gif)](https://lazying.art)

# LazyArtNetwork

LazyArt là mạng bằng chứng cổ phần tương thích Ethereum dành cho cộng đồng LazyingArt. Đồng gốc LazyArtCoin (LAC) dùng để trả phí và ủy quyền cho trình xác thực. Fun/D cung cấp khoản tài trợ cho người sáng tạo, được nạp đủ trước và giải ngân theo thời gian.

[lac.lazying.art](https://lac.lazying.art/) · [Node guide](https://lac.lazying.art/pos/node-guide) · [Operations](../docs/OPERATIONS.md)

## Sử dụng LazyArt

Tạo và sao lưu ví trong MetaMask, rồi kết nối LazyArt để gửi LAC, ủy quyền, nhận phần thưởng từ phí hoặc triển khai hợp đồng Solidity. Vòi cấp phát có ngân sách 100.000 LAC, mỗi địa chỉ nhận một lần 100 LAC. Tối đa 32 trình xác thực hoạt động; hủy ủy quyền cần 24 giờ. Phần thưởng phụ thuộc phí mạng và hoa hồng của trình xác thực.

| Network | LazyArt |
| --- | --- |
| EVM chain ID | `20261020` |
| Cosmos chain ID | `lazyart-20261020-1` |
| RPC | `https://lac.lazying.art/rpc-pos` |
| Native currency | LazyArtCoin · LAC · 18 decimals |
| Genesis supply / inflation | 1,000,000 LAC / 0 |

## Biên dịch và kiểm thử

Cần Node.js 20.19+ hoặc 22.12+, npm và Python 3. Các lệnh dưới đây biên dịch hợp đồng, chạy kiểm thử cô lập và dựng cổng web; không triển khai hay chi tiền. Để tham gia mạng hiện có, làm theo hướng dẫn nút và xác minh genesis công khai. Tập lệnh khởi tạo tạo một mạng mới riêng biệt, không được ghi đè thư mục nút đang có.

```sh
npm ci
npm test
npm run build:web
```

## Triển khai và trạng thái

Đồng thuận dùng Cosmos EVM v0.7.3 nguyên bản, staking Cosmos SDK và CometBFT. Kho mã chứa công cụ mạng, cổng ví, vòi cấp đồng gốc, Fun/D và bản ứng viên Ethereum v2: phát hành có giới hạn, quản trị có độ trễ, ngân sách kho quỹ, tài trợ, yêu cầu có chữ ký và ký quỹ nhiệm vụ cho robot cùng tác nhân.

LAC gốc và LAC trên Ethereum là các tài sản riêng. Ethereum v2 và ký quỹ chuyển mạng có đủ chữ ký hiện là mã nguồn ứng viên, chưa triển khai trên Ethereum. Chuyển mạng giải ngân dự trữ nạp trước, không nhân đôi số dư. Kiểm thử bao gồm kế toán, chống phát lại và hạn mức chuyển. Kích hoạt cần triển khai hai đầu và xác định ngân sách. Mạng cộng đồng thử nghiệm không hứa lợi suất cố định. Số dư Ethereum hiện có không thay đổi.

[Cosmos EVM](https://github.com/cosmos/evm/tree/v0.7.3) · [Network source](../pos/) · [Ethereum v2](../contracts-v2/) · [LICENSE](../LICENSE) · [NOTICE](../NOTICE)

## Ủng hộ dự án

Đóng góp hỗ trợ phát triển lâu dài, không phải mua token hay cam kết nhận thưởng.

<!-- support:start -->
[![GitHub Sponsors](https://img.shields.io/badge/GitHub-Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lachlanchen)
[![LazyingArt Support](https://img.shields.io/badge/LazyingArt-Support-0EA5E9?style=for-the-badge)](https://chat.lazying.art/donate)
[![PayPal Support](https://img.shields.io/badge/PayPal-Support-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/RongzhouChen)
[![Stripe Support](https://img.shields.io/badge/Stripe-Support-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://buy.stripe.com/aFadR8gIaflgfQV6T4fw400)
<!-- support:end -->

## Trích dẫn

Nếu dùng phần mềm trong nghiên cứu, vui lòng trích dẫn kho mã này. [CITATION.cff](../CITATION.cff)

```bibtex
@software{chen_lazyartnetwork_2026,
  author = {Chen, Lachlan},
  title = {LazyArtNetwork: Community Proof-of-Stake Network and LAC Contracts},
  year = {2026},
  url = {https://github.com/lachlanchen/LazyArtNetwork},
  version = {0.1.0}
}
```
