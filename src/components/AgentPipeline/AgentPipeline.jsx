"use client";

import React, { useMemo } from 'react';
import { AGENT_PATH_D } from './MotionPath';
import CognitionParticles from './CognitionParticles';
import './agentPipeline.css';

/**
 * AgentPipeline — Main orchestrator for the "agents walking across body" animation.
 * 
 * Uses SVG overlay with matching viewBox so path coordinates align perfectly
 * with the portrait image regardless of container size.
 * 
 * Architecture:
 *   1. Base portrait image (z-index: 1) — rendered by parent
 *   2. SVG overlay with agents on motion path (z-index: 2)
 *   3. Head mask — clipped duplicate image (z-index: 3) — agents pass behind head
 *   4. Cognition particles in head region (z-index: 4)
 *   5. Portrait caption overlay (z-index: 5) — rendered by parent
 */

const BANNER_MESSAGES = [
  "Task Done",
  "API Shipped",
  "Deploy Complete",
  "Automation Live",
  "Bug Fixed",
  "Pipeline Clear",
];

// Agent configurations — staggered for continuous pipeline feel
const AGENT_CONFIGS = [
  { id: 0, color: '#4ade80', duration: 13, delay: 0, banner: 'Task Done' },
  { id: 1, color: '#e67e22', duration: 15, delay: 5, banner: 'API Shipped' },
  { id: 2, color: '#9b59b6', duration: 14, delay: 9.5, banner: 'Deploy Complete' },
];

// Head mask clip polygon (percentages) for the head/hair region
const HEAD_CLIP = `polygon(
  38% 0%, 42% 0%, 48% 1%, 55% 0%, 62% 0%,
  68% 2%, 74% 5%, 78% 8%, 82% 5%, 86% 3%,
  90% 5%, 92% 8%, 91% 12%, 88% 15%, 84% 14%,
  80% 13%, 76% 14%, 73% 16%, 70% 18%, 68% 21%,
  66% 24%, 64% 27%, 62% 30%, 60% 32%, 57% 34%,
  54% 35%, 51% 36%, 48% 36%, 45% 35%, 42% 33%,
  40% 31%, 38% 28%, 37% 25%, 36% 22%, 36% 18%,
  36% 14%, 37% 10%, 37% 6%, 38% 3%
)`;

// Mini robot SVG inline for use inside the SVG overlay
function AgentGroup({ color, banner, duration, delay, id }) {
  const bannerText = banner;
  const dur = `${duration}s`;
  const beginTime = `${delay}s`;

  return (
    <g>
      {/* Glow trail */}
      <circle r="8" fill={color} opacity="0" filter="url(#agentGlow)">
        <animateMotion
          dur={dur}
          begin={beginTime}
          repeatCount="indefinite"
          rotate="auto"
          fill="freeze"
        >
          <mpath href="#agentPath" />
        </animateMotion>
        <animate
          attributeName="opacity"
          values="0;0.3;0.3;0.3;0"
          keyTimes="0;0.03;0.88;0.93;1"
          dur={dur}
          begin={beginTime}
          repeatCount="indefinite"
        />
      </circle>

      {/* Spawn flash */}
      <circle r="16" fill={color} opacity="0" filter="url(#agentGlow)">
        <animateMotion
          dur={dur}
          begin={beginTime}
          repeatCount="indefinite"
          fill="freeze"
        >
          <mpath href="#agentPath" />
        </animateMotion>
        <animate
          attributeName="opacity"
          values="0;0.7;0;0;0"
          keyTimes="0;0.01;0.04;0.5;1"
          dur={dur}
          begin={beginTime}
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values="8;20;24;24"
          keyTimes="0;0.01;0.04;1"
          dur={dur}
          begin={beginTime}
          repeatCount="indefinite"
        />
      </circle>

      {/* Agent body */}
      <g>
        <animateMotion
          dur={dur}
          begin={beginTime}
          repeatCount="indefinite"
          fill="freeze"
        >
          <mpath href="#agentPath" />
        </animateMotion>

        {/* Visibility control */}
        <animate
          attributeName="opacity"
          values="0;1;1;1;0"
          keyTimes="0;0.02;0.90;0.95;1"
          dur={dur}
          begin={beginTime}
          repeatCount="indefinite"
        />

        {/* Walking bob */}
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 0,-3; 0,0; 0,-3; 0,0"
          dur="0.45s"
          repeatCount="indefinite"
          additive="sum"
        />

        {/* Robot body - offset to center */}
        <g transform="translate(-12, -28)">
          {/* Antenna */}
          <line x1="12" y1="3.5" x2="12" y2="1" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <circle cx="12" cy="1" r="1.2" fill={color}>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>

          {/* Head */}
          <rect x="5" y="4" width="14" height="8" rx="2.5" fill="#1a2332" stroke={color} strokeWidth="0.8" />

          {/* Eyes */}
          <circle cx="9" cy="8" r="1.6" fill={color} opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="15" cy="8" r="1.6" fill={color} opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="9" cy="8" r="0.6" fill="#0d1117" opacity="0.5" />
          <circle cx="15" cy="8" r="0.6" fill="#0d1117" opacity="0.5" />

          {/* Neck */}
          <rect x="9" y="12" width="6" height="1.5" fill={color} opacity="0.25" rx="0.7" />

          {/* Body */}
          <rect x="3.5" y="13.5" width="17" height="9.5" rx="2.5" fill="#1a2332" stroke={color} strokeWidth="0.8" />

          {/* Core light */}
          <circle cx="12" cy="18" r="2" fill={color} opacity="0.12" />
          <circle cx="12" cy="18" r="1" fill={color} opacity="0.45" />

          {/* Arms */}
          <rect x="0.5" y="15" width="3" height="6.5" rx="1.5" fill="#1a2332" stroke={color} strokeWidth="0.6" />
          <rect x="20.5" y="15" width="3" height="6.5" rx="1.5" fill="#1a2332" stroke={color} strokeWidth="0.6" />

          {/* Left Leg */}
          <rect x="5" y="23" width="5" height="6.5" rx="2" fill="#1a2332" stroke={color} strokeWidth="0.6">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-2; 0,0"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </rect>
          {/* Right Leg */}
          <rect x="14" y="23" width="5" height="6.5" rx="2" fill="#1a2332" stroke={color} strokeWidth="0.6">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,-2; 0,0; 0,-2"
              dur="0.4s"
              repeatCount="indefinite"
            />
          </rect>

          {/* Feet */}
          <rect x="3.5" y="28" width="7.5" height="2.5" rx="1.2" fill={color} opacity="0.45" />
          <rect x="13" y="28" width="7.5" height="2.5" rx="1.2" fill={color} opacity="0.45" />
        </g>

        {/* Banner — visible near end of path */}
        <g opacity="0" transform="translate(-30, -42)">
          <animate
            attributeName="opacity"
            values="0;0;0;1;1;0.5;0"
            keyTimes="0;0.78;0.82;0.85;0.92;0.96;1"
            dur={dur}
            begin={beginTime}
            repeatCount="indefinite"
          />
          <rect x="0" y="0" width="60" height="14" rx="3"
            fill="#0d1117" stroke={color} strokeWidth="0.6" opacity="0.9" />
          <text x="30" y="10" textAnchor="middle"
            fill={color} fontSize="6.5" fontFamily="monospace" letterSpacing="0.5">
            {bannerText}
          </text>
        </g>
      </g>

      {/* Exit particles */}
      {[0, 1, 2, 3].map(i => {
        const angles = [30, 150, 75, 120];
        const dists = [18, 22, 15, 25];
        const angle = (angles[i] * Math.PI) / 180;
        const dx = Math.cos(angle) * dists[i];
        const dy = -Math.sin(angle) * dists[i];
        return (
          <circle key={i} r="2.5" fill={color} opacity="0">
            <animateMotion
              dur={dur}
              begin={beginTime}
              repeatCount="indefinite"
              fill="freeze"
            >
              <mpath href="#agentPath" />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;0;0;0.8;0"
              keyTimes="0;0.94;0.95;0.96;1"
              dur={dur}
              begin={beginTime}
              repeatCount="indefinite"
            />
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0,0; 0,0; 0,0; ${dx},${dy}`}
              keyTimes="0;0.95;0.96;1"
              dur={dur}
              begin={beginTime}
              repeatCount="indefinite"
              additive="sum"
            />
          </circle>
        );
      })}
    </g>
  );
}

export default function AgentPipeline() {
  const agents = useMemo(() => AGENT_CONFIGS, []);

  return (
    <>
      {/* SVG overlay — matches portrait image dimensions via viewBox */}
      <svg
        className="agent-pipeline-svg"
        viewBox="0 0 1024 1024"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          {/* The motion path agents follow */}
          <path id="agentPath" d={AGENT_PATH_D} />

          {/* Glow filter for agent trail effects */}
          <filter id="agentGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Debug: uncomment to see the path */}
        {/* <use href="#agentPath" fill="none" stroke="lime" strokeWidth="2" strokeDasharray="8 4" opacity="0.3" /> */}

        {/* Agent sprites */}
        {agents.map(agent => (
          <AgentGroup key={agent.id} {...agent} />
        ))}
      </svg>

      {/* Head mask — clipped duplicate of portrait at z-index: 3 */}
      <div
        className="head-mask-overlay"
        style={{ clipPath: HEAD_CLIP }}
        aria-hidden="true"
      >
        <img
          src="/images/portrait-vector-nobg.png"
          alt=""
          draggable="false"
        />
      </div>

      {/* Cognition particles */}
      <CognitionParticles />
    </>
  );
}
