"use client";

import React from 'react';

/**
 * SVG motion path that defines the route agents follow across the portrait.
 * 
 * Path traced from image analysis:
 *   Upper-right hand → arm → shoulder → behind head → neck → left arm → lower-left hand
 * 
 * The path string is also exported for use in CSS offset-path.
 * Coordinates are in the portrait image's natural space (~1024x1024).
 */

// This path traces from the raised right hand (top-right) across
// the body down to the lower left hand (bottom-left).
// Calibrated to portrait-vector-nobg.png dimensions.
export const AGENT_PATH_D = 
  "M 920,90" +          // Start: fingertips of raised right hand (upper-right)
  " C 850,130 780,170 720,210" +   // Along the right forearm
  " C 660,250 620,270 580,280" +   // Right upper arm approaching shoulder
  " C 540,290 510,270 490,230" +   // Right shoulder, curving up toward head
  " C 470,190 460,160 470,140" +   // Behind the head (agents hidden here)
  " C 480,120 500,130 490,160" +   // Passing behind head top
  " C 475,200 460,240 440,280" +   // Reappearing at left neck/shoulder
  " C 410,330 370,380 340,430" +   // Down the left upper arm
  " C 300,490 260,550 230,600" +   // Left forearm
  " C 200,650 170,690 150,730" +   // Approaching the lower hand
  " C 130,770 115,800 105,830";    // End: lower-left hand fingertips

export default function MotionPath() {
  return (
    <svg 
      className="agent-motion-path"
      viewBox="0 0 1024 1024"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        d={AGENT_PATH_D}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeDasharray="6 4"
        opacity="0.4"
      />
    </svg>
  );
}
