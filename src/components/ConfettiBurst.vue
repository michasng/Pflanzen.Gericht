<script setup lang="ts">
const CONFETTI_COLORS = ['#16a34a', '#84cc16', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7']
const PIECE_COUNT = 90
const MAX_DELAY_SECONDS = 0.4
const MIN_DURATION_SECONDS = 1.8
const DURATION_SPREAD_SECONDS = 1.4
const MAX_SPREAD_VIEWPORT_WIDTH = 60
const MIN_RISE_VIEWPORT_HEIGHT = 25
const RISE_SPREAD_VIEWPORT_HEIGHT = 40
const FALL_VIEWPORT_HEIGHT = 110
const MAX_SPIN_DEGREES = 900

interface ConfettiPiece {
  style: Record<string, string>
}

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min)

const createPiece = (index: number): ConfettiPiece => {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? ''
  const durationSeconds = MIN_DURATION_SECONDS + Math.random() * DURATION_SPREAD_SECONDS
  return {
    style: {
      backgroundColor: color,
      '--spread': `${randomBetween(-MAX_SPREAD_VIEWPORT_WIDTH, MAX_SPREAD_VIEWPORT_WIDTH)}vw`,
      '--rise': `${-(MIN_RISE_VIEWPORT_HEIGHT + Math.random() * RISE_SPREAD_VIEWPORT_HEIGHT)}vh`,
      '--fall': `${FALL_VIEWPORT_HEIGHT}vh`,
      '--spin': `${randomBetween(-MAX_SPIN_DEGREES, MAX_SPIN_DEGREES)}deg`,
      animationDuration: `${durationSeconds}s`,
      animationDelay: `${Math.random() * MAX_DELAY_SECONDS}s`,
    },
  }
}

const pieces = Array.from({ length: PIECE_COUNT }, (_, index) => createPiece(index))
</script>

<template>
  <div class="confetti" aria-hidden="true">
    <span
      v-for="(piece, index) in pieces"
      :key="index"
      class="confetti__piece"
      :style="piece.style"
    />
  </div>
</template>

<style scoped>
.confetti {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  pointer-events: none;
}

.confetti__piece {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0.6rem;
  height: 1rem;
  border-radius: 2px;
  opacity: 0;
  animation: confetti-launch ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .confetti {
    display: none;
  }
}

@keyframes confetti-launch {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0);
    animation-timing-function: cubic-bezier(0.1, 0.8, 0.3, 1);
  }
  40% {
    opacity: 1;
    transform: translate(calc(var(--spread) * 0.7), var(--rise)) rotate(calc(var(--spin) * 0.4));
    animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.6);
  }
  100% {
    opacity: 0;
    transform: translate(var(--spread), var(--fall)) rotate(var(--spin));
  }
}
</style>
