from flask_login import UserMixin
from extensions import db  # לא מייבא את app, רק את db

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(150))
    role = db.Column(db.String(20))  # 'employer' or 'worker'