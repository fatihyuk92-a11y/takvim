const webpush = require("web-push");
const { getAllSubscriptions, updateSubscription, deleteSubscriptionByEndpoint, hasStorageConfig } = require("../lib/push-store");
const { getCity } = require("../lib/cities");
const { TIME_ZONE, prayers, addDays, partsInTimeZone, minutesFromTime, cleanTime, zonedDateToUtcMs, getPrayerTimes } = require("../lib/prayer-times");
const { isCronAuthorized, setNoStoreHeaders } = require("../lib/security");

const WINDOW_MINUTES = Number(process.env.PUSH_CRON_WINDOW_MINUTES || 2);

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are missing");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function pruneSentMap(sent) {
  const cutoff = Date.now() - 4 * 24 * 60 * 60 * 1000;
  return Object.fromEntries(
    Object.entries(sent || {}).filter(([, value]) => Number(value) > cutoff)
  );
}

function buildEventsForDate(schedule, localDate) {
  return prayers.flatMap((prayer) => {
    const time = schedule.times[prayer.key];
    const minutes = minutesFromTime(time);
    if (!Number.isFinite(minutes)) return [];

    const startAt = zonedDateToUtcMs(localDate, minutes, schedule.city.timeZone || TIME_ZONE);
    const reminderAt = startAt - 45 * 60 * 1000;
    const displayTime = cleanTime(time);

    return [
      {
        at: reminderAt,
        stamp: `${schedule.dateKey}-${prayer.key}-reminder`,
        title: `45 dk sonra: ${prayer.name}`,
        body: `${schedule.city.label} için ${prayer.name} vakti saat ${displayTime}.`
      },
      {
        at: startAt,
        stamp: `${schedule.dateKey}-${prayer.key}-start`,
        title: `${prayer.name} vakti girdi`,
        body: `${schedule.city.label} için namaz vakti: ${displayTime}.`
      }
    ];
  });
}

async function dueEventsForCity(cityKey, cache) {
  const now = new Date();
  const city = getCity(cityKey);
  const today = partsInTimeZone(now, city.timeZone || TIME_ZONE);
  const localDates = [
    { year: today.year, month: today.month, day: today.day },
    addDays(today, 1)
  ];

  const schedules = await Promise.all(localDates.map(async (localDate) => {
    const cacheKey = `${cityKey}-${localDate.year}-${localDate.month}-${localDate.day}`;
    if (!cache.has(cacheKey)) {
      cache.set(cacheKey, getPrayerTimes(cityKey, localDate));
    }
    return cache.get(cacheKey);
  }));

  const windowMs = WINDOW_MINUTES * 60 * 1000;
  return schedules
    .flatMap((schedule, index) => buildEventsForDate(schedule, localDates[index]))
    .filter((event) => now.getTime() >= event.at && now.getTime() < event.at + windowMs);
}

async function sendNotification(record, event) {
  const payload = JSON.stringify({
    title: event.title,
    body: event.body,
    tag: `${record.id}-${event.stamp}`,
    url: "/"
  });

  await webpush.sendNotification(record.subscription, payload, {
    TTL: 60 * 60,
    urgency: "high",
    topic: event.stamp.slice(-32)
  });
}

module.exports = async function handler(request, response) {
  setNoStoreHeaders(response);

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isCronAuthorized(request)) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!hasStorageConfig()) {
    response.status(503).json({ error: "Redis storage eksik" });
    return;
  }

  try {
    configureWebPush();
    const records = await getAllSubscriptions();
    const scheduleCache = new Map();
    let sent = 0;
    let removed = 0;

    for (const record of records) {
      record.sent = pruneSentMap(record.sent);
      const events = await dueEventsForCity(record.cityKey, scheduleCache);
      let removedRecord = false;

      for (const event of events) {
        if (record.sent[event.stamp]) continue;

        try {
          await sendNotification(record, event);
          record.sent[event.stamp] = Date.now();
          sent += 1;
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            await deleteSubscriptionByEndpoint(record.endpoint);
            removed += 1;
            removedRecord = true;
            break;
          }
          throw error;
        }
      }

      if (!removedRecord) await updateSubscription(record);
    }

    response.status(200).json({ ok: true, subscriptions: records.length, sent, removed });
  } catch (error) {
    response.status(500).json({ error: "Cron push başarısız" });
  }
};
