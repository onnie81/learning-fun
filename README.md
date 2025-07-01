# Vivi's Learning Corner

![Vivi's Learning Corner](https://github.com/user-attachments/assets/5a9e3e3b-b8c1-4b1a-8531-1e9d10e0513e)

This is the source code for a personalized learning website built for my daughter, Vivi. The goal is to create fun, engaging, and supportive games tailored to her 3rd-grade curriculum and specific learning needs, including dyslexia and language processing disorder.

The application is built with a Python **Flask** backend and uses vanilla **JavaScript** for the frontend game logic. Several of the games leverage the **Google Gemini API** for dynamic content generation. The entire project is containerized with **Docker** for easy setup and deployment.

## The Games

The platform currently includes the following games, accessible from the homepage:

### 🎲 Fraction Game
An interactive tool to help learn fractions. It visualizes fractions as pizza slices, segmented rectangles, and points on a number line, allowing for comparison between two different fractions.

* **Design Philosophy:** To represent abstract fractions in multiple, concrete ways. The pizza is familiar, the rectangle helps with area models, and the number line reinforces that fractions are numbers with a specific value.
* **Features:**
    * **Dual Fraction Input:** Allows for the comparison of two fractions.
    * **Superimposed Visuals:** Fraction 2 is displayed with dotted lines and semi-transparent fills on top of Fraction 1 to visually compare parts of a whole.
    * **Improper Fraction Support:** The rectangle and number line visualizations dynamically adjust to show fractions greater than one.
    * **Real-time Updates:** All visualizations and the comparison symbol (`<`, `>`, `==`) update instantly as the user types.

### ⏰ Clock Game
A visualizer to help practice reading both analog and digital clocks. Users can drag the hands on the analog clock to see the digital time update, or edit the digital time to see the analog hands move.

* **Design Philosophy:** To create a direct, tactile link between the analog and digital representations of time. The clock starts in a "live" mode showing the current time to be immediately relevant.
* **Features:**
    * **Two-Way Interaction:** Dragging the analog hands (hour, minute, and second) updates the digital display, and clicking to edit the digital display updates the analog hands.
    * **Manual Time Mode:** Once an interaction is made, the clock stops following live time and continues ticking from the manually set time, allowing for focused practice.
    * **Visual Feedback:** The hovered/dragged analog hand is highlighted, as is its corresponding digital number segment, to improve hand-eye coordination.

### ✍️ Writing Helper
A supportive tool designed for a child with dyslexia and language processing disorder. It helps turn disjointed ideas into a coherent story or a step-by-step writing plan.

* **Design Philosophy:** To act as a scaffold for the writing process, reducing the cognitive load of organizing thoughts and starting to write. The tool is designed to be a patient and encouraging assistant, not just a text generator.
* **Features:**
    * **Dual Modes:** Users can switch between "Write My Story" (for a full example) and "Help Me Plan" (for structured guidance).
    * **Intelligent Prompt Engineering:** The request sent to the Gemini API is highly detailed, specifying the user's age, language, and learning needs. It instructs the AI to use age-appropriate grammar, stick to the user's ideas (especially for personal/homework topics), and, in "Plan" mode, to provide extremely simple, actionable steps.
    * **Linked Content:** In a single API call, the AI generates both a plan and a story that directly follows that plan, ensuring the two are always related.
    * **Persistent State:** The user's ideas, settings, and the last generated content are saved to `localStorage`, so their work isn't lost on a page reload.

### ⌨️ Typing Game
An adaptive game to practice keyboard skills. It features a visual keyboard that matches the user's locale, provides real-time feedback (CPM), and uses the Gemini API to generate didactic phrases that scale in difficulty.

* **Design Philosophy:** To create a typing game that is not just about speed, but about building skill progressively. The difficulty scales with the user's demonstrated ability (max score) rather than just time played, providing a fair and motivating challenge.
* **Features:**
    * **Adaptive Difficulty:** The AI generates phrases based on the user's max score. Beginners get simple, single-row words, while the complexity gradually increases to include hand alternation, punctuation, and capital letters.
    * **Dynamic Speed Scaling:** The timer speed starts very slow and gradually increases based on the player's score *within the current session*, creating a gentle ramp-up of pressure.
    * **Visual Keyboard:** A keyboard is displayed on-screen that highlights each key as it's pressed. It uses the `navigator.keyboard` API to attempt to match the user's local keyboard layout (e.g., QWERTY, QWERTZ, AZERTY) for better accuracy.
    * **Clear Feedback:** Correctly typed letters "pop" with a success animation, while incorrect letters cause the on-screen keyboard to shake red, providing clear, immediate feedback.

## Project Structure

The project is organized as follows:
```
learning-fun/
  ├── app.py                      # Flask application (routing and logic)
  ├── Dockerfile                  # Docker configuration for containerization
  ├── requirements.txt            # Python dependencies (e.g., Flask)
  ├── .secrets.txt                # Ignored by Git. Stores your Gemini API key.
  ├── static/                     # Static files (CSS, JS)
  │   ├── style.css
  │   ├── fractions_script.js
  │   ├── clocks_script.js
  │   ├── writing_helper_script.js
  │   └── typing_game_script.js
  └── templates/                  # HTML templates for Flask
      ├── index.html              # Homepage
      ├── fractions.html
      ├── clocks.html
      ├── writing_helper.html
      └── typing_game.html
```
## Prerequisites

* **Docker Desktop** (for Windows/Mac) or **Docker Engine** (for Linux) installed and running on your system.
* **A Google Gemini API Key** if you are running this project outside of the original development environment.

## How to Run Locally

### 1. Set Up Your Gemini API Key

* In the root of the project folder, create a new file named `.secrets.txt`.
* Inside this file, add one line in the following format, pasting your key inside the quotes:
    ```
    API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
* The `.secrets.txt` file is included in `.gitignore` and should never be committed to version control.

### 2. Build the Docker Image

* Open a terminal or command prompt in the project's root directory (the one containing the `Dockerfile`).
* Run the following command to build the Docker image:
    ```bash
    docker build -t vivis-learning-corner .
    ```

### 3. Run the Docker Container

* Once the image is built, run the following command to start a container from the image:
    ```bash
    docker run -p 5000:5000 vivis-learning-corner
    ```
* This command runs the container and maps port 5000 of your host machine to port 5000 inside the container, where the Flask app is running.

### 4. Access the Website

* Open your web browser and navigate to:
    ```
    http://localhost:5000
    ```
* You should see the "Vivi's Learning Corner" homepage.

## Stopping the Container

* To stop the running Docker container, you can usually press `Ctrl+C` in the terminal where it's running.
* If it's running in the background (detached mode), you would use `docker ps` to find the container ID and then `docker stop <container_id>`.
