import React, { useEffect, useRef, useState } from 'react';
import WorldCompanion from './AnimatedWorldCompanion';
import type { WorldCompanionDef } from '../data/companions';
import {
  COMPANION_HOME,
  COMPANION_ROUTINES,
  pickNextCompanionRoutine,
} from '../engine/companionMotion';
import type { CompanionMoment } from '../engine/companionMotion';
import { createCompanionJourney } from '../engine/companionNavigation';
import type { PlacedObject } from '../types';
import type { TimeOfDay } from '../types';
interface Props {
  companions: WorldCompanionDef[];
  placedObjects: PlacedObject[];
  biomeId: string;
  timeOfDay: TimeOfDay;
  lightIntensity: number;
  isEditing: boolean;
  onInteract: (pet: WorldCompanionDef, x: number, y: number, action: string) => void;
}
export default function WorldCompanions({
  companions,
  placedObjects,
  biomeId,
  timeOfDay,
  lightIntensity,
  isEditing,
  onInteract,
}: Props) {
  const [routine, setRoutine] = useState(0);
  const [moments, setMoments] = useState<CompanionMoment[]>(
    () => createCompanionJourney(placedObjects, biomeId, 0) || COMPANION_ROUTINES[0],
  );
  const [visitIndex, setVisitIndex] = useState(1);
  const [activeVisitIndex, setActiveVisitIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [nightSettled, setNightSettled] = useState(timeOfDay === 'night');
  const [interaction, setInteraction] = useState<{ actorId: string; serial: number } | null>(null);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const resting = timeOfDay === 'night';
  const wasResting = useRef(resting);
  const objectSignature = placedObjects
    .map(
      (object) =>
        `${object.id}:${object.item_id}:${object.position_x}:${object.position_y}:${object.scale}`,
    )
    .join('|');
  const previousObjectSignature = useRef(objectSignature);
  const current = moments[step] || COMPANION_HOME;
  useEffect(() => {
    if (previousObjectSignature.current === objectSignature) return;
    if (resting || isEditing || hidden || reducedMotion) return;
    previousObjectSignature.current = objectSignature;
    const rerouted = createCompanionJourney(placedObjects, biomeId, activeVisitIndex, {
      max: current.max,
      abi: current.abi,
    });
    if (rerouted) {
      setMoments(rerouted);
      setStep(0);
    }
  }, [
    objectSignature,
    placedObjects,
    biomeId,
    activeVisitIndex,
    current,
    resting,
    isEditing,
    hidden,
    reducedMotion,
  ]);
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
    const wasNight = wasResting.current;
    const enteredNight = !wasNight && resting;
    wasResting.current = resting;
    if (!resting) {
      if (!wasNight) return;
      setRoutine(0);
      setMoments(
        createCompanionJourney(placedObjects, biomeId, visitIndex) || COMPANION_ROUTINES[0],
      );
      setActiveVisitIndex(visitIndex);
      setVisitIndex((index) => index + 1);
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
      if (step + 1 < moments.length) {
        setStep(step + 1);
      } else {
        const nextRoutine = pickNextCompanionRoutine(routine);
        const journey = createCompanionJourney(placedObjects, biomeId, visitIndex);
        setRoutine(nextRoutine);
        setMoments(journey || COMPANION_ROUTINES[nextRoutine]);
        setActiveVisitIndex(visitIndex);
        setVisitIndex((index) => index + 1);
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
    moments,
    placedObjects,
    biomeId,
    visitIndex,
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
