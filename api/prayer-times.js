const { cities } = require("./lib/cities");
const { TIME_ZONE, partsInTimeZone, getPrayerTimes } = require("./lib/prayer-times");
const { assertSameOrigin, setNoStoreHeaders } = require("./lib/security");

function parseLocalDate(value) {
  if (!value) return partsInTimeZone(new Date(), TIME_ZONE);

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const localDate = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
  const check = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day));

  if (
    check.getUTCFullYear() !== localDate.year ||
    check.getUTCMonth() + 1 !== localDate.month ||
    check.getUTCDate() !== localDate.day
  ) {
    return null;
  }

  return localDate;
}

module.exports = async function handler(request, response) {
  setNoStoreHeaders(response);

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!assertSameOrigin(request, response)) return;

  const url = new URL(request.url || "/", `https://${request.headers.host || "localhost"}`);
  const cityKey = String(url.searchParams.get("city") || "copenhagen");
  const date = parseLocalDate(url.searchParams.get("date"));

  if (!cities[cityKey]) {
    response.status(400).json({ error: "Ukendt by" });
    return;
  }

  if (!date) {
    response.status(400).json({ error: "Ugyldig dato" });
    return;
  }

  try {
    const result = await getPrayerTimes(cityKey, date);
    response.status(200).json({
      cityKey,
      cityLabel: result.city.label,
      dateKey: result.dateKey,
      times: result.times,
      sources: result.sources
    });
  } catch (error) {
    response.status(500).json({ error: "Namaz vakitleri alınamadı" });
  }
};
