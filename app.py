import os
from flask import Flask, render_template, request, jsonify, make_response
from flask_socketio import SocketIO, emit
import logging

app = Flask(__name__)
# Use async_mode='threading' to avoid eventlet SSL issues on Python 3.13
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Disable Werkzeug logs to keep console cleaner
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# Folder where game scripts are stored
GAMES_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'games')

clients = {
    'switch': None,
    'computer': None
}

@app.route('/')
def index():
    user_agent = request.headers.get('User-Agent', '')
    if 'NintendoBrowser' in user_agent:
        resp = make_response(render_template('splash.html'))
        # Disable caching so splash reloads fresh on back navigation
        resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        resp.headers['Pragma'] = 'no-cache'
        resp.headers['Expires'] = '0'
        return resp
    else:
        return render_template('computer.html')

@app.route('/switch')
def switch():
    return render_template('switch.html')

@app.route('/computer')
def computer():
    return render_template('computer.html')

@app.route('/list-games')
def list_games():
    try:
        files = [f for f in os.listdir(GAMES_FOLDER) if f.endswith('.js')]
        print(f"[list-games] Found scripts: {files}")
        return jsonify(files)
    except Exception as e:
        print(f"[list-games] Error: {e}")
        return jsonify([]), 500

@app.route('/load-game/<filename>')
def load_game(filename):
    # Sanitize filename to avoid directory traversal
    if '..' in filename or filename.startswith('/'):
        return jsonify({'error': 'Invalid filename'}), 400

    path = os.path.join(GAMES_FOLDER, filename)
    if not os.path.isfile(path):
        return jsonify({'error': 'File not found'}), 404

    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    return jsonify({'content': content})

@app.route('/run-script', methods=['POST'])
def run_script():
    data = request.get_json()
    script = data.get('script', '')
    if clients['switch']:
        socketio.emit('run_script', {'script': script}, room=clients['switch'])
        return jsonify({'status': 'sent'})
    return jsonify({'status': 'no_switch_connected'}), 400

@app.route('/view-log')
def view_log():
    try:
        with open('switch.log', 'r') as f:
            logs = f.read()
        return jsonify({'logs': logs})
    except:
        return jsonify({'logs': ''})

@app.route('/clear-log', methods=['POST'])
def clear_log():
    try:
        with open('switch.log', 'w') as f:
            f.write('')
        return jsonify({'cleared': True})
    except:
        return jsonify({'cleared': False}), 500

@app.route('/confirm-load', methods=['POST'])
def confirm_load():
    data = request.get_json()
    success = data.get('success', False)
    message = data.get('message', '')

    # Log to server console and to file
    log_entry = f"[Switch Confirmation] Success: {success}, Message: {message}\n"
    print(log_entry.strip())

    try:
        with open('switch.log', 'a') as f:
            f.write(log_entry)
    except Exception as e:
        print(f"[Error] Writing to log file: {e}")

    # Forward confirmation to computer client via socketio
    if clients['computer']:
        if success:
            socketio.emit('switch_confirmed', {'message': message}, room=clients['computer'])
        else:
            socketio.emit('switch_cancelled', {'message': message}, room=clients['computer'])

    return jsonify({'received': True})

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    user_agent = request.headers.get('User-Agent', '')
    if 'NintendoBrowser' in user_agent:
        clients['switch'] = sid
        print("[Switch] Connected")
    else:
        clients['computer'] = sid
        print("[Computer] Connected")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if clients['switch'] == sid:
        print("[Switch] Disconnected")
        clients['switch'] = None
        if clients['computer']:
            socketio.emit('disconnect', room=clients['computer'])
    elif clients['computer'] == sid:
        print("[Computer] Disconnected")
        clients['computer'] = None
        if clients['switch']:
            socketio.emit('disconnect', room=clients['switch'])

@socketio.on('switch_connected')
def switch_connected():
    if clients['computer']:
        socketio.emit('switch_connected', room=clients['computer'])

@socketio.on('computer_ready')
def computer_ready():
    if clients['switch']:
        socketio.emit('computer_ready', room=clients['switch'])

@socketio.on('switch_confirmed')
def switch_confirmed():
    if clients['computer']:
        socketio.emit('switch_confirmed', room=clients['computer'])

@socketio.on('switch_cancelled')
def switch_cancelled():
    if clients['computer']:
        socketio.emit('switch_cancelled', room=clients['computer'])

if __name__ == '__main__':
    # Use port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    # Turn off debug for production
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
