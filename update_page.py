with open('app/life/page.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<HorizontalScrollGroup numPanels={3}>',
    '<div className="relative w-full z-50 -mt-[200vh] pointer-events-none">\n          <div className="pointer-events-auto">\n            <HorizontalScrollGroup numPanels={3} slideInFromRight={true}>',
    1 # only replace the first occurrence
)

content = content.replace(
    '</HorizontalScrollGroup>\n\n        <HorizontalScrollGroup numPanels={3}>',
    '</HorizontalScrollGroup>\n          </div>\n        </div>\n\n        <HorizontalScrollGroup numPanels={3}>',
    1
)

with open('app/life/page.tsx', 'w') as f:
    f.write(content)
