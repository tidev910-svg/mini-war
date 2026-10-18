# Thư mục ảnh & quy ước đặt tên

> Cập nhật lần cuối: 2026-10-15

## Hai nơi chứa ảnh
| Thư mục | Chứa gì | Có trong bản build? |
|---|---|---|
| `public/assets/units/<quân>/` | Ảnh **game tải thật** (spritesheet đã xử lý). Đường dẫn trong code: `/assets/units/<quân>/...` | Có: Vite copy nguyên `public/` vào `dist/` |
| `art/units/<quân>/` | Ảnh **nguồn**: tham chiếu, ảnh AI tạo, bản cũ | Không |

Quy tắc: file nào code không tải thì **không** để trong `public/`, để bản build nhẹ.

## Cấu trúc
```
public/assets/
├── units/
│   ├── scout/      scout-sheet.png
│   ├── infantry/   infantry-sheet.png
│   ├── archer/     archer-sheet.png
│   ├── spearman/   spearman-sheet.png
│   └── cavalry/    cavalry-sheet.png
├── farmstead-v2.png        (công trình — chưa chuyển sang quy ước mới)
└── fortress-sprite.png     (công trình — chưa chuyển sang quy ước mới)

art/units/<quân>/
├── reference/   ảnh tham chiếu, concept, ảnh mẫu để đưa cho AI
├── source/      ảnh gốc dùng để dựng spritesheet (ảnh AI tạo theo hướng/hoạt ảnh)
└── legacy/      bản cũ không còn dùng (tạo khi cần)
```

## Quy ước đặt tên
**Chung**
- Chữ thường, không dấu, không khoảng trắng; nối các từ bằng `-` (kebab-case). Ví dụ đúng: `spearman-down-left.png`; ví dụ sai: `ảnh chuyển động.png`, `Spearman Down.PNG`.
- Tên thư mục quân = khoá trong bảng `specs` của [src/config/balance.ts](../src/config/balance.ts): `scout`, `infantry`, `archer`, `spearman`, `cavalry`.
- Mọi file bắt đầu bằng tên quân để nhận ra ngay cả khi bị copy ra ngoài thư mục.
- **Không** thêm hậu tố phiên bản (`-v2`, `-final`, `-new`) cho file đang dùng: Git đã giữ lịch sử. Bản cũ cần giữ thì chuyển vào `legacy/` và đánh số ở đó.

**Ảnh game (`public/assets/units/<quân>/`)**
| Mẫu tên | Ý nghĩa |
|---|---|
| `<quân>-sheet.png` | Spritesheet chính game đang dùng |
| `<quân>-<hoạt-ảnh>-sheet.png` | (Khi cần tách) spritesheet riêng cho một hoạt ảnh, ví dụ `spearman-attack-sheet.png` |

**Ảnh nguồn (`art/units/<quân>/`)**
| Thư mục | Mẫu tên | Ví dụ |
|---|---|---|
| `source/` | `<quân>-<hướng>.png` — một hướng, gồm idle + walk | `spearman-down-left.png` |
| `source/` | `<quân>-<hướng>-<hoạt-ảnh>.png` — khi mỗi hoạt ảnh là một ảnh riêng | `spearman-up-attack.png` |
| `source/` | `<quân>-motion-<mô-tả>.png` — ảnh nhiều hướng/hoạt ảnh gộp | `spearman-motion-4dir.png` |
| `reference/` | `<quân>-reference-<mô-tả>.png` | `spearman-reference-hero.png` |
| `legacy/` | `<quân>-sheet-v<số>.<đuôi>` hoặc `<quân>-<mô-tả>.<đuôi>` | `spearman-sheet-v2.svg` |

**Tên hướng** (8 hướng, theo chiều kim đồng hồ bắt đầu từ hướng xuống):
`down`, `down-left`, `left`, `up-left`, `up`, `up-right`, `right`, `down-right`.
"Xuống" là đi về phía camera (xuống dưới màn hình). Trái/phải tính theo người xem màn hình.

**Tên hoạt ảnh**: `idle` (đứng yên), `walk` (đi bộ), `attack` (tấn công), `death` (chết).

## Bố cục spritesheet
- Mỗi spritesheet chia lưới đều, 4 khung mỗi hàng; số hàng tuỳ quân. Bố cục hàng phải khớp phần vẽ quân đó trong `drawUnit()` (xem [features/rendering.md](features/rendering.md)).
- Nền trong suốt; chân nhân vật đặt cùng một đường chân trong mọi khung.
- Phe đỏ có thể được dựng tự động bằng cách đổi màu từ phe xanh (xem `to_red()` trong [tools/build_spearman_sheet.py](../tools/build_spearman_sheet.py)).

## Quy trình thêm hoặc làm lại ảnh một quân
1. Bỏ ảnh tham chiếu vào `art/units/<quân>/reference/`, ảnh AI tạo vào `art/units/<quân>/source/` theo đúng tên ở trên.
2. Dựng spritesheet bằng script trong `tools/` (ví dụ `tools/build_spearman_sheet.py`), ghi đè `public/assets/units/<quân>/<quân>-sheet.png`.
3. Nếu bố cục hàng thay đổi, sửa nhánh của quân đó trong `drawUnit()`.
4. Cập nhật bảng sprite trong [features/rendering.md](features/rendering.md).
5. Tải lại game bằng Ctrl+F5 (trình duyệt có thể giữ ảnh cũ trong bộ nhớ đệm vì tên file không đổi).

## Việc tồn đọng
- Ảnh công trình (`farmstead-v2.png`, `fortress-sprite.png`) chưa theo quy ước; khi làm lại nên chuyển sang `public/assets/buildings/<công-trình>/`.
