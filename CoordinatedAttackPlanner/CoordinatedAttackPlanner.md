# Tribal Wars Coordinated Attack Planner - Design Spec

## Overview

This script will help Tribal Wars players coordinate attacks from multiple villages to multiple targets, ensuring all attacks land at the desired time. The tool will automate the calculation of launch times, provide live countdowns, and allow easy sharing/importing of plans among tribe members. It will **not** automate sending (to comply with game rules), but will make manual execution as easy as possible.

---

## File Organization & Architecture

As the codebase grows, the script will be organized into multiple modules for maintainability and clarity:

### Core Files Structure
1. **CoordinatedAttackPlanner.js** - Main entry point and orchestration
2. **cap-ui.js** - All UI components, styling, and DOM manipulation
3. **cap-validation.js** - Player and tribe validation logic
4. **cap-state.js** - State management and data structures
5. **cap-export.js** - Export/import functionality (when implemented)
6. **cap-execution.js** - Plan execution logic (when implemented)

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
  - For each target, specify the exact arrival time (server time, with ms precision).
- **Assign Units/Templates:**  
  - Template selection is **not** part of the plan. The user will select templates themselves at import/use time. The plan can leave the template field empty.

---

## Template Selection & Plan Finalization

### Problem Statement

Operations (ops) may span hours or days, making it impractical to require users to keep their browser open or to rely solely on in-memory template selections. Additionally, the initial plan string does not contain the user's template choices. Therefore, a mechanism is needed to persistently store template selections within the plan, allowing users to finalize and save their choices for later execution.

### Solution

#### Plan Structure
- Each attack entry in the plan JSON includes a `template` field.
- When the plan is created by the planner, all `template` fields are initialized as empty strings (`""`).
- The planner cannot modify the `template` fields via the UI; only the user (the plan recipient) can set these fields during the import/finalization phase.

#### Import & Template Assignment Workflow
- When a user imports a plan:
  - The script checks all `template` fields in the plan.
  - **If any `template` field is empty or references a template that does not exist in the user's account:**
    - The script displays a **Template Assignment Screen**.
    - The user is prompted to select a template for each attack (from their available in-game templates).
    - After all templates are assigned and validated, the user clicks a **"Finalize Plan"** button.
    - The script updates the plan JSON with the selected templates and generates a new base64-encoded plan string.
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

### Phase 1: Core Infrastructure
- [x] Main entry point and UI framework
- [x] Target player selection with validation
- [x] Basic tribe functionality
- [ ] **Next:** Split into modular files (cap-ui.js, cap-validation.js, cap-state.js)

### Phase 2: Plan Creation
- [ ] Village selection (attacking and target)
- [ ] Attack configuration table
- [ ] Landing time specification
- [ ] Export functionality

### Phase 3: Plan Execution
- [ ] Import functionality
- [ ] Template assignment screen
- [ ] Execution screen with countdowns
- [ ] Launch buttons and attack sending

### Phase 4: Polish & Features
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

## Next Steps

1. ✅ Review and iterate on this spec.
2. ✅ Mock up UI wireframes.
3. ✅ Define data structures for export/import.
4. ✅ Plan module structure and integration with TWSDK.
5. ✅ Begin implementation.
6. **🔄 Current:** Split existing code into modular files for better maintainability.

---

*Feedback and suggestions welcome.*