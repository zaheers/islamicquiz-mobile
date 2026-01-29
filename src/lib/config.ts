// Web Logic Parity Constants

export const QUIZ_CONFIG = {
    // Default number of questions per quiz (matches web 'state.numQuestions || 12')
    DEFAULT_QUESTION_COUNT: 12,

    // Default time per question in seconds (matches web 'state.timePerQ || 20')
    DEFAULT_TIME_PER_QUESTION: 20,

    // Delay before auto-advancing after answer (matches web 'setTimeout(..., 1200)')
    AUTO_ADVANCE_DELAY_MS: 1200,

    // Collections
    COLLECTION_QUESTIONS: 'questions',
    COLLECTION_CATEGORIES: 'categories', // Not used in mobile yet (hardcoded)
};
