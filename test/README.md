# Test suite — NLK 3D Energy Card

Bộ test chạy **ngoài Home Assistant**, dùng stub cho Lit và `hass`.
Không cần HA, không cần token, không cần mạng.

## Chạy

```bash
npm install   # chỉ cần lần đầu (jsdom)
npm test
```

## Các suite

| File | Case | Kiểm gì |
|---|---|---|
| `test.mjs` | 16 | Logic chọn nguồn off-grid: blackout, xuất lưới, nhiễu sensor, entity thiếu, ngưỡng tuỳ chỉnh |
| `selfsuf.mjs` | 12 | Self-sufficiency, gồm 4 case chứng minh config đủ entity không đổi số |
| `supports.mjs` | 14 | Mọi `color-mix()` nằm trong `@supports`, mọi biến có fallback |
| `legacy2.mjs` | 8 | Config cũ còn `compact_mode`/`card_size` không gây lỗi |
| `lifecycle.mjs` | 7 | Không rò rỉ listener `resize` qua các chu kỳ attach/detach |
| `domtest.mjs` | 11 | Selector matching trên DOM thật (jsdom) |

**Tổng: 68 case** (57 + 11 domtest).

`domtest.mjs` **tái hiện được cả 2 bug đã gây ra ở v1.7.0/v1.7.1** — giữ lại để tránh lặp lại.

## ⚠️ Giới hạn

jsdom chỉ kiểm chứng **selector có khớp đúng element hay không**. KHÔNG kiểm được:

- CSS cascade và specificity
- Computed style thật
- Layout / kích thước thật
- `@supports` có thực sự được browser áp dụng đúng

→ **Mọi thay đổi CSS vẫn cần người xem bằng mắt trên HA thật.**

## Phụ thuộc

- `node` (đã test với v24)
- `jsdom` — chỉ cần cho `lifecycle.mjs` và `domtest.mjs`
