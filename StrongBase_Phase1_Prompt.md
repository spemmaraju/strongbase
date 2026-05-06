# StrongBase — Phase 1 Build Prompt for Claude Code

I want to build a personal fitness tracking web app called **StrongBase** — a 7-day strength training program for a beginner with home equipment and an L5-S1 discectomy history (no exercises that stress the lower back).

---

## Tech Stack

- React + Vite
- Tailwind CSS
- React Router for navigation
- Supabase (for auth and cross-device sync — set up in a later phase, ignore for now)
- Deployed to Vercel (later phase)

---

## Equipment Available

- 10lb dumbbells
- 15lb dumbbells
- Yoga mat
- 4 resistance loop bands (varying resistance)

---

## L5-S1 Safety Rule (STRICT)

Zero exercises with spinal flexion under load. No crunches, no sit-ups, no Russian twists, no Jefferson curls, no leg raises that hyperextend the lumbar. All core work must be anti-extension or hip-dominant only (dead bug, bird-dog, glute bridge, pallof press, side plank are all fine).

---

## Phase 1 Only

Do not build anything beyond Phase 1 until I explicitly say so.

---

## 1. Project Scaffold

React + Vite + Tailwind CSS. Install React Router. Folder structure:

```
/src
  /data
    exercises.json
    weeklyPlan.json
  /components
  /pages
  /hooks
  main.jsx
  App.jsx
```

---

## 2. exercises.json

A static JSON array at `/src/data/exercises.json`. Include at least 35 unique exercises covering warm-up, strength, stability, flexibility, and cardio categories. Use the full equipment set across the library.

Each exercise object must have ALL of these fields:

```json
{
  "id": "dead-bug",
  "name": "Dead Bug",
  "category": "stability",
  "equipment": ["bodyweight", "yoga-mat"],
  "targetMuscles": ["core", "transverse abdominis", "hip flexors"],
  "sets": 3,
  "reps": 10,
  "durationSeconds": null,
  "restSeconds": 30,
  "instructions": [
    "Lie flat on your back on the mat with arms pointing straight up toward the ceiling and knees bent at 90 degrees directly above your hips (tabletop position).",
    "Take a deep breath in. As you exhale, slowly lower your right arm overhead toward the floor while simultaneously straightening and lowering your left leg toward the floor.",
    "Lower both limbs until they are just above the floor — do not let your lower back arch away from the mat. If it arches, don't go as low.",
    "Inhale and return both limbs to the starting position in a controlled manner.",
    "Repeat on the opposite side (left arm + right leg) — that is one full rep."
  ],
  "cues": [
    "Press your lower back firmly into the mat throughout the entire movement",
    "Move slowly — this is not a speed exercise, it is a control exercise",
    "Breathe out as you lower, breathe in as you return"
  ],
  "youtubeId": "4XLEnwUr1d8",
  "modification": "Instead of fully extending your leg, only lower it halfway down and keep a slight bend in the knee.",
  "backSafe": true
}
```

### Field rules:

- Use `reps` (number) for rep-based exercises. Use `durationSeconds` (number, set `reps` to null) for timed holds like planks.
- `youtubeId` must be a real, accurate YouTube video ID demonstrating this specific exercise clearly. Prefer videos from reputable fitness channels (MindPump TV, AthleanX, Calisthenicmovement, Yoga with Adriene for stretches, or similar). Double-check each ID is valid.
- Every single exercise must have `"backSafe": true`. There are no exceptions.
- Instructions must be detailed enough for someone who has never done the exercise. Minimum 4 steps, ideally 5.

### Exercise coverage required across the library:

- **Warm-up mobility:** arm circles, hip circles, leg swings, cat-cow, thoracic rotation
- **Bodyweight strength:** push-ups, glute bridges, squats, lunges, wall sits, step-back lunges, bird-dog
- **Dumbbell exercises (10lb/15lb):** bicep curls, shoulder press, lateral raises, bent-over rows, goblet squats, tricep kickbacks, chest press on mat, single-leg deadlift with light weight, reverse fly
- **Resistance band exercises:** pallof press, banded glute bridge, clamshells, banded lateral walk, banded pull-apart, banded face pull
- **Flexibility/cool-down:** modified pigeon pose, supine figure-4 stretch, child's pose, doorway chest stretch, seated hamstring stretch, hip flexor stretch

---

## 3. weeklyPlan.json

A static JSON at `/src/data/weeklyPlan.json`:

```json
{
  "planName": "StrongBase Week 1",
  "days": [
    {
      "day": 1,
      "theme": "Full Body Foundation",
      "focusArea": "Mobility, stability, and light full-body activation",
      "durationMinutes": 45,
      "exerciseIds": ["...ordered array of exercise IDs..."]
    }
  ]
}
```

### Day themes and exercise rules:

- **Day 1 – Full Body Foundation:** Warm-up → bodyweight basics (glute bridge, wall sit, push-up, bird-dog, dead bug) → cool-down. Introductory volume — 2 sets per exercise, nothing too fatiguing.
- **Day 2 – Push Day:** Warm-up → chest press on mat, shoulder press (15lb), lateral raises (10lb), tricep kickbacks, push-up variations → cool-down. Upper body push focus.
- **Day 3 – Hinge & Glutes:** Warm-up → banded glute bridge, clamshells, single-leg glute bridge, banded lateral walk, goblet squat (10lb), step-back lunge → cool-down. Zero lumbar load — all hip-dominant.
- **Day 4 – Active Recovery & Mobility:** Entirely bodyweight, band-optional, yoga/mobility focus. Cat-cow, thoracic rotation, pigeon pose modified, child's pose, seated hamstring stretch, hip flexor stretch, supine figure-4. Keep heart rate low. This is a rest-active day.
- **Day 5 – Pull Day:** Warm-up → bent-over rows (15lb), bicep curls (10lb then 15lb), banded pull-apart, banded face pull, reverse fly (10lb) → cool-down. Upper body pull focus.
- **Day 6 – Core & Stability:** Warm-up → dead bug, bird-dog, side plank (timed), pallof press with band, glute bridge hold (timed), forearm plank (timed) → cool-down. All core work is anti-extension/anti-rotation.
- **Day 7 – Full Body Circuit:** Warm-up → 3 circuits of 4 exercises each (mix of strength + stability), timed rounds → cool-down. Fun, energetic finish to the week.

### Each day must have:

- 2–3 warm-up exercises at the start (category: "warm-up")
- 4–6 main exercises in the middle (category: "strength", "stability", or "cardio")
- 2–3 cool-down stretches at the end (category: "flexibility")
- All exerciseIds must exist in exercises.json

---

## 4. Home Screen (`/`)

Layout — mobile-first, 390px base width:

- Top: App name "StrongBase 💪" in large bold white text, subtitle "Build the habit. Own the week."
- A 7-day horizontal scrollable strip. Each day is a card showing: day number, theme name (short), and a small emoji representing the theme. Today's recommended day (use day-of-week logic: Monday = Day 1, Tuesday = Day 2, Wednesday = Day 3, Thursday = Day 4, Friday = Day 5, Saturday = Day 6, Sunday = Day 7) is highlighted in teal. Tapping any day navigates to `/day/:dayNumber`.
- A streak section: "🔥 Current Streak: 0 days" (hardcoded for Phase 1).
- A "Start Today's Workout" CTA button that navigates to the current day's overview.
- A motivational quote (pick 5 rotating quotes, cycle them based on date so they change daily).

---

## 5. Day Overview Screen (`/day/:dayNumber`)

Layout:

- Header: Day number, theme name, focus area description, total time badge ("⏱ 45 min").
- Section headers dividing the exercise list into "Warm-Up", "Main Workout", "Cool-Down" based on exercise category.
- Each exercise row shows:
  - Exercise name (bold)
  - Sets × reps OR duration (e.g., "3 × 12 reps" or "3 × 30 sec hold")
  - Target muscles (small grey text)
  - Equipment needed (small badge)
  - A "ⓘ" info button on the right
- Tapping the "ⓘ" info button opens an Exercise Detail Modal (see section 6).
- At the bottom: a large "▶ Start Workout" button. For Phase 1, this navigates to `/workout/:dayNumber` which just shows a placeholder: "Workout Player — Coming in Phase 2".
- Back navigation to home.

---

## 6. Exercise Detail Modal

Triggered by tapping "ⓘ" on any exercise. Full-screen modal overlay.

Contains:

- Exercise name as header
- YouTube embed: `https://www.youtube.com/embed/{youtubeId}` in a responsive 16:9 iframe (full modal width, no border)
- "How to do it" section: numbered list of all instruction steps
- "Coaching Cues" section: 3 bullet points with a checkmark icon (✓)
- "Easier Modification" section: shown in a soft amber callout box
- Target muscles and equipment displayed as small badges
- A clearly visible close button (× top right)

---

## 7. Design System

### Colors

```
Background:       #0F172A   (dark navy)
Surface (cards):  #1E293B   (dark slate)
Primary:          #14B8A6   (teal)
Primary dark:     #0D9488
Text:             #F8FAFC   (near white)
Muted text:       #94A3B8   (slate grey)
Modification box: #FEF3C7 background, #92400E text  (amber)
Rest/divider:     #334155
```

### Typography

Use Inter font (import from Google Fonts). Headings bold, body regular.

### Feel

Clean, minimal, energetic. Not cluttered. Cards use `rounded-xl` and a subtle shadow. Teal accents on active states, highlights, and CTAs. All interactive elements have a minimum 44px touch target for mobile usability.

---

## 8. Required Tests — Run All Before Reporting Complete

Run all of the following tests and report the result of each one (pass/fail + notes) before telling me Phase 1 is done:

**TEST 1:** Load the home screen. Confirm all 7 day cards render with correct theme names.

**TEST 2:** Navigate to Day 3 overview. Confirm the exercises shown match the Day 3 exerciseIds in weeklyPlan.json and are split into correct sections (Warm-Up / Main Workout / Cool-Down).

**TEST 3:** On the Day 1 overview, tap the "ⓘ" button on the first 3 exercises in sequence. Confirm each modal opens, the YouTube iframe loads (check the embed URL is correctly formed), and instructions and cues are displayed.

**TEST 4:** Open browser DevTools, set viewport to 390×844 (iPhone 14). Confirm no horizontal scroll, no text cut-off, all buttons are tappable (min 44px touch targets), YouTube embed is responsive.

**TEST 5:** Count exercises in exercises.json — confirm at least 35 unique entries.

**TEST 6:** For every exerciseId in weeklyPlan.json across all 7 days, confirm there is a matching entry in exercises.json (no broken references).

**TEST 7:** Confirm every exercise in exercises.json has `"backSafe": true`.

**TEST 8:** Tap "Start Today's Workout" on the home screen — confirm it navigates to the correct day based on today's day of week.

**TEST 9:** Navigate directly to `/day/4` (Active Recovery day). Confirm all exercises are low-intensity, bodyweight or band-only, and none are dumbbell strength exercises.

**TEST 10:** Confirm the motivational quote on the home screen is displaying (any of the 5 is acceptable).

---

**Fix any failing tests before reporting back. Do not begin Phase 2 until I approve Phase 1.**

---

## Phase Roadmap (do not build — for context only)

- **Phase 2:** Workout Player with live timers, rest periods, exercise progression
- **Phase 3:** Streaks, completion celebrations, confetti, gamification
- **Phase 4:** Supabase Auth + cross-device sync
- **Phase 5:** Workout history, calendar heatmap, weekly summaries
- **Phase 6:** Polish — sound cues, animations, motivational system
- **Phase 7 (V2):** AI Plan Evolution — user shares workout history, Claude API generates a personalized new 7-day plan with progressive overload
