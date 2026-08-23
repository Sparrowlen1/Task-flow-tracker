import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///taskflow.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'dev-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app, supports_credentials=True, origins='http://localhost:5173')

# -------------------- JWT ERROR HANDLERS --------------------
@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"Invalid token error: {error}")
    return jsonify({'error': 'Invalid token', 'details': str(error)}), 422

@jwt.unauthorized_loader
def unauthorized_callback(error):
    print(f"Unauthorized error: {error}")
    return jsonify({'error': 'Missing or invalid token', 'details': str(error)}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    print(f"Expired token: {jwt_data}")
    return jsonify({'error': 'Token expired', 'details': 'Please login again'}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_data):
    return jsonify({'error': 'Token revoked'}), 401

@jwt.token_verification_failed_loader
def verification_failed_callback(jwt_header, jwt_data):
    print(f"Verification failed: {jwt_header} - {jwt_data}")
    return jsonify({'error': 'Token verification failed'}), 422

# -------------------- MODELS --------------------
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

# -------------------- AUTH ROUTES --------------------
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409

    from werkzeug.security import generate_password_hash
    user = User(
        username=data['username'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    print("===== LOGIN REQUEST =====")
    data = request.get_json()
    print(f"Username: {data.get('username') if data else 'No data'}")

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user:
        print(f"User not found: {data['username']}")
        return jsonify({'error': 'Invalid credentials'}), 401

    from werkzeug.security import check_password_hash
    if not check_password_hash(user.password_hash, data['password']):
        print(f"Password mismatch for user: {data['username']}")
        return jsonify({'error': 'Invalid credentials'}), 401

    # FIX: Convert user.id to string
    access_token = create_access_token(identity=str(user.id))
    print(f"Login successful for user: {data['username']}, token generated")
    return jsonify({'access_token': access_token, 'user_id': user.id, 'username': user.username}), 200

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    print("===== /api/me CALLED =====")
    # FIX: Convert identity back to int
    user_id = int(get_jwt_identity())
    print(f"User ID from token: {user_id}")
    user = User.query.get(user_id)
    if not user:
        print(f"User not found with ID: {user_id}")
        return jsonify({'error': 'User not found'}), 404
    print(f"User found: {user.username}")
    return jsonify({'id': user.id, 'username': user.username}), 200

# -------------------- TASK ROUTES (CRUD + Pagination) --------------------
@app.route('/api/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    print("===== /api/tasks CALLED =====")
    user_id = int(get_jwt_identity())  # FIX: convert to int
    print(f"User ID from token: {user_id}")
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = Task.query.filter_by(user_id=user_id)
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    print(f"Found {len(paginated.items)} tasks for user {user_id}")
    return jsonify({
        'tasks': [{
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'status': t.status,
            'user_id': t.user_id
        } for t in paginated.items],
        'total': paginated.total,
        'page': page,
        'per_page': per_page,
        'pages': paginated.pages
    }), 200

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    user_id = int(get_jwt_identity())  # FIX: convert to int
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'user_id': task.user_id
    }), 200

@app.route('/api/tasks', methods=['POST'])
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())  # FIX: convert to int
    data = request.get_json()

    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    try:
        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            status=data.get('status', 'pending'),
            user_id=user_id
        )
        db.session.add(task)
        db.session.commit()

        return jsonify({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'user_id': task.user_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PATCH'])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())  # FIX: convert to int
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.get_json()
    try:
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'status' in data:
            task.status = data['status']
        db.session.commit()

        return jsonify({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'user_id': task.user_id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())  # FIX: convert to int
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)