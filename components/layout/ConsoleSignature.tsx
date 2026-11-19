"use client";

import { useEffect } from "react";

export function ConsoleSignature() {
  useEffect(() => {
    const styleTitle =
      "color:#c5ff3d;font:bold 16px ui-monospace,monospace;text-shadow:0 0 8px rgba(197,255,61,0.3)";
    const styleRule = "color:#5a5a5a;font:12px ui-monospace,monospace";
    const styleBody = "color:#f5f5f5;font:12px ui-monospace,monospace";
    const styleAccent = "color:#c5ff3d;font:12px ui-monospace,monospace";

    console.log(
      "%cshipwithjosh.com\n%c─────────────────────────────────\n\n%cinspecting the site? noted.\nif you're a recruiter who reads source,\nyou're already my type.\n\n%c→ workaddressjosh@gmail.com\n→ @JoshDebugs (everywhere on the internet)\n→ open to roles. picky about them.\n\n%cps: yes the cursor is custom.\nps: yes the magnetic letters were worth it.\nps: no, the site isn't using a template.",
      styleTitle,
      styleRule,
      styleBody,
      styleAccent,
      styleRule,
    );
  }, []);

  return null;
}
