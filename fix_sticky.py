import os
import glob

components_dir = "components/life/chapters"
files = glob.glob(os.path.join(components_dir, "*.tsx"))

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Move overflow-hidden from <section> to <div className="sticky...">
    content = content.replace('overflow-hidden">', '">')
    content = content.replace('className="sticky top-0 w-full h-screen', 'className="sticky top-0 w-full h-screen overflow-hidden')

    with open(file_path, "w") as f:
        f.write(content)

print(f"Fixed {len(files)} files.")
