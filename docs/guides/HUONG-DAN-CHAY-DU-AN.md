# Hướng dẫn tải và chạy dự án Mini War

Hướng dẫn này dành cho người muốn tải dự án từ GitHub về máy và chạy game. Mỗi bước có lệnh copy chạy được ngay trên Windows (PowerShell, Command Prompt hoặc Git Bash).

Kho mã: **https://github.com/tidev910-svg/mini-war**

> Bản dễ đọc hơn, có nút sao chép lệnh: mở [HUONG-DAN-CHAY-DU-AN.html](HUONG-DAN-CHAY-DU-AN.html) bằng trình duyệt. Khi sửa nội dung hướng dẫn, sửa cả hai file cho khớp.

---

## 1. Cài công cụ (chỉ làm một lần)

| Công cụ | Dùng để | Tải về | Kiểm tra đã cài |
|---|---|---|---|
| Git | Tải và cập nhật mã nguồn | https://git-scm.com/downloads | `git --version` |
| Node.js (bản LTS) | Chạy server game | https://nodejs.org | `node --version` |
| pnpm | Cài thư viện của dự án | Chạy lệnh `npm install -g pnpm` sau khi cài Node.js | `pnpm --version` |

Cài xong thì **đóng terminal và mở lại** để Windows nhận các lệnh mới.

Lần đầu dùng Git trên máy, khai báo tên và email (dùng để ghi tên bạn vào commit):
```
git config --global user.name "Tên của bạn"
git config --global user.email "email@cua-ban.com"
```

---

## 2. Tải dự án về lần đầu (clone)

Mở terminal tại thư mục muốn chứa dự án (ví dụ `D:\Game`), rồi chạy:
```
git clone https://github.com/tidev910-svg/mini-war.git
cd mini-war
```
Lệnh `git clone` tạo thư mục `mini-war` chứa toàn bộ mã nguồn và lịch sử thay đổi.

> Nếu kho để chế độ **riêng tư (private)**, bạn cần được chủ kho mời làm cộng tác viên. Khi Git hỏi đăng nhập, cửa sổ đăng nhập GitHub sẽ hiện ra; nếu có cài GitHub CLI thì có thể chạy `gh auth login` trước.

---

## 3. Cài thư viện và chạy game

Trong thư mục dự án:
```
pnpm install
pnpm dev
```
Rồi mở trình duyệt vào **http://localhost:5173/**.

- `pnpm install` chỉ cần chạy lần đầu, và chạy lại mỗi khi `package.json` hoặc `pnpm-lock.yaml` thay đổi sau một lần pull.
- Muốn dừng server: bấm **Ctrl+C** trong terminal.
- Cách nhanh trên Windows: bấm đúp file `scripts/start-game.bat` (vẫn phải chạy `pnpm install` một lần trước đó).

**Các lệnh khác**
| Lệnh | Tác dụng |
|---|---|
| `pnpm build` | Kiểm tra code và đóng gói game vào thư mục `dist/` |
| `pnpm preview` | Chạy thử bản trong `dist/` |

**Chơi với bạn bè trong cùng mạng Wi-Fi/LAN:** máy kia mở địa chỉ **Network** mà terminal in ra sau khi chạy `pnpm dev` (dạng `http://192.168.x.x:5173/`). Cả hai máy cần có Internet để kết nối P2P.

---

## 4. Cập nhật bản mới nhất (pull)

Mỗi khi bắt đầu làm việc, lấy thay đổi mới nhất từ GitHub về:
```
git pull
pnpm install
```
`pnpm install` ở đây phòng trường hợp có thư viện mới; nếu không có gì thay đổi thì lệnh chạy rất nhanh.

**Pull báo lỗi vì bạn đang có thay đổi chưa lưu?** Tạm cất thay đổi, pull, rồi lấy lại:
```
git stash
git pull
git stash pop
```

---

## 5. Lưu và gửi thay đổi của bạn (commit & push)

```
git status                      # xem file nào đã thay đổi
git add -A                      # chọn tất cả thay đổi để lưu
git commit -m "Mô tả ngắn thay đổi"
git pull                        # lấy bản mới nhất trước khi gửi, tránh xung đột
git push                        # gửi lên GitHub
```

**Các lệnh xem thông tin hay dùng**
| Lệnh | Tác dụng |
|---|---|
| `git status` | Trạng thái hiện tại: file nào sửa, file nào mới |
| `git log --oneline -10` | 10 commit gần nhất |
| `git diff` | Xem chi tiết các dòng đã sửa nhưng chưa commit |
| `git restore <file>` | **Bỏ** thay đổi chưa commit của một file (không lấy lại được) |

**Làm việc trên nhánh riêng** (nên dùng khi làm tính năng lớn hoặc làm chung nhiều người):
```
git switch -c ten-tinh-nang     # tạo nhánh mới và chuyển sang
# ... sửa code, commit ...
git push -u origin ten-tinh-nang
```
Sau đó vào trang GitHub của kho để tạo Pull Request gộp vào nhánh `main`.

---

## 6. Gặp lỗi

| Hiện tượng | Cách xử lý |
|---|---|
| `git`, `node` hoặc `pnpm` "is not recognized" | Chưa cài, hoặc chưa mở lại terminal sau khi cài |
| `MODULE_NOT_FOUND`, hoặc `vite` / `tsc` không chạy | Chạy lại `pnpm install`; nếu pnpm hỏi xoá thư mục `node_modules` thì đồng ý |
| Pull báo `CONFLICT` | Hai người cùng sửa một chỗ. Mở file bị báo, chọn giữ phần đúng, xoá các dòng `<<<<<<<`, `=======`, `>>>>>>>`, rồi chạy `git add -A` và `git commit` |
| Push bị từ chối (`rejected`) | Trên GitHub có thay đổi mới hơn: chạy `git pull` rồi `git push` lại |
| Server tự tắt với lỗi `EBUSY` | Do chép file vào `public/` khi server đang chạy. Chạy lại `pnpm dev` |
| Cổng 5173 đang bận | Vite tự chuyển sang 5174, 5175…; xem địa chỉ in trong terminal |
| Sửa ảnh xong nhưng game vẫn hiện ảnh cũ | Tải lại trang bằng **Ctrl+F5** |
| Không tạo hay vào được phòng chơi với bạn bè | Kiểm tra Internet; một số mạng công ty hoặc trường học chặn kết nối P2P |

---

## 7. Đọc tiếp
- [README.md](../README.md): mục lục tài liệu về cơ chế game.
- [HUONG-DAN-SU-DUNG.md](HUONG-DAN-SU-DUNG.md): cách dùng thư mục `docs/` khi làm việc với Claude Code.
- [assets.md](../assets.md): nơi đặt ảnh nhân vật và quy ước đặt tên.
