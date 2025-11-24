export const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

export const isYesterday = (date: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();
};

export const calculateStreak = (lastCompleted: Date | null, currentStreak: number): number => {
    if (!lastCompleted) {
        return 1;
    }

    if (isToday(lastCompleted)) {
        return currentStreak;
    }

    if (isYesterday(lastCompleted)) {
        return currentStreak + 1;
    }

    return 1;
};
