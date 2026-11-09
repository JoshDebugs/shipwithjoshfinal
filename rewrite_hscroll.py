with open('components/life/HorizontalScrollGroup.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'slideInFromRight?: boolean;',
    'fadeInFirst?: boolean;'
)

content = content.replace(
    '{ children, numPanels, slideInFromRight = false }',
    '{ children, numPanels, fadeInFirst = false }'
)

hooks_block = """  // Transform scroll progress (0 to 1) into x translation
  const endX = `-${(numPanels - 1) * 100}vw`;
  
  const x = useTransform(
    xProgress, 
    fadeInFirst ? [0, 1/numPanels, 1] : [0, 1], 
    fadeInFirst ? ["0vw", "0vw", endX] : ["0vw", endX]
  );
  
  const opacity = useTransform(
    xProgress,
    fadeInFirst ? [0, 0.5/numPanels, 1/numPanels] : [0, 1],
    fadeInFirst ? [0, 0, 1] : [1, 1]
  );
  
  const totalHeight = fadeInFirst ? (numPanels + 1) * 100 : numPanels * 100;"""

import re
content = re.sub(
    r'  // Transform scroll progress.*?const totalHeight.*?;',
    hooks_block,
    content,
    flags=re.DOTALL
)

content = content.replace(
    '<div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">',
    '<motion.div style={{ opacity }} className="sticky top-0 h-screen w-full overflow-hidden flex items-center">'
).replace(
    '      </div>\n    </section>',
    '      </motion.div>\n    </section>'
)

with open('components/life/HorizontalScrollGroup.tsx', 'w') as f:
    f.write(content)
