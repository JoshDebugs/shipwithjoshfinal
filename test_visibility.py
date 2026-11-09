import os
import glob
import re

components_dir = "components/life/chapters"
files = glob.glob(os.path.join(components_dir, "*.tsx"))

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Find the first style={{ opacity: ... }} and replace it with style={{ border: '5px solid red' }}
    # Just for the first occurrence in the file to see if the intro block appears.
    content = re.sub(r'style=\{\{ opacity: useTransform\(scrollYProgress, \[[0-9., ]+\], \[[0-9., ]+\]\).*?\}\}', r'style={{ border: "5px solid red", opacity: 1 }}', content, count=1)

    with open(file_path, "w") as f:
        f.write(content)
        
print("Done.")
