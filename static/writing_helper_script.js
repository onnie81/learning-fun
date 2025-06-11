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
    const generateContentButton = document.getElementById('generate-content-button'); 
    
    const outputSection = document.getElementById('output-section'); 
    const outputTitle = document.getElementById('output-title'); 
    const generatedContentDiv = document.getElementById('generated-content'); 
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
    let currentWriterMode = 'story'; 

    let cachedContent = { 
        plan: null, 
        story: null, 
        ideasSnapshot: null, 
        settingsSnapshot: null 
    };

    // --- localStorage Keys ---
    const LS_IDEAS_KEY = 'writingHelper_ideas';
    const LS_MODE_KEY = 'writingHelper_mode';
    const LS_SETTINGS_KEY = 'writingHelper_settings';
    const LS_CACHED_CONTENT_KEY = 'writingHelper_cachedContent';
    const LS_NEXT_COLOR_INDEX_KEY = 'writingHelper_nextColorIndex';

    // --- Load from localStorage ---
    function loadState() {
        const storedIdeas = localStorage.getItem(LS_IDEAS_KEY);
        if (storedIdeas) {
            ideas = JSON.parse(storedIdeas);
        }

        const storedMode = localStorage.getItem(LS_MODE_KEY);
        if (storedMode) {
            currentWriterMode = storedMode;
        }

        const storedSettings = localStorage.getItem(LS_SETTINGS_KEY);
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            writerAgeSelect.value = settings.age || '9';
            wordCountSelect.value = settings.wordCount || '100';
            languageSelect.value = settings.language || 'English';
        }

        const storedCachedContent = localStorage.getItem(LS_CACHED_CONTENT_KEY);
        if (storedCachedContent) {
            cachedContent = JSON.parse(storedCachedContent);
        }
        
        const storedColorIndex = localStorage.getItem(LS_NEXT_COLOR_INDEX_KEY);
        if (storedColorIndex) {
            nextColorIndex = parseInt(storedColorIndex, 10);
        }
    }

    // --- Save to localStorage ---
    function saveIdeas() {
        localStorage.setItem(LS_IDEAS_KEY, JSON.stringify(ideas));
        localStorage.setItem(LS_NEXT_COLOR_INDEX_KEY, nextColorIndex.toString());
    }

    function saveMode() {
        localStorage.setItem(LS_MODE_KEY, currentWriterMode);
    }

    function saveSettings() {
        const settings = {
            age: writerAgeSelect.value,
            wordCount: wordCountSelect.value,
            language: languageSelect.value
        };
        localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(settings));
    }

    function saveCachedContent() {
        localStorage.setItem(LS_CACHED_CONTENT_KEY, JSON.stringify(cachedContent));
    }


    function getSettingsSnapshot() { 
        const age = writerAgeSelect.value;
        const language = languageSelect.value;
        const wordCount = wordCountSelect.value; 
        return JSON.stringify({ age, wordCount, language });
    }

    function ideasToStringSnapshot(currentIdeas) {
        return JSON.stringify(currentIdeas.map(idea => idea.text).sort());
    }

    function displayCachedContent() {
        const currentIdeasSnap = ideasToStringSnapshot(ideas);
        const currentSettingsSnap = getSettingsSnapshot();

        if (cachedContent.ideasSnapshot === currentIdeasSnap && cachedContent.settingsSnapshot === currentSettingsSnap) {
            if (currentWriterMode === 'story' && cachedContent.story) {
                generatedContentDiv.textContent = cachedContent.story;
                outputSection.classList.remove('hidden');
                return true;
            } else if (currentWriterMode === 'plan' && cachedContent.plan) {
                generatedContentDiv.innerHTML = cachedContent.plan; 
                outputSection.classList.remove('hidden');
                return true;
            }
        }
        generatedContentDiv.innerHTML = '';
        if (ideas.length > 0) { 
             outputSection.classList.add('hidden');
        } else {
            outputSection.classList.add('hidden'); // Ensure it's hidden if no ideas either
        }
        return false; 
    }

    function updateModeUI() {
        if (currentWriterMode === 'story') {
            modeSwitchButton.classList.remove('bg-switchBg');
            modeSwitchButton.classList.add('bg-switchActiveBg');
            modeSwitchHandle.classList.remove('translate-x-0');
            modeSwitchHandle.classList.add('translate-x-7');
            modeSwitchButton.setAttribute('aria-checked', 'true');
            modeLabelStory.classList.add('font-bold', 'text-primary');
            modeLabelPlan.classList.remove('font-bold', 'text-primary');
            modeLabelPlan.classList.add('text-gray-700');
            generateContentButton.textContent = 'Write My Story!'; 
            outputTitle.textContent = 'Your Story!';
        } else { 
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
        
        displayCachedContent(); 
        errorMessageDiv.classList.add('hidden');
        saveMode(); // Save mode when UI updates
    }

    modeSwitchButton.addEventListener('click', () => {
        currentWriterMode = (currentWriterMode === 'story') ? 'plan' : 'story';
        updateModeUI();
    });

    function invalidateCacheAndSave() { 
        cachedContent = { plan: null, story: null, ideasSnapshot: null, settingsSnapshot: null };
        saveCachedContent(); // Save the invalidated cache
        generatedContentDiv.innerHTML = '';
        if (ideas.length > 0) {
            outputSection.classList.add('hidden');
        }
    }
    
    [writerAgeSelect, wordCountSelect, languageSelect].forEach(select => {
        select.addEventListener('change', () => {
            saveSettings(); // Save settings on change
            invalidateCacheAndSave();
            updateModeUI(); 
        });
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
            generateContentButton.disabled = true; 
            invalidateCacheAndSave(); 
            outputSection.classList.add('hidden'); 
            saveIdeas(); // Save empty ideas list
            return;
        }
        
        generateContentButton.disabled = false; 
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
                saveIdeas(); // Save after deleting
                invalidateCacheAndSave(); 
                renderIdeas(); 
                updateModeUI(); 
            };
            bubble.appendChild(deleteButton);
            ideasListContainer.appendChild(bubble);
        });
        saveIdeas(); // Save after rendering all ideas
    }

    addIdeaButton.addEventListener('click', () => {
        const ideaText = ideaInput.value.trim();
        if (ideaText) {
            ideas.push({ text: ideaText, colorIndex: nextColorIndex });
            nextColorIndex = (nextColorIndex + 1) % bubbleColors.length;
            ideaInput.value = '';
            saveIdeas(); // Save after adding
            invalidateCacheAndSave(); 
            renderIdeas();
            updateModeUI(); 
            ideaInput.focus();
        }
    });

    ideaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addIdeaButton.click(); }
    });

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

    generateContentButton.addEventListener('click', async () => { 
        if (ideas.length === 0) {
            showMessageToUser('Please add some ideas first!', 'error');
            return;
        }

        outputSection.classList.remove('hidden'); 
        loadingIndicator.classList.remove('hidden');
        generatedContentDiv.innerHTML = ''; 
        errorMessageDiv.classList.add('hidden');
        errorMessageDiv.textContent = '';
        generateContentButton.disabled = true; 

        const age = writerAgeSelect.value;
        const wordCount = wordCountSelect.value; 
        const language = languageSelect.value;
        const ideaTexts = ideas.map(idea => idea.text);
        
        const currentIdeasSnap = ideasToStringSnapshot(ideas);
        const currentSettingsSnap = getSettingsSnapshot(); 

        const prompt = constructCombinedPrompt(age, wordCount, language, ideaTexts);
        outputTitle.textContent = (currentWriterMode === 'story') ? "Your Story!" : "Your Writing Plan!";

        try {
            const apiKey = await getApiKeyFromServer(); 
            if (!apiKey) { throw new Error("API Key could not be retrieved from server.");}

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
                const combinedText = result.candidates[0].content.parts[0].text;
                
                const planEndMarker = "[PLAN END]";
                const storyStartMarker = "[STORY START]";
                const planStartMarker = "[PLAN START]"; // Added for more robust parsing
                const storyEndMarker = "[STORY END]"; // Added for more robust parsing
                
                let parsedPlan = "Could not extract plan. The AI might not have followed the format.";
                let parsedStory = "Could not extract story. The AI might not have followed the format.";

                const planStartIndexActual = combinedText.indexOf(planStartMarker);
                const planEndIndexActual = combinedText.indexOf(planEndMarker);
                const storyStartIndexActual = combinedText.indexOf(storyStartMarker);
                const storyEndIndexActual = combinedText.indexOf(storyEndMarker);

                if (planStartIndexActual !== -1 && planEndIndexActual !== -1 && planEndIndexActual > planStartIndexActual) {
                    parsedPlan = combinedText.substring(planStartIndexActual + planStartMarker.length, planEndIndexActual).trim();
                }
                if (storyStartIndexActual !== -1 && storyEndIndexActual !== -1 && storyEndIndexActual > storyStartIndexActual) {
                    parsedStory = combinedText.substring(storyStartIndexActual + storyStartMarker.length, storyEndIndexActual).trim();
                } else if (storyStartIndexActual !== -1) { // Fallback if [STORY END] is missing
                     parsedStory = combinedText.substring(storyStartIndexActual + storyStartMarker.length).trim();
                }
                
                cachedContent.plan = parsedPlan.replace(/^- /gm, '• ').replace(/^\* /gm, '• ').split('\n').map(line => `<p>${line}</p>`).join('');
                cachedContent.story = parsedStory;
                cachedContent.ideasSnapshot = currentIdeasSnap;
                cachedContent.settingsSnapshot = currentSettingsSnap;
                saveCachedContent(); // Save the new cache

                updateModeUI(); 

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
            generatedContentDiv.textContent = 'Could not generate content. Please try again.';
            invalidateCacheAndSave(); 
        } finally {
            loadingIndicator.classList.add('hidden');
            generateContentButton.disabled = false; 
        }
    });

    function constructCombinedPrompt(age, wordCount, language, ideaTexts) {
        return `You are a very kind, patient, and highly skilled writing assistant for a ${age}-year-old child (around 3rd grade level).
This child has dyslexia and language processing disorder. Your response MUST be structured into two distinct parts, clearly marked.

First, provide a simple, step-by-step writing plan. This plan should:
- Be extremely easy to understand, using very short sentences and common vocabulary suitable for a ${age}-year-old with reading challenges.
- Break down the writing process into tiny, manageable, concrete steps.
- Directly relate to the child's provided ideas and help them structure their thoughts.
- Be encouraging and gentle in tone.
- Be in ${language}.
Mark this section clearly like this:
[PLAN START]
(Your plan here, using bullet points or numbered steps. Each step should be a new paragraph or clearly separated.)
[PLAN END]

Second, immediately after the plan, write an example story that perfectly follows THE EXACT PLAN you just created. This story should:
- Use vocabulary and sentence structures appropriate and common for a ${age}-year-old. Avoid oversimplification if the ideas are rich, but prioritize clarity.
- Strictly base the story on the child's provided ideas and the plan you outlined. If ideas are personal, reflect that. Avoid inventing unrelated characters/plots unless the ideas strongly imply a fictional direction.
- Be exceptionally clear and easy to follow.
- Maintain a highly positive, encouraging, and playful tone.
- Be limited to ${wordCount} words long.
- Be in ${language}.
Mark this section clearly like this:
[STORY START]
(Your example story here. Ensure it is distinct from the plan.)
[STORY END]

The child's ideas are:
${ideaTexts.map(idea => `- "${idea.replace(/"/g, "'")}"`).join('\n')}

Ensure your entire response contains both the plan and the story, correctly marked with [PLAN START], [PLAN END], [STORY START], and [STORY END].
The story should be a direct example of the plan in action.`;
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
    
    // --- Initial Load ---
    loadState(); // Load saved state first
    renderIdeas(); // Then render ideas based on loaded state
    updateModeUI(); // Then update UI based on loaded mode and display cached content if valid

    // --- Menu Logic ---
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

