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

## 5. Rclone commands trong Docker/WSL/Linux

Tính năng **Rclone commands** chạy lệnh thật ở backend, nghĩa là lệnh được chạy **bên trong container**, không chạy trên Windows host, WSL shell hoặc Linux host.

Image Docker của app đã cài `rclone` bằng Alpine package:

```dockerfile
RUN apk add --no-cache rclone
```

Sau khi update code/Dockerfile, luôn rebuild image:

```bash
docker compose down
docker compose up -d --build
```

Kiểm tra `rclone` trong container:

```bash
docker compose exec rclone-oauth rclone version
```

Trên PowerShell:

```powershell
docker compose exec rclone-oauth rclone version
```

Nếu lệnh trên fail, container chưa build lại image mới hoặc package `rclone` chưa được cài trong image đang chạy.

### 5.1. Config rclone được app inject tự động

Không cần mount `rclone.conf` vào container cho các remote đã auth trong UI.

Khi chạy command từ UI:

- Backend lấy các config đã lưu trong Firebase.
- Backend ghi một file config tạm trong container.
- Backend chạy `rclone` với biến môi trường `RCLONE_CONFIG` trỏ đến file tạm đó.
- Sau khi lệnh kết thúc, file tạm được xóa.

Vì vậy trong command không truyền `--config`; API sẽ từ chối command có `--config` để tránh dùng nhầm file ngoài.

### 5.2. Cloud-to-cloud không cần mount volume

Các lệnh chỉ chạy giữa remote cloud thì chỉ cần chọn config trong UI:

```bash
rclone lsjson sourceRemote:path --json
rclone sync sourceRemote:path targetRemote:path --dry-run
rclone copy sourceRemote:path targetRemote:path -P
```

Với `sync`, `copy`, `move`, `check`, chọn cả source config và target config trong builder để backend inject đủ remote vào file config tạm.

### 5.3. Local folder phải bind mount vào container

Nếu command cần đọc/ghi file local, path phải là path **bên trong container**. Host path Windows/WSL/Linux không tự tồn tại trong container.

Ví dụ muốn sync thư mục host vào cloud, thêm volume trong `docker-compose.yml`:

```yaml
services:
  rclone-oauth:
    volumes:
      - ./data:/data
```

Sau đó trong UI dùng path container:

```bash
rclone sync /data sourceRemote:backup/data --dry-run
rclone copy sourceRemote:backup/data /data/restore -P
```

Quy tắc path:

- Docker Desktop + WSL: ưu tiên đặt project và data trong filesystem WSL, ví dụ `/home/<user>/rclone-manager`, rồi mount `./data:/data`.
- Linux Docker: dùng Linux path bình thường, ví dụ `/srv/rclone-data:/data`.
- Không dùng path kiểu `C:\Users\...` trong command rclone, vì command chạy trong Linux container.
- Nếu dùng bind mount từ Windows qua Docker Desktop, cấu hình volume trong compose, nhưng trong UI vẫn dùng path container như `/data`.

### 5.4. Quyền ghi file local

Container hiện chạy bằng user mặc định của image. Khi ghi vào bind mount, file tạo ra có thể thuộc user/container UID khác với user host.

Nếu cần kiểm soát quyền file trên Linux server:

```yaml
services:
  rclone-oauth:
    user: "1000:1000"
    volumes:
      - /srv/rclone-data:/data
```

Đảm bảo thư mục host cho phép UID/GID đó đọc/ghi:

```bash
mkdir -p /srv/rclone-data
chown -R 1000:1000 /srv/rclone-data
```

### 5.5. Network và bảo mật

Container cần outbound internet để gọi Google/Microsoft/Firebase và để `rclone` truy cập cloud provider.

Không expose app trực tiếp ra internet nếu chưa có lớp auth riêng. Rclone commands có thể chạy thao tác phá hủy dữ liệu như `sync`, `delete`, `purge`, `move`.

Khuyến nghị chỉ bind port vào localhost khi chạy trên server:

```yaml
ports:
  - "127.0.0.1:53682:53682"
```

Nếu phải public qua reverse proxy, đặt authentication ở reverse proxy trước app.

### 5.6. JSON output

Chỉ chọn `JSON` trong UI khi lệnh rclone thật sự xuất JSON, ví dụ:

```bash
rclone lsjson remote:path
rclone size remote:path --json
rclone about remote: --json
```

Với các lệnh không hỗ trợ JSON, chọn `Raw`. UI sẽ vẫn hiển thị stdout/stderr đầy đủ.

### 5.7. Troubleshooting rclone command

Kiểm tra binary:

```bash
docker compose exec rclone-oauth rclone version
```

Kiểm tra log backend:

```bash
docker compose logs -f rclone-oauth
```

Nếu UI báo `rclone executable was not found in PATH`, rebuild image:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

Nếu command cloud-to-cloud báo không thấy remote, kiểm tra đã chọn đúng config source/target trong UI.

Nếu OneDrive báo lỗi:

```text
unable to get drive_id and drive_type
```

Đây thường là config OneDrive cũ thiếu `drive_id`. Bản hiện tại sẽ tự lấy `drive_id` từ Microsoft Graph và cập nhật Firebase khi chạy command. Nếu vẫn lỗi:

- Bấm refresh token cho config đó trong UI rồi chạy lại.
- Auth lại OneDrive config nếu refresh token đã hết hạn hoặc bị revoke.
- Kiểm tra export config có dòng `drive_id = ...` và `drive_type = personal` hoặc `business`.

Nếu OneDrive báo lỗi khi chạy `tree`, `ls`, `sync` từ root:

```text
Personal Vault: error listing
invalidRequest: invalidResourceId: ObjectHandle is Invalid
```

Đây thường là do rclone đi recursive vào thư mục **Personal Vault** khi vault đang khóa hoặc Microsoft Graph không trả object handle hợp lệ. Builder trong UI mặc định thêm filter này cho OneDrive:

```bash
--exclude "/Personal Vault/**"
```

Nếu gõ command trực tiếp, thêm filter thủ công:

```bash
rclone tree myremote: --exclude "/Personal Vault/**"
rclone sync myremote: otherremote:backup --dry-run --exclude "/Personal Vault/**"
```

Nếu thật sự cần xử lý dữ liệu trong Personal Vault, hãy mở/unlock Personal Vault trong OneDrive trước hoặc chạy command trực tiếp vào path cụ thể sau khi xác nhận Graph cho phép truy cập.

Nếu command local báo không thấy path, kiểm tra volume mount và dùng path container như `/data/...`, không dùng path host.

Nên chạy `--dry-run` trước với các command có rủi ro như `sync`, `move`, `delete`, `purge`.

## 6. OAuth Redirect URI

Trong Google Cloud Console hoặc Azure Portal, redirect URI phải là:

```text
http://localhost:53682/
```

Đây là endpoint backend nhận OAuth callback:

```text
GET /?code=...&state=...
```

Sau khi callback thành công, backend exchange token, build rclone config, lưu Firebase và redirect lại frontend.

## 7. Update phiên bản mới

```powershell
docker compose down
docker compose up -d --build
```

## 8. Stop app

```powershell
docker compose down
```

## 9. Troubleshooting

Nếu port `53682` đang bận, dừng process/container đang dùng port đó trước khi chạy Docker.

Nếu Docker báo lỗi kiểu `failed to read .env` hoặc `Incorrect function`, kiểm tra xem `.env` có bị tạo thành thư mục không. Nếu có, xóa thư mục `.env` rỗng rồi tạo lại file `.env` từ `.env.example`.

Nếu `/health` trả `firebase: "error"` hoặc `firebaseMode: "offline"`, kiểm tra lại `.env`. App vẫn có thể chạy UI và manual flow, nhưng dữ liệu chỉ lưu memory nếu Firebase chưa cấu hình đúng.

Nếu dùng service account file mode mà container báo không tìm thấy file, kiểm tra lại volume mount trong `docker-compose.yml` và giá trị `FIREBASE_SERVICE_ACCOUNT_PATH`.

Nếu OneDrive báo `AADSTS7000215: Invalid client secret provided`:

- Với preset `rclone (OneDrive)` / client id `b15665d9-eda6-4092-8539-0eec376afd59`, dùng client secret mặc định của rclone; app sẽ tự điền.
- Với custom Azure app, vào **Certificates & secrets** và copy cột **Value** ngay lúc tạo secret; không copy **Secret ID**.
- Nếu đã lưu nhầm preset, sửa preset đó rồi xóa giá trị secret sai trước khi auth lại.
