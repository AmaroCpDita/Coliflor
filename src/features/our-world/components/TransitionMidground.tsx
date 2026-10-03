import React from 'react';

interface TransitionMidgroundProps {
  biomeId: string;
  lightIntensity: number;
  cameraOffsetX: number;
}

export default function TransitionMidground({ biomeId, lightIntensity, cameraOffsetX }: TransitionMidgroundProps) {
  if (biomeId !== 'forest' && biomeId !== 'garden') return null;

  const filterStyle = `brightness(${0.5 + lightIntensity * 0.5})`;

  // Calculate parallax offsets to move opposite to the camera's movement
  // The camera moves with cameraOffsetX.
  // To make an object move SLOWER (further away), we move it slightly opposite to the camera movement.
  const mistParallax = -cameraOffsetX * 0.7; // Mist is very far (Layer 1)
  const midgroundParallax = -cameraOffsetX * 0.4; // Midground is closer (Layer 2)

  return (
    <>
      {/* LAYER 1: MIST / HAZE */}
      <div
        className="world-scene__mist"
        style={{
          position: 'absolute',
          bottom: '75%', // Behind midground, blending into mountains
          left: '-20%',
          width: '140%',
          height: '45%',
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: 'url(/assets/world/mist_soft.png)',
          backgroundSize: '100% 100%', // Stretch to fill the height
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom center',
          filter: filterStyle,
          opacity: 0.7,
          mixBlendMode: 'screen',
          transform: `translateX(${mistParallax}px)`,
        }}
      />

      {/* LAYER 2: MIDGROUND FOREST */}
      <div
        className="world-scene__midground-transition"
        style={{
          position: 'absolute',
          bottom: '78%', // Sit exactly on the terrain's top edge (80%) with a slight overlap
          left: '-15%',
          width: '130%',
          height: '35%',
          zIndex: 2, // Above terrain (1), below world objects (10+)
          pointerEvents: 'none',
          backgroundImage: 'url(/assets/world/midground_forest.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom center',
          filter: filterStyle,
          transform: `translateX(${midgroundParallax}px)`,
        }}
      />
    </>
  );
}
