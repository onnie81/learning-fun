# app.py
import os
from flask import Flask, render_template, jsonify

app = Flask(__name__)

# --- Configuration for API Key ---
# Load API key from .secrets.txt
GEMINI_API_KEY = None
try:
    # Assuming .secrets.txt is in the same directory as app.py (root of the folder)
    secrets_file_path = os.path.join(os.path.dirname(__file__), '.secrets.txt')
    if os.path.exists(secrets_file_path):
        with open(secrets_file_path, 'r') as f:
            for line in f:
                if line.startswith('API_KEY='):
                    # Strip quotes and newline characters
                    GEMINI_API_KEY = line.split('=', 1)[1].strip().strip('"').strip("'")
                    break
    if not GEMINI_API_KEY:
        print("WARN: API_KEY not found in .secrets.txt or the file is missing.")
        # You might want to handle this more gracefully depending on your needs
        # For now, the client-side will try to fetch it, and if null, API call will fail
except Exception as e:
    print(f"Error loading API key from .secrets.txt: {e}")
# --- End Configuration ---


# Define available games
available_games = [
    {'key': 'fractions', 'name': 'Learn Fractions', 'url_func_name': 'fractions_page'},
    {'key': 'clocks', 'name': 'Clocks and Time', 'url_func_name': 'clocks_page'},
    {'key': 'writing_helper', 'name': 'Writing Helper', 'url_func_name': 'writing_helper_page'},
]

@app.route('/')
def homepage():
    return render_template('index.html', games=available_games)

@app.route('/fractions')
def fractions_page():
    return render_template('fractions.html', current_game_key='fractions', all_games=available_games)

@app.route('/clocks')
def clocks_page():
    return render_template('clocks.html', current_game_key='clocks', all_games=available_games)

@app.route('/writing-helper')
def writing_helper_page():
    return render_template('writing_helper.html', current_game_key='writing_helper', all_games=available_games)

# New route to provide the API key to the client-side
@app.route('/get-gemini-api-key')
def get_gemini_api_key():
    if GEMINI_API_KEY:
        return jsonify({'apiKey': GEMINI_API_KEY})
    else:
        # It's better to return an error or an empty key than to fail silently if the key wasn't loaded
        return jsonify({'error': 'API Key not configured on server'}), 404


if __name__ == '__main__':
    # Ensure the app context is available for os.path.dirname if needed for finding .secrets.txt relative to app
    # For simple cases where .secrets.txt is next to app.py, the above loading method is fine.
    app.run(host='0.0.0.0', port=5000, debug=True)

