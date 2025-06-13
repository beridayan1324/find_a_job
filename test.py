import os
print("DB path:", os.path.abspath(os.path.join(app.instance_path, 'database.db')))