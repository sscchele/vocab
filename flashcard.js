/**
 * Flashcard Manager - Handles flashcard functionality
 */
class FlashcardManager {
    constructor() {
        this.words = [];
        this.currentIndex = 0;
        
        // DOM Elements
        this.flashcardEl = document.getElementById('flashcard');
        this.wordEl = document.getElementById('word');
        this.meaningEl = document.getElementById('meaning');
        this.synonymsEl = document.getElementById('synonyms');
        this.starBtnEl = document.getElementById('star-btn');
        this.prevBtnEl = document.getElementById('prev-btn');
        this.nextBtnEl = document.getElementById('next-btn');
        this.cardCounterEl = document.getElementById('card-counter');
        this.applyFiltersBtn = document.getElementById('apply-filters');
        this.timeFilterEl = document.getElementById('time-filter');
        this.wordFilterEl = document.getElementById('word-filter');
        this.customDatesEl = document.getElementById('custom-dates');
        this.customDateStartEl = document.getElementById('custom-date-start');
        this.customDateEndEl = document.getElementById('custom-date-end');
        this.applyDateBtn = document.getElementById('apply-date');
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize flashcard manager
     */
    async init() {
        // Initialize data manager
        await dataManager.init();
        
        // Load initial data
        await this.loadData();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        // Flashcard click to flip
        this.flashcardEl.addEventListener('click', (e) => {
            // Don't flip if clicking on star button
            if (e.target !== this.starBtnEl && e.target.closest('.star-btn') !== this.starBtnEl) {
                this.flashcardEl.classList.toggle('flipped');
            }
        });
        
        // Navigation buttons
        this.prevBtnEl.addEventListener('click', () => this.showPrevCard());
        this.nextBtnEl.addEventListener('click', () => this.showNextCard());
        
        // Star button
        this.starBtnEl.addEventListener('click', () => this.toggleStarredWord());
        
        // Filter controls
        this.applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        
        // Time filter change
        this.timeFilterEl.addEventListener('change', () => {
            if (this.timeFilterEl.value === 'custom') {
                this.customDatesEl.classList.remove('hidden');
            } else {
                this.customDatesEl.classList.add('hidden');
            }
        });
        
        // Apply custom date
        this.applyDateBtn.addEventListener('click', () => {
            this.applyFilters();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.showPrevCard();
            } else if (e.key === 'ArrowRight') {
                this.showNextCard();
            } else if (e.key === ' ' || e.key === 'Spacebar') {
                this.flashcardEl.classList.toggle('flipped');
                e.preventDefault();
            }
        });
    }
    
    /**
     * Load data with current filters
     */
    async loadData() {
        try {
            this.words = await dataManager.fetchVocabularyData();
            
            if (this.words.length > 0) {
                this.currentIndex = 0;
                this.displayCurrentCard();
            } else {
                this.showNoWordsMessage();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showErrorMessage();
        }
    }
    
    /**
     * Apply selected filters
     */
    async applyFilters() {
        const filters = {
            timeFilter: this.timeFilterEl.value,
            wordFilter: this.wordFilterEl.value
        };
        
        if (filters.timeFilter === 'custom') {
            filters.customStartDate = this.customDateStartEl.value;
            filters.customEndDate = this.customDateEndEl.value;
        }
        
        try {
            this.words = await dataManager.fetchVocabularyData(filters);
            
            if (this.words.length > 0) {
                this.currentIndex = 0;
                this.displayCurrentCard();
            } else {
                this.showNoWordsMessage();
            }
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showErrorMessage();
        }
    }
    
    /**
     * Display the current flashcard
     */
    displayCurrentCard() {
        const currentWord = this.words[this.currentIndex];
        
        if (currentWord) {
            // Reset card to front side
            this.flashcardEl.classList.remove('flipped');
            
            // Update card content
            this.wordEl.textContent = currentWord.correctWord;
            this.meaningEl.textContent = currentWord.meaning;
            this.synonymsEl.textContent = currentWord.synonyms.join(', ');
            
            // Update star button
            this.updateStarButton(currentWord.id);
            
            // Update counter
            this.cardCounterEl.textContent = `${this.currentIndex + 1}/${this.words.length}`;
        }
    }
    
    /**
     * Show previous card
     */
    showPrevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentCard();
        }
    }
    
    /**
     * Show next card
     */
    showNextCard() {
        if (this.currentIndex < this.words.length - 1) {
            this.currentIndex++;
            this.displayCurrentCard();
        }
    }
    
    /**
     * Toggle starred status for current word
     */
    async toggleStarredWord() {
        const currentWord = this.words[this.currentIndex];
        if (currentWord) {
            const isStarred = await dataManager.toggleStarredWord(currentWord.id);
            this.updateStarButton(currentWord.id, isStarred);
        }
    }
    
    /**
     * Update star button appearance
     */
    updateStarButton(wordId, isStarred = null) {
        if (isStarred === null) {
            isStarred = dataManager.isWordStarred(wordId);
        }
        
        if (isStarred) {
            this.starBtnEl.classList.add('active');
        } else {
            this.starBtnEl.classList.remove('active');
        }
    }
    
    /**
     * Show no words message
     */
    showNoWordsMessage() {
        this.wordEl.textContent = 'No words found';
        this.meaningEl.textContent = 'No words found for the selected filters. Try a different filter.';
        this.synonymsEl.textContent = '';
        this.cardCounterEl.textContent = '0/0';
    }
    
    /**
     * Show error message
     */
    showErrorMessage() {
        this.wordEl.textContent = 'Error';
        this.meaningEl.textContent = 'There was an error loading the vocabulary data. Please try again.';
        this.synonymsEl.textContent = '';
        this.cardCounterEl.textContent = '0/0';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlashcardManager();
});
