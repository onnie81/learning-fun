// static/typing_game_script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const difficultySelect = document.getElementById('difficulty-select');
    const scoreDisplay = document.getElementById('score-display');
    const expertiseDisplay = document.getElementById('expertise-display');
    const timerBar = document.getElementById('timer-bar');
    const phraseDisplay = document.getElementById('phrase-display');
    const gameMessageBox = document.getElementById('game-message-box');
    const gameMessage = document.getElementById('game-message');
    const startGameButton = document.getElementById('start-game-button');

    // --- Game Data ---
    const phrases = {
        easy: ["ask a sad lad", "a fall salad", "all dads fall", "glad a fad", "a sad lass"],
        medium: ["the quick brown fox", "jumps over the lazy dog", "a pocket full of posies", "ashes to ashes", "we all fall down"],
        hard: ["A-Z a-z 0-9", "What's the password? 'P@55w0rd!'", "Check the file at C:\\Users\\Vivi\\", "The <p> tag is for paragraphs.", "Score: 100%!"],
    };

    // --- Game State ---
    let gameState = {
        currentPhrase: "",
        currentIndex: 0,
        score: 0,
        timeLeft: 100, // Represented as a percentage
        expertise: 0,
        difficulty: 'easy',
        gameInterval: null,
        isActive: false,
    };

    const TIME_PER_TICK = 100; // ms
    const TIME_DECREMENT = 0.5; // % per tick
    const TIME_INCREMENT_PER_CHAR = 2; // % added per correct char

    // --- Cookie Handling ---
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
    }
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i=0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }

    // --- Game Logic ---
    function loadState() {
        gameState.expertise = parseInt(getCookie('typingExpertise') || '0');
        gameState.difficulty = getCookie('typingDifficulty') || 'easy';
        difficultySelect.value = gameState.difficulty;
        updateUI();
    }

    function saveState() {
        setCookie('typingExpertise', gameState.expertise, 365);
        setCookie('typingDifficulty', gameState.difficulty, 365);
    }

    function selectPhrase() {
        const levelPhrases = phrases[gameState.difficulty];
        // Simple logic: use expertise to cycle through phrases
        const phraseIndex = gameState.expertise % levelPhrases.length;
        return levelPhrases[phraseIndex];
    }

    function setupPhrase() {
        phraseDisplay.innerHTML = '';
        gameState.currentPhrase = selectPhrase();
        gameState.currentPhrase.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'letter-span';
            charSpan.textContent = char;
            phraseDisplay.appendChild(charSpan);
        });
        // Highlight first character
        phraseDisplay.children[0]?.classList.add('current');
    }

    function startGame() {
        gameState.isActive = true;
        gameState.score = 0;
        gameState.timeLeft = 100;
        gameState.currentIndex = 0;
        gameMessageBox.style.display = 'none';
        difficultySelect.disabled = true;

        setupPhrase();
        updateUI();

        if (gameState.gameInterval) clearInterval(gameState.gameInterval);
        gameState.gameInterval = setInterval(updateTimer, TIME_PER_TICK);
    }

    function updateTimer() {
        if (!gameState.isActive) return;
        gameState.timeLeft -= TIME_DECREMENT;
        timerBar.style.width = `${gameState.timeLeft}%`;

        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }

    function endGame() {
        gameState.isActive = false;
        clearInterval(gameState.gameInterval);
        gameMessage.textContent = `Game Over! Final Score: ${gameState.score}`;
        startGameButton.textContent = "Play Again";
        gameMessageBox.style.display = 'block';
        difficultySelect.disabled = false;
    }

    function handleKeyPress(e) {
        if (!gameState.isActive) return;
        e.preventDefault();

        const currentSpan = phraseDisplay.children[gameState.currentIndex];
        if (!currentSpan) return;

        if (e.key === gameState.currentPhrase[gameState.currentIndex]) {
            // Correct key
            currentSpan.classList.remove('current', 'incorrect');
            currentSpan.classList.add('correct');
            
            gameState.score += 10;
            gameState.timeLeft = Math.min(100, gameState.timeLeft + TIME_INCREMENT_PER_CHAR);
            gameState.currentIndex++;

            if (gameState.currentIndex === gameState.currentPhrase.length) {
                // Phrase complete
                gameState.expertise++;
                saveState();
                // Start next phrase
                setTimeout(() => {
                    gameState.currentIndex = 0;
                    setupPhrase();
                }, 300); // Short delay
            } else {
                // Move cursor to next character
                phraseDisplay.children[gameState.currentIndex]?.classList.add('current');
            }
        } else {
            // Incorrect key
            currentSpan.classList.add('incorrect');
            setTimeout(() => currentSpan.classList.remove('incorrect'), 500); // Remove shake after animation
            // Optional: decrease score or time
            gameState.score = Math.max(0, gameState.score - 2);
        }
        updateUI();
    }

    function updateUI() {
        scoreDisplay.textContent = gameState.score;
        expertiseDisplay.textContent = gameState.expertise;
        timerBar.style.width = `${gameState.timeLeft}%`;
    }

    // --- Event Listeners ---
    startGameButton.addEventListener('click', startGame);
    difficultySelect.addEventListener('change', (e) => {
        gameState.difficulty = e.target.value;
        saveState();
    });
    document.addEventListener('keydown', handleKeyPress);

    // --- Initial Load ---
    loadState();
});

