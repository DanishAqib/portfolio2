"use client";

import React from 'react';

/**
 * Head mask overlay — a duplicate of the portrait image clipped to only
 * show the head + hair region. Sits at z-index: 3 so agents (z-index: 2)
 * pass BEHIND the head, creating a depth illusion.
 * 
 * The clip-path polygon traces the head/hair silhouette of the portrait.
 */

// Clip path polygon for the head + hair region
// Coordinates are percentages of the image dimensions
const HEAD_CLIP = `polygon(
  38% 0%,
  42% 0%,
  48% 1%,
  55% 0%,
  62% 0%,
  68% 2%,
  74% 5%,
  78% 8%,
  82% 5%,
  86% 3%,
  90% 5%,
  92% 8%,
  91% 12%,
  88% 15%,
  84% 14%,
  80% 13%,
  76% 14%,
  73% 16%,
  70% 18%,
  68% 21%,
  66% 24%,
  64% 27%,
  62% 30%,
  60% 32%,
  57% 34%,
  54% 35%,
  51% 36%,
  48% 36%,
  45% 35%,
  42% 33%,
  40% 31%,
  38% 28%,
  37% 25%,
  36% 22%,
  36% 18%,
  36% 14%,
  37% 10%,
  37% 6%,
  38% 3%
)`;

export default function HeadMask() {
  return (
    <div 
      className="head-mask-overlay"
      style={{ '--head-clip': HEAD_CLIP }}
      aria-hidden="true"
    >
      <img 
        src="/images/portrait-vector-nobg.png" 
        alt="" 
        draggable="false"
      />
    </div>
  );
}
