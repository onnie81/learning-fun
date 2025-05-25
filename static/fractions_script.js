// static/fractions_script.js
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
    const MAX_DENOMINATOR = 200; // Max allowed denominator for stability

    const COLOR_F1_FILL = '#FF6347'; 
    const COLOR_F1_EMPTY = '#FFD700'; 
    const COLOR_F2_FILL_TRANSPARENT = 'rgba(50, 205, 50, 0.6)'; 
    const COLOR_F2_EMPTY = 'rgba(255, 215, 0, 0.3)';

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

    function drawPizza(num1, den1, num2, den2) {
        if (pizzaSvgF1) pizzaSvgF1.innerHTML = '';
        if (pizzaSvgF2) pizzaSvgF2.innerHTML = '';

        if (den1 > 0 && pizzaSvgF1) {
            const anglePerSlice1 = 360 / den1;
            for (let i = 0; i < den1; i++) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const startAngle = 360 - ((i + 1) * anglePerSlice1);
                const endAngle = 360 - (i * anglePerSlice1);
                path.setAttribute('d', getPizzaSlicePath(startAngle, endAngle));
                path.classList.add('pizza-slice');
                if (i < num1) {
                    path.classList.add('filled-f1');
                    path.style.fill = COLOR_F1_FILL;
                } else {
                    path.classList.add('empty-f1');
                    path.style.fill = COLOR_F1_EMPTY;
                }
                pizzaSvgF1.appendChild(path);
            }
        }

        if (den2 > 0 && num2 !== null && pizzaSvgF2) {
            const anglePerSlice2 = 360 / den2;
            for (let i = 0; i < den2; i++) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', getPizzaSlicePath(i * anglePerSlice2, (i + 1) * anglePerSlice2));
                path.classList.add('pizza-slice-f2'); 
                if (i < num2) {
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
        if (!rectangleContainer) return;
        rectangleContainer.innerHTML = ''; 

        if (den1 > 0) {
            const gridF1Container = document.createElement('div');
            gridF1Container.classList.add('rectangle-grid', 'grid-f1');
            rectangleContainer.appendChild(gridF1Container);
            createRectangleGrid(gridF1Container, num1, den1, 'f1', false);
        }

        if (den2 > 0 && num2 !== null) {
            const gridF2Container = document.createElement('div');
            gridF2Container.classList.add('rectangle-grid', 'grid-f2');
            rectangleContainer.appendChild(gridF2Container);
            createRectangleGrid(gridF2Container, num2, den2, 'f2', true);
        }
    }

    function createRectangleGrid(container, num, den, fractionClassSuffix, isFractionTwo) {
        const numRows = (den % 2 === 0 && den > 1 && den !== 0) ? 2 : 1;
        const segmentsPerRow = den > 0 ? den / numRows : 0;
        if (segmentsPerRow === 0 || !Number.isFinite(segmentsPerRow)) {
            return; 
        }

        container.innerHTML = ''; 
        const segments = []; 
        for (let r = 0; r < numRows; r++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('rectangle-row');
            for (let c = 0; c < segmentsPerRow; c++) {
                const segment = document.createElement('div');
                segment.classList.add(`rectangle-segment`);
                if (isFractionTwo) {
                    segment.classList.add(`rectangle-segment-f2`); 
                }
                rowDiv.appendChild(segment);
                segments.push(segment);
            }
            container.appendChild(rowDiv);
        }
        
        for (let k = 0; k < num; k++) { 
            let targetSegmentIndex;
            if (!isFractionTwo) {
                const colToFill = Math.floor(k / numRows); 
                const rowToFill = k % numRows;             
                targetSegmentIndex = rowToFill * segmentsPerRow + colToFill;
            } else { 
                const colToFillFromRight = Math.floor(k / numRows); 
                const rowToFill = k % numRows;                      
                const actualColFromLeft = (segmentsPerRow - 1) - colToFillFromRight;
                targetSegmentIndex = rowToFill * segmentsPerRow + actualColFromLeft;
            }

            if (targetSegmentIndex >= 0 && targetSegmentIndex < segments.length) {
                segments[targetSegmentIndex].classList.add(`filled-${fractionClassSuffix}`);
            }
        }

        segments.forEach(seg => {
            if (!seg.classList.contains(`filled-${fractionClassSuffix}`)) {
                seg.classList.add(`empty-${fractionClassSuffix}`);
            }
        });
    }

    function drawNumberLine(num1, den1, num2, den2) {
        if (!numberLineSvg) return;
        numberLineSvg.innerHTML = '';
        
        if (den1 <= 0 && (num2 === null || den2 === null || den2 <= 0)) {
             numberLineSvg.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888">Enter valid fraction(s)</text>';
             return;
        }

        const svgWidth = 400, svgHeight = 100;
        const margin = { top: 20, right: 30, bottom: 40, left: 30 };
        const lineWidth = svgWidth - margin.left - margin.right;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(margin.left)); 
        line.setAttribute('y1', String(svgHeight / 2));
        line.setAttribute('x2', String(margin.left + lineWidth)); 
        line.setAttribute('y2', String(svgHeight / 2));
        line.classList.add('line-path'); 
        numberLineSvg.appendChild(line);

        [0, 1].forEach(val => {
            const x = margin.left + val * lineWidth;
            const tickMark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tickMark.setAttribute('x1', String(x)); tickMark.setAttribute('y1', String(svgHeight / 2 - 5));
            tickMark.setAttribute('x2', String(x)); tickMark.setAttribute('y2', String(svgHeight / 2 + 5));
            tickMark.classList.add('tick-major'); numberLineSvg.appendChild(tickMark);
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', String(x)); label.setAttribute('y', String(svgHeight / 2 + 20));
            label.textContent = val; label.classList.add('label-axis'); numberLineSvg.appendChild(label);
        });
        
        let maxDenForTicks = 0;
        if (den1 > 0) maxDenForTicks = den1;
        if (den2 > 0 && den2 > maxDenForTicks) maxDenForTicks = den2;

        if (maxDenForTicks > 1 && maxDenForTicks <= MAX_DENOMINATOR) { // Use MAX_DENOMINATOR for ticks too
            for (let i = 1; i < maxDenForTicks; i++) {
                const x = margin.left + (i / maxDenForTicks) * lineWidth;
                const tickMark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                tickMark.setAttribute('x1', String(x)); tickMark.setAttribute('y1', String(svgHeight / 2 - 3));
                tickMark.setAttribute('x2', String(x)); tickMark.setAttribute('y2', String(svgHeight / 2 + 3));
                tickMark.classList.add('tick-minor'); numberLineSvg.appendChild(tickMark);
            }
        }

        if (den1 > 0) { 
            const val1 = num1 / den1;
            if (val1 >= 0 && val1 <= 1.0001) { 
                const x1 = margin.left + Math.min(val1, 1) * lineWidth; 
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

        if (den2 > 0 && num2 !== null && num2 >= 0) { 
            const val2 = num2 / den2;
             if (val2 >= 0 && val2 <= 1.0001) {
                const x2 = margin.left + Math.min(val2, 1) * lineWidth;
                const marker2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                marker2.setAttribute('cx', String(x2)); marker2.setAttribute('cy', String(svgHeight / 2));
                marker2.setAttribute('r', '5'); marker2.classList.add('marker-f2');
                numberLineSvg.appendChild(marker2);
                const label2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label2.setAttribute('x', String(x2));
                let yOffsetF2 = svgHeight / 2 - 10; 
                if (den1 > 0 && (num1/den1 >=0 && num1/den1 <= 1.0001) && Math.abs((num1/den1) - val2) < 0.15) { 
                    yOffsetF2 = svgHeight / 2 + 30; 
                }
                label2.setAttribute('y', String(yOffsetF2));
                label2.textContent = `${num2}/${den2}`; label2.classList.add('label-f2');
                numberLineSvg.appendChild(label2);
            }
        }
    }

    function compareFractions(num1, den1, num2, den2) {
        if (den1 <= 0 || den2 <= 0 || num1 === null || num2 === null || isNaN(num1) || isNaN(den1) || isNaN(num2) || isNaN(den2)) {
            if (comparisonSymbolElement) comparisonSymbolElement.textContent = ''; return;
        }
        const val1 = num1 / den1; const val2 = num2 / den2;
        if (comparisonSymbolElement) {
            if (val1 < val2) comparisonSymbolElement.textContent = '<';
            else if (val1 > val2) comparisonSymbolElement.textContent = '>';
            else comparisonSymbolElement.textContent = '==';
        }
    }
    
    function validateFraction(numInput, denInput, messageElement, fractionName) {
        let numStr = numInput.value;
        let denStr = denInput.value;
        let num = parseInt(numStr);
        let den = parseInt(denStr);
        let message = "";
        let isValid = true;
        const isF2 = fractionName === "Fraction 2";

        if (numStr === "" && denStr === "") { 
            if (isF2) return { num: null, den: null, isValid: true, message: "" }; 
            message = `${fractionName}: Please enter numbers.`; isValid = false;
            num = 1; den = 4; 
        } else if (numStr === "" || denStr === "") { 
             message = `${fractionName}: Both numerator and denominator are needed.`; isValid = false;
             num = isNaN(num) ? (isF2 ? null : 1) : num; 
             den = isNaN(den) ? (isF2 ? null : 4) : den;
        } else if (isNaN(num) || isNaN(den)) { 
            message = `${fractionName}: Please enter valid numbers.`; isValid = false;
            num = isNaN(num) ? (isF2 ? null : 1) : num; 
            den = isNaN(den) ? (isF2 ? null : 4) : den;
        }
        
        // Denominator validation and capping
        if (den <= 0) {
            message += `${fractionName}: Denominator must be > 0. Capped to 4. `; isValid = false;
            den = 4; 
        } else if (den > MAX_DENOMINATOR) {
            message += `${fractionName}: Denominator too large. Capped to ${MAX_DENOMINATOR}. `; isValid = false;
            den = MAX_DENOMINATOR;
        }
        denInput.value = den; // Update input field if capped

        // Numerator validation and capping
        if (num < 0) {
            message += `${fractionName}: Numerator cannot be negative. Set to 0. `; isValid = false;
            num = 0; 
        } else if (num > den) {
            message += `${fractionName}: Numerator cannot be > denominator. Capped to ${den}. `; isValid = false;
            num = den;
        }
        numInput.value = num; // Update input field if capped
        
        if (denInput && den > 0 && !isNaN(den)) { 
            numInput.max = den; // Set HTML max for numerator based on current valid denominator
        } else if (denInput) {
            numInput.max = MAX_DENOMINATOR; 
        }


        if (messageElement) messageElement.textContent = message.trim();
        
        if (!isValid && isF2 && !(numStr === "" && denStr === "")) { 
            return { num: null, den: null, isValid: false, message };
        }
        return { num, den, isValid, message };
    }

    function updateVisualizations() {
        if (!numerator1Input || !denominator1Input || !numerator2Input || !denominator2Input ||
            !pizzaSvgF1 || !pizzaSvgF2 || !rectangleContainer || !numberLineSvg) {
            console.error("One or more critical DOM elements for fractions game not found.");
            return;
        }

        const f1 = validateFraction(numerator1Input, denominator1Input, validationMessage1, "Fraction 1");
        const f2 = validateFraction(numerator2Input, denominator2Input, validationMessage2, "Fraction 2");

        // Only proceed to draw if Fraction 1 is fundamentally valid after validation
        if (f1.den === null || f1.den <= 0 || isNaN(f1.den)) {
             if (pizzaSvgF1) pizzaSvgF1.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888">Enter valid Fraction 1</text>';
            if (pizzaSvgF2) pizzaSvgF2.innerHTML = '';
            if (rectangleContainer) rectangleContainer.innerHTML = '<p class="text-center text-gray-500 p-4">Enter valid Fraction 1</p>';
            if (numberLineSvg) numberLineSvg.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#888">Enter valid Fraction 1</text>';
            if (comparisonSymbolElement) comparisonSymbolElement.textContent = '';
            return;
        }
        
        drawPizza(f1.num, f1.den, f2.num, f2.den);
        drawRectangle(f1.num, f1.den, f2.num, f2.den);
        drawNumberLine(f1.num, f1.den, f2.num, f2.den);

        if (f1.isValid && f2.isValid && f2.num !== null && f2.den !== null && f1.den > 0 && f2.den > 0) {
            compareFractions(f1.num, f1.den, f2.num, f2.den);
        } else {
            if (comparisonSymbolElement) comparisonSymbolElement.textContent = '';
        }
    }

    if (numerator1Input && denominator1Input && numerator2Input && denominator2Input) {
        [numerator1Input, denominator1Input, numerator2Input, denominator2Input].forEach(input => {
            input.addEventListener('input', updateVisualizations);
        });
        updateVisualizations(); 
    } else {
        console.error("Fraction input elements not found. Visualizations may not work.");
    }
});

