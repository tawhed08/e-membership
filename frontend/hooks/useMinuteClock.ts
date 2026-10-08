"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}

function getSnapshot(): number {
  return Math.floor(Date.now() / 60_000);
}

export function useMinuteClock(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0) * 60_000;
}
