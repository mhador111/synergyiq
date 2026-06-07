// Verifies the NextAuth credentials callback end-to-end using node:http
import http from "node:http";

const HOST = "localhost";
const PORT = 3000;

function request(path, { method = "GET", headers = {}, body = null, cookies = {} } = {}) {
  return new Promise((resolve, reject) => {
    const cookieHeader = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    const req = http.request(
      {
        host: HOST,
        port: PORT,
        path,
        method,
        headers: {
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks).toString("utf8");
          // Parse Set-Cookie headers manually
          const setCookies = [];
          for (let i = 0; i < res.rawHeaders.length; i += 2) {
            if (res.rawHeaders[i].toLowerCase() === "set-cookie") {
              setCookies.push(res.rawHeaders[i + 1]);
            }
          }
          resolve({
            status: res.statusCode,
            location: res.headers.location,
            raw: res.rawHeaders,
            setCookies,
            body: buf,
          });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function parseCookies(setCookieStrings) {
  const cookies = {};
  for (const sc of setCookieStrings) {
    const [pair] = sc.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) {
      const k = pair.slice(0, eq).trim();
      const v = pair.slice(eq + 1).trim();
      cookies[k] = v;
    }
  }
  return cookies;
}

async function login(email, password) {
  // 1) Get CSRF token
  const csrfRes = await request("/api/auth/csrf");
  const { csrfToken } = JSON.parse(csrfRes.body);
  const cookies = parseCookies(csrfRes.setCookies);
  console.log("CSRF cookies:", Object.keys(cookies));

  // 2) POST credentials
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    redirect: "false",
    callbackUrl: "http://localhost:3000/dashboard",
    json: "true",
  }).toString();

  const signinRes = await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    },
    body,
    cookies,
  });

  return {
    status: signinRes.status,
    location: signinRes.location,
    setCookies: signinRes.setCookies,
    body: signinRes.body,
  };
}

const r = await login("admin@demo.com", "admin123");
console.log("Status:", r.status);
console.log("Location:", r.location);
console.log("Set-Cookie count:", r.setCookies.length);
for (const c of r.setCookies) console.log("  ", c.split(";")[0]);
console.log("Body:", r.body.slice(0, 200));
