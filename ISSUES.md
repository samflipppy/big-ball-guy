# GitHub Issues — Football Playbook Builder

Copy each issue below into GitHub. Labels and milestones are noted for each.

---

## Milestones

- **Phase 1: Canvas Core (MVP)** — Coach can draw plays on a field
- **Phase 2: Libraries & Concept Assembly** — 3-tap play creation with reusable components
- **Phase 3: Playbook Organization** — Folders, tags, search, visual browser
- **Phase 4: Game Planning & Scouting** — Weekly game plan, defensive ID, opponent tools
- **Phase 5: Output & Distribution** — Call sheets, wristbands, practice scripts, sharing
- **Phase 6: Future & AI** — Animation, voice-to-play, advanced features
- **Infrastructure** — Auth, database, deployment, performance, cross-cutting concerns

## Labels

- `epic` — Large feature area containing multiple sub-issues
- `core` — Critical path for MVP
- `feature` — New feature
- `ui/ux` — User interface / experience
- `data` — Data model / database
- `infra` — Infrastructure / deployment / DevOps
- `mobile` — Touch / tablet / responsive
- `print` — Print layouts and export
- `competitive` — Feature that directly beats PQD
- `future` — Post-MVP / later phase
- `bug` — Bug fix
- `chore` — Maintenance / tooling

---

## Phase 0: Project Setup

### Issue #1: Scaffold Next.js project with Tailwind and TypeScript
**Labels:** `infra`, `core`
**Milestone:** Phase 1

**Description:**
Initialize the project with:
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS 4
- ESLint + Prettier
- Basic folder structure: `app/`, `components/`, `lib/`, `types/`, `data/`

**Acceptance Criteria:**
- [ ] `npm run dev` starts the app
- [ ] Tailwind styles render correctly
- [ ] TypeScript compiles with no errors
- [ ] Basic layout shell with dark theme default

---

### Issue #2: Set up Supabase project and database schema
**Labels:** `infra`, `data`, `core`
**Milestone:** Phase 1

**Description:**
Create the Supabase project and define the core database schema:

```sql
-- Teams
teams (id, name, colors, logo_url, created_at)

-- Users / Coaches
coaches (id, team_id, email, name, role, created_at)

-- Formations
formations (id, team_id, name, side, personnel, player_positions jsonb, is_default, created_at)

-- Routes
routes (id, team_id, name, path_data jsonb, depth, tags, is_default, created_at)

-- Blocking Schemes
blocking_schemes (id, team_id, name, rules jsonb, is_default, created_at)

-- Defensive Fronts
defensive_fronts (id, team_id, name, player_positions jsonb, coverage, is_default, created_at)

-- Plays
plays (id, team_id, name, formation_id, concept, player_assignments jsonb, tags, notes, created_at, updated_at)

-- Playbooks
playbooks (id, team_id, name, side, created_at)
playbook_folders (id, playbook_id, parent_folder_id, name, sort_order)
playbook_plays (id, folder_id, play_id, sort_order)

-- Game Plans
game_plans (id, team_id, opponent, week, season, created_at)
game_plan_sections (id, game_plan_id, situation, defense_id, sort_order)
game_plan_plays (id, section_id, play_id, sort_order)

-- Practice Scripts
practice_scripts (id, team_id, game_plan_id, date, created_at)
practice_periods (id, script_id, name, sort_order)
practice_period_plays (id, period_id, play_id, sort_order, completed)

-- Call Sheets
call_sheets (id, game_plan_id, wristband_play_ids jsonb, created_at)

-- Scratch Pad
scratch_plays (id, coach_id, play_data jsonb, created_at)
```

**Acceptance Criteria:**
- [ ] Supabase project created
- [ ] All tables created with proper foreign keys
- [ ] Row Level Security (RLS) policies for team-based access
- [ ] TypeScript types auto-generated from schema

---

### Issue #3: Set up authentication flow
**Labels:** `infra`, `core`
**Milestone:** Phase 1

**Description:**
Implement auth using Supabase Auth:
- Email/password sign up and login
- Magic link (email) login for coaches who hate passwords
- Team creation on first sign up
- Invite flow: existing coach invites others to their team via email link
- Auth context provider wrapping the app

**Acceptance Criteria:**
- [ ] Coach can sign up with email
- [ ] Coach can log in with email/password or magic link
- [ ] Coach is associated with a team
- [ ] Protected routes redirect to login
- [ ] Auth state persists across page refreshes

---

### Issue #4: Deploy to Vercel with CI/CD
**Labels:** `infra`
**Milestone:** Phase 1

**Description:**
- Connect repo to Vercel
- Auto-deploy on push to main
- Preview deployments on PRs
- Environment variables for Supabase keys
- Custom domain setup (when ready)

**Acceptance Criteria:**
- [ ] Push to main triggers production deploy
- [ ] PR branches get preview URLs
- [ ] Supabase connection works in production

---

## Phase 1: Canvas Core (MVP)

### Issue #5: [EPIC] Play Designer Canvas
**Labels:** `epic`, `core`
**Milestone:** Phase 1

**Description:**
The core play designer — an HTML5 canvas where coaches draw plays. This is the single most important feature in the entire product. Everything else is built on top of it.

Sub-issues: #6, #7, #8, #9, #10, #11, #12, #13

---

### Issue #6: Build FieldCanvas component — football field renderer
**Labels:** `core`, `ui/ux`
**Milestone:** Phase 1

**Description:**
Render a football field on an HTML5 canvas (using Konva.js or Fabric.js):
- Yard lines every 5 yards with numbers (10, 20, 30, 40, 50, 40, 30, 20, 10)
- Hash marks (high school, college, or NFL — configurable)
- Sideline boundaries
- End zone (optional, for goal line plays)
- Green field background with white lines
- Dark mode variant (dark green/charcoal background)
- Responsive — fills available space, maintains aspect ratio
- Configurable zoom: show full field, red zone, or custom section

**Acceptance Criteria:**
- [ ] Field renders correctly at multiple sizes
- [ ] Yard lines, hashes, and numbers are accurate
- [ ] Dark mode looks clean
- [ ] Canvas is pannable and zoomable (pinch on touch, scroll wheel on desktop)

---

### Issue #7: Build PlayerIcon component — draggable player markers
**Labels:** `core`, `ui/ux`
**Milestone:** Phase 1

**Description:**
A player marker on the field canvas:
- Circle for offensive players (filled), triangle/X for defensive players
- Position label inside or adjacent (X, Z, H, Y, F, T, G, C, QB, RB, etc.)
- Customizable label text
- Draggable — tap/click and drag to reposition on the field
- Selected state: glow ring or highlight border
- Color: team offense color vs opponent defense color
- Snap to grid (subtle, optional)
- Size: large enough for finger tap targets on iPad (~44px minimum)

**Acceptance Criteria:**
- [ ] Players render with correct labels
- [ ] Players can be dragged to new positions (touch + mouse)
- [ ] Selected player shows visual highlight
- [ ] Offensive and defensive players are visually distinct
- [ ] Tap targets work on iPad (44px+ touch area)

---

### Issue #8: Build RouteLine component — route and assignment drawing
**Labels:** `core`, `ui/ux`
**Milestone:** Phase 1

**Description:**
Draw routes and blocking assignments on the field:
- **Route types:** receiver route (solid arrow), blocking assignment (thick line with flat end), motion (dashed line), option route (forked line)
- Path data stored as SVG-compatible points
- Arrowhead at the end of receiver routes
- Line styles: solid, dashed, wavy (for option routes)
- Color coding by type (routes = one color, blocks = another)
- Selectable — tap a route to select and edit/delete it

**Acceptance Criteria:**
- [ ] Routes render as smooth curves with arrowheads
- [ ] Blocking assignments render as thick directional lines
- [ ] Motion paths render as dashed lines
- [ ] Routes are selectable and deletable
- [ ] Route data is serializable to JSON

---

### Issue #9: Implement freehand route drawing with auto-clean
**Labels:** `core`, `ui/ux`, `competitive`
**Milestone:** Phase 1

**Description:**
When in "Draw" mode, the coach draws a route from a player with their finger/mouse:
1. Tap/click a player to start
2. Drag to draw the route path
3. Release to finish

The raw freehand input should be auto-cleaned:
- Smooth wobbly lines into clean curves and straight segments
- Detect sharp direction changes as crisp "break" points (not rounded)
- Snap to common depths (5, 8, 10, 12, 15, 20 yards) — subtle, not aggressive
- Show a ghost/preview line while drawing so coach sees the cleaned version in real-time
- Auto-add arrowhead at the route endpoint

**Algorithm approach:**
- Use Ramer-Douglas-Peucker for path simplification
- Detect angles > ~60° as hard breaks
- Catmull-Rom or cubic bezier for smooth sections
- Snap final point to nearest yard line if within threshold

**Acceptance Criteria:**
- [ ] Freehand drawing works on touch (iPad) and mouse
- [ ] Output routes look textbook-clean even from sloppy input
- [ ] Hard breaks (cuts) are crisp, not rounded
- [ ] Depth snapping works subtly
- [ ] Ghost line shows during drawing
- [ ] Works at 60fps with no lag

---

### Issue #10: Implement blocking assignment drawing
**Labels:** `core`, `ui/ux`
**Milestone:** Phase 1

**Description:**
Different blocking assignment visualization types:
- **Base block:** thick short arrow to the defender
- **Combo block:** two linemen connected, arrow to second-level backer
- **Pull:** curved line from OL position to kick-out/lead point
- **Zone step:** angled line showing zone blocking direction
- **Pass protection:** set/kick arc showing pass pro slide

Coach should be able to:
1. Select a lineman/blocker
2. Choose block type from a small contextual menu
3. Tap the target defender or drag to draw the assignment

**Acceptance Criteria:**
- [ ] All block types render distinctly
- [ ] Coach can assign blocks from the contextual player menu
- [ ] Blocks connect visually from blocker to target
- [ ] Pull and zone step paths look clean

---

### Issue #11: Build PlayRenderer component — composites everything
**Labels:** `core`
**Milestone:** Phase 1

**Description:**
The `PlayRenderer` composes FieldCanvas + PlayerIcons + RouteLines into a complete play diagram. This is the single most reused component in the app.

**Props:**
- `play: Play` — the play data object
- `defense?: Defense` — optional defensive overlay
- `editable: boolean` — whether the coach can modify it
- `size: 'full' | 'card' | 'thumbnail' | 'wristband'` — rendering size
- `highlights?: string[]` — highlight specific positions (for player-filtered views)
- `animated?: boolean` — play animation mode (future)

**Size variants:**
- `full` — fills the screen, interactive, used in play designer and quick sketch
- `card` — medium, used in game plan slots and scout cards
- `thumbnail` — small, used in playbook grid view
- `wristband` — tiny, used in call sheet and wristband cells

**Acceptance Criteria:**
- [ ] Renders a complete play from a Play data object
- [ ] All 4 size variants render correctly
- [ ] Editable mode allows player movement and route drawing
- [ ] Non-editable mode is read-only
- [ ] Defense overlay renders when provided
- [ ] Position highlighting dims non-highlighted players

---

### Issue #12: Canvas mode switching (Select / Draw / Pan)
**Labels:** `core`, `ui/ux`, `mobile`
**Milestone:** Phase 1

**Description:**
On touch devices, the coach's finger can mean different things. Implement clear mode switching:

- **Select mode (hand icon):** tap to select players, drag to move them
- **Draw mode (pencil icon):** finger draws routes/blocking from selected player
- **Pan mode (arrows icon):** finger scrolls/zooms the field

Implementation:
- Floating toolbar at bottom of screen (thumb-reachable on iPad)
- Active mode is visually highlighted
- Auto-mode switching: tap a player in Draw mode → starts drawing from that player
- On desktop: mode is inferred from context (click player = select, drag from player = draw, drag empty space = pan)

**Acceptance Criteria:**
- [ ] Mode toggle renders at bottom of canvas
- [ ] Each mode correctly interprets touch/mouse input
- [ ] Active mode is clearly visible
- [ ] Auto-mode switching works for common actions
- [ ] No accidental scrolls when drawing, no accidental draws when scrolling

---

### Issue #13: Undo/Redo system
**Labels:** `core`, `ui/ux`
**Milestone:** Phase 1

**Description:**
Implement a command-based undo/redo stack for the play editor:
- Every action (move player, draw route, delete route, change label) is a command
- Ctrl+Z / Cmd+Z to undo
- Ctrl+Y / Cmd+Shift+Z to redo
- Undo stack persists for the editing session (not across sessions)
- Visual undo/redo buttons in the toolbar for touch users

**Acceptance Criteria:**
- [ ] All canvas actions are undoable
- [ ] Keyboard shortcuts work
- [ ] Touch-friendly undo/redo buttons in toolbar
- [ ] Stack handles 50+ actions without performance issues

---

### Issue #14: Auto-save and local-first persistence
**Labels:** `core`, `infra`
**Milestone:** Phase 1

**Description:**
Implement the auto-save system:
1. Every change writes to IndexedDB immediately (debounced at 500ms for rapid changes like dragging)
2. Background sync to Supabase when online
3. Save indicator in UI corner: checkmark (saved), spinner (saving), warning (offline)
4. On page load: hydrate from IndexedDB first (instant), then sync with server

Use a library like Dexie.js for IndexedDB or build a simple wrapper.

**Acceptance Criteria:**
- [ ] Changes save to IndexedDB within 500ms
- [ ] Closing and reopening the tab restores the exact state
- [ ] Save indicator shows correct status
- [ ] Works fully offline (create/edit plays with no network)
- [ ] Syncs to Supabase when network is available
- [ ] No data loss on tab crash or phone sleep

---

### Issue #15: Export play as PNG/PDF
**Labels:** `core`, `feature`
**Milestone:** Phase 1

**Description:**
One-click export of any play:
- Export as PNG (transparent or white background options)
- Export as PDF (single play per page)
- Include play name and optional notes below the diagram
- High-resolution output suitable for printing

**Acceptance Criteria:**
- [ ] "Export" button on any play
- [ ] PNG downloads at 2x resolution
- [ ] PDF generates cleanly
- [ ] Play name renders on the export

---

### Issue #16: Quick Sketch mode (Napkin Mode)
**Labels:** `core`, `ui/ux`
**Milestone:** Phase 1

**Description:**
The zero-friction entry point:
- "Quick Draw" button prominently visible (home screen + floating action button)
- Tap it → blank field, immediately in Draw mode
- No title, no folder, no tags required
- Auto-saves to a "Scratch Pad" collection
- Scratch pad accessible from home screen showing recent sketches
- Any scratch play can be "promoted" to the playbook: tap → "Add to Playbook" → pick folder → done

**Acceptance Criteria:**
- [ ] Quick Draw button accessible from anywhere
- [ ] Opens to a blank field instantly
- [ ] Auto-saves without requiring metadata
- [ ] Scratch pad shows recent sketches with timestamps
- [ ] Promote to playbook workflow works

---

## Phase 2: Libraries & Concept Assembly

### Issue #17: [EPIC] Formation, Route, and Defense Libraries
**Labels:** `epic`, `competitive`
**Milestone:** Phase 2

**Description:**
Build the reusable component libraries that power the 3-tap play creation flow. Each library ships with smart defaults and allows full customization.

Sub-issues: #18, #19, #20, #21, #22, #23

---

### Issue #18: Default formation library with visual picker
**Labels:** `feature`, `ui/ux`, `competitive`
**Milestone:** Phase 2

**Description:**
Ship with pre-loaded offensive formations:
- Spread (2x2)
- Trips Right / Trips Left
- Single Back (Ace)
- I-Formation
- Pistol
- Empty (5-wide)
- Goal Line / Jumbo
- Bunch Right / Bunch Left
- Doubles Tight
- Wing-T base

Each formation stores exact player positions (x, y coordinates on the field).

**Formation Picker UI:**
- Grid of visual thumbnails (not text list)
- Shows the 11 players in position
- Tap to select → players appear on the field
- "Create Custom" button to build from scratch
- Search/filter by personnel (11, 12, 21, 13, etc.)

**Acceptance Criteria:**
- [ ] 10+ default formations load on first use
- [ ] Visual thumbnail grid renders correctly
- [ ] Tapping a formation places 11 players on the field
- [ ] Coach can create and save custom formations
- [ ] Formations filtered by personnel grouping

---

### Issue #19: Default route tree library
**Labels:** `feature`, `competitive`
**Milestone:** Phase 2

**Description:**
Ship with a standard route tree that coaches can customize:
- Hitch (5 yards)
- Slant
- Out (8 yards)
- In / Dig (10-12 yards)
- Curl / Comeback (12 yards)
- Corner (12-15 yards)
- Post (12-15 yards)
- Go / Fly / Streak
- Wheel
- Flat
- Angle
- Seam
- Whip
- Stick
- Shallow Cross

Each route stores: name, path data (relative to player start position), depth, break angle, tags.

**Customization:**
- Coach can edit any default route (adjust depth, angle)
- Coach can create entirely new routes
- Route suggestions: when drawing freehand, app suggests "Looks like a Corner route" — coach can accept to link it to the library

**Acceptance Criteria:**
- [ ] 15+ default routes available
- [ ] Routes render correctly when applied to any receiver position
- [ ] Coach can customize route depths/angles
- [ ] Coach can create new routes and save to library
- [ ] Freehand drawing suggests matching library route

---

### Issue #20: Default defensive front and coverage library
**Labels:** `feature`, `competitive`
**Milestone:** Phase 2

**Description:**
Ship with pre-loaded defensive fronts and coverages:

**Fronts:**
- 4-3 Over
- 4-3 Under
- 3-4 Base
- 3-3 Stack
- Nickel (4-2-5)
- Dime (4-1-6)
- Bear / 46
- 5-2 / 5-3
- Even Front (4-2)
- Odd Stack

**Coverages:**
- Cover 0 (man, no safety)
- Cover 1 (man free)
- Cover 2 (two-high zone)
- Cover 3 (three-deep zone)
- Cover 4 / Quarters
- Cover 6 (quarter-quarter-half)
- 2-Man (two-high man)

**Blitz packages:**
- A-gap blitz (Alpha)
- B-gap blitz (Beta)
- Edge blitz (Fire)
- Overload blitz
- Zone blitz

Each stores: name, player positions, coverage shell, technique labels (0-tech, 3-tech, 5-tech, etc.)

**Acceptance Criteria:**
- [ ] 10+ fronts, 7+ coverages, 5+ blitzes available by default
- [ ] Defense picker shows visual thumbnails
- [ ] Defensive players render with technique/position labels
- [ ] Coverage shells can overlay (show zone drops or man assignments)
- [ ] Coach can create/customize defensive looks

---

### Issue #21: Blocking scheme library with rule-based auto-assignment
**Labels:** `feature`, `competitive`
**Milestone:** Phase 2

**Description:**
This is the killer competitive advantage over PQD. Define blocking rules ONCE, and they auto-apply against any defensive front.

**Default schemes:**
- Inside Zone (IZ)
- Outside Zone (OZ)
- Power
- Counter
- Duo
- Pin & Pull
- Half-slide pass protection
- Full-slide pass protection
- BOB (Big on Big) pass protection

**Rule format per scheme:**
Each scheme defines rules per offensive position relative to the defense:
```
Inside Zone:
  PST: base block (first defender head-up to outside)
  PSG: combo to backside linebacker
  C: combo with PSG or base nose
  BSG: cutoff / scoop
  BST: cutoff / scoop
  TE: base DE or climb to LB
  FB: lead through A-gap
```

When a defensive front is selected, the system maps these rules to specific defenders and renders the blocking assignments automatically.

**Acceptance Criteria:**
- [ ] 8+ default schemes available
- [ ] Rules auto-assign blockers to defenders when a front is selected
- [ ] Blocking lines render correctly (base, combo, pull, kick-out)
- [ ] Coach can override any auto-assignment manually
- [ ] Coach can create and save custom schemes
- [ ] Changing the defensive front re-calculates all blocking

---

### Issue #22: Concept assembly — 3-tap play creation
**Labels:** `feature`, `ui/ux`, `competitive`
**Milestone:** Phase 2

**Description:**
The flagship UX flow: Formation → Concept → Play is done.

**Pass concepts (ship with defaults):**
- Mesh, Drive, Smash, Four Verts, Spacing, Curl-Flat, Snag, Y-Cross, Double Post, Hank, China, Dagger, Flood

**Run concepts (ship with defaults):**
- Inside Zone, Outside Zone, Power, Counter, Duo, Sweep, QB Draw, Jet Sweep

**Flow:**
1. Coach taps "New Play"
2. Formation picker appears — tap a formation thumbnail
3. 11 players appear on the field
4. Concept picker appears at bottom — scrollable cards showing concept names
5. Coach taps a concept:
   - For pass: routes auto-draw on eligible receivers based on concept definition + formation
   - For run: blocking scheme auto-assigns based on concept definition + formation
6. Coach tweaks if needed or saves immediately

**Acceptance Criteria:**
- [ ] Formation → Concept flow works end to end
- [ ] Pass concepts auto-assign routes to correct receivers
- [ ] Run concepts auto-assign blocking to correct linemen
- [ ] Coach can override any auto-assigned route or block
- [ ] Full play created in ≤3 taps and <10 seconds

---

### Issue #23: Concept × Front Matrix view
**Labels:** `feature`, `competitive`
**Milestone:** Phase 2

**Description:**
A matrix/grid view showing one offensive concept rendered against every defensive front:

```
              │ 4-3 Over │ 4-3 Under │ 3-3 Stack │ Nickel │ Bear │
Inside Zone   │  [play]  │  [play]   │  [play]   │ [play] │[play]│
Power         │  [play]  │  [play]   │  [play]   │ [play] │[play]│
Counter       │  [play]  │  [play]   │  [play]   │ [play] │[play]│
```

- Each cell is a `<PlayRenderer size="card" />` showing the concept with blocking auto-adjusted for that specific front
- Cells auto-generate from the blocking scheme rules
- Coach can click any cell to expand and tweak
- Printable as a wall poster for the meeting room
- This IS the run game install — replaces hours of PQD offseason drawing

**Acceptance Criteria:**
- [ ] Matrix renders with concepts as rows, fronts as columns
- [ ] Each cell auto-generates from blocking rules
- [ ] Click to expand and edit any cell
- [ ] Export/print the full matrix
- [ ] Coach can select which concepts and fronts to include

---

## Phase 3: Playbook Organization

### Issue #24: [EPIC] Playbook Management
**Labels:** `epic`
**Milestone:** Phase 3

**Description:**
Organize plays into a structured, searchable, visual playbook.

Sub-issues: #25, #26, #27, #28

---

### Issue #25: Playbook folder tree with drag-to-organize
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 3

**Description:**
Hierarchical folder structure:
- Top level: Offense / Defense / Special Teams
- Sub-folders by concept: Run Game → Inside Zone, Outside Zone, Power...
- Sub-sub-folders for variations
- Drag plays between folders
- Drag to reorder within a folder
- Create / rename / delete folders

**On mobile:** use tap-to-select + "Move to" button instead of drag.

**Acceptance Criteria:**
- [ ] Folder tree renders in a sidebar
- [ ] Create, rename, delete folders
- [ ] Drag plays between folders (desktop)
- [ ] Tap-to-move workflow (mobile)
- [ ] Folder state persists

---

### Issue #26: Visual playbook browser — thumbnail grid view
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 3

**Description:**
Display plays as visual thumbnail cards in a grid:
- Each card shows a miniature `<PlayRenderer size="thumbnail" />`
- Play name below the thumbnail
- Tags shown as small chips
- Click/tap a card to open the play in the full editor
- Toggle between grid view and list view
- Sort by: name, date created, date modified, custom order

**Acceptance Criteria:**
- [ ] Grid of play thumbnails renders from a folder's contents
- [ ] Thumbnails are recognizable at small size
- [ ] Click opens play in editor
- [ ] Sort options work
- [ ] Grid/list toggle works

---

### Issue #27: Play tagging system
**Labels:** `feature`, `data`
**Milestone:** Phase 3

**Description:**
Flexible tagging for plays:

**Situation tags:** Red Zone, 3rd & Short, 3rd & Long, 2-Minute, Goal Line, Backed Up, Openers, 1st & 10, 2nd & Medium, 2nd & Long
**Personnel tags:** 11, 12, 21, 13, 10, 22, Empty
**Concept tags:** Auto-applied from concept assembly (Mesh, Inside Zone, etc.)
**Custom tags:** Coach can create any tag

**UI:**
- Tag chips below the play in the editor
- Tap "+" to add tags from a pre-built list or type custom
- Tags are filterable in the playbook browser
- Multi-tag filtering: "Show me all Red Zone + 11 personnel plays"

**Acceptance Criteria:**
- [ ] Add/remove tags on any play
- [ ] Pre-built situation and personnel tag lists
- [ ] Custom tag creation
- [ ] Filter playbook by one or multiple tags
- [ ] Tags display on play thumbnails

---

### Issue #28: Playbook search
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 3

**Description:**
Search across the entire playbook:
- Search by play name
- Search by tag
- Search by concept
- Search by formation
- Results show as thumbnail cards
- Instant results as you type (client-side filtering)

**Acceptance Criteria:**
- [ ] Search bar at top of playbook view
- [ ] Results filter in real-time as coach types
- [ ] Searches across name, tags, concept, and formation
- [ ] Results show as clickable thumbnail cards

---

### Issue #29: Bulk operations — duplicate plays across formations
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 3

**Description:**
"I want Mesh out of Spread, Trips, Empty, and Bunch."

- Select a play → "Duplicate to formations..."
- Multi-select target formations from the formation picker
- Creates a copy of the play for each selected formation
- Routes auto-adjust to the new formation's receiver positions
- Blocking auto-adjusts if the formation changes personnel

**Acceptance Criteria:**
- [ ] Multi-formation duplicate works
- [ ] Routes reposition to match new formation
- [ ] Blocking recalculates for new formation
- [ ] All copies save to the same playbook folder

---

## Phase 4: Game Planning & Scouting

### Issue #30: [EPIC] Weekly Game Planning
**Labels:** `epic`, `competitive`
**Milestone:** Phase 4

**Description:**
The weekly game planning workflow — pulling plays from the master playbook into a structured game plan for a specific opponent.

Sub-issues: #31, #32, #33, #34, #35

---

### Issue #31: Game plan builder with situation slots
**Labels:** `feature`, `ui/ux`, `competitive`
**Milestone:** Phase 4

**Description:**
"New Game Plan" → pick opponent → pick week.

**Layout:**
- Left panel: coach's full playbook (searchable, filterable by tag)
- Right panel: game plan with situation sections

**Default situation sections:**
- Openers (scripted first 15)
- 1st & 10
- 2nd & Medium (4-6 yards)
- 2nd & Long (7+ yards)
- 3rd & Short (1-3 yards)
- 3rd & Medium (4-6 yards)
- 3rd & Long (7+ yards)
- Red Zone
- Goal Line
- 2-Minute
- Backed Up (own 1-10)

Coach can add/remove/rename sections.

**Adding plays:**
- Desktop: drag from playbook to section
- Mobile: select plays → tap "Add to" → tap section
- Plays are REFERENCED, not copied. Edit the master → game plan updates.

**Acceptance Criteria:**
- [ ] Game plan creation with opponent + week
- [ ] Situation sections render with play slots
- [ ] Add plays from playbook to sections (drag on desktop, tap on mobile)
- [ ] Plays are references to master playbook
- [ ] Custom sections can be added/removed
- [ ] Multiple game plans can exist (one per week)

---

### Issue #32: Defensive overlay toggle on game plan sections
**Labels:** `feature`, `competitive`
**Milestone:** Phase 4

**Description:**
Per game plan section, coach can set an opponent defense:
- "Our 1st & 10 plays, shown against their base 4-3 Cover 3"
- Toggle: "Show defense" → defense picker → select front + coverage
- All plays in that section re-render with the defense overlaid
- Each section can have a different defense

This is the "how does our stuff look against their stuff?" feature.

**Acceptance Criteria:**
- [ ] Defense toggle on each game plan section
- [ ] Selecting a defense overlays it on all plays in the section
- [ ] Different sections can have different defenses
- [ ] Blocking auto-adjusts to the overlaid defense

---

### Issue #33: Defensive Identification Chart view
**Labels:** `feature`, `competitive`
**Milestone:** Phase 4

**Description:**
Dedicated screen for the weekly "how does this opponent align to our formations?" workflow:

1. Select one of YOUR formations (e.g., Trips Right)
2. Select the opponent's defensive front + coverage
3. Your formation + their defense auto-render on the field
4. Coach taps defensive players to add jersey numbers (#11, #34, etc.)
5. Coach can add notes per formation (e.g., "FS always shades to trips side")
6. Repeat for each formation in the game plan
7. Export as a "Defensive ID Sheet" — one page per formation, printable

**Acceptance Criteria:**
- [ ] Formation picker + defense picker on one screen
- [ ] Offense + defense auto-render together
- [ ] Coach can label defenders with jersey numbers
- [ ] Notes field per formation
- [ ] Export as printable multi-page PDF
- [ ] Shareable via link

---

### Issue #34: "Top 5 plays" selector per formation vs defense
**Labels:** `feature`, `competitive`
**Milestone:** Phase 4

**Description:**
When viewing a Defensive ID chart (formation + opponent defense):
- Sidebar shows all plays from the playbook that use this formation
- Filterable by category: strong run, weak run, RPO, dropback, screen
- Coach taps to "pin" their top plays for this matchup
- Pinned plays auto-flow into the game plan sections
- Visual: pinned plays highlighted with a star or checkmark

**Acceptance Criteria:**
- [ ] Sidebar shows playbook plays filtered to current formation
- [ ] Category filters work
- [ ] Pin/unpin plays
- [ ] Pinned plays sync to game plan
- [ ] Visual indicator for pinned plays

---

### Issue #35: Nine-Box Opponent Summary
**Labels:** `feature`, `competitive`
**Milestone:** Phase 4

**Description:**
Simple 3×3 grid for the team meeting:
- Row 1: Top 3 defensive FRONTS
- Row 2: Top 3 BLITZES
- Row 3: Top 3 COVERAGES

Per formation or as a general opponent overview.

**Generation:**
- Auto-suggest from the Defensive ID work done earlier that week
- Or manually pick from the defense library
- Each cell is a clean `<PlayRenderer size="card" />` showing just the defensive look

**Output:**
- Projectable in a team meeting
- Shareable via QR code to players' phones
- Exportable as a one-page PDF

**Acceptance Criteria:**
- [ ] 3×3 grid renders with defensive diagrams
- [ ] Auto-suggest from game plan defenses
- [ ] Manual override to pick specific looks
- [ ] QR code share to players
- [ ] PDF export (one page)
- [ ] Clean, simple, not overwhelming

---

## Phase 5: Output & Distribution

### Issue #36: [EPIC] Game Day Outputs
**Labels:** `epic`, `print`
**Milestone:** Phase 5

**Description:**
All the print-ready, share-ready outputs that flow from the game plan.

Sub-issues: #37, #38, #39, #40, #41, #42, #43

---

### Issue #37: Auto-generated call sheet from game plan
**Labels:** `feature`, `print`, `competitive`
**Milestone:** Phase 5

**Description:**
One-tap call sheet generation:
- Pulls plays from the game plan organized by situation section
- Grid layout: plays as small diagrams in a grid within each section
- Color-coded: run = one color, pass = another, screen = another, RPO = another
- Play name prominently displayed
- Big text, high contrast — readable in sunlight and under stadium lights
- Laminated-card friendly layout (fits on one or two pages)
- Tap any play on the digital call sheet → see full diagram popup

**Acceptance Criteria:**
- [ ] Call sheet auto-generates from game plan
- [ ] Grid layout with plays organized by situation
- [ ] Color coding by play type
- [ ] Print-ready PDF export (letter size, landscape)
- [ ] Digital version: tap play for full diagram popup
- [ ] Readable at arm's length

---

### Issue #38: Wristband generator
**Labels:** `feature`, `print`
**Milestone:** Phase 5

**Description:**
Generate QB/player wristbands:
- Coach selects plays to include on the wristband
- Auto-formatted into a grid layout
- Configurable grid size (4x4, 5x5, 6x6, etc.)
- Each cell shows play name (abbreviated if needed) + tiny diagram or just name
- Color-coded by category
- Cut lines for easy trimming
- Export as PDF sized for wristband inserts

**Acceptance Criteria:**
- [ ] Play selection interface
- [ ] Grid auto-formats to configured size
- [ ] Color coding by category
- [ ] PDF export with cut lines
- [ ] Fits standard wristband insert dimensions

---

### Issue #39: Practice script builder
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 5

**Description:**
Build practice scripts by organizing plays into periods:

**Layout:**
- Left panel: game plan sections as source
- Right panel: practice periods (Indy, Inside Run, Team Pass, Team Run, Red Zone, 2-Min, etc.)

**Adding plays:**
- Select plays from game plan → add to a period
- Reorder within periods
- Each period shows play count and estimated time

**Output:**
- Print-ready script: sequential list per period
- Coach's clipboard format
- Projected practice schedule format

**Acceptance Criteria:**
- [ ] Create practice scripts with date + linked game plan
- [ ] Add/remove periods
- [ ] Add plays from game plan to periods
- [ ] Reorder plays within periods
- [ ] Print-ready PDF export
- [ ] Shows play count per period

---

### Issue #40: Scout card generation
**Labels:** `feature`, `print`, `competitive`
**Milestone:** Phase 5

**Description:**
Auto-generate scout team cards from game plan:
- If a play has a defense overlay, the scout card is the defensive look
- Shows the defensive formation for the scout team to run at practice
- Printable: 4-up or 6-up per page
- Each card shows: defensive front name, player positions, coverage shell, blitz responsibilities

**Acceptance Criteria:**
- [ ] Scout cards auto-generate from game plan defense overlays
- [ ] 4-up and 6-up print layouts
- [ ] Each card shows clear defensive alignment
- [ ] PDF export print-ready
- [ ] Shareable link for scout team

---

### Issue #41: QR code + link sharing
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 5

**Description:**
Share any play, playbook section, game plan, or scout card:
- "Share" button generates a unique URL
- QR code auto-generates from the URL
- Shared view is read-only, mobile-optimized, dark background
- No login required to view (link includes a time-limited token)
- Link expiration: configurable (24 hours, 1 week, season, permanent)
- Swipe through shared plays on mobile

**Acceptance Criteria:**
- [ ] Share button on plays, folders, game plans, scout cards
- [ ] QR code renders and is scannable
- [ ] Shared link opens a clean mobile view
- [ ] No login required
- [ ] Link expiration works
- [ ] Swipe navigation on mobile

---

### Issue #42: Position-filtered player view
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 5

**Description:**
When sharing plays with players, filter to show only THEIR assignment:
- Coach shares a set of plays with position filter enabled
- Player selects their position (X, Z, H, Y, F, T, G, C, QB, RB)
- Each play renders with only that player's route/assignment highlighted
- Other players are dimmed or simplified
- Reduces cognitive load: "I only need to know MY job"

**Acceptance Criteria:**
- [ ] Position selector on shared view
- [ ] Selected position highlighted, others dimmed
- [ ] Works on any shared play collection
- [ ] Clean mobile-optimized rendering

---

### Issue #43: Video clip embedding on plays
**Labels:** `feature`, `competitive`
**Milestone:** Phase 5

**Description:**
Attach video clips to any play for install meetings:
- YouTube link: paste URL, embed renders below the play diagram
- Hudl share link: paste URL, embed or link renders below
- Direct upload: MP4 upload stored in Supabase Storage
- In meeting deck mode: play diagram on top, video below
- "Here's Mesh concept. Here's the Lions running it last Sunday."

**Acceptance Criteria:**
- [ ] Paste YouTube URL → video embeds on the play
- [ ] Paste Hudl link → link renders on the play
- [ ] MP4 upload works (size limit: 100MB)
- [ ] Video renders below play diagram in meeting view
- [ ] Video attachment persists with the play

---

### Issue #44: Meeting deck mode (presentation view)
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 5

**Description:**
Full-screen presentation mode for team meetings:
- Shows one play at a time, full screen
- Swipe or arrow keys to navigate between plays
- Tap to animate the play (if animation is built)
- Video clip plays inline if attached
- Play name and notes visible
- Dark background, high contrast
- Projector-friendly (no UI chrome visible)

**Acceptance Criteria:**
- [ ] Full-screen mode with no UI chrome
- [ ] Navigate between plays (swipe, arrow keys, tap edges)
- [ ] Play name and notes visible
- [ ] Video embeds play inline
- [ ] Works on projector resolution
- [ ] ESC exits meeting mode

---

## Phase 6: Future & AI

### Issue #45: Play animation / simulation
**Labels:** `feature`, `future`
**Milestone:** Phase 6

**Description:**
"Play" button on any play that animates the routes and blocking:
- Players move along their routes/assignments in real-time
- Timing reflects the play (3-step drop vs 7-step drop)
- Ball shown at the QB, thrown on timing
- Blocking engagements animate
- Playback speed control (0.5x, 1x, 2x)
- Pause, rewind, step through
- Massive demo feature and teaching tool

**Acceptance Criteria:**
- [ ] Play button triggers animation
- [ ] Routes animate with correct timing
- [ ] Speed controls work
- [ ] Pause/rewind/step works
- [ ] Looks smooth at 60fps

---

### Issue #46: Voice-to-play (AI-powered)
**Labels:** `feature`, `future`
**Milestone:** Phase 6

**Description:**
Coach speaks: "Trips right, X on a post, Z on a dig, H shallow cross, Y check-release, F on a wheel"

The app:
1. Transcribes the speech
2. Parses formation + route assignments
3. Renders the play on the field
4. Coach reviews and tweaks

Uses speech-to-text API + LLM parsing to map natural coach language to formations and routes from their library.

**Acceptance Criteria:**
- [ ] Voice input captures coach speech
- [ ] AI correctly parses formation and route calls
- [ ] Play renders from voice input
- [ ] Coach can edit the result
- [ ] Works with common coaching terminology

---

### Issue #47: Real-time collaborative editing
**Labels:** `feature`, `future`
**Milestone:** Phase 6

**Description:**
Multiple coaches editing the same playbook simultaneously:
- See other coaches' cursors on the canvas
- Changes sync in real-time via Supabase Realtime
- Conflict resolution: last-write-wins per element
- "Coach Smith is editing Mesh" indicators
- Presence: see who's currently in the playbook

**Acceptance Criteria:**
- [ ] Multiple coaches can edit the same play
- [ ] Changes appear in real-time
- [ ] Cursor presence shows other editors
- [ ] No data loss from simultaneous edits
- [ ] Works with Supabase Realtime

---

### Issue #48: Hudl API integration
**Labels:** `feature`, `competitive`, `future`
**Milestone:** Phase 6

**Description:**
Two-way integration with Hudl:
- Pull game film clips directly into play video embeds
- Export playbook presentations to Hudl
- Import formation/play data from Hudl (if API supports it)
- Requires Hudl API partnership/access

**Acceptance Criteria:**
- [ ] OAuth connection to Hudl account
- [ ] Browse Hudl video library from within the app
- [ ] Attach Hudl clips to plays
- [ ] Export presentations to Hudl
- [ ] Handle Hudl API rate limits

---

### Issue #49: Quiz mode for player learning
**Labels:** `feature`, `future`
**Milestone:** Phase 6

**Description:**
Flash-card style learning from the actual playbook:
- Show a formation → ask "What's your assignment on [play name]?"
- Player answers → reveal the play with their route/assignment highlighted
- Track correct/incorrect answers
- Coach can see which players are studying and their accuracy
- Spaced repetition: plays the player gets wrong show up more often

**Acceptance Criteria:**
- [ ] Quiz interface shows formation + play name
- [ ] Player submits answer (text or drawing)
- [ ] Correct answer revealed with animation
- [ ] Progress tracking per player
- [ ] Coach dashboard showing study stats

---

### Issue #50: Offseason setup wizard ("Build Your System")
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 6

**Description:**
Optional guided flow to set up the coach's entire system:
1. Pick your base formations (from defaults, customize)
2. Pick your run concepts and define blocking rules per position
3. Pick your pass concepts and define route combos per receiver
4. The Concept × Front matrix auto-generates all combinations
5. Coach reviews and tweaks edge cases

Replaces hours of PQD offseason drawing with a ~15-minute setup.

**Acceptance Criteria:**
- [ ] Step-by-step guided flow
- [ ] Skippable at any point
- [ ] Formations, concepts, and rules all save to libraries
- [ ] Matrix auto-generates after setup
- [ ] Progress is saved — can return and continue later

---

## Infrastructure & Cross-Cutting

### Issue #51: Dark mode theme (default)
**Labels:** `ui/ux`, `infra`
**Milestone:** Phase 1

**Description:**
Dark mode as the default theme:
- Dark background (#0f172a or similar)
- Green field with white lines
- High-contrast player icons and route colors
- Light mode toggle available
- Persists preference in localStorage

**Acceptance Criteria:**
- [ ] App loads in dark mode by default
- [ ] Field looks clean on dark background
- [ ] All UI elements readable in dark mode
- [ ] Toggle to light mode works
- [ ] Preference persists

---

### Issue #52: Responsive layout — iPad-first design
**Labels:** `ui/ux`, `mobile`
**Milestone:** Phase 1

**Description:**
Design breakpoints:
- **iPad landscape (primary):** full canvas + sidebar
- **iPad portrait:** canvas full-width, sidebar as overlay/sheet
- **Desktop:** same as iPad landscape but wider
- **Phone:** canvas full-width, all controls in bottom sheet

All touch targets ≥ 44px. No hover-dependent interactions. No right-click menus.

**Acceptance Criteria:**
- [ ] Layout works on iPad landscape and portrait
- [ ] Layout works on desktop wide screens
- [ ] Layout works on phone (usable but not primary)
- [ ] All interactive elements are touch-friendly
- [ ] No broken layouts at any screen size

---

### Issue #53: PWA setup — installable and offline-capable
**Labels:** `infra`, `mobile`
**Milestone:** Phase 1

**Description:**
Configure as a Progressive Web App:
- Service worker for offline caching
- Web app manifest with icons and splash screen
- "Add to Home Screen" prompt on iPad/mobile
- Caches static assets and recently viewed plays
- Works fully offline (all writes go to IndexedDB)

**Acceptance Criteria:**
- [ ] "Add to Home Screen" works on iPad Safari
- [ ] App launches from home screen without browser chrome
- [ ] Static assets cached for offline use
- [ ] New plays can be created offline
- [ ] Syncs when back online

---

### Issue #54: Keyboard shortcuts for power users
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 3

**Description:**
Keyboard shortcuts for desktop coaches:
- `F` — new formation
- `R` — route drawing mode
- `B` — blocking mode
- `D` — add defense overlay
- `S` — save (manual trigger even though auto-save exists)
- `E` — export
- `1-9` — quick-select formation templates
- `Cmd+D` / `Ctrl+D` — duplicate play
- `Cmd+Z` / `Ctrl+Z` — undo
- `Cmd+Shift+Z` / `Ctrl+Y` — redo
- `Space` — play animation (when available)
- `Delete` / `Backspace` — delete selected element
- `Escape` — deselect / close panel

Show a keyboard shortcut hint overlay on `?` key.

**Acceptance Criteria:**
- [ ] All listed shortcuts work
- [ ] `?` shows shortcut overlay
- [ ] Shortcuts don't conflict with browser defaults
- [ ] Shortcuts are disabled when typing in text fields

---

### Issue #55: Print layout engine — multi-format PDF generation
**Labels:** `feature`, `print`, `infra`
**Milestone:** Phase 5

**Description:**
Shared print layout engine for all PDF outputs:
- Single play (full page)
- 4-up plays per page
- 6-up plays per page (scout cards)
- Call sheet layout (situation grid)
- Wristband layout (cut-line grid)
- Practice script layout (sequential list)
- Defensive ID sheet (formation + defense per page)
- Nine-box layout (3×3 grid)

Uses a consistent header (team name, logo, date/week) and footer.

**Acceptance Criteria:**
- [ ] All 8 layout formats generate correctly
- [ ] PDFs are print-ready (proper margins, bleed)
- [ ] Team branding applied (name, colors, logo)
- [ ] Consistent styling across all formats
- [ ] Fast generation (<3 seconds)

---

### Issue #56: Session recovery and recently edited
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 1

**Description:**
- On page load, restore the last open play/view
- "Recently Edited" section on home screen: last 10 plays with timestamps
- Browser back button navigates play history, not away from the app
- `beforeunload` warning if there are unsaved changes (safety net)

**Acceptance Criteria:**
- [ ] Reopening the app restores last state
- [ ] Recently edited list shows on home screen
- [ ] Back button navigates within the app
- [ ] No data loss from accidental navigation

---

### Issue #57: Version history on plays
**Labels:** `feature`, `data`
**Milestone:** Phase 3

**Description:**
Lightweight version history:
- Every save creates a snapshot (stored as JSON diff or full snapshot)
- Coach taps "History" on any play → timeline of changes
- Preview any version → restore with one tap
- Show timestamp and which coach made the change
- Not git-level complexity — just "what did this look like before?"

**Acceptance Criteria:**
- [ ] Snapshots saved on each change (throttled)
- [ ] History timeline viewable on any play
- [ ] Preview any past version
- [ ] Restore any past version with one tap
- [ ] Shows timestamp and editor name

---

### Issue #58: Team branding and customization
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 3

**Description:**
Team-level customization:
- Primary and secondary colors (applied to player icons, route lines, exports)
- Team logo upload (appears on print exports)
- Team name (appears on exports and shared links)
- Custom font selection (optional)
- Branding applied consistently across all views and exports

**Acceptance Criteria:**
- [ ] Color picker for primary/secondary colors
- [ ] Logo upload and display on exports
- [ ] Team name on all print outputs
- [ ] Branding preview before saving
- [ ] Colors apply to player icons and UI accents

---

# Phase 7: Scouting Intelligence

## Issue #59: Canvas-Level Scouting Alerts — Unblocked Defenders & Numbers Advantages

**Labels:** `scouting`, `canvas`, `intelligence`
**Milestone:** Phase 7 — Scouting Intelligence
**Priority:** High

**Description:**
When a play is overlaid against a defensive front, the canvas should automatically highlight tactical alerts:

- **Unblocked Defender Alert**: If blocking rules leave a defender unaccounted for, highlight that defender in red with a warning icon. Coach can tap to see "Unblocked — consider hot route or slide protection."
- **Numbers Advantage/Disadvantage**: Count blockers vs rushers per side (left/right of center). Show green (advantage), yellow (even), red (disadvantage) indicators on each side.
- **Run Fit Analysis**: For run plays, highlight which gaps are filled vs unfilled by the defense. Show arrows for where the defense is weak.

All alerts are non-intrusive — subtle colored outlines and small icons that don't clutter the play view. Coach can toggle alerts on/off globally.

**Acceptance Criteria:**
- [ ] Automatic detection of unblocked defenders against current blocking scheme
- [ ] Red highlight + warning icon on unblocked defender
- [ ] Left/right numbers advantage indicator (green/yellow/red)
- [ ] Run gap analysis overlay for run plays
- [ ] Global toggle to show/hide all scouting alerts
- [ ] Alerts update live as coach modifies blocking or defense
- [ ] Performance: alerts calculate in <100ms

---

## Issue #60: Coverage Window Detection — Find the Soft Spots

**Labels:** `scouting`, `canvas`, `intelligence`
**Milestone:** Phase 7 — Scouting Intelligence
**Priority:** High

**Description:**
When a coverage shell is applied (Cover 2, Cover 3, Cover 4, Man, etc.), the canvas should highlight coverage windows — the zones between defenders where receivers can find space:

- **Zone Coverage**: Shade the gaps between zone defenders in a subtle highlight color. Larger gaps = brighter highlight. Coach can immediately see where the soft spots are.
- **Man Coverage**: Show matchup lines from each defender to their assignment. Highlight favorable matchups (speed mismatch, size mismatch) if the coach has tagged player attributes.
- **Route vs Coverage Overlay**: When routes are drawn over coverage, highlight where routes intersect soft zones. Show "high-percentage windows" where a receiver will be open against the called coverage.

**Acceptance Criteria:**
- [ ] Zone gap detection and visual shading for all standard coverages
- [ ] Man coverage matchup lines
- [ ] Route intersection with coverage windows highlighted
- [ ] Coverage type selector (Cover 1-6, Man, custom)
- [ ] Visual indicators for favorable/unfavorable matchups
- [ ] Toggle coverage windows on/off independently of other alerts

---

## Issue #61: Defender & Player Scouting Notes

**Labels:** `scouting`, `notes`, `game-planning`
**Milestone:** Phase 7 — Scouting Intelligence
**Priority:** High

**Description:**
Coaches should be able to attach scouting notes to any element on the canvas — individual defenders, offensive players, formations, or specific plays:

- **Defender Notes**: Tap any defender icon → "Add Note" → free-text note with optional tags (e.g., "slow to recover", "bites on play-action", "weak tackler"). Notes persist across all plays in the game plan where that defender position appears.
- **Play Notes**: Annotate any play with coaching notes ("They struggled with this in Q3 last year", "Run this on 2nd & medium").
- **Formation Notes**: Notes on opponent tendencies from specific formations ("70% run from this formation", "Always motion to trips before passing").
- **Visual Indicators**: Small note icon on any element that has notes. Tap to expand. Color-coded by sentiment (red = weakness to exploit, blue = strength to avoid, yellow = neutral observation).
- **Note Search**: Global search across all notes in a game plan.

**Acceptance Criteria:**
- [ ] Tap-to-add notes on defender icons, plays, and formations
- [ ] Free-text note entry with optional tags
- [ ] Notes persist across all plays where that element appears
- [ ] Visual note indicator icons on canvas elements
- [ ] Color coding by note type (weakness/strength/neutral)
- [ ] Global note search within game plan
- [ ] Notes export with game plan printouts

---

## Issue #62: Opponent Tendency Tracking & Dashboard

**Labels:** `scouting`, `analytics`, `game-planning`
**Milestone:** Phase 7 — Scouting Intelligence
**Priority:** Medium

**Description:**
A dedicated tendency tracking view where coaches can log and visualize opponent patterns:

- **Tendency Entry**: Log entries by situation (down & distance, field zone, quarter, personnel). Record what the opponent ran — formation, play type, direction, result.
- **Tendency Dashboard**: Visual breakdown showing:
  - Run/pass ratio by down & distance (bar chart)
  - Formation frequency (heat map or ranked list)
  - Play direction tendencies (field diagram with arrows showing run direction frequency)
  - Red zone tendencies
  - 3rd down tendencies
- **Smart Suggestions**: Based on logged tendencies, suggest plays from the coach's playbook that exploit the opponent's patterns. E.g., "Opponent runs 65% to the right on 1st & 10 — consider overloading left linebacker."
- **Quick Entry Mode**: Rapid-fire entry during film review. Down, distance, formation, play type — 4 taps per entry.

**Acceptance Criteria:**
- [ ] Tendency entry form with situation, personnel, formation, play type
- [ ] Quick entry mode for rapid film review logging
- [ ] Run/pass ratio visualization by situation
- [ ] Formation frequency breakdown
- [ ] Play direction heat map on field diagram
- [ ] Red zone and 3rd down tendency views
- [ ] Smart play suggestions based on tendencies vs coach's playbook
- [ ] Import tendencies from CSV (for coaches with existing spreadsheets)

---

## Issue #63: Weakness Highlighting & Exploit Mode

**Labels:** `scouting`, `canvas`, `game-planning`
**Milestone:** Phase 7 — Scouting Intelligence
**Priority:** Medium

**Description:**
A special "Exploit Mode" toggle in the game plan builder that highlights known weaknesses directly on the canvas:

- **Weakness Tags**: When scouting notes contain weakness tags, those elements glow red on the canvas. A weak cornerback shows as a red-highlighted player. A formation the opponent struggles against shows as a green-highlighted formation option.
- **Exploit Suggestions Panel**: Side panel showing "Top Exploits" — a ranked list of the biggest mismatches or weaknesses found from scouting notes and tendencies. Each exploit links directly to relevant plays in the coach's playbook.
- **Game Plan Auto-Fill**: One-tap action: "Build game plan from scouting data." Auto-populates situation slots with plays that exploit logged weaknesses. Coach reviews and adjusts — it's a starting point, not a replacement.
- **Confidence Score**: Each exploit gets a confidence rating based on sample size. "3 games of data" vs "1 game" — helps coach weigh how much to trust the tendency.

**Acceptance Criteria:**
- [ ] Exploit Mode toggle in game plan view
- [ ] Weakness-tagged elements highlighted on canvas
- [ ] Exploit Suggestions panel with ranked mismatches
- [ ] Each exploit links to relevant plays in playbook
- [ ] One-tap game plan auto-fill from scouting data
- [ ] Confidence scores based on data sample size
- [ ] Coach can dismiss/override any suggestion

---

## Issue #64: Hot Route Triggers & Automatic Adjustments

**Labels:** `scouting`, `canvas`, `play-design`
**Milestone:** Phase 7 — Scouting Intelligence
**Priority:** Medium

**Description:**
Allow coaches to define IF/THEN rules on plays that automatically show adjustments based on what the defense shows:

- **Hot Route Rules**: "IF defense shows blitz from the weak side → THEN slot receiver runs hot slant instead of dig." Coach defines the trigger (defensive look) and the adjustment (route change, blocking change, or audible).
- **Visual on Canvas**: When a hot route trigger is defined, the canvas shows the base route in solid and the hot route in dashed. Tapping the trigger condition toggles between views.
- **Pre-snap Read Checklist**: For each play, auto-generate a "pre-snap read" checklist based on defined triggers. This becomes a teaching tool — coach can show players exactly what to look for.
- **Multiple Triggers Per Play**: A play can have multiple IF/THEN rules for different defensive looks.

**Acceptance Criteria:**
- [ ] Define hot route trigger conditions (defensive look)
- [ ] Define adjustment actions (route change, blocking change, audible)
- [ ] Base route shown solid, hot route shown dashed on same canvas
- [ ] Tap to toggle between base and adjusted view
- [ ] Pre-snap read checklist auto-generated from triggers
- [ ] Multiple triggers per play supported
- [ ] Hot routes included in player distribution exports (wristbands show both)

---

---

# Phase 8: High-Impact Product Features & Revenue Add-Ons

> These issues capture high-demand features identified through competitive analysis.
> Many enhance existing issues with additional scope — cross-references noted.

---

## Issue #400: Enhanced Scout Card Generator — Upload Tendencies & Auto-Format
**Labels:** `output`, `coach-workflow`, `high-demand`
**Milestone:** Phase 5 (Output)
**Priority:** High
**Description:** Coaches hate making scout cards manually. Extend the existing scout card system (#40) to accept uploaded opponent tendency data (CSV, typed, or even photo-to-text) and auto-format printable scout cards grouped by down-and-distance, formation, and field zone. Output should be print-ready PDF with configurable layouts.
**Acceptance Criteria:**
- [ ] Upload opponent tendencies via CSV or manual entry form
- [ ] Auto-group tendencies by situation (down/distance, field zone, formation)
- [ ] Generate formatted scout cards with play diagrams from tendency data
- [ ] Print-ready PDF output with customizable page layout (1-up, 2-up, 4-up)
- [ ] Option to include frequency percentages and notes per tendency
- [ ] Photo-to-tendency OCR stretch goal (snap a film breakdown sheet)

---

## Issue #401: Enhanced Practice Script Builder — Drag Plays From Playbook
**Labels:** `output`, `coach-workflow`, `high-demand`
**Milestone:** Phase 5 (Output)
**Priority:** High
**Description:** Extend the practice script system (#39) with drag-and-drop play insertion directly from the playbook drawer. Coaches script practice every single week — this is the stickiest operational feature. Support period-based organization (Inside Run, Blitz Pickup, Red Zone, etc.) with time allocation and export to PDF/tablet.
**Acceptance Criteria:**
- [ ] Drag plays from playbook sidebar directly into practice periods
- [ ] Period templates (team, indy, 7-on-7, special teams) with configurable durations
- [ ] Reorder plays within periods via drag-and-drop
- [ ] Copy previous week's script as a starting template
- [ ] Export full practice script to PDF with play thumbnails
- [ ] Tablet-optimized view for use on the practice field
- [ ] Track tempo (plays per minute) per period

---

## Issue #402: Wristband Play Formatter — Auto-Shrink & Print-Ready
**Labels:** `output`, `game-day`, `high-demand`, `low-difficulty`
**Milestone:** Phase 5 (Output)
**Priority:** High
**Description:** Extend the wristband generator (#38) to auto-shrink play calls into wristband format with numbering. Coaches literally sit in Word formatting these in 2026. Auto-generate numbered play call lists from game plan sections, with customizable font sizes, column layouts, and print-ready output that cuts to wristband size.
**Acceptance Criteria:**
- [ ] Auto-number plays from game plan sections (1 – Trips Right 34 Zone, etc.)
- [ ] Configurable column count (1-4 columns per wristband)
- [ ] Font size auto-scaling to fit content
- [ ] Color-coded by situation/category
- [ ] Print layout with cut lines for standard wristband sizes
- [ ] Support both text-only and mini-diagram wristband modes
- [ ] One-click generate from any game plan

---

## Issue #403: Animated Play Viewer — Simple 2D Route Animation
**Labels:** `canvas`, `player-facing`, `differentiation`
**Milestone:** Phase 6 (Future)
**Priority:** Medium
**Description:** Extend the play animation system (#45) with a clean, simple 2D animation viewer. Not Madden-level — just routes animating along their paths with players moving to positions. Tap play → routes animate. Pause/rewind. Send to players via share link. This immediately differentiates from every legacy tool.
**Acceptance Criteria:**
- [ ] Tap any play to see routes animate along drawn paths
- [ ] Player icons move along route paths with configurable speed
- [ ] Playback controls: play, pause, rewind, speed (0.5x, 1x, 2x)
- [ ] Blocking assignments animate (step/pull/reach shown as movement)
- [ ] Share animated play via link (player can view without login)
- [ ] Works on mobile — optimized for player viewing on phone
- [ ] Pre-snap motion/shifts animate before route phase

---

## Issue #404: Play Template Marketplace — Coach-to-Coach Play Sharing
**Labels:** `business`, `revenue`, `marketplace`
**Milestone:** Phase 9 (Revenue)
**Priority:** Medium
**Description:** Let coaches publish and sell play packages (formation sets, full installs, game plan templates) through an in-app marketplace. Take a 20% platform fee. Football coaches love swapping ideas — this creates network effects and recurring revenue. Start with free sharing, add paid tiers later.
**Acceptance Criteria:**
- [ ] Coaches can publish plays/formations/concepts as a "package"
- [ ] Package listing with title, description, preview thumbnails, tags (level, offense style)
- [ ] Free and paid packages supported
- [ ] One-click install: imports plays, formations, and concepts into buyer's playbook
- [ ] Rating and review system for packages
- [ ] Creator dashboard showing downloads, revenue, ratings
- [ ] Platform takes configurable revenue share (default 20%)
- [ ] Stripe Connect integration for creator payouts
- [ ] Content moderation queue for published packages

---

## Issue #405: Team Playbook App for Players — Read-Only Mobile Install Viewer
**Labels:** `player-facing`, `retention`, `mobile`
**Milestone:** Phase 6 (Future)
**Priority:** High
**Description:** Provide a read-only mobile playbook experience for players. Players log in with a team code, see their installs organized by position group, and can study plays with animated routes. This makes the product dramatically stickier once adopted — the whole team depends on it. No editing, just viewing.
**Acceptance Criteria:**
- [ ] Player login via team invite code (no email required for minors/FERPA)
- [ ] Position-filtered view: player only sees plays relevant to their position
- [ ] Organized by install week / game plan
- [ ] Play detail view with animated routes and assignments
- [ ] Offline support — download playbook for study without internet
- [ ] Coach controls what players can see (toggle play visibility)
- [ ] Push notification when new installs are added
- [ ] No edit capabilities — strictly read-only
- [ ] Works as PWA installable on iOS and Android

---

## Issue #406: Install Quiz Generator — Auto-Generate Quizzes From Plays
**Labels:** `player-facing`, `education`, `retention`
**Milestone:** Phase 6 (Future)
**Priority:** Medium
**Description:** Extend the quiz system (#49) to auto-generate quizzes directly from the playbook. Show a play diagram → ask "What's your assignment?" or "What's the play call?" Coaches love testing player recall, and this turns the playbook from a reference tool into a learning platform. Track completion rates per player.
**Acceptance Criteria:**
- [ ] Auto-generate quiz questions from any play or game plan section
- [ ] Question types: identify play call, identify assignment, identify formation, fill-in route
- [ ] Position-specific quizzes (RB only sees RB assignments)
- [ ] Timed and untimed modes
- [ ] Player completion tracking dashboard for coaches
- [ ] Spaced repetition for plays the player gets wrong
- [ ] Weekly quiz assignment: coach assigns quiz → players get notification
- [ ] Leaderboard for competitive motivation (optional, coach-toggled)
- [ ] Export quiz results as PDF for coaches

---

## Issue Summary

| Phase | Issue Count | Focus |
|-------|------------|-------|
| Phase 0: Setup | #1-4 | Project scaffolding, DB, auth, deploy |
| Phase 1: Canvas Core | #5-16 | Field, players, routes, drawing, auto-save |
| Phase 2: Libraries | #17-23 | Formations, routes, defenses, concepts, matrix |
| Phase 3: Organization | #24-29 | Playbook, folders, tags, search, bulk ops |
| Phase 4: Game Planning | #30-35 | Game plan, defense overlay, ID chart, nine-box |
| Phase 5: Output | #36-44 | Call sheet, wristband, practice, scout, share |
| Phase 6: Future | #45-50 | Animation, voice, collab, Hudl, quiz, wizard |
| Phase 7: Scouting Intelligence | #59-64 | Alerts, coverage windows, notes, tendencies, exploits, hot routes |
| Infrastructure | #51-58 | Dark mode, responsive, PWA, shortcuts, print |
| Phase 8: High-Impact Features | #400-406 | Enhanced scout cards, practice scripts, wristbands, animation, marketplace, player app, quizzes |
| **Total** | **71 issues** | |
