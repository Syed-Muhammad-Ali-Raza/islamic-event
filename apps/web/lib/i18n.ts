import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ur", label: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const RTL_LANGUAGES: readonly string[] = ["ar", "ur"];

const resources = {
  en: {
    translation: {
      nav: {
        events: "Events",
        categories: "Categories",
        organizers: "Organizers",
        addEvent: "Add Event",
        signIn: "Sign in",
        getStarted: "Get Started",
        profile: "Profile",
        savedEvents: "Saved Events",
        myEvents: "My Events",
        adminPanel: "Admin Panel",
        signOut: "Sign out",
        language: "Language",
        search: "Search",
      },
      footer: {
        platform: "Platform",
        community: "Community",
        legal: "Legal",
        tagline:
          "Connecting South Asian communities through religious and cultural events across the globe.",
        events: "Events",
        categories: "Categories",
        organizers: "Organizers",
        addEvent: "Add Event",
        register: "Register",
        signIn: "Sign In",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        rights: "Made with",
        forUmmah: "for the ummah.",
        countries: "Pakistan · India · UK · USA · Canada · UAE · Australia",
        viewingFrom: "You are viewing from",
        detecting: "Detecting your location…",
      },
      hero: {
        titleDiscover: "Discover",
        titleReligious: "Religious",
        titleAmp: "&",
        titleCommunity: "Community Events",
        subtitle:
          "Find Majlis, Milad, Mehfil-e-Naat, Dars and more — connecting communities across Pakistan, India, UK, USA and worldwide.",
        searchPlaceholder: "Search Milad, Majlis, Mehfil-e-Naat…",
        searchButton: "Search Events",
        quick: "Quick:",
        eventsListed: "Events Listed",
        cities: "Cities",
        organizers: "Organizers",
      },
      location: {
        country: "Country",
        state: "State / Region",
        city: "City",
      },
    },
  },
  ur: {
    translation: {
      nav: {
        events: "واقعات",
        categories: "زمرے",
        organizers: "منتظمین",
        addEvent: "واقعہ شامل کریں",
        signIn: "سائن اِن",
        getStarted: "شروع کریں",
        profile: "پروفائل",
        savedEvents: "محفوظ واقعات",
        myEvents: "میرے واقعات",
        adminPanel: "ایڈمن پینل",
        signOut: "سائن آؤٹ",
        language: "زبان",
        search: "تلاش",
      },
      footer: {
        platform: "پلیٹ فارم",
        community: "کمیونٹی",
        legal: "قانونی",
        tagline:
          "پوری دنیا میں جنوبی ایشیائی کمیونٹیز کو مذہبی اور ثقافتی واقعات کے ذریعے جوڑنا۔",
        events: "واقعات",
        categories: "زمرے",
        organizers: "منتظمین",
        addEvent: "واقعہ شامل کریں",
        register: "رجسٹر کریں",
        signIn: "سائن اِن",
        privacy: "رازداری کی پالیسی",
        terms: "خدمات کی شرائط",
        rights: "محبت کے ساتھ",
        forUmmah: "امہ کے لیے۔",
        countries: "پاکستان · بھارت · برطانیہ · امریکہ · کینیڈا · یو اے اے · آسٹریلیا",
        viewingFrom: "آپ یہاں سے دیکھ رہے ہیں",
        detecting: "آپ کا مقام معلوم کیا جا رہا ہے…",
      },
      hero: {
        titleDiscover: "دریافت کریں",
        titleReligious: "مذہبی",
        titleAmp: "و",
        titleCommunity: "کمیونٹی واقعات",
        subtitle:
          "مجلس، میلاد، محفلِ نعت، درس وغیرہ تلاش کریں — پاکستان، بھارت، برطانیہ، امریکہ اور دنیا بھر میں کمیونٹیوں کو جوڑتے ہوئے۔",
        searchPlaceholder: "میلاد، مجلس، محفلِ نعت تلاش کریں…",
        searchButton: "واقعات تلاش کریں",
        quick: "فوری:",
        eventsListed: "فہرست میں واقعات",
        cities: "شہر",
        organizers: "منتظمین",
      },
      location: {
        country: "ملک",
        state: "صوبہ / علاقہ",
        city: "شہر",
      },
    },
  },
  hi: {
    translation: {
      nav: {
        events: "इवेंट्स",
        categories: "श्रेणियाँ",
        organizers: "आयोजक",
        addEvent: "इवेंट जोड़ें",
        signIn: "साइन इन",
        getStarted: "शुरू करें",
        profile: "प्रोफ़ाइल",
        savedEvents: "सहेजे गए इवेंट्स",
        myEvents: "मेरे इवेंट्स",
        adminPanel: "एडमिन पैनल",
        signOut: "साइन आउट",
        language: "भाषा",
        search: "खोजें",
      },
      footer: {
        platform: "प्लेटफ़ॉर्म",
        community: "कम्युनिटी",
        legal: "कानूनी",
        tagline:
          "धार्मिक और सांस्कृतिक आयोजनों के ज़रिए दक्षिण एशियाई समुदायों को दुनिया भर में जोड़ना।",
        events: "इवेंट्स",
        categories: "श्रेणियाँ",
        organizers: "आयोजक",
        addEvent: "इवेंट जोड़ें",
        register: "पंजीकरण करें",
        signIn: "साइन इन",
        privacy: "गोपनीयता नीति",
        terms: "सेवा की शर्तें",
        rights: "प्यार के साथ बनाया गया",
        forUmmah: "उम्मह के लिए।",
        countries: "पाकिस्तान · भारत · UK · USA · कनाडा · UAE · ऑस्ट्रेलिया",
        viewingFrom: "आप यहाँ से देख रहे हैं",
        detecting: "आपका स्थान पता लगाया जा रहा है…",
      },
      hero: {
        titleDiscover: "खोजें",
        titleReligious: "धार्मिक",
        titleAmp: "और",
        titleCommunity: "कम्युनिटी इवेंट्स",
        subtitle:
          "मजलिस, मीलाद, मेहफ़िल-ए-नात, दर्स और बहुत कुछ खोजें — पाकिस्तान, भारत, UK, USA और दुनिया भर में समुदायों को जोड़ते हुए।",
        searchPlaceholder: "मीलाद, मजलिस, मेहफ़िल-ए-नात खोजें…",
        searchButton: "इवेंट्स खोजें",
        quick: "त्वरित:",
        eventsListed: "सूचीबद्ध इवेंट्स",
        cities: "शहर",
        organizers: "आयोजक",
      },
      location: {
        country: "देश",
        state: "राज्य / क्षेत्र",
        city: "शहर",
      },
    },
  },
  ar: {
    translation: {
      nav: {
        events: "الفعاليات",
        categories: "الفئات",
        organizers: "المنظّمون",
        addEvent: "أضف فعالية",
        signIn: "تسجيل الدخول",
        getStarted: "ابدأ الآن",
        profile: "الملف الشخصي",
        savedEvents: "الفعاليات المحفوظة",
        myEvents: "فعالياتي",
        adminPanel: "لوحة الإدارة",
        signOut: "تسجيل الخروج",
        language: "اللغة",
        search: "بحث",
      },
      footer: {
        platform: "المنصة",
        community: "المجتمع",
        legal: "قانوني",
        tagline:
          "نربط مجتمعات جنوب آسيا عبر الفعاليات الدينية والثقافية حول العالم.",
        events: "الفعاليات",
        categories: "الفئات",
        organizers: "المنظّمون",
        addEvent: "أضف فعالية",
        register: "التسجيل",
        signIn: "تسجيل الدخول",
        privacy: "سياسة الخصوصية",
        terms: "شروط الخدمة",
        rights: "صُنع بـ",
        forUmmah: "للأمة.",
        countries: "باكستان · الهند · بريطانيا · أمريكا · كندا · الإمارات · أستراليا",
        viewingFrom: "أنت تتصفح من",
        detecting: "جارٍ تحديد موقعك…",
      },
      hero: {
        titleDiscover: "اكتشف",
        titleReligious: "الدينية",
        titleAmp: "و",
        titleCommunity: "فعاليات المجتمع",
        subtitle:
          "اعثر على مجلس ومولّد ومحيط نعت ودرس والمزيد — نربط المجتمعات في باكستان والهند وبريطانيا وأمريكا وحول العالم.",
        searchPlaceholder: "ابحث عن مولّد، مجلس، محيط نعت…",
        searchButton: "ابحث عن الفعاليات",
        quick: "سريع:",
        eventsListed: "فعاليات مُدرجة",
        cities: "مدن",
        organizers: "منظّمون",
      },
      location: {
        country: "الدولة",
        state: "المنطقة / الولاية",
        city: "المدينة",
      },
    },
  },
};

const STORAGE_KEY = "ce-lang";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

export function applyDocumentLang(code: string) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = code;
  document.documentElement.dir = RTL_LANGUAGES.includes(code) ? "rtl" : "ltr";
}

i18n.on("languageChanged", (code) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }
  applyDocumentLang(code);
});

export function getStoredLanguage(): LanguageCode | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      return stored as LanguageCode;
    }
  } catch {
    /* ignore */
  }
  const browser = navigator.language?.slice(0, 2).toLowerCase();
  if (browser && LANGUAGES.some((l) => l.code === browser)) {
    return browser as LanguageCode;
  }
  return null;
}

export default i18n;
