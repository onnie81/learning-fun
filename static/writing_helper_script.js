// static/writing_helper_script.js
document.addEventListener('DOMContentLoaded', () => {
    const writerAgeSelect = document.getElementById('writer-age');
    const wordCountSelect = document.getElementById('word-count');
    const languageSelect = document.getElementById('language-select');
    const ideaInput = document.getElementById('idea-input');
    const addIdeaButton = document.getElementById('add-idea-button');
    const ideasListContainer = document.getElementById('ideas-list-container');
    const noIdeasMessage = document.getElementById('no-ideas-message');
    
    const modeSwitchButton = document.getElementById('mode-switch');
    const modeSwitchHandle = document.getElementById('mode-switch-handle');
    const modeLabelPlan = document.getElementById('mode-label-plan');
    const modeLabelStory = document.getElementById('mode-label-story');
    const generateContentButton = document.getElementById('generate-content-button'); // Renamed button ID
    
    const outputSection = document.getElementById('output-section'); // Renamed for clarity
    const outputTitle = document.getElementById('output-title'); // New element for dynamic title
    const generatedContentDiv = document.getElementById('generated-content'); // Renamed for clarity
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageDiv = document.getElementById('error-message');

    let ideas = [];
    const bubbleColors = [ 
        { bg: 'bg-bubbleRed', text: 'text-bubbleRedText' },
        { bg: 'bg-bubbleBlue', text: 'text-bubbleBlueText' },
        { bg: 'bg-bubbleGreen', text: 'text-bubbleGreenText' },
        { bg: 'bg-bubbleYellow', text: 'text-bubbleYellowText' },
        { bg: 'bg-bubblePurple', text: 'text-bubblePurpleText' },
    ];
    let nextColorIndex = 0;
    let currentWriterMode = 'story'; // 'story' or 'plan'

    function updateModeUI() {
        if (currentWriterMode === 'story') {
            modeSwitchButton.classList.remove('bg-switchBg');
            modeSwitchButton.classList.add('bg-switchActiveBg'); // Assuming green for story mode
            modeSwitchHandle.classList.remove('translate-x-0');
            modeSwitchHandle.classList.add('translate-x-7'); // Or whatever the translate for "on" is
            modeSwitchButton.setAttribute('aria-checked', 'true');
            modeLabelStory.classList.add('font-bold', 'text-primary');
            modeLabelPlan.classList.remove('font-bold', 'text-primary');
            modeLabelPlan.classList.add('text-gray-700');
            generateContentButton.textContent = 'Write My Story!';
            outputTitle.textContent = 'Your Story!';
        } else { // plan mode
            modeSwitchButton.classList.remove('bg-switchActiveBg');
            modeSwitchButton.classList.add('bg-switchBg');
            modeSwitchHandle.classList.remove('translate-x-7');
            modeSwitchHandle.classList.add('translate-x-0');
            modeSwitchButton.setAttribute('aria-checked', 'false');
            modeLabelPlan.classList.add('font-bold', 'text-primary');
            modeLabelStory.classList.remove('font-bold', 'text-primary');
            modeLabelStory.classList.add('text-gray-700');
            generateContentButton.textContent = 'Get My Plan!';
            outputTitle.textContent = 'Your Writing Plan!';
        }
        // Clear previous output when mode changes
        generatedContentDiv.innerHTML = ''; // Use innerHTML if guidelines might have HTML structure
        errorMessageDiv.classList.add('hidden');
        if (ideas.length > 0) { // Only hide main output section if it was visible
             // outputSection.classList.add('hidden'); // Optionally hide section until new generation
        }
    }

    modeSwitchButton.addEventListener('click', () => {
        currentWriterMode = (currentWriterMode === 'story') ? 'plan' : 'story';
        updateModeUI();
    });

    function renderIdeas() {
        ideasListContainer.innerHTML = ''; 
        if (ideas.length === 0) {
            if (noIdeasMessage) { 
                if (!ideasListContainer.contains(noIdeasMessage)) {
                    ideasListContainer.appendChild(noIdeasMessage);
                }
                noIdeasMessage.classList.remove('hidden'); 
            }
            generateContentButton.disabled = true; // Use new button ID
            return;
        }
        
        generateContentButton.disabled = false; // Use new button ID
        if (noIdeasMessage) {
            noIdeasMessage.classList.add('hidden'); 
        }

        ideas.forEach((idea, index) => {
            const colorPair = bubbleColors[idea.colorIndex % bubbleColors.length];
            const bubble = document.createElement('div');
            bubble.className = `idea-bubble ${colorPair.bg} ${colorPair.text}`;
            
            const ideaTextSpan = document.createElement('span');
            ideaTextSpan.textContent = idea.text;
            bubble.appendChild(ideaTextSpan);

            const deleteButton = document.createElement('span');
            deleteButton.className = 'delete-idea';
            deleteButton.innerHTML = '&times;'; 
            deleteButton.setAttribute('aria-label', 'Delete idea');
            deleteButton.onclick = () => {
                ideas.splice(index, 1);
                renderIdeas();
            };
            bubble.appendChild(deleteButton);
            ideasListContainer.appendChild(bubble);
        });
    }

    addIdeaButton.addEventListener('click', () => {
        const ideaText = ideaInput.value.trim();
        if (ideaText) {
            ideas.push({ text: ideaText, colorIndex: nextColorIndex });
            nextColorIndex = (nextColorIndex + 1) % bubbleColors.length;
            ideaInput.value = '';
            renderIdeas();
            ideaInput.focus();
        }
    });

    ideaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            addIdeaButton.click();
        }
    });

    async function getApiKeyFromServer() {
        try {
            const response = await fetch('/get-gemini-api-key'); 
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to fetch API key, server error."}));
                throw new Error(errorData.error || `Server responded with ${response.status}`);
            }
            const data = await response.json();
            if (data.apiKey) {
                return data.apiKey;
            } else {
                throw new Error(data.error || "API key not found in server response.");
            }
        } catch (error) {
            console.error("Failed to fetch API key:", error);
            throw error; 
        }
    }

    generateContentButton.addEventListener('click', async () => { // Use new button ID
        if (ideas.length === 0) {
            showMessageToUser('Please add some ideas first!', 'error');
            return;
        }

        outputSection.classList.remove('hidden'); // Use new ID
        loadingIndicator.classList.remove('hidden');
        generatedContentDiv.innerHTML = ''; // Use new ID, allow HTML for guidelines
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.textContent = '';
        generateContentButton.disabled = true; // Use new button ID

        const age = writerAgeSelect.value;
        const wordCount = wordCountSelect.value; // This might be interpreted differently for guidelines
        const language = languageSelect.value;
        const ideaTexts = ideas.map(idea => idea.text);

        let prompt;
        if (currentWriterMode === 'story') {
            prompt = constructStoryPrompt(age, wordCount, language, ideaTexts);
            outputTitle.textContent = "Your Story!";
        } else { // 'plan' mode
            prompt = constructGuidelinesPrompt(age, language, ideaTexts);
            outputTitle.textContent = "Your Writing Plan!";
        }

        try {
            const apiKey = await getApiKeyFromServer(); 
            if (!apiKey) { 
                throw new Error("API Key could not be retrieved from server.");
            }

            let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            
            const modelName = 'gemini-2.5-flash-preview-05-20'; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse error response from API." } }));
                console.error("API Error Response:", errorData);
                throw new Error(`API Error (${response.status}): ${errorData.error?.message || response.statusText || 'Unknown API error'}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                let generatedText = result.candidates[0].content.parts[0].text;
                
                if (currentWriterMode === 'guidelines' || currentWriterMode === 'plan') {
                     // Attempt to format guidelines a bit if they come as markdown-like lists
                    generatedText = generatedText.replace(/^- /gm, '• ').replace(/^\* /gm, '• '); // Replace markdown list starters
                    generatedContentDiv.innerHTML = generatedText.split('\n').map(line => `<p>${line}</p>`).join(''); // Basic paragraph per line
                } else {
                    generatedContentDiv.textContent = generatedText;
                }

            } else {
                console.error('Unexpected API response structure:', result);
                if (result.candidates && result.candidates[0] && result.candidates[0].finishReason) {
                    throw new Error(`Generation stopped. Reason: ${result.candidates[0].finishReason}. Check safety ratings if applicable.`);
                }
                throw new Error('Failed to get content from API. Unexpected response format.');
            }

        } catch (error) {
            console.error('Error generating content:', error);
            errorMessageDiv.textContent = `Oops! Something went wrong: ${error.message}`;
            errorMessageDiv.classList.remove('hidden');
            generatedContentDiv.textContent = (currentWriterMode === 'story') ? 'Could not generate the story. Please try again.' : 'Could not generate the plan. Please try again.';
        } finally {
            loadingIndicator.classList.add('hidden');
            generateContentButton.disabled = false; // Use new button ID
        }
    });

    function constructStoryPrompt(age, wordCount, language, ideaTexts) {
        return `You are a very kind, patient, and imaginative story writing assistant for a ${age}-year-old child (around 3rd grade level).
This child has dyslexia and language processing disorder. Your generated story MUST adhere to these guidelines:
- Language and Grammar: Use vocabulary and sentence structures that are appropriate and common for a ${age}-year-old. Avoid overly simplistic "baby talk" but ensure clarity. Sentences should be mostly simple or compound, avoiding complex clauses.
- Focus on Ideas: Strictly base the story on the child's provided ideas. If the ideas are about personal experiences (e.g., "my dog," "my trip to the park"), the story should reflect this personal context. Do NOT invent new main characters, random names, or unrelated plot elements unless the child's ideas explicitly suggest a fictional direction or ask for creative additions. This is often for homework about their own experiences or specific themes.
- Clarity for Learning Needs: While being age-appropriate, ensure the story is exceptionally clear and easy to follow. Help clarify and gently expand on the child's ideas.
- Tone: Maintain a highly positive, encouraging, and playful tone.
- Length: The story should be approximately ${wordCount} words long.
- Language: The story must be in ${language}.

Child's ideas:
${ideaTexts.map(idea => `- "${idea.replace(/"/g, "'")}"`).join('\n')}

Please provide ONLY the story text as your response. Do not add any preambles like "Here's a story..." or any concluding remarks. Just the story.`;
    }

    function constructGuidelinesPrompt(age, language, ideaTexts) {
        return `You are a very patient and supportive writing coach for a ${age}-year-old child (around 3rd grade level).
This child has dyslexia and language processing disorder and needs help structuring their own writing for homework or fun.
They have provided some ideas. Your task is to give them simple, actionable guidelines or a basic step-by-step plan to help them write their OWN piece using these ideas.

Your guidelines MUST be:
- Extremely Simple: Use very short sentences and the simplest possible vocabulary for a ${age}-year-old.
- Very Clear and Concrete: Break down tasks into tiny, manageable steps. Avoid abstract concepts.
- Structured: Present the guidelines as a clear list or sequence.
- Encouraging and Gentle: Use a very positive and patient tone.
- Focus on their Ideas: The guidelines should directly relate to the ideas the child provided. Help them think about how to connect their ideas. Do not suggest new, unrelated ideas.

The guidelines should be in ${language}.

Child's ideas:
${ideaTexts.map(idea => `- "${idea.replace(/"/g, "'")}"`).join('\n')}

Example of how to structure your response (but adapt to the child's ideas):
"Great ideas! Let's make a plan for your story:
1. Start by writing about: [mention first idea, e.g., 'your fun day']. What was the first thing that happened?
2. Next, you can tell me about: [mention second idea, e.g., 'playing with your friend']. What game did you play?
3. Then, add a sentence about: [mention third idea, e.g., 'eating ice cream']. What flavor was it?
4. How does your story end? You can write about how you felt.

Remember, just try your best and have fun writing!"

Please provide ONLY these kinds of guidelines or a simple plan. Do NOT write the story for them.`;
    }
    
    function showMessageToUser(message, type = 'info') { 
        if (type === 'error') {
            errorMessageDiv.textContent = message;
            errorMessageDiv.classList.remove('hidden');
            setTimeout(() => errorMessageDiv.classList.add('hidden'), 4000); 
        } else {
            console.info("Info:", message); 
        }
    }

    // Initial UI setup
    renderIdeas();
    updateModeUI(); // Set initial button text and mode styles

    // Menu toggle script (ensure this matches the one in other game pages if copied)
    const otherGamesButton = document.getElementById('other-games-button');
    const otherGamesDropdown = document.getElementById('other-games-dropdown');
    if (otherGamesButton && otherGamesDropdown) {
        const menuArea = otherGamesButton.parentElement; 
        menuArea.addEventListener('mouseenter', () => { otherGamesDropdown.classList.remove('hidden'); otherGamesButton.setAttribute('aria-expanded', 'true'); });
        menuArea.addEventListener('mouseleave', (event) => { if (!menuArea.contains(event.relatedTarget) && document.activeElement !== otherGamesButton && !otherGamesDropdown.contains(document.activeElement)) { otherGamesDropdown.classList.add('hidden'); otherGamesButton.setAttribute('aria-expanded', 'false'); } });
        otherGamesButton.addEventListener('focus', () => { otherGamesDropdown.classList.remove('hidden'); otherGamesButton.setAttribute('aria-expanded', 'true'); });
        otherGamesDropdown.addEventListener('focusin', () => { otherGamesDropdown.classList.remove('hidden'); });
        otherGamesDropdown.addEventListener('focusout', (event) => { if (!menuArea.contains(event.relatedTarget)) { otherGamesDropdown.classList.add('hidden'); otherGamesButton.setAttribute('aria-expanded', 'false'); } });
        otherGamesButton.addEventListener('click', (event) => { event.stopPropagation(); const isHidden = otherGamesDropdown.classList.toggle('hidden'); otherGamesButton.setAttribute('aria-expanded', String(!isHidden)); });
        document.addEventListener('click', (event) => { if (menuArea && !menuArea.contains(event.target)) { otherGamesDropdown.classList.add('hidden'); otherGamesButton.setAttribute('aria-expanded', 'false'); } });
    }
});

