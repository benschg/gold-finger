"use client";

import Image from "next/image";
import { useState } from "react";

export function HeroFingerAnimation() {
  // Generate unique key on each component mount to force animation replay
  const [animKey] = useState(() => Date.now());

  return (
    <div className="mb-8 flex justify-center">
      <div
        className="group relative rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 p-6 shadow-xl shadow-yellow-500/40 duration-700 animate-in fade-in zoom-in sm:p-8"
        style={{ clipPath: "inset(-50% 0 0 0 round 999px)" }}
      >
        {/* Animated finger */}
        <div className="relative h-48 w-48" key={animKey}>
          <div className="finger-emerge absolute left-1/2 top-1/2 -ml-24 h-56 w-48 origin-bottom drop-shadow-xl sm:-ml-28 sm:h-64 sm:w-56">
            <Image
              src="/gold-finger.svg"
              alt="Gold-Finger"
              className="h-full w-full"
              width={224}
              height={256}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
