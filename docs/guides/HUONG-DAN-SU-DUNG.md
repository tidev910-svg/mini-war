# Hướng dẫn sử dụng thư mục `docs/`

Hướng dẫn này dành cho người phát triển Mini War. Nó giải thích thư mục `docs/` dùng để làm gì, cách làm việc với Claude Code dựa trên thư mục này, và cách giữ tài liệu luôn khớp với code.

---

## 1. Thư mục này để làm gì?

`docs/` là "bộ nhớ" về các cơ chế game. Mỗi khi bạn nhờ Claude Code sửa game, Claude sẽ đọc phần tài liệu liên quan trước. Nhờ đó Claude:
- hiểu đúng luật chơi và thông số hiện tại mà không phải đọc lại toàn bộ code trong `src/` (khoảng 30 module);
- biết thay đổi của mình ảnh hưởng tới tính năng nào khác;
- biết các lỗi và giới hạn đã biết, để không vô tình làm hỏng hoặc lặp lại chúng.

Claude Code tự đọc [CLAUDE.md](../../CLAUDE.md) ở gốc dự án trong **mỗi phiên**. File đó yêu cầu Claude đọc `docs/` và cập nhật tài liệu sau khi sửa code, nên bạn không cần nhắc lại mỗi lần.

---

## 2. Bản đồ thư mục

```
CLAUDE.md                 Quy tắc cho Claude Code (tự động được đọc)
docs/
├── README.md             Mục lục: tính năng → file → hàm chính → trạng thái
├── guides/               Hướng dẫn chạy dự án và file bạn đang đọc
├── decisions/            Các bản chốt thiết kế / quyết định
├── backlog.md            Việc tồn đọng cho phiên sau
├── architecture.md       Module trong src/, state, vòng lặp, luồng lệnh, toạ độ
├── conventions.md        Nguyên tắc sửa code, quy ước team, thuật ngữ
├── assets.md             Thư mục ảnh nhân vật & quy ước đặt tên file
├── _template.md          Khung cho file tính năng mới
├── features/             Mỗi tính năng một file
│   ├── match-flow.md     ai-opponent.md    multiplayer.md
│   ├── economy.md        fog-of-war.md     rendering.md
│   ├── units.md          controls.md       hud-ui.md
│   ├── fortress.md       combat.md         territory.md
│   ├── farms.md          buildings.md      resource-system.md
└── archive/              Tài liệu cũ, đã lỗi thời — chỉ để tham khảo
```

**Nên đọc gì khi nào**
| Bạn muốn… | Mở file |
|---|---|
| Xem nhanh game có những tính năng gì | [README.md](../README.md) |
| Hiểu code được tổ chức ra sao | [architecture.md](../architecture.md) |
| Biết luật "không được làm" khi sửa code | [conventions.md](../conventions.md) |
| Tra thông số một loại quân, giá nông trại, luật mỏ… | File tương ứng trong `features/` |
| Xem các lỗi/giới hạn đã biết | Mục **"Giới hạn / việc tồn đọng"** cuối mỗi file tính năng |
| Biết cần thử gì sau khi sửa | Mục **"Kiểm thử thủ công"** trong file tính năng |

---

## 3. Cấu trúc một file tính năng

Mọi file trong `features/` có cùng các mục:

| Mục | Nội dung |
|---|---|
| Dòng trạng thái | `Đang có` / `Cần kiểm thử` / `Đề xuất` + ngày cập nhật lần cuối |
| Mô tả | Người chơi thấy và làm gì |
| Luật & thông số | Bảng số liệu lấy từ code |
| Code liên quan | Tên hàm, biến, trường trong `state`, phần tử HTML |
| Tương tác | Link sang các tính năng bị ảnh hưởng |
| Multiplayer | Action guest gửi, host xử lý gì, dữ liệu trong snapshot |
| Kiểm thử thủ công | Checklist để thử sau khi sửa |
| Giới hạn / việc tồn đọng | Lỗi đã biết, code chết, việc nên làm |

Code được tham chiếu bằng **tên hàm** (ví dụ `buy()`), không bằng số dòng, vì số dòng thay đổi liên tục.

---

## 4. Làm việc với Claude Code

### 4.1 Thêm tính năng mới
Chỉ cần mô tả tính năng. Theo `CLAUDE.md`, Claude sẽ tự tạo `docs/features/<ten>.md` từ template và thêm dòng vào mục lục.

> Ví dụ: *"Thêm loại quân Pháp sư: 120 vàng, 40 năng lượng, đánh lan trong bán kính 40."*

Khi Claude làm xong, kiểm tra:
- [ ] Có file mới trong `docs/features/` và đủ các mục.
- [ ] [README.md](../README.md) có thêm một dòng trong bảng.
- [ ] Các file tính năng liên quan cũng được cập nhật. Ví dụ quân mới thì [units.md](../features/units.md), [combat.md](../features/combat.md) và [ai-opponent.md](../features/ai-opponent.md) đều phải được sửa.

### 4.2 Sửa hoặc cân bằng tính năng đã có
Claude sửa **trực tiếp** file tính năng đó (thông số, checklist, ngày cập nhật). Không tạo file mới cho bản cập nhật.

> Ví dụ: *"Tăng giá nông trại lên 100 vàng."* Sau khi sửa, [farms.md](../features/farms.md) phải ghi 100 vàng và có ngày cập nhật mới. Đoạn hướng dẫn trong `index.html` cũng phải được sửa theo (xem [hud-ui.md](../features/hud-ui.md)).

### 4.3 Sửa lỗi đã ghi trong tài liệu
Mục "Giới hạn / việc tồn đọng" chính là danh sách việc cần làm. Bạn có thể nhờ thẳng:

> Ví dụ: *"Sửa lỗi guest mất kết nối không vào lại phòng được, ghi trong multiplayer.md."*

Sửa xong, Claude phải xoá dòng lỗi đó khỏi tài liệu.

### 4.4 Chỉ hỏi, không sửa
> Ví dụ: *"Theo docs, AI chọn loại quân thế nào?"*, *"Muốn thêm công trình mới thì phải đụng tới những hàm nào?"*

### 4.5 Mẫu câu hữu ích
| Mục đích | Câu nhờ Claude |
|---|---|
| Kiểm tra tài liệu còn đúng không | "Đối chiếu `docs/features/combat.md` với code, sửa chỗ nào lệch." |
| Rà toàn bộ | "Kiểm tra mọi file trong `docs/features/` còn khớp code không." |
| Lên kế hoạch trước | "Đọc docs rồi lập kế hoạch thêm tính năng X, chưa sửa code." |
| Tìm việc để làm | "Liệt kê các mục 'Giới hạn' trong docs, sắp xếp theo mức độ ưu tiên." |

---

## 5. Tự sửa tài liệu bằng tay

Bạn hoàn toàn có thể tự sửa các file Markdown. Lưu ý:
1. **Code là nguồn đúng cuối cùng.** Đừng ghi thông số mà code chưa có. Ý tưởng chưa làm thì ghi trạng thái `Đề xuất`.
2. Tính năng mới: copy [_template.md](../_template.md) vào `features/`, đặt tên kiểu `ten-tinh-nang.md` (chữ thường, không dấu, nối bằng gạch ngang).
3. Cập nhật ngày ở dòng "Cập nhật lần cuối".
4. Thêm hoặc đổi tên file thì sửa luôn bảng trong [README.md](../README.md) và các link trong mục "Tương tác" của file khác.
5. Đừng chỉnh `archive/`: đó là bản lưu lịch sử.

---

## 6. Giữ tài liệu không bị lỗi thời

Thỉnh thoảng (ví dụ sau mỗi đợt sửa lớn) nên rà lại:
- [ ] Nhờ Claude: *"Đối chiếu toàn bộ docs với code và sửa chỗ lệch."*
- [ ] Mọi tính năng trong game đều có dòng trong [README.md](../README.md).
- [ ] Không còn link hỏng. Mở file trong VS Code rồi Ctrl+Click vào link để thử.
- [ ] Các tính năng `Cần kiểm thử` đã được thử chưa? Thử rồi thì đổi thành `Đang có`.
- [ ] Commit tài liệu cùng lúc với code để lịch sử Git ghi lại cả hai.

---

## 7. Câu hỏi thường gặp

**Tài liệu và code nói khác nhau thì tin bên nào?**
Tin code. Sau đó sửa tài liệu cho khớp, hoặc nhờ Claude sửa.

**Một thay đổi đụng tới nhiều tính năng thì ghi vào đâu?**
Sửa mọi file liên quan, mỗi file ghi phần thuộc về nó. Không gom vào một file chung.

**Có cần ghi lịch sử thay đổi (changelog) không?**
Không. Tài liệu chỉ mô tả **hiện trạng**. Lịch sử đã có trong Git (`git log -p docs/`).

**Tính năng bị xoá khỏi game thì sao?**
Xoá file tính năng, xoá dòng của nó trong [README.md](../README.md), và gỡ các link trỏ tới nó.
