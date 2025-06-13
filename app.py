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
    
    jobs = Job.query.filter_by(employer_id=current_user.id).all()
    return render_template('employer_dashboard.html', jobs=jobs)

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

from models import Job
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
        return redirect(url_for('employer_dashboard'))  # Adjust to your dashboard route
    
    return render_template('new_job.html')

@app.route('/delete-job/<int:job_id>', methods=['POST'])
@login_required
def delete_job(job_id):
    job = Job.query.get_or_404(job_id)

    # בדיקה שהמשתמש הוא הבעלים של המודעה
    if job.employer_id != current_user.id:
        flash('אין לך הרשאה למחוק משרה זו', 'danger')
        return redirect(url_for('employer_dashboard'))

    # מחיקת המודעה מהמסד נתונים
    try:
        db.session.delete(job)
        db.session.commit()
        flash('המשרה נמחקה בהצלחה', 'success')
    except:
        db.session.rollback()
        flash('אירעה שגיאה במחיקת המשרה', 'danger')

    return redirect(url_for('employer_dashboard'))
@app.route('/edit-job/<int:job_id>', methods=['GET', 'POST'])
@login_required
def edit_job(job_id):
    job = Job.query.get_or_404(job_id)

    # בדיקה שהמשתמש הוא הבעלים של המשרה
    if job.employer_id != current_user.id:
        flash('אין לך הרשאה לערוך משרה זו', 'danger')
        return redirect(url_for('employer_dashboard'))

    if request.method == 'POST':
        # עדכון המשרה עם הנתונים מהטופס
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

    # GET - הצגת טופס עריכה עם הנתונים הקיימים
    return render_template('edit_job.html', job=job)
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
