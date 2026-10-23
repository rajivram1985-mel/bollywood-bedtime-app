import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getData, getJSON, setJSON, setData, STORAGE_KEYS } from "../utils/storage";
import { AGE_KEYS, DEFAULT_AGE } from "../constants/ageRanges";
import { LANGUAGE_KEYS, DEFAULT_LANGUAGE } from "../constants/languages";

// Family profiles (kids), bedtime preferences and per-child listening history.
// Everything is local to the device — no account needed.

const DEFAULT_PREFS = { storiesPerNight: 1 };
const HISTORY_LIMIT = 50;

const ProfileContext = createContext(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function loadInitialState() {
  let kids = await getJSON(STORAGE_KEYS.KIDS, null);

  // Migrate pre-profiles installs: a single stored age range becomes one child.
  if (!kids) {
    const [done, legacyAge] = await Promise.all([
      getData(STORAGE_KEYS.ONBOARDING_DONE),
      getData(STORAGE_KEYS.AGE_RANGE),
    ]);
    kids = done ? [{ id: newId(), name: "", ageRange: AGE_KEYS.includes(legacyAge) ? legacyAge : DEFAULT_AGE }] : [];
    if (kids.length) await setJSON(STORAGE_KEYS.KIDS, kids);
  }
  // Profiles saved before story languages existed default to English.
  kids = kids.map((k) => ({ ...k, language: LANGUAGE_KEYS.includes(k.language) ? k.language : DEFAULT_LANGUAGE }));

  const [activeId, prefs, history] = await Promise.all([
    getData(STORAGE_KEYS.ACTIVE_KID),
    getJSON(STORAGE_KEYS.PREFS, {}),
    getJSON(STORAGE_KEYS.PLAY_HISTORY, []),
  ]);

  return {
    kids,
    activeId: kids.some((k) => k.id === activeId) ? activeId : kids[0]?.id ?? null,
    prefs: { ...DEFAULT_PREFS, ...prefs },
    history,
  };
}

export function ProfileProvider({ children }) {
  const [state, setState] = useState(null); // null = loading

  useEffect(() => {
    loadInitialState().then(setState);
  }, []);

  const saveKids = useCallback((updater) => {
    setState((prev) => {
      const kids = updater(prev.kids);
      setJSON(STORAGE_KEYS.KIDS, kids);
      const activeId = kids.some((k) => k.id === prev.activeId) ? prev.activeId : kids[0]?.id ?? null;
      if (activeId !== prev.activeId) setData(STORAGE_KEYS.ACTIVE_KID, activeId ?? "");
      return { ...prev, kids, activeId };
    });
  }, []);

  const addKid = useCallback(
    ({ name = "", ageRange = DEFAULT_AGE, language = DEFAULT_LANGUAGE } = {}) => {
      const kid = { id: newId(), name: name.trim(), ageRange, language };
      saveKids((kids) => [...kids, kid]);
      return kid.id;
    },
    [saveKids]
  );

  const updateKid = useCallback(
    (id, patch) => saveKids((kids) => kids.map((k) => (k.id === id ? { ...k, ...patch } : k))),
    [saveKids]
  );

  const removeKid = useCallback(
    (id) => saveKids((kids) => (kids.length > 1 ? kids.filter((k) => k.id !== id) : kids)),
    [saveKids]
  );

  const setActiveKid = useCallback((id) => {
    setState((prev) => ({ ...prev, activeId: id }));
    setData(STORAGE_KEYS.ACTIVE_KID, id);
  }, []);

  const setPref = useCallback((key, value) => {
    setState((prev) => {
      const prefs = { ...prev.prefs, [key]: value };
      setJSON(STORAGE_KEYS.PREFS, prefs);
      return { ...prev, prefs };
    });
  }, []);

  const recordPlay = useCallback((storyId) => {
    setState((prev) => {
      const entry = { storyId, kidId: prev.activeId, at: Date.now() };
      const history = [entry, ...prev.history].slice(0, HISTORY_LIMIT);
      setJSON(STORAGE_KEYS.PLAY_HISTORY, history);
      return { ...prev, history };
    });
  }, []);

  const value = useMemo(() => {
    if (!state) return { loaded: false };
    const activeKid = state.kids.find((k) => k.id === state.activeId) ?? null;
    const recentIds = state.history
      .filter((h) => h.kidId === state.activeId)
      .slice(0, 3)
      .map((h) => h.storyId);
    return {
      loaded: true,
      kids: state.kids,
      activeKid,
      prefs: state.prefs,
      recentIds,
      addKid,
      updateKid,
      removeKid,
      setActiveKid,
      setPref,
      recordPlay,
    };
  }, [state, addKid, updateKid, removeKid, setActiveKid, setPref, recordPlay]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfiles() {
  return useContext(ProfileContext);
}
