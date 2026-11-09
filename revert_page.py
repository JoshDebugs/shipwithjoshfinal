with open('app/life/page.tsx', 'r') as f:
    content = f.read()

import re

# We added <div className="relative w-full z-50 -mt-[200vh] pointer-events-none">
#          <div className="pointer-events-auto">
#            <HorizontalScrollGroup numPanels={3} pauseFirst={true}>
#              ...
#            </HorizontalScrollGroup>
#          </div>
#        </div>

content = re.sub(
    r'<div className="relative w-full z-50 -mt-\[200vh\] pointer-events-none">\s*<div className="pointer-events-auto">\s*<HorizontalScrollGroup numPanels={3}.*?>',
    '<HorizontalScrollGroup numPanels={3}>',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'</HorizontalScrollGroup>\s*</div>\s*</div>',
    '</HorizontalScrollGroup>',
    content,
    flags=re.DOTALL
)

with open('app/life/page.tsx', 'w') as f:
    f.write(content)
