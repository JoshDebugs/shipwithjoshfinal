import os
import glob

components_dir = "components/life/chapters"
files = glob.glob(os.path.join(components_dir, "*.tsx"))

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Replace the offset array
    content = content.replace('offset: ["start end", "end start"]', 'offset: ["start start", "end end"]')

    with open(file_path, "w") as f:
        f.write(content)

print(f"Fixed {len(files)} files.")
