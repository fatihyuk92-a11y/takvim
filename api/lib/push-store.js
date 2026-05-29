const crypto = require("crypto");
const { kv } = require("@vercel/kv");

const STORE_KEY = "bonnetider:push-subscriptions";

function hasKvConfig() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function ensureKvConfig() {
  if (!hasKvConfig()) {
    throw new Error("KV storage is not configured");
  }
}

function subscriptionId(endpoint) {
  return crypto.createHash("sha256").update(endpoint).digest("hex");
}

function parseRecord(value) {
  if (!value) return null;
  if (typeof value === "string") return JSON.parse(value);
  return value;
}

async function saveSubscription({ subscription, cityKey, cityLabel }) {
  ensureKvConfig();
  const id = subscriptionId(subscription.endpoint);
  const now = new Date().toISOString();
  const record = {
    id,
    endpoint: subscription.endpoint,
    subscription,
    cityKey,
    cityLabel,
    enabled: true,
    updatedAt: now,
    createdAt: now,
    sent: {}
  };

  await kv.hset(STORE_KEY, { [id]: JSON.stringify(record) });
  return record;
}

async function updateSubscription(record) {
  ensureKvConfig();
  record.updatedAt = new Date().toISOString();
  await kv.hset(STORE_KEY, { [record.id]: JSON.stringify(record) });
}

async function deleteSubscriptionByEndpoint(endpoint) {
  ensureKvConfig();
  await kv.hdel(STORE_KEY, subscriptionId(endpoint));
}

async function getAllSubscriptions() {
  ensureKvConfig();
  const records = await kv.hgetall(STORE_KEY);
  return Object.values(records || {})
    .map(parseRecord)
    .filter((record) => record?.enabled && record.subscription?.endpoint);
}

module.exports = {
  hasKvConfig,
  saveSubscription,
  updateSubscription,
  deleteSubscriptionByEndpoint,
  getAllSubscriptions
};
