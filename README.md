# Fraction Fun Learning Website

This is a simple web application to help learn fractions visually, using a pizza and a line representation. It's built with Python (Flask), HTML, CSS (Tailwind CSS), and JavaScript, and is designed to be run in a Docker container.

## Project Structure

fraction-app/
├── app.py              # Flask application
├── Dockerfile          # Docker configuration
├── requirements.txt    # Python dependencies
├── static/             # Static files (CSS, JS)
│   ├── style.css
│   └── script.js
└── templates/          # HTML templates└── index.html
## Prerequisites

* **Docker Desktop** (or Docker Engine on Linux) installed and running on your system.

## How to Run

1.  **Create the Project Directory and Files:**
    * Create a main folder named `fraction-app`.
    * Inside `fraction-app`, create the `app.py`, `Dockerfile`, and `requirements.txt` files with the content provided.
    * Create two subfolders: `static` and `templates`.
    * Inside `static`, create `style.css` and `script.js` with the content provided.
    * Inside `templates`, create `index.html` with the content provided.

2.  **Build the Docker Image:**
    * Open a terminal or command prompt.
    * Navigate to the `fraction-app` directory (the one containing the `Dockerfile`).
    * Run the following command to build the Docker image. Replace `fraction-learning-app` with your desired image name if you like:
        ```bash
        docker build -t fraction-learning-app .
        ```
    * This command tells Docker to build an image using the `Dockerfile` in the current directory (`.`) and tag it (`-t`) with the name `fraction-learning-app`.

3.  **Run the Docker Container:**
    * Once the image is built successfully, run the following command to start a container from the image:
        ```bash
        docker run -p 5000:5000 fraction-learning-app
        ```
    * This command runs the container:
        * `-p 5000:5000` maps port 5000 of your host machine to port 5000 of the container (where the Flask app is running).
        * `fraction-learning-app` is the name of the image to use.

4.  **Access the Website:**
    * Open your web browser (like Chrome, Firefox, Safari, or Edge).
    * Go to the following address: `http://localhost:5000`

You should now see the "Fraction Fun Time!" website. Your daughter can input different numerators and denominators to see how the pizza and line visualizations change!

## Stopping the Container

* To stop the running Docker container, you can usually press `Ctrl+C` in the terminal where it's running.
* If it's running in the background (detached mode, which we didn't use here), you would use `docker ps` to find the container ID and then `docker stop <container_id>`.

Enjoy learning fractions!

