import os
from flask import Flask, render_template, request, jsonify, make_response
from flask_socketio import SocketIO, emit
import logging
import traceback

# Explicitly define template folder path
template_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'templates')
app = Flask(__name__, template_folder=template_dir)

# Use async_mode='threading' to avoid eventlet SSL issues on Python 3.13
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Enable Flask debugging and more verbose logging
app.debug = True

# Configure logging to output to console with DEBUG level
logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger('werkzeug')  # Flask's default HTTP logger
log.setLevel(logging.DEBUG)  # Show detailed request logs

# Folder where game scripts are stored
GAMES_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'games')

clients = {
    'switch': None,
}

@app.route('/')
def index():
    try:
        user_agent = request.headers.get('User-Agent', '')
        if 'NintendoBrowser' in user_agent:
            resp = make_response(render_template('splash.html'))
            # Disable caching so splash reloads fresh on back navigation
            resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            resp.headers['Pragma'] = 'no-cache'
            resp.headers['Expires'] = '0'
            return resp
        else:
            return render_template('switch.html')
    except Exception:
        app.logger.error("Error in index route:\n%s", traceback.format_exc())
        return "Internal Server Error", 500

@app.route('/switch')
def switch():
    try:
        return render_template('switch.html')
    except Exception:
        app.logger.error("Error loading switch.html:\n%s", traceback.format_exc())
        return "Internal Server Error", 500

@app.route('/list-games')
def list_games():
    try:
        files = [f for f in os.listdir(GAMES_FOLDER) if f.endswith('.js')]
        app.logger.debug(f"[list-games] Found scripts: {files}")
        return jsonify(files)
    except Exception:
        app.logger.error("[list-games] Error:\n%s", traceback.format_exc())
        return jsonify([]), 500

@app.route('/load-game/<filename>')
def load_game(filename):
    try:
        if '..' in filename or filename.startswith('/'):
            return jsonify({'error': 'Invalid filename'}), 400

        path = os.path.join(GAMES_FOLDER, filename)
        if not os.path.isfile(path):
            return jsonify({'error': 'File not found'}), 404

        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        return jsonify({'content': content})
    except Exception:
        app.logger.error("[load-game] Error:\n%s", traceback.format_exc())
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/run-script', methods=['POST'])
def run_script():
    try:
        data = request.get_json()
        script = data.get('script', '')
        if clients['switch']:
            socketio.emit('run_script', {'script': script}, room=clients['switch'])
            return jsonify({'status': 'sent'})
        return jsonify({'status': 'no_switch_connected'}), 400
    except Exception:
        app.logger.error("[run-script] Error:\n%s", traceback.format_exc())
        return jsonify({'status': 'error'}), 500

@app.route('/view-log')
def view_log():
    try:
        with open('switch.log', 'r') as f:
            logs = f.read()
        return jsonify({'logs': logs})
    except Exception:
        app.logger.error("[view-log] Error:\n%s", traceback.format_exc())
        return jsonify({'logs': ''})

@app.route('/clear-log', methods=['POST'])
def clear_log():
    try:
        with open('switch.log', 'w') as f:
            f.write('')
        return jsonify({'cleared': True})
    except Exception:
        app.logger.error("[clear-log] Error:\n%s", traceback.format_exc())
        return jsonify({'cleared': False}), 500

@app.route('/confirm-load', methods=['POST'])
def confirm_load():
    try:
        data = request.get_json()
        success = data.get('success', False)
        message = data.get('message', '')

        # Log to server console and to file
        log_entry = f"[Switch Confirmation] Success: {success}, Message: {message}\n"
        app.logger.info(log_entry.strip())

        with open('switch.log', 'a') as f:
            f.write(log_entry)

        return jsonify({'received': True})
    except Exception:
        app.logger.error("[confirm-load] Error:\n%s", traceback.format_exc())
        return jsonify({'received': False}), 500

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    user_agent = request.headers.get('User-Agent', '')
    if 'NintendoBrowser' in user_agent:
        clients['switch'] = sid
        app.logger.info("[Switch] Connected")
    else:
        app.logger.info("[Unknown Client] Connected, ignoring")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if clients.get('switch') == sid:
        app.logger.info("[Switch] Disconnected")
        clients['switch'] = None

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # debug=True enables Flask's built-in debugger (disable in production)
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
