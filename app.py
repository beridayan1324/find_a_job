from flask import Flask, render_template, redirect, url_for, request, flash
from flask_login import login_user, login_required, logout_user, current_user
from extensions import db, login_manager
from forms import LoginForm, RegisterForm
from models import User
from models import Application, Job, db
from werkzeug.security import generate_password_hash, check_password_hash

import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', '')
if not app.config['SECRET_KEY']:
    raise RuntimeError('SECRET_KEY environment variable must be set')
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
        if user and check_password_hash(user.password, form.password.data):
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
        hashed_password = generate_password_hash(form.password.data)
        user = User(email=form.email.data, password=hashed_password, role=form.role.data)
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
    
    # כל המשרות שהמעסיק פרסם
    jobs = Job.query.filter_by(employer_id=current_user.id).all()

    # מספר משרות פעילות (אפשר לסנן אם יש שדה שמגדיר מצב פעילות, אחרת פשוט הספור הוא כל המשרות)
    active_jobs_count = len(jobs)

    # מספר מועמדים למשרות של המעסיק - סופר את כל היישומים למשרות שלו
    job_ids = [job.id for job in jobs]

    # סופר את כל היישומים עם job_id מתוך רשימת המשרות של המעסיק
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
    # נניח שיש לך כבר את רשימת המשרות והבקשות
    jobs = Job.query.all()  # או מסנן אחר לפי הצורך
    applications = Application.query.filter_by(user_id=current_user.id).all()

    # סופרים בקשות פעילות (למשל סטטוס 'active')
    active_applications_count = Application.query.filter_by(user_id=current_user.id, status='active').count()
    
    # סופרים עבודות שהושלמו (למשל סטטוס 'completed')
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
    from forms import JobForm
    form = JobForm()
    if form.validate_on_submit():
        title = form.title.data
        description = form.description.data
        hourly_rate = form.hourly_rate.data
        
        job = Job(
            title=title,
            description=description,
            hourly_rate=hourly_rate,
            employer_id=current_user.id
        )
        db.session.add(job)
        db.session.commit()
        flash('משרה פורסמה בהצלחה!')
        return redirect(url_for('employer_dashboard'))  # Adjust to your dashboard route
    
    return render_template('new_job.html', form=form)

@app.route('/delete-job/<int:job_id>', methods=['POST'])
@login_required
def delete_job(job_id):
    from forms import DeleteJobForm
    form = DeleteJobForm()
    if not form.validate_on_submit():
        flash('בקשה לא חוקית', 'danger')
        return redirect(url_for('employer_dashboard'))

    job = Job.query.get_or_404(job_id)

    if job.employer_id != current_user.id:
        flash('אין לך הרשאה למחוק משרה זו', 'danger')
        return redirect(url_for('employer_dashboard'))

    try:
        # מחיקת כל הבקשות הקשורות למשרה
        Application.query.filter_by(job_id=job.id).delete()

        # מחיקת המשרה
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
    from forms import JobForm
    job = Job.query.get_or_404(job_id)

    # בדיקה שהמשתמש הוא הבעלים של המשרה
    if job.employer_id != current_user.id:
        flash('אין לך הרשאה לערוך משרה זו', 'danger')
        return redirect(url_for('employer_dashboard'))

    form = JobForm(obj=job)
    if form.validate_on_submit():
        # עדכון המשרה עם הנתונים מהטופס
        job.title = form.title.data
        job.description = form.description.data
        job.hourly_rate = form.hourly_rate.data

        try:
            db.session.commit()
            flash('המשרה עודכנה בהצלחה', 'success')
            return redirect(url_for('employer_dashboard'))
        except:
            db.session.rollback()
            flash('אירעה שגיאה בעדכון המשרה', 'danger')

    # GET - הצגת טופס עריכה עם הנתונים הקיימים
    return render_template('edit_job.html', job=job, form=form)

@app.route('/apply/<int:job_id>', methods=['POST'])
@login_required
def apply_job(job_id):
    from forms import ApplyForm
    form = ApplyForm()
    if not form.validate_on_submit():
        flash('בקשה לא חוקית', 'danger')
        return redirect(url_for('worker_dashboard'))

    existing = Application.query.filter_by(user_id=current_user.id, job_id=job_id).first()
    if existing:
        flash('כבר הגשת מועמדות לעבודה זו.', 'warning')
    else:
        new_app = Application(user_id=current_user.id, job_id=job_id)
        db.session.add(new_app)
        print('Added new application to session')
        db.session.commit()
        print('Committed new application to DB')
        flash('המועמדות נשלחה בהצלחה!', 'success')

    return redirect(url_for('worker_dashboard'))
@app.route('/employer/applications')
@login_required
def employer_applications():
    # שולף את כל המשרות שהמעסיק פרסם
    jobs = Job.query.filter_by(employer_id=current_user.id).all()

    # אוסף את כל המועמדויות של המשרות האלו
    applications = []
    for job in jobs:
        job_apps = Application.query.filter_by(job_id=job.id).all()
        for app in job_apps:
            applications.append({
                'job': job,
                'application': app,
                'candidate': User.query.get(app.user_id)
            })

    return render_template('employer_applications.html', applications=applications)
if __name__ == '__main__':

    with app.app_context():

        db.create_all()
    app.run(debug=False)
