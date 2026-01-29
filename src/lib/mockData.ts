import { Category, QuizData } from './types';

export const categories: Category[] = [
    {
        id: 1,
        title: "Quran",
        slug: "quran",
        icon: "📖",
        description: "Revelations, Surahs, and meanings",
    },
    {
        id: 2,
        title: "Prophets",
        slug: "prophets",
        icon: "📩",
        description: "Lives and missions of the Prophets",
    },
    {
        id: 3,
        title: "Hadith",
        slug: "hadith",
        icon: "📜",
        description: "Sayings and teachings of the Prophet ﷺ",
    },
    {
        id: 4,
        title: "Salah",
        slug: "salah",
        icon: "🕌",
        description: "Daily prayers, timings, and meaning",
    },
    {
        id: 5,
        title: "Hajj & Umrah",
        slug: "hajj-and-umrah",
        icon: "🕋",
        description: "Rites and meaning of pilgrimage",
    },
    {
        id: 6,
        title: "Zakat & Finance",
        slug: "zakat-finance",
        icon: "💰",
        description: "Charity and Islamic finance principles",
    },
    {
        id: 7,
        title: "Names of Allah",
        slug: "names-of-allah",
        icon: "🌙",
        description: "Meanings and significance of Allah's 99 names",
    },
];

export const quizData: QuizData = {
    quran: [
        {
            question: "How many Surahs are there in the Quran?",
            options: ["114", "110", "120", "99"],
            answer: "114",
            explanation: "The Quran is composed of 114 chapters (Surahs) revealed over 23 years."
        },
        {
            question: "Which Surah is known as the Heart of the Quran?",
            options: ["Yaseen", "Rahman", "Ikhlas", "Baqarah"],
            answer: "Yaseen",
            explanation: "Surah Yaseen is known as the heart of the Quran due to its comprehensive message and emphasis on the Hereafter."
        },
        {
            question: "Which Surah has the most verses?",
            options: ["Al-Baqarah", "Al-Imran", "An-Nisa", "Al-Kahf"],
            answer: "Al-Baqarah",
            explanation: "Surah Al-Baqarah is the longest Surah with 286 verses and was revealed in Medina."
        }
    ],
    hadith: [
        {
            question: "Who compiled Sahih al-Bukhari?",
            options: ["Imam Muslim", "Imam Bukhari", "Imam Abu Dawood", "Imam Tirmidhi"],
            answer: "Imam Bukhari",
            explanation: "Sahih al-Bukhari is a highly authentic collection of Hadiths compiled by Imam Muhammad al-Bukhari."
        },
        {
            question: "What does the term 'Hadith' refer to?",
            options: ["Chapters of the Quran", "Sayings and actions of the Prophet ﷺ", "Islamic jurisprudence", "Quranic grammar"],
            answer: "Sayings and actions of the Prophet ﷺ",
            explanation: "Hadiths are the recorded sayings, actions, and approvals of Prophet Muhammad ﷺ."
        },
        {
            question: "Which Hadith book is considered second most authentic after Bukhari?",
            options: ["Sunan Abu Dawood", "Sahih Muslim", "Sunan Tirmidhi", "Musnad Ahmad"],
            answer: "Sahih Muslim",
            explanation: "Sahih Muslim is second only to Bukhari in authenticity among the six major Hadith collections."
        }
    ],
    prophets: [
        {
            question: "Who was the first prophet in Islam?",
            options: ["Ibrahim (AS)", "Adam (AS)", "Nuh (AS)", "Isa (AS)"],
            answer: "Adam (AS)",
            explanation: "Adam (AS) is considered the first human and the first prophet in Islam."
        },
        {
            question: "Which prophet built the Kaaba with his son?",
            options: ["Musa (AS)", "Ibrahim (AS)", "Nuh (AS)", "Isa (AS)"],
            answer: "Ibrahim (AS)",
            explanation: "Prophet Ibrahim (AS) and his son Ismail (AS) rebuilt the Kaaba in Mecca."
        },
        {
            question: "Which prophet was swallowed by a whale?",
            options: ["Yusuf (AS)", "Musa (AS)", "Yunus (AS)", "Lut (AS)"],
            answer: "Yunus (AS)",
            explanation: "Prophet Yunus (AS) was swallowed by a whale as a trial from Allah and later released."
        }
    ],
    salah: [
        {
            question: "How many obligatory prayers are there in a day?",
            options: ["3", "4", "5", "6"],
            answer: "5",
            explanation: "Muslims are required to pray five times a day: Fajr, Dhuhr, Asr, Maghrib, and Isha."
        },
        {
            question: "Which prayer is performed before sunrise?",
            options: ["Fajr", "Dhuhr", "Asr", "Maghrib"],
            answer: "Fajr",
            explanation: "Fajr prayer consists of two rak'ahs and is performed before sunrise."
        },
        {
            question: "What do Muslims face during prayer?",
            options: ["Jerusalem", "Kaaba", "Medina", "Mount Sinai"],
            answer: "Kaaba",
            explanation: "Muslims face the Kaaba in Mecca when performing Salah, known as the Qibla direction."
        }
    ],
    "hajj-umrah": [
        {
            question: "What is the name of the pilgrimage made during Dhul-Hijjah?",
            options: ["Umrah", "Tawaf", "Hajj", "Ziyarat"],
            answer: "Hajj",
            explanation: "Hajj is the annual pilgrimage to Mecca during the month of Dhul-Hijjah and is obligatory once in a lifetime."
        },
        {
            question: "What is the act of walking around the Kaaba called?",
            options: ["Sa’i", "Ruku", "Tawaf", "Takbir"],
            answer: "Tawaf",
            explanation: "Tawaf is the act of circumambulating the Kaaba seven times counterclockwise."
        },
        {
            question: "Which two hills are walked between during Umrah?",
            options: ["Safa and Marwah", "Arafat and Mina", "Uhud and Quba", "Thawr and Hira"],
            answer: "Safa and Marwah",
            explanation: "Pilgrims walk between Safa and Marwah in remembrance of Hajar’s search for water."
        }
    ],
    "zakat-finance": [
        {
            question: "What is Zakat?",
            options: ["Voluntary charity", "Islamic loan", "Obligatory almsgiving", "Business tax"],
            answer: "Obligatory almsgiving",
            explanation: "Zakat is a mandatory form of charity that purifies wealth, usually 2.5% of savings annually."
        },
        {
            question: "What is the minimum wealth (Nisab) required before Zakat is due?",
            options: ["Equivalent to 50g gold", "No minimum", "One camel", "A year of salary"],
            answer: "Equivalent to 50g gold",
            explanation: "Nisab is the threshold (often 85g gold or its cash equivalent) that triggers Zakat obligation."
        },
        {
            question: "Which of the following is NOT Zakat-eligible?",
            options: ["Gold", "Savings", "Business inventory", "Personal home"],
            answer: "Personal home",
            explanation: "Your personal residence is not subject to Zakat as it’s considered a basic need."
        }
    ]
};
