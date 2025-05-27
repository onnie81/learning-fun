// static/clocks_script.js
document.addEventListener('DOMContentLoaded', () => {
    const analogClockSVG = document.getElementById('analog-clock-svg');
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    const clockContainer = document.getElementById('analog-clock-container');

    const digitalHourSegment = document.getElementById('digital-hour');
    const digitalMinuteSegment = document.getElementById('digital-minute');
    const digitalSecondSegment = document.getElementById('digital-second');
    const digitalSegments = [digitalHourSegment, digitalMinuteSegment, digitalSecondSegment];
    
    const messageBox = document.getElementById('message-box');

    let draggingHand = null; 
    let intervalId = null; 
    let clockState = { hours: 0, minutes: 0, seconds: 0, mode: 'live' };
    let activeInput = null; 
    let currentlyHoveredHandElement = null;

    function updateDisplays(h, m, s) {
        const secondDeg = s * 6;
        const minuteDeg = (m * 6) + (s * 0.1); 
        const hourDeg = ((h % 12) * 30) + (m * 0.5) + (s * (0.5 / 60)); 

        secondHand.setAttribute('transform', `rotate(${secondDeg} 100 100)`);
        minuteHand.setAttribute('transform', `rotate(${minuteDeg} 100 100)`);
        hourHand.setAttribute('transform', `rotate(${hourDeg} 100 100)`);

        if (!activeInput || activeInput.dataset.unit !== 'hour') {
            digitalHourSegment.textContent = String(h).padStart(2, '0');
        }
        if (!activeInput || activeInput.dataset.unit !== 'minute') {
            digitalMinuteSegment.textContent = String(m).padStart(2, '0');
        }
        if (!activeInput || activeInput.dataset.unit !== 'second') {
            digitalSecondSegment.textContent = String(s).padStart(2, '0');
        }
    }

    function tick() {
        if (clockState.mode === 'live' && !activeInput && !draggingHand) {
            const now = new Date();
            clockState.hours = now.getHours();
            clockState.minutes = now.getMinutes();
            clockState.seconds = now.getSeconds();
        } else if (clockState.mode === 'manual') {
            clockState.seconds++;
            if (clockState.seconds >= 60) {
                clockState.seconds = 0;
                clockState.minutes++;
                if (clockState.minutes >= 60) {
                    clockState.minutes = 0;
                    clockState.hours++;
                    if (clockState.hours >= 24) {
                        clockState.hours = 0;
                    }
                }
            }
        }
        updateDisplays(clockState.hours, clockState.minutes, clockState.seconds);
    }

    function startClockTicking() {
        if (intervalId) clearInterval(intervalId);
        tick(); 
        intervalId = setInterval(tick, 1000);
    }
    
    function setManualTime(h, m, s) {
        clockState.mode = 'manual';
        clockState.hours = parseInt(h, 10);
        clockState.minutes = parseInt(m, 10);
        clockState.seconds = parseInt(s, 10);

        if (isNaN(clockState.hours) || clockState.hours < 0 || clockState.hours > 23) clockState.hours = 0;
        if (isNaN(clockState.minutes) || clockState.minutes < 0 || clockState.minutes > 59) clockState.minutes = 0;
        if (isNaN(clockState.seconds) || clockState.seconds < 0 || clockState.seconds > 59) clockState.seconds = 0;
        
        if (intervalId) clearInterval(intervalId); 
        startClockTicking(); 
        updateDisplays(clockState.hours, clockState.minutes, clockState.seconds); 
    }

    digitalSegments.forEach(segment => {
        segment.addEventListener('click', () => handleSegmentClick(segment));
        segment.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSegmentClick(segment); }
        });
    });

    function handleSegmentClick(segment) {
        if (activeInput) return; 
        clockState.mode = 'manual'; 
        if (intervalId) clearInterval(intervalId); 

        const unit = segment.dataset.unit;
        const currentValue = segment.textContent;
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'digital-segment-input';
        input.value = currentValue;
        input.dataset.unit = unit; 
        input.style.fontSize = getComputedStyle(segment).fontSize;

        if (unit === 'hour') { input.min = '0'; input.max = '23'; } 
        else { input.min = '0'; input.max = '59'; }

        segment.textContent = ''; 
        segment.appendChild(input);
        input.select(); 
        activeInput = input;
        segment.classList.add('editing');

        input.addEventListener('blur', () => applyDigitalChange(input, segment, currentValue));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); } 
            else if (e.key === 'Escape') { e.preventDefault(); revertDigitalChange(segment, currentValue); }
        });
    }

    function applyDigitalChange(inputElement, originalSegment, oldValue) {
        if (!activeInput || activeInput !== inputElement) return;
        let newValue = parseInt(inputElement.value, 10);
        const unit = originalSegment.dataset.unit;
        let isValid = true;

        if (unit === 'hour') { if (isNaN(newValue) || newValue < 0 || newValue > 23) isValid = false; } 
        else { if (isNaN(newValue) || newValue < 0 || newValue > 59) isValid = false; }

        if (!isValid) {
            newValue = parseInt(oldValue, 10); 
            showMessage(`${unit.charAt(0).toUpperCase() + unit.slice(1)} input invalid. Reverted.`);
        }
        
        originalSegment.textContent = String(newValue).padStart(2, '0');
        if (originalSegment.contains(inputElement)) { originalSegment.removeChild(inputElement); }
        activeInput = null;
        originalSegment.classList.remove('editing');

        let h = (unit === 'hour') ? newValue : parseInt(digitalHourSegment.textContent, 10);
        let m = (unit === 'minute') ? newValue : parseInt(digitalMinuteSegment.textContent, 10);
        let s = (unit === 'second') ? newValue : parseInt(digitalSecondSegment.textContent, 10);
        
        setManualTime(h, m, s); 
        if (isValid) showMessage(`Time updated via digital ${unit}.`);
    }
    
    function revertDigitalChange(originalSegment, oldValue) {
        if (activeInput && originalSegment.contains(activeInput)) {
            originalSegment.removeChild(activeInput);
        }
        originalSegment.textContent = oldValue;
        activeInput = null;
        originalSegment.classList.remove('editing');
        startClockTicking(); 
    }

    function getAngleFromPoint(event) {
        const rect = analogClockSVG.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let clientX, clientY;
        if (event.touches) { clientX = event.touches[0].clientX; clientY = event.touches[0].clientY; } 
        else { clientX = event.clientX; clientY = event.clientY; }
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        return angle;
    }

    const HAND_HIT_TOLERANCE = 15; 

    function getHandNearAngle(targetAngle) {
        const currentHourAngle = (((clockState.hours % 12) * 30) + (clockState.minutes * 0.5) + (clockState.seconds * (0.5/60))) % 360;
        const currentMinuteAngle = ((clockState.minutes * 6) + (clockState.seconds * 0.1)) % 360;
        const currentSecondAngle = (clockState.seconds * 6) % 360;

        const diffAngle = (a1, a2) => {
            let diff = Math.abs(a1 - a2);
            return Math.min(diff, 360 - diff); 
        };

        // Check in order of "thinnest" or "hardest to hit" visually, or by typical interaction desire
        if (diffAngle(targetAngle, currentSecondAngle) <= HAND_HIT_TOLERANCE) return secondHand;
        if (diffAngle(targetAngle, currentMinuteAngle) <= HAND_HIT_TOLERANCE) return minuteHand;
        if (diffAngle(targetAngle, currentHourAngle) <= HAND_HIT_TOLERANCE) return hourHand; // Hour hand is thickest, check last
        return null;
    }
    
    function clearAllHandHovers() {
        hourHand.classList.remove('hand-hover-active', 'hand-hoverable');
        minuteHand.classList.remove('hand-hover-active', 'hand-hoverable');
        secondHand.classList.remove('hand-hover-active', 'hand-hoverable');
        digitalHourSegment.classList.remove('analog-hover-highlight');
        digitalMinuteSegment.classList.remove('analog-hover-highlight');
        digitalSecondSegment.classList.remove('analog-hover-highlight');
        currentlyHoveredHandElement = null;
    }

    clockContainer.addEventListener('mousemove', (event) => {
        if (draggingHand || activeInput) { 
            if(!draggingHand) clearAllHandHovers(); // Clear hover if editing digital, but not if dragging
            return;
        }
        const angle = getAngleFromPoint(event);
        const handElement = getHandNearAngle(angle);

        if (handElement !== currentlyHoveredHandElement) {
            clearAllHandHovers(); 
            if (handElement) {
                handElement.classList.add('hand-hover-active');
                handElement.classList.add('hand-hoverable');
                currentlyHoveredHandElement = handElement;
                if (handElement === hourHand) digitalHourSegment.classList.add('analog-hover-highlight');
                else if (handElement === minuteHand) digitalMinuteSegment.classList.add('analog-hover-highlight');
                else if (handElement === secondHand) digitalSecondSegment.classList.add('analog-hover-highlight');
            }
        }
    });

    clockContainer.addEventListener('mouseleave', () => {
        if (!draggingHand) { 
            clearAllHandHovers();
        }
    });

    function startDrag(event) {
        event.preventDefault();
        if (activeInput) activeInput.blur(); 
        
        const angle = getAngleFromPoint(event);
        const handToDrag = getHandNearAngle(angle);

        if (!handToDrag) return; 

        draggingHand = handToDrag.id.split('-')[0]; 
        
        clockState.mode = 'manual'; 
        if (intervalId) clearInterval(intervalId); 

        clearAllHandHovers(); // Clear hover highlights
        // Apply dragging highlight
        if (draggingHand === 'hour') hourHand.classList.add('hand-dragging');
        else if (draggingHand === 'minute') minuteHand.classList.add('hand-dragging');
        else if (draggingHand === 'second') secondHand.classList.add('hand-dragging');
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    function onDrag(event) {
        event.preventDefault();
        if (!draggingHand) return;
        const angle = getAngleFromPoint(event);
        let h = clockState.hours; 
        let m = clockState.minutes;
        let s = clockState.seconds; 

        if (draggingHand === 'minute') {
            m = Math.round(angle / 6) % 60;
            if (m < 0) m += 60;
            s = 0; 
        } else if (draggingHand === 'hour') {
            let hourValueFromAngle = (angle / 30); 
            let newH = Math.floor(hourValueFromAngle % 12); 
            if (newH === 0) newH = 12; 
            if (h >= 12) { if (newH !== 12) h = newH + 12; else h = 12; } 
            else { if (newH === 12) h = 0; else h = newH; }
            m = 0; 
            s = 0;
        } else if (draggingHand === 'second') {
            s = Math.round(angle / 6) % 60;
            if (s < 0) s += 60;
        }
        setManualTime(h, m, s); 
    }

    function endDrag() {
        if (draggingHand) {
            showMessage("Time set by dragging hands!");
            if (draggingHand === 'hour') hourHand.classList.remove('hand-dragging');
            if (draggingHand === 'minute') minuteHand.classList.remove('hand-dragging');
            if (draggingHand === 'second') secondHand.classList.remove('hand-dragging');
        }
        draggingHand = null;
        startClockTicking(); 
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('touchend', endDrag);
    }

    clockContainer.addEventListener('mousedown', startDrag);
    clockContainer.addEventListener('touchstart', startDrag, { passive: false });

    function drawClockFace() {
        for (let i = 0; i < 60; i++) {
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const angleDeg = i * 6;
            const isHourTick = i % 5 === 0;
            const length = isHourTick ? 10 : 5;
            const strokeWidth = isHourTick ? 2.5 : 1.5;
            tick.setAttribute('x1', '100'); tick.setAttribute('y1', String(100 - 95)); 
            tick.setAttribute('x2', '100'); tick.setAttribute('y2', String(100 - 95 + length));
            tick.setAttribute('stroke', '#7f8c8d'); tick.setAttribute('stroke-width', String(strokeWidth));
            tick.setAttribute('transform', `rotate(${angleDeg} 100 100)`);
            analogClockSVG.insertBefore(tick, hourHand); 
        }
        for (let i = 1; i <= 12; i++) {
            const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            const angleRad = (i * 30 - 90) * (Math.PI / 180); 
            const r = 80; 
            textEl.setAttribute('x', String(100 + r * Math.cos(angleRad)));
            textEl.setAttribute('y', String(100 + r * Math.sin(angleRad) + 4)); 
            textEl.setAttribute('text-anchor', 'middle');
            // Line 325 in my previous count was here. Checked for syntax.
            textEl.setAttribute('font-family', 'Inter, sans-serif'); 
            textEl.setAttribute('font-size', '12');
            textEl.setAttribute('fill', '#333');
            textEl.textContent = i;
            analogClockSVG.insertBefore(textEl, hourHand);
        }
    }
    
    function showMessage(text) {
        messageBox.textContent = text;
        messageBox.classList.remove('hidden', 'opacity-0');
        messageBox.classList.add('opacity-100');
        setTimeout(() => {
            messageBox.classList.remove('opacity-100');
            messageBox.classList.add('opacity-0');
            setTimeout(() => messageBox.classList.add('hidden'), 500); 
        }, 2000);
    }

    const otherGamesButton = document.getElementById('other-games-button');
    const otherGamesDropdown = document.getElementById('other-games-dropdown');
    if (otherGamesButton && otherGamesDropdown) {
        const menuArea = otherGamesButton.parentElement; 
        menuArea.addEventListener('mouseenter', () => {
            otherGamesDropdown.classList.remove('hidden');
            otherGamesButton.setAttribute('aria-expanded', 'true');
        });
        menuArea.addEventListener('mouseleave', (event) => {
            if (!menuArea.contains(event.relatedTarget) && // Check if focus has not moved to a child of menuArea
                document.activeElement !== otherGamesButton && // Check if button itself is not focused
                !otherGamesDropdown.contains(document.activeElement)) { // Check if dropdown is not focused
                otherGamesDropdown.classList.add('hidden');
                otherGamesButton.setAttribute('aria-expanded', 'false');
            }
        });
        otherGamesButton.addEventListener('focus', () => {
            otherGamesDropdown.classList.remove('hidden');
            otherGamesButton.setAttribute('aria-expanded', 'true');
        });
        
        otherGamesDropdown.addEventListener('focusout', (event) => { 
            // If focus moves to something outside the entire menu area (button + dropdown)
            if (!menuArea.contains(event.relatedTarget)) { 
                otherGamesDropdown.classList.add('hidden');
                otherGamesButton.setAttribute('aria-expanded', 'false');
            }
        });
        otherGamesButton.addEventListener('click', (event) => {
            event.stopPropagation(); 
            const isHidden = otherGamesDropdown.classList.toggle('hidden');
            otherGamesButton.setAttribute('aria-expanded', String(!isHidden));
        });
        document.addEventListener('click', (event) => {
            if (menuArea && !menuArea.contains(event.target)) {
                otherGamesDropdown.classList.add('hidden');
                otherGamesButton.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    drawClockFace();
    startClockTicking(); 
});

