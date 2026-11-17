import { cityKey } from "./cities";

/**
 * Rule-based intent planning for the Community Assistant.
 *
 * No LLM, no network: the widget calls this on every message and only fires an
 * API request when the message is an event lookup. Keeping it pure makes the
 * multilingual matching cheap to test and impossible to hallucinate.
 */

export type AssistantIntent = "faq" | "events" | "greeting" | "thanks" | "unknown";

export type FaqTopic =
  | "register"
  | "rsvp"
  | "verify"
  | "password"
  | "create"
  | "report"
  | "directories"
  | "saved";

export interface AssistantEventQuery {
  search?: string;
  city?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AssistantPlan {
  intent: AssistantIntent;
  faq?: FaqTopic;
  filters?: AssistantEventQuery;
}

interface CityRef {
  name: string;
  slug: string;
}

const FAQ_KEYWORDS: Record<FaqTopic, string[]> = {
  register: [
    "register", "sign up", "signup", "create account", "new account", "account",
    "رجسٹر", "اکاؤنٹ", "سائن اپ", "पंजीकरण", "खाता", "साइन अप",
    "تسجيل", "حساب", "إنشاء حساب", "أسجّل", "سجل",
  ],
  rsvp: [
    "rsvp", "attend", "interested", "attending", "book my spot", "how to join",
    "شرکت", "حاضری", "شرکت کیسے", "उपस्थित", "रएसवीपी", "शामिल",
    "حضور", "المشاركة", "كيف أحضر",
  ],
  verify: [
    "verify", "verification", "confirm email", "activation",
    "تصدیق", "ای میل تصدیق", "पुष्टि", "वेरिफाई", "تحقق", "التأكيد",
  ],
  password: [
    "password", "forgot password", "reset password", "login problem",
    "پاسورڈ", "پاس ورڈ", "پاسورڈ بھول", "पासवर्ड", "पासवर्ड भूल",
    "كلمة المرور", "نسيت كلمة المرور",
  ],
  create: [
    "create event", "publish event", "add event", "organize an event", "host an event",
    "ایونٹ بنائیں", "تقریب شامل", "कार्यक्रम बनाएं", "इवेंट जोड़ें",
    "إنشاء فعالية", "أضف حدثا",
  ],
  report: [
    "report", "complaint", "wrong information", "inappropriate",
    "شکایت", "رپورٹ", "غلط معلومات", "रिपोर्ट", "शिकायत", "गलत जानकारी",
    "بلاغ", "شكوى", "معلومات خاطئة", "أبلّغ", "ابلغ",
  ],
  directories: [
    "dastarkhwan", "langar", "free food", "imambargah", "imam bargah", "darbar",
    "shrine", "scholar", "charity", "donate", "free meal", "community register",
    "لنگر", "دسترخوان", "امامبارگاہ", "دربار", "عالم", "خیرات",
    "दस्तरखान", "लंगर", "इमामबाड़ा", "दरबार", "विद्वान", "दान",
    "مائدة", "إمامباركة", "ضريح", "عالم", "صدقة",
  ],
  saved: [
    "saved events", "shortlist", "bookmark", "favourites", "favorites",
    "محفوظ", "پسندیدہ", "सहेजा", "पसंदीदा", "المحفوظة", "المفضلة",
  ],
};

const EVENT_KEYWORDS = [
  "event", "events", "upcoming", "happening", "find", "search", "program", "programme",
  "milad", "majlis", "mehfil", "naat", "dars", "iftar", "quran khwani", "urs",
  "expo", "mela", "function", "schedule", "calendar", "near me",
  "تقریب", "تقریبات", "مجلس", "میلاد", "محفل", "درس", "افطاری", "عرس", "میلہ", "ایونٹ", "تلاش",
  "कार्यक्रम", "मजलिस", "मीलाद", "मेहफिल", "दर्स", "इफ्तार", "उर्स", "मेला", "इवेंट", "खोजें",
  "فعالية", "فعاليات", "مولد", "محفل", "إفطار", "مهرجان", "حدث", "ابحث",
];

const GREETINGS = [
  "hello", "hi ", "hey", "salam", "assalam", "good morning", "good evening",
  "السلام", "مرحبا", "ہیلو", "سلام", "नमस्ते", "नमस्कार", "हेलो",
];

const THANKS = ["thanks", "thank you", "shukriya", "شکریہ", "धन्यवाद", "شكرا"];

const STOPWORDS = new Set([
  "a", "an", "the", "in", "on", "at", "for", "of", "to", "me", "my", "is", "are",
  "event", "events", "upcoming", "happening", "find", "show", "search", "please", "near", "this",
  "next", "week", "month", "today", "tomorrow", "weekend", "me?", "and", "any",
  "what", "which", "where", "when", "there", "some", "events?", "event?",
]);

const DATE_PHRASES = [
  { words: ["tomorrow", "کل", "कल", "غدا"], offset: 1 },
  { words: ["today", "آج", "आज", "اليوم"], offset: 0 },
];

function isoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateWindow(text: string, now: Date): { fromDate?: string; toDate?: string } {
  for (const phrase of DATE_PHRASES) {
    if (phrase.words.some((word) => text.includes(word))) {
      const day = addDays(now, phrase.offset);
      return { fromDate: isoDate(day), toDate: isoDate(day) };
    }
  }

  if (["weekend", "ہفتہ", "सप्ताहांत", "نهاية الأسبوع"].some((word) => text.includes(word))) {
    const day = now.getDay(); // 0 = Sunday
    const daysUntilFriday = (5 - day + 7) % 7;
    const friday = addDays(now, daysUntilFriday === 0 && day !== 5 ? 7 : daysUntilFriday);
    return { fromDate: isoDate(friday), toDate: isoDate(addDays(friday, 2)) };
  }

  if (["this week", "اس ہفتے", "इस सप्ताह", "هذا الأسبوع"].some((word) => text.includes(word))) {
    return { fromDate: isoDate(now), toDate: isoDate(addDays(now, 7)) };
  }

  if (["next month", "اگلے مہینے", "अगले महीने", "الشهر القادم"].some((word) => text.includes(word))) {
    const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { fromDate: isoDate(first), toDate: isoDate(last) };
  }

  return {};
}

/** Turn a plain-language question into API filters (or `null` if not a lookup). */
export function extractEventQuery(
  message: string,
  cities: CityRef[],
  now: Date = new Date()
): AssistantEventQuery | null {
  // Pad and de-punctuate so "Lahore?" and "...in Lahore," still match a city.
  const text = ` ${message.trim().toLowerCase().replace(/[.,!?؛:۔؟،()"]/g, " ")} `;
  if (!text.trim()) return null;

  const signalsEvent = EVENT_KEYWORDS.some((word) => text.includes(word));
  const window = dateWindow(text, now);
  const hasDates = Boolean(window.fromDate || window.toDate);

  // Longest first so "Rahim Yar Khan" wins over "Khan"/"Yar".
  const city = [...cities]
    .filter((entry) => entry.name.length > 1)
    .sort((a, b) => b.name.length - a.name.length)
    .find((entry) => text.includes(` ${cityKey(entry.name)} `));

  if (!signalsEvent && !hasDates && !city) return null;

  let remainder = text;
  if (city) remainder = remainder.replace(cityKey(city.name), " ");
  for (const phrase of DATE_PHRASES) {
    for (const word of phrase.words) remainder = remainder.split(word).join(" ");
  }
  for (const word of [
    "weekend", "ہفتہ", "सप्ताहांत", "نهاية الأسبوع",
    "this week", "اس ہفتے", "इस सप्ताह", "هذا الأسبوع",
    "next month", "اگلے مہینے", "अगले महीने", "الشهر القادم",
  ]) {
    remainder = remainder.split(word).join(" ");
  }

  const search = remainder
    .split(/[\s,!?۔؟،]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
    .join(" ")
    .trim();

  return {
    ...(search ? { search } : {}),
    ...(city ? { city: city.slug } : {}),
    ...window,
  };
}

/** Decide how the assistant should answer a message. */
export function planAssistantMessage(
  message: string,
  cities: CityRef[] = [],
  now: Date = new Date()
): AssistantPlan {
  const text = message.trim().toLowerCase();

  // FAQ first: "how do I RSVP for the milad in Lahore?" is a support question,
  // not an event search, even though it mentions a city and an event type.
  for (const topic of Object.keys(FAQ_KEYWORDS) as FaqTopic[]) {
    if (FAQ_KEYWORDS[topic].some((word) => text.includes(word))) {
      return { intent: "faq", faq: topic };
    }
  }

  const filters = extractEventQuery(message, cities, now);
  if (filters) return { intent: "events", filters };

  if (GREETINGS.some((word) => text.includes(word))) return { intent: "greeting" };
  if (THANKS.some((word) => text.includes(word))) return { intent: "thanks" };

  return { intent: "unknown" };
}
