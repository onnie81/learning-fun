# app.py
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    """
    Serves the main page of the fraction learning website.
    """
    return render_template('index.html')

if __name__ == '__main__':
    # Runs the Flask development server.
    # For production, a more robust WSGI server like Gunicorn should be used.
    app.run(host='0.0.0.0', port=5000, debug=True)

