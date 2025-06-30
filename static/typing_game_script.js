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

    // --- Game State ---
    let gameState = {
        phraseBank: [], // Will be filled by Gemini API
        currentPhrase: "",
        currentIndex: 0,
        score: 0,
        timeLeft: 100, // Represented as a percentage
        expertise: 0,
        difficulty: 'easy',
        gameInterval: null,
        isActive: false,
        isFetching: false,
    };

    // --- Dynamic Difficulty Parameters ---
    function getDynamicGameParameters(expertise) {
        // Time decrement increases slightly with expertise (game gets faster)
        // Starts at 0.5, moves towards 0.75 over ~50 expertise points
        const timeDecrement = 0.5 + Math.min(0.25, expertise * 0.005);
        
        // Time reward decreases slightly with expertise
        // Starts at 2, moves towards 1.2 over ~50 expertise points
        const timeIncrementPerChar = 2.0 - Math.min(0.8, expertise * 0.016);

        return { timeDecrement, timeIncrementPerChar };
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
    async function getApiKeyFromServer() {
        try {
            const response = await fetch('/get-gemini-api-key'); 
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to fetch API key, server error."}));
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            const data = await response.json();
            if (data.apiKey) { return data.apiKey; } 
            else { throw new Error(data.error || "API key not found in server response."); }
        } catch (error) { console.error("Failed to fetch API key:", error); throw error; }
    }

    function constructTypingPrompt(difficulty, expertise) {
        let complexityDescription = "";
        switch(difficulty) {
            case 'easy':
                complexityDescription = `focus on home row keys (asdfjkl;), simple words, no punctuation or numbers. Example: 'a sad lad asks a lass'.`;
                break;
            case 'medium':
                complexityDescription = `introduce common English words that require alternating hands, simple punctuation like commas and periods, and common digraphs (like 'th', 'sh', 'ch'). Example: 'The quick brown fox, as they say.'`;
                break;
            case 'hard':
                complexityDescription = `include a mix of uppercase and lowercase letters, numbers, and common symbols (!?@#$%&). The phrases should require more complex finger movements. Example: 'Score: 100%? That's P@55w0rd level!'`;
                break;
        }

        return `You are a typing tutor assistant. Your task is to generate a list of 5 short, didactic phrases for a user to practice typing. The user's current expertise level is ${expertise}, so the phrases should be challenging but achievable.
The difficulty level is "${difficulty}". For this level, ${complexityDescription}
The phrases should be short, between 3 to 7 words each.
Provide your response as a JSON object with a single key "phrases" which is an array of 5 strings.
Example response: {"phrases": ["phrase one", "phrase two", "phrase three", "phrase four", "phrase five"]}`;
    }

    async function fetchNewPhrases() {
        if (gameState.isFetching) return;
        gameState.isFetching = true;
        gameMessage.textContent = 'Getting new words...';
        gameMessageBox.style.display = 'block';

        try {
            const apiKey = await getApiKeyFromServer();
            const prompt = constructTypingPrompt(gameState.difficulty, gameState.expertise);
            
            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { 
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "phrases": {
                                "type": "ARRAY",
                                "items": { "type": "STRING" }
                            }
                        }
                    }
                }
            };
            
            const modelName = 'gemini-1.5-flash-latest';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            const text = result.candidates[0].content.parts[0].text;
            const parsedJson = JSON.parse(text);

            if (parsedJson.phrases && parsedJson.phrases.length > 0) {
                gameState.phraseBank = parsedJson.phrases;
            } else {
                throw new Error("AI did not return a valid list of phrases.");
            }

        } catch (error) {
            console.error("Failed to fetch new phrases:", error);
            gameMessage.textContent = "Could not get new words. Using fallback.";
            // Fallback to a simple phrase if API fails
            gameState.phraseBank = ["The quick brown fox jumps over the lazy dog."];
            // Don't hide the message box on error, let user see it
            setTimeout(() => { gameMessageBox.style.display = 'none'; }, 2000);
        } finally {
            gameState.isFetching = false;
        }
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

    async function selectAndSetupPhrase() {
        if (gameState.phraseBank.length === 0) {
            await fetchNewPhrases();
            // After fetching, if the game hasn't been ended by an error, proceed.
            if (gameState.isActive) {
                gameMessageBox.style.display = 'none';
            }
        }
        
        // Take a phrase from the bank
        gameState.currentPhrase = gameState.phraseBank.shift() || "Fallback phrase.";
        gameState.currentIndex = 0;
        phraseDisplay.innerHTML = '';

        gameState.currentPhrase.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'letter-span';
            if (char === ' ') {
                charSpan.classList.add('space-char');
                charSpan.innerHTML = '&nbsp;';
            } else {
                charSpan.textContent = char;
            }
            phraseDisplay.appendChild(charSpan);
        });
        phraseDisplay.children[0]?.classList.add('current');
    }

    async function startGame() {
        gameState.isActive = true;
        gameState.score = 0;
        gameState.timeLeft = 100;
        gameMessageBox.style.display = 'none';
        difficultySelect.disabled = true;

        await selectAndSetupPhrase();
        updateUI();

        if (gameState.gameInterval) clearInterval(gameState.gameInterval);
        gameState.gameInterval = setInterval(updateTimer, TIME_PER_TICK);
    }

    function updateTimer() {
        if (!gameState.isActive) return;
        const { timeDecrement } = getDynamicGameParameters(gameState.expertise);
        gameState.timeLeft -= timeDecrement;
        timerBar.style.width = `${gameState.timeLeft}%`;

        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }

    function endGame() {
        gameState.isActive = false;
        if (gameState.gameInterval) clearInterval(gameState.gameInterval);
        gameMessage.textContent = `Game Over! Final Score: ${gameState.score}`;
        startGameButton.textContent = "Play Again";
        gameMessageBox.style.display = 'block';
        difficultySelect.disabled = false;
    }

    async function handleKeyPress(e) {
        if (!gameState.isActive || gameState.isFetching) return;
        e.preventDefault();

        const currentSpan = phraseDisplay.children[gameState.currentIndex];
        if (!currentSpan) return;

        if (e.key === gameState.currentPhrase[gameState.currentIndex]) {
            // Correct key
            currentSpan.classList.remove('current', 'incorrect');
            currentSpan.classList.add('correct');
            
            currentSpan.style.animation = 'pop 0.3s ease-out';
            setTimeout(() => { currentSpan.style.animation = ''; }, 300);

            const { timeIncrementPerChar } = getDynamicGameParameters(gameState.expertise);
            gameState.score += 10;
            gameState.timeLeft = Math.min(100, gameState.timeLeft + timeIncrementPerChar);
            gameState.currentIndex++;

            if (gameState.currentIndex === gameState.currentPhrase.length) {
                // Phrase complete
                gameState.expertise++;
                saveState();
                setTimeout(selectAndSetupPhrase, 300); 
            } else {
                phraseDisplay.children[gameState.currentIndex]?.classList.add('current');
            }
        } else {
            // Incorrect key
            currentSpan.classList.add('incorrect');
            setTimeout(() => currentSpan.classList.remove('incorrect'), 500);
            gameState.score = Math.max(0, gameState.score - 5);
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
        gameState.phraseBank = []; // Clear bank so new phrases for new difficulty are fetched
        saveState();
    });
    document.addEventListener('keydown', handleKeyPress);

    // --- Initial Load ---
    loadState();
});

