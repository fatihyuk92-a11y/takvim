const { readJsonBody } = require("../lib/request");
const { deleteSubscriptionByEndpoint } = require("../lib/push-store");

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { endpoint } = await readJsonBody(request);
    if (!endpoint) {
      response.status(400).json({ error: "Endpoint mangler" });
      return;
    }

    await deleteSubscriptionByEndpoint(endpoint);
    response.status(200).json({ ok: true });
  } catch (error) {
    response.status(200).json({ ok: true });
  }
};
