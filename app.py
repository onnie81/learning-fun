# app.py
from flask import Flask, render_template

app = Flask(__name__)

# Define available games
# Each game has a 'key' (for URL routing/identification), 
# a 'name' (for display in menus), and a 'url_func_name' (the Flask function name for its route)
available_games = [
    {'key': 'fractions', 'name': 'Learn Fractions', 'url_func_name': 'fractions_page'},
    {'key': 'clocks', 'name': 'Clocks and Time', 'url_func_name': 'clocks_page'},
    # Add new games here in the future:
    # {'key': 'new_game', 'name': 'New Awesome Game', 'url_func_name': 'new_game_route_function'},
]

@app.route('/')
def homepage():
    """
    Serves the main homepage "Vivi's Learning Corner".
    Passes the list of games for potential display on the homepage.
    """
    return render_template('index.html', games=available_games)

@app.route('/fractions')
def fractions_page():
    """
    Serves the fractions learning game.
    Passes the list of all games and the key of the current game.
    """
    return render_template('fractions.html', current_game_key='fractions', all_games=available_games)

@app.route('/clocks')
def clocks_page():
    """
    Serves the clocks and time learning game.
    Passes the list of all games and the key of the current game.
    """
    return render_template('clocks.html', current_game_key='clocks', all_games=available_games)

# Example of adding a new game route (if you were to add one)
# @app.route('/new_game')
# def new_game_route_function():
#     return render_template('new_game.html', current_game_key='new_game', all_games=available_games)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

