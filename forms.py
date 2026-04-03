from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField, TextAreaField, IntegerField
from wtforms.validators import DataRequired, Email, Length, NumberRange

class RegisterForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    role = SelectField('Role', choices=[('employer', 'Employer'), ('worker', 'Worker')], validators=[DataRequired()])
    submit = SubmitField('Register')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class NewJobForm(FlaskForm):
    title = StringField('שם המשרה', validators=[DataRequired(), Length(max=150)])
    description = TextAreaField('תיאור', validators=[DataRequired()])
    hourly_rate = IntegerField('שכר לשעה', validators=[DataRequired(), NumberRange(min=0)])
    submit = SubmitField('פרסם')

class EditJobForm(FlaskForm):
    title = StringField('שם המשרה', validators=[DataRequired(), Length(max=150)])
    description = TextAreaField('תיאור', validators=[DataRequired()])
    hourly_rate = IntegerField('שכר לשעה', validators=[DataRequired(), NumberRange(min=0)])
    submit = SubmitField('שמור שינויים')
