// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const numerator1Input = document.getElementById('numerator1');
    const denominator1Input = document.getElementById('denominator1');
    const validationMessage1 = document.getElementById('validation-message1');
    const numerator2Input = document.getElementById('numerator2');
    const denominator2Input = document.getElementById('denominator2');
    const validationMessage2 = document.getElementById('validation-message2');
    const comparisonSymbolElement = document.getElementById('comparison-symbol');

    const pizzaSvgF1 = document.getElementById('pizza-svg-f1');
    const pizzaSvgF2 = document.getElementById('pizza-svg-f2');
    const rectangleContainer = document.getElementById('rectangle-container');
    const numberLineSvg = document.getElementById('number-line-svg');

    const PIZZA_CX = 100;
    const PIZZA_CY = 100;
    const PIZZA_R = 90;

    const COLOR_F1_FILL = tailwind.config.theme.extend.colors.primary;
    const COLOR_F1_EMPTY = tailwind.config.theme.extend.colors.secondary;
    // const COLOR_F2_FILL_RAW = tailwind.config.theme.extend.colors.fractionTwo; // Not directly used for fill
    const COLOR_F2_FILL_TRANSPARENT = tailwind.config.theme.extend.colors.fractionTwoFill;
    const COLOR_F2_EMPTY = 'rgba(255, 215, 0, 0.3)'; // More transparent gold for F2 empty

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
        // Always sweep clockwise for standard slice drawing from start to end angle
        return `M ${PIZZA_CX},${PIZZA_CY} L ${x1},${y1} A ${PIZZA_R},${PIZZA_R} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    }

    function drawPizza(num1, den1, num2, den2) {
        pizzaSvgF1.innerHTML = '';
        pizzaSvgF2.innerHTML = '';

        // Draw Fraction 1 Pizza (packs right/counter-clockwise from top-right)
        if (den1 > 0) {
            const anglePerSlice1 = 360 / den1;
            for (let i = 0; i < den1; i++) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                // To pack from the "right", we draw slices counter-clockwise starting from the 360/0 degree point.
                // The i-th slice (0-indexed) from the right will be:
                const startAngle = 360 - ((i + 1) * anglePerSlice1);
                const endAngle = 360 - (i * anglePerSlice1);
                
                path.setAttribute('d', getPizzaSlicePath(startAngle, endAngle));
                path.classList.add('pizza-slice');
                if (i < num1) { // Fill the first num1 slices when counting from the right
                    path.classList.add('filled-f1');
                    path.style.fill = COLOR_F1_FILL;
                } else {
                    path.classList.add('empty-f1');
                    path.style.fill = COLOR_F1_EMPTY;
                }
                pizzaSvgF1.appendChild(path);
            }
        }

        // Draw Fraction 2 Pizza (packs left/clockwise from top)
        if (den2 > 0 && num2 !== null) {
            const anglePerSlice2 = 360 / den2;
            for (let i = 0; i < den2; i++) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                // Slices are drawn clockwise from the top (0 degrees)
                path.setAttribute('d', getPizzaSlicePath(i * anglePerSlice2, (i + 1) * anglePerSlice2));
                path.classList.add('pizza-slice-f2'); 
                
                if (i < num2) { // Fill the first num2 slices
                    path.classList.add('filled-f2');
                    path.style.fill = COLOR_F2_FILL_TRANSPARENT;
                } else {
                    path.classList.add('empty-f2');
                    path.style.fill = COLOR_F2_EMPTY;
                }
                pizzaSvgF2.appendChild(path);
            }
        }
    }
    
    function drawRectangle(num1, den1, num2, den2) {
        rectangleContainer.innerHTML = ''; // Clear previous content

        // Create grid container for Fraction 1
        if (den1 > 0) {
            const gridF1Container = document.createElement('div');
            gridF1Container.classList.add('rectangle-grid', 'grid-f1');
            rectangleContainer.appendChild(gridF1Container);
            createRectangleGrid(gridF1Container, num1, den1, 'f1', false);
        }

        // Create grid container for Fraction 2 (superimposed)
        if (den2 > 0 && num2 !== null) {
            const gridF2Container = document.createElement('div');
            gridF2Container.classList.add('rectangle-grid', 'grid-f2');
            rectangleContainer.appendChild(gridF2Container);
            createRectangleGrid(gridF2Container, num2, den2, 'f2', true);
        }
    }

    function createRectangleGrid(container, num, den, fractionClassSuffix, isFractionTwo) {
        // Determine rows for this specific fraction's grid
        const numRows = (den % 2 === 0 && den > 1 && den !== 0) ? 2 : 1;
        const segmentsPerRow = den > 0 ? den / numRows : 0;

        container.innerHTML = ''; // Clear specific grid container

        const segments = []; // Flat list of all segment DOM elements for this grid
        for (let r = 0; r < numRows; r++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('rectangle-row');
            // Height of rowDiv is handled by flex-grow in CSS
            for (let c = 0; c < segmentsPerRow; c++) {
                const segment = document.createElement('div');
                segment.classList.add(`rectangle-segment`);
                if (isFractionTwo) {
                    segment.classList.add(`rectangle-segment-f2`); // Adds F2 specific border/opacity styling
                }
                rowDiv.appendChild(segment);
                segments.push(segment);
            }
            container.appendChild(rowDiv);
        }
        
        // Fill segments based on packing direction (column-first)
        for (let k = 0; k < num; k++) { // k is the k-th segment to fill for this fraction
            let targetSegmentIndex;
            if (!isFractionTwo) { // Fraction 1: pack left, column-first
                const colToFill = Math.floor(k / numRows); // Column index (0-indexed from left)
                const rowToFill = k % numRows;             // Row index (0-indexed from top)
                targetSegmentIndex = rowToFill * segmentsPerRow + colToFill;
            } else { // Fraction 2: pack right, column-first
                const colToFillFromRight = Math.floor(k / numRows); // k-th column from the right edge
                const rowToFill = k % numRows;                      // Row in that column
                
                // Convert column-from-right to actual column index from left
                const actualColFromLeft = (segmentsPerRow - 1) - colToFillFromRight;
                targetSegmentIndex = rowToFill * segmentsPerRow + actualColFromLeft;
            }

            if (targetSegmentIndex >= 0 && targetSegmentIndex < segments.length) {
                segments[targetSegmentIndex].classList.add(`filled-${fractionClassSuffix}`);
                // Fill color is applied by CSS .filled-f1 or .filled-f2
            }
        }

        // Style remaining empty segments for this grid
        segments.forEach(seg => {
            if (!seg.classList.contains(`filled-${fractionClassSuffix}`)) {
                seg.classList.add(`empty-${fractionClassSuffix}`);
                // Empty color is applied by CSS .empty-f1 or .empty-f2
            }
        });
    }


    function drawNumberLine(num1, den1, num2, den2) {
        numberLineSvg.innerHTML = '';
        // Guard against invalid denominator for F1, as it's primary
        if (den1 <= 0 && (num2 === null || den2 === null || den2 <= 0)) {
             numberLineSvg.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888">Enter valid fraction(s)</text>';
             return;
        }


        const svgWidth = 400, svgHeight = 100;
        const margin = { top: 20, right: 30, bottom: 40, left: 30 };
        const lineWidth = svgWidth - margin.left - margin.right;

        // Main line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', margin.left); line.setAttribute('y1', svgHeight / 2);
        line.setAttribute('x2', margin.left + lineWidth); line.setAttribute('y2', svgHeight / 2);
        line.classList.add('line-path'); numberLineSvg.appendChild(line);

        // Ticks and labels for 0 and 1
        [0, 1].forEach(val => {
            const x = margin.left + val * lineWidth;
            const tickMark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tickMark.setAttribute('x1', x); tickMark.setAttribute('y1', svgHeight / 2 - 5);
            tickMark.setAttribute('x2', x); tickMark.setAttribute('y2', svgHeight / 2 + 5);
            tickMark.classList.add('tick-major'); numberLineSvg.appendChild(tickMark);
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x); label.setAttribute('y', svgHeight / 2 + 20);
            label.textContent = val; label.classList.add('label-axis'); numberLineSvg.appendChild(label);
        });
        
        // Minor ticks based on largest valid denominator for context
        let maxDenForTicks = 0;
        if (den1 > 0) maxDenForTicks = den1;
        if (den2 > 0 && den2 > maxDenForTicks) maxDenForTicks = den2;

        if (maxDenForTicks > 1 && maxDenForTicks <= 20) {
            for (let i = 1; i < maxDenForTicks; i++) {
                const x = margin.left + (i / maxDenForTicks) * lineWidth;
                const tickMark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                tickMark.setAttribute('x1', x); tickMark.setAttribute('y1', svgHeight / 2 - 3);
                tickMark.setAttribute('x2', x); tickMark.setAttribute('y2', svgHeight / 2 + 3);
                tickMark.classList.add('tick-minor'); numberLineSvg.appendChild(tickMark);
            }
        }

        // Fraction 1 marker
        if (den1 > 0) { // Ensure den1 is valid before calculating val1
            const val1 = num1 / den1;
            // Only draw if within 0-1 range (allowing for slight floating point issues at 1.0)
            if (val1 >= 0 && val1 <= 1.0001) { 
                const x1 = margin.left + Math.min(val1, 1) * lineWidth; // Cap position at 1 on the line
                const marker1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker1.setAttribute('cx', x1); marker1.setAttribute('cy', svgHeight / 2);
                marker1.setAttribute('r', 5); marker1.classList.add('marker-f1');
                numberLineSvg.appendChild(marker1);
                const label1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label1.setAttribute('x', x1); label1.setAttribute('y', svgHeight / 2 - 10);
                label1.textContent = `${num1}/${den1}`; label1.classList.add('label-f1');
                numberLineSvg.appendChild(label1);
            }
        }


        // Fraction 2 marker (if exists and valid)
        if (den2 > 0 && num2 !== null && num2 >= 0) { // Ensure den2 is valid
            const val2 = num2 / den2;
             if (val2 >= 0 && val2 <= 1.0001) {
                const x2 = margin.left + Math.min(val2, 1) * lineWidth;
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', x2); marker2.setAttribute('cy', svgHeight / 2);
                marker2.setAttribute('r', 5); marker2.classList.add('marker-f2');
                numberLineSvg.appendChild(marker2);
                const label2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label2.setAttribute('x', x2);
                // Offset F2 label slightly if it's too close to F1 label and F1 is drawn
                let yOffsetF2 = svgHeight / 2 - 10; // Default top position
                if (den1 > 0 && (num1/den1 >=0 && num1/den1 <= 1.0001) && Math.abs((num1/den1) - val2) < 0.15) { // If F1 is drawn and they are close
                    yOffsetF2 = svgHeight / 2 + 30; // Move F2 label below
                }
                label2.setAttribute('y', yOffsetF2);
                label2.textContent = `${num2}/${den2}`; label2.classList.add('label-f2');
                numberLineSvg.appendChild(label2);
            }
        }
    }

    function compareFractions(num1, den1, num2, den2) {
        // Ensure all parts are valid numbers before comparison
        if (den1 <= 0 || den2 <= 0 || num1 === null || num2 === null || isNaN(num1) || isNaN(den1) || isNaN(num2) || isNaN(den2)) {
            comparisonSymbolElement.textContent = ''; return;
        }
        const val1 = num1 / den1; const val2 = num2 / den2;
        if (val1 < val2) comparisonSymbolElement.textContent = '<';
        else if (val1 > val2) comparisonSymbolElement.textContent = '>';
        else comparisonSymbolElement.textContent = '==';
    }
    
    function validateFraction(numInput, denInput, messageElement, fractionName) {
        let numStr = numInput.value;
        let denStr = denInput.value;
        let num = parseInt(numStr);
        let den = parseInt(denStr);
        let message = "";
        let isValid = true;

        const isF2 = fractionName === "Fraction 2";

        if (numStr === "" && denStr === "") { // Both fields empty
            if (isF2) return { num: null, den: null, isValid: true, message: "" }; // F2 is optional, so empty is valid
            // F1 must have values (defaults are set, but user could clear them)
            message = `${fractionName}: Please enter numbers.`; isValid = false;
            num = 0; den = 1; // Fallback for F1 if cleared
        } else if (numStr === "" || denStr === "") { // One field empty
             message = `${fractionName}: Both numerator and denominator are needed.`; isValid = false;
             // Try to use any valid part or fallback
             num = isNaN(num) ? (isF2 ? null : 0) : num;
             den = isNaN(den) ? (isF2 ? null : 1) : den;
        } else if (isNaN(num) || isNaN(den)) { // Not numbers
            message = `${fractionName}: Please enter valid numbers.`; isValid = false;
            num = isNaN(num) ? (isF2 ? null : 0) : num; // Keep potentially valid part
            den = isNaN(den) ? (isF2 ? null : 1) : den;
        } else if (den <= 0) {
            message = `${fractionName}: Denominator must be > 0.`; isValid = false;
            den = 1; // Correct invalid denominator to prevent errors, keep num
        } else if (num < 0) {
            message = `${fractionName}: Numerator cannot be negative.`; isValid = false;
            num = 0; // Correct invalid numerator, keep den
        }
        
        // Set max for numerator input dynamically
        if (den > 0 && !isNaN(den)) {
            numInput.max = den * 20; // Allow numerators up to 20x denominator
        } else {
            numInput.max = 100; // Default max if denominator is invalid or not set
        }

        messageElement.textContent = message;
        // If critical validation failed for F1, ensure it has some safe defaults for drawing
        if (!isValid && !isF2) {
            if (isNaN(num) || num < 0) num = 0;
            if (isNaN(den) || den <= 0) den = 1;
        }
        // If F2 is invalid but was attempted (not fully empty), return nulls to prevent drawing
        if (!isValid && isF2 && !(numStr === "" && denStr === "")) {
            return { num: null, den: null, isValid: false, message };
        }

        return { num, den, isValid, message };
    }

    function updateVisualizations() {
        const f1 = validateFraction(numerator1Input, denominator1Input, validationMessage1, "Fraction 1");
        const f2 = validateFraction(numerator2Input, denominator2Input, validationMessage2, "Fraction 2");

        // Primary check: if F1 is fundamentally invalid for drawing, clear and stop.
        if (!f1.isValid && (f1.den === null || f1.den <= 0 || isNaN(f1.den))) {
            pizzaSvgF1.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888">Enter valid Fraction 1</text>';
            pizzaSvgF2.innerHTML = '';
            rectangleContainer.innerHTML = '<p class="text-center text-gray-500 p-4">Enter valid Fraction 1</p>';
            numberLineSvg.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888">Enter valid Fraction 1</text>';
            comparisonSymbolElement.textContent = '';
            return;
        }
        
        drawPizza(f1.num, f1.den, f2.num, f2.den);
        drawRectangle(f1.num, f1.den, f2.num, f2.den);
        drawNumberLine(f1.num, f1.den, f2.num, f2.den);

        if (f1.isValid && f2.isValid && f2.num !== null && f2.den !== null && f1.den > 0 && f2.den > 0) {
            compareFractions(f1.num, f1.den, f2.num, f2.den);
        } else {
            comparisonSymbolElement.textContent = '';
        }
    }

    [numerator1Input, denominator1Input, numerator2Input, denominator2Input].forEach(input => {
        input.addEventListener('input', updateVisualizations);
    });
    updateVisualizations(); // Initial draw
});

