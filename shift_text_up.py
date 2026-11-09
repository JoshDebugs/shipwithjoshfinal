import re

with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

# Replace Phrase 1 container
content = content.replace(
    'className="absolute inset-0 flex items-center justify-center px-6 md:px-12"',
    'className="absolute inset-0 flex items-center justify-center px-6 md:px-12 pb-[15vh]"'
)

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
