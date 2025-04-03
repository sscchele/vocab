/**
 * Quiz Manager - Handles quiz functionality
 */
class QuizManager {
    constructor() {
        this.words = [];
        this.currentQuestions = [];
        this.currentIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.quizInProgress = false;
        
        // DOM Elements
        this.quizContainerEl = document.querySelector('.quiz-container');
        this.questionEl = document.getElementById('question');
        this.optionsContainerEl = document.querySelector('.options-container');
        this.optionEls = document.querySelectorAll('.option');
        this.feedbackEl = document.getElementById('feedback');
        this.feedbackTextEl = document.getElementById('feedback-text');
        this.correctAnswerEl = document.getElementById('correct-answer');
        this.submitBtnEl = document.getElementById('submit-btn');
        this.navButtonsEl = document.getElementById('nav-buttons');
        this.prevBtnEl = document.getElementById('prev-btn');
        this.nextBtnEl = document.getElementById('next-btn');
        this.questionCounterEl = document.getElementById('question-counter');
        this.startQuizBtn = document.getElementById('start-quiz');
        this.timeFilterEl = document.getElementById('time-filter');
        this.wordFilterEl = document.getElementById('word-filter');
        this.quizTypeEl = document.getElementById('quiz-type');
        this.customDatesEl = document.getElementById('custom-dates');
        this.customDateStartEl = document.getElementById('custom-date-start');
        this.customDateEndEl = document.getElementById('custom-date-end');
        this.applyDateBtn = document.getElementById('apply-date');
        this.resultsContainerEl = document.getElementById('results-container');
        this.scoreEl = document.getElementById('score');
        this.mistakesListEl = document.getElementById('mistakes-list');
        this.retryWrongBtn = document.getElementById('retry-wrong');
        this.newQuizBtn = document.getElementById('new-quiz');
        this.starBtnEl = document.getElementById('star-btn');
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize quiz manager
     */
    async init() {
        // Initialize data manager
        await dataManager.init();
        
        // Add event listeners
        this.addEventListeners();
        
        // Initially hide quiz container
        this.quizContainerEl.classList.add('hidden');
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        // Start quiz button
        this.startQuizBtn.addEventListener('click', () => this.startQuiz());
        
        // Submit answer button
        this.submitBtnEl.addEventListener('click', () => this.submitAnswer());
        
        // Navigation buttons
        this.prevBtnEl.addEventListener('click', () => this.showPrevQuestion());
        this.nextBtnEl.addEventListener('click', () => this.showNextQuestion());
        
        // Option selection
        this.optionEls.forEach(option => {
            option.addEventListener('click', () => {
                // If we're reviewing answers, don't allow selection
                if (this.navButtonsEl.classList.contains('hidden')) {
                    const optionIndex = option.dataset.index;
                    this.selectOption(optionIndex);
                }
            });
        });
        
        // Retry wrong words button
        this.retryWrongBtn.addEventListener('click', () => this.retryWrongWords());
        
        // New quiz button
        this.newQuizBtn.addEventListener('click', () => {
            this.resultsContainerEl.classList.add('hidden');
            this.quizContainerEl.classList.add('hidden');
        });
        
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
            // Nothing to do here, will be used when starting quiz
        });
        
        // Star button
        this.starBtnEl.addEventListener('click', () => this.toggleStarredWord());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.quizInProgress) return;
            
            if (e.key === 'ArrowLeft' && !this.navButtonsEl.classList.contains('hidden')) {
                this.showPrevQuestion();
            } else if (e.key === 'ArrowRight' && !this.navButtonsEl.classList.contains('hidden')) {
                this.showNextQuestion();
            } else if (e.key === 'Enter' && this.navButtonsEl.classList.contains('hidden')) {
                this.submitAnswer();
            } else if (['1', '2', '3', '4'].includes(e.key) && this.navButtonsEl.classList.contains('hidden')) {
                this.selectOption(parseInt(e.key) - 1);
            }
        });
    }
    
    /**
     * Start a new quiz
     */
    async startQuiz() {
        const filters = {
            timeFilter: this.timeFilterEl.value,
            wordFilter: this.wordFilterEl.value
        };
        
        if (filters.timeFilter === 'custom') {
            filters.customStartDate = this.customDateStartEl.value;
            filters.customEndDate = this.customDateEndEl.value;
        }
        
        try {
            // Fetch words based on filters
            this.words = await dataManager.fetchVocabularyData(filters);
            
            if (this.words.length === 0) {
                alert('No words found for the selected filters. Please try different filters.');
                return;
            }
            
            // Generate quiz questions
            this.generateQuizQuestions();
            
            // Reset quiz state
            this.currentIndex = 0;
            this.userAnswers = Array(this.currentQuestions.length).fill(null);
            this.score = 0;
            this.quizInProgress = true;
            
            // Show quiz container, hide results
            this.quizContainerEl.classList.remove('hidden');
            this.resultsContainerEl.classList.add('hidden');
            
            // Display first question
            this.displayCurrentQuestion();
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Error starting quiz. Please try again.');
        }
    }
    
    /**
     * Generate quiz questions based on selected type
     */
    generateQuizQuestions() {
        const quizType = this.quizTypeEl.value;
        this.currentQuestions = [];
        
        // Create a question for each word
        this.words.forEach(word => {
            let question;
            
            if (quizType === 'word-meaning') {
                // Question: Word, Answer: Meaning
                question = {
                    id: word.id,
                    questionText: `What is the meaning of "${word.correctWord}"?`,
                    correctAnswer: word.meaning,
                    options: this.generateMeaningOptions(word, this.words),
                    wordData: word
                };
            } else {
                // Question: Meaning, Answer: Word
                question = {
                    id: word.id,
                    questionText: `Which word means: "${word.meaning}"?`,
                    correctAnswer: word.correctWord,
                    options: this.generateWordOptions(word, this.words),
                    wordData: word
                };
            }
            
            this.currentQuestions.push(question);
        });
        
        // Shuffle the questions
        this.shuffleArray(this.currentQuestions);
    }
    
    /**
     * Generate options for meaning questions
     */
    generateMeaningOptions(currentWord, allWords) {
        const options = [currentWord.meaning];
        const otherWords = allWords.filter(word => word.id !== currentWord.id);
        
        // Shuffle other words
        this.shuffleArray(otherWords);
        
        // Add meanings from other words
        while (options.length < 4 && otherWords.length > 0) {
            const word = otherWords.pop();
            if (!options.includes(word.meaning)) {
                options.push(word.meaning);
            }
        }
        
        // Shuffle options
        return this.shuffleArray(options);
    }
    
    /**
     * Generate options for word questions
     */
    generateWordOptions(currentWord, allWords) {
        const options = [currentWord.correctWord];
        const otherWords = allWords.filter(word => word.id !== currentWord.id);
        
        // Shuffle other words
        this.shuffleArray(otherWords);
        
        // Add words from other entries
        while (options.length < 4 && otherWords.length > 0) {
            const word = otherWords.pop();
            if (!options.includes(word.correctWord)) {
                options.push(word.correctWord);
            }
        }
        
        // Shuffle options
        return this.shuffleArray(options);
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
     * Display the current question
     */
    displayCurrentQuestion() {
        const currentQuestion = this.currentQuestions[this.currentIndex];
        
        if (currentQuestion) {
            // Set question text
            this.questionEl.textContent = currentQuestion.questionText;
            
            // Update star button
            this.updateStarButton(currentQuestion.wordData.id);
            
            // Set options
            for (let i = 0; i < 4; i++) {
                const optionText = document.getElementById(`option${i}-text`);
                if (i < currentQuestion.options.length) {
                    optionText.textContent = currentQuestion.options[i];
                    this.optionEls[i].classList.remove('hidden');
                } else {
                    this.optionEls[i].classList.add('hidden');
                }
                
                // Clear any previous selections/feedback
                this.optionEls[i].classList.remove('selected', 'correct', 'incorrect');
                document.getElementById(`option${i}`).checked = false;
            }
            
            // If user has already answered this question, show their selection
            const userAnswer = this.userAnswers[this.currentIndex];
            if (userAnswer !== null) {
                this.showAnswer(userAnswer);
            } else {
                // Hide feedback and show submit button
                this.feedbackEl.classList.add('hidden');
                this.navButtonsEl.classList.add('hidden');
                this.submitBtnEl.classList.remove('hidden');
            }
            
            // Update counter
            this.questionCounterEl.textContent = `${this.currentIndex + 1}/${this.currentQuestions.length}`;
        }
    }
    
    /**
     * Select an option
     */
    selectOption(optionIndex) {
        // Clear previous selections
        this.optionEls.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Select the clicked option
        this.optionEls[optionIndex].classList.add('selected');
        
        // Check the radio button
        document.getElementById(`option${optionIndex}`).checked = true;
    }
    
    /**
     * Submit the current answer
     */
    async submitAnswer() {
        // Find which option is selected
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        
        if (!selectedOption) {
            alert('Please select an answer');
            return;
        }
        
        const selectedIndex = parseInt(selectedOption.value);
        const currentQuestion = this.currentQuestions[this.currentIndex];
        const selectedAnswer = currentQuestion.options[selectedIndex];
        
        // Store user answer
        this.userAnswers[this.currentIndex] = selectedIndex;
        
        // Check if answer is correct
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        
        // Update score
        if (isCorrect) {
            this.score++;
            await dataManager.trackCorrectAttempt(currentQuestion.id);
        } else {
            await dataManager.trackWrongAttempt(currentQuestion.id);
        }
        
        // Show answer and feedback
        this.showAnswer(selectedIndex);
        
        // If last question, show results after delay
        if (this.currentIndex === this.currentQuestions.length - 1) {
            setTimeout(() => {
                this.showResults();
            }, 1500);
        }
    }
    
    /**
     * Show answer feedback
     */
    showAnswer(selectedIndex) {
        const currentQuestion = this.currentQuestions[this.currentIndex];
        const selectedAnswer = currentQuestion.options[selectedIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        
        // Mark selected option
        this.optionEls[selectedIndex].classList.add(isCorrect ? 'correct' : 'incorrect');
        
        // Mark correct option if answer was wrong
        if (!isCorrect) {
            const correctIndex = currentQuestion.options.indexOf(currentQuestion.correctAnswer);
            this.optionEls[correctIndex].classList.add('correct');
        }
        
        // Show feedback
        this.feedbackEl.classList.remove('hidden', 'correct', 'incorrect');
        this.feedbackEl.classList.add(isCorrect ? 'correct' : 'incorrect');
        this.feedbackTextEl.textContent = isCorrect ? 'Correct!' : 'Incorrect!';
        this.correctAnswerEl.textContent = currentQuestion.correctAnswer;
        
        // Hide submit button, show navigation
        this.submitBtnEl.classList.add('hidden');
        this.navButtonsEl.classList.remove('hidden');
    }
    
    /**
     * Show previous question
     */
    showPrevQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentQuestion();
        }
    }
    
    /**
     * Show next question
     */
    showNextQuestion() {
        if (this.currentIndex < this.currentQuestions.length - 1) {
            this.currentIndex++;
            this.displayCurrentQuestion();
        } else {
            // If already at last question, show results
            this.showResults();
        }
    }
    
    /**
     * Show quiz results
     */
    showResults() {
        // Hide quiz container
        this.quizContainerEl.classList.add('hidden');
        
        // Show results container
        this.resultsContainerEl.classList.remove('hidden');
        
        // Update score
        this.scoreEl.textContent = `${this.score}/${this.currentQuestions.length}`;
        
        // Generate mistakes summary
        this.generateMistakesSummary();
        
        // Quiz is now complete
        this.quizInProgress = false;
    }
    
    /**
     * Generate list of mistakes for results page
     */
    generateMistakesSummary() {
        // Clear previous list
        this.mistakesListEl.innerHTML = '';
        
        // Find mistakes
        const mistakes = [];
        for (let i = 0; i < this.currentQuestions.length; i++) {
            const userAnswerIndex = this.userAnswers[i];
            if (userAnswerIndex === null) continue; // Skip unanswered questions
            
            const question = this.currentQuestions[i];
            const userAnswer = question.options[userAnswerIndex];
            
            if (userAnswer !== question.correctAnswer) {
                mistakes.push({
                    question: question.questionText,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    wordData: question.wordData
                });
            }
        }
        
        // If no mistakes, show a message
        if (mistakes.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = 'Perfect score! No mistakes.';
            this.mistakesListEl.appendChild(listItem);
            
            // Hide retry wrong words button
            this.retryWrongBtn.classList.add('hidden');
        } else {
            // Show retry wrong words button
            this.retryWrongBtn.classList.remove('hidden');
            
            // Add each mistake to the list
            mistakes.forEach(mistake => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>Question:</strong> ${mistake.question}<br>
                    <strong>Your answer:</strong> ${mistake.userAnswer}<br>
                    <strong>Correct answer:</strong> ${mistake.correctAnswer}`;
                this.mistakesListEl.appendChild(listItem);
            });
        }
    }
    
    /**
     * Retry quiz with only wrong answers
     */
    retryWrongWords() {
        // Find words that were answered incorrectly
        const wrongWordIds = new Set();
        
        for (let i = 0; i < this.currentQuestions.length; i++) {
            const userAnswerIndex = this.userAnswers[i];
            if (userAnswerIndex === null) continue; // Skip unanswered questions
            
            const question = this.currentQuestions[i];
            const userAnswer = question.options[userAnswerIndex];
            
            if (userAnswer !== question.correctAnswer) {
                wrongWordIds.add(question.id);
            }
        }
        
        // Filter words to only include wrong answers
        this.words = this.words.filter(word => wrongWordIds.has(word.id));
        
        // Generate new quiz questions
        this.generateQuizQuestions();
        
        // Reset quiz state
        this.currentIndex = 0;
        this.userAnswers = Array(this.currentQuestions.length).fill(null);
        this.score = 0;
        this.quizInProgress = true;
        
        // Show quiz container, hide results
        this.quizContainerEl.classList.remove('hidden');
        this.resultsContainerEl.classList.add('hidden');
        
        // Display first question
        this.displayCurrentQuestion();
    }
    
    /**
     * Toggle starred status for current word
     */
    async toggleStarredWord() {
        const currentQuestion = this.currentQuestions[this.currentIndex];
        if (currentQuestion) {
            const isStarred = await dataManager.toggleStarredWord(currentQuestion.wordData.id);
            this.updateStarButton(currentQuestion.wordData.id, isStarred);
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuizManager();
});
