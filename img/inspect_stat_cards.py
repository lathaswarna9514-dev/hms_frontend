import os
import re

search_dir = r"c:\Users\aksl8\OneDrive\Desktop\edoc-doctor-appointment-system-main\edoc_hms\frontend"
files_to_check = [
    r"hospital-admin\billing.html",
    r"super-admin\analytics.html",
    r"super-admin\support.html"
]

for rel_path in files_to_check:
    path = os.path.join(search_dir, rel_path)
    if os.path.exists(path):
        print(f"\n--- {rel_path} ---")
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                if 'stat-card' in line or 'stat-title' in line or 'stat-value' in line:
                    start = max(0, i - 1)
                    end = min(len(lines), i + 4)
                    print(f"Line {i+1}:")
                    for j in range(start, end):
                        print(f"  {j+1}: {lines[j].strip()}")
                    print("-" * 20)
