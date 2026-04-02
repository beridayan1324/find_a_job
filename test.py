import os

# Safe: uses os.path functions only on a known base path; no user input involved.
instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
db_path = os.path.normpath(os.path.join(instance_path, 'database.db'))

# Ensure the resolved path stays within the instance directory
if not db_path.startswith(os.path.normpath(instance_path)):
    raise ValueError('Path traversal detected')

print("DB path:", db_path)
