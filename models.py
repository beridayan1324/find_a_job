from flask_login import UserMixin
from extensions import db
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(256))  # stores hashed password
    role = db.Column(db.String(20))  # 'employer' or 'worker'


class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    hourly_rate = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    employer = db.relationship('User', backref='jobs')

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='active')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
