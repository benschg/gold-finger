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
            {/* Fingertip glow effect - golden radiant glow */}
            <div className="absolute -top-6 left-[46%] h-16 w-10 rounded-full bg-amber-500/60 blur-xl sm:h-20 sm:w-12" />
            <div className="absolute -top-4 left-[48%] h-10 w-6 rounded-full bg-yellow-400/80 blur-lg sm:h-12 sm:w-8" />
            <div className="absolute -top-2 left-[50%] h-6 w-4 rounded-full bg-yellow-200 blur-md sm:h-8 sm:w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
