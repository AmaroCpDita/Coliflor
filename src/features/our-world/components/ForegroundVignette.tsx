import React from 'react';

interface ForegroundVignetteProps {
  biomeId: string;
  lightIntensity: number;
}

export default function ForegroundVignette({ biomeId, lightIntensity }: ForegroundVignetteProps) {
  if (biomeId !== 'forest' && biomeId !== 'garden') return null;

  // Screen foreground / vignette: Close to camera. No blur for now per user request.
  const filterStyle = `brightness(${0.4 + lightIntensity * 0.6})`;

  return (
    <div
      className="world-scene__foreground-vignette"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 900, // Above everything except UI
        overflow: 'hidden',
      }}
    >
      {/* Top Left Corner */}
      <div
        style={{
          position: 'absolute',
          top: '-2%',
          left: '-2%',
          width: '35%',
          height: '40%',
          backgroundImage: 'url(/assets/world/foreground_top_left.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top left',
          filter: filterStyle,
          opacity: 0.9,
        }}
      />

      {/* Top Right Corner */}
      <div
        style={{
          position: 'absolute',
          top: '-2%',
          right: '-2%',
          width: '40%',
          height: '40%',
          backgroundImage: 'url(/assets/world/foreground_top_right.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top right',
          filter: filterStyle,
          opacity: 0.9,
        }}
      />

      {/* Center Left Edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-2%',
          width: '25%',
          height: '100%',
          backgroundImage: 'url(/assets/world/foreground_left.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center left',
          filter: filterStyle,
          opacity: 0.9,
        }}
      />

      {/* Center Right Edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '-2%',
          width: '25%',
          height: '100%',
          backgroundImage: 'url(/assets/world/foreground_right.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center right',
          filter: filterStyle,
          opacity: 0.9,
        }}
      />

      {/* Bottom Left Corner */}
      <div
        style={{
          position: 'absolute',
          bottom: '-2%',
          left: '-2%',
          width: '55%',
          height: '45%',
          backgroundImage: 'url(/assets/world/foreground_bottom_izq.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom left',
          filter: filterStyle,
          opacity: 0.95,
        }}
      />

      {/* Bottom Right Corner */}
      <div
        style={{
          position: 'absolute',
          bottom: '-2%',
          right: '-2%',
          width: '55%',
          height: '45%',
          backgroundImage: 'url(/assets/world/foreground_bottom_der.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom right',
          filter: filterStyle,
          opacity: 0.95,
        }}
      />
    </div>
  );
}
