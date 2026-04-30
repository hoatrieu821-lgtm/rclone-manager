# PROMPT: Build rclone OAuth Manager App

## OVERVIEW
Xây dựng web app quản lý rclone OAuth token cho Google Drive và OneDrive.
App chạy độc lập (Node.js/Python) hoặc Docker. Có frontend PWA + backend HTTP tại `http://localhost:53682/`.

---

## TECH STACK
- **Backend**: Node.js (Express) hoặc Python (FastAPI) — chọn 1
- **Frontend**: Vanilla HTML/CSS/JS — single page app, file structure theo `design_html.md` Section 12
- **Database**: Firebase Realtime Database (hỗ trợ 2 auth mode: service account JSON hoặc database secret trong URL)
- **Container**: Dockerfile + docker-compose.yml

---

## BACKEND — `http://localhost:53682/`

Backend lắng nghe đúng endpoint này để nhận OAuth callback từ Google/Microsoft.

### Endpoint chính:
```
GET /?code=...&state=...   ← OAuth callback
```

### Xử lý state parameter:
Auth URL được frontend nhúng vào `state` field dữ liệu base64-encoded JSON:
```json
{
  "clientId": "...",
  "clientSecret": "...",
  "emailOwner": "user@gmail.com",
  "provider": "gd|od",
  "remoteName": "myremote",
  "scope": "drive",
  "driveType": "personal|business",
  "redirectUri": "http://localhost:53682/"
}
```
> `emailOwner` được double base64: `btoa(btoa("user@gmail.com"))` để tránh ký tự đặc biệt trong URL.

Backend decode state → exchange code → build rclone config → lưu Firebase.

### Token exchange:
- **Google Drive**: `POST https://oauth2.googleapis.com/token`
- **OneDrive**: `POST https://login.microsoftonline.com/common/oauth2/v2.0/token`

### Sau khi exchange thành công:
1. Build rclone config string
2. Lưu vào Firebase Realtime Database (xem schema bên dưới)
3. Redirect về frontend: `/?saved=true&remote=<remoteName>`
4. Nếu lỗi → redirect: `/?error=<message>`

---

## FIREBASE DATABASE SCHEMA

```
/rclone_configs/
  {pushId}/
    id: string                  ← auto push id
    remoteName: string
    provider: "gd" | "od"
    emailOwner: string          ← decoded plaintext
    clientId: string
    scope: string               ← GD only
    driveType: string           ← OD only
    accessToken: string
    refreshToken: string
    expiry: ISO8601 string
    rcloneConfig: string        ← full [remote] block
    createdAt: timestamp (ms)
    updatedAt: timestamp (ms)
    status: "active" | "expired" | "error"
    lastChecked: timestamp | null
    storageUsed: number | null  ← bytes
    storageTotal: number | null

/credentials_presets/
  {pushId}/
    label: string
    provider: "gd" | "od"
    clientId: string
    clientSecret: string        ← encrypted nếu ENCRYPTION_KEY được set
    redirectUri: string
    createdAt: timestamp

/app_config/
  firebaseMode: "serviceAccount" | "secret"
```

### Firebase Indexes (khai báo trong Security Rules):
```json
{
  "rules": {
    "rclone_configs": {
      ".indexOn": ["emailOwner", "provider", "createdAt", "status", "remoteName"]
    },
    "credentials_presets": {
      ".indexOn": ["provider", "createdAt"]
    }
  }
}
```

### Firebase Auth config (env — chọn 1 trong 2 mode):
```env
# Mode 1: Service Account JSON
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
# hoặc inline:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Mode 2: Database Secret
FIREBASE_DATABASE_URL=https://xxx.firebaseio.com
FIREBASE_DATABASE_SECRET=your_secret_here
```
Backend tự detect mode dựa trên env vars có mặt.

---

## FRONTEND — Cấu trúc & UX

### Bắt buộc tuân thủ `design_html.md`:
- **PWA**: `manifest.json` + `sw.js` (cache static assets)
- **CSS Design Tokens**: toàn bộ màu khai báo trong `:root` và `[data-theme="dark"]`, **KHÔNG hardcode màu trực tiếp**
- **Layout**: Sidebar fixed left (collapsed/expanded) + main content + footer fixed bottom
- **Dark/Light toggle** đặt trong sidebar footer
- **Mobile**: bottom navigation bar thay sidebar
- **Responsive**: mobile-first, breakpoint desktop ≥ 1024px
- **Accessibility**: `aria-label` cho icon-only buttons, `aria-current="page"` cho nav active, contrast ≥ 4.5:1

### Sidebar navigation (5 sections):
| # | Icon | Label | Chức năng |
|---|------|-------|-----------|
| 1 | 🔐 | OAuth Auth | Tạo config mới |
| 2 | ⚙️ | Credentials | Quản lý preset clientId/secret |
| 3 | 📋 | Configs | Danh sách config đã lưu |
| 4 | 📊 | Manager | Kiểm tra trạng thái, quota, files |
| 5 | 🛠️ | Settings | Cấu hình Firebase, app |

---

## SECTION 1: OAuth Auth Flow

**Giữ nguyên toàn bộ logic và UI từ file `rclone-oauth.html` được cung cấp**, bao gồm:
- Flow steps indicator: ① Chọn flow → ② Cấu hình → ③ Authorize → ④ Lấy token → ⑤ Config
- 2 mode: **Auto Redirect** và **Paste Redirect URL**
- 2 provider: **Google Drive** và **OneDrive**
- Preset selector cho clientId/secret (load từ Credentials section)
- Trường nhập `emailOwner` (email tài khoản dùng để auth)

### Thay đổi duy nhất — hàm buildAuthUrl():
Nhúng metadata vào `state` param dưới dạng base64 JSON:
```javascript
function buildStateParam(cfg, emailOwner) {
  const payload = {
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    emailOwner: btoa(unescape(encodeURIComponent(emailOwner))), // base64
    provider: cfg.provider,
    remoteName: cfg.remoteName,
    scope: cfg.scope,
    driveType: cfg.driveType,
    redirectUri: cfg.redirectUri,
    nonce: Math.random().toString(36).slice(2)
  };
  return btoa(JSON.stringify(payload));
}
// Dùng: state = buildStateParam(cfg, emailOwner)
```

### Fallback manual — PHẢI giữ nguyên hoàn toàn:
- Paste URL flow hoạt động 100% không cần backend
- Sau khi exchange token ở frontend thành công:
  - Hiển thị config text
  - Nút **"📋 Copy config"**
  - Nút **"☁️ Save to Firebase"** → gọi `POST /api/configs/save`
- Hiển thị warning banner nếu backend offline: *"⚠️ Backend offline — đang chạy chế độ thủ công"*
- Kiểm tra backend: `GET /health` khi load trang, timeout 2s

---

## SECTION 2: Credentials Manager

- CRUD presets: label, provider, clientId, clientSecret, redirectUri
- Lưu vào Firebase `/credentials_presets/`
- UI: bảng danh sách + modal thêm/sửa
- Nút **"Test"** → tạo auth URL thử để kiểm tra clientId hợp lệ
- Preset selector trong OAuth flow (Section 1) load danh sách từ đây
- clientSecret hiển thị dạng `••••••••` với nút toggle show/hide

---

## SECTION 3: Configs List

- Load từ Firebase `/rclone_configs/` với phân trang (20 records/page)
- **Search & Filter**:
  - Text search: `emailOwner`, `remoteName`
  - Filter dropdown: `provider` (GD/OD), `status` (active/expired/error)
  - Date range picker: `createdAt`
- **Table columns**: Remote Name | Provider | Email | Status | Storage | Created | Actions
- **Actions mỗi row**:
  - 👁 View — xem rclone config đầy đủ (modal + copy button)
  - 🔄 Refresh — làm mới access token
  - 📊 Check — kiểm tra trạng thái & cập nhật quota
  - 🗑 Delete — xóa (confirm dialog)
- **Bulk actions**: chọn nhiều → Export `.rclone.conf` | Delete selected
- Export: ghép các `rcloneConfig` thành 1 file download

---

## SECTION 4: Manager

Với mỗi config được chọn, gọi API qua access token:

### Google Drive:
```
GET https://www.googleapis.com/drive/v3/about?fields=storageQuota,user
GET https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,size,mimeType,modifiedTime)
```

### OneDrive:
```
GET https://graph.microsoft.com/v1.0/me/drive
GET https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name,size,file,lastModifiedDateTime
```

**UI hiển thị:**
- Dropdown chọn config (load từ Configs list)
- Storage progress bar: `used / total` với % và bytes formatted
- Status badge: `Active` / `Expired` / `Error`
- File list table: Name | Size | Type | Modified
- Nút **"🔄 Refresh Token"** nếu expired
- Nút **"↻ Reload"** để refresh dữ liệu
- Auto cập nhật `storageUsed`, `storageTotal`, `lastChecked`, `status` vào Firebase sau mỗi lần check

---

## SECTION 5: Settings

- Firebase connection: database URL, auth mode (service account / secret), test connection
- App info: version, backend URL, backend status indicator
- Nút **"Clear cache"** (xóa localStorage presets cache)
- Nút **"Export all configs"** (toàn bộ database → JSON backup)

---

## BACKEND API ENDPOINTS

```
# System
GET  /                          ← OAuth callback (CHÍNH)
GET  /health                    ← { status: "ok", version, firebase: "connected"|"error" }

# Configs
POST /api/configs/save          ← lưu config thủ công từ frontend manual flow
GET  /api/configs               ← list (query: provider, status, email, startDate, endDate, limit, offset)
GET  /api/configs/:id           ← get single
DELETE /api/configs/:id         ← xóa
POST /api/configs/:id/refresh   ← refresh access token → update Firebase → return new token
GET  /api/configs/:id/quota     ← fetch quota từ GD/OD API → update Firebase → return data
GET  /api/configs/:id/files     ← list files từ GD/OD API (query: pageToken)

# Presets
GET  /api/presets               ← list credential presets
POST /api/presets               ← tạo preset
PUT  /api/presets/:id           ← update preset
DELETE /api/presets/:id         ← xóa preset
```

---

## ENV FILE (.env)

```env
# Server
PORT=53682
FRONTEND_URL=http://localhost:53682

# Firebase — chọn 1 trong 2 mode
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Mode 1: Service Account
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
# hoặc
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Mode 2: Database Secret
FIREBASE_DATABASE_SECRET=your_database_secret

# Security (optional — encrypt clientSecret trong DB)
ENCRYPTION_KEY=your-32-char-random-string-here

# CORS (nếu frontend host riêng)
ALLOWED_ORIGINS=http://localhost:53682,http://localhost:3000
```

---

## DOCKER

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 53682
CMD ["node", "src/index.js"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  rclone-oauth:
    build: .
    ports:
      - "53682:53682"
    volumes:
      - ./.env:/app/.env:ro
      - ./serviceAccount.json:/app/serviceAccount.json:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:53682/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

---

## FILE STRUCTURE

```
project/
├── src/
│   ├── index.js              ← entry point, Express/FastAPI setup
│   ├── routes/
│   │   ├── oauth.js          ← GET / callback handler
│   │   ├── configs.js        ← /api/configs CRUD
│   │   └── presets.js        ← /api/presets CRUD
│   ├── services/
│   │   ├── firebase.js       ← Firebase init (auto-detect mode)
│   │   ├── tokenExchange.js  ← exchange code → tokens (GD + OD)
│   │   ├── tokenRefresh.js   ← refresh token logic
│   │   └── cloudApi.js       ← GD/OD quota + files API calls
│   └── utils/
│       ├── stateParser.js    ← decode/validate state param
│       ├── configBuilder.js  ← build rclone config string
│       └── encryption.js     ← AES-256 encrypt/decrypt
├── public/                   ← Frontend static files
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── css/
│   │   ├── tokens.css        ← :root + [data-theme="dark"]
│   │   ├── reset.css
│   │   ├── layout.css        ← sidebar, footer, main-content
│   │   ├── components.css    ← button, card, badge, form, alert, table
│   │   ├── typography.css
│   │   ├── animations.css
│   │   ├── responsive.css
│   │   └── main.css          ← @import all
│   ├── js/
│   │   ├── theme.js          ← dark/light toggle
│   │   ├── sidebar.js        ← collapse/expand
│   │   ├── api.js            ← fetch wrapper cho backend API
│   │   ├── firebase-client.js← Firebase JS SDK (read-only từ frontend nếu cần)
│   │   ├── oauth.js          ← OAuth flow logic (từ rclone-oauth.html)
│   │   ├── credentials.js    ← Credentials section
│   │   ├── configs.js        ← Configs list section
│   │   ├── manager.js        ← Manager section
│   │   └── main.js           ← router, init
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── .env.example
├── .env
├── serviceAccount.json       ← không commit lên git
├── Dockerfile
├── docker-compose.yml
├── .gitignore                ← ignore .env, serviceAccount.json
└── package.json
```

---

## CONSTRAINTS — AGENT PHẢI TUÂN THỦ

1. **Backend PHẢI chạy tại port 53682** — đây là redirect URI chuẩn của rclone, không được đổi port
2. **State parameter** là kênh duy nhất truyền metadata qua OAuth flow — KHÔNG dùng session/cookie (stateless)
3. **Frontend fallback** phải hoạt động 100% không cần backend (manual paste flow)
4. **CSS KHÔNG hardcode màu** — chỉ dùng CSS custom properties theo `design_html.md`
5. **Firebase schema + indexes** phải đầy đủ như đã định nghĩa để hỗ trợ search
6. **clientSecret** phải encrypt bằng AES-256 nếu env `ENCRYPTION_KEY` được set
7. **Token refresh** phải update đồng thời `accessToken`, `expiry`, `updatedAt`, `status` trong Firebase
8. **Sidebar**: collapsed mặc định trên mobile, expanded trên desktop ≥ 1024px
9. **Không commit** `.env` và `serviceAccount.json` — có `.gitignore` và `.env.example`
10. **State nonce** phải được validate để ngăn CSRF — reject nếu state không decode được hoặc thiếu nonce

---

## CONTEXT FILES ĐÍNH KÈM

Agent phải đọc 2 file sau trước khi code:

- `rclone-oauth.html` — giao diện và logic OAuth flow gốc (giữ nguyên, chỉ sửa buildAuthUrl)
- `design_html.md` — design system bắt buộc (tokens, layout, PWA, accessibility)
