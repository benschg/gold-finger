"use client";

import Image from "next/image";
import { useState } from "react";

export function HeroFingerAnimation() {
  // Generate unique key on each component mount to force animation replay
  const [animKey] = useState(() => Date.now());

  return (
    <div className="mb-8 flex justify-center">
      <div
        className="group relative rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 p-4 shadow-xl shadow-yellow-500/40 duration-700 animate-in fade-in zoom-in sm:p-6"
        style={{ clipPath: "inset(-100% 0 0 0 round 999px)" }}
      >
        {/* Animated finger */}
        <div className="relative h-32 w-32 sm:h-40 sm:w-40" key={animKey}>
          <div className="finger-emerge absolute left-1/2 top-[80%] -ml-22 h-52 w-44 origin-bottom drop-shadow-xl transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:rotate-1 sm:-ml-26 sm:h-60 sm:w-52">
            <Image
              src="/gold-finger.svg"
              alt="Gold-Finger"
              className="h-full w-full"
              width={224}
              height={256}
              priority
            />
            {/* Fingertip glow effect - golden radiant glow */}
            <div className="absolute -top-5 left-[50%] h-12 w-8 rounded-full bg-amber-500/60 blur-xl sm:-top-6 sm:h-16 sm:w-10" />
            <div className="absolute -top-3 left-[52%] h-8 w-5 rounded-full bg-yellow-400/80 blur-lg sm:-top-4 sm:h-10 sm:w-6" />
            <div className="absolute -top-1 left-[53%] h-5 w-3 rounded-full bg-yellow-200 blur-md sm:-top-2 sm:h-6 sm:w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
