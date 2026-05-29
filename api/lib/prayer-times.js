const { getCity } = require("./cities");

const TIME_ZONE = "Europe/Copenhagen";
const prayers = [
  { key: "Fajr", name: "Sabah" },
  { key: "Dhuhr", name: "Öğle" },
  { key: "Asr", name: "İkindi" },
  { key: "Maghrib", name: "Akşam" },
  { key: "Isha", name: "Yatsı" }
];

function partsInTimeZone(date = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
    hour: Number(value.hour),
    minute: Number(value.minute)
  };
}

function partsInCopenhagen(date = new Date()) {
  return partsInTimeZone(date, TIME_ZONE);
}

function addDays(localDate, days) {
  const date = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function dateKey(localDate) {
  return `${localDate.year}-${String(localDate.month).padStart(2, "0")}-${String(localDate.day).padStart(2, "0")}`;
}

function datePath(localDate) {
  return `${String(localDate.day).padStart(2, "0")}-${String(localDate.month).padStart(2, "0")}-${localDate.year}`;
}

function dottedDate(localDate) {
  return `${String(localDate.day).padStart(2, "0")}.${String(localDate.month).padStart(2, "0")}.${localDate.year}`;
}

function dayOfYear(localDate) {
  return Math.floor((Date.UTC(localDate.year, localDate.month - 1, localDate.day) - Date.UTC(localDate.year, 0, 0)) / 86400000);
}

function cleanTime(value) {
  return String(value || "").match(/\d{1,2}:\d{2}/)?.[0] || "--:--";
}

function minutesFromTime(time) {
  const [hours, minutes] = cleanTime(time).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function medianTime(times, fallback) {
  const values = times
    .map(minutesFromTime)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!values.length) return cleanTime(fallback);
  const midpoint = Math.floor(values.length / 2);
  if (values.length % 2) return minutesToTime(values[midpoint]);
  return minutesToTime((values[midpoint - 1] + values[midpoint]) / 2);
}

function zonedDateToUtcMs(localDate, minutes, timeZone = TIME_ZONE) {
  const target = {
    year: localDate.year,
    month: localDate.month,
    day: localDate.day,
    hour: Math.floor(minutes / 60),
    minute: minutes % 60
  };
  let utc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);

  for (let index = 0; index < 4; index += 1) {
    const actual = partsInTimeZone(new Date(utc), timeZone);
    const targetComparable = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
    const actualComparable = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    utc -= actualComparable - targetComparable;
  }

  return utc;
}

async function fetchSemerkandTimes(city, localDate) {
  if (!city.semerkandId) return null;

  const url = new URL("https://www.semerkandtakvimi.com/api/salaat-times");
  url.searchParams.set("year", localDate.year);
  url.searchParams.set("CityId", city.semerkandId);

  const response = await fetch(url);
  if (!response.ok) throw new Error("Semerkand failed");
  const yearTimes = await response.json();
  const today = yearTimes.find((item) => Number(item.DayOfYear) === dayOfYear(localDate));
  if (!today) return null;

  return {
    Fajr: today.Fajr,
    Sunrise: today.Tulu,
    Dhuhr: today.Zuhr,
    Asr: today.Asr,
    Maghrib: today.Maghrib,
    Isha: today.Isha
  };
}

async function fetchDiyanetTimes(city, localDate) {
  if (!city.diyanetId) return null;

  const response = await fetch(`https://ezanvakti.emushaf.net/vakitler/${city.diyanetId}`);
  if (!response.ok) throw new Error("Diyanet failed");
  const monthTimes = await response.json();
  if (!Array.isArray(monthTimes)) return null;

  const todayKey = dateKey(localDate);
  const todayDate = dottedDate(localDate);
  const today = monthTimes.find((item) => {
    const isoDate = String(item.MiladiTarihKisaIso8601 || item.MiladiTarihUzunIso8601 || "").slice(0, 10);
    return isoDate === todayKey || item.MiladiTarihKisa === todayDate;
  });
  if (!today) return null;

  return {
    Fajr: today.Imsak,
    Sunrise: today.Gunes,
    Dhuhr: today.Ogle,
    Asr: today.Ikindi,
    Maghrib: today.Aksam,
    Isha: today.Yatsi
  };
}

async function fetchMwlTimes(city, localDate) {
  const url = new URL(`https://api.aladhan.com/v1/timings/${datePath(localDate)}`);
  url.searchParams.set("latitude", city.lat);
  url.searchParams.set("longitude", city.lng);
  url.searchParams.set("method", "3");
  url.searchParams.set("school", "1");
  url.searchParams.set("timezonestring", city.timeZone || TIME_ZONE);

  const response = await fetch(url);
  if (!response.ok) throw new Error("MWL failed");
  const payload = await response.json();
  const timings = payload?.data?.timings || {};

  return timings.Fajr || timings.Isha
    ? {
        Fajr: timings.Fajr,
        Sunrise: timings.Sunrise,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha
      }
    : null;
}

function fallbackFor(city) {
  const baseFallback = { Fajr: "01:14", Sunrise: "04:30", Dhuhr: "13:09", Asr: "17:32", Maghrib: "21:38", Isha: "23:45" };
  const longitudeOffset = (12.5683 - city.lng) * 4;
  const latitudeDelta = city.lat - 55.6761;

  return {
    Fajr: minutesToTime(minutesFromTime(baseFallback.Fajr) + longitudeOffset - latitudeDelta * 12),
    Sunrise: minutesToTime(minutesFromTime(baseFallback.Sunrise) + longitudeOffset - latitudeDelta * 2),
    Dhuhr: minutesToTime(minutesFromTime(baseFallback.Dhuhr) + longitudeOffset),
    Asr: minutesToTime(minutesFromTime(baseFallback.Asr) + longitudeOffset + latitudeDelta * 4),
    Maghrib: minutesToTime(minutesFromTime(baseFallback.Maghrib) + longitudeOffset + latitudeDelta * 4),
    Isha: minutesToTime(minutesFromTime(baseFallback.Isha) + longitudeOffset + latitudeDelta * 18)
  };
}

function mergeTimes(city, semerkandTimes, diyanetTimes, mwlTimes) {
  const fallbackTimes = fallbackFor(city);
  const primary = semerkandTimes || mwlTimes || fallbackTimes;

  return {
    Fajr: medianTime([semerkandTimes?.Fajr, diyanetTimes?.Fajr, mwlTimes?.Fajr], primary.Fajr || fallbackTimes.Fajr),
    Sunrise: primary.Sunrise || mwlTimes?.Sunrise || diyanetTimes?.Sunrise || fallbackTimes.Sunrise,
    Dhuhr: primary.Dhuhr || mwlTimes?.Dhuhr || diyanetTimes?.Dhuhr || fallbackTimes.Dhuhr,
    Asr: primary.Asr || mwlTimes?.Asr || diyanetTimes?.Asr || fallbackTimes.Asr,
    Maghrib: primary.Maghrib || mwlTimes?.Maghrib || diyanetTimes?.Maghrib || fallbackTimes.Maghrib,
    Isha: medianTime([semerkandTimes?.Isha, diyanetTimes?.Isha, mwlTimes?.Isha], primary.Isha || fallbackTimes.Isha)
  };
}

async function getPrayerTimes(cityKey, localDate) {
  const city = getCity(cityKey);
  const [semerkandTimes, diyanetTimes, mwlTimes] = await Promise.all([
    fetchSemerkandTimes(city, localDate).catch(() => null),
    fetchDiyanetTimes(city, localDate).catch(() => null),
    fetchMwlTimes(city, localDate).catch(() => null)
  ]);

  return {
    city,
    dateKey: dateKey(localDate),
    times: mergeTimes(city, semerkandTimes, diyanetTimes, mwlTimes)
  };
}

module.exports = {
  TIME_ZONE,
  prayers,
  addDays,
  partsInTimeZone,
  partsInCopenhagen,
  minutesFromTime,
  cleanTime,
  zonedDateToUtcMs,
  getPrayerTimes
};
