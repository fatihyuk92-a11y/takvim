module.exports = function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (!process.env.VAPID_PUBLIC_KEY) {
    response.status(503).json({ error: "VAPID_PUBLIC_KEY mangler" });
    return;
  }

  response.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
