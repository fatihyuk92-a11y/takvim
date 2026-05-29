const crypto = require("crypto");
const { createClient } = require("redis");

const STORE_KEY = "yksl:push-subscriptions";
let redisPromise = null;

function getRedisUrl() {
  return process.env.REDIS_URL || process.env.STORAGE_URL || process.env.KV_URL;
}

function hasStorageConfig() {
  return Boolean(getRedisUrl());
}

async function getRedis() {
  const url = getRedisUrl();
  if (!url) {
    throw new Error("Redis storage is not configured");
  }

  if (!redisPromise) {
    const client = createClient({ url });
    client.on("error", () => {});
    redisPromise = client.connect().then(() => client);
  }

  return redisPromise;
}

function subscriptionId(endpoint) {
  return crypto.createHash("sha256").update(endpoint).digest("hex");
}

function parseRecord(value) {
  try {
    if (!value) return null;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch (error) {
    return null;
  }
}

async function saveSubscription({ subscription, cityKey, cityLabel }) {
  const redis = await getRedis();
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

  await redis.hSet(STORE_KEY, id, JSON.stringify(record));
  return record;
}

async function updateSubscription(record) {
  const redis = await getRedis();
  record.updatedAt = new Date().toISOString();
  await redis.hSet(STORE_KEY, record.id, JSON.stringify(record));
}

async function deleteSubscriptionByEndpoint(endpoint) {
  const redis = await getRedis();
  await redis.hDel(STORE_KEY, subscriptionId(endpoint));
}

async function getAllSubscriptions() {
  const redis = await getRedis();
  const records = await redis.hGetAll(STORE_KEY);
  return Object.values(records || {})
    .map(parseRecord)
    .filter((record) => record?.enabled && record.subscription?.endpoint);
}

module.exports = {
  hasStorageConfig,
  saveSubscription,
  updateSubscription,
  deleteSubscriptionByEndpoint,
  getAllSubscriptions
};
