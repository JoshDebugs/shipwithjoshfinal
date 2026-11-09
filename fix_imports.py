import os
import glob
import re

components_dir = "components/life/chapters"
files = glob.glob(os.path.join(components_dir, "*.tsx"))

for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()

    # Fix the broken import
    content = content.replace('import { motion, useScroll, useTransform } useMotionValue } from "framer-motion";', 'import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";')
    content = content.replace('import { motion, useTransform } useMotionValue } from "framer-motion";', 'import { motion, useTransform, useMotionValue } from "framer-motion";')
    # Or generically using regex
    content = re.sub(r'import \{ ([^}]+) \} useMotionValue \} from "framer-motion";', r'import { \1, useMotionValue } from "framer-motion";', content)

    with open(file_path, "w") as f:
        f.write(content)
        
print("Done.")
