// static/typing_game_script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const difficultySelect = document.getElementById('difficulty-select');
    const scoreDisplay = document.getElementById('score-display');
    const maxScoreDisplay = document.getElementById('max-score-display');
    const cpmDisplay = document.getElementById('cpm-display');
    const timerBar = document.getElementById('timer-bar');
    const phraseDisplay = document.getElementById('phrase-display');
    const gameMessageBox = document.getElementById('game-message-box');
    const gameMessage = document.getElementById('game-message');
    const startGameButton = document.getElementById('start-game-button');
    const keyboardContainer = document.getElementById('keyboard-container');
    const iconTemplates = document.getElementById('keyboard-icon-templates');

    // --- Game Configuration & Magic Numbers ---
    const GAME_CONFIG = {
        // Word Generation
        PHRASE_BANK_THRESHOLD: 2, // Fetch new words when bank is this low
        EASY_SCORE_THRESHOLD: 1500, // Max score to be considered "Easy"
        MEDIUM_SCORE_THRESHOLD: 5000, // Max score to be considered "Medium"

        // Timer Mechanics
        TIMER_INTERVAL_MS: 100, // How often the timer updates
        STARTING_TIME: 100, // The starting value for the timer bar (percent)
        BASE_TIME_DECREMENT: 0.1875/4, // Starting speed (percent per tick)
        TIME_DECREMENT_SCALE: 0.00125/4, // How much speed increases per score point
        MAX_TIME_DECREMENT_BONUS: 0.2, // Max speed bonus from score

        // Time Reward Mechanics
        BASE_TIME_INCREMENT: 2.5, // Starting time reward per character
        TIME_INCREMENT_SCALE: 0.001, // How much reward decreases per max score point
        MAX_TIME_INCREMENT_REDUCTION: 1.5, // Max reward reduction

        // Scoring Mechanics
        BASE_SCORE_PER_CHAR: 2,
        SCORE_PENALTY: -1,
        SCORE_MULTIPLIER_THRESHOLD: 1000, // Increase multiplier every X max score points
        SCORE_MULTIPLIER_INCREMENT: 0.1,

        // Animation & Delay Timings
        KEY_HIGHLIGHT_DURATION_MS: 150,
        ERROR_SHAKE_DURATION_MS: 500,
        SUCCESS_POP_DURATION_MS: 300,
        NEXT_PHRASE_DELAY_MS: 300,
        
        // CPM Calculation
        CPM_SMOOTHING_FACTOR: 0.2, // Alpha for Exponential Moving Average (lower is smoother)
    };

    // --- Game State ---
    let gameState = {
        phraseBank: [],
	chatHistory: [],
        currentPhrase: "",
        currentIndex: 0,
        maxScores: { easy: 0, medium: 0, hard: 0 },
        score: 0,
        timeLeft: GAME_CONFIG.STARTING_TIME, 
        difficulty: 'easy',
        gameInterval: null,
        isActive: false,
        isFetching: false,
        lastKeystrokeTime: null,
        currentCPM: 0,
    };

    // --- Dynamic Difficulty Parameters ---
    function getDynamicGameParameters(currentScore, maxScore) {
        const timeDecrement = GAME_CONFIG.BASE_TIME_DECREMENT + Math.min(GAME_CONFIG.MAX_TIME_DECREMENT_BONUS, currentScore * GAME_CONFIG.TIME_DECREMENT_SCALE);
        const timeIncrementPerChar = GAME_CONFIG.BASE_TIME_INCREMENT - Math.min(GAME_CONFIG.MAX_TIME_INCREMENT_REDUCTION, maxScore * GAME_CONFIG.TIME_INCREMENT_SCALE);
        const scoreMultiplier = 1 + Math.floor(maxScore / GAME_CONFIG.SCORE_MULTIPLIER_THRESHOLD) * GAME_CONFIG.SCORE_MULTIPLIER_INCREMENT;
        return { timeDecrement, timeIncrementPerChar, scoreMultiplier };
    }

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


    // --- API and Phrase Generation ---
    function constructTypingPrompt(difficulty, maxScore, lastMaxScore, history) {
        const getDifficultyTier = (score) => {
            if (score < GAME_CONFIG.EASY_SCORE_THRESHOLD) return 'Beginner (Easy)';
            if (score < GAME_CONFIG.MEDIUM_SCORE_THRESHOLD) return 'Intermediate (Medium)';
            return 'Advanced (Hard)';
        };

        const oldTier = getDifficultyTier(lastMaxScore);
        const newTier = getDifficultyTier(maxScore);
        const difficultyLevel = newTier;
        
        let complexityDescription;
        switch(difficultyLevel) {
            case 'Beginner (Easy)':
                complexityDescription = `focus on easy to type words (single row, close letters together, etc). Use simple, common, lowercase English words. This is for a child just learning finger placement (finger typing). Example: 'a sad lad asks a lass, kilo tree'.`;
                break;
            case 'Intermediate (Medium)':
                complexityDescription = `use common English words that require more hand alternation and reaching for top and bottom row keys. Include simple punctuation like commas and periods. Example: 'The quick brown fox, as they say.'`;
                break;
            case 'Advanced (Hard)':
                complexityDescription = `use real, properly spelled English words that are longer or have more complex, less common letter combinations (e.g., 'queue', 'rhythm', 'acquire'). Include some uppercase letters (requiring Shift) and occasional numbers. Example: 'The mysterious zephyr quietly vexed the judge.'`;
                break;
        }

        if (difficulty === 'medium' && maxScore < GAME_CONFIG.EASY_SCORE_THRESHOLD) {
             complexityDescription = `use common English words that require more hand alternation and reaching for top and bottom row keys. Include simple punctuation like commas and periods. Example: 'The quick brown fox, as they say.'`;
        } else if (difficulty === 'hard' && maxScore < GAME_CONFIG.MEDIUM_SCORE_THRESHOLD) {
            complexityDescription = `use real, properly spelled English words that are longer or have more complex, less common letter combinations (e.g., 'queue', 'rhythm', 'acquire'). Include some uppercase letters (requiring Shift) and occasional numbers. Example: 'The mysterious zephyr quietly vexed the judge.'`;
        }

        // Check if this is the first prompt in the conversation
        if (history.length === 0) {
            return `You are a typing tutor assistant. Your task is to generate a list of 5 short, didactic phrases for a user to practice typing. The user's skill level is "${difficultyLevel}".
For this level, ${complexityDescription}
The phrases should be short, between 3 to 8 words each.
Provide your response as a JSON object with a single key "phrases" which is an array of 5 strings.
Example response for a medium level: {"phrases": ["The quick brown fox.", "Jumps over the lazy dog.", "A pocket full of posies.", "Ashes to ashes, we fall.", "Practice makes perfect, they say." ]}`;
        } else {
            // This is a follow-up prompt
            let followUpInstruction = `Great, that was helpful. Now, please generate 10 more new phrases at the same "${difficultyLevel}" skill level. It is very important that you do not repeat any phrases you have provided before in this conversation.`;
            if (newTier !== oldTier) {
                followUpInstruction = `The user has improved! Please switch the complexity to the new "${newTier}" level and generate 10 new phrases. Do not repeat any previous phrases.`;
            }
            return `${followUpInstruction}
For this level, ${complexityDescription}
The phrases should be short, between 3 to 8 words each.
Provide your response as a JSON object with a single key "phrases" which is an array of 10 strings.`;
        }
    }

    async function fetchNewPhrases(isInitialFetch = false) {
        if (gameState.isFetching) return;
        gameState.isFetching = true;
        if (isInitialFetch) {
            gameMessage.textContent = 'Getting new words...';
            gameMessageBox.style.display = 'block';
        }
        try {
            const prompt = constructTypingPrompt(gameState.difficulty, gameState.score, gameState.lastMaxScoreOnFetch, gameState.chatHistory);
            
            gameState.lastMaxScoreOnFetch = gameState.score;
            gameState.chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const modelName = 'gemini-2.5-flash-lite-preview-06-17';

            const response = await fetch('/api/generate-typing-phrases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: gameState.chatHistory,
                    model: modelName
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Server error: ${response.statusText}` }));
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content) {
                gameState.chatHistory.push(result.candidates[0].content);
            }

            const text = result.candidates[0].content.parts[0].text;
            const parsedJson = JSON.parse(text);

            if (parsedJson.phrases && parsedJson.phrases.length > 0) {
                gameState.phraseBank.push(...parsedJson.phrases);
            } else { throw new Error("AI did not return a valid list of phrases."); }
        } catch (error) {
            console.error("Failed to fetch new phrases:", error);
            if (isInitialFetch) {
                gameMessage.textContent = "Could not get new words. Using fallback.";
                gameState.phraseBank = ["The quick brown fox jumps over the lazy dog."];
                setTimeout(() => { gameMessageBox.style.display = 'none'; }, 2000);
            }
	    // If a follow-up call fails, remove the last user message from history so we can try again later.
            if (gameState.chatHistory.length > 0 && gameState.chatHistory[gameState.chatHistory.length - 1].role === 'user') {
                gameState.chatHistory.pop();
                console.error("Pop the chat history")
	    }
        } finally {
            gameState.isFetching = false;
        }
    }

    // --- Visual Keyboard Generation ---
    const keyboardLayout = [["Backquote","Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9","Digit0","Minus","Equal","Backspace"],["Tab","KeyQ","KeyW","KeyE","KeyR","KeyT","KeyY","KeyU","KeyI","KeyO","KeyP","BracketLeft","BracketRight","Backslash"],["CapsLock","KeyA","KeyS","KeyD","KeyF","KeyG","KeyH","KeyJ","KeyK","KeyL","Semicolon","Quote","Enter"],["ShiftLeft","KeyZ","KeyX","KeyC","KeyV","KeyB","KeyN","KeyM","Comma","Period","Slash","ShiftRight"],["Space"]];
    const specialKeyIcons = {"Backspace":"icon-backspace","Enter":"icon-enter","ShiftLeft":"icon-shift","ShiftRight":"icon-shift","Tab":"icon-tab"};
    const specialKeyClasses = {"Backspace":"key-wide","Tab":"key-wide","Backslash":"key-wide","CapsLock":"key-wider","Enter":"key-wider","ShiftLeft":"key-widest","ShiftRight":"key-widest","Space":"key-space"};
    async function buildVisualKeyboard() {
        let layoutMap = null;
        if (navigator.keyboard && navigator.keyboard.getLayoutMap) { try { layoutMap = await navigator.keyboard.getLayoutMap(); } catch (error) { console.warn("Could not get keyboard layout map, falling back to default.", error); } }
        keyboardContainer.innerHTML = ''; 
        keyboardLayout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            row.forEach(code => {
                const keyDiv = document.createElement('div');
                keyDiv.className = 'key';
                keyDiv.dataset.key = code;
                if (specialKeyClasses[code]) { keyDiv.classList.add(specialKeyClasses[code]); }
                if (specialKeyIcons[code]) {
                    const iconSvg = iconTemplates.querySelector(`#${specialKeyIcons[code]}`);
                    if (iconSvg) { keyDiv.appendChild(iconSvg.cloneNode(true)); } else { keyDiv.textContent = code; }
                } else {
                    const keyChar = layoutMap ? layoutMap.get(code) : code.replace('Key', '');
                    keyDiv.textContent = keyChar?.toUpperCase() || '';
                }
                rowDiv.appendChild(keyDiv);
            });
            keyboardContainer.appendChild(rowDiv);
        });
    }

    // --- Game Logic ---
    function loadState() {
        const savedScores = getCookie('typingMaxScores');
        if (savedScores) {
            try {
                gameState.maxScores = JSON.parse(savedScores);
            } catch {
                gameState.maxScores = { easy: 0, medium: 0, hard: 0 };
            }
        }
	// read difficulty from the cookie, or set to easy.
        gameState.difficulty = getCookie('typingDifficulty') || 'easy';
        difficultySelect.value = gameState.difficulty;
        updateUI();
    }
    function saveState() {
        setCookie('typingMaxScores', JSON.stringify(gameState.maxScores), 365);
        setCookie('typingDifficulty', gameState.difficulty, 365);
    }
    
    async function selectAndSetupPhrase() {
        if (gameState.phraseBank.length <= GAME_CONFIG.PHRASE_BANK_THRESHOLD && !gameState.isFetching) {
            fetchNewPhrases(); 
        }
        gameState.currentPhrase = gameState.phraseBank.shift() || "Type this fallback phrase.";
        gameState.currentIndex = 0;
        
        phraseDisplay.innerHTML = '';
        const line = document.createElement('div');
        line.className = 'phrase-line';
        gameState.currentPhrase.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'letter-span';
            if (char === ' ') {
                charSpan.classList.add('space-char');
                charSpan.innerHTML = '&nbsp;';
            } else {
                charSpan.textContent = char;
            }
            line.appendChild(charSpan);
        });
        phraseDisplay.appendChild(line);

        if (phraseDisplay.children.length > 0 && phraseDisplay.children[0].children.length > 0) {
            phraseDisplay.children[0].children[0].classList.add('current');
        }
    }

    async function startGame() {
        gameState.isActive = true;
        gameState.score = 0;
        gameState.timeLeft = GAME_CONFIG.STARTING_TIME;
        gameState.currentCPM = 0;
        gameState.lastKeystrokeTime = null;
        difficultySelect.disabled = true;

        await fetchNewPhrases(true); 
        if (!gameState.isActive) return; 
        gameMessageBox.style.display = 'none';
        await selectAndSetupPhrase();
        updateUI();
        if (gameState.gameInterval) clearInterval(gameState.gameInterval);
        gameState.gameInterval = setInterval(updateTimer, GAME_CONFIG.TIMER_INTERVAL_MS);
    }

    function updateTimer() {
        if (!gameState.isActive) return;
        const { timeDecrement } = getDynamicGameParameters(gameState.score, gameState.maxScores[gameState.difficulty]);
        gameState.timeLeft -= timeDecrement;
        timerBar.style.width = `${gameState.timeLeft}%`;
        if (gameState.timeLeft <= 0) { endGame(); }
    }

    function endGame() {
        gameState.isActive = false;
        if (gameState.gameInterval) clearInterval(gameState.gameInterval);
        
        if (gameState.score > (gameState.maxScores[gameState.difficulty] || 0)) {
            gameState.maxScores[gameState.difficulty] = gameState.score;
            saveState();
        }

        gameMessage.textContent = `Game Over! Final Score: ${gameState.score}`;
        startGameButton.textContent = "Play Again";
        gameMessageBox.style.display = 'block';
        difficultySelect.disabled = false;
        updateUI(); 
    }

    function highlightKey(keyCode) {
        const keyElement = keyboardContainer.querySelector(`.key[data-key="${keyCode}"]`);
        if (keyElement) {
            keyElement.classList.add('key-pressed');
            setTimeout(() => {
                keyElement.classList.remove('key-pressed');
            }, GAME_CONFIG.KEY_HIGHLIGHT_DURATION_MS);
        }
    }

    function handleIncorrectKey(span) {
        span.classList.add('incorrect');
        keyboardContainer.classList.add('shake');
        setTimeout(() => {
            span.classList.remove('incorrect');
            keyboardContainer.classList.remove('shake');
        }, GAME_CONFIG.ERROR_SHAKE_DURATION_MS);
        gameState.score = Math.max(0, gameState.score + GAME_CONFIG.SCORE_PENALTY);
        gameState.lastKeystrokeTime = null;
    }
    
    function updateCPM() {
        const now = performance.now();
        if (gameState.lastKeystrokeTime) {
            const timeDeltaSeconds = (now - gameState.lastKeystrokeTime) / 1000;
            if (timeDeltaSeconds > 0) {
                const instantaneousCPM = 60 / timeDeltaSeconds;
                const alpha = GAME_CONFIG.CPM_SMOOTHING_FACTOR; 
                gameState.currentCPM = (instantaneousCPM * alpha) + (gameState.currentCPM * (1 - alpha));
            }
        }
        gameState.lastKeystrokeTime = now;
    }

    function handleCorrectKey(span) {
        span.classList.remove('current', 'incorrect');
        span.classList.add('correct');
        span.style.animation = `pop ${GAME_CONFIG.SUCCESS_POP_DURATION_MS}ms ease-out`;
        setTimeout(() => { span.style.animation = ''; }, GAME_CONFIG.SUCCESS_POP_DURATION_MS);

        updateCPM();

        const { timeIncrementPerChar, scoreMultiplier } = getDynamicGameParameters(gameState.score, gameState.maxScores[gameState.difficulty]);
        gameState.score += Math.round(GAME_CONFIG.BASE_SCORE_PER_CHAR * scoreMultiplier); 
        gameState.timeLeft = Math.min(100, gameState.timeLeft + timeIncrementPerChar);
    }

    async function handleKeyPress(e) {
        if (!gameState.isActive || gameState.isFetching) return;
        e.preventDefault();
        highlightKey(e.code); 

        const currentSpan = phraseDisplay.querySelectorAll('.letter-span')[gameState.currentIndex];
        if (!currentSpan) return;

        const expectedChar = currentSpan.classList.contains('space-char') ? ' ' : currentSpan.textContent;

        if (e.key === expectedChar) {
            handleCorrectKey(currentSpan);
            gameState.currentIndex++;
            
            if (gameState.currentIndex >= gameState.currentPhrase.length) {
                setTimeout(selectAndSetupPhrase, GAME_CONFIG.NEXT_PHRASE_DELAY_MS); 
            } else {
                phraseDisplay.querySelectorAll('.letter-span')[gameState.currentIndex]?.classList.add('current');
            }
        } else {
            handleIncorrectKey(currentSpan);
        }
        updateUI();
    }

    function updateUI() {
        scoreDisplay.textContent = gameState.score;
        maxScoreDisplay.textContent = gameState.maxScores[gameState.difficulty] || 0;
        cpmDisplay.textContent = Math.round(gameState.currentCPM); 
        timerBar.style.width = `${gameState.timeLeft}%`;
    }

    // --- Initial Setup ---
    startGameButton.addEventListener('click', startGame);
    difficultySelect.addEventListener('change', (e) => {
        gameState.difficulty = e.target.value;
        gameState.phraseBank = []; 
        saveState();
        updateUI(); 
    });
    document.addEventListener('keydown', handleKeyPress);
    
    loadState();
    buildVisualKeyboard();
});

