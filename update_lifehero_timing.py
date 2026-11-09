with open('components/life/LifeHero.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'const heroOpacity = useTransform(scrollProgress, [0, 0.4, 0.6], [1, 1, 0]);',
    'const heroOpacity = useTransform(scrollProgress, [0, 0.24, 0.36], [1, 1, 0]);'
)

content = content.replace(
    'const heroScale = useTransform(scrollProgress, [0, 0.4, 0.6], [1, 1, 0.95]);',
    'const heroScale = useTransform(scrollProgress, [0, 0.24, 0.36], [1, 1, 0.95]);'
)

content = content.replace(
    'const introOpacity = useTransform(scrollProgress, [0.4, 0.5, 1], [0, 1, 1]);',
    'const introOpacity = useTransform(scrollProgress, [0.24, 0.3, 1], [0, 1, 1]);'
)

content = content.replace(
    'const introScale = useTransform(scrollProgress, [0.5, 0.7, 1], [1.1, 1, 1]);',
    'const introScale = useTransform(scrollProgress, [0.3, 0.42, 1], [1.1, 1, 1]);'
)

content = content.replace(
    'const introFilter = useTransform(scrollProgress, [0.5, 0.7], ["blur(10px)", "blur(0px)"]);',
    'const introFilter = useTransform(scrollProgress, [0.3, 0.42], ["blur(10px)", "blur(0px)"]);'
)

content = content.replace(
    'const start = 0.45 + (globalIndex / totalChars) * 0.4;',
    'const start = 0.27 + (globalIndex / totalChars) * 0.24;'
)

with open('components/life/LifeHero.tsx', 'w') as f:
    f.write(content)
