// Complete Quiz Data Bank - Will be loaded from CSV
let allQuizData = [];

// Variable to store randomly selected questions for current quiz
let quizData = [];
const TOTAL_QUIZ_QUESTIONS = 20;

// State variables
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 15;
let timerInterval;
let selectedAnswer = null;

// DOM Elements
const startScreen = document.getElementById('startScreen');
const quizScreen = document.getElementById('quizScreen');
const resultScreen = document.getElementById('resultScreen');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const timerEl = document.getElementById('timer');
const currentQuestionEl = document.getElementById('currentQuestion');
const totalQuestionsEl = document.getElementById('totalQuestions');
const progressEl = document.getElementById('progress');
const scoreTextEl = document.getElementById('scoreText');
const correctCountEl = document.getElementById('correctCount');
const wrongCountEl = document.getElementById('wrongCount');
const percentageValueEl = document.getElementById('percentageValue');
const resultTitleEl = document.getElementById('resultTitle');
const resultIconEl = document.getElementById('resultIcon');

// Event Listeners
startBtn.addEventListener('click', startQuiz);
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartQuiz);

// Initialize
totalQuestionsEl.textContent = TOTAL_QUIZ_QUESTIONS;

// Load questions from CSV file
async function loadQuestionsFromCSV() {
    try {
        const response = await fetch('questions.csv');
        const csvText = await response.text();
        
        // Parse CSV
        const lines = csvText.split('\n');
        allQuizData = [];
        
        // Skip header row and process data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                // Split by comma but handle quotes
                const values = parseCSVLine(line);
                
                if (values.length >= 6) {
                    allQuizData.push({
                        question: values[0],
                        options: [values[1], values[2], values[3], values[4]],
                        correct: parseInt(values[5])
                    });
                }
            }
        }
        
        console.log(`Loaded ${allQuizData.length} questions from CSV`);
        startBtn.disabled = false;
        startBtn.textContent = 'Start Quiz';
        
    } catch (error) {
        console.error('Error loading CSV:', error);
        alert('Failed to load questions.csv file. Please ensure the file exists in the same folder as index.html and you are running this from a local server.');
        startBtn.disabled = true;
        startBtn.textContent = 'Error Loading Questions';
    }
}

// Parse CSV line handling commas within quotes
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Function to shuffle and select random questions
function selectRandomQuestions() {
    // Create a copy of all questions
    const shuffled = [...allQuizData];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Select first 20 questions from shuffled array
    const questionsToSelect = Math.min(TOTAL_QUIZ_QUESTIONS, shuffled.length);
    quizData = shuffled.slice(0, questionsToSelect);
}

// Start Quiz
function startQuiz() {
    // Select random questions for this quiz session
    selectRandomQuestions();
    
    startScreen.classList.remove('active');
    quizScreen.classList.add('active');
    currentQuestionIndex = 0;
    score = 0;
    loadQuestion();
}

// Load Question
function loadQuestion() {
    clearInterval(timerInterval);
    timeLeft = 15;
    selectedAnswer = null;
    nextBtn.disabled = true;
    
    const currentQuestion = quizData[currentQuestionIndex];
    
    questionEl.textContent = currentQuestion.question;
    currentQuestionEl.textContent = currentQuestionIndex + 1;
    
    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
    progressEl.style.width = progress + '%';
    
    // Load options
    optionsEl.innerHTML = '';
    currentQuestion.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.textContent = option;
        optionEl.addEventListener('click', () => selectOption(index, optionEl));
        optionsEl.appendChild(optionEl);
    });
    
    // Start timer
    startTimer();
}

// Start Timer
function startTimer() {
    timerEl.textContent = timeLeft + 's';
    timerEl.classList.remove('warning');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft + 's';
        
        if (timeLeft <= 5) {
            timerEl.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            autoSelectWrong();
        }
    }, 1000);
}

// Select Option
function selectOption(index, optionEl) {
    if (selectedAnswer !== null) return;
    
    selectedAnswer = index;
    const correctAnswer = quizData[currentQuestionIndex].correct;
    
    clearInterval(timerInterval);
    
    // Disable all options
    const allOptions = document.querySelectorAll('.option');
    allOptions.forEach(opt => opt.classList.add('disabled'));
    
    // Show correct/wrong
    if (index === correctAnswer) {
        optionEl.classList.add('correct');
        score++;
    } else {
        optionEl.classList.add('wrong');
        allOptions[correctAnswer].classList.add('correct');
    }
    
    nextBtn.disabled = false;
}

// Auto select wrong when time runs out
function autoSelectWrong() {
    if (selectedAnswer !== null) return;
    
    selectedAnswer = -1;
    const correctAnswer = quizData[currentQuestionIndex].correct;
    const allOptions = document.querySelectorAll('.option');
    
    allOptions.forEach(opt => opt.classList.add('disabled'));
    allOptions[correctAnswer].classList.add('correct');
    
    nextBtn.disabled = false;
}

// Next Question
function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

// Show Results
function showResults() {
    quizScreen.classList.remove('active');
    resultScreen.classList.add('active');
    
    const correctAnswers = score;
    const wrongAnswers = quizData.length - score;
    const percentage = Math.round((score / quizData.length) * 100);
    
    scoreTextEl.textContent = `${score}/${quizData.length}`;
    correctCountEl.textContent = correctAnswers;
    wrongCountEl.textContent = wrongAnswers;
    percentageValueEl.textContent = percentage + '%';
    
    // Set result message based on score
    if (percentage >= 80) {
        resultTitleEl.textContent = 'Excellent! 🌟';
        resultIconEl.textContent = '🎉';
    } else if (percentage >= 60) {
        resultTitleEl.textContent = 'Good Job! 👍';
        resultIconEl.textContent = '😊';
    } else if (percentage >= 40) {
        resultTitleEl.textContent = 'Not Bad! 📚';
        resultIconEl.textContent = '🙂';
    } else {
        resultTitleEl.textContent = 'Keep Practicing! 💪';
        resultIconEl.textContent = '📖';
    }
}

// Restart Quiz
function restartQuiz() {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
    currentQuestionIndex = 0;
    score = 0;
    // Questions will be randomly selected again when quiz starts
}

// Load questions when page loads
window.addEventListener('DOMContentLoaded', () => {
    startBtn.disabled = true;
    startBtn.textContent = 'Loading Questions...';
    loadQuestionsFromCSV();
});