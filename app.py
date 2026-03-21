from flask import Flask, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from extensions import db, login_manager
from forms import LoginForm, RegisterForm
from models import User
from models import Application, Job, db
from werkzeug.security import generate_password_hash, check_password_hash
from talisman import Talisman

import os
import secrets

app = Flask(__name__)

# Use environment variable for SECRET_KEY; fall back to a random secret (never hardcoded)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'database.db')

db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = 'login'

# Add CSP and security headers via Talisman
csp = {
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': "'self' data:",
    'font-src': "'self'",
}
Talisman(app, content_security_policy=csp, force_https=False)

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
        if user and check_password_hash(user.password, form.password.data):
            login_user(user)
            if user.role == 'employer':
                return redirect(url_for('employer_dashboard'))
            else:
                return redirect(url_for('worker_dashboard'))
        flash('אימייל או סיסמה שגויים')
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        existing_user = User.query.filter_by(email=form.email.data).first()
        if existing_user:
            flash("This email is already registered. Try logging in.", "danger")
            return render_template('register.html', form=form)

        hashed_password = generate_password_hash(form.password.data)
        user = User(email=form.email.data, password=hashed_password, role=form.role.data)
        db.session.add(user)
        try:
            db.session.commit()
            login_user(user)
            if user.role == 'employer':
                return redirect(url_for('employer_dashboard'))
            else:
                return redirect(url_for('worker_dashboard'))
        except Exception:
            db.session.rollback()
            flash("An error occurred while creating the account.", "danger")

    return render_template('register.html', form=form)

@app.route('/employer')
@login_required
def employer_dashboard():
    if current_user.role != 'employer':
        return redirect(url_for('home'))
    
    jobs = Job.query.filter_by(employer_id=current_user.id).all()
    active_jobs_count = len(jobs)
    job_ids = [job.id for job in jobs]
    candidates_count = Application.query.filter(Application.job_id.in_(job_ids)).count()

    return render_template(
        'employer_dashboard.html', 
        jobs=jobs, 
        active_jobs_count=active_jobs_count, 
        candidates_count=candidates_count
    )

@app.route('/worker')
@login_required
def worker_dashboard():
    jobs = Job.query.all()
    applications = Application.query.filter_by(user_id=current_user.id).all()
    active_applications_count = Application.query.filter_by(user_id=current_user.id, status='active').count()
    completed_jobs_count = Application.query.filter_by(user_id=current_user.id, status='completed').count()

    return render_template(
        'worker_dashboard.html',
        jobs=jobs,
        applications=applications,
        active_applications_count=active_applications_count,
        completed_jobs_count=completed_jobs_count,
    )

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/new-job', methods=['GET', 'POST'])
@login_required
def new_job():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        hourly_rate = request.form.get('hourly_rate', '').strip()
        
        if not title or not description or not hourly_rate:
            flash('כל השדות נדרשים.', 'danger')
            return render_template('new_job.html')

        try:
            hourly_rate = int(hourly_rate)
        except ValueError:
            flash('שכר לשעה חייב להיות מספר.', 'danger')
            return render_template('new_job.html')

        job = Job(
            title=title,
            description=description,
            hourly_rate=hourly_rate,
            employer_id=current_user.id
        )
        db.session.add(job)
        db.session.commit()
        flash('משרה פורסמה בהצלחה!')
        return redirect(url_for('employer_dashboard'))
    
    return render_template('new_job.html')

@app.route('/delete-job/<int:job_id>', methods=['POST'])
@login_required
def delete_job(job_id):
    job = Job.query.get_or_404(job_id)

    if job.employer_id != current_user.id:
        flash('אין לך הרשאה למחוק משרה זו', 'danger')
        return redirect(url_for('employer_dashboard'))

    try:
        Application.query.filter_by(job_id=job.id).delete()
        db.session.delete(job)
        db.session.commit()
        flash('המשרה וכל המועמדויות נמחקו בהצלחה', 'success')
    except Exception:
        db.session.rollback()
        flash('אירעה שגיאה במחיקת המשרה', 'danger')

    return redirect(url_for('employer_dashboard'))

@app.route('/edit-job/<int:job_id>', methods=['GET', 'POST'])
@login_required
def edit_job(job_id):
    job = Job.query.get_or_404(job_id)

    if job.employer_id != current_user.id:
        flash('אין לך הרשאה לערוך משרה זו', 'danger')
        return redirect(url_for('employer_dashboard'))

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        hourly_rate = request.form.get('hourly_rate', '').strip()

        if not title or not description or not hourly_rate:
            flash('כל השדות נדרשים.', 'danger')
            return render_template('edit_job.html', job=job)

        try:
            hourly_rate = int(hourly_rate)
        except ValueError:
            flash('שכר לשעה חייב להיות מספר.', 'danger')
            return render_template('edit_job.html', job=job)

        job.title = title
        job.description = description
        job.hourly_rate = hourly_rate

        try:
            db.session.commit()
            flash('המשרה עודכנה בהצלחה', 'success')
            return redirect(url_for('employer_dashboard'))
        except Exception:
            db.session.rollback()
            flash('אירעה שגיאה בעדכון המשרה', 'danger')

    return render_template('edit_job.html', job=job)

@app.route('/apply/<int:job_id>', methods=['POST'])
@login_required
def apply_job(job_id):
    existing = Application.query.filter_by(user_id=current_user.id, job_id=job_id).first()
    if existing:
        flash('כבר הגשת מועמדות לעבודה זו.', 'warning')
    else:
        new_app = Application(user_id=current_user.id, job_id=job_id)
        db.session.add(new_app)
        db.session.commit()
        flash('המועמדות נשלחה בהצלחה!', 'success')

    return redirect(url_for('worker_dashboard'))

@app.route('/employer/applications')
@login_required
def employer_applications():
    jobs = Job.query.filter_by(employer_id=current_user.id).all()

    applications = []
    for job in jobs:
        job_apps = Application.query.filter_by(job_id=job.id).all()
        for application in job_apps:
            applications.append({
                'job': job,
                'application': application,
                'candidate': User.query.get(application.user_id)
            })

    return render_template('employer_applications.html', applications=applications)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=False)
