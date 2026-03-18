# Cal AI

## Current State
FoodLogModal has inline camera inside a bottom sheet. Food log entries in HomeTab are non-clickable. AnalyticsTab shows weekly bar chart with short day labels and no drill-down.

## Requested Changes (Diff)

### Add
- Fullscreen camera overlay with centered scanner-frame overlay when taking a photo
- Pending food log entry showing thumbnail and searching spinner after photo is taken
- FoodDetailModal for viewing full nutrition of any logged food
- Analytics day rows show full dates like Mon March 11th, clickable to expand food list for that day, foods clickable to see detail

### Modify
- FoodLogModal camera tab: use fullscreen camera component
- HomeTab food log cards: make clickable to open FoodDetailModal
- AnalyticsTab: fetch per-day food logs, show full dates, drill-down list

### Remove
- Nothing

## Implementation Plan
1. Create FullscreenCamera.tsx - fullscreen video overlay with frame overlay and capture button
2. Create FoodDetailModal.tsx - detailed nutrition modal for a FoodLogEntry
3. Update FoodLogModal.tsx - use FullscreenCamera, add pending entry flow
4. Update HomeTab.tsx - pending entry state, clickable cards, FoodDetailModal wiring
5. Update AnalyticsTab.tsx - full date labels, per-day food log fetching, expandable day rows, FoodDetailModal
