# app.py
import os
import time
from flask import Flask, render_template, jsonify, request, url_for
import requests
import logging

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)

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
    {'key': 'typing_game', 'name': 'Typing Game', 'url_func_name': 'typing_game_page'}, # New Game
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

@app.route('/typing-game')
def typing_game_page():
    return render_template('typing_game.html', current_game_key='typing_game', all_games=available_games)

@app.route('/api/generate-writing-content', methods=['POST'])
def generate_writing_content():
    if not GEMINI_API_KEY:
        app.logger.error("API call failed: Gemini API key is not configured on the server.")
        return jsonify({'error': 'API key not configured on the server.'}), 500

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON in request body.'}), 400
        
    prompt = data.get('prompt')
    model_name = data.get('model', 'gemini-2.5-pro')

    if not prompt:
        return jsonify({'error': 'No prompt provided.'}), 400

    GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    try:
        app.logger.info(f"--- Calling Gemini API for Writing Helper ---")
        app.logger.debug(f"URL: {GEMINI_API_URL}")
        app.logger.debug(f"Payload: {payload}")
        
        response = requests.post(GEMINI_API_URL, json=payload, timeout=60)
        
        app.logger.info(f"--- Gemini API Response Status: {response.status_code} ---")
        try:
            response_json = response.json()
            app.logger.debug(f"--- Gemini API Response Body: {response_json} ---")
        except requests.exceptions.JSONDecodeError:
            app.logger.error(f"--- Gemini API Response Body (Not JSON): {response.text} ---")
            response.raise_for_status()
            return jsonify({'error': 'Received non-JSON response from AI service.'}), 502

        response.raise_for_status()
        return jsonify(response_json)
        
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error calling Gemini API for writing helper: {e}")
        return jsonify({'error': 'Failed to communicate with the generative AI service.'}), 502


@app.route('/api/generate-typing-phrases', methods=['POST'])
def generate_typing_phrases():
    if not GEMINI_API_KEY:
        app.logger.error("API call failed: Gemini API key is not configured on the server.")
        return jsonify({'error': 'API key not configured on the server.'}), 500

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON in request body.'}), 400
        
    chat_history = data.get('history')
    model_name = data.get('model', 'gemini-2.5-flash')

    if not chat_history:
        return jsonify({'error': 'No prompt provided.'}), 400

    GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": chat_history,
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "phrases": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"}
                    }
                }
            }
        }
    }
    
    try:
        app.logger.info(f"--- Calling Gemini API for Typing Game ---")
        app.logger.debug(f"URL: {GEMINI_API_URL}")
        app.logger.debug(f"Payload: {payload}")
        
        response = requests.post(GEMINI_API_URL, json=payload, timeout=60)
        
        app.logger.info(f"--- Gemini API Response Status: {response.status_code} ---")
        try:
            response_json = response.json()
            app.logger.debug(f"--- Gemini API Response Body: {response_json} ---")
        except requests.exceptions.JSONDecodeError:
            app.logger.error(f"--- Gemini API Response Body (Not JSON): {response.text} ---")
            response.raise_for_status()
            return jsonify({'error': 'Received non-JSON response from AI service.'}), 502

        response.raise_for_status()
        return jsonify(response_json)
        
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error calling Gemini API for typing game: {e}")
        return jsonify({'error': 'Failed to communicate with the generative AI service.'}), 502


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

