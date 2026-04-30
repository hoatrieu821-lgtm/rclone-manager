# design_html.md — Agent HTML/App Design Guideline

> **Phiên bản:** 1.0.0  
> **Mục đích:** Tài liệu bắt buộc cho mọi agent khi thiết kế bất kỳ HTML app nào.  
> Agent PHẢI đọc và tuân thủ toàn bộ file này trước khi viết bất kỳ dòng code nào.

---

## 0. CHECKLIST TRƯỚC KHI CODE

Trước khi bắt đầu, agent phải tự kiểm tra:

- [ ] Đã đọc toàn bộ `design_html.md`?
- [ ] PWA manifest + service worker đã được lên kế hoạch?
- [ ] Dark/light mode token đã được định nghĩa đầy đủ?
- [ ] Sidebar layout (fixed left) đã thiết kế?
- [ ] Footer fixed bottom đã thiết kế?
- [ ] Responsive breakpoints đã xác định?
- [ ] Mental test: white bg → chữ thấy hết? Black bg → chữ thấy hết?

---

## 1. PROGRESSIVE WEB APP (PWA) — BẮT BUỘC

Mọi app PHẢI có đầy đủ PWA setup. Không được bỏ qua.

### 1.1 Web App Manifest (`manifest.json`)

```json
{
  "name": "{{APP_NAME}}",
  "short_name": "{{APP_SHORT_NAME}}",
  "description": "{{APP_DESCRIPTION}}",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0f172a",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["productivity"],
  "lang": "vi"
}
```

Link trong `<head>`:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2563eb" id="theme-color-meta" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="{{APP_SHORT_NAME}}" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

### 1.2 Service Worker (`sw.js`)

```javascript
const CACHE_NAME = '{{APP_NAME}}-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/css/main.css', '/js/main.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

Đăng ký trong `<script>` cuối body:
```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

---

## 2. CSS DESIGN TOKENS — BẮT BUỘC

### 2.1 Cấu trúc Token System

Agent PHẢI định nghĩa toàn bộ token trong `:root` và `[data-theme="dark"]`. **KHÔNG bao giờ hardcode màu trực tiếp.**

```css
/* ═══════════════════════════════════════
   DESIGN TOKENS — LIGHT MODE (default)
═══════════════════════════════════════ */
:root {
  /* ── Brand / Primary (Blue) ── */
  --color-primary-50:  #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* ── Semantic Text ── */
  --color-text-primary:   #0f172a;   /* Heading, label quan trọng */
  --color-text-secondary: #334155;   /* Body text */
  --color-text-tertiary:  #64748b;   /* Placeholder, hint */
  --color-text-disabled:  #94a3b8;   /* Disabled state */
  --color-text-inverse:   #ffffff;   /* Text trên nền tối */
  --color-text-info:      #0c447c;
  --color-text-success:   #14532d;
  --color-text-warning:   #78350f;
  --color-text-danger:    #7f1d1d;

  /* ── Semantic Background ── */
  --color-background-primary:   #ffffff;
  --color-background-secondary: #f8fafc;
  --color-background-tertiary:  #f1f5f9;
  --color-background-inverse:   #0f172a;
  --color-background-info:      #e6f1fb;
  --color-background-success:   #dcfce7;
  --color-background-warning:   #fef9c3;
  --color-background-danger:    #fee2e2;

  /* ── Semantic Border ── */
  --color-border-primary:   #e2e8f0;
  --color-border-secondary: #cbd5e1;
  --color-border-tertiary:  #94a3b8;
  --color-border-focus:     #3b82f6;
  --color-border-danger:    #ef4444;

  /* ── Surface (Sidebar, Card) ── */
  --color-surface-sidebar:  #ffffff;
  --color-surface-card:     #ffffff;
  --color-surface-overlay:  rgba(15, 23, 42, 0.5);
  --color-surface-tooltip:  #1e293b;

  /* ── Interactive States ── */
  --color-interactive-hover:    rgba(37, 99, 235, 0.08);
  --color-interactive-active:   rgba(37, 99, 235, 0.16);
  --color-interactive-selected: rgba(37, 99, 235, 0.12);

  /* ── Spacing Scale ── */
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* ── Border Radius (Rounded style) ── */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-2xl:  24px;
  --radius-full: 9999px;

  /* ── Typography ── */
  --font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI",
                       Roboto, Helvetica, Arial, sans-serif,
                       "Apple Color Emoji", "Segoe UI Emoji";
  --font-family-mono: ui-monospace, SFMono-Regular, "SF Mono",
                       Consolas, "Liberation Mono", Menlo, monospace;

  --font-size-xs:   0.75rem;    /* 12px */
  --font-size-sm:   0.875rem;   /* 14px */
  --font-size-base: 1rem;       /* 16px */
  --font-size-lg:   1.125rem;   /* 18px */
  --font-size-xl:   1.25rem;    /* 20px */
  --font-size-2xl:  1.5rem;     /* 24px */
  --font-size-3xl:  1.875rem;   /* 30px */
  --font-size-4xl:  2.25rem;    /* 36px */

  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* ── Shadow (Subtle elevation) ── */
  --shadow-sm:  0 1px 2px 0 rgba(0,0,0,.05);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -2px rgba(0,0,0,.06);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -4px rgba(0,0,0,.05);
  --shadow-xl:  0 20px 25px -5px rgba(0,0,0,.08), 0 8px 10px -6px rgba(0,0,0,.04);
  --shadow-sidebar: 2px 0 8px rgba(0,0,0,.06);
  --shadow-footer:  0 -2px 8px rgba(0,0,0,.06);

  /* ── Transition ── */
  --transition-fast:   120ms ease-out;
  --transition-normal: 200ms ease-out;
  --transition-slow:   300ms ease-out;

  /* ── Layout ── */
  --sidebar-width-expanded:  260px;
  --sidebar-width-collapsed: 64px;
  --footer-height:           56px;
  --topbar-height:           0px; /* Nếu có topbar, đặt giá trị ở đây */
  --content-max-width:       1280px;

  /* ── Z-index Scale ── */
  --z-sidebar:  100;
  --z-footer:   100;
  --z-overlay:  200;
  --z-modal:    300;
  --z-toast:    400;
  --z-tooltip:  500;
}

/* ═══════════════════════════════════════
   DARK MODE OVERRIDES
   Chỉ override màu — tokens khác giữ nguyên
═══════════════════════════════════════ */
[data-theme="dark"] {
  /* ── Semantic Text ── */
  --color-text-primary:   #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary:  #94a3b8;
  --color-text-disabled:  #475569;
  --color-text-inverse:   #0f172a;
  --color-text-info:      #93c5fd;
  --color-text-success:   #86efac;
  --color-text-warning:   #fde68a;
  --color-text-danger:    #fca5a5;

  /* ── Semantic Background ── */
  --color-background-primary:   #0f172a;
  --color-background-secondary: #1e293b;
  --color-background-tertiary:  #334155;
  --color-background-inverse:   #f8fafc;
  --color-background-info:      rgba(37, 99, 235, 0.15);
  --color-background-success:   rgba(22, 163, 74, 0.15);
  --color-background-warning:   rgba(202, 138, 4, 0.15);
  --color-background-danger:    rgba(220, 38, 38, 0.15);

  /* ── Semantic Border ── */
  --color-border-primary:   #1e293b;
  --color-border-secondary: #334155;
  --color-border-tertiary:  #475569;
  --color-border-focus:     #60a5fa;
  --color-border-danger:    #f87171;

  /* ── Surface ── */
  --color-surface-sidebar:  #1e293b;
  --color-surface-card:     #1e293b;
  --color-surface-overlay:  rgba(0, 0, 0, 0.7);
  --color-surface-tooltip:  #f1f5f9;

  /* ── Interactive States ── */
  --color-interactive-hover:    rgba(96, 165, 250, 0.12);
  --color-interactive-active:   rgba(96, 165, 250, 0.2);
  --color-interactive-selected: rgba(96, 165, 250, 0.15);

  /* ── Shadow (tối hơn trong dark mode) ── */
  --shadow-sm:  0 1px 2px 0 rgba(0,0,0,.3);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,.4), 0 2px 4px -2px rgba(0,0,0,.3);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,.4), 0 4px 6px -4px rgba(0,0,0,.3);
  --shadow-xl:  0 20px 25px -5px rgba(0,0,0,.4), 0 8px 10px -6px rgba(0,0,0,.3);
  --shadow-sidebar: 2px 0 12px rgba(0,0,0,.4);
  --shadow-footer:  0 -2px 12px rgba(0,0,0,.4);
}
```

---

## 3. CRITICAL — DARK/LIGHT MODE TEXT RULES

> ⚠️ Agent vi phạm các quy tắc dưới đây = output bị reject ngay.

### 3.1 Quy tắc màu sắc

```
NEVER hardcode colors. Use CSS variables ONLY:

text   → var(--color-text-primary/secondary/tertiary/info/success/warning/danger)
bg     → var(--color-background-primary/secondary/tertiary/info/success/warning/danger)
border → var(--color-border-primary/secondary/tertiary)
```

### 3.2 Badge / Tag có màu

Colored badges PHẢI dùng **cùng color ramp**: bg tại stop 50–100, text tại stop 800–900.

```css
/* ✅ ĐÚNG */
.badge-blue    { background: #e6f1fb; color: #1e40af; }   /* blue-50  + blue-800  */
.badge-green   { background: #dcfce7; color: #14532d; }   /* green-50 + green-900 */
.badge-red     { background: #fee2e2; color: #7f1d1d; }   /* red-50   + red-900   */
.badge-yellow  { background: #fef9c3; color: #78350f; }   /* yellow-50 + yellow-900 */
.badge-purple  { background: #f3e8ff; color: #581c87; }   /* purple-50 + purple-900 */

/* Trong dark mode: reverse — dùng background tối, text sáng */
[data-theme="dark"] .badge-blue   { background: rgba(37,99,235,.2); color: #93c5fd; }
[data-theme="dark"] .badge-green  { background: rgba(22,163,74,.2); color: #86efac; }
```

### 3.3 SVG Text — BẮT BUỘC

```html
<!-- ✅ ĐÚNG: SVG text phải có fill -->
<svg>
  <text fill="currentColor">Label</text>
  <text class="chart-label">Value</text>  <!-- và .chart-label { fill: var(--color-text-secondary); } -->
</svg>

<!-- ❌ SAI: KHÔNG được bỏ fill -->
<svg>
  <text>Label</text>
</svg>
```

### 3.4 Mental Test — BẮT BUỘC trước khi submit

```
TRƯỚC KHI SUBMIT CODE, agent phải tự hỏi:
□ White background (#ffffff) → tất cả text có nhìn thấy rõ không?
□ Black background (#0f172a) → tất cả text có nhìn thấy rõ không?
□ Có chữ nào bị "tàng hình" do hardcode màu giống bg không?
□ Icon SVG có fill không? Placeholder có màu đủ tương phản không?
```

### 3.5 Theme Toggle Script

```javascript
// Theme management
const THEME_KEY = 'app-theme';

function getTheme() {
  return localStorage.getItem(THEME_KEY)
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  // Update PWA theme-color meta
  const meta = document.getElementById('theme-color-meta');
  if (meta) meta.content = theme === 'dark' ? '#0f172a' : '#2563eb';
}

function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

// Apply on load (trước khi render để tránh flash)
applyTheme(getTheme());
```

---

## 4. LAYOUT ARCHITECTURE — BẮT BUỘC

### 4.1 HTML Skeleton

```html
<!DOCTYPE html>
<html lang="vi" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{{APP_DESCRIPTION}}" />
  <title>{{APP_NAME}}</title>

  <!-- PWA -->
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#2563eb" id="theme-color-meta" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="{{APP_SHORT_NAME}}" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />

  <!-- Styles -->
  <link rel="stylesheet" href="/css/main.css" />

  <!-- Theme: apply sớm nhất có thể để tránh flash -->
  <script>
    (function() {
      const t = localStorage.getItem('app-theme')
        || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', t);
    })();
  </script>
</head>
<body>

  <!-- ① SIDEBAR (fixed left) -->
  <aside id="sidebar" class="sidebar" aria-label="Main navigation">
    <div class="sidebar__header">
      <a href="/" class="sidebar__logo">
        <img src="/icons/icon-192.png" alt="{{APP_NAME}} logo" class="sidebar__logo-img" />
        <span class="sidebar__logo-text">{{APP_NAME}}</span>
      </a>
      <button class="sidebar__toggle" id="sidebarToggle" aria-label="Toggle sidebar" aria-expanded="true">
        <!-- Icon collapse -->
      </button>
    </div>

    <nav class="sidebar__nav">
      <ul class="sidebar__menu" role="list">
        <li class="sidebar__item">
          <a href="/dashboard" class="sidebar__link sidebar__link--active" aria-current="page">
            <span class="sidebar__link-icon" aria-hidden="true"><!-- SVG icon --></span>
            <span class="sidebar__link-label">Dashboard</span>
          </a>
        </li>
        <!-- Thêm các menu items tương tự -->
      </ul>
    </nav>

    <div class="sidebar__footer">
      <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
        <span class="theme-toggle__icon" aria-hidden="true">🌙</span>
        <span class="sidebar__link-label">Dark Mode</span>
      </button>
    </div>
  </aside>

  <!-- Overlay backdrop (mobile) -->
  <div class="sidebar-overlay" id="sidebarOverlay" aria-hidden="true"></div>

  <!-- ② MAIN CONTENT AREA -->
  <main class="main-content" id="mainContent">
    <!-- Page content goes here -->
    <div class="page-wrapper">
      <!-- content -->
    </div>
  </main>

  <!-- ③ FOOTER (fixed bottom) -->
  <footer class="footer" role="contentinfo">
    <div class="footer__inner">
      <span class="footer__copy">© 2025 {{APP_NAME}}</span>
      <nav class="footer__links" aria-label="Footer navigation">
        <a href="/privacy" class="footer__link">Privacy</a>
        <a href="/terms" class="footer__link">Terms</a>
      </nav>
    </div>
  </footer>

  <!-- Scripts -->
  <script src="/js/main.js" defer></script>
</body>
</html>
```

### 4.2 Layout CSS

```css
/* ── App Shell ── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-background-primary);
  -webkit-font-smoothing: antialiased;
  scroll-behavior: smooth;
}

body {
  display: flex;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Sidebar ── */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: var(--sidebar-width-expanded);
  background-color: var(--color-surface-sidebar);
  border-right: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-sidebar);
  z-index: var(--z-sidebar);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  overflow: hidden;
}

/* Sidebar collapsed (icon-only, 64px) */
.sidebar--collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar--collapsed .sidebar__logo-text,
.sidebar--collapsed .sidebar__link-label {
  opacity: 0;
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  pointer-events: none;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-3);
  min-height: 64px;
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

.sidebar__logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  white-space: nowrap;
  min-width: 0;
}

.sidebar__logo-img {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.sidebar__logo-text {
  transition: opacity var(--transition-normal), width var(--transition-normal);
}

.sidebar__toggle {
  background: none;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sidebar__toggle:hover {
  background-color: var(--color-interactive-hover);
  color: var(--color-text-primary);
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-3) var(--space-2);
}

/* Scrollbar tùy chỉnh trong sidebar */
.sidebar__nav::-webkit-scrollbar { width: 4px; }
.sidebar__nav::-webkit-scrollbar-track { background: transparent; }
.sidebar__nav::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: var(--radius-full); }

.sidebar__menu {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  transition: background-color var(--transition-fast), color var(--transition-fast);
  position: relative;
}

.sidebar__link-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar__link-label {
  transition: opacity var(--transition-normal), width var(--transition-normal);
  overflow: hidden;
}

.sidebar__link:hover {
  background-color: var(--color-interactive-hover);
  color: var(--color-text-primary);
}

.sidebar__link--active {
  background-color: var(--color-interactive-selected);
  color: var(--color-primary-600);
  font-weight: var(--font-weight-semibold);
}

[data-theme="dark"] .sidebar__link--active {
  color: var(--color-primary-400);
}

/* Tooltip khi collapsed */
.sidebar--collapsed .sidebar__link {
  justify-content: center;
  padding: var(--space-3);
}

.sidebar--collapsed .sidebar__link::after {
  content: attr(data-tooltip);
  position: absolute;
  left: calc(var(--sidebar-width-collapsed) + var(--space-2));
  background-color: var(--color-surface-tooltip);
  color: var(--color-text-inverse);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
  z-index: var(--z-tooltip);
  box-shadow: var(--shadow-md);
}

.sidebar--collapsed .sidebar__link:hover::after {
  opacity: 1;
}

[data-theme="dark"] .sidebar__link--active {
  background-color: var(--color-interactive-selected);
}

.sidebar__footer {
  padding: var(--space-3) var(--space-2);
  border-top: 1px solid var(--color-border-primary);
  flex-shrink: 0;
}

/* ── Main Content ── */
.main-content {
  margin-left: var(--sidebar-width-expanded);
  margin-bottom: var(--footer-height);
  min-height: calc(100vh - var(--footer-height));
  width: calc(100% - var(--sidebar-width-expanded));
  transition: margin-left var(--transition-normal), width var(--transition-normal);
  background-color: var(--color-background-secondary);
}

.main-content--sidebar-collapsed {
  margin-left: var(--sidebar-width-collapsed);
  width: calc(100% - var(--sidebar-width-collapsed));
}

.page-wrapper {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-6);
}

/* ── Footer (fixed bottom) ── */
.footer {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-width-expanded);
  right: 0;
  height: var(--footer-height);
  background-color: var(--color-surface-sidebar);
  border-top: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-footer);
  z-index: var(--z-footer);
  display: flex;
  align-items: center;
  transition: left var(--transition-normal);
}

.footer--sidebar-collapsed {
  left: var(--sidebar-width-collapsed);
}

.footer__inner {
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer__copy {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.footer__links {
  display: flex;
  gap: var(--space-4);
}

.footer__link {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer__link:hover {
  color: var(--color-text-primary);
}

/* ── Sidebar Overlay (mobile) ── */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background-color: var(--color-surface-overlay);
  z-index: calc(var(--z-sidebar) - 1);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.sidebar-overlay--visible {
  display: block;
  opacity: 1;
}
```

### 4.3 Sidebar Toggle Script

```javascript
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const footer = document.querySelector('.footer');
const toggle = document.getElementById('sidebarToggle');
const overlay = document.getElementById('sidebarOverlay');

const SIDEBAR_KEY = 'sidebar-collapsed';
let isCollapsed = localStorage.getItem(SIDEBAR_KEY) === 'true';

function applySidebarState() {
  sidebar.classList.toggle('sidebar--collapsed', isCollapsed);
  mainContent.classList.toggle('main-content--sidebar-collapsed', isCollapsed);
  footer.classList.toggle('footer--sidebar-collapsed', isCollapsed);
  toggle.setAttribute('aria-expanded', String(!isCollapsed));
}

function toggleSidebar() {
  isCollapsed = !isCollapsed;
  localStorage.setItem(SIDEBAR_KEY, isCollapsed);
  applySidebarState();
}

// Khởi tạo
applySidebarState();
toggle.addEventListener('click', toggleSidebar);

// Mobile overlay
overlay.addEventListener('click', () => {
  if (window.innerWidth < 768) {
    isCollapsed = true;
    applySidebarState();
    overlay.classList.remove('sidebar-overlay--visible');
  }
});
```

---

## 5. RESPONSIVE DESIGN — MOBILE-FIRST

### 5.1 Breakpoints

```css
/* Breakpoints */
/* xs:  < 480px   — small phone  */
/* sm:  ≥ 480px   — large phone  */
/* md:  ≥ 768px   — tablet       */
/* lg:  ≥ 1024px  — desktop      */
/* xl:  ≥ 1280px  — wide         */
/* 2xl: ≥ 1536px  — ultrawide    */
```

### 5.2 Mobile: Sidebar → Bottom Navigation

Trên mobile (`< 768px`), sidebar ẩn hoàn toàn, thay bằng **bottom navigation bar**.

```css
/* ── MOBILE (< 768px) ── */
@media (max-width: 767px) {
  /* Ẩn sidebar */
  .sidebar {
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
    width: var(--sidebar-width-expanded) !important;
  }

  .sidebar--mobile-open {
    transform: translateX(0);
    box-shadow: var(--shadow-xl);
  }

  /* Main content full width */
  .main-content {
    margin-left: 0 !important;
    width: 100% !important;
    margin-bottom: calc(var(--footer-height) + 56px); /* bottom nav height */
  }

  /* Footer full width */
  .footer {
    left: 0 !important;
  }

  /* Bottom Navigation Bar */
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: var(--footer-height);
    left: 0;
    right: 0;
    height: 56px;
    background-color: var(--color-surface-sidebar);
    border-top: 1px solid var(--color-border-primary);
    z-index: var(--z-footer);
    align-items: center;
    justify-content: space-around;
    padding: 0 var(--space-2);
  }

  .bottom-nav__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--color-text-tertiary);
    font-size: 10px;
    font-weight: var(--font-weight-medium);
    transition: color var(--transition-fast), background-color var(--transition-fast);
    min-width: 48px;
  }

  .bottom-nav__item--active {
    color: var(--color-primary-600);
    background-color: var(--color-interactive-selected);
  }

  [data-theme="dark"] .bottom-nav__item--active {
    color: var(--color-primary-400);
  }

  .bottom-nav__icon {
    width: 22px;
    height: 22px;
  }

  /* Hamburger để mở sidebar nếu cần */
  .mobile-hamburger {
    display: flex;
  }
}

/* Ẩn bottom nav trên tablet+ */
.bottom-nav {
  display: none;
}

/* ── TABLET (768px – 1023px) ── */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: var(--sidebar-width-collapsed);
  }

  .sidebar .sidebar__logo-text,
  .sidebar .sidebar__link-label {
    display: none;
  }
}

/* ── DESKTOP (≥ 1024px) ── */
@media (min-width: 1024px) {
  /* Sidebar đầy đủ, đã xử lý ở trên */
}
```

### 5.3 Responsive Typography

```css
/* Typography scaling */
@media (max-width: 767px) {
  :root {
    --font-size-3xl: 1.5rem;
    --font-size-4xl: 1.875rem;
  }

  .page-wrapper {
    padding: var(--space-4);
  }
}
```

---

## 6. COMPONENT LIBRARY — PATTERNS

### 6.1 Card

```css
.card {
  background-color: var(--color-surface-card);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  color: var(--color-text-primary);
  transition: box-shadow var(--transition-normal);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```

### 6.2 Button

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  border: none;
  transition: background-color var(--transition-fast),
              box-shadow var(--transition-fast),
              transform var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
}

.btn:active {
  transform: scale(0.97);
}

.btn--primary {
  background-color: var(--color-primary-600);
  color: var(--color-text-inverse);
}

.btn--primary:hover {
  background-color: var(--color-primary-700);
  box-shadow: var(--shadow-md);
}

.btn--secondary {
  background-color: var(--color-background-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-secondary);
}

.btn--secondary:hover {
  background-color: var(--color-background-secondary);
}

.btn--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}

.btn--ghost:hover {
  background-color: var(--color-interactive-hover);
  color: var(--color-text-primary);
}

.btn--danger {
  background-color: #dc2626;
  color: #ffffff;
}

.btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn--lg { padding: var(--space-3) var(--space-6); font-size: var(--font-size-base); }
```

### 6.3 Form Elements

```css
.input,
.select,
.textarea {
  width: 100%;
  background-color: var(--color-background-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-family: inherit;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
}

.input::placeholder,
.textarea::placeholder {
  color: var(--color-text-tertiary);
}

.input:focus,
.select:focus,
.textarea:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.input:disabled {
  background-color: var(--color-background-tertiary);
  color: var(--color-text-disabled);
  cursor: not-allowed;
}

.label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
}
```

### 6.4 Badge / Tag

```css
/* Quy tắc: bg tại stop 50, text tại stop 800–900, CÙNG ramp màu */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1.5;
}

.badge--blue    { background: #e6f1fb; color: #1e40af; }
.badge--green   { background: #dcfce7; color: #14532d; }
.badge--red     { background: #fee2e2; color: #7f1d1d; }
.badge--yellow  { background: #fef9c3; color: #78350f; }
.badge--purple  { background: #f3e8ff; color: #581c87; }
.badge--gray    { background: var(--color-background-tertiary); color: var(--color-text-secondary); }

[data-theme="dark"] .badge--blue   { background: rgba(37,99,235,.2);   color: #93c5fd; }
[data-theme="dark"] .badge--green  { background: rgba(22,163,74,.2);   color: #86efac; }
[data-theme="dark"] .badge--red    { background: rgba(220,38,38,.2);   color: #fca5a5; }
[data-theme="dark"] .badge--yellow { background: rgba(202,138,4,.2);   color: #fde68a; }
[data-theme="dark"] .badge--purple { background: rgba(147,51,234,.2);  color: #d8b4fe; }
[data-theme="dark"] .badge--gray   { background: var(--color-background-tertiary); color: var(--color-text-tertiary); }
```

### 6.5 Toast / Alert

```css
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid;
  font-size: var(--font-size-sm);
}

.alert--info    { background: var(--color-background-info);    border-color: var(--color-primary-200);  color: var(--color-text-info);    }
.alert--success { background: var(--color-background-success); border-color: #86efac;                    color: var(--color-text-success); }
.alert--warning { background: var(--color-background-warning); border-color: #fde68a;                    color: var(--color-text-warning); }
.alert--danger  { background: var(--color-background-danger);  border-color: #fca5a5;                    color: var(--color-text-danger);  }
```

---

## 7. ANIMATION & TRANSITION

```css
/* ── Fade + Scale (default) ── */
@keyframes fadeScaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1);    }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0);      }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}

/* Usage classes */
.animate-fade-scale { animation: fadeScaleIn var(--transition-normal) both; }
.animate-fade       { animation: fadeIn var(--transition-normal) both; }
.animate-slide-up   { animation: slideInUp var(--transition-normal) both; }

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. TYPOGRAPHY SYSTEM

```css
/* Base */
body {
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}

/* Headings */
h1, .h1 { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold);     line-height: var(--line-height-tight);  color: var(--color-text-primary); }
h2, .h2 { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold);     line-height: var(--line-height-tight);  color: var(--color-text-primary); }
h3, .h3 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); line-height: var(--line-height-tight);  color: var(--color-text-primary); }
h4, .h4 { font-size: var(--font-size-xl);  font-weight: var(--font-weight-semibold); line-height: var(--line-height-normal); color: var(--color-text-primary); }
h5, .h5 { font-size: var(--font-size-lg);  font-weight: var(--font-weight-semibold); line-height: var(--line-height-normal); color: var(--color-text-primary); }
h6, .h6 { font-size: var(--font-size-base);font-weight: var(--font-weight-semibold); line-height: var(--line-height-normal); color: var(--color-text-primary); }

/* Text utilities */
.text-primary   { color: var(--color-text-primary)   !important; }
.text-secondary { color: var(--color-text-secondary) !important; }
.text-tertiary  { color: var(--color-text-tertiary)  !important; }
.text-info      { color: var(--color-text-info)      !important; }
.text-success   { color: var(--color-text-success)   !important; }
.text-warning   { color: var(--color-text-warning)   !important; }
.text-danger    { color: var(--color-text-danger)    !important; }

/* Code */
code, pre {
  font-family: var(--font-family-mono);
  font-size: 0.9em;
}

code {
  background-color: var(--color-background-tertiary);
  color: var(--color-primary-700);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

[data-theme="dark"] code {
  color: var(--color-primary-300);
}
```

---

## 9. ACCESSIBILITY — BẮT BUỘC

```css
/* Focus visible */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Skip to main content */
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  z-index: 9999;
}

.skip-link:focus {
  top: var(--space-4);
}
```

```html
<!-- Thêm vào đầu <body> -->
<a href="#mainContent" class="skip-link">Skip to main content</a>
```

**Accessibility checklist cho mọi component:**
- `aria-label` cho icon-only buttons
- `aria-current="page"` cho nav item active
- `aria-expanded` cho toggle elements
- `role` attribute đúng ngữ nghĩa
- Contrast ratio tối thiểu 4.5:1 (WCAG AA)
- Keyboard navigable

---

## 10. PERFORMANCE CHECKLIST

```html
<!-- Preconnect external resources nếu có -->
<link rel="preconnect" href="https://fonts.googleapis.com" />

<!-- Critical CSS inline, non-critical defer -->
<style>/* critical CSS here */</style>
<link rel="preload" href="/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />

<!-- Images: lazy loading mặc định -->
<img src="..." alt="..." loading="lazy" decoding="async" />

<!-- Ưu tiên LCP image -->
<img src="hero.webp" alt="..." loading="eager" fetchpriority="high" />
```

- Dùng WebP/AVIF cho images
- SVG cho icons (inline hoặc sprite)
- Defer/async non-critical scripts
- Minify CSS/JS trong production

---

## 11. THEME TOGGLE BUTTON (UI)

```html
<!-- Trong sidebar footer hoặc topbar -->
<button class="theme-toggle" id="themeToggle" aria-label="Toggle dark/light mode">
  <span class="theme-toggle__icon--light">☀️</span>
  <span class="theme-toggle__icon--dark">🌙</span>
  <span class="sidebar__link-label">
    <span class="theme-toggle__label--light">Light</span>
    <span class="theme-toggle__label--dark">Dark</span>
  </span>
</button>
```

```css
.theme-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-primary);
  background: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  width: 100%;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.theme-toggle:hover {
  background-color: var(--color-interactive-hover);
  color: var(--color-text-primary);
}

/* Hiện/ẩn icon theo theme */
[data-theme="light"] .theme-toggle__icon--light,
[data-theme="light"] .theme-toggle__label--light { display: inline; }
[data-theme="light"] .theme-toggle__icon--dark,
[data-theme="light"] .theme-toggle__label--dark  { display: none; }

[data-theme="dark"] .theme-toggle__icon--dark,
[data-theme="dark"] .theme-toggle__label--dark  { display: inline; }
[data-theme="dark"] .theme-toggle__icon--light,
[data-theme="dark"] .theme-toggle__label--light { display: none; }
```

---

## 12. FILE STRUCTURE KHUYẾN NGHỊ

```
project/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   ├── tokens.css        ← :root + [data-theme="dark"] variables
│   ├── reset.css         ← normalize/reset
│   ├── layout.css        ← sidebar, footer, main-content
│   ├── components.css    ← button, card, badge, form, alert
│   ├── typography.css    ← headings, text utilities
│   ├── animations.css    ← keyframes, transitions
│   ├── responsive.css    ← breakpoints, mobile nav
│   └── main.css          ← @import all above
├── js/
│   ├── theme.js          ← dark/light toggle
│   ├── sidebar.js        ← collapse/expand logic
│   └── main.js           ← entry point
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 13. DEFAULTS (Câu 4–10 — Chỉnh khi cần)

| # | Câu hỏi | Default đã dùng |
|---|---------|-----------------|
| 4 | Brand color | Blue (`#2563eb` primary-600) |
| 5 | Shadow / Elevation | Subtle shadow (`--shadow-md`) |
| 6 | Animation | Fade + scale nhẹ 200ms |
| 7 | Responsive priority | Mobile-first |
| 8 | Mobile sidebar | Bottom navigation bar |
| 9 | Spacing density | Comfortable (cân bằng) |
| 10 | Styling approach | CSS Variables + Vanilla CSS |

> Để thay đổi default, chỉnh token trong Section 2.1 và breakpoint CSS trong Section 5.

---

*design_html.md — Mọi agent PHẢI đọc trước khi code. Version 1.0.0*
