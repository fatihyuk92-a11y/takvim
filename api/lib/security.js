const crypto = require("crypto");

function headerValue(request, name) {
  return String(request.headers?.[name] || request.headers?.[name.toLowerCase()] || "");
}

function setNoStoreHeaders(response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
}

function hostFromUrl(value) {
  if (!value) return "";

  try {
    const normalized = value.startsWith("http") ? value : `https://${value}`;
    return new URL(normalized).host.toLowerCase();
  } catch (error) {
    return "";
  }
}

function allowedHosts(request) {
  return [
    headerValue(request, "host"),
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL
  ]
    .map(hostFromUrl)
    .filter(Boolean);
}

function isSameOriginRequest(request) {
  const origin = headerValue(request, "origin");
  if (!origin) return true;

  const originHost = hostFromUrl(origin);
  if (!originHost) return false;

  return allowedHosts(request).includes(originHost);
}

function assertSameOrigin(request, response) {
  if (isSameOriginRequest(request)) return true;

  response.status(403).json({ error: "Origin reddedildi" });
  return false;
}

function timingSafeEqual(expected, received) {
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function requestSecret(request) {
  const authorization = headerValue(request, "authorization");
  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  try {
    const baseUrl = `https://${headerValue(request, "host") || "localhost"}`;
    const url = new URL(request.url || "/", baseUrl);
    return url.searchParams.get("secret") || "";
  } catch (error) {
    return "";
  }
}

function isCronAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  return timingSafeEqual(secret, requestSecret(request));
}

module.exports = {
  assertSameOrigin,
  isCronAuthorized,
  setNoStoreHeaders
};
