"use client";

import React, { useMemo } from 'react';

/**
 * AgentSprite — A single miniature robot agent that follows the motion path.
 * 
 * Props:
 *   - color: accent color for the agent
 *   - pathCSS: the CSS path() string for offset-path
 *   - duration: traversal duration in seconds
 *   - delay: animation delay in seconds
 *   - banner: text for the completion banner
 */

const BANNER_MESSAGES = [
  "Task Done",
  "API Shipped",
  "Deploy Complete",
  "Automation Live",
  "Bug Fixed",
  "Pipeline Clear",
];

// Compact robot SVG — sleek silhouette style
function MiniRobotSVG({ color }) {
  return (
    <svg 
      className="agent-sprite-svg"
      viewBox="0 0 16 22" 
      width="18" 
      height="22"
      aria-hidden="true"
    >
      {/* Antenna */}
      <line x1="8" y1="2.5" x2="8" y2="0.5" stroke={color} strokeWidth="0.8" strokeLinecap="round"/>
      <circle cx="8" cy="0.5" r="0.9" fill={color} className="eye"/>

      {/* Head */}
      <rect x="3.5" y="3" width="9" height="5.5" rx="1.8" 
        fill="var(--bg-2)" stroke={color} strokeWidth="0.6"/>
      
      {/* Eyes */}
      <circle cx="6.2" cy="5.8" r="1.1" fill={color} className="eye" opacity="0.9"/>
      <circle cx="9.8" cy="5.8" r="1.1" fill={color} className="eye" opacity="0.9"/>
      <circle cx="6.2" cy="5.8" r="0.4" fill="var(--bg)" opacity="0.6"/>
      <circle cx="9.8" cy="5.8" r="0.4" fill="var(--bg)" opacity="0.6"/>

      {/* Neck */}
      <rect x="6.5" y="8.5" width="3" height="1.2" fill={color} opacity="0.3" rx="0.5"/>

      {/* Body */}
      <rect x="2.5" y="9.5" width="11" height="6.5" rx="1.8" 
        fill="var(--bg-2)" stroke={color} strokeWidth="0.6"/>
      
      {/* Core light */}
      <circle cx="8" cy="12.5" r="1.5" fill={color} opacity="0.12"/>
      <circle cx="8" cy="12.5" r="0.7" fill={color} opacity="0.5"/>

      {/* Arms */}
      <rect x="0.5" y="10.5" width="2" height="4.5" rx="1" 
        fill="var(--bg-2)" stroke={color} strokeWidth="0.5"/>
      <rect x="13.5" y="10.5" width="2" height="4.5" rx="1" 
        fill="var(--bg-2)" stroke={color} strokeWidth="0.5"/>

      {/* Legs */}
      <rect className="leg-l" x="3.5" y="16" width="3.5" height="4.5" rx="1.3" 
        fill="var(--bg-2)" stroke={color} strokeWidth="0.5"/>
      <rect className="leg-r" x="9" y="16" width="3.5" height="4.5" rx="1.3" 
        fill="var(--bg-2)" stroke={color} strokeWidth="0.5"/>

      {/* Feet */}
      <rect x="2.8" y="19.5" width="4.8" height="2" rx="1" fill={color} opacity="0.5"/>
      <rect x="8.4" y="19.5" width="4.8" height="2" rx="1" fill={color} opacity="0.5"/>
    </svg>
  );
}

export default function AgentSprite({ color, pathCSS, duration, delay, banner }) {
  const bannerText = useMemo(() => {
    return banner || BANNER_MESSAGES[Math.floor(Math.random() * BANNER_MESSAGES.length)];
  }, [banner]);

  const style = {
    '--agent-path': pathCSS,
    '--agent-color': color,
    '--traverse-dur': `${duration}s`,
    '--traverse-delay': `${delay}s`,
  };

  // Exit particles positions
  const particles = useMemo(() => [
    { '--px': '-8px',  '--py': '-12px' },
    { '--px': '6px',   '--py': '-10px' },
    { '--px': '-4px',  '--py': '-16px' },
    { '--px': '10px',  '--py': '-6px' },
  ], []);

  return (
    <>
      {/* Glow trail following the agent */}
      <div className="agent-glow-trail" style={style} />

      {/* Spawn flash at start */}
      <div className="agent-spawn-flash" style={style} />

      {/* The agent sprite itself */}
      <div className="agent-motion-sprite" style={style}>
        <div className="agent-sprite-inner">
          {/* Banner — visible near the end of the path */}
          <div className="agent-banner" style={style}>
            {bannerText}
          </div>

          <MiniRobotSVG color={color} />
        </div>
      </div>

      {/* Exit particles at path end */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="exit-particle"
          style={{
            ...style,
            ...p,
            // Position at end of path
            offsetPath: pathCSS,
            offsetDistance: '100%',
            offsetRotate: '0deg',
          }}
        />
      ))}
    </>
  );
}

export { BANNER_MESSAGES };
