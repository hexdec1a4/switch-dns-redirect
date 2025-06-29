from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import logging

app = Flask(__name__)
socketio = SocketIO(app)

# Disable Werkzeug logs
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# Track connected clients
clients = {
    'switch': None,
    'computer': None
}

# Route root based on user-agent
@app.route('/')
def index():
    user_agent = request.headers.get('User-Agent', '')
    if 'NintendoBrowser' in user_agent:
        return render_template('switch.html')
    else:
        return render_template('computer.html')

# Optional direct routes (fallback)
@app.route('/switch')
def switch():
    return render_template('switch.html')

@app.route('/computer')
def computer():
    return render_template('computer.html')

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    user_agent = request.headers.get('User-Agent', '')
    if 'NintendoBrowser' in user_agent:
        clients['switch'] = sid
        print("[Switch] Connected to server")
    else:
        clients['computer'] = sid
        print("[Computer] Connected to server")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if clients['switch'] == sid:
        print("[Switch] Disconnected")
        clients['switch'] = None
        socketio.emit('disconnect', room=clients['computer'])
    elif clients['computer'] == sid:
        print("[Computer] Disconnected")
        clients['computer'] = None
        socketio.emit('disconnect', room=clients['switch'])

@socketio.on('switch_connected')
def switch_connected():
    print("[Switch] Notified: switch_connected")
    if clients['computer']:
        socketio.emit('switch_connected', room=clients['computer'])

@socketio.on('computer_ready')
def computer_ready():
    print("[Computer] Sent: computer_ready")
    if clients['switch']:
        socketio.emit('computer_ready', room=clients['switch'])

@socketio.on('switch_confirmed')
def switch_confirmed():
    print("[Switch] Confirmed connection")
    if clients['computer']:
        socketio.emit('switch_confirmed', room=clients['computer'])

@socketio.on('switch_cancelled')
def switch_cancelled():
    print("[Switch] Cancelled connection")
    if clients['computer']:
        socketio.emit('switch_cancelled', room=clients['computer'])

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=80)
