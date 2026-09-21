# دیپلوی وب `sabzevar-137` روی سرور لینوکس

مسیر پروژه در repo: `apps/android`  
روی سرور (مثال): `/opt/137-android` یا clone همین پوشه

---

## علت خطای `Unauthorized request from https://test-137.sabzevar.ir`

مرورگر از دامنه HTTPS درخواست می‌زند، Metro فقط Originهای مجاز را قبول می‌کند → bundle/HMR رد → **لودینگ**.

**راه‌حل:** `extra.router.origin` در `app.json` (انجام شده) + nginx با WebSocket + `expo start -c`.

---

## اجرای dev (پورت 5037)

روی سرور **از `npm run web` استفاده نکنید** — مرورگر و DevTools Electron را باز می‌کند و با root خطا می‌دهد.

```bash
cd /opt/137-android
npm run web:server
# یا بعد از تغییر config:
npm run web:server -- --clear
```

| خطا | علت |
|-----|-----|
| `spawn xdg-open ENOENT` | Expo می‌خواهد مرورگر باز کند؛ روی سرور بدون GUI نیست |
| `Running as root without --no-sandbox` | نصب React Native DevTools (Electron) با user root |
| `--host 0.0.0.0` | در Expo نامعتبر است — از `--lan` استفاده کنید |

**ترجیح:** با user غیر root اجرا کنید (`adduser` + `su - appuser`).

متغیرها در `web:server`: `BROWSER=none` + `CI=1` (باز نکردن مرورگر / کمتر devtools).

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

# فقط برای dev لوکال (localhost) — روی test-137 مستقیم auth.sabzevar.ir + CORS
location = /sso-otp-send {
    proxy_pass https://auth.sabzevar.ir/api/auth/second-login/send-otp;
    proxy_http_version 1.1;
    proxy_set_header Host auth.sabzevar.ir;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_ssl_server_name on;
    proxy_read_timeout 70s;
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

در حالت dev، Metro خودش `/sso-api` و `/sso-otp-send` را proxy می‌کند (`metro.config.js`).

**الزامی برای ارسال OTP روی test-137:** nginx باید `location = /sso-otp-send` را **قبل از** `location /` به `auth.sabzevar.ir` فوروارد کند — وگرنه درخواست به Metro می‌رود و گیر می‌کند یا CORS خطا می‌دهد. نمونه کامل: `deploy/nginx-test-137.conf.example`

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## production

```bash
npx expo export --platform web
# سرو static از dist/ با nginx
```

جزئیات بیشتر: همان فایل در repo یا بخش‌های systemd/background در نسخه کامل.

---

## SMS OTP (وب test-137)

ارسال پیامک از **auth.sabzevar.ir**؛ مرورگر فقط `POST /sso-otp-send` (same-origin) می‌زند و nginx به پورتال فوروارد می‌کند.

روی سرور پورتال: `appsettings.json` → `Sms:Token`, `Sms:SendUrl`, `Sms:HostHeader` و دسترسی به `192.168.1.30`.

```bash
git pull
npm run web:server
```

لاگ Metro: `[sso-proxy] OTP+SMS https://auth.sabzevar.ir/api/auth/second-login/send-otp`
