"use client";

// TEMP DEBUG - remove after diagnosis
import { useEffect, useState } from "react";

export function TempDebugBanner() {
  const [dims, setDims] = useState("");

  useEffect(() => {
    const update = () =>
      setDims(`sw:${document.documentElement.scrollWidth} / iw:${window.innerWidth}`);
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
