"use client";

// TEMP DEBUG - remove after diagnosis
import { useEffect, useState } from "react";

function describe(el: Element, isCard: boolean) {
  const classNames = typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean) : [];
  const label = classNames.length > 2 ? classNames.slice(0, 2).join(" ") : classNames.join(" ");
  const rect = el.getBoundingClientRect();
  return `${el.tagName}.${label} L:${Math.round(rect.left)} W:${Math.round(rect.width)}${isCard ? "  <- card" : ""}`;
}

export function TempDebugBanner() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      const card = document.querySelector('[data-slot="card"]');
      const start = card ?? document.body;

      const chain: Element[] = [];
      let el: Element | null = start;
      while (el) {
        chain.push(el);
        if (el === document.body) break;
        el = el.parentElement;
      }
      chain.reverse();

      const newLines = chain.map((node) => describe(node, node === card));
      setLines(card ? newLines : [`no card found (chain from body):`, ...newLines]);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[9999] max-h-48 w-full overflow-y-auto bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
