# Deploy rclone OAuth Manager

App chạy frontend và backend trong cùng một Node.js container:

- Frontend SPA/PWA được serve từ thư mục `public/`.
- Backend Express chạy API, OAuth callback và static frontend trên cùng port `53682`.
- Chỉ cần mở `http://localhost:53682/` sau khi container chạy.

## 1. Chuẩn bị `.env`

Tạo file `.env` từ mẫu:

```powershell
Copy-Item .env.example .env
```

Trên Linux/macOS:

```bash
cp .env.example .env
```

Sửa `.env` tối thiểu như sau:

```env
PORT=53682
FRONTEND_URL=http://localhost:53682
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
ALLOWED_ORIGINS=http://localhost:53682
```

Chọn một trong hai mode Firebase.

## 2. Firebase Mode: Database Secret

Dễ chạy nhất với Docker:

```env
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_DATABASE_SECRET=your_database_secret
```

## 3. Firebase Mode: Service Account

Cách khuyến nghị cho Docker là dùng inline JSON:

```env
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

Giữ JSON trên một dòng; private key cần dùng ký tự `\n` escaped trong chuỗi JSON.

Nếu muốn dùng file `serviceAccount.json`:

1. Đặt file tại repo root: `serviceAccount.json`
2. Trong `.env` đặt:

```env
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_PATH=/run/secrets/firebase_service_account
```

3. Mở comment volume trong `docker-compose.yml`:

```yaml
volumes:
  - ./serviceAccount.json:/run/secrets/firebase_service_account:ro
```

Không commit `.env` hoặc `serviceAccount.json`.

## 4. Chạy bằng Docker

Một lệnh này build image và start cả frontend + backend:

```powershell
docker compose up -d --build
```

Kiểm tra container:

```powershell
docker compose ps
docker compose logs -f rclone-oauth
```

Mở app:

```text
http://localhost:53682/
```

Health check:

```powershell
Invoke-RestMethod http://localhost:53682/health
```

Trên Linux/macOS:

```bash
curl http://localhost:53682/health
```

## 5. OAuth Redirect URI

Trong Google Cloud Console hoặc Azure Portal, redirect URI phải là:

```text
http://localhost:53682/
```

Đây là endpoint backend nhận OAuth callback:

```text
GET /?code=...&state=...
```

Sau khi callback thành công, backend exchange token, build rclone config, lưu Firebase và redirect lại frontend.

## 6. Update phiên bản mới

```powershell
docker compose down
docker compose up -d --build
```

## 7. Stop app

```powershell
docker compose down
```

## 8. Troubleshooting

Nếu port `53682` đang bận, dừng process/container đang dùng port đó trước khi chạy Docker.

Nếu Docker báo lỗi kiểu `failed to read .env` hoặc `Incorrect function`, kiểm tra xem `.env` có bị tạo thành thư mục không. Nếu có, xóa thư mục `.env` rỗng rồi tạo lại file `.env` từ `.env.example`.

Nếu `/health` trả `firebase: "error"` hoặc `firebaseMode: "offline"`, kiểm tra lại `.env`. App vẫn có thể chạy UI và manual flow, nhưng dữ liệu chỉ lưu memory nếu Firebase chưa cấu hình đúng.

Nếu dùng service account file mode mà container báo không tìm thấy file, kiểm tra lại volume mount trong `docker-compose.yml` và giá trị `FIREBASE_SERVICE_ACCOUNT_PATH`.
