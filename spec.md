# Cal AI - Calorie Tracking App

## Current State
Scaffolded project with empty backend and default frontend shell. No features implemented yet.

## Requested Changes (Diff)

### Add
- **Onboarding / Auth flow**: Login or Sign Up screen using Internet Identity (passkey-based). After signup, a multi-step onboarding wizard collects: first name, last name, birthday, weight, goal (lose/maintain/gain/other), gender, exercise frequency (none/1/2/3/4+ times/week), ingredient avoidances (sugar, cholesterol, salt, etc.).
- **Daily calorie calculation**: Based on user profile (age, weight, gender, exercise level, goal) compute a daily calorie target using Harris-Benedict formula.
- **Home tab**: Shows remaining calories at top (e.g. "1700 / 2000 cal"), animated progress ring/bar. Plus button at bottom opens food logging options: "Calorie AI" (camera photo analysis via HTTP outcall to nutrition API) or "Manual Entry" (food name, calories, serving size).
- **Food photo analysis**: Camera capture -> HTTP outcall to a nutrition analysis endpoint -> display nutrition specs (calories, sugar, salt, cholesterol, protein, fat, carbs) -> badge: Recommended (green) / Okay (yellow) / Not Recommended (red) based on user's ingredient avoidances and macros.
- **Manual food entry**: Input food name, calories, serving size; stores entry.
- **Analytics tab**: Line/bar chart showing daily calorie intake over time, with breakdowns by macros.
- **Settings**: Edit profile fields (calorie goal, weight, ingredient avoidances, etc.).
- **Animations**: Smooth onboarding transitions, animated calorie ring on home screen, food logging animations.

### Modify
- Backend actor to store user profiles and food log entries.

### Remove
- Nothing (new project).

## Implementation Plan
1. Backend: user profile CRUD, food log entry CRUD, daily calorie calculation logic.
2. Frontend onboarding: multi-step wizard with animations and form validation.
3. Frontend home: calorie ring with remaining calories, FAB for food logging.
4. Frontend food log modal: camera tab using camera component + HTTP outcall for nutrition, manual tab.
5. Frontend analytics: chart displaying weekly calorie history.
6. Frontend settings: edit profile.
7. Wire authorization component for login/signup.
