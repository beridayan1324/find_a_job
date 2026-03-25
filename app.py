from flask import Flask, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from extensions import db, login_manager
from forms import LoginForm, RegisterForm
from models import User
from models import Application, Job, db

import os

app = Flask(__name__)

# SECRET_KEY and DB URI are loaded from environment variables
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
if not app.config['SECRET_KEY']:
    raise RuntimeError('SECRET_KEY environment variable is not set')

_db_path = os.environ.get('DATABASE_PATH')
if not _db_path:
    raise RuntimeError('DATABASE_PATH environment variable is not set')
# Resolve to an absolute path and ensure it stays within the instance folder
_db_path = os.path.realpath(_db_path)
_instance_path = os.path.realpath(app.instance_path)
if not _db_path.startswith(_instance_path + os.sep) and _db_path != _instance_path:
    raise RuntimeError('DATABASE_PATH must be inside the instance folder')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + _db_path

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
            # Redirect to a fixed internal route based on role - no open redirect
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
            # Redirect to a fixed internal route based on role - no open redirect
            if user.role == 'employer':
                return redirect(url_for('employer_dashboard'))
            else:
                return redirect(url_for('worker_dashboard'))
        except:
            db.session.rollback()
            flash("An error occurred while creating the account.", "danger")

    return render_template('register.html', form=form)

@app.route('/employer')
@login_required
def employer_dashboard():
    if current_user.role != 'employer':
        return redirect(url_for('home'))
    
    # כל המשרות שהמעסיק פרסם
    jobs = Job.query.filter_by(employer_id=current_user.id).all()

    # מספר משרות פעילות
    active_jobs_count = len(jobs)

    # מספר מועמדים למשרות של המעסיק
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
        title = request.form['title']
        description = request.form['description']
        hourly_rate = request.form['hourly_rate']
        
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
    except:
        db.session.rollback()
        flash('אירעה שגיאה במחיקת המשרה או הבקשות', 'danger')

    return redirect(url_for('employer_dashboard'))

@app.route('/edit-job/<int:job_id>', methods=['GET', 'POST'])
@login_required
def edit_job(job_id):
    job = Job.query.get_or_404(job_id)

    if job.employer_id != current_user.id:
        flash('אין לך הרשאה לערוך משרה זו', 'danger')
        return redirect(url_for('employer_dashboard'))

    if request.method == 'POST':
        job.title = request.form['title']
        job.description = request.form['description']
        job.hourly_rate = request.form['hourly_rate']

        try:
            db.session.commit()
            flash('המשרה עודכנה בהצלחה', 'success')
            return redirect(url_for('employer_dashboard'))
        except:
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
        for app_item in job_apps:
            applications.append({
                'job': job,
                'application': app_item,
                'candidate': User.query.get(app_item.user_id)
            })

    return render_template('employer_applications.html', applications=applications)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=False)
