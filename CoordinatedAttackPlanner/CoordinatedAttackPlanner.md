# Tribal Wars Coordinated Attack Planner - Design Spec

## Overview

This script will help Tribal Wars players coordinate attacks from multiple villages to multiple targets, ensuring all attacks land at the desired time. The tool will automate the calculation of launch times, provide live countdowns, and allow easy sharing/importing of plans among tribe members. It will **not** automate sending (to comply with game rules), but will make manual execution as easy as possible.

---

## File Organization & Architecture

As the codebase grows, the script will be organized into multiple modules for maintainability and clarity:

### Core Files Structure
1. **CoordinatedAttackPlanner.js** - Main entry point and orchestration ✅
2. **modules/cap-ui.js** - All UI components, styling, and DOM manipulation ✅
3. **modules/cap-validation.js** - Player and tribe validation logic ✅
4. **modules/cap-state.js** - State management and data structures ✅
5. **modules/cap-export.js** - Export/import functionality (planned)
6. **modules/cap-execution.js** - Plan execution logic (planned)
7. **plan.schema.json** - JSON Schema for plan validation and documentation ✅
8. **buildCoordinatedAttacker.ps1** - Build script for combining modules ✅

### Module Loading Strategy
- **Main file** acts as orchestrator and loads other modules dynamically
- **No external dependencies** beyond what's already available in Tribal Wars
- **Error handling** for failed module loads with graceful degradation

### Benefits of Modular Approach
- **Separation of concerns** - UI separate from business logic
- **Maintainability** - Easier to find and modify specific functionality
- **Testability** - Individual modules can be developed/tested independently
- **Scalability** - Easy to add new features without touching existing code

---

## Plan Export Format & JSON Schema

### JSON Structure
The plan export format uses a well-defined JSON structure that is base64-encoded for sharing:

```json
{
  "version": "1.0",
  "createdAt": "2025-09-05T10:30:00.000Z",
  "exportedAt": "2025-09-05T10:35:00.000Z",
  "planName": "Operation Example",
  "description": "Coordinated attack on enemy tribe",
  "attacks": [
    {
      "id": "attack_1725534600_abc123def",
      "attackingVillage": "500|500",
      "targetVillage": "501|501",
      "sendTime": "",
      "template": "",
      "slowestUnit": "",
      "arrivalTime": "2025-09-05T12:30:00.000Z",
      "notes": "Main attack"
    }
  ]
}
```

### JSON Schema Validation
- **Schema File:** `plan.schema.json` provides complete validation rules
- **Validation Features:**
  - Required field validation
  - Format validation (coordinates, timestamps)
  - Enum validation for unit types
  - String length constraints
  - Pattern matching for IDs and coordinates

### Key Fields
- **template** and **slowestUnit**: Empty strings during planning phase, filled during finalization
- **sendTime**: When the attack should be sent (empty during planning, calculated at import time)
- **arrivalTime**: When the attack should land (user-specified landing time)
- **attackingVillage**: Coordinates of the attacking village (e.g., "500|500")
- **targetVillage**: Coordinates of the target village (e.g., "501|501")
- **id**: Unique identifier with pattern `attack_\d+_[a-z0-9]+`

---

## Core Features

### 1. **Target & Attack Selection**
- **Plan is Per-Player:**  
  - Each plan is created for a specific player (the "user" of the plan). The planner selects the player at the start of the design phase.
- **Select Attacking Villages:**  
  - Once a player is selected, the planner can choose from that player's villages (populated via dropdown).
- **Select Target Villages:**  
  - Targets can be added by entering coordinates (comma-separated), or by selecting a target player and choosing from their villages via dropdown.
- **Flexible Attack Assignment:**  
  - Attacks are defined by adding rows. Each row allows the planner to select one attacking village and one target village.
  - Supports 1:1, many:1, or any combination of attacking and target villages.
  - "Add Attack" button creates a new row for custom assignments.
  - "Mass Add" button allows adding attacks from every attacking village to every target village (useful for mass fakes).
- **Set Desired Landing Time:**  
  - For each attack, specify the exact arrival time (landing time) in format YYYY-MM-DD HH:MM:SS (server time).
  - The system validates that landing times are in the future.
- **Assign Units/Templates:**  
  - Template selection is **not** part of the plan creation phase. Users will select templates during import/finalization.
  - The plan exports with empty `template` and `slowestUnit` fields to be filled during finalization.

---

## Template Selection & Plan Finalization

### Problem Statement

Operations (ops) may span hours or days, making it impractical to require users to keep their browser open or to rely solely on in-memory template selections. Additionally, the initial plan string does not contain the user's template choices. Therefore, a mechanism is needed to persistently store template selections within the plan, allowing users to finalize and save their choices for later execution.

### Solution

#### Plan Structure
- Each attack entry in the plan JSON includes `template` and `slowestUnit` fields.
- When the plan is created by the planner, all `template` and `slowestUnit` fields are initialized as empty strings (`""`).
- The planner cannot modify these fields via the UI; only the user (the plan recipient) can set these fields during the import/finalization phase.

#### Import & Template Assignment Workflow
- When a user imports a plan:
  - The script checks all `template` and `slowestUnit` fields in the plan.
  - **If any `template` field is empty or references a template that does not exist in the user's account:**
    - The script displays a **Template Assignment Screen**.
    - The user is prompted to select a template for each attack (from their available in-game templates).
    - After all templates are assigned and validated, the user clicks a **"Finalize Plan"** button.
    - The script updates the plan JSON with the selected templates and determines the `slowestUnit` for each attack.
    - The script generates a new base64-encoded plan string with the finalized data.
    - The user can save or export this finalized plan for later use.
  - **If all `template` fields are valid:**
    - The script displays the **Execution Screen** with calculated launch times, countdowns, and launch buttons.

#### Execution Screen
- Only shown when all attacks have valid templates assigned.
- Launch times and countdowns are calculated based on the slowest unit in each selected template.
- Attacks are sorted by launch time.
- If the user wishes to change a template, they must return to the Template Assignment Screen, update the template, and re-finalize the plan.

#### Validation
- The script validates that each selected template exists in the user's account and contains at least one unit.
- If a template is missing or invalid, the user is prompted to correct it before finalizing.

#### Persistence
- The finalized plan (with templates assigned) is exportable as a new base64-encoded JSON string.
- This allows the user to close their browser and return later, importing the finalized plan to proceed directly to execution.

---

## Calculation & Scheduling

- **Calculate Launch Times:**  
  - For each attack, calculate the exact server launch time needed to hit the landing time, considering unit speed, world speed, and distance. The slowest unit in the selected template determines the travel speed.
- **Display Countdown Timers:**  
  - Show a live countdown for each attack, updating every second.
- **Manual Launch:**  
  - Provide a button for each attack to open/send the attack manually when the timer hits zero.
  - After the timer hits zero, the row's appearance changes to indicate the time has passed, but the launch button remains active so the user can still send the attack if slightly late.

---

## Export/Import & Sharing

- **Export Plan:**  
  - Export the full attack plan (all attacks, times, assignments, and templates if finalized) as a JSON or shareable base64-encoded string.
- **Import Plan:**  
  - Allow importing a plan to view/execute attacks.
  - If the import is invalid (bad base64 or JSON), show a clear red error popup: "Invalid plan, unable to import."
- **Easy Sharing:**  
  - Plans are **not** shared tribe-wide. Each plan is created for a specific player and shared with them individually.

---

## User Interface

- **Initial Screen:**  
  - On script load, the user is presented with the option to **Create a Plan** (planner mode) or **Import a Plan** (user mode).
  - This unified approach keeps the workflow seamless and avoids confusion between separate scripts.
- **Attack Table:**  
  - Each row: Attacking village, target village, landing time, launch time, countdown, template dropdown (user selects at use time or during template assignment), launch button.
- **Bulk Actions:**  
  - Select/deselect all, filter by group, filter by target, etc.
- **Template Management:**  
  - No template management in the plan. The user selects templates from their own in-game templates at use time.
- **Visual Indicators:**  
  - Highlight attacks that are due soon, missed, or completed. The timer is the main indicator; color is secondary.
- **Design for Desktop:**  
  - The UI is designed for desktop use with dropdowns and scrollbars. Mobile support is not a concern.

---

## Customization & Flexibility

- **Customizable Templates:**  
  - Players must create their own templates in-game before using the script. The script will utilize existing templates only.
- **Adjustable Offsets:**  
  - Optionally add a launch offset (ms) for each attack.
- **Notes/Comments:**  
  - Allow adding notes per attack (e.g., "clear with axe first").

---

## Example Workflow

1. **Create Plan:**
   - Select the player who will use the plan.
   - Select that player's villages to participate as attackers.
   - Add target villages (by coordinates or by selecting a target player and choosing their villages).
   - Add attacks by creating rows, each specifying an attacking village and a target village. Use "Add Attack" for custom assignments or "Mass Add" for all-to-all.
   - Set landing times for each attack.
   - Leave the template field empty; the user will select templates at use time.

2. **Export & Share:**
   - Export the plan as a base64-encoded JSON string or file.
   - Share the plan with the specific player for whom it was created.

3. **Import & Template Assignment:**
   - The player imports the plan.
   - If any template field is empty or invalid, the Template Assignment Screen is shown.
   - The user selects a template for each attack from their available in-game templates.
   - Once all templates are assigned and valid, the user finalizes and exports a new plan string for later use.

4. **Import & Execute:**
   - The player imports the finalized plan.
   - All required attacks are displayed with live countdowns.
   - When a timer hits zero, the launch button can be clicked to open/send the attack. The button remains active even after the timer expires.

---

## Technical Notes

- **No Automation:**  
  - Script will not auto-send attacks; user must click to launch.
- **Server Time Sync:**  
  - All timers based on server time for accuracy.
- **Persistence:**  
  - Plans and progress are not saved anywhere. They are only exportable/importable via base64-encoded JSON.
- **Compatibility:**  
  - Should be utilizable by saving it to the quick bar and clicking the link.
- **Error Handling:**  
  - Invalid imports (bad base64 or JSON) show a clear red error popup.
- **No Mobile Support:**  
  - Mobile is not supported or a design concern.
- **Modular Architecture:**  
  - Code split across multiple files for maintainability, loaded dynamically by main script.

---

## Development Phases

### Phase 1: Core Infrastructure ✅ COMPLETED
- [x] Main entry point and UI framework
- [x] Target player selection with validation
- [x] Basic tribe functionality
- [x] Split into modular files (cap-ui.js, cap-validation.js, cap-state.js)
- [x] Build script for module combination
- [x] JSON Schema definition for plan validation

### Phase 2: Plan Creation ✅ COMPLETED
- [x] Village selection (attacking and target)
- [x] Attack configuration table with CRUD operations
- [x] Individual attack addition with validation
- [x] Mass attack creation (all-to-all combinations)
- [x] Landing time specification and validation
- [x] Duplicate attack prevention
- [x] Attack management (add, remove, clear all)
- [x] Progress feedback for batch operations
- [ ] **Next:** Export functionality

### Phase 3: Plan Execution (PLANNED)
- [ ] Import functionality
- [ ] Template assignment screen
- [ ] Execution screen with countdowns
- [ ] Launch buttons and attack sending

### Phase 4: Polish & Features (PLANNED)
- [ ] Error handling improvements
- [ ] Performance optimizations
- [ ] Additional customization options

---

## Open Questions (with Answers)

- **Should templates be global, per-user, or per-plan?**  
  - **Answer:** Per user. Templates are not part of the plan; users select them at use time.
- **Should the UI allow for drag-and-drop reordering of attacks?**  
  - **Answer:** No. Attacks are sorted by chronological launch time.
- **How should the script handle changes to world speed/unit speed (e.g., mid-plan)?**  
  - **Answer:** Not applicable. World/unit speed is fixed at server creation time.
- **Should there be a "dry run" mode for practice?**  
  - **Answer:** No.
- **How to best handle time zone/server time confusion for less experienced users?**  
  - **Answer:** No conversion or help. All times are server time only.
- **Should the planning script and user script be separate?**  
  - **Answer:** No. The initial screen should give the user an option to create or import a plan, keeping the workflow unified and simple.
- **How should we organize the growing codebase?**
  - **Answer:** Split into focused modules (UI, validation, state, etc.) loaded dynamically by the main file.

---

## Current Implementation Status

### ✅ Completed Features

#### Modular Architecture
- **Separated concerns** into focused modules:
  - `cap-state.js`: State management and data structures
  - `cap-ui.js`: UI components, dialogs, and DOM manipulation
  - `cap-validation.js`: Player and tribe validation logic
- **Build system** with PowerShell script for module combination
- **Error handling** and validation throughout the codebase

#### Target & Village Selection
- **Player validation** with API calls to verify player existence
- **Tribe support** for adding all members of a tribe as targets
- **Village selection** from verified players with dropdown UI
- **Recent targets** persistence for quick access
- **Flexible target management** (add/remove individual players and villages)

#### Attack Management
- **Individual attack creation** with validation and duplicate prevention
- **Mass attack creation** for all-to-all combinations with:
  - Time spreading (staggered landing times)
  - Batch processing with progress feedback
  - Preview functionality
  - Duplicate detection and skipping
- **Attack table display** with remove/edit actions
- **State persistence** during session

#### Data Validation
- **Landing time validation** with future-time checking
- **Coordinate format validation** (xxx|yyy pattern)
- **Duplicate attack prevention** 
- **Input sanitization** and error messaging

#### JSON Schema
- **Complete schema definition** in `plan.schema.json`
- **Validation rules** for all plan fields
- **Documentation** of export format structure
- **Field constraints** and pattern matching

### 🔄 Currently In Progress
- **Plan export functionality** - Converting current plan state to base64-encoded JSON

### 📋 Planned Next
- Import functionality with template assignment workflow
- Execution screen with launch time calculations and countdowns
- Template validation and assignment UI

---

## Next Steps

1. ✅ Review and iterate on this spec.
2. ✅ Mock up UI wireframes.
3. ✅ Define data structures for export/import.
4. ✅ Plan module structure and integration with TWSDK.
5. ✅ Begin implementation.
6. ✅ Split existing code into modular files for better maintainability.
7. ✅ Implement attack management (add, remove, mass add).
8. ✅ Create JSON Schema for plan validation.
9. **🔄 Current:** Implement plan export functionality.
10. **📋 Next:** Implement import and template assignment workflow.

---

*Feedback and suggestions welcome.*