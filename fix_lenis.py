import os
import glob
import re

components_dir = "components/life/chapters"
files = glob.glob(os.path.join(components_dir, "*.tsx"))

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Import useLenis and useMotionValue if not already imported
    if "useLenis" not in content:
        content = content.replace('from "framer-motion";', 'useMotionValue } from "framer-motion";\nimport { useLenis } from "lenis/react";')
    elif "useMotionValue" not in content:
        content = content.replace('useScroll', 'useScroll, useMotionValue')

    # Replace the useScroll line
    # Find: const { scrollYProgress } = useScroll({ target: container, offset: ["start start", "end end"] });
    # OR: const { scrollYProgress } = useScroll({ target: container, offset: ["start end", "end start"] });
    # Replace with custom logic
    
    pattern = r'const { scrollYProgress } = useScroll\([^)]+\);'
    
    replacement = """const scrollYProgress = useMotionValue(0);

  useLenis(() => {
    if (!container.current) return;
    const rect = container.current.getBoundingClientRect();
    const scrollDistance = rect.height - window.innerHeight;
    if (scrollDistance > 0) {
      const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
      scrollYProgress.set(progress);
    }
  });"""
    
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        
        with open(file_path, "w") as f:
            f.write(content)
        print(f"Fixed {os.path.basename(file_path)}")

print("Done.")
