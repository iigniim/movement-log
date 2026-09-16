"use client";

// TEMP DEBUG - remove after diagnosis
import { useEffect, useState } from "react";

export function TempDebugBanner() {
  const [dims, setDims] = useState("");

  useEffect(() => {
    const update = () => {
      const card = document.querySelector('[data-slot="card"]');
      if (!card) {
        setDims(`iw:${window.innerWidth} no card found`);
        return;
      }
      const rect = card.getBoundingClientRect();
      setDims(
        `iw:${window.innerWidth} card L:${Math.round(rect.left)} R:${Math.round(rect.right)} W:${Math.round(rect.width)}`,
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[9999] bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
      {dims}
    </div>
  );
}
