# Comprehensive Fixes and Features Plan

## CRITICAL FIXES (User reports as broken)

### 1. Today Button
**Issue:** Jumps to wrong location
**Root Cause Investigation Needed:**
- Check if scroll position is being set
- Verify setViewRange is actually updating state
- Check if any other code is overriding the view
**Fix Strategy:**
- Add scroll-to-today functionality
- Ensure view update triggers re-render
- Add visual confirmation

### 2. Table/Gantt Alignment
**Issue:** Rows don't line up 1:1
**Current State:** Both have height: '48px'
**Possible Causes:**
- Header height mismatch
- Border-box vs content-box
- Scrollbar affecting layout
- Row borders adding pixels
**Fix Strategy:**
- Measure exact header heights
- Ensure consistent box-sizing
- Account for all borders
- Sync scrolling

### 3. Export Functionality
**Issue:** Not capturing full content
**Current Code:** Temporarily expands element
**Possible Issues:**
- Style changes not taking effect before capture
- Html2canvas not seeing expanded content
- Timing issue
**Fix Strategy:**
- Add delay after style change
- Clone element approach
- Or use different capture method

### 4. Excel-like Navigation
**Issue:** User says it's not working
**Current Code:** Implemented keyboard handlers
**Possible Issues:**
- Events not bubbling correctly
- Focus not on input
- Event.preventDefault not working
**Fix Strategy:**
- Verify event listeners are attached
- Ensure focus management
- Test each key combination

## NEW FEATURES

### 5. Fix Hover Animation
**Issue:** Bars raise too far on hover
**Current:** Likely using transform: translateY
**Fix:** Reduce transform amount

### 6. Right-Click Context Menu
**Requirements:**
- Custom menu on right-click
- Position at mouse cursor
- Close on click outside
**Implementation:**
- Create ContextMenu component
- Track mouse position
- Handle outside clicks

### 7. Task Edit Modal
**Requirements:**
- Open on right-click option
- Edit all task fields
- Save/cancel
**Implementation:**
- Create TaskEditModal component
- Form with all fields
- Validation
- Save handler

### 8. Sort/Filter/Group/Search
**Requirements:**
- Sort by any column
- Filter by multiple criteria
- Group by field values
- Global search
- Use imported data columns intelligently
**Implementation:**
- Add toolbar with controls
- Implement each function separately
- Combine intelligently
- Persist preferences

## IMPLEMENTATION ORDER

### Phase 1: Critical Bug Fixes (30 min)
1. Debug and fix Today button
2. Debug and fix alignment
3. Debug and fix export
4. Debug and fix navigation

### Phase 2: Quick Fixes (15 min)
5. Fix hover animation

### Phase 3: Context Menu (30 min)
6. Build right-click menu
7. Integrate with Gantt

### Phase 4: Edit Modal (45 min)
8. Build edit modal component
9. Wire up to context menu

### Phase 5: Sort/Filter/Group/Search (90 min)
10. Design toolbar UI
11. Implement sort
12. Implement filter
13. Implement group
14. Implement search
15. Integrate all features

Total Estimated Time: 3-4 hours

## CODE QUALITY STANDARDS
- No placeholders
- Professional TypeScript
- Follow existing patterns
- Proper error handling
- Clean, maintainable code
