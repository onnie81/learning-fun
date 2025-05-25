// static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const numeratorInput = document.getElementById('numerator');
    const denominatorInput = document.getElementById('denominator');
    const pizzaSvg = document.getElementById('pizza-svg');
    const lineContainer = document.getElementById('line-container');
    const validationMessage = document.getElementById('validation-message');

    const PIZZA_CX = 100; // Center X of the SVG viewBox
    const PIZZA_CY = 100; // Center Y of the SVG viewBox
    const PIZZA_R = 90;   // Radius of the pizza

    // Function to convert degrees to radians
    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Function to draw a single pizza slice path
    function getPizzaSlicePath(startAngleDeg, endAngleDeg) {
        const startAngleRad = toRadians(startAngleDeg - 90); // Offset by -90 to start from top
        const endAngleRad = toRadians(endAngleDeg - 90);

        const x1 = PIZZA_CX + PIZZA_R * Math.cos(startAngleRad);
        const y1 = PIZZA_CY + PIZZA_R * Math.sin(startAngleRad);
        const x2 = PIZZA_CX + PIZZA_R * Math.cos(endAngleRad);
        const y2 = PIZZA_CY + PIZZA_R * Math.sin(endAngleRad);

        // large-arc-flag: 0 if arc is less than or equal to 180 degrees, 1 otherwise
        const angleDiff = Math.abs(endAngleDeg - startAngleDeg);
        const largeArcFlag = angleDiff <= 180 ? 0 : 1;
        
        // sweep-flag: 0 for counter-clockwise, 1 for clockwise
        const sweepFlag = 1; // Always draw clockwise for standard slices

        // M = move to, L = line to, A = arc, Z = close path
        return `M ${PIZZA_CX},${PIZZA_CY} L ${x1},${y1} A ${PIZZA_R},${PIZZA_R} 0 ${largeArcFlag} ${sweepFlag} ${x2},${y2} Z`;
    }

    // Function to draw the pizza
    function drawPizza(numerator, denominator) {
        pizzaSvg.innerHTML = ''; // Clear previous pizza

        if (denominator <= 0) return;

        const anglePerSlice = 360 / denominator;

        for (let i = 0; i < denominator; i++) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const startAngle = i * anglePerSlice;
            const endAngle = (i + 1) * anglePerSlice;
            
            path.setAttribute('d', getPizzaSlicePath(startAngle, endAngle));
            path.classList.add('pizza-slice');
            if (i < numerator) {
                path.classList.add('filled');
            } else {
                path.classList.add('empty');
            }
            pizzaSvg.appendChild(path);
        }
    }

    // Function to draw the line representation
    function drawLine(numerator, denominator) {
        lineContainer.innerHTML = ''; // Clear previous line

        if (denominator <= 0) return;

        for (let i = 0; i < denominator; i++) {
            const segment = document.createElement('div');
            segment.style.flexGrow = '1'; // Each segment takes equal width
            segment.classList.add('line-segment');
            if (i < numerator) {
                segment.classList.add('filled');
            } else {
                segment.classList.add('empty');
            }
            // Optional: Add numbers to segments
            // segment.textContent = `${i+1}/${denominator}`; 
            lineContainer.appendChild(segment);
        }
    }
    
    // Function to update visualizations based on input
    function updateVisualizations() {
        let num = parseInt(numeratorInput.value);
        let den = parseInt(denominatorInput.value);
        let isValid = true;
        let message = "";

        // Basic validation
        if (isNaN(num) || isNaN(den)) {
            message = "Please enter valid numbers.";
            isValid = false;
        } else if (den <= 0) {
            message = "Denominator must be greater than 0.";
            isValid = false;
            den = 1; // Prevent division by zero errors in drawing
        } else if (num < 0) {
            message = "Numerator cannot be negative.";
            isValid = false;
            num = 0;
        } else if (num > den) {
            message = "Numerator shouldn't be bigger than the denominator (for this simple visualizer).";
            // We can still draw it, but warn the user. For a more advanced tool, this could be allowed.
            // isValid = false; // Or just let it draw
        }
        
        // Update max for numerator input based on denominator
        numeratorInput.max = den > 0 ? den : 100; // Set a reasonable upper if den is invalid

        validationMessage.textContent = message;

        if (isValid || message.includes("Numerator shouldn't be bigger")) { // Allow drawing even if num > den with a warning
             drawPizza(num, den);
             drawLine(num, den);
        } else {
            // Clear visualizations if input is fundamentally invalid (e.g. den <=0)
            pizzaSvg.innerHTML = '';
            lineContainer.innerHTML = '';
        }
    }

    // Event listeners for input changes
    numeratorInput.addEventListener('input', updateVisualizations);
    denominatorInput.addEventListener('input', updateVisualizations);

    // Initial draw
    updateVisualizations();
});

