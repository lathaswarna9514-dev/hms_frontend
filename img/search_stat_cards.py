import os

search_dir = r"c:\Users\aksl8\OneDrive\Desktop\edoc-doctor-appointment-system-main\edoc_hms\frontend"
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith('.html'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if 'stat-card' in content:
                    print(f"Found in {os.path.relpath(path, search_dir)}")
                    # print some surrounding context if possible
