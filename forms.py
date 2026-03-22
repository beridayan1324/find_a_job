from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField
from wtforms.validators import DataRequired, Email, Length, ValidationError
import re

ALLOWED_ROLES = {'employer', 'worker'}

def safe_string_check(form, field):
    """Reject input containing HTML/script tags."""
    if field.data and re.search(r'[<>"\']', field.data):
        raise ValidationError('Input contains invalid characters.')

class RegisterForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email(), Length(max=150)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8, max=128)])
    role = SelectField('Role', choices=[('employer', 'Employer'), ('worker', 'Worker')], validators=[DataRequired()])
    submit = SubmitField('Register')

    def validate_role(self, field):
        if field.data not in ALLOWED_ROLES:
            raise ValidationError('Invalid role selected.')

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email(), Length(max=150)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=1, max=128)])
    submit = SubmitField('Login')
