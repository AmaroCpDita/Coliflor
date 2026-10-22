import React, { useEffect, useRef, useState } from 'react';
import WorldCompanion from './AnimatedWorldCompanion';
import type { WorldCompanionDef } from '../data/companions';
import {
  COMPANION_HOME,
  COMPANION_ROUTINES,
  pickNextCompanionRoutine,
} from '../engine/companionMotion';
import type { CompanionCue, CompanionMoment } from '../engine/companionMotion';
import { createCompanionJourney } from '../engine/companionNavigation';
import type { PlacedObject, TimeOfDay } from '../types';

interface Props {
  companions: WorldCompanionDef[];
  placedObjects: PlacedObject[];
  biomeId: string;
  timeOfDay: TimeOfDay;
  lightIntensity: number;
  isEditing: boolean;
  onInteract: (pet: WorldCompanionDef, x: number, y: number, action: string) => void;
}

interface WalkerProps extends Omit<Props, 'companions'> {
  pet: WorldCompanionDef;
  friendReaction?: number;
}

function CompanionWalker({
  pet,
  placedObjects,
  biomeId,
  timeOfDay,
  lightIntensity,
  isEditing,
  friendReaction,
  onInteract,
}: WalkerProps) {
  const dog = pet.id === 'max' ? 'max' : 'abi';
  const initialVisit = 0;
  const initialRoutine = dog === 'max' ? 0 : 1;
  const [routine, setRoutine] = useState(initialRoutine);
  const [moments, setMoments] = useState<CompanionMoment[]>(
    () =>
      createCompanionJourney(placedObjects, biomeId, initialVisit) ||
      COMPANION_ROUTINES[initialRoutine],
  );
  const [visitIndex, setVisitIndex] = useState(initialVisit + 1);
  const [activeVisitIndex, setActiveVisitIndex] = useState(initialVisit);
  const [step, setStep] = useState(0);
  const resting = timeOfDay === 'night';
  const [nightSettled, setNightSettled] = useState(resting);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const wasResting = useRef(resting);
  const objectSignature = placedObjects
    .map(
      (object) =>
        `${object.id}:${object.item_id}:${object.position_x}:${object.position_y}:${object.scale}`,
    )
    .join('|');
  const previousObjectSignature = useRef(objectSignature);
  const current = moments[step] || COMPANION_HOME;
  const activeCue = current[dog];
  const homeCue = COMPANION_HOME[dog];

  useEffect(() => {
    if (previousObjectSignature.current === objectSignature) return;
    if (resting || isEditing || hidden || reducedMotion) return;
    previousObjectSignature.current = objectSignature;
    const rerouted = createCompanionJourney(placedObjects, biomeId, activeVisitIndex, {
      max: dog === 'max' ? activeCue : COMPANION_HOME.max,
      abi: dog === 'abi' ? activeCue : COMPANION_HOME.abi,
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
    activeCue,
    dog,
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
    wasResting.current = resting;
    if (!resting) {
      if (!wasNight) return;
      setRoutine(initialRoutine);
      setMoments(
        createCompanionJourney(placedObjects, biomeId, visitIndex) ||
          COMPANION_ROUTINES[initialRoutine],
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
    if (!wasNight) {
      setNightSettled(false);
      const timer = window.setTimeout(
        () => {
          setNightSettled(true);
          setStep(0);
        },
        dog === 'max' ? 2900 : 3400,
      );
      return () => window.clearTimeout(timer);
    }
  }, [resting, reducedMotion]);

  useEffect(() => {
    if (resting || isEditing || hidden || reducedMotion) return;
    const timer = window.setTimeout(
      () => {
        if (step + 1 < moments.length) {
          setStep(step + 1);
        } else {
          const nextRoutine = pickNextCompanionRoutine(routine);
          setRoutine(nextRoutine);
          setMoments(
            createCompanionJourney(placedObjects, biomeId, visitIndex) ||
              COMPANION_ROUTINES[nextRoutine],
          );
          setActiveVisitIndex(visitIndex);
          setVisitIndex((index) => index + 1);
          setStep(0);
        }
      },
      (activeCue.duration > 0
        ? activeCue.duration + (activeCue.delay || 0) + 320
        : current.duration) + (dog === 'abi' ? 360 : 0),
    );
    return () => window.clearTimeout(timer);
  }, [
    resting,
    isEditing,
    hidden,
    reducedMotion,
    current.duration,
    activeCue,
    moments,
    placedObjects,
    biomeId,
    visitIndex,
    routine,
    step,
    dog,
  ]);

  const cue: CompanionCue = resting
    ? {
        ...homeCue,
        pose: nightSettled || reducedMotion ? 'rest' : 'walk',
        duration: nightSettled || reducedMotion ? 0 : dog === 'max' ? 2600 : 3100,
        facingRight: activeCue.x === homeCue.x ? homeCue.facingRight : activeCue.x < homeCue.x,
      }
    : activeCue;

  return (
    <WorldCompanion
      def={pet}
      cue={{ ...cue, pose: !resting && (isEditing || hidden || reducedMotion) ? 'idle' : cue.pose }}
      paused={isEditing || hidden || reducedMotion}
      friendReaction={friendReaction}
      lightIntensity={lightIntensity}
      isEditing={isEditing}
      onInteract={onInteract}
    />
  );
}

export default function WorldCompanions({ companions, onInteract, ...props }: Props) {
  const [interaction, setInteraction] = useState<{ actorId: string; serial: number } | null>(null);
  const handleInteract = (pet: WorldCompanionDef, x: number, y: number, action: string) => {
    setInteraction((previous) => ({ actorId: pet.id, serial: (previous?.serial || 0) + 1 }));
    onInteract(pet, x, y, action);
  };

  return (
    <>
      {companions.map((pet) => (
        <CompanionWalker
          key={pet.id}
          {...props}
          pet={pet}
          friendReaction={interaction?.actorId !== pet.id ? interaction?.serial : undefined}
          onInteract={handleInteract}
        />
      ))}
    </>
  );
}
