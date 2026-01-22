import type { ZwiftWorldAvailability, ZwiftWorldAvailabilityRequest } from "@lupin/types";

const SCHEDULE_URL = "https://zwiftinsider.com/schedule/";
const SCHEDULE_TTL_MS = 1000 * 60 * 60 * 6;
const DEFAULT_TIMEZONE = "UTC";
const MONTH_SLUGS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec"
];

const WORLD_NAME_TO_ID = new Map<string, number>([
  ["watopia", 1],
  ["richmond", 2],
  ["london", 3],
  ["new york", 4],
  ["nyc", 4],
  ["innsbruck", 5],
  ["bologna", 6],
  ["yorkshire", 7],
  ["crit city", 8],
  ["makuri islands", 9],
  ["makuri island", 9],
  ["makuri", 9],
  ["france", 10],
  ["paris", 11],
  ["scotland", 13]
]);

type ScheduleCacheEntry = {
  fetchedAt: number;
  schedule: Map<string, string[]>;
};

const scheduleCache = new Map<string, ScheduleCacheEntry>();

const normalizeWorldName = (value: string) =>
  value.trim().replace(/\s+/g, " ");

const normalizeWorldKey = (value: string) =>
  normalizeWorldName(value).toLowerCase().replace(/[^a-z0-9 ]/g, "");

const decodeHtml = (value: string) =>
  value.replace(/&amp;/g, "&").replace(/&#8211;/g, "-").replace(/&#8230;/g, "...");

const ensureTimeZone = (timeZone?: string) => {
  if (!timeZone) {
    return DEFAULT_TIMEZONE;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};

const parseDateInput = (date?: string, timeZone?: string) => {
  const resolvedTimeZone = ensureTimeZone(timeZone);
  if (date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) {
      throw new Error("Date must be in YYYY-MM-DD format.");
    }
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      dateString: date,
      timeZone: resolvedTimeZone
    };
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolvedTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;

  return { year, month, day, dateString, timeZone: resolvedTimeZone };
};

const buildScheduleUrl = (year: number, month: number) => {
  const slug = MONTH_SLUGS[month - 1];
  return `${SCHEDULE_URL}?grid-list-toggle=grid&month=${slug}&yr=${year}`;
};

const formatDateString = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const parseScheduleHtml = (html: string, year: number, month: number) => {
  const schedule = new Map<string, string[]>();
  const dayRegex = /<td class="spiffy-day-[^"]*day-with-date"[^>]*>(.*?)<\/td>/gs;
  const dayNumberRegex = /<span class="day-number[^"]*">(\d+)<\/span>/;
  const titleRegex = /class="spiffy-title">([^<]+)<\/span>/g;

  for (const match of html.matchAll(dayRegex)) {
    const cell = match[1];
    const dayMatch = cell.match(dayNumberRegex);
    if (!dayMatch) {
      continue;
    }
    const day = Number(dayMatch[1]);
    if (!Number.isFinite(day)) {
      continue;
    }
    const titles = Array.from(cell.matchAll(titleRegex))
      .map((entry) => normalizeWorldName(decodeHtml(entry[1])))
      .filter((value) => value.length > 0);
    if (!titles.length) {
      continue;
    }
    const unique = Array.from(new Set(titles));
    schedule.set(formatDateString(year, month, day), unique);
  }

  return schedule;
};

const fetchScheduleForMonth = async (year: number, month: number) => {
  const cacheKey = `${year}-${String(month).padStart(2, "0")}`;
  const cached = scheduleCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < SCHEDULE_TTL_MS) {
    return cached.schedule;
  }

  const response = await fetch(buildScheduleUrl(year, month));
  if (!response.ok) {
    throw new Error("Failed to fetch Zwift Insider schedule.");
  }
  const html = await response.text();
  const schedule = parseScheduleHtml(html, year, month);

  scheduleCache.set(cacheKey, { fetchedAt: Date.now(), schedule });
  return schedule;
};

export const resolveWorldIds = (worlds: string[]) => {
  const ids: number[] = [];
  const seen = new Set<number>();
  for (const world of worlds) {
    const key = normalizeWorldKey(world);
    const id = WORLD_NAME_TO_ID.get(key);
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
};

export const fetchZwiftWorldAvailability = async (
  payload: ZwiftWorldAvailabilityRequest
): Promise<ZwiftWorldAvailability> => {
  const { year, month, dateString, timeZone } = parseDateInput(
    payload.date,
    payload.timezone
  );
  const schedule = await fetchScheduleForMonth(year, month);
  const guestWorlds = schedule.get(dateString) ?? [];
  const availableWorlds = Array.from(new Set(["Watopia", ...guestWorlds]));

  return {
    date: dateString,
    timezone: timeZone,
    guestWorlds,
    availableWorlds
  };
};
