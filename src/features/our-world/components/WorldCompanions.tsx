import React, { useEffect, useRef, useState } from 'react';
import WorldCompanion from './AnimatedWorldCompanion';
import type { WorldCompanionDef } from '../data/companions';
import {
  COMPANION_HOME,
  COMPANION_ROUTINES,
  pickNextCompanionRoutine,
} from '../engine/companionMotion';
import type { TimeOfDay } from '../types';
interface Props {
  companions: WorldCompanionDef[];
  timeOfDay: TimeOfDay;
  lightIntensity: number;
  isEditing: boolean;
  onInteract: (pet: WorldCompanionDef, x: number, y: number, action: string) => void;
}
export default function WorldCompanions({
  companions,
  timeOfDay,
  lightIntensity,
  isEditing,
  onInteract,
}: Props) {
  const [routine, setRoutine] = useState(0);
  const [step, setStep] = useState(0);
  const [nightSettled, setNightSettled] = useState(timeOfDay === 'night');
  const [interaction, setInteraction] = useState<{ actorId: string; serial: number } | null>(null);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const resting = timeOfDay === 'night';
  const wasResting = useRef(resting);
  const current = COMPANION_ROUTINES[routine][step];
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateVisibility = () => setHidden(document.hidden);
    const updateMotion = () => setReducedMotion(media.matches);
    updateVisibility();
    updateMotion();
    document.addEventListener('visibilitychange', updateVisibility);
    media.addEventListener('change', updateMotion);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      media.removeEventListener('change', updateMotion);
    };
  }, []);
  useEffect(() => {
    const enteredNight = !wasResting.current && resting;
    wasResting.current = resting;
    if (!resting) {
      setRoutine(0);
      setStep(0);
      setNightSettled(true);
      return;
    }
    if (reducedMotion) {
      setNightSettled(true);
      return;
    }
    if (!enteredNight) return;
    setNightSettled(false);
    const timer = window.setTimeout(() => {
      setNightSettled(true);
      setRoutine(0);
      setStep(0);
    }, 2900);
    return () => window.clearTimeout(timer);
  }, [resting, reducedMotion]);
  useEffect(() => {
    if (!companions.length || resting || isEditing || hidden || reducedMotion) return;
    const timer = window.setTimeout(() => {
      if (step + 1 < COMPANION_ROUTINES[routine].length) {
        setStep(step + 1);
      } else {
        setRoutine(pickNextCompanionRoutine(routine));
        setStep(0);
      }
    }, current.duration);
    return () => window.clearTimeout(timer);
  }, [
    companions.length,
    resting,
    isEditing,
    hidden,
    reducedMotion,
    current.duration,
    routine,
    step,
  ]);

  const handleInteract = (pet: WorldCompanionDef, x: number, y: number, action: string) => {
    setInteraction((previous) => ({ actorId: pet.id, serial: (previous?.serial || 0) + 1 }));
    onInteract(pet, x, y, action);
  };

  return (
    <>
      {companions.map((pet) => {
        const key = pet.id === 'max' ? 'max' : 'abi';
        const activeCue = current[key];
        const homeCue = COMPANION_HOME[key];
        const cue = resting
          ? {
              ...homeCue,
              pose: nightSettled || reducedMotion ? ('rest' as const) : ('walk' as const),
              duration: nightSettled || reducedMotion ? 0 : 2600,
              facingRight:
                activeCue.x === homeCue.x ? homeCue.facingRight : activeCue.x < homeCue.x,
            }
          : activeCue;
        return (
          <WorldCompanion
            key={pet.id}
            def={pet}
            cue={{
              ...cue,
              pose: !resting && (isEditing || hidden || reducedMotion) ? 'idle' : cue.pose,
            }}
            paused={isEditing || hidden || reducedMotion}
            friendReaction={interaction?.actorId !== pet.id ? interaction?.serial : undefined}
            lightIntensity={lightIntensity}
            isEditing={isEditing}
            onInteract={handleInteract}
          />
        );
      })}
    </>
  );
}
