const { setNoStoreHeaders } = require("../lib/security");

module.exports = function handler(request, response) {
  setNoStoreHeaders(response);

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.VAPID_PUBLIC_KEY) {
    response.status(503).json({ error: "VAPID_PUBLIC_KEY eksik" });
    return;
  }

  response.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
