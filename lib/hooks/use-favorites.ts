"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "geonseolin_favorites";

interface Favorites {
  jobs: string[];
  workers: string[];
}

function loadFavorites(): Favorites {
  if (typeof window === "undefined") return { jobs: [], workers: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { jobs: [], workers: [] };
  } catch {
    return { jobs: [], workers: [] };
  }
}

function saveFavorites(favs: Favorites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorites>({ jobs: [], workers: [] });

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const toggleJob = useCallback((jobId: string) => {
    setFavorites((prev) => {
      const next = prev.jobs.includes(jobId)
        ? { ...prev, jobs: prev.jobs.filter((id) => id !== jobId) }
        : { ...prev, jobs: [...prev.jobs, jobId] };
      saveFavorites(next);
      return next;
    });
  }, []);

  const toggleWorker = useCallback((workerId: string) => {
    setFavorites((prev) => {
      const next = prev.workers.includes(workerId)
        ? { ...prev, workers: prev.workers.filter((id) => id !== workerId) }
        : { ...prev, workers: [...prev.workers, workerId] };
      saveFavorites(next);
      return next;
    });
  }, []);

  const isJobFavorite = useCallback((jobId: string) => favorites.jobs.includes(jobId), [favorites.jobs]);
  const isWorkerFavorite = useCallback((workerId: string) => favorites.workers.includes(workerId), [favorites.workers]);

  return { favorites, toggleJob, toggleWorker, isJobFavorite, isWorkerFavorite };
}
