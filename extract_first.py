import re

with open("restore_all.sh", "r") as f:
    content = f.read()

# Pattern to match cat << 'EOF' > filename ... EOF
pattern = r"cat << 'EOF' > (.*?)\n(.*?)\nEOF\n"
matches = re.finditer(pattern, content, re.DOTALL)

files_extracted = set()

for match in matches:
    filename = match.group(1)
    file_content = match.group(2)
    
    # We only want components/life files (and we'll handle page.tsx separately)
    if filename.startswith("components/life/") and filename not in files_extracted:
        # Do not overwrite LifeNav, LifeTimeline, LifeHero, LifeStats as the user wants to keep the intro
        if "LifeNav" in filename or "LifeTimeline" in filename or "LifeHero" in filename or "LifeStats" in filename:
            continue
            
        print(f"Extracting first version of {filename}")
        with open(filename, "w") as out:
            out.write(file_content + "\n")
        files_extracted.add(filename)

