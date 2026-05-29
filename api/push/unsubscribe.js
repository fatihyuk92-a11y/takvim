const { readJsonBody } = require("../lib/request");
const { deleteSubscriptionByEndpoint } = require("../lib/push-store");
const { assertSameOrigin, setNoStoreHeaders } = require("../lib/security");

module.exports = async function handler(request, response) {
  setNoStoreHeaders(response);

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!assertSameOrigin(request, response)) return;

  try {
    const { endpoint } = await readJsonBody(request);
    if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || endpoint.length > 2048) {
      response.status(400).json({ error: "Endpoint eksik" });
      return;
    }

    await deleteSubscriptionByEndpoint(endpoint);
    response.status(200).json({ ok: true });
  } catch (error) {
    if (error.statusCode === 413) {
      response.status(413).json({ error: "İstek çok büyük" });
      return;
    }

    response.status(200).json({ ok: true });
  }
};
