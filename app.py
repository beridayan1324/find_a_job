from flask import Flask, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from extensions import db, login_manager
from forms import LoginForm, RegisterForm
from models import User
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'beridayan2008'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'database.db')

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route('/')
def home():
    return render_template('base.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.password == form.password.data:
            login_user(user)
            return redirect(url_for('employer_dashboard' if user.role == 'employer' else 'worker_dashboard'))
        flash('אימייל או סיסמה שגויים')
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        # האם המשתמש כבר קיים?
        existing_user = User.query.filter_by(email=form.email.data).first()
        if existing_user:
            flash("This email is already registered. Try logging in.", "danger")
            return render_template('register.html', form=form)

        # משתמש לא קיים – צור חדש
        user = User(email=form.email.data, password=form.password.data, role=form.role.data)
        db.session.add(user)
        try:
            db.session.commit()
            login_user(user)
            return redirect(url_for('employer_dashboard' if user.role == 'employer' else 'worker_dashboard'))
        except:
            db.session.rollback()
            flash("An error occurred while creating the account.", "danger")

    return render_template('register.html', form=form)

@app.route('/employer')
@login_required
def employer_dashboard():
    if current_user.role != 'employer':
        return redirect(url_for('home'))
    return render_template('employer_dashboard.html')

@app.route('/worker')
@login_required
def worker_dashboard():
    if current_user.role != 'worker':
        return redirect(url_for('home'))
    return render_template('worker_dashboard.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

if __name__ == '__main__':

    app.run(debug=True)
