/**
 * Data Manager - Handles fetching and managing vocabulary data
 */
class DataManager {
    constructor() {
        this.vocabularyData = [];
        this.wrongAttempts = {};
        this.starredWords = {};
        this.currentFilters = {
            timeFilter: 'today',
            wordFilter: 'all',
            customStartDate: null,
            customEndDate: null
        };
    }

    /**
     * Initialize data manager
     */
    async init() {
        await this.loadWrongAttempts();
        await this.loadStarredWords();
    }

    /**
     * Load wrong attempts from Firebase
     */
    async loadWrongAttempts() {
        try {
            const snapshot = await wrongAttemptsCollection.get();
            snapshot.forEach(doc => {
                this.wrongAttempts[doc.id] = doc.data();
            });
            console.log('Wrong attempts loaded:', this.wrongAttempts);
        } catch (error) {
            console.error('Error loading wrong attempts:', error);
        }
    }

    /**
     * Load starred words from Firebase
     */
    async loadStarredWords() {
        try {
            const snapshot = await starredWordsCollection.get();
            snapshot.forEach(doc => {
                this.starredWords[doc.id] = true;
            });
            console.log('Starred words loaded:', this.starredWords);
        } catch (error) {
            console.error('Error loading starred words:', error);
        }
    }

    /**
     * Format date as ddmmyy
     */
    formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return day + month + year;
    }

    /**
     * Get dates based on time filter
     */
    getDatesForTimeFilter(filter) {
        const today = new Date();
        const dates = [];

        switch (filter) {
            case 'today':
                dates.push(this.formatDate(today));
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                dates.push(this.formatDate(yesterday));
                break;
            case 'this-week':
                // Get dates from current week (Sunday to Saturday)
                const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
                for (let i = 0; i <= currentDay; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    dates.push(this.formatDate(date));
                }
                break;
            case 'last-week':
                // Get dates from last week
                const lastWeekStart = new Date(today);
                lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7); // Previous Sunday
                
                for (let i = 0; i < 7; i++) {
                    const date = new Date(lastWeekStart);
                    date.setDate(date.getDate() + i);
                    dates.push(this.formatDate(date));
                }
                break;
            case 'last-month':
                // Get dates from last 30 days
                for (let i = 1; i <= 30; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    dates.push(this.formatDate(date));
                }
                break;
            case 'custom':
                if (this.currentFilters.customStartDate && this.currentFilters.customEndDate) {
                    let currentDate = new Date(this.currentFilters.customStartDate);
                    const endDate = new Date(this.currentFilters.customEndDate);
                    
                    while (currentDate <= endDate) {
                        dates.push(this.formatDate(new Date(currentDate)));
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
                break;
            case 'specific-days':
                // Get today, previous day, 2, 3, 5, 7, 15, 30, 60 days ago
                const specificDays = [0, 1, 2, 3, 5, 7, 15, 30, 60];
                
                for (const days of specificDays) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - days);
                    dates.push(this.formatDate(date));
                }
                break;
            default:
                dates.push(this.formatDate(today));
        }

        return dates;
    }

    /**
     * Fetch and load JSON files based on filters
     */
    async fetchVocabularyData(filters = null) {
        if (filters) {
            this.currentFilters = { ...this.currentFilters, ...filters };
        }

        const dates = this.getDatesForTimeFilter(this.currentFilters.timeFilter);
        this.vocabularyData = [];

        // Fetch data for each date
        for (const date of dates) {
            try {
                const response = await fetch(`${date}.json`);
                if (response.ok) {
                    const data = await response.json();
                    this.vocabularyData = [...this.vocabularyData, ...data];
                }
            } catch (error) {
                console.log(`No data found for date: ${date}`);
            }
        }

        // Apply word filter
        this.applyWordFilter();

        return this.vocabularyData;
    }

    /**
     * Apply word filter to vocabulary data
     */
    applyWordFilter() {
        switch (this.currentFilters.wordFilter) {
            case 'wrong':
                // Filter to show words with wrong attempts first
                this.vocabularyData.sort((a, b) => {
                    const wrongCountA = this.wrongAttempts[a.id]?.count || 0;
                    const wrongCountB = this.wrongAttempts[b.id]?.count || 0;
                    return wrongCountB - wrongCountA;
                });
                break;
            case 'starred':
                // Filter to show only starred words
                this.vocabularyData = this.vocabularyData.filter(word => 
                    this.starredWords[word.id]
                );
                break;
            case 'random':
                // Randomly shuffle the words
                this.shuffleArray(this.vocabularyData);
                break;
            default:
                // Default: keep as is
                break;
        }
    }

    /**
     * Fisher-Yates shuffle algorithm
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Track wrong attempt for a word
     */
    async trackWrongAttempt(wordId) {
        try {
            if (!this.wrongAttempts[wordId]) {
                this.wrongAttempts[wordId] = { count: 1, correctStreak: 0 };
            } else {
                this.wrongAttempts[wordId].count += 1;
                this.wrongAttempts[wordId].correctStreak = 0;
            }

            await wrongAttemptsCollection.doc(wordId).set(this.wrongAttempts[wordId]);
        } catch (error) {
            console.error('Error tracking wrong attempt:', error);
        }
    }

    /**
     * Track correct attempt for a word
     */
    async trackCorrectAttempt(wordId) {
        try {
            if (this.wrongAttempts[wordId]) {
                this.wrongAttempts[wordId].correctStreak += 1;
                
                // If correct 3 times in a row, remove from wrong attempts
                if (this.wrongAttempts[wordId].correctStreak >= 3) {
                    delete this.wrongAttempts[wordId];
                    await wrongAttemptsCollection.doc(wordId).delete();
                } else {
                    await wrongAttemptsCollection.doc(wordId).set(this.wrongAttempts[wordId]);
                }
            }
        } catch (error) {
            console.error('Error tracking correct attempt:', error);
        }
    }

    /**
     * Toggle starred status for a word
     */
    async toggleStarredWord(wordId) {
        try {
            if (this.starredWords[wordId]) {
                delete this.starredWords[wordId];
                await starredWordsCollection.doc(wordId).delete();
                return false;
            } else {
                this.starredWords[wordId] = true;
                await starredWordsCollection.doc(wordId).set({ starred: true });
                return true;
            }
        } catch (error) {
            console.error('Error toggling starred word:', error);
            return this.starredWords[wordId] || false;
        }
    }

    /**
     * Check if a word is starred
     */
    isWordStarred(wordId) {
        return !!this.starredWords[wordId];
    }

    /**
     * Get wrong attempt count for a word
     */
    getWrongAttemptCount(wordId) {
        return this.wrongAttempts[wordId]?.count || 0;
    }
}

// Create and initialize data manager
const dataManager = new DataManager();