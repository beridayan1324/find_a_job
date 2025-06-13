from app import User
The error you're seeing is likely due to foreign key constraints in your database. When you try to delete a user, other tables that reference that user (like jobs, applications, etc.) prevent the deletion.
Here are several solutions for your Flask/SQLAlchemy application:
Solution 1: Delete Related Records First (Recommended)
Create a function to properly delete a user and all related data:
pythondef delete_user_safely(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return False, "User not found"
        
        # Delete related records first (adjust table names to match your schema)
        # Example - replace with your actual related tables:
        
        # Delete job applications
        JobApplication.query.filter_by(user_id=user_id).delete()
        
        # If user is employer, delete their job postings
        if user.role == 'employer':
            Job.query.filter_by(employer_id=user_id).delete()
        
        # Delete any other related records
        # Message.query.filter_by(user_id=user_id).delete()
        # Review.query.filter_by(user_id=user_id).delete()
        
        # Finally delete the user
        db.session.delete(user)
        db.session.commit()
        
        return True, "User deleted successfully"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error deleting user: {str(e)}"