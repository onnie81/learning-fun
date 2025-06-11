# app.py
import os
import time
from flask import Flask, render_template, jsonify, url_for

app = Flask(__name__)

# --- Configuration for API Key ---
GEMINI_API_KEY = None
try:
    secrets_file_path = os.path.join(os.path.dirname(__file__), '.secrets.txt')
    if os.path.exists(secrets_file_path):
        with open(secrets_file_path, 'r') as f:
            for line in f:
                if line.startswith('API_KEY='):
                    GEMINI_API_KEY = line.split('=', 1)[1].strip().strip('"').strip("'")
                    break
    if not GEMINI_API_KEY:
        print("WARN: API_KEY not found in .secrets.txt or the file is missing.")
except Exception as e:
    print(f"Error loading API key from .secrets.txt: {e}")
# --- End Configuration ---

# --- Cache Busting ---
@app.context_processor
def override_url_for():
    """
    Generate a new URL for static files on each request.
    This is a simple cache-busting technique.
    """
    return dict(url_for=dated_url_for)

def dated_url_for(endpoint, **values):
    """
    Appends a timestamp to static file URLs to prevent caching.
    """
    if endpoint == 'static':
        filename = values.get('filename', None)
        if filename:
            file_path = os.path.join(app.static_folder, filename)
            try:
                values['v'] = int(os.stat(file_path).st_mtime)
            except OSError:
                # File not found, handle gracefully
                pass
    return url_for(endpoint, **values)
# --- End Cache Busting ---


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

@app.route('/get-gemini-api-key')
def get_gemini_api_key():
    if GEMINI_API_KEY:
        return jsonify({'apiKey': GEMINI_API_KEY})
    else:
        return jsonify({'error': 'API Key not configured on server'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

