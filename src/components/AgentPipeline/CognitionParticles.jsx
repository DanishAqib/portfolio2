"use client";

import React, { useMemo } from 'react';

/**
 * CognitionParticles — Tiny "processing sparks" that animate in the
 * head region to symbolize AI cognition when agents pass behind the head.
 * 
 * These particles run on a continuous loop, always visible as ambient 
 * activity. They're positioned at the head area of the portrait.
 */

export default function CognitionParticles() {
  const sparks = useMemo(() => {
    const items = [];
    for (let i = 0; i < 8; i++) {
      const isWhite = i % 3 === 0;
      items.push({
        id: i,
        className: isWhite ? 'cognition-spark cognition-spark--white' : 'cognition-spark',
        style: {
          '--spark-size': `${2 + Math.random() * 2.5}px`,
          '--spark-dur': `${2.5 + Math.random() * 2}s`,
          '--spark-delay': `${i * 0.6 + Math.random() * 0.5}s`,
          '--dx': `${(Math.random() - 0.5) * 30}px`,
          '--dy': `${(Math.random() - 0.5) * 24}px`,
          left: `${44 + Math.random() * 16}%`,
          top: `${12 + Math.random() * 18}%`,
        },
      });
    }
    return items;
  }, []);

  return (
    <div className="cognition-particles-container" aria-hidden="true">
      {sparks.map(spark => (
        <div
          key={spark.id}
          className={spark.className}
          style={spark.style}
        />
      ))}
    </div>
  );
}
