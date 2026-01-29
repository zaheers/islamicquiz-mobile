export const QUIZ_CONFIG = {
    // Default number of questions per quiz matches Web Default (12)
    DEFAULT_QUESTION_COUNT: 12,

    // Default time per question in seconds
    DEFAULT_TIME_PER_QUESTION_SEC: 20,

    // Delay before auto-advancing after answer
    AUTO_ADVANCE_DELAY_MS: 1200,

    // Collections
    COLLECTION_QUESTIONS: 'questions',
    COLLECTION_CATEGORIES: 'categories',
} as const;
