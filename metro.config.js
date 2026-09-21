const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { execSync } = require('child_process');
const { HttpsProxyAgent } = require('https-proxy-agent');

const config = getDefaultConfig(__dirname);
const appJson = require('./app.json');
const UPSTREAM_TIMEOUT_MS = 120000;
const SSO_PROXY_TIMEOUT_MS = 60000;
const SSO_UPSTREAM_BASE = (
  process.env.SSO_API_UPSTREAM ||
  appJson.expo?.extra?.ssoApiUrl ||
  'https://apiweb-loginsso.sabzevar.ir'
).replace(/\/$/, '');

const SSO_WEB_PUBLIC =
  (appJson.expo?.extra?.ssoWebUrl || 'https://auth.sabzevar.ir').replace(/\/$/, '');

/** Metro/Node only: LAN URL of mvc-web-sso (Kestrel :5002). Public auth URL often times out from datacenter. */
const SSO_OTP_UPSTREAM_BASE = (
  process.env.SSO_WEB_UPSTREAM ||
  appJson.expo?.extra?.ssoWebUpstream ||
  ''
)
  .trim()
  .replace(/\/$/, '');

const SSO_OTP_UPSTREAM_HOST_HEADER = (
  process.env.SSO_WEB_UPSTREAM_HOST ||
  appJson.expo?.extra?.ssoWebUpstreamHost ||
  ''
).trim();

const SSO_OTP_UPSTREAM_PATH = '/api/citizen/send-login-otp';

function resolveOtpUpstreamBase() {
  if (SSO_OTP_UPSTREAM_BASE) {
    return SSO_OTP_UPSTREAM_BASE;
  }
  console.warn(
    '[sso-proxy] SSO_WEB_UPSTREAM / extra.ssoWebUpstream not set — OTP proxy uses public URL (may timeout on server)',
  );
  return SSO_WEB_PUBLIC;
}

function resolveOtpUpstreamHostHeader(upstreamBase) {
  if (SSO_OTP_UPSTREAM_HOST_HEADER) {
    return SSO_OTP_UPSTREAM_HOST_HEADER;
  }
  try {
    return new URL(
      upstreamBase.startsWith('http') ? upstreamBase : `http://${upstreamBase}`,
    ).hostname;
  } catch {
    return 'auth.sabzevar.ir';
  }
}

const otpUpstreamBaseForLog = resolveOtpUpstreamBase();
console.log(`[sso-proxy] login API ${SSO_UPSTREAM_BASE} (timeout ${SSO_PROXY_TIMEOUT_MS}ms)`);
console.log(
  `[sso-proxy] OTP+SMS ${otpUpstreamBaseForLog}${SSO_OTP_UPSTREAM_PATH} (Host: ${resolveOtpUpstreamHostHeader(otpUpstreamBaseForLog)})`,
);

function ssoCorsHeaders(req) {
  const origin = req.headers.origin || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      req.headers['access-control-request-headers'] ||
      'Content-Type, Authorization, Accept, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

function handleSsoApiProxy(req, res) {
  const cors = ssoCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const rawUrl = req.url || '';
  const parsed = new URL(rawUrl, 'http://localhost');
  const upstreamPath =
    parsed.pathname.replace(/^\/sso-api(?=\/|$)/, '') + parsed.search;
  const upstreamUrl = new URL(upstreamPath || '/', `${SSO_UPSTREAM_BASE}/`);

  const forwardHeaders = {
    Accept: req.headers.accept || 'application/json',
    'User-Agent': 'Sabzevar137-SsoProxy/1.0',
  };
  if (req.headers['content-type']) {
    forwardHeaders['Content-Type'] = req.headers['content-type'];
  }
  if (req.headers.authorization) {
    forwardHeaders.Authorization = req.headers.authorization;
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(400, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad request body');
    }
  });
  req.on('end', () => {
    const body = Buffer.concat(chunks);

    const transport = upstreamUrl.protocol === 'http:' ? http : https;
    const requestOpts = {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (upstreamUrl.protocol === 'http:' ? 80 : 443),
      path: upstreamUrl.pathname + upstreamUrl.search,
      method: req.method,
      headers: forwardHeaders,
      timeout: SSO_PROXY_TIMEOUT_MS,
    };
    if (body.length > 0) {
      forwardHeaders['Content-Length'] = String(body.length);
    }

    const upstream = transport.request(requestOpts, (upRes) => {
      const outHeaders = { ...cors };
      if (upRes.headers['content-type']) {
        outHeaders['Content-Type'] = upRes.headers['content-type'];
      }

      const status = upRes.statusCode || 502;
      res.writeHead(status, outHeaders);
      upRes.pipe(res);
    });

    upstream.on('timeout', () => {
      upstream.destroy();
      if (!res.headersSent) {
        res.writeHead(504, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`SSO upstream timeout after ${SSO_PROXY_TIMEOUT_MS}ms`);
      }
    });

    upstream.on('error', (error) => {
      if (!res.headersSent) {
        res.writeHead(502, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`SSO upstream error: ${error.message}`);
      }
    });

    if (body.length > 0) {
      upstream.write(body);
    }
    upstream.end();
  });
}

function forwardToUpstream(req, res, upstreamUrl, cors, timeoutMs, hostHeader) {
  const forwardHeaders = {
    Accept: req.headers.accept || 'application/json',
    'User-Agent': 'Sabzevar137-SsoProxy/1.0',
  };
  if (hostHeader) {
    forwardHeaders.Host = hostHeader;
  }
  if (req.headers['content-type']) {
    forwardHeaders['Content-Type'] = req.headers['content-type'];
  }

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(400, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Bad request body');
    }
  });
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const transport = upstreamUrl.protocol === 'http:' ? http : https;
    const requestOpts = {
      protocol: upstreamUrl.protocol,
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (upstreamUrl.protocol === 'http:' ? 80 : 443),
      path: upstreamUrl.pathname + upstreamUrl.search,
      method: req.method,
      headers: forwardHeaders,
      timeout: timeoutMs,
    };
    if (body.length > 0) {
      forwardHeaders['Content-Length'] = String(body.length);
    }

    const upstream = transport.request(requestOpts, (upRes) => {
      const outHeaders = { ...cors };
      if (upRes.headers['content-type']) {
        outHeaders['Content-Type'] = upRes.headers['content-type'];
      }
      res.writeHead(upRes.statusCode || 502, outHeaders);
      upRes.pipe(res);
    });

    upstream.on('timeout', () => {
      upstream.destroy();
      if (!res.headersSent) {
        res.writeHead(504, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Upstream timeout after ${timeoutMs}ms`);
      }
    });

    upstream.on('error', (error) => {
      if (!res.headersSent) {
        res.writeHead(502, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Upstream error: ${error.message}`);
      }
    });

    if (body.length > 0) {
      upstream.write(body);
    }
    upstream.end();
  });
}

function handleSsoOtpSend(req, res) {
  const cors = ssoCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  const upstreamBase = resolveOtpUpstreamBase();
  const upstreamUrl = new URL(SSO_OTP_UPSTREAM_PATH, `${upstreamBase}/`);
  const hostHeader = resolveOtpUpstreamHostHeader(upstreamBase);
  forwardToUpstream(req, res, upstreamUrl, cors, SSO_PROXY_TIMEOUT_MS, hostHeader);
}

/**
 * Resolve HTTP proxy for geo.sabzevar.ir upstream.
 * Browser/filter-shikan often reaches geo via a local proxy; Node/Metro does not
 * unless we wire it explicitly.
 */
function resolveUpstreamProxy() {
  const fromEnv = (
    process.env.MAP_HTTP_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    ''
  ).trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (process.platform !== 'win32') {
    return null;
  }

  try {
    const enableOut = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable',
      { encoding: 'utf8' },
    );
    const enabled = /ProxyEnable\s+REG_DWORD\s+0x0*1\b/i.test(enableOut);

    const serverOut = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer',
      { encoding: 'utf8' },
    );
    const match = serverOut.match(/ProxyServer\s+REG_SZ\s+(\S+)/i);
    if (!match) {
      return null;
    }

    let server = match[1].trim();
    // Some apps store "http=127.0.0.1:port;https=..."
    const httpsPart = server.match(/(?:^|;)\s*https?=([^;]+)/i);
    if (httpsPart) {
      server = httpsPart[1].trim();
    }
    if (!/^https?:\/\//i.test(server)) {
      server = `http://${server}`;
    }

    // Only when Windows proxy is enabled, or user forces it (stale ProxyServer
    // with ProxyEnable=0 is common after closing filter-shikan).
    if (enabled || process.env.MAP_USE_WIN_PROXY === '1') {
      return server;
    }
  } catch {
    // Registry missing or inaccessible — fall through to direct.
  }

  return null;
}

const upstreamProxy = resolveUpstreamProxy();
let httpsAgent = null;
if (upstreamProxy) {
  try {
    httpsAgent = new HttpsProxyAgent(upstreamProxy);
    console.log(
      `[map-proxy] upstream via ${upstreamProxy} (timeout ${UPSTREAM_TIMEOUT_MS}ms)`,
    );
  } catch (error) {
    console.warn(
      `[map-proxy] bad proxy URL ${upstreamProxy}: ${
        error && error.message ? error.message : error
      }`,
    );
  }
} else {
  console.log(
    `[map-proxy] no MAP_HTTP_PROXY / system proxy — direct geo (timeout ${UPSTREAM_TIMEOUT_MS}ms)`,
  );
}

/**
 * Proxy Sabzevar map traffic through Metro so Android WebView can load
 * tiles via Metro http origin instead of talking to geo.sabzevar.ir:7001
 * directly (TLS / custom-port issues in WebView).
 */
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      try {
        const rawUrl = req.url || '';

        if (rawUrl.startsWith('/sso-otp-send')) {
          handleSsoOtpSend(req, res);
          return;
        }

        if (rawUrl.startsWith('/sso-api')) {
          handleSsoApiProxy(req, res);
          return;
        }

        // Diagnostic for the in-app MAP DEBUG panel
        if (rawUrl.startsWith('/map-proxy-status')) {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store',
          });
          res.end(
            JSON.stringify({
              ok: true,
              upstreamProxy: upstreamProxy || null,
              timeoutMs: UPSTREAM_TIMEOUT_MS,
              hint: upstreamProxy
                ? null
                : 'Set MAP_HTTP_PROXY=http://127.0.0.1:PORT then restart Metro (filter-shikan HTTP port)',
            }),
          );
          return;
        }

        if (!rawUrl.startsWith('/map-proxy')) {
          return middleware(req, res, next);
        }

        const parsed = new URL(rawUrl, 'http://localhost');
        const target = parsed.searchParams.get('url');
        if (
          !target ||
          !/^https?:\/\/geo\.sabzevar\.ir(?::\d+)?\//i.test(target)
        ) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Invalid or missing url');
          return;
        }

        const targetUrl = new URL(target);
        const transport = targetUrl.protocol === 'http:' ? http : https;
        const headers = {
          'User-Agent': 'Sabzevar137-MapProxy/1.0',
          Accept: '*/*',
        };
        if (req.headers.range) {
          headers.Range = req.headers.range;
        }

        const requestOpts = {
          protocol: targetUrl.protocol,
          hostname: targetUrl.hostname,
          port: targetUrl.port || (targetUrl.protocol === 'http:' ? 80 : 443),
          path: targetUrl.pathname + targetUrl.search,
          method: 'GET',
          headers,
          timeout: UPSTREAM_TIMEOUT_MS,
          rejectUnauthorized: false,
        };

        // HTTPS through local HTTP proxy (filter-shikan / Clash / v2ray)
        if (httpsAgent && targetUrl.protocol === 'https:') {
          requestOpts.agent = httpsAgent;
        }

        const upstream = transport.request(requestOpts, (upRes) => {
          const outHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300',
          };
          if (upRes.headers['content-type']) {
            outHeaders['Content-Type'] = upRes.headers['content-type'];
          }
          if (upRes.headers['content-length']) {
            outHeaders['Content-Length'] = upRes.headers['content-length'];
          }
          if (upRes.headers['content-encoding']) {
            outHeaders['Content-Encoding'] = upRes.headers['content-encoding'];
          }
          res.writeHead(upRes.statusCode || 502, outHeaders);
          upRes.pipe(res);
        });

        upstream.on('timeout', () => {
          upstream.destroy();
          if (!res.headersSent) {
            res.writeHead(504, {
              'Content-Type': 'text/plain; charset=utf-8',
            });
            res.end(
              `Upstream timeout after ${UPSTREAM_TIMEOUT_MS}ms` +
                (upstreamProxy ? ` (proxy ${upstreamProxy})` : ' (direct)'),
            );
          }
        });

        upstream.on('error', (error) => {
          if (!res.headersSent) {
            res.writeHead(502, {
              'Content-Type': 'text/plain; charset=utf-8',
            });
            res.end(
              `Upstream error: ${error.message}` +
                (upstreamProxy
                  ? ` via ${upstreamProxy}`
                  : ' (set MAP_HTTP_PROXY=http://127.0.0.1:PORT)'),
            );
          }
        });

        upstream.end();
      } catch (error) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(
            String(error && error.message ? error.message : error),
          );
        }
      }
    };
  },
};

module.exports = config;
