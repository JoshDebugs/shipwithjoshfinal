with open('components/life/HorizontalScrollGroup.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'interface HorizontalScrollGroupProps {\n  children: ReactNode;\n  numPanels: number;\n}',
    'interface HorizontalScrollGroupProps {\n  children: ReactNode;\n  numPanels: number;\n  slideInFromRight?: boolean;\n}'
)

content = content.replace(
    'export function HorizontalScrollGroup({ children, numPanels }: HorizontalScrollGroupProps) {',
    'export function HorizontalScrollGroup({ children, numPanels, slideInFromRight = false }: HorizontalScrollGroupProps) {'
)

content = content.replace(
    '  const x = useTransform(xProgress, [0, 1], ["0vw", `-${(numPanels - 1) * 100}vw`]);',
    '''  const startX = slideInFromRight ? "100vw" : "0vw";
  const endX = `-${(numPanels - 1) * 100}vw`;
  const x = useTransform(xProgress, [0, 1], [startX, endX]);
  const totalHeight = slideInFromRight ? (numPanels + 1) * 100 : numPanels * 100;'''
)

content = content.replace(
    'style={{ height: `${numPanels * 100}vh` }}',
    'style={{ height: `${totalHeight}vh` }}'
)

with open('components/life/HorizontalScrollGroup.tsx', 'w') as f:
    f.write(content)
