<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
}>()
</script>

<template>
  <RouterLink :to="to" class="spotlight-button">
    <span class="spotlight-button__star" aria-hidden="true">★</span>
    <span class="spotlight-button__label"><slot /></span>
    <span class="spotlight-button__star spotlight-button__star--late" aria-hidden="true">★</span>
  </RouterLink>
</template>

<style scoped>
.spotlight-button {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  overflow: hidden;
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: white;
  background: linear-gradient(120deg, #16a34a, #84cc16, #f59e0b, #16a34a);
  background-size: 300% 100%;
  box-shadow: 0 12px 24px rgb(22 163 74 / 0.45);
  transition:
    transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 150ms ease;
  animation:
    spotlight-gradient 6s linear infinite,
    spotlight-pulse 2.4s ease-in-out infinite;
}

.spotlight-button::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgb(255 255 255 / 0.55) 50%,
    transparent 60%
  );
  transform: translateX(-120%);
  animation: spotlight-shine 3s ease-in-out infinite;
  pointer-events: none;
}

.spotlight-button:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 18px 32px rgb(22 163 74 / 0.55);
}

.spotlight-button:active {
  transform: translateY(5px) scale(0.97);
  box-shadow: 0 4px 8px rgb(22 163 74 / 0.4);
}

.spotlight-button:focus-visible {
  outline: 3px solid #f59e0b;
  outline-offset: 3px;
}

.spotlight-button__label {
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
}

.spotlight-button__star {
  display: inline-block;
  animation: spotlight-twinkle 1.6s ease-in-out infinite;
}

.spotlight-button__star--late {
  animation-delay: 0.8s;
}

.spotlight-button:hover .spotlight-button__star {
  animation: spotlight-spin 0.6s ease-in-out infinite;
}

.spotlight-button:active .spotlight-button__star {
  transform: scale(1.8) rotate(72deg);
  animation: none;
}

@keyframes spotlight-gradient {
  to {
    background-position: 300% 0;
  }
}

@keyframes spotlight-pulse {
  50% {
    filter: brightness(1.1) saturate(1.2);
  }
}

@keyframes spotlight-shine {
  0%,
  60% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}

@keyframes spotlight-twinkle {
  50% {
    transform: scale(1.35) rotate(20deg);
  }
}

@keyframes spotlight-spin {
  to {
    transform: rotate(360deg) scale(1.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spotlight-button,
  .spotlight-button::after,
  .spotlight-button__star,
  .spotlight-button:hover .spotlight-button__star {
    animation: none;
  }
}
</style>
