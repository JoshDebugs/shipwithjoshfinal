with open('components/life/HorizontalScrollGroup.tsx', 'r') as f:
    content = f.read()

content = content.replace('fadeInFirst?: boolean;', 'pauseFirst?: boolean;')
content = content.replace('{ children, numPanels, fadeInFirst = false }', '{ children, numPanels, pauseFirst = false }')

hooks_block = """  // Transform scroll progress (0 to 1) into x translation
  const endX = `-${(numPanels - 1) * 100}vw`;
  
  const x = useTransform(
    xProgress, 
    pauseFirst ? [0, 1/numPanels, 1] : [0, 1], 
    pauseFirst ? ["0vw", "0vw", endX] : ["0vw", endX]
  );
  
  const opacity = 1;
  const totalHeight = pauseFirst ? (numPanels + 1) * 100 : numPanels * 100;"""

import re
content = re.sub(
    r'  // Transform scroll progress.*?const totalHeight.*?;',
    hooks_block,
    content,
    flags=re.DOTALL
)

with open('components/life/HorizontalScrollGroup.tsx', 'w') as f:
    f.write(content)
