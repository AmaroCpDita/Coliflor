// ============================================================
// Nuestro Mundo — Main Page Component
// ============================================================

import React from 'react';
import { useWorld } from './hooks/useWorld';
import WorldScene from './components/WorldScene';
import WorldWelcome from './components/WorldWelcome';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import './our-world.css';

export default function OurWorldPage() {
  const { couple } = useAuth();
  const {
    welcomePending, welcome, refreshWelcome, acknowledgeWelcome,
    worldState, inventory, placedObjects, achievements, dayNight, xpBoostActive,
    isLoading, error, pendingReward, rewardLevels, claimingRewards, rewardsError, catalogUnavailable, retryRewards,
    claimLevelRewards, placeItem, removeItem, moveItem, resizeItem, flipItem, grantInteractionXP, dismissReward,
    forestProgress, forestUnavailable, forestLoading, refreshForest, claimForestGoal, completeForest, switchBiome,
  } = useWorld();

  if (!couple) {
    return (
      <div className="page page--centered">
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
          <div className="empty-state__title">Nuestro Mundo</div>
          <div className="empty-state__text">
            Necesitas estar vinculado con tu pareja para acceder al mundo compartido.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Cargando tu mundo..." />;
  }

  if (error) {
    return (
      <div className="page page--centered">
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
          <div className="empty-state__title">Error al cargar</div>
          <div className="empty-state__text">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <WorldScene
      key={`${worldState?.onboarding_epoch}:${welcomePending}`}
      isWelcomePreview={welcomePending}
      worldState={worldState}
      inventory={inventory}
      placedObjects={placedObjects}
      achievements={achievements}
      dayNight={dayNight}
      xpBoostActive={xpBoostActive}
      pendingReward={pendingReward}
      rewardLevels={rewardLevels}
      claimingRewards={claimingRewards}
      onClaimLevelRewards={claimLevelRewards}
      forestProgress={forestProgress}
      forestUnavailable={forestUnavailable}
      forestLoading={forestLoading}
      onRetryForest={refreshForest}
      onClaimForestGoal={claimForestGoal}
      onCompleteForest={completeForest}
      onSwitchBiome={switchBiome}
      onPlaceItem={placeItem}
      onRemoveItem={removeItem}
      onMoveItem={moveItem}
      onFlipItem={flipItem}
      onResizeItem={resizeItem}
      onInteractXP={grantInteractionXP}
      onDismissReward={dismissReward}
      rewardsError={rewardsError}
      catalogUnavailable={catalogUnavailable}
      onRetryRewards={retryRewards}
    />
    {welcomePending && <WorldWelcome checking={!welcome} failed={welcome?.status === 'error'} onRetry={refreshWelcome} onEnter={acknowledgeWelcome} />}
    </>
  );
}
