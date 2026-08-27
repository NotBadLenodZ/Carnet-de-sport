/* ============================================================
   CARNET DE FONTE — app.js
   App autonome (localStorage), sans dépendance réseau.
   ============================================================ */

const PREFIX = "cdf-";
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/* ---------------------------- helpers ---------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
function fmtDateFR(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtDateLong(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
}
function fmtSecMMSS(sec) {
  if (sec === "" || sec === null || sec === undefined) return "";
  const s = Number(sec);
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}
function parseRepsValue(reps) {
  if (typeof reps === "number") return { num: reps, suffix: "" };
  const m = String(reps).match(/^(\d+)(.*)$/);
  if (m) return { num: parseInt(m[1], 10), suffix: m[2] };
  return { num: null, suffix: String(reps) };
}
function formatReps(num, suffix) {
  return suffix ? `${num}${suffix}` : num;
}
function getMonday(iso) {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function todayDayName() {
  const jsDay = new Date().getDay(); // 0=dimanche
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return DAYS[idx];
}

/* ---------------------------- storage ---------------------------- */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveKey(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    flashSaved();
  } catch (e) {
    flashError();
  }
}

/* ---------------------------- default data ---------------------------- */

const DEFAULT_TYPES = [
  { id: "bas-libre", name: "Bas libre", repMin: 5, repMax: 8, repStep: 1, weightStep: 2.5 },
  { id: "bas-machine", name: "Bas machine", repMin: 8, repMax: 12, repStep: 2, weightStep: 2.5 },
  { id: "haut-libre", name: "Haut libre", repMin: 6, repMax: 10, repStep: 1, weightStep: 1.25 },
  { id: "haut-machine", name: "Haut machine", repMin: 8, repMax: 12, repStep: 2, weightStep: 2 },
];

function mkSet(reps, weight, rest) {
  return { id: uid(), reps, weight, rest };
}
function mkEx({ name, typeId = null, mode = "fixe", alternates = [], sets }) {
  return { id: uid(), name, typeId, mode, alternates, activeAlternateIndex: 0, sets };
}
function mkProgram(name, exercises) {
  return { id: uid(), name, cycleCount: 0, totalValidations: 0, exercises };
}

function buildDefaultPrograms() {
  return [
    mkProgram("Kagami 1", [
      mkEx({ name: "Squat barre", typeId: "bas-libre", sets: [mkSet(5, 70, 180), mkSet(5, 80, 180), mkSet(5, 80, 180), mkSet(5, 80, 180)] }),
      mkEx({ name: "Soulevé de terre", typeId: "bas-libre", sets: [mkSet(5, 70, 180), mkSet(5, 70, 180), mkSet(5, 70, 180), mkSet(5, 70, 180)] }),
      mkEx({ name: "Leg press", typeId: "bas-machine", sets: [mkSet(8, 59, 75), mkSet(8, 59, 75), mkSet(8, 59, 75)] }),
      mkEx({ name: "Leg curl / Leg extension", typeId: "bas-machine", mode: "alterné", alternates: ["Leg curl", "Leg extension"], sets: [mkSet(6, 39, 90), mkSet(6, 39, 90), mkSet(6, 39, 90)] }),
      mkEx({ name: "Élévation mollet", typeId: "bas-machine", sets: [mkSet(15, 60, 90), mkSet(15, 60, 90), mkSet(15, 60, 90), mkSet(15, 60, 90)] }),
    ]),
    mkProgram("Kagami 2", [
      mkEx({ name: "Fente bulgare", typeId: "bas-libre", sets: [mkSet("8/côté", 50, 120), mkSet("8/côté", 50, 120), mkSet("8/côté", 50, 120), mkSet("8/côté", 50, 120)] }),
      mkEx({ name: "Romanian deadlift", typeId: "bas-libre", sets: [mkSet(8, 55, 120), mkSet(8, 55, 120), mkSet(8, 55, 120), mkSet(8, 55, 120)] }),
      mkEx({ name: "Hip thrust", typeId: "bas-machine", sets: [mkSet(10, 32.7, 75), mkSet(10, 32.7, 75), mkSet(10, 32.7, 75), mkSet(10, 32.7, 75)] }),
      mkEx({ name: "Fast squat", typeId: "bas-libre", sets: [mkSet(10, 45, 180), mkSet(10, 45, 180), mkSet(10, 45, 180), mkSet(10, 45, 180)] }),
      mkEx({ name: "Élévation mollet", typeId: "bas-machine", sets: [mkSet(6, 100, 120), mkSet(6, 100, 120), mkSet(6, 100, 120), mkSet(6, 100, 120)] }),
    ]),
    mkProgram("Hinata 1", [
      mkEx({ name: "Fast squat", sets: [mkSet(6, 30, 120), mkSet(6, 30, 120), mkSet(6, 30, 120), mkSet(6, 30, 120)] }),
      mkEx({ name: "Depth jump", sets: [mkSet(5, 0, 180), mkSet(5, 0, 180), mkSet(5, 0, 180), mkSet(5, 0, 180)] }),
      mkEx({ name: "Knee to feet jump", sets: [mkSet(5, 0, 180), mkSet(5, 0, 180), mkSet(5, 0, 180), mkSet(5, 0, 180)] }),
      mkEx({ name: "Drop jump (GCT)", sets: [mkSet(8, 0, 180), mkSet(8, 0, 180), mkSet(8, 0, 180)] }),
      mkEx({ name: "Corde à sauter", sets: [mkSet("1 min", 0, 120)] }),
    ]),
    mkProgram("Hinata 2", [
      mkEx({ name: "Fente sautée", sets: [mkSet("6/côté", 10, 180), mkSet("6/côté", 10, 180), mkSet("6/côté", 10, 180), mkSet("6/côté", 10, 180)] }),
      mkEx({ name: "Saut en longueur", sets: [mkSet(5, 0, 180), mkSet(5, 0, 180), mkSet(5, 0, 180), mkSet(5, 0, 180)] }),
      mkEx({ name: "Bounding", sets: [mkSet("20m", 0, 180), mkSet("20m", 0, 180), mkSet("20m", 0, 180)] }),
      mkEx({ name: "Sprint", sets: [mkSet("20m", 0, 180), mkSet("20m", 0, 180), mkSet("20m", 0, 180), mkSet("20m", 0, 180)] }),
      mkEx({ name: "Corde à sauter", sets: [mkSet("1 min", 0, 120)] }),
    ]),
    mkProgram("Gojo 1", [
      mkEx({ name: "Développé couché", typeId: "haut-libre", sets: [mkSet(6, 45, 120), mkSet(6, 45, 120), mkSet(6, 45, 120)] }),
      mkEx({ name: "Développé couché incliné", typeId: "haut-libre", sets: [mkSet(10, 25, 75), mkSet(10, 25, 75), mkSet(10, 25, 75)] }),
      mkEx({ name: "Développé militaire", typeId: "haut-libre", sets: [mkSet(6, 24, 120), mkSet(6, 24, 120), mkSet(6, 24, 120)] }),
      mkEx({ name: "Kickback haltère", typeId: "haut-libre", sets: [mkSet(8, 9, 75), mkSet(8, 9, 75), mkSet(8, 9, 75)] }),
      mkEx({ name: "Skull crusher", typeId: "haut-libre", sets: [mkSet(8, 15, 75), mkSet(8, 15, 75), mkSet(8, 15, 75)] }),
      mkEx({ name: "Extension avant-bras barre", typeId: "haut-libre", sets: [mkSet(10, 15, 75), mkSet(10, 15, 75), mkSet(10, 15, 75)] }),
    ]),
    mkProgram("Gojo 2", [
      mkEx({ name: "Traction", typeId: "haut-libre", sets: [mkSet(6, 0, 75), mkSet(6, 0, 75), mkSet(6, 0, 75)] }),
      mkEx({ name: "Tirage vertical / horizontal", typeId: "haut-machine", mode: "alterné", alternates: ["Tirage vertical", "Tirage horizontal"], sets: [mkSet(10, 32, 75), mkSet(10, 32, 75), mkSet(10, 32, 75)] }),
      mkEx({ name: "Rowing barre", typeId: "haut-libre", sets: [mkSet(8, 40, 120), mkSet(8, 40, 120), mkSet(8, 40, 120)] }),
      mkEx({ name: "Face pull", typeId: "haut-machine", sets: [mkSet(15, 0, 75), mkSet(15, 0, 75), mkSet(15, 0, 75)] }),
      mkEx({ name: "Biceps curl barre", typeId: "haut-libre", sets: [mkSet(10, 10, 75), mkSet(10, 10, 75), mkSet(10, 10, 75)] }),
      mkEx({ name: "Hammer curl strict", typeId: "haut-libre", sets: [mkSet(10, 6, 75), mkSet(10, 6, 75), mkSet(10, 6, 75)] }),
    ]),
    mkProgram("Mobil 1", [
      mkEx({ name: "Sissy squat", sets: [mkSet(15, 0, 75), mkSet(15, 0, 75), mkSet(15, 0, 75)] }),
      mkEx({ name: "Terminal knee extension (élastique)", sets: [mkSet(20, 0, 75), mkSet(20, 0, 75), mkSet(20, 0, 75)] }),
      mkEx({ name: "Reverse nordic", sets: [mkSet(8, 0, 75), mkSet(8, 0, 75), mkSet(8, 0, 75)] }),
      mkEx({ name: "Side-lying external rotation (poulie)", sets: [mkSet(15, 0, 75), mkSet(15, 0, 75), mkSet(15, 0, 75)] }),
      mkEx({ name: "Superman", sets: [mkSet(15, 2, 75), mkSet(15, 2, 75), mkSet(15, 2, 75)] }),
      mkEx({ name: "Banded pull-apart (élastique)", sets: [mkSet(20, 0, 75), mkSet(20, 0, 75), mkSet(20, 0, 75)] }),
      mkEx({ name: "Étirement ischio assis", sets: [mkSet("45s", 0, 60), mkSet("45s", 0, 60)] }),
      mkEx({ name: "World's greatest stretch", sets: [mkSet(5, 0, 60), mkSet(5, 0, 60), mkSet(5, 0, 60)] }),
    ]),
  ];
}

const INITIAL_VALIDATION_COUNTS = { "Kagami 1": 3, "Kagami 2": 3, "Gojo 1": 3, "Gojo 2": 3 };
function applyInitialValidationCounts(programs) {
  return programs.map((p) => (INITIAL_VALIDATION_COUNTS[p.name] ? { ...p, totalValidations: INITIAL_VALIDATION_COUNTS[p.name] } : p));
}

const DEFAULT_BODY_METRICS = [
  { date: "2026-04-05", weight: 61.1, fat: 11.0, muscle: 50.3, water: 64.7, height: null },
  { date: "2026-04-12", weight: 62.1, fat: 11.4, muscle: 50.1, water: 64.4, height: null },
  { date: "2026-04-19", weight: 60.6, fat: 10.7, muscle: 50.5, water: 65.0, height: null },
  { date: "2026-04-26", weight: 61.2, fat: 10.9, muscle: 50.3, water: 64.8, height: null },
  { date: "2026-05-03", weight: 62.2, fat: 11.7, muscle: 49.9, water: 64.2, height: null },
  { date: "2026-05-10", weight: 62.6, fat: 11.6, muscle: 50.0, water: 64.2, height: null },
  { date: "2026-05-17", weight: 62.2, fat: 11.4, muscle: 50.1, water: 64.4, height: null },
  { date: "2026-05-24", weight: 60.7, fat: 10.9, muscle: 50.4, water: 64.8, height: null },
  { date: "2026-05-31", weight: 60.8, fat: 10.8, muscle: 50.4, water: 64.9, height: null },
  { date: "2026-06-07", weight: 60.6, fat: 10.7, muscle: 50.5, water: 65.0, height: null },
].map((e) => ({ id: uid(), ...e }));

/* ---------------------------- state ---------------------------- */

const state = {
  tab: "seance", // seance | planning | mensuration | objectif | record
  seanceView: "list", // list | detail | types | historique
  activeProgramId: null,
  programs: [],
  exerciseTypes: [],
  schedule: {},
  history: [],
  bodyMetrics: [],
  goals: [],
  records: [],
  ui: {
    creatingProgram: false,
    confirmingDeleteProgramId: null,
    creatingGoal: false,
    newGoalType: "unique",
    confirmingDeleteGoalId: null,
    creatingRecord: false,
    confirmingDeleteRecordId: null,
    saveStatus: "idle", // idle | saved | error
  },
};

function loadState() {
  const storedPrograms = loadJSON("programs", null);
  const firstLoad = storedPrograms === null;
  state.programs = storedPrograms || applyInitialValidationCounts(buildDefaultPrograms());
  state.exerciseTypes = loadJSON("exercise-types", null) || DEFAULT_TYPES;
  state.schedule = loadJSON("schedule", null) || {};
  state.history = loadJSON("history", null) || [];
  const storedBody = loadJSON("body-metrics", null);
  state.bodyMetrics = storedBody || DEFAULT_BODY_METRICS;
  state.goals = loadJSON("goals", null) || [];
  state.records = loadJSON("records", null) || [];
  state.activeProgramId = state.programs[0] ? state.programs[0].id : null;
  if (firstLoad) saveKeySilent("programs", state.programs);
  if (!storedBody) saveKeySilent("body-metrics", state.bodyMetrics);
}
function saveKeySilent(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {}
}

/* ---------------------------- save status UI feedback ---------------------------- */

let savedTimer = null;
function flashSaved() {
  state.ui.saveStatus = "saved";
  updateSaveBadge();
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => {
    state.ui.saveStatus = "idle";
    updateSaveBadge();
  }, 1200);
}
function flashError() {
  state.ui.saveStatus = "error";
  updateSaveBadge();
}
function updateSaveBadge() {
  const el = document.getElementById("save-badge");
  if (el) el.outerHTML = renderSaveBadge();
}

/* ============================================================
   CRUD — PROGRAMMES / EXERCICES
   ============================================================ */

function mutatePrograms(fn, { render: doRender = true } = {}) {
  state.programs = fn(state.programs);
  saveKey("programs", state.programs);
  if (doRender) render();
}
function mutateProgram(id, fn, opts) {
  mutatePrograms((programs) => programs.map((p) => (p.id === id ? fn(p) : p)), opts);
}
function mutateExercise(programId, exId, fn, opts) {
  mutateProgram(programId, (p) => ({ ...p, exercises: p.exercises.map((ex) => (ex.id === exId ? fn(ex) : ex)) }), opts);
}

function addProgram(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  const p = mkProgram(trimmed, []);
  mutatePrograms((programs) => [...programs, p], { render: false });
  state.activeProgramId = p.id;
  state.seanceView = "detail";
  state.ui.creatingProgram = false;
  render();
}
function removeProgram(id) {
  mutatePrograms((programs) => programs.filter((p) => p.id !== id), { render: false });
  state.seanceView = "list";
  state.ui.confirmingDeleteProgramId = null;
  render();
}
function moveProgram(id, dir) {
  const idx = state.programs.findIndex((p) => p.id === id);
  const swapIdx = idx + dir;
  if (idx < 0 || swapIdx < 0 || swapIdx >= state.programs.length) return;
  const arr = [...state.programs];
  [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
  mutatePrograms(() => arr);
}
function addExercise(programId) {
  mutateProgram(programId, (p) => ({ ...p, exercises: [...p.exercises, mkEx({ name: "Nouvel exercice", sets: [mkSet(10, 0, 75)] })] }));
}
function removeExercise(programId, exId) {
  mutateProgram(programId, (p) => ({ ...p, exercises: p.exercises.filter((e) => e.id !== exId) }));
}
function updateExerciseName(programId, exId, value) {
  mutateExercise(programId, exId, (ex) => ({ ...ex, name: value }), { render: false });
}
function updateExerciseType(programId, exId, value) {
  mutateExercise(programId, exId, (ex) => ({ ...ex, typeId: value || null }));
}
function toggleMode(programId, exId) {
  mutateExercise(programId, exId, (ex) =>
    ex.mode === "fixe"
      ? { ...ex, mode: "alterné", alternates: ex.alternates.length >= 2 ? ex.alternates : [ex.name || "Variante 1", ""], activeAlternateIndex: 0 }
      : { ...ex, mode: "fixe" }
  );
}
function updateAlternate(programId, exId, idx, value) {
  mutateExercise(programId, exId, (ex) => ({ ...ex, alternates: ex.alternates.map((a, i) => (i === idx ? value : a)) }), { render: false });
}
function addAlternateSlot(programId, exId) {
  mutateExercise(programId, exId, (ex) => ({ ...ex, alternates: [...ex.alternates, ""] }));
}
function removeAlternateSlot(programId, exId, idx) {
  mutateExercise(programId, exId, (ex) => ({
    ...ex,
    alternates: ex.alternates.filter((_, i) => i !== idx),
    activeAlternateIndex: Math.min(ex.activeAlternateIndex, Math.max(0, ex.alternates.length - 2)),
  }));
}
function addSetToExercise(programId, exId) {
  mutateExercise(programId, exId, (ex) => {
    const last = ex.sets[ex.sets.length - 1];
    return { ...ex, sets: [...ex.sets, mkSet(last ? last.reps : 10, last ? last.weight : 0, last ? last.rest : 75)] };
  });
}
function removeSetFromExercise(programId, exId, setId) {
  mutateExercise(programId, exId, (ex) => ({ ...ex, sets: ex.sets.filter((s) => s.id !== setId) }));
}
function updateSetField(programId, exId, setId, field, value) {
  mutateExercise(
    programId,
    exId,
    (ex) => ({ ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: field === "reps" ? value : Number(value) } : s)) }),
    { render: false }
  );
}

/* ---- validation & progression ---- */
function validateProgram(programId) {
  const prog = state.programs.find((p) => p.id === programId);
  if (!prog) return;
  let cycleCount = prog.cycleCount + 1;
  const shouldBump = cycleCount % 2 === 0;

  const exercises = prog.exercises.map((ex) => {
    let updated = { ...ex };
    if (ex.mode === "alterné" && ex.alternates.filter((a) => a.trim()).length > 1) {
      updated.activeAlternateIndex = (ex.activeAlternateIndex + 1) % ex.alternates.length;
    }
    if (shouldBump && ex.typeId) {
      const type = state.exerciseTypes.find((t) => t.id === ex.typeId);
      if (type) {
        updated.sets = ex.sets.map((s) => {
          const { num, suffix } = parseRepsValue(s.reps);
          if (num === null) return s;
          let newNum = num + type.repStep;
          let newWeight = s.weight;
          if (newNum > type.repMax) {
            newNum = type.repMin;
            newWeight = Math.round((Number(s.weight) + type.weightStep) * 100) / 100;
          }
          return { ...s, reps: formatReps(newNum, suffix), weight: newWeight };
        });
      }
    }
    return updated;
  });

  const updatedProgram = { ...prog, cycleCount: shouldBump ? 0 : cycleCount, totalValidations: prog.totalValidations + 1, exercises };
  mutatePrograms((programs) => programs.map((p) => (p.id === programId ? updatedProgram : p)), { render: false });
  state.history = [...state.history, { id: uid(), programId, programName: prog.name, date: todayISO(), timestamp: Date.now() }];
  saveKey("history", state.history);
  render();
}

/* ---- exercise types ---- */
function addType() {
  state.exerciseTypes = [...state.exerciseTypes, { id: uid(), name: "Nouveau type", repMin: 8, repMax: 12, repStep: 1, weightStep: 2.5 }];
  saveKey("exercise-types", state.exerciseTypes);
  render();
}
function updateTypeField(id, field, value) {
  state.exerciseTypes = state.exerciseTypes.map((t) => (t.id === id ? { ...t, [field]: field === "name" ? value : Number(value) } : t));
  saveKey("exercise-types", state.exerciseTypes);
}
function removeType(id) {
  state.exerciseTypes = state.exerciseTypes.filter((t) => t.id !== id);
  saveKey("exercise-types", state.exerciseTypes);
  state.programs = state.programs.map((p) => ({ ...p, exercises: p.exercises.map((ex) => (ex.typeId === id ? { ...ex, typeId: null } : ex)) }));
  saveKey("programs", state.programs);
  render();
}

/* ============================================================
   PLANNING
   ============================================================ */

function updateScheduleDay(day, programId) {
  state.schedule = { ...state.schedule, [day]: programId || null };
  saveKey("schedule", state.schedule);
  render();
}
function getNextSession() {
  const todayName = todayDayName();
  const todayIdx = DAYS.indexOf(todayName);
  for (let i = 0; i < 7; i++) {
    const dayIdx = (todayIdx + i) % 7;
    const dayName = DAYS[dayIdx];
    const progId = state.schedule[dayName];
    if (progId) {
      const prog = state.programs.find((p) => p.id === progId);
      if (prog) return { programName: prog.name, dayName, isToday: i === 0 };
    }
  }
  return null;
}

/* ============================================================
   MENSURATION
   ============================================================ */

function saveBodyEntry(values) {
  const fields = ["weight", "muscle", "fat", "water", "height"];
  const provided = {};
  fields.forEach((f) => {
    if (values[f] !== "" && values[f] !== undefined && values[f] !== null) provided[f] = Number(values[f]);
  });
  if (Object.keys(provided).length === 0) return;
  const today = todayISO();
  const idx = state.bodyMetrics.findIndex((e) => e.date === today);
  if (idx >= 0) {
    state.bodyMetrics = state.bodyMetrics.map((e, i) => (i === idx ? { ...e, ...provided } : e));
  } else {
    state.bodyMetrics = [...state.bodyMetrics, { id: uid(), date: today, weight: null, muscle: null, fat: null, water: null, height: null, ...provided }];
  }
  state.bodyMetrics.sort((a, b) => (a.date > b.date ? 1 : -1));
  saveKey("body-metrics", state.bodyMetrics);
  render();
}
function deleteBodyEntry(id) {
  state.bodyMetrics = state.bodyMetrics.filter((e) => e.id !== id);
  saveKey("body-metrics", state.bodyMetrics);
  render();
}

/* ============================================================
   OBJECTIFS
   ============================================================ */

function mkGoal(type, title) {
  return { id: uid(), type, title, done: false, unit: "kg", levels: [], subGoals: [] };
}
function addGoal(type, title) {
  const trimmed = (title || "").trim();
  if (!trimmed) return;
  state.goals = [...state.goals, mkGoal(type, trimmed)];
  saveKey("goals", state.goals);
  state.ui.creatingGoal = false;
  render();
}
function removeGoal(id) {
  state.goals = state.goals.filter((g) => g.id !== id);
  saveKey("goals", state.goals);
  state.ui.confirmingDeleteGoalId = null;
  render();
}
function moveGoal(id, dir) {
  const idx = state.goals.findIndex((g) => g.id === id);
  const swapIdx = idx + dir;
  if (idx < 0 || swapIdx < 0 || swapIdx >= state.goals.length) return;
  const arr = [...state.goals];
  [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
  state.goals = arr;
  saveKey("goals", state.goals);
  render();
}
function mutateGoal(id, fn, { render: doRender = true } = {}) {
  state.goals = state.goals.map((g) => (g.id === id ? fn(g) : g));
  saveKey("goals", state.goals);
  if (doRender) render();
}
function updateGoalTitle(id, value) {
  mutateGoal(id, (g) => ({ ...g, title: value }), { render: false });
}
function toggleUniqueGoal(id) {
  mutateGoal(id, (g) => ({ ...g, done: !g.done }));
}
function updateGoalUnit(id, value) {
  mutateGoal(id, (g) => ({ ...g, unit: value }), { render: false });
}
function addLevel(goalId, rawValue) {
  const value = Number(rawValue);
  if (Number.isNaN(value) || rawValue === "") return;
  mutateGoal(goalId, (g) => ({ ...g, levels: [...g.levels, { id: uid(), value, achieved: false }].sort((a, b) => a.value - b.value) }));
}
function toggleLevel(goalId, levelId) {
  mutateGoal(goalId, (g) => ({ ...g, levels: g.levels.map((l) => (l.id === levelId ? { ...l, achieved: !l.achieved } : l)) }));
}
function removeLevel(goalId, levelId) {
  mutateGoal(goalId, (g) => ({ ...g, levels: g.levels.filter((l) => l.id !== levelId) }));
}
function addSubGoal(goalId, title) {
  const trimmed = (title || "").trim();
  if (!trimmed) return;
  mutateGoal(goalId, (g) => ({ ...g, subGoals: [...g.subGoals, { id: uid(), title: trimmed, done: false }] }));
}
function toggleSubGoal(goalId, subId) {
  mutateGoal(goalId, (g) => ({ ...g, subGoals: g.subGoals.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }));
}
function removeSubGoal(goalId, subId) {
  mutateGoal(goalId, (g) => ({ ...g, subGoals: g.subGoals.filter((s) => s.id !== subId) }));
}
function updateSubGoalTitle(goalId, subId, value) {
  mutateGoal(goalId, (g) => ({ ...g, subGoals: g.subGoals.map((s) => (s.id === subId ? { ...s, title: value } : s)) }), { render: false });
}

/* ============================================================
   RECORDS (PR)
   ============================================================ */

function mkRecord(name) {
  return { id: uid(), name, weightPR: null, timePR: null, updatedDate: null };
}
function addRecord(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return;
  state.records = [...state.records, mkRecord(trimmed)];
  saveKey("records", state.records);
  state.ui.creatingRecord = false;
  render();
}
function removeRecord(id) {
  state.records = state.records.filter((r) => r.id !== id);
  saveKey("records", state.records);
  state.ui.confirmingDeleteRecordId = null;
  render();
}
function moveRecord(id, dir) {
  const idx = state.records.findIndex((r) => r.id === id);
  const swapIdx = idx + dir;
  if (idx < 0 || swapIdx < 0 || swapIdx >= state.records.length) return;
  const arr = [...state.records];
  [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
  state.records = arr;
  saveKey("records", state.records);
  render();
}
function updateRecordField(id, field, value) {
  state.records = state.records.map((r) => {
    if (r.id !== id) return r;
    const updated = { ...r };
    if (field === "name") updated.name = value;
    if (field === "weightPR") updated.weightPR = value === "" ? null : Number(value);
    if (field === "timePR") updated.timePR = value === "" ? null : Number(value);
    if (field === "weightPR" || field === "timePR") updated.updatedDate = todayISO();
    return updated;
  });
  saveKey("records", state.records);
}
function updateRecordFieldAndRender(id, field, value) {
  updateRecordField(id, field, value);
  render();
}

/* ============================================================
   DERIVED
   ============================================================ */

function totalSessions() {
  return state.programs.reduce((a, p) => a + p.totalValidations, 0);
}
function latestWeight() {
  const withWeight = state.bodyMetrics.filter((e) => e.weight != null).sort((a, b) => (a.date > b.date ? 1 : -1));
  return withWeight.length ? withWeight[withWeight.length - 1].weight : null;
}

/* ============================================================
   ICONS (symboles unicode simples, pas de dépendance externe)
   ============================================================ */
const ICO = {
  check: "&#10003;",
  cross: "&#10005;",
  plus: "&#43;",
  up: "&#9650;",
  down: "&#9660;",
  trash: "&#128465;",
  repeat: "&#8646;",
  chevronRight: "&#8250;",
};

/* ============================================================
   RENDER — RACINE
   ============================================================ */

function render() {
  const root = document.getElementById("app-root");
  root.innerHTML = `
    ${renderHeader()}
    <div id="save-row">${renderSaveBadge()}</div>
    ${renderMainTabs()}
    <div id="tab-content">${renderTabContent()}</div>
  `;
}

function renderSaveBadge() {
  const status = state.ui.saveStatus;
  if (status === "idle") return `<div id="save-badge"></div>`;
  if (status === "error") return `<div id="save-badge" class="save-badge save-error"><span class="dot"></span>Échec de la sauvegarde</div>`;
  return `<div id="save-badge" class="save-badge save-ok"><span class="dot"></span>Enregistré</div>`;
}

function renderHeader() {
  const w = latestWeight();
  const next = getNextSession();
  return `
    <div class="app-header">
      <div class="eyebrow">Journal personnel</div>
      <h1 class="app-title">Carnet de fonte</h1>
    </div>
    <div class="stat-row">
      <div class="stat-chip">
        <div class="stat-value yellow">${totalSessions()}</div>
        <div class="stat-label">Séances</div>
      </div>
      <div class="stat-chip">
        <div class="stat-value accent">${next ? escapeHtml(next.programName) : "—"}</div>
        <div class="stat-label">${next ? (next.isToday ? "Aujourd'hui" : "Prochaine · " + next.dayName) : "Aucune prévue"}</div>
      </div>
      <div class="stat-chip">
        <div class="stat-value red">${w != null ? w + " kg" : "—"}</div>
        <div class="stat-label">Poids actuel</div>
      </div>
    </div>
  `;
}

const MAIN_TABS = [
  { key: "seance", label: "Séance" },
  { key: "planning", label: "Planning" },
  { key: "mensuration", label: "Mensuration" },
  { key: "objectif", label: "Objectif" },
  { key: "record", label: "Record" },
];

function renderMainTabs() {
  return `
    <div class="main-tabs">
      ${MAIN_TABS.map(
        (t) => `<button class="tab-btn ${state.tab === t.key ? "active" : ""}" data-action="set-tab" data-tab="${t.key}">${t.label}</button>`
      ).join("")}
    </div>
  `;
}

function renderTabContent() {
  switch (state.tab) {
    case "seance":
      return renderSeanceTab();
    case "planning":
      return renderPlanningTab();
    case "mensuration":
      return renderMensurationTab();
    case "objectif":
      return renderObjectifTab();
    case "record":
      return renderRecordTab();
    default:
      return "";
  }
}

/* ============================================================
   ONGLET SÉANCE
   ============================================================ */

function renderSeanceTab() {
  if (state.seanceView === "types") return renderTypesPanel();
  if (state.seanceView === "historique") return renderHistoriquePanel();
  if (state.seanceView === "detail") return renderProgramDetail();
  return renderProgramList();
}

function renderProgramList() {
  const rows = state.programs
    .map(
      (p, idx) => `
    <div class="list-row" data-action="open-program" data-id="${p.id}">
      <div class="list-row-main">
        <span class="list-row-name">${escapeHtml(p.name)}</span>
        <span class="list-row-badge">${p.totalValidations}&times;</span>
      </div>
      <div class="reorder-btns">
        <button class="icon-btn" data-action="move-program" data-id="${p.id}" data-dir="-1" ${idx === 0 ? "disabled" : ""}>${ICO.up}</button>
        <button class="icon-btn" data-action="move-program" data-id="${p.id}" data-dir="1" ${idx === state.programs.length - 1 ? "disabled" : ""}>${ICO.down}</button>
      </div>
    </div>`
    )
    .join("");

  return `
    <div class="stack">
      ${
        state.ui.creatingProgram
          ? `<div class="card row-flex">
              <input id="new-program-name" class="input" placeholder="Nom de la nouvelle séance" autofocus />
              <button class="btn btn-primary" data-action="submit-new-program">${ICO.check} Créer</button>
              <button class="btn btn-ghost" data-action="cancel-new-program">${ICO.cross}</button>
            </div>`
          : ""
      }
      <div class="card">
        <div class="section-title"><span class="eyebrow">Mes séances</span><h2>Programmes</h2></div>
        <div class="list">${rows || '<p class="muted">Aucune séance pour l\'instant.</p>'}</div>
        <button class="btn btn-ghost btn-block" data-action="start-new-program"><span>${ICO.plus}</span> Nouvelle séance</button>
      </div>
      <div class="card">
        <button class="btn btn-ghost btn-block" data-action="open-types">Modèle de progression ${ICO.chevronRight}</button>
      </div>
      <div class="card">
        <button class="btn btn-ghost btn-block" data-action="open-historique">Historique des compteurs ${ICO.chevronRight}</button>
      </div>
    </div>
  `;
}

function renderProgramDetail() {
  const program = state.programs.find((p) => p.id === state.activeProgramId);
  if (!program) return renderProgramList();

  const exercisesHtml = program.exercises
    .map((ex) => {
      const type = state.exerciseTypes.find((t) => t.id === ex.typeId);
      const altHtml =
        ex.mode === "alterné"
          ? `<div class="alt-box">
              <div class="alt-current">Aujourd'hui : <span class="yellow">${escapeHtml(ex.alternates[ex.activeAlternateIndex] || "—")}</span></div>
              ${ex.alternates
                .map(
                  (a, idx) => `
                <div class="alt-row">
                  <span class="alt-dot ${idx === ex.activeAlternateIndex ? "on" : ""}">&#9679;</span>
                  <input class="input" data-action="alt-field" data-program="${program.id}" data-ex="${ex.id}" data-idx="${idx}" value="${escapeHtml(a)}" placeholder="Variante ${idx + 1}" />
                  ${ex.alternates.length > 2 ? `<button class="icon-btn" data-action="remove-alt" data-program="${program.id}" data-ex="${ex.id}" data-idx="${idx}">${ICO.cross}</button>` : ""}
                </div>`
                )
                .join("")}
              <button class="btn btn-ghost btn-sm" data-action="add-alt" data-program="${program.id}" data-ex="${ex.id}">${ICO.plus} Variante</button>
            </div>`
          : "";

      const setsHtml = ex.sets
        .map(
          (s, idx) => `
        <div class="set-row">
          <span class="set-idx">${idx + 1}</span>
          <input class="input" data-action="set-field" data-program="${program.id}" data-ex="${ex.id}" data-set="${s.id}" data-field="reps" value="${escapeHtml(s.reps)}" />
          <input class="input" type="number" step="0.1" data-action="set-field" data-program="${program.id}" data-ex="${ex.id}" data-set="${s.id}" data-field="weight" value="${s.weight}" />
          <input class="input" type="number" data-action="set-field" data-program="${program.id}" data-ex="${ex.id}" data-set="${s.id}" data-field="rest" value="${s.rest}" title="${fmtSecMMSS(s.rest)}" />
          <button class="icon-btn" data-action="remove-set" data-program="${program.id}" data-ex="${ex.id}" data-set="${s.id}">${ICO.trash}</button>
        </div>`
        )
        .join("");

      return `
      <div class="card">
        <div class="row-flex mb10">
          <input class="input bold" data-action="ex-name" data-program="${program.id}" data-ex="${ex.id}" value="${escapeHtml(ex.name)}" />
          <button class="btn btn-ghost ${ex.mode === "alterné" ? "on-yellow" : ""}" data-action="toggle-mode" data-program="${program.id}" data-ex="${ex.id}">${ICO.repeat} ${ex.mode === "alterné" ? "Alterné" : "Fixe"}</button>
          <button class="icon-btn" data-action="remove-exercise" data-program="${program.id}" data-ex="${ex.id}">${ICO.trash}</button>
        </div>
        ${altHtml}
        <div class="mb10">
          <select class="input" data-action="ex-type" data-program="${program.id}" data-ex="${ex.id}">
            <option value="">Aucun type (pas de progression auto.)</option>
            ${state.exerciseTypes.map((t) => `<option value="${t.id}" ${ex.typeId === t.id ? "selected" : ""}>${escapeHtml(t.name)}</option>`).join("")}
          </select>
          ${type ? `<div class="hint">${type.repMin}–${type.repMax} reps · +${type.repStep} reps / +${type.weightStep}kg</div>` : ""}
        </div>
        <div class="set-header">
          <span></span><span>Reps</span><span>Kg</span><span>Récup (s)</span><span></span>
        </div>
        <div class="stack-sm">${setsHtml}</div>
        <button class="btn btn-ghost btn-sm mt8" data-action="add-set" data-program="${program.id}" data-ex="${ex.id}">${ICO.plus} Série</button>
      </div>`;
    })
    .join("");

  const deleteBlock = state.ui.confirmingDeleteProgramId === program.id
    ? `<div class="row-flex">
        <span class="red small">Supprimer "${escapeHtml(program.name)}" ?</span>
        <button class="btn btn-primary btn-danger" data-action="confirm-remove-program" data-id="${program.id}">${ICO.check} Confirmer</button>
        <button class="btn btn-ghost" data-action="cancel-remove-program">${ICO.cross}</button>
      </div>`
    : `<div class="row-flex">
        <button class="btn btn-primary" data-action="validate-program" data-id="${program.id}">${ICO.check} Valider la séance</button>
        <button class="icon-btn" data-action="ask-remove-program" data-id="${program.id}">${ICO.trash}</button>
      </div>`;

  return `
    <div class="stack">
      <button class="btn btn-ghost" data-action="back-to-list">&larr; Retour</button>
      <div class="card row-flex space-between wrap">
        <div>
          <div class="program-title">${escapeHtml(program.name)}</div>
          <div class="muted small">Réalisée <span class="yellow mono">${program.totalValidations}</span> fois &middot; cycle ${program.cycleCount}/2</div>
        </div>
        ${deleteBlock}
      </div>
      ${exercisesHtml}
      <button class="btn btn-ghost btn-block" data-action="add-exercise" data-program="${program.id}">${ICO.plus} Ajouter un exercice</button>
    </div>
  `;
}

function renderTypesPanel() {
  const rows = state.exerciseTypes
    .map(
      (t) => `
    <div class="card subtle">
      <div class="row-flex mb10">
        <input class="input bold" data-action="type-name" data-id="${t.id}" value="${escapeHtml(t.name)}" />
        <button class="icon-btn" data-action="remove-type" data-id="${t.id}">${ICO.trash}</button>
      </div>
      <div class="grid2">
        <label class="field"><span>Reps min</span><input class="input" type="number" data-action="type-field" data-id="${t.id}" data-field="repMin" value="${t.repMin}" /></label>
        <label class="field"><span>Reps max</span><input class="input" type="number" data-action="type-field" data-id="${t.id}" data-field="repMax" value="${t.repMax}" /></label>
        <label class="field"><span>Pas de reps</span><input class="input" type="number" data-action="type-field" data-id="${t.id}" data-field="repStep" value="${t.repStep}" /></label>
        <label class="field"><span>Pas de poids (kg)</span><input class="input" type="number" step="0.25" data-action="type-field" data-id="${t.id}" data-field="weightStep" value="${t.weightStep}" /></label>
      </div>
    </div>`
    )
    .join("");

  return `
    <div class="stack">
      <button class="btn btn-ghost" data-action="back-to-list">&larr; Retour</button>
      <div class="card">
        <div class="section-title"><span class="eyebrow">Modèle de progression</span><h2>Types d'exercice</h2></div>
        <div class="stack-sm">${rows}</div>
        <button class="btn btn-ghost btn-block mt8" data-action="add-type">${ICO.plus} Ajouter un type</button>
        <p class="hint mt8">Toutes les 2 validations d'une même séance, les exercices reliés à un type gagnent le "pas de reps" jusqu'au max, puis repassent au min et gagnent le "pas de poids".</p>
      </div>
    </div>
  `;
}

function renderHistoriquePanel() {
  const rows = state.programs
    .map((p) => `<div class="row-flex space-between border-b"><span>${escapeHtml(p.name)}</span><span class="mono yellow bold">${p.totalValidations}</span></div>`)
    .join("");
  return `
    <div class="stack">
      <button class="btn btn-ghost" data-action="back-to-list">&larr; Retour</button>
      <div class="card">
        <div class="section-title"><span class="eyebrow">Compteur</span><h2>Séances réalisées</h2></div>
        <div class="stack-sm">${rows}</div>
      </div>
    </div>
  `;
}

/* ============================================================
   ONGLET PLANNING
   ============================================================ */

function renderPlanningTab() {
  const dayRows = DAYS.map(
    (day) => `
    <div class="grid-day">
      <span class="muted small">${day}</span>
      <select class="input" data-action="schedule-day" data-day="${day}">
        <option value="">Repos</option>
        ${state.programs.map((p) => `<option value="${p.id}" ${state.schedule[day] === p.id ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
      </select>
    </div>`
  ).join("");

  const quickButtons = state.programs
    .map((p) => `<button class="btn btn-ghost" data-action="validate-program" data-id="${p.id}">${ICO.check} ${escapeHtml(p.name)}</button>`)
    .join("");

  const groups = {};
  [...state.history]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .forEach((h) => {
      const wk = getMonday(h.date);
      if (!groups[wk]) groups[wk] = [];
      groups[wk].push(h);
    });
  const groupedEntries = Object.entries(groups).sort((a, b) => (a[0] > b[0] ? -1 : 1));

  const agendaHtml = groupedEntries.length
    ? groupedEntries
        .map(
          ([weekStart, entries]) => `
      <div class="week-group">
        <div class="week-label">Semaine du ${fmtDateFR(weekStart)}</div>
        ${entries
          .map(
            (h) => `<div class="row-flex space-between border-b small"><span class="capitalize">${fmtDateLong(h.date)}</span><span class="yellow mono">${escapeHtml(h.programName)}</span></div>`
          )
          .join("")}
      </div>`
        )
        .join("")
    : `<p class="muted">Aucune séance validée pour l'instant.</p>`;

  return `
    <div class="stack">
      <div class="card">
        <div class="section-title"><span class="eyebrow">Semaine type</span><h2>Emploi du temps</h2></div>
        <div class="stack-sm">${dayRows}</div>
      </div>
      <div class="card">
        <div class="section-title"><span class="eyebrow">Accès rapide</span><h2>Valider une séance</h2></div>
        <div class="wrap-row">${quickButtons}</div>
      </div>
      <div class="card">
        <div class="section-title"><span class="eyebrow">Agenda</span><h2>Semaines passées</h2></div>
        ${agendaHtml}
      </div>
    </div>
  `;
}

/* ============================================================
   ONGLET MENSURATION
   ============================================================ */

function buildBodyChartSVG(entries) {
  const W = 640, H = 240, padL = 38, padR = 38, padT = 14, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const sorted = [...entries].sort((a, b) => (a.date > b.date ? 1 : -1));
  const n = sorted.length;
  if (n === 0) return "";
  const xFor = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yLeft = (v) => padT + plotH - ((v - 50) / (80 - 50)) * plotH;
  const yRight = (v) => padT + plotH - (v / 100) * plotH;

  function lineFor(field, scaleFn, color) {
    const pts = sorted.map((e, i) => ({ i, v: e[field] })).filter((p) => p.v != null);
    if (pts.length === 0) return "";
    const path = pts.map((p, k) => `${k === 0 ? "M" : "L"}${xFor(p.i).toFixed(1)},${scaleFn(p.v).toFixed(1)}`).join(" ");
    const dots = pts.map((p) => `<circle cx="${xFor(p.i).toFixed(1)}" cy="${scaleFn(p.v).toFixed(1)}" r="2.6" fill="${color}" />`).join("");
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2" />${dots}`;
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const y = padT + plotH * f;
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#3A352F" stroke-dasharray="3 3" />`;
    })
    .join("");

  const leftLabels = [50, 60, 70, 80]
    .map((v) => `<text x="${padL - 6}" y="${yLeft(v).toFixed(1)}" font-size="9" fill="#B23B3B" text-anchor="end" dominant-baseline="middle">${v}</text>`)
    .join("");
  const rightLabels = [0, 25, 50, 75, 100]
    .map((v) => `<text x="${W - padR + 6}" y="${yRight(v).toFixed(1)}" font-size="9" fill="#6C8CA0" text-anchor="start" dominant-baseline="middle">${v}</text>`)
    .join("");

  const step = Math.max(1, Math.ceil(n / 6));
  const xLabels = sorted
    .map((e, i) => (i % step === 0 || i === n - 1 ? `<text x="${xFor(i).toFixed(1)}" y="${H - 8}" font-size="9" fill="#9C948A" text-anchor="middle">${fmtDateFR(e.date)}</text>` : ""))
    .join("");

  return `
    <svg viewBox="0 0 ${W} ${H}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">
      ${gridLines}
      ${leftLabels}${rightLabels}${xLabels}
      ${lineFor("weight", yLeft, "#B23B3B")}
      ${lineFor("fat", yRight, "#D9C874")}
      ${lineFor("muscle", yRight, "#6C8CA0")}
      ${lineFor("water", yRight, "#7FA0AE")}
    </svg>
    <div class="legend">
      <span><i style="background:#B23B3B"></i>Poids (kg, gauche)</span>
      <span><i style="background:#D9C874"></i>% Gras</span>
      <span><i style="background:#6C8CA0"></i>% Muscle</span>
      <span><i style="background:#7FA0AE"></i>% Eau</span>
    </div>
  `;
}

function renderMensurationTab() {
  const chart = state.bodyMetrics.length ? buildBodyChartSVG(state.bodyMetrics) : "";
  const historyRows = [...state.bodyMetrics]
    .reverse()
    .map(
      (e) => `
    <div class="row-flex space-between border-b small">
      <div class="wrap-row">
        <span class="mono accent">${fmtDateFR(e.date)}</span>
        ${e.weight != null ? `<span>${e.weight}kg</span>` : ""}
        ${e.fat != null ? `<span class="muted">Gras ${e.fat}%</span>` : ""}
        ${e.muscle != null ? `<span class="muted">Muscle ${e.muscle}%</span>` : ""}
        ${e.water != null ? `<span class="muted">Eau ${e.water}%</span>` : ""}
        ${e.height != null ? `<span class="muted">Taille ${e.height}cm</span>` : ""}
      </div>
      <button class="icon-btn" data-action="delete-body-entry" data-id="${e.id}">${ICO.trash}</button>
    </div>`
    )
    .join("");

  return `
    <div class="stack">
      <div class="card">
        <div class="section-title"><span class="eyebrow">Aujourd'hui</span><h2>Nouvelle mesure</h2></div>
        <div class="grid2 mb14">
          <label class="field"><span>Poids (kg)</span><input id="entry-weight" class="input" type="number" step="0.1" /></label>
          <label class="field"><span>Taille (cm)</span><input id="entry-height" class="input" type="number" step="0.1" /></label>
          <label class="field"><span>% Masse musculaire</span><input id="entry-muscle" class="input" type="number" step="0.1" /></label>
          <label class="field"><span>% Masse grasse</span><input id="entry-fat" class="input" type="number" step="0.1" /></label>
          <label class="field"><span>% Masse eau</span><input id="entry-water" class="input" type="number" step="0.1" /></label>
        </div>
        <button class="btn btn-primary" data-action="save-body-entry">Enregistrer</button>
      </div>
      ${
        chart
          ? `<div class="card"><div class="section-title"><span class="eyebrow">Évolution</span><h2>Courbes</h2></div>${chart}</div>`
          : ""
      }
      <div class="card">
        <div class="section-title"><span class="eyebrow">Historique</span><h2>Mesures passées</h2></div>
        ${historyRows || '<p class="muted">Aucune mesure enregistrée pour l\'instant.</p>'}
      </div>
    </div>
  `;
}

/* ============================================================
   ONGLET OBJECTIF
   ============================================================ */

function renderGoalCard(g, idx) {
  let body = "";
  if (g.type === "unique") {
    body = `
      <button class="toggle-goal ${g.done ? "done" : ""}" data-action="toggle-unique" data-id="${g.id}">
        ${g.done ? ICO.check + " Atteint" : "Marquer comme atteint"}
      </button>`;
  } else if (g.type === "niveau") {
    const chips = g.levels
      .map(
        (l) => `
      <span class="level-chip ${l.achieved ? "achieved" : ""}" data-action="toggle-level" data-goal="${g.id}" data-level="${l.id}">
        ${l.value}${escapeHtml(g.unit)} ${l.achieved ? ICO.check : ""}
        <span class="level-remove" data-action="remove-level" data-goal="${g.id}" data-level="${l.id}">${ICO.cross}</span>
      </span>`
      )
      .join("");
    body = `
      <div class="row-flex mb10">
        <label class="field" style="flex:0 0 90px"><span>Unité</span><input class="input" data-action="goal-unit" data-id="${g.id}" value="${escapeHtml(g.unit)}" /></label>
      </div>
      <div class="wrap-row mb10">${chips || '<span class="muted small">Aucun palier pour l\'instant</span>'}</div>
      <div class="row-flex">
        <input class="input" type="number" step="any" placeholder="Nouveau palier (ex. 100)" id="new-level-${g.id}" />
        <button class="btn btn-ghost" data-action="add-level" data-id="${g.id}">${ICO.plus}</button>
      </div>`;
  } else if (g.type === "famille") {
    const subs = g.subGoals
      .map(
        (s) => `
      <div class="subgoal-row">
        <button class="checkbox ${s.done ? "checked" : ""}" data-action="toggle-subgoal" data-goal="${g.id}" data-sub="${s.id}">${s.done ? ICO.check : ""}</button>
        <input class="input" data-action="subgoal-title" data-goal="${g.id}" data-sub="${s.id}" value="${escapeHtml(s.title)}" />
        <button class="icon-btn" data-action="remove-subgoal" data-goal="${g.id}" data-sub="${s.id}">${ICO.cross}</button>
      </div>`
      )
      .join("");
    const doneCount = g.subGoals.filter((s) => s.done).length;
    body = `
      <div class="muted small mb10">${doneCount}/${g.subGoals.length} atteints</div>
      <div class="stack-sm mb10">${subs || '<span class="muted small">Aucun sous-objectif pour l\'instant</span>'}</div>
      <div class="row-flex">
        <input class="input" placeholder="Nouveau sous-objectif" id="new-subgoal-${g.id}" />
        <button class="btn btn-ghost" data-action="add-subgoal" data-id="${g.id}">${ICO.plus}</button>
      </div>`;
  }

  const typeLabel = { unique: "Unique", niveau: "Niveau", famille: "Famille" }[g.type];

  return `
    <div class="card">
      <div class="row-flex mb10">
        <span class="type-tag">${typeLabel}</span>
        <input class="input bold" data-action="goal-title" data-id="${g.id}" value="${escapeHtml(g.title)}" />
        <div class="reorder-btns">
          <button class="icon-btn" data-action="move-goal" data-id="${g.id}" data-dir="-1" ${idx === 0 ? "disabled" : ""}>${ICO.up}</button>
          <button class="icon-btn" data-action="move-goal" data-id="${g.id}" data-dir="1">${ICO.down}</button>
        </div>
      </div>
      ${body}
      <div class="mt10">
        ${
          state.ui.confirmingDeleteGoalId === g.id
            ? `<div class="row-flex"><span class="red small">Supprimer ?</span><button class="btn btn-primary btn-danger" data-action="confirm-remove-goal" data-id="${g.id}">${ICO.check}</button><button class="btn btn-ghost" data-action="cancel-remove-goal">${ICO.cross}</button></div>`
            : `<button class="icon-btn" data-action="ask-remove-goal" data-id="${g.id}">${ICO.trash} Supprimer</button>`
        }
      </div>
    </div>`;
}

function renderObjectifTab() {
  const cards = state.goals.map((g, idx) => renderGoalCard(g, idx)).join("");
  const creator = state.ui.creatingGoal
    ? `<div class="card">
        <div class="section-title"><h2>Nouvel objectif</h2></div>
        <div class="wrap-row mb10">
          <button class="btn ${state.ui.newGoalType === "unique" ? "btn-primary" : "btn-ghost"}" data-action="set-goal-type" data-type="unique">Unique</button>
          <button class="btn ${state.ui.newGoalType === "niveau" ? "btn-primary" : "btn-ghost"}" data-action="set-goal-type" data-type="niveau">Niveau</button>
          <button class="btn ${state.ui.newGoalType === "famille" ? "btn-primary" : "btn-ghost"}" data-action="set-goal-type" data-type="famille">Famille</button>
        </div>
        <div class="row-flex">
          <input id="new-goal-title" class="input" placeholder="Titre de l'objectif" autofocus />
          <button class="btn btn-primary" data-action="submit-new-goal">${ICO.check} Créer</button>
          <button class="btn btn-ghost" data-action="cancel-new-goal">${ICO.cross}</button>
        </div>
        <p class="hint mt8">Unique : un objectif ponctuel (ex. le grand écart). Niveau : une progression par paliers (ex. squat 80&rarr;100&rarr;120kg). Famille : plusieurs sous-objectifs liés (ex. "100kg partout").</p>
      </div>`
    : "";

  return `
    <div class="stack">
      ${creator}
      ${cards}
      ${!state.ui.creatingGoal ? `<button class="btn btn-ghost btn-block" data-action="start-new-goal">${ICO.plus} Nouvel objectif</button>` : ""}
      ${!cards && !state.ui.creatingGoal ? '<p class="muted">Aucun objectif pour l\'instant.</p>' : ""}
    </div>
  `;
}

/* ============================================================
   ONGLET RECORD (PR)
   ============================================================ */

function renderRecordTab() {
  const rows = state.records
    .map(
      (r, idx) => `
    <div class="card">
      <div class="row-flex mb10">
        <input class="input bold" data-action="record-field" data-id="${r.id}" data-field="name" value="${escapeHtml(r.name)}" />
        <div class="reorder-btns">
          <button class="icon-btn" data-action="move-record" data-id="${r.id}" data-dir="-1" ${idx === 0 ? "disabled" : ""}>${ICO.up}</button>
          <button class="icon-btn" data-action="move-record" data-id="${r.id}" data-dir="1" ${idx === state.records.length - 1 ? "disabled" : ""}>${ICO.down}</button>
        </div>
      </div>
      <div class="grid2 mb10">
        <label class="field"><span>PR poids (kg)</span><input class="input" type="number" step="0.1" data-action="record-field" data-id="${r.id}" data-field="weightPR" value="${r.weightPR ?? ""}" /></label>
        <label class="field"><span>PR temps (secondes)</span><input class="input" type="number" data-action="record-field" data-id="${r.id}" data-field="timePR" value="${r.timePR ?? ""}" title="${fmtSecMMSS(r.timePR)}" /></label>
      </div>
      <div class="row-flex space-between">
        <span class="muted small">${r.updatedDate ? "Mis à jour le " + fmtDateFR(r.updatedDate) : "Pas encore de record"}</span>
        ${
          state.ui.confirmingDeleteRecordId === r.id
            ? `<div class="row-flex"><button class="btn btn-primary btn-danger" data-action="confirm-remove-record" data-id="${r.id}">${ICO.check} Confirmer</button><button class="btn btn-ghost" data-action="cancel-remove-record">${ICO.cross}</button></div>`
            : `<button class="icon-btn" data-action="ask-remove-record" data-id="${r.id}">${ICO.trash}</button>`
        }
      </div>
    </div>`
    )
    .join("");

  const creator = state.ui.creatingRecord
    ? `<div class="card row-flex">
        <input id="new-record-name" class="input" placeholder="Nom de l'exercice" autofocus />
        <button class="btn btn-primary" data-action="submit-new-record">${ICO.check} Créer</button>
        <button class="btn btn-ghost" data-action="cancel-new-record">${ICO.cross}</button>
      </div>`
    : "";

  return `
    <div class="stack">
      ${creator}
      ${rows}
      ${!state.ui.creatingRecord ? `<button class="btn btn-ghost btn-block" data-action="start-new-record">${ICO.plus} Nouvel exercice</button>` : ""}
      ${!rows && !state.ui.creatingRecord ? '<p class="muted">Aucun record pour l\'instant.</p>' : ""}
    </div>
  `;
}

/* ============================================================
   ÉVÉNEMENTS
   ============================================================ */

function byId(id) {
  return document.getElementById(id);
}

function handleClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  const id = el.dataset.id;
  const program = el.dataset.program;
  const ex = el.dataset.ex;
  const setId = el.dataset.set;
  const idx = el.dataset.idx;
  const dir = el.dataset.dir ? Number(el.dataset.dir) : 0;
  const goal = el.dataset.goal;
  const sub = el.dataset.sub;
  const level = el.dataset.level;

  switch (a) {
    // navigation
    case "set-tab":
      state.tab = el.dataset.tab;
      if (state.tab === "seance") state.seanceView = "list";
      render();
      break;
    case "back-to-list":
      state.seanceView = "list";
      render();
      break;
    case "open-program":
      state.activeProgramId = id;
      state.seanceView = "detail";
      render();
      break;
    case "open-types":
      state.seanceView = "types";
      render();
      break;
    case "open-historique":
      state.seanceView = "historique";
      render();
      break;

    // programmes
    case "move-program":
      moveProgram(id, dir);
      break;
    case "start-new-program":
      state.ui.creatingProgram = true;
      render();
      setTimeout(() => byId("new-program-name") && byId("new-program-name").focus(), 0);
      break;
    case "cancel-new-program":
      state.ui.creatingProgram = false;
      render();
      break;
    case "submit-new-program":
      addProgram(byId("new-program-name") ? byId("new-program-name").value : "");
      break;
    case "validate-program":
      validateProgram(id);
      break;
    case "ask-remove-program":
      state.ui.confirmingDeleteProgramId = id;
      render();
      break;
    case "cancel-remove-program":
      state.ui.confirmingDeleteProgramId = null;
      render();
      break;
    case "confirm-remove-program":
      removeProgram(id);
      break;

    // exercices
    case "toggle-mode":
      toggleMode(program, ex);
      break;
    case "remove-exercise":
      removeExercise(program, ex);
      break;
    case "add-exercise":
      addExercise(program);
      break;
    case "add-set":
      addSetToExercise(program, ex);
      break;
    case "remove-set":
      removeSetFromExercise(program, ex, setId);
      break;
    case "add-alt":
      addAlternateSlot(program, ex);
      break;
    case "remove-alt":
      removeAlternateSlot(program, ex, Number(idx));
      break;

    // types
    case "add-type":
      addType();
      break;
    case "remove-type":
      removeType(id);
      break;

    // mensuration
    case "save-body-entry":
      saveBodyEntry({
        weight: byId("entry-weight").value,
        height: byId("entry-height").value,
        muscle: byId("entry-muscle").value,
        fat: byId("entry-fat").value,
        water: byId("entry-water").value,
      });
      break;
    case "delete-body-entry":
      deleteBodyEntry(id);
      break;

    // objectifs
    case "start-new-goal":
      state.ui.creatingGoal = true;
      render();
      setTimeout(() => byId("new-goal-title") && byId("new-goal-title").focus(), 0);
      break;
    case "cancel-new-goal":
      state.ui.creatingGoal = false;
      render();
      break;
    case "set-goal-type":
      state.ui.newGoalType = el.dataset.type;
      render();
      break;
    case "submit-new-goal":
      addGoal(state.ui.newGoalType, byId("new-goal-title") ? byId("new-goal-title").value : "");
      break;
    case "toggle-unique":
      toggleUniqueGoal(id);
      break;
    case "add-level":
      addLevel(id, byId("new-level-" + id) ? byId("new-level-" + id).value : "");
      break;
    case "toggle-level":
      toggleLevel(goal, level);
      break;
    case "remove-level":
      removeLevel(goal, level);
      break;
    case "add-subgoal":
      addSubGoal(id, byId("new-subgoal-" + id) ? byId("new-subgoal-" + id).value : "");
      break;
    case "toggle-subgoal":
      toggleSubGoal(goal, sub);
      break;
    case "remove-subgoal":
      removeSubGoal(goal, sub);
      break;
    case "ask-remove-goal":
      state.ui.confirmingDeleteGoalId = id;
      render();
      break;
    case "cancel-remove-goal":
      state.ui.confirmingDeleteGoalId = null;
      render();
      break;
    case "confirm-remove-goal":
      removeGoal(id);
      break;
    case "move-goal":
      moveGoal(id, dir);
      break;

    // records
    case "start-new-record":
      state.ui.creatingRecord = true;
      render();
      setTimeout(() => byId("new-record-name") && byId("new-record-name").focus(), 0);
      break;
    case "cancel-new-record":
      state.ui.creatingRecord = false;
      render();
      break;
    case "submit-new-record":
      addRecord(byId("new-record-name") ? byId("new-record-name").value : "");
      break;
    case "move-record":
      moveRecord(id, dir);
      break;
    case "ask-remove-record":
      state.ui.confirmingDeleteRecordId = id;
      render();
      break;
    case "cancel-remove-record":
      state.ui.confirmingDeleteRecordId = null;
      render();
      break;
    case "confirm-remove-record":
      removeRecord(id);
      break;
  }
}

// Frappe : on met à jour la donnée + on sauvegarde, SANS re-rendre le DOM
// (pour ne jamais perdre le focus / la position du curseur pendant la saisie).
function handleInput(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  const program = el.dataset.program;
  const ex = el.dataset.ex;
  const setId = el.dataset.set;
  const idx = el.dataset.idx;
  const id = el.dataset.id;
  const goal = el.dataset.goal;
  const sub = el.dataset.sub;

  switch (a) {
    case "ex-name":
      updateExerciseName(program, ex, el.value);
      break;
    case "alt-field":
      updateAlternate(program, ex, Number(idx), el.value);
      break;
    case "set-field":
      updateSetField(program, ex, setId, el.dataset.field, el.value);
      break;
    case "type-name":
      updateTypeField(id, "name", el.value);
      break;
    case "type-field":
      updateTypeField(id, el.dataset.field, el.value);
      break;
    case "goal-title":
      updateGoalTitle(id, el.value);
      break;
    case "goal-unit":
      updateGoalUnit(id, el.value);
      break;
    case "subgoal-title":
      updateSubGoalTitle(goal, sub, el.value);
      break;
  }
}

// Changement "validé" (perte de focus pour texte, immédiat pour select) : on peut re-rendre.
function handleChange(e) {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  const program = el.dataset.program;
  const ex = el.dataset.ex;
  const id = el.dataset.id;

  switch (a) {
    case "ex-type":
      updateExerciseType(program, ex, el.value);
      break;
    case "schedule-day":
      updateScheduleDay(el.dataset.day, el.value);
      break;
    case "record-field":
      updateRecordFieldAndRender(id, el.dataset.field, el.value);
      break;
  }
}

function handleKeydown(e) {
  if (e.key !== "Enter") return;
  const id = e.target.id || "";
  if (id === "new-program-name") byId("app-root").querySelector('[data-action="submit-new-program"]').click();
  else if (id === "new-goal-title") byId("app-root").querySelector('[data-action="submit-new-goal"]').click();
  else if (id === "new-record-name") byId("app-root").querySelector('[data-action="submit-new-record"]').click();
  else if (id.startsWith("new-level-")) {
    const goalId = id.replace("new-level-", "");
    addLevel(goalId, e.target.value);
  } else if (id.startsWith("new-subgoal-")) {
    const goalId = id.replace("new-subgoal-", "");
    addSubGoal(goalId, e.target.value);
  }
}

/* ============================================================
   INIT
   ============================================================ */

function init() {
  loadState();
  render();
  const root = byId("app-root");
  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  root.addEventListener("keydown", handleKeydown);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
