import os
import glob

components_dir = "components/life/chapters"
files = glob.glob(os.path.join(components_dir, "*.tsx"))

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Find the red border div and insert a debug span inside it
    target = 'style={{ border: "5px solid red", opacity: 1 }}'
    replacement = target + '>\n          <motion.div className="absolute top-0 left-0 bg-red-500 text-white text-4xl z-50 p-4">{useTransform(scrollYProgress, v => "DEBUG SCROLL: " + v.toFixed(3))}</motion.div'
    
    if target in content and 'DEBUG SCROLL' not in content:
        content = content.replace(target, replacement)
        with open(file_path, "w") as f:
            f.write(content)

print("Done.")
