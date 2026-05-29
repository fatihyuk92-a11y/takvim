const { cities } = require("../lib/cities");
const { readJsonBody } = require("../lib/request");
const { saveSubscription } = require("../lib/push-store");
const { assertSameOrigin, setNoStoreHeaders } = require("../lib/security");

module.exports = async function handler(request, response) {
  setNoStoreHeaders(response);

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!assertSameOrigin(request, response)) return;

  try {
    const { subscription, cityKey } = await readJsonBody(request);
    if (
      typeof subscription?.endpoint !== "string" ||
      !subscription.endpoint.startsWith("https://") ||
      subscription.endpoint.length > 2048 ||
      typeof subscription.keys?.p256dh !== "string" ||
      subscription.keys.p256dh.length > 512 ||
      typeof subscription.keys?.auth !== "string" ||
      subscription.keys.auth.length > 256
    ) {
      response.status(400).json({ error: "Geçersiz push aboneliği" });
      return;
    }

    const safeCityKey = cities[cityKey] ? cityKey : "copenhagen";
    const record = await saveSubscription({
      subscription,
      cityKey: safeCityKey,
      cityLabel: cities[safeCityKey].label
    });

    response.status(200).json({ ok: true, id: record.id });
  } catch (error) {
    const status = error.statusCode === 400 || error.statusCode === 413 ? error.statusCode : 503;
    response.status(status).json({
      error: status === 413 ? "İstek çok büyük" : "Push kaydı hazır değil"
    });
  }
};
