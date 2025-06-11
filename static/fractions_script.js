// static/fractions_script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const numerator1Input = document.getElementById('numerator1');
    const denominator1Input = document.getElementById('denominator1');
    const numerator2Input = document.getElementById('numerator2');
    const denominator2Input = document.getElementById('denominator2');
    const comparisonSymbolElement = document.getElementById('comparison-symbol');
    const validationMessageContainer = document.getElementById('validation-message-container');

    const pizzaSvgF1 = document.getElementById('pizza-svg-f1');
    const pizzaSvgF2 = document.getElementById('pizza-svg-f2');
    const rectangleContainer = document.getElementById('rectangle-container');
    const numberLineSvg = document.getElementById('number-line-svg');

    // --- Constants ---
    const PIZZA_CX = 100;
    const PIZZA_CY = 100;
    const PIZZA_R = 90;
    const MAX_DENOMINATOR_VISUAL = 30;
    const MAX_NUMERATOR = 200;
    const MAX_DENOMINATOR = 200;

    // --- Helper Functions ---
    function toRadians(degrees) { return degrees * (Math.PI / 180); }

    function getPizzaSlicePath(startAngleDeg, endAngleDeg) {
        const startAngleRad = toRadians(startAngleDeg - 90);
        const endAngleRad = toRadians(endAngleDeg - 90);
        const x1 = PIZZA_CX + PIZZA_R * Math.cos(startAngleRad);
        const y1 = PIZZA_CY + PIZZA_R * Math.sin(startAngleRad);
        const x2 = PIZZA_CX + PIZZA_R * Math.cos(endAngleRad);
        const y2 = PIZZA_CY + PIZZA_R * Math.sin(endAngleRad);
        const angleDiff = Math.abs(endAngleDeg - startAngleDeg);
        const largeArcFlag = angleDiff <= 180 ? 0 : 1;
        return `M ${PIZZA_CX},${PIZZA_CY} L ${x1},${y1} A ${PIZZA_R},${PIZZA_R} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    }

    // --- Drawing Functions ---
    function drawPizza(num1, den1, num2, den2) {
        if (pizzaSvgF1) pizzaSvgF1.innerHTML = '';
        if (pizzaSvgF2) pizzaSvgF2.innerHTML = '';
        const visualDen1 = Math.min(den1, MAX_DENOMINATOR_VISUAL);
        if (visualDen1 > 0 && pizzaSvgF1) {
            const anglePerSlice1 = 360 / visualDen1;
            for (let i = 0; i < visualDen1; i++) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const startAngle = 360 - ((i + 1) * anglePerSlice1);
                const endAngle = 360 - (i * anglePerSlice1);
                path.setAttribute('d', getPizzaSlicePath(startAngle, endAngle));
                path.classList.add('pizza-slice');
                if (i < num1) { path.classList.add('filled-f1'); } 
                else { path.classList.add('empty-f1'); }
                pizzaSvgF1.appendChild(path);
            }
        }
        if (den2 > 0 && num2 !== null && pizzaSvgF2) {
            const visualDen2 = Math.min(den2, MAX_DENOMINATOR_VISUAL);
            const anglePerSlice2 = 360 / visualDen2;
            for (let i = 0; i < visualDen2; i++) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', getPizzaSlicePath(i * anglePerSlice2, (i + 1) * anglePerSlice2));
                path.classList.add('pizza-slice-f2'); 
                if (i < num2) { path.classList.add('filled-f2'); } 
                else { path.classList.add('empty-f2'); }
                pizzaSvgF2.appendChild(path);
            }
        }
    }
    
    function drawRectangle(num1, den1, num2, den2) {
        if (!rectangleContainer) { return; }
        rectangleContainer.innerHTML = ''; 
        const visualDen1 = Math.min(den1, MAX_DENOMINATOR_VISUAL);
        if (visualDen1 > 0) {
            const gridF1Container = document.createElement('div');
            gridF1Container.classList.add('rectangle-grid', 'grid-f1');
            createRectangleGridUI(gridF1Container, num1, visualDen1, 'f1', false);
            rectangleContainer.appendChild(gridF1Container);
        }
        if (den2 > 0 && num2 !== null) {
            const visualDen2 = Math.min(den2, MAX_DENOMINATOR_VISUAL);
            if (visualDen2 > 0) {
                const gridF2Container = document.createElement('div');
                gridF2Container.classList.add('rectangle-grid', 'grid-f2');
                createRectangleGridUI(gridF2Container, num2, visualDen2, 'f2', true);
                rectangleContainer.appendChild(gridF2Container);
            }
        }
    }

    function createRectangleGridUI(gridContainerElement, numerator, denominator, suffix, isF2) {
        const numRows = (denominator % 2 === 0 && denominator > 1) ? 2 : 1;
        const segmentsPerRow = denominator / numRows;
        if (!Number.isFinite(segmentsPerRow) || segmentsPerRow === 0) return;
        gridContainerElement.innerHTML = '';
        const fullBars = Math.floor(numerator / denominator);
        const remainingSlices = numerator % denominator;
        const totalBars = fullBars + (remainingSlices > 0 || (numerator === 0 && denominator > 0) ? 1 : 0);
        const barsToDrawCount = Math.max(1, totalBars);

        for (let i = 0; i < barsToDrawCount; i++) {
            const barInstance = document.createElement('div');
            barInstance.classList.add('rectangle-bar-instance');
            for (let r = 0; r < numRows; r++) {
                const row = document.createElement('div');
                row.classList.add('rectangle-row');
                for (let c = 0; c < segmentsPerRow; c++) {
                    const segment = document.createElement('div');
                    segment.classList.add('rectangle-segment');
                    if(isF2) segment.classList.add('rectangle-segment-f2');
                    const segmentIndexInBar = r * segmentsPerRow + c;
                    const filled = (i < fullBars) || (i === fullBars && segmentIndexInBar < remainingSlices);
                    segment.classList.add(filled ? `filled-${suffix}` : `empty-${suffix}`);
                    row.appendChild(segment);
                }
                barInstance.appendChild(row);
            }
            gridContainerElement.appendChild(barInstance);
        }
    }

    function drawNumberLine(num1, den1, num2, den2) {
        if (!numberLineSvg) { return; }
        numberLineSvg.innerHTML = '';
        
        const f1Valid = num1 !== null && den1 !== null;
        const f2Valid = num2 !== null && den2 !== null;

        if (!f1Valid && !f2Valid) {
             numberLineSvg.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888">Enter a fraction to begin</text>';
             return;
        }

        const svgWidth = 400, svgHeight = 100;
        const margin = { top: 20, right: 30, bottom: 40, left: 30 };
        const lineWidth = svgWidth - margin.left - margin.right;
        
        // ** FIX START **
        // Declare val1 and val2 here so they have function-wide scope
        let val1 = null;
        let val2 = null;
        
        let maxVal = 1;
        if (f1Valid) {
            val1 = num1 / den1;
            maxVal = Math.max(maxVal, val1);
        }
        if (f2Valid) {
            val2 = num2 / den2;
            maxVal = Math.max(maxVal, val2);
        }
        const lineMax = Math.max(1, Math.ceil(maxVal));
        // ** FIX END **


        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(margin.left)); 
        line.setAttribute('y1', String(svgHeight / 2));
        line.setAttribute('x2', String(margin.left + lineWidth)); 
        line.setAttribute('y2', String(svgHeight / 2));
        line.classList.add('line-path'); 
        numberLineSvg.appendChild(line); 

        for (let i = 0; i <= lineMax; i++) {
            if (!Number.isInteger(i)) continue;
            const x = margin.left + (i / lineMax) * lineWidth;
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', String(x)); tick.setAttribute('y1', String(svgHeight / 2 - 5));
            tick.setAttribute('x2', String(x)); tick.setAttribute('y2', String(svgHeight / 2 + 5));
            tick.classList.add('tick-major'); 
            numberLineSvg.appendChild(tick);
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', String(x)); label.setAttribute('y', String(svgHeight / 2 + 20));
            label.textContent = i; label.classList.add('label-axis'); 
            numberLineSvg.appendChild(label);
        }
        
        const denominatorsForTicks = [];
        if (f1Valid && den1 <= MAX_DENOMINATOR_VISUAL) denominatorsForTicks.push(den1);
        if (f2Valid && den2 <= MAX_DENOMINATOR_VISUAL && den1 !== den2) denominatorsForTicks.push(den2);

        denominatorsForTicks.forEach(currentDen => {
            if (currentDen > 1) { 
                for (let unit = 0; unit < lineMax; unit++) { 
                    for (let i = 1; i < currentDen; i++) {
                        const x = margin.left + ((unit + (i / currentDen)) / lineMax) * lineWidth;
                        if (x > margin.left + lineWidth + 1) continue; 
                        const tickMark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        tickMark.setAttribute('x1', String(x)); tickMark.setAttribute('y1', String(svgHeight / 2 - 2));
                        tickMark.setAttribute('x2', String(x)); tickMark.setAttribute('y2', String(svgHeight / 2 + 2));
                        tickMark.classList.add('tick-minor'); 
                        if (denominatorsForTicks.length > 1 && currentDen === den2) {
                            tickMark.style.stroke = '#32CD32';
                            tickMark.style.strokeDasharray = "2,2";
                        }
                        numberLineSvg.appendChild(tickMark);
                    }
                }
            }
        });

        if (f1Valid) { 
            const x1 = margin.left + (val1 / lineMax) * lineWidth; 
            if (x1 <= margin.left + lineWidth + 1) { 
                const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker1.setAttribute('cx', String(x1)); marker1.setAttribute('cy', String(svgHeight / 2));
                marker1.setAttribute('r', '5'); marker1.classList.add('marker-f1');
                numberLineSvg.appendChild(marker1);
                const label1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label1.setAttribute('x', String(x1)); label1.setAttribute('y', String(svgHeight / 2 - 10));
                label1.textContent = `${num1}/${den1}`; label1.classList.add('label-f1');
                numberLineSvg.appendChild(label1);
            }
        }

        if (f2Valid) { 
            const x2 = margin.left + (val2 / lineMax) * lineWidth;
            if (x2 <= margin.left + lineWidth + 1) {
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', String(x2)); marker2.setAttribute('cy', String(svgHeight / 2));
                marker2.setAttribute('r', '5'); marker2.classList.add('marker-f2');
                numberLineSvg.appendChild(marker2);
                const label2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label2.setAttribute('x', String(x2));
                // ** FIX START **
                // Now val1 and val2 are both available in this scope
                let yOffsetF2 = (f1Valid && Math.abs(val1 - val2) < (0.15 * lineMax)) ? svgHeight / 2 + 30 : svgHeight / 2 - 10;
                // ** FIX END **
                label2.setAttribute('y', String(yOffsetF2));
                label2.textContent = `${num2}/${den2}`; label2.classList.add('label-f2');
                numberLineSvg.appendChild(label2);
            }
        }
    }

    function compareFractions(num1, den1, num2, den2) {
        const val1 = num1 / den1; const val2 = num2 / den2;
        if (comparisonSymbolElement) {
            if (val1 < val2) comparisonSymbolElement.textContent = '<';
            else if (val1 > val2) comparisonSymbolElement.textContent = '>';
            else comparisonSymbolElement.textContent = '==';
        }
    }
    
    function validateAndGetValues() {
        if (validationMessageContainer) validationMessageContainer.textContent = '';
        
        let num1_raw = parseInt(numerator1Input.value);
        let den1_raw = parseInt(denominator1Input.value);
        let num2_raw = parseInt(numerator2Input.value);
        let den2_raw = parseInt(denominator2Input.value);
        
        if (num1_raw > MAX_NUMERATOR) { num1_raw = MAX_NUMERATOR; numerator1Input.value = MAX_NUMERATOR; }
        if (num2_raw > MAX_NUMERATOR) { num2_raw = MAX_NUMERATOR; numerator2Input.value = MAX_NUMERATOR; }
        
        if (den1_raw > MAX_DENOMINATOR) { den1_raw = MAX_DENOMINATOR; denominator1Input.value = MAX_DENOMINATOR; }
        if (den2_raw > MAX_DENOMINATOR) { den2_raw = MAX_DENOMINATOR; denominator2Input.value = MAX_DENOMINATOR; }
        
        const f1_isDrawable = !isNaN(num1_raw) && !isNaN(den1_raw) && den1_raw > 0;
        const f2_isDrawable = !isNaN(num2_raw) && !isNaN(den2_raw) && den2_raw > 0;

        return {
            num1: f1_isDrawable ? num1_raw : null,
            den1: f1_isDrawable ? den1_raw : null,
            num2: f2_isDrawable ? num2_raw : null,
            den2: f2_isDrawable ? den2_raw : null,
        }
    }

    function updateVisualizations() {
        if (!numerator1Input || !denominator1Input || !numerator2Input || !denominator2Input) { return; }
        const values = validateAndGetValues();
        
        drawPizza(values.num1, values.den1, values.num2, values.den2);
        drawRectangle(values.num1, values.den1, values.num2, values.den2);
        drawNumberLine(values.num1, values.den1, values.num2, values.den2);

        if (comparisonSymbolElement) comparisonSymbolElement.textContent = '';
        if(values.num1 !== null && values.den1 !== null && values.num2 !== null && values.den2 !== null) {
            compareFractions(values.num1, values.den1, values.num2, values.den2);
        }
    }

    // --- Initial Setup ---
    if (numerator1Input && denominator1Input && numerator2Input && denominator2Input) {
        [numerator1Input, denominator1Input, numerator2Input, denominator2Input].forEach(input => {
            input.addEventListener('input', updateVisualizations);
        });
        updateVisualizations(); 
    } else {
        console.error("Fraction input elements not found. Visualizations may not work.");
    }
});

