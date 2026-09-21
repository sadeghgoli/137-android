# دیپلوی وب `sabzevar-137` روی سرور لینوکس

مسیر پروژه در repo: `apps/android`  
روی سرور (مثال): `/opt/137-android` یا clone همین پوشه

---

## علت خطای `Unauthorized request from https://test-137.sabzevar.ir`

مرورگر از دامنه HTTPS درخواست می‌زند، Metro فقط Originهای مجاز را قبول می‌کند → bundle/HMR رد → **لودینگ**.

**راه‌حل:** `extra.router.origin` در `app.json` (انجام شده) + nginx با WebSocket + `expo start -c`.

---

## اجرای dev (پورت 5037)

```bash
cd /opt/137-android   # یا apps/android داخل clone
BROWSER=none npx expo start --web --lan --port 5037 -c
```

---

## nginx → Metro + SSO API (CORS)

مرورگر وب به `/sso-api` می‌زند (same-origin)؛ nginx به SSO واقعی forward می‌کند.

```nginx
# SSO API — قبل از location / عمومی
location /sso-api/ {
    proxy_pass https://apiweb-loginsso.sabzevar.ir/;
    proxy_http_version 1.1;
    proxy_set_header Host apiweb-loginsso.sabzevar.ir;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_ssl_server_name on;
}

location / {
    proxy_pass http://127.0.0.1:5037;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
```

در حالت dev، Metro خودش `/sso-api` را proxy می‌کند (`metro.config.js`). اگر فقط nginx دارید و Metro پشت آن است، **هر دو** مسیر `/sso-api` باید به loginsso برسد (یا فقط nginx و Metro بدون duplicate — اگر همه چیز از nginx می‌آید، nginx `/sso-api` را مستقیم به loginsso بدهد و به Metro نفرستید).

---

## production

```bash
npx expo export --platform web
# سرو static از dist/ با nginx
```

جزئیات بیشتر: همان فایل در repo یا بخش‌های systemd/background در نسخه کامل.
