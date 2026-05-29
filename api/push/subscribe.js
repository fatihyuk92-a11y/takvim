const { cities } = require("../lib/cities");
const { readJsonBody } = require("../lib/request");
const { saveSubscription } = require("../lib/push-store");

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { subscription, cityKey, cityLabel } = await readJsonBody(request);
    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      response.status(400).json({ error: "Ugyldigt push-abonnement" });
      return;
    }

    const safeCityKey = cities[cityKey] ? cityKey : "copenhagen";
    const record = await saveSubscription({
      subscription,
      cityKey: safeCityKey,
      cityLabel: cityLabel || cities[safeCityKey].label
    });

    response.status(200).json({ ok: true, id: record.id });
  } catch (error) {
    response.status(503).json({ error: "Push-lagring er ikke klar" });
  }
};
