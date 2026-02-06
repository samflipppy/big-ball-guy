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
| Audit: Architecture & Data | #130-141 | Versioning, sync conflicts, soft delete, audit trail, backup, caching, pagination |
| Audit: Mobile & PWA | #160-174 | Apple Pencil, iPad Split View, PWA install, offline indicator, touch gestures, orientation |
| Audit: Coach Workflows | #190-204 | Image import, opponent copy, install migration, permissions, drill cards, messaging |
| Audit: Performance & Scale | #220-234 | Canvas optimization, lazy loading, IndexedDB limits, bundle splitting, web workers |
| Audit: Canvas & Drawing | #250-264 | Snap-to-grid, waypoint editing, copy/paste routes, mirror play, zone shading, multi-select |
| Audit: Output & Export | #280-294 | Batch PDF, call sheet templates, wristband editor, PowerPoint export, email playbooks |
| Audit: Business & Competitive | #310-324 | Stripe integration, free tier, team invitations, analytics, referral, white-label |
| Audit: Testing & DevOps | #340-354 | Playwright E2E, visual regression, CI/CD, Sentry, Web Vitals, load testing, feature flags |
| Audit: Security | #65-79 | RLS policies, auth hardening, XSS sanitization, CSRF, rate limiting, GDPR/FERPA |
| Audit: UX & Accessibility | #100-114 | Onboarding wizard, empty states, error boundaries, color-blind palette, keyboard nav |
| **Total** | **132 issues** | |

---

# Comprehensive Audit Issues

> Generated by automated audit covering architecture, mobile, coach workflows,
> performance, canvas, output, business, and devops.


---

# Architecture & Data (#130-141)


---

## Issue #130: Play versioning with diff view
**Labels:** `feature`, `data`, `competitive`
**Milestone:** Phase 3
**Priority:** High
**Description:** Extend the lightweight version history (Issue #57) with a visual diff view that lets coaches see exactly what changed between two versions of a play. When a coach opens the history timeline, selecting two snapshots renders them side-by-side with additions highlighted in green and removals in red. This covers player position changes, route modifications, blocking reassignments, and tag/metadata edits.
**Acceptance Criteria:**
- [ ] Each play save generates a versioned snapshot with a stable schema (JSON diff or full snapshot)
- [ ] History panel allows selecting any two versions for comparison
- [ ] Side-by-side `<PlayRenderer>` shows both versions simultaneously
- [ ] Added routes/players highlighted in green, removed in red, moved elements shown with a ghost trail
- [ ] Metadata diff (tags, notes, formation changes) displayed below the canvas comparison
- [ ] Restore any previous version with one tap, creating a new snapshot (not overwriting history)
- [ ] Snapshots are throttled (max one per 30 seconds) to prevent storage bloat from rapid edits

---

## Issue #131: Sync conflict resolution — last-write-wins vs merge strategy
**Labels:** `infra`, `data`, `core`
**Milestone:** Infrastructure
**Priority:** Critical
**Description:** Define and implement the conflict resolution strategy for the local-first IndexedDB-to-Supabase sync pipeline. When two coaches (or the same coach on two devices) edit the same play offline and both sync, the system must resolve conflicts gracefully. V1 uses last-write-wins at the play level with automatic conflict detection and a manual resolution UI for flagged conflicts.
**Acceptance Criteria:**
- [ ] Each play record carries a `version` counter and `updated_at` timestamp incremented on every save
- [ ] On sync, the server compares incoming version against stored version to detect conflicts
- [ ] Last-write-wins (by timestamp) is the default automatic resolution for V1
- [ ] When a conflict is detected, the losing version is preserved in a `play_conflicts` table, not discarded
- [ ] Coach sees a "Conflict detected" badge on plays with unresolved conflicts
- [ ] Conflict resolution UI shows both versions side-by-side and allows the coach to pick one or merge manually
- [ ] Conflict resolution works correctly across IndexedDB, Supabase, and real-time subscription channels
- [ ] Automated test coverage for concurrent edit scenarios (same play, two clients, offline then online)

---

## Issue #132: Soft delete with trash and recovery
**Labels:** `feature`, `data`, `ui/ux`
**Milestone:** Phase 3
**Priority:** High
**Description:** Implement soft delete across all major entities (plays, formations, routes, blocking schemes, game plans, practice scripts) so that nothing is permanently destroyed on first delete. Deleted items move to a "Trash" collection with a 30-day retention window. Coaches can browse trash, preview items, and restore with one tap.
**Acceptance Criteria:**
- [ ] All deletable entities gain a `deleted_at` timestamp column (null = active, non-null = soft deleted)
- [ ] All queries filter out soft-deleted records by default
- [ ] Trash view accessible from the sidebar showing all deleted items sorted by deletion date
- [ ] Each trashed item shows a preview thumbnail, name, deletion date, and who deleted it
- [ ] One-tap restore moves the item back to its original folder/location
- [ ] Items older than 30 days are permanently purged by a scheduled Supabase function
- [ ] Bulk operations: "Empty Trash" to permanently delete all, "Restore All" to recover everything
- [ ] Plays referenced by game plans show a warning before soft-delete ("This play is used in 3 game plans")

---

## Issue #133: Audit trail logging for team activity
**Labels:** `feature`, `data`, `infra`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** Record a comprehensive audit trail of all significant actions within a team workspace. This serves both accountability (who changed what, when) and debugging (what happened before something broke). Every write operation on plays, game plans, libraries, and team settings is logged with the acting coach, timestamp, entity, and action type.
**Acceptance Criteria:**
- [ ] `audit_log` table: `id`, `team_id`, `coach_id`, `action` (created/updated/deleted/restored/shared/exported), `entity_type`, `entity_id`, `entity_name`, `metadata` (JSONB for action-specific details), `created_at`
- [ ] All CRUD operations on plays, formations, routes, schemes, game plans, and practice scripts create audit entries
- [ ] Sharing actions (QR code generated, link created) are logged with expiration and recipient info
- [ ] Export actions (PDF, PNG) are logged
- [ ] Audit log viewer in team settings: filterable by coach, entity type, action, and date range
- [ ] Audit entries are append-only and cannot be edited or deleted by coaches
- [ ] Retention policy: audit logs kept for 1 year, then archived or purged
- [ ] Performance: audit writes are async (do not block the primary operation)

---

## Issue #134: Backup and restore for team data
**Labels:** `feature`, `infra`, `data`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Allow team admins to create full backups of their team's data and restore from a backup if needed. Backups capture all plays, formations, routes, blocking schemes, defensive fronts, game plans, practice scripts, and team settings as a single downloadable archive. This protects against accidental bulk deletion, account issues, or migration needs.
**Acceptance Criteria:**
- [ ] "Create Backup" button in team settings triggers a full export of all team data
- [ ] Backup format: JSON archive (`.json` or compressed `.zip`) containing all entities with relationships preserved
- [ ] Backup includes play canvas data, library items, game plans, tags, and scouting notes
- [ ] Backup file is downloadable to the coach's device
- [ ] "Restore from Backup" uploads a backup file and previews what will be restored before confirming
- [ ] Restore can be additive (merge with existing data) or full (replace all team data)
- [ ] Automatic weekly backups stored in Supabase Storage for Program and Enterprise tiers
- [ ] Backup/restore operations are logged in the audit trail
- [ ] Backup file size is reasonable (estimated <50MB for a team with 500 plays)

---

## Issue #135: Season archival and year-over-year organization
**Labels:** `feature`, `data`, `ui/ux`
**Milestone:** Phase 3
**Priority:** Medium
**Description:** At the end of a season, coaches need to archive game plans, practice scripts, and scouting data while keeping their master playbook and libraries intact for the next year. Implement a season archival workflow that snapshots the current season's ephemeral data, moves it to a read-only archive, and resets the workspace for a new season without losing the playbook foundation.
**Acceptance Criteria:**
- [ ] "Archive Season" action in team settings prompts for season label (e.g., "2025 Fall")
- [ ] Archival snapshots all game plans, practice scripts, call sheets, scouting notes, and tendency data
- [ ] Archived seasons are read-only and browseable from an "Archives" section in the sidebar
- [ ] Master playbook, formation library, route library, blocking schemes, and defense library are NOT archived — they carry over
- [ ] Coach can duplicate plays or game plans from an archived season back into the active workspace
- [ ] Active workspace resets: game plans and practice scripts cleared, scratch pad cleared
- [ ] Multiple archived seasons can coexist (2023, 2024, 2025, etc.)
- [ ] Archived data does not count against the free tier play limit

---

## Issue #136: Database migration strategy and tooling
**Labels:** `infra`, `data`, `chore`
**Milestone:** Infrastructure
**Priority:** Critical
**Description:** Establish a robust database migration strategy for evolving the Supabase Postgres schema over time. As the product grows from MVP through Phase 6+, columns, tables, and indexes will change frequently. Migrations must be version-controlled, reversible, and safe to run against production data without downtime.
**Acceptance Criteria:**
- [ ] Migration tooling selected and configured (Supabase CLI migrations, Prisma Migrate, or raw SQL with version tracking)
- [ ] All schema changes are captured as numbered migration files in the repository (`/supabase/migrations/`)
- [ ] Each migration has an `up` and `down` (rollback) script
- [ ] Migrations run automatically on deploy via CI/CD pipeline (Vercel build step or GitHub Action)
- [ ] Seed data script for default formations, routes, fronts, coverages, and blocking schemes
- [ ] Migration dry-run mode that validates SQL without executing against production
- [ ] Documentation in the repo describing how to create, test, and deploy migrations
- [ ] Zero-downtime migration pattern established for adding/removing columns on large tables

---

## Issue #137: Server-side caching for read-heavy endpoints
**Labels:** `infra`, `feature`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** Implement server-side caching for frequently accessed, rarely changing data to reduce Supabase query load and improve response times. Default libraries (formations, routes, fronts, coverages), team settings, and playbook folder structures are read far more often than they are written. Cache these at the edge (Vercel) and in-memory (API routes) with smart invalidation on writes.
**Acceptance Criteria:**
- [ ] Default library data (formations, routes, fronts, coverages, blocking schemes) cached at the Vercel edge with `Cache-Control` headers (stale-while-revalidate pattern)
- [ ] Team-specific library data cached per-team with a cache key including team ID and a version hash
- [ ] Cache invalidation triggers on any write to the cached entity (create, update, delete)
- [ ] API routes use `unstable_cache` or equivalent Next.js caching for Supabase queries
- [ ] Cache hit rate monitoring via Vercel Analytics or custom logging
- [ ] Playbook folder tree structure cached client-side in React Query / SWR with background revalidation
- [ ] Cache warming on app load: prefetch the coach's active playbook and current week's game plan
- [ ] Latency target: cached reads resolve in <50ms at the edge

---

## Issue #138: Pagination and virtual scroll for large playbooks
**Labels:** `feature`, `ui/ux`, `infra`
**Milestone:** Phase 3
**Priority:** High
**Description:** A varsity program may accumulate 500+ plays across multiple seasons. The playbook grid view and list view must handle large datasets without degrading performance. Implement cursor-based pagination on the API layer and virtual scrolling (windowed rendering) on the client so that only visible play thumbnails are rendered in the DOM at any time.
**Acceptance Criteria:**
- [ ] Supabase queries use cursor-based pagination (keyset pagination on `created_at` + `id`) instead of OFFSET
- [ ] API returns paginated results with `next_cursor` for subsequent fetches
- [ ] Playbook grid view uses virtual scroll (react-window, react-virtualized, or TanStack Virtual) to render only visible cards
- [ ] Playbook list view similarly virtualized
- [ ] Infinite scroll: next page loads automatically as the coach scrolls near the bottom
- [ ] Search results are also paginated and virtualized
- [ ] Performance target: playbook with 1000 plays loads initial view in <1 second, scrolls at 60fps
- [ ] Loading skeleton placeholders shown for cards not yet fetched

---

## Issue #139: N+1 query prevention and query optimization
**Labels:** `infra`, `data`, `chore`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Prevent N+1 query patterns across the application, especially in views that display multiple plays with their formations, routes, and tags. The playbook grid, game plan builder, and practice script all load collections of plays with related data. Without careful query design, rendering 50 play thumbnails could trigger 50+ individual Supabase queries. Use eager loading, batched queries, and denormalization where appropriate.
**Acceptance Criteria:**
- [ ] Audit all existing Supabase queries for N+1 patterns (document findings)
- [ ] Playbook grid view loads plays with formation and tag data in a single query using Supabase joins/selects
- [ ] Game plan view loads all referenced plays in a single batched query per section
- [ ] Play detail view loads formation, routes, blocking, and defense data in a single query with nested selects
- [ ] Implement a `usePlaysBatch` hook that batches individual play fetches within a render cycle into a single query
- [ ] Add query timing logging in development mode to catch slow queries (>200ms warning)
- [ ] Database indexes on frequently filtered columns: `plays.team_id`, `plays.formation_id`, `playbook_plays.folder_id`, `game_plan_plays.section_id`
- [ ] Verify no N+1 regressions with a test that asserts query count for key views

---

## Issue #140: Real-time subscriptions for collaborative editing
**Labels:** `feature`, `infra`, `data`
**Milestone:** Phase 6
**Priority:** High
**Description:** Build the real-time data layer using Supabase Realtime subscriptions to power collaborative editing (Issue #47). Multiple coaches on the same team should see live updates when another coach creates, edits, or deletes a play. The subscription architecture must be efficient (subscribe per-playbook or per-game-plan, not per-play) and handle connection drops, reconnects, and stale data gracefully.
**Acceptance Criteria:**
- [ ] Supabase Realtime channel per team workspace for broadcast events
- [ ] Granular subscriptions: subscribe to changes on a specific playbook, game plan, or play being actively edited
- [ ] Incoming changes trigger React state updates without full page reload (optimistic UI + server confirmation)
- [ ] Presence tracking: show which coaches are currently viewing/editing which plays
- [ ] Connection drop detection with automatic reconnect and state resync
- [ ] Stale data protection: on reconnect, diff local state against server state and surface conflicts
- [ ] Subscription cleanup on component unmount (no memory leaks or orphaned listeners)
- [ ] Rate limiting: batch rapid incoming changes (e.g., another coach dragging a player) to avoid render thrashing
- [ ] Works alongside the IndexedDB local-first layer without race conditions

---

## Issue #141: Edge function setup for heavy computation
**Labels:** `infra`, `feature`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** Set up Vercel Edge Functions (or Supabase Edge Functions) for computationally intensive operations that should not run on the client or in standard API routes. This includes blocking scheme auto-calculation against defensive fronts, Concept x Front matrix generation, coverage window detection, PDF generation for large playbooks, and tendency analysis. Edge functions run closer to the user with lower latency and can handle burst computation without blocking the main app.
**Acceptance Criteria:**
- [ ] Edge function project structure established (`/app/api/edge/` or Supabase Edge Functions in `/supabase/functions/`)
- [ ] Blocking auto-assignment computation runs as an edge function: input (scheme rules + defensive front) -> output (blocker-to-defender mapping)
- [ ] Concept x Front matrix generation runs as an edge function: input (concepts + fronts + scheme rules) -> output (matrix of play renderings)
- [ ] PDF generation for large exports (full playbook, multi-page scout cards) runs as an edge function to avoid client memory issues
- [ ] Edge functions authenticate requests using Supabase JWT tokens
- [ ] Response caching: identical inputs return cached results (content-addressable cache keys)
- [ ] Timeout handling: long-running computations return partial results or a job ID for polling
- [ ] Monitoring and logging for edge function invocations, latency, and errors via Vercel dashboard

---


---

# Mobile & PWA (#160-170)


---

## Issue #160: Apple Pencil pressure-sensitive drawing on iPad
**Labels:** `feature`, `mobile`, `ui/ux`, `competitive`
**Milestone:** Phase 1
**Priority:** High
**Description:** Leverage the Apple Pencil's pressure and tilt data via the Pointer Events API to create a premium drawing experience on iPad. Pressure sensitivity controls line thickness — light strokes for fine annotations, firm strokes for bold route lines. Tilt angle can influence line opacity for shading effects on freehand annotations. This makes the canvas feel like a real whiteboard marker, reinforcing the core "draw like a whiteboard" metaphor.
**Acceptance Criteria:**
- [ ] Detect Apple Pencil input via Pointer Events (`pointerType === 'pen'`) and separate from finger touch
- [ ] Pressure data (`event.pressure`) maps to route line thickness (range: 2px at light pressure to 6px at firm pressure)
- [ ] Tilt data (`event.tiltX`, `event.tiltY`) optionally maps to line opacity for freehand annotation mode
- [ ] Default route drawing (from player nodes) uses consistent line weight regardless of pressure (pressure only affects freehand annotations)
- [ ] Palm rejection: when Apple Pencil is active, ignore simultaneous finger touches on the canvas (fingers still work for pan/zoom)
- [ ] Pencil double-tap gesture (on supported models) toggles between Draw and Select modes
- [ ] Graceful fallback: on devices without pressure support, drawing works normally with default line weight
- [ ] Performance: pressure-sensitive rendering maintains 60fps with no input lag

---

## Issue #161: iPad Split View and Slide Over support
**Labels:** `feature`, `mobile`, `ui/ux`
**Milestone:** Phase 3
**Priority:** Medium
**Description:** When coaches use iPad Split View (running Big Ball Guy alongside Hudl, a video player, or Notes), the app must adapt its layout to the reduced viewport width without breaking. Similarly, Slide Over mode (narrow floating window) should show a usable single-column view. This is critical because coaches frequently watch film in one app while drawing plays in another.
**Acceptance Criteria:**
- [ ] App detects viewport resize events from Split View changes and re-renders layout accordingly
- [ ] At 50/50 split (~507px width on 11" iPad), the sidebar collapses and the canvas fills the available width
- [ ] At 70/30 or 30/70 split, layout adapts proportionally (sidebar as overlay at narrow widths)
- [ ] Slide Over mode (~320px width) shows a single-column mobile layout with canvas accessible via tab
- [ ] Canvas `<PlayRenderer>` resizes and re-centers the field when viewport dimensions change
- [ ] Touch targets remain at least 44px in all Split View configurations
- [ ] No horizontal scrolling or content overflow in any split configuration
- [ ] Field canvas maintains correct aspect ratio when resized

---

## Issue #162: PWA install prompt UX and onboarding
**Labels:** `feature`, `mobile`, `ui/ux`
**Milestone:** Phase 1
**Priority:** High
**Description:** Design a coach-friendly PWA install prompt that appears at the right moment and speaks the coach's language. The default browser "Add to Home Screen" banner is generic and easily dismissed. Instead, show a custom in-app prompt after the coach's second session (they've seen value) that explains the benefit in football terms: "Install Big Ball Guy for offline access at practice and on the bus. Tap here to add it to your home screen."
**Acceptance Criteria:**
- [ ] Intercept the `beforeinstallprompt` event and suppress the default browser banner
- [ ] Show a custom install prompt after the coach's 2nd session (tracked via localStorage counter)
- [ ] Prompt UI: a dismissible banner at the top of the screen with an app icon, short benefit message, and "Install" button
- [ ] Tapping "Install" triggers the native install flow via the stored `beforeinstallprompt` event
- [ ] "Not now" dismisses for 7 days; "Don't show again" dismisses permanently
- [ ] On iOS Safari (no `beforeinstallprompt`), show a manual instruction overlay: "Tap the Share button, then 'Add to Home Screen'"
- [ ] After successful install, show a one-time "You're all set!" confirmation with offline capabilities explained
- [ ] Install prompt never shows inside the standalone PWA (already installed)

---

## Issue #163: Offline indicator with sync queue display
**Labels:** `feature`, `mobile`, `ui/ux`
**Milestone:** Phase 1
**Priority:** High
**Description:** When the coach is offline (bus, practice field, locker room), the app must clearly communicate the offline state and show what changes are queued for sync. The current save indicator (Issue #14) shows a warning triangle when offline, but coaches need more confidence that their work is safe. Add a persistent offline banner and a sync queue panel showing exactly how many changes are pending and what they are.
**Acceptance Criteria:**
- [ ] Detect online/offline state via `navigator.onLine` and the `online`/`offline` events
- [ ] When offline, show a persistent amber banner at the top: "You're offline — changes are saved locally and will sync when you're back online"
- [ ] Save indicator in the corner changes to an amber cloud-with-arrow icon showing pending sync count (e.g., "3 changes pending")
- [ ] Tapping the save indicator opens a sync queue panel listing each pending change: entity name, action type, timestamp
- [ ] When connectivity returns, the banner briefly turns green: "Back online — syncing X changes..." then disappears
- [ ] Sync progress shown in the queue panel: checkmarks as each change syncs successfully
- [ ] If a sync fails (conflict, server error), the failed item shows a red indicator with a "Retry" option
- [ ] All offline state UI works in both browser and installed PWA modes

---

## Issue #164: Storage quota management and cleanup
**Labels:** `infra`, `mobile`, `feature`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** The local-first architecture stores play data, canvas snapshots, version history, and cached assets in IndexedDB and the service worker cache. On mobile devices with limited storage, this can hit browser quota limits (typically 50-100MB per origin on iOS Safari). Implement proactive storage monitoring, a cleanup strategy for old data, and user-facing controls to manage local storage usage.
**Acceptance Criteria:**
- [ ] Monitor storage usage via `navigator.storage.estimate()` and display current usage in app settings
- [ ] Warning threshold: when usage exceeds 70% of available quota, show a notification suggesting cleanup
- [ ] Automatic cleanup strategy (runs on app launch): purge version history snapshots older than 90 days, remove cached thumbnails for archived seasons, clear sync queue entries already confirmed by server
- [ ] Manual cleanup in settings: "Clear Local Cache" button that removes cached assets while preserving unsynced changes
- [ ] Before clearing any data, verify it has been synced to Supabase (never delete unsynced work)
- [ ] Storage breakdown view in settings: how much space is used by plays, thumbnails, version history, cached assets
- [ ] Graceful handling when quota is exceeded: catch `QuotaExceededError`, notify coach, trigger automatic cleanup
- [ ] iOS Safari specific: handle the 7-day eviction policy for unused PWAs by prompting regular app use

---

## Issue #165: Touch gesture conflict resolution — pinch-zoom vs canvas zoom
**Labels:** `core`, `mobile`, `ui/ux`
**Milestone:** Phase 1
**Priority:** Critical
**Description:** On touch devices, the browser's native pinch-to-zoom conflicts with the canvas's pinch-to-zoom-the-field behavior. Two-finger pinch on the canvas should zoom the football field (handled by Konva/Fabric), NOT the entire browser viewport. Similarly, two-finger pan on the canvas should pan the field, not scroll the page. This requires careful touch event handling to prevent the browser from hijacking canvas gestures while still allowing normal zoom/scroll outside the canvas area.
**Acceptance Criteria:**
- [ ] `touch-action: none` applied to the canvas element to prevent browser gesture interference
- [ ] Two-finger pinch on the canvas zooms the field (Konva/Fabric zoom), not the browser viewport
- [ ] Two-finger pan on the canvas pans the field, not the page
- [ ] Pinch-to-zoom on areas OUTSIDE the canvas (sidebar, panels, menus) still triggers normal browser zoom
- [ ] `<meta name="viewport" content="... user-scalable=no">` considered but only applied when canvas is focused (not globally, for accessibility)
- [ ] Single-finger drag behavior respects the current mode (Select, Draw, Pan) without triggering scroll
- [ ] Double-tap on the canvas does NOT trigger browser zoom — instead it selects/deselects elements
- [ ] Tested on iPad Safari, iPad Chrome, and Android Chrome with consistent behavior

---

## Issue #166: Orientation lock for field canvas
**Labels:** `feature`, `mobile`, `ui/ux`
**Milestone:** Phase 1
**Priority:** Medium
**Description:** The football field canvas is best viewed in landscape orientation, matching the natural shape of a football field. When the coach is actively editing a play on a mobile device or iPad in portrait mode, the app should suggest rotating to landscape. On the installed PWA, use the Screen Orientation API to request landscape lock when the canvas is in full-screen edit mode. Outside the canvas (playbook browser, settings), allow any orientation.
**Acceptance Criteria:**
- [ ] In the PWA manifest, set `"orientation": "any"` (do not force landscape globally)
- [ ] When entering the play editor (full `<PlayRenderer editable>`), request landscape orientation lock via `screen.orientation.lock('landscape')` if available
- [ ] When exiting the play editor, release the orientation lock
- [ ] On devices that don't support orientation lock (most browsers), show a gentle prompt: "Rotate your device for the best drawing experience" with a rotation icon
- [ ] The prompt auto-dismisses when the device rotates to landscape
- [ ] The prompt does not show on desktop or on iPads already in landscape
- [ ] Canvas layout adapts gracefully if the coach ignores the prompt and stays in portrait (narrower field, scrollable)
- [ ] Orientation changes do not reset the canvas state (zoom level, selected player, current mode)

---

## Issue #167: Viewport keyboard handling — iOS keyboard pushing canvas
**Labels:** `bug`, `mobile`, `ui/ux`
**Milestone:** Phase 1
**Priority:** Critical
**Description:** On iOS Safari and the iOS PWA, when the virtual keyboard opens (e.g., coach taps a text field to name a play, add a tag, or write a note), the viewport shrinks and pushes content up, often displacing the canvas off-screen or causing jarring layout shifts. This is especially bad when the coach taps a player label to rename it — the keyboard pushes the canvas and the player they were editing disappears from view. Implement robust keyboard handling that keeps the active input visible without destroying the canvas layout.
**Acceptance Criteria:**
- [ ] Detect virtual keyboard open/close via the Visual Viewport API (`window.visualViewport` resize events)
- [ ] When the keyboard opens from a canvas-overlay input (player label, route name), the canvas does NOT scroll or resize — the input floats above the keyboard
- [ ] When the keyboard opens from a sidebar/panel input (play name, tag, note), the panel scrolls to keep the input visible without affecting the canvas
- [ ] No layout jump or content reflow when the keyboard opens or closes
- [ ] On iOS, use `position: fixed` or `env(safe-area-inset-bottom)` to position inputs relative to the keyboard top
- [ ] Canvas maintains its dimensions and zoom level throughout keyboard open/close transitions
- [ ] Tested on iOS Safari 17+, iOS Chrome, and iPad in both portrait and landscape
- [ ] Android devices handled gracefully (Android uses viewport resize by default — ensure no double-compensation)

---

## Issue #168: Service worker lifecycle management
**Labels:** `infra`, `mobile`, `chore`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Manage the service worker lifecycle to ensure coaches always get the latest version of the app without disruptive forced reloads or stale cached pages. A poorly managed service worker can leave coaches stuck on an old version for days. Implement a "new version available" prompt that lets the coach update at a natural break point (not mid-drawing), and handle the install/activate/fetch lifecycle with proper cache versioning.
**Acceptance Criteria:**
- [ ] Service worker uses a versioned cache name (e.g., `bbg-cache-v1.2.3`) derived from the build hash
- [ ] On new deployment, the new service worker installs in the background without interrupting the current session
- [ ] When the new service worker is waiting to activate, show a non-intrusive "Update available" banner with a "Refresh" button
- [ ] The banner does NOT auto-refresh — the coach chooses when to update (never interrupt a drawing session)
- [ ] On "Refresh", call `skipWaiting()` on the new service worker and reload the page
- [ ] Old caches are cleaned up during the new service worker's `activate` event
- [ ] Cache strategy: network-first for API calls and play data, cache-first for static assets (JS, CSS, images, fonts)
- [ ] Stale content detection: if the service worker serves cached API data older than 24 hours, flag it in the UI
- [ ] Service worker registration error handling: if registration fails, the app still works (just without offline support)

---

## Issue #169: App icon and splash screen for all platforms
**Labels:** `ui/ux`, `mobile`, `infra`
**Milestone:** Phase 1
**Priority:** Medium
**Description:** Create and configure the full set of app icons and splash screens required for a polished PWA experience across iOS, Android, and desktop. When a coach installs the app to their iPad home screen, it should show a crisp icon (not a generic browser thumbnail) and a branded splash screen on launch, matching the professional quality of native apps.
**Acceptance Criteria:**
- [ ] App icon designed at base resolution with football/playbook motif, readable at small sizes
- [ ] Icon exported at all required sizes: 192x192, 512x512 (manifest), plus Apple Touch Icon sizes (120x120, 152x152, 167x167, 180x180)
- [ ] Maskable icon variant (with safe zone padding) for Android adaptive icons, declared in manifest
- [ ] `apple-touch-icon` meta tags in the HTML head for each iOS size
- [ ] Web app manifest (`manifest.json`) configured with `icons`, `name`, `short_name`, `theme_color` (#0f172a dark), `background_color`, and `display: standalone`
- [ ] Apple splash screens generated for all iOS device sizes using `apple-touch-startup-image` media queries
- [ ] Splash screen shows the app logo centered on the dark theme background color
- [ ] Favicon set: `favicon.ico` (16x16, 32x32), `favicon.svg` for modern browsers
- [ ] Icons and splash screens tested on iPad (10.9", 11", 12.9"), iPhone, and Android devices

---

## Issue #170: Tablet-optimized layout breakpoints
**Labels:** `ui/ux`, `mobile`, `core`
**Milestone:** Phase 1
**Priority:** High
**Description:** Define and implement precise layout breakpoints optimized for the tablet form factors coaches actually use, going beyond the generic responsive design in Issue #52. The current breakpoints (phone/tablet/desktop) need refinement for the specific iPad models (10.9" Air, 11" Pro, 12.9" Pro) and common Android tablets (Samsung Galaxy Tab S series). Each breakpoint should specify exact sidebar widths, canvas proportions, toolbar positions, and font sizes to maximize the play drawing area while keeping controls accessible.
**Acceptance Criteria:**
- [ ] Breakpoint definitions: phone (<640px), small tablet (640-834px), standard tablet (835-1024px), large tablet (1025-1366px), desktop (>1366px)
- [ ] Standard tablet (11" iPad landscape, 1194px): canvas takes 70% width, sidebar 30%, floating toolbar at bottom center
- [ ] Large tablet (12.9" iPad landscape, 1366px): canvas takes 75% width, sidebar 25%, extra room for wider thumbnails in sidebar
- [ ] Small tablet / iPad portrait (834px): sidebar collapses to a slide-out overlay, canvas takes full width, toolbar pinned to bottom
- [ ] Phone: canvas full width, all controls in a bottom sheet, simplified toolbar with fewer visible buttons
- [ ] Sidebar width transitions smoothly (no content jump) when crossing breakpoints
- [ ] Font sizes scale per breakpoint: sidebar labels, play names, and button text are readable at each size without being oversized
- [ ] CSS implemented via Tailwind responsive utilities (`sm:`, `md:`, `lg:`, `xl:`, custom breakpoints) — no JavaScript-based layout switching
- [ ] Tested on real devices: iPad Air 10.9", iPad Pro 11", iPad Pro 12.9", Samsung Galaxy Tab S9, iPhone 15 Pro Max

---

---

# Coach Workflows (#190-199)


## Issue #190: Import plays from image/photo (AI recognition)
**Labels:** `feature`, `future`, `competitive`
**Milestone:** Phase 6
**Priority:** High
**Description:** Allow coaches to upload a photo of a whiteboard, printed playbook page, or hand-drawn diagram and have AI automatically recognize the formation, player positions, and routes, converting the image into an editable play on the canvas. This eliminates the manual re-drawing barrier for coaches migrating from pen-and-paper or legacy tools.
**Acceptance Criteria:**
- [ ] Upload interface accepts JPEG, PNG, and HEIC images (camera roll and file picker)
- [ ] AI model detects offensive and defensive player positions and places `PlayerIcon` components on the field
- [ ] AI model traces route lines and converts them into editable `RouteLine` paths
- [ ] Confidence indicator shown per detected element (high/medium/low)
- [ ] Coach can accept, reject, or adjust each detected element before saving
- [ ] Works with common playbook diagram styles (circles/triangles, arrows, standard football notation)
- [ ] Processing completes in under 10 seconds for a single play image
- [ ] Imported play is fully editable like any hand-drawn play

---

## Issue #191: Copy opponent's play from film screenshot
**Labels:** `feature`, `competitive`, `scouting`
**Milestone:** Phase 4
**Priority:** High
**Description:** During film review, coaches frequently screenshot an opponent's formation or play from Hudl or video. This feature lets a coach paste or upload a film screenshot and trace over it to create a scoutable play diagram. The screenshot serves as a background layer on the canvas so the coach can quickly place defenders and formation elements by tracing what they see on film. This is dramatically faster than manually reconstructing opponent plays from memory.
**Acceptance Criteria:**
- [ ] Paste or upload a screenshot as a background layer on the canvas
- [ ] Background image opacity is adjustable (25%-75%) so the coach can draw over it
- [ ] Coach can pan and scale the background image to align with the field grid
- [ ] Player icons snap correctly when placed over the background reference
- [ ] Background image is stripped when the play is saved (only the resulting diagram persists)
- [ ] Option to keep the background image as a reference attachment on the play
- [ ] Works with common video screenshot resolutions and aspect ratios

---

## Issue #192: Install migration from one team to another
**Labels:** `feature`, `data`, `competitive`
**Milestone:** Phase 3
**Priority:** Medium
**Description:** When a coach changes schools or programs, they need to bring their playbook with them. This feature enables exporting an entire install (formations, route trees, blocking schemes, concepts, and plays) as a portable package and importing it into a new team account. Imported libraries merge with or replace the destination team's existing libraries, and all play references re-link correctly.
**Acceptance Criteria:**
- [ ] Export entire playbook or selected folders as a `.bbg` portable package (JSON-based)
- [ ] Export includes formations, route library, blocking schemes, defensive fronts, and plays
- [ ] Import wizard on the destination team walks through merge vs replace for each library type
- [ ] Conflicting items (e.g., formation with the same name) prompt the coach to rename, skip, or overwrite
- [ ] All internal references (play -> formation, play -> blocking scheme) re-link after import
- [ ] Team branding (colors, logo) is NOT included in the export to avoid overwriting the new team's identity
- [ ] Import/export works for playbooks with up to 500 plays without timeout

---

## Issue #193: Assistant coach permission levels
**Labels:** `feature`, `infra`
**Milestone:** Phase 3
**Priority:** High
**Description:** Coaching staffs have distinct roles with different access needs. The head coach or offensive/defensive coordinator should control who can edit the master playbook vs. who has read-only access. This feature introduces role-based permissions at the team level so that assistant coaches, GAs, and student assistants can view plays without accidentally modifying the master install.
**Acceptance Criteria:**
- [ ] Three permission roles: Owner (full control + billing), Editor (create/edit/delete plays), Viewer (read-only access to all plays)
- [ ] Team owner can assign roles to each coach on the team roster
- [ ] Editors can create/edit plays, game plans, and practice scripts but cannot change team settings or delete the team
- [ ] Viewers can browse the playbook, view game plans, and access shared outputs but cannot modify anything
- [ ] Permission checks enforced at the API level (Supabase RLS policies), not just UI hiding
- [ ] Role changes take effect immediately without requiring the affected coach to log out
- [ ] Invitation emails specify the role being granted

---

## Issue #194: Parent/booster view-only mode
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 5
**Priority:** Low
**Description:** Some programs want to give parents or booster club members a limited window into the playbook for engagement purposes without exposing competitive strategy. This feature provides a curated, coach-controlled public-facing view that shows selected plays, team branding, and general program information without revealing the full game plan, scouting notes, or tendency data.
**Acceptance Criteria:**
- [ ] Coach can flag specific plays or folders as "public showcase" eligible
- [ ] Generate a branded public link with team colors, logo, and name
- [ ] Public view shows only showcase-flagged plays as read-only diagrams
- [ ] No game plan, scouting, tendency, or note data is exposed in the public view
- [ ] Public view is mobile-friendly with swipe navigation and dark background
- [ ] Coach can revoke or regenerate the public link at any time
- [ ] Optional password protection on the public link

---

## Issue #195: Multi-sport support (same engine, different field)
**Labels:** `feature`, `future`
**Milestone:** Phase 6
**Priority:** Low
**Description:** The canvas engine, player placement system, route drawing, and playbook organization are not inherently football-specific. This feature abstracts the field renderer to support multiple sport configurations (basketball half-court, soccer pitch, lacrosse field, hockey rink) using the same underlying `FieldCanvas`, `PlayerIcon`, and `RouteLine` primitives. Each sport defines its own field dimensions, markings, default positions, and terminology.
**Acceptance Criteria:**
- [ ] Sport configuration schema defines field dimensions, markings, player count, and position labels
- [ ] `FieldCanvas` renders the correct field for the selected sport
- [ ] Default formations and position labels load per sport (e.g., PG/SG/SF/PF/C for basketball)
- [ ] Route/movement drawing works identically across all sports
- [ ] Playbook organization, tagging, and export features work unchanged
- [ ] Football remains the default and primary sport; others are opt-in
- [ ] At least one additional sport (basketball) fully functional as proof of concept

---

## Issue #196: Season-over-season comparison
**Labels:** `feature`, `analytics`
**Milestone:** Phase 6
**Priority:** Medium
**Description:** Coaches want to evaluate how their play-calling and install evolve across seasons. This feature provides a comparison dashboard showing which plays were carried forward, which were dropped, what was added, and how game plan composition shifted. It helps coaches answer questions like "Are we running more RPO this year?" and "Which plays from last season's install did we stop using and why?"
**Acceptance Criteria:**
- [ ] Season selector to compare any two seasons side-by-side
- [ ] Summary stats: total plays, new plays added, plays removed, plays unchanged
- [ ] Breakdown by concept type (run/pass/RPO/screen) showing usage shifts
- [ ] Breakdown by formation showing which formations gained or lost plays
- [ ] Visual diff view highlighting added (green), removed (red), and unchanged plays
- [ ] Exportable comparison report as PDF for staff review
- [ ] Requires at least two seasons of data to activate

---

## Issue #197: Team roster integration for personnel matching
**Labels:** `feature`, `data`
**Milestone:** Phase 4
**Priority:** Medium
**Description:** Coaches assign personnel groupings (11, 12, 21, etc.) to plays, but those groupings map to real players on the roster. This feature lets the coach import or manually enter their roster and assign players to position groups, so when a play calls for 12 personnel the coach can see which actual players (by name and number) are on the field. This bridges the gap between abstract X's and O's and the real human beings running the plays.
**Acceptance Criteria:**
- [ ] Roster management page: add/edit/remove players with name, number, position, and personnel group
- [ ] CSV import for roster data (name, number, position columns)
- [ ] When viewing a play tagged with a personnel group, option to show player names/numbers instead of position labels
- [ ] Depth chart support: 1st string, 2nd string per position
- [ ] Personnel group filter in the playbook browser shows which plays each personnel group runs
- [ ] Roster data syncs across all coaches on the team
- [ ] Roster is season-scoped (new roster each year, old rosters archived)

---

## Issue #198: Drill card generation for practice
**Labels:** `feature`, `print`, `competitive`
**Milestone:** Phase 5
**Priority:** Medium
**Description:** Coaches need individual drill cards for position group meetings and practice station work. Unlike full play diagrams, drill cards isolate a specific segment of a play (e.g., just the offensive line blocking assignments, or just the receiver routes) and format it for quick reference at a practice station. This feature auto-generates drill cards from existing plays by filtering to a position group and formatting for print.
**Acceptance Criteria:**
- [ ] Select a play and a position group (OL, WR, RB, QB, DL, LB, DB) to generate a drill card
- [ ] Drill card shows only the selected position group's assignments with relevant defenders
- [ ] Non-relevant players are dimmed or hidden for visual clarity
- [ ] Card includes play name, formation, and coach notes for that position group
- [ ] Batch generation: select multiple plays to generate a full set of drill cards for a position meeting
- [ ] Print layout: 4-up or 6-up per page, cut-line friendly
- [ ] PDF export matching the existing print layout engine style

---

## Issue #199: In-app messaging for coach coordination
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 6
**Priority:** Low
**Description:** Coaching staffs currently coordinate via text messages, group chats, and email threads that are disconnected from the playbook. This feature adds lightweight in-app messaging tied to specific plays, game plans, or general team discussion. A coach can leave a comment on a play ("Should we add a check-with-me on this vs nickel?") and other staff members see it in context rather than in a separate app.
**Acceptance Criteria:**
- [ ] Comment thread on any play, game plan, or practice script
- [ ] Comments show author name, timestamp, and are ordered chronologically
- [ ] @mention other coaches on the team to send a notification
- [ ] Notification badge on the app icon and in-app notification bell
- [ ] Unread comment indicator on plays that have new discussion
- [ ] Comments are visible to all team members (respecting their permission level — viewers can read but not comment)
- [ ] Option to resolve/archive a comment thread when the discussion is complete

---


---

# Performance & Scale (#220-230)


## Issue #220: Canvas rendering optimization for large play counts (>50 players)
**Labels:** `infra`, `core`
**Milestone:** Infrastructure
**Priority:** Critical
**Description:** When rendering scout cards, defensive ID charts, or concept matrix cells with both offensive and defensive players (22+ icons plus routes and blocking), the canvas can drop below 60fps. This issue addresses rendering performance through layer caching, off-screen rendering for static elements (field lines, hash marks), and batch rendering for player icons. The target is smooth 60fps interaction even with 50+ objects on the canvas simultaneously.
**Acceptance Criteria:**
- [ ] Field markings (yard lines, hashes, numbers) render to a cached static layer, not redrawn every frame
- [ ] Player icons batch-render using a single draw call where possible
- [ ] Route lines use simplified paths at thumbnail/card sizes and full-detail paths only at full size
- [ ] Canvas maintains 60fps with 22 players + 22 routes + blocking assignments visible
- [ ] Profiling benchmark: full play render (cold) completes in under 16ms on a mid-range iPad
- [ ] No visible jank when dragging players on a crowded canvas
- [ ] Level-of-detail system: reduce rendering fidelity at smaller `PlayRenderer` sizes

---

## Issue #221: Lazy loading for playbook grid view
**Labels:** `infra`, `ui/ux`
**Milestone:** Infrastructure
**Priority:** High
**Description:** The playbook thumbnail grid (Issue #26) renders a `PlayRenderer` for every play in a folder. For large playbooks (100+ plays), rendering all thumbnails simultaneously causes page load delays and excessive memory usage. This issue implements virtualized rendering so that only thumbnails visible in the viewport are rendered, with placeholders for off-screen items that render as the coach scrolls.
**Acceptance Criteria:**
- [ ] Virtualized list/grid renders only visible thumbnails plus a small buffer (1-2 rows above and below)
- [ ] Placeholder skeleton cards shown for off-screen plays
- [ ] Smooth scroll performance with 500+ plays in a single folder
- [ ] Thumbnails render progressively as they enter the viewport (no blank flash)
- [ ] Memory usage stays flat regardless of playbook size (no leaked canvas contexts)
- [ ] Search/filter results also use virtualized rendering
- [ ] Initial page load for a 200-play folder completes in under 2 seconds

---

## Issue #222: IndexedDB storage limits and eviction policy
**Labels:** `infra`, `data`
**Milestone:** Infrastructure
**Priority:** High
**Description:** The local-first architecture (Issue #14) stores all play data in IndexedDB, but browsers impose storage limits (especially Safari on iOS, which can be as low as 50MB in some contexts). This issue implements a storage monitoring system that tracks usage, warns the coach when approaching limits, and provides an intelligent eviction policy that clears cached data for plays not recently accessed while preserving unsaved changes.
**Acceptance Criteria:**
- [ ] Storage usage monitor shows current IndexedDB consumption in team settings
- [ ] Warning notification when storage exceeds 80% of the estimated browser quota
- [ ] Eviction policy: least-recently-accessed plays are removed from local cache first
- [ ] Plays with unsynced changes are NEVER evicted (protected until sync completes)
- [ ] Evicted plays re-fetch from Supabase on next access (transparent to the coach)
- [ ] Coach can manually trigger "Clear local cache" from settings
- [ ] Safari-specific handling: respect the tighter storage constraints on iOS WebKit
- [ ] Storage usage stays under 40MB for a typical 200-play playbook

---

## Issue #223: Supabase connection pooling and query optimization
**Labels:** `infra`, `data`
**Milestone:** Infrastructure
**Priority:** High
**Description:** As the user base scales, Supabase Postgres connections become a bottleneck. This issue implements connection pooling via Supabase's built-in PgBouncer, batches related queries to reduce round-trips, and optimizes hot-path queries (playbook load, game plan fetch, play save) to minimize connection hold time.
**Acceptance Criteria:**
- [ ] PgBouncer connection pooling enabled in transaction mode on Supabase
- [ ] Playbook load fetches all plays in a folder with a single query (no N+1 for formations/routes)
- [ ] Game plan load uses a single joined query for sections + plays + defense overlays
- [ ] Play save uses an upsert with returning clause to avoid separate read-after-write
- [ ] Batch sync endpoint: offline changes sync in a single transaction, not one query per change
- [ ] Connection count stays under 20 concurrent connections for 100 active users
- [ ] Average query response time under 100ms for all hot-path operations

---

## Issue #224: Image optimization for play thumbnails
**Labels:** `infra`, `ui/ux`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** Play thumbnails in the grid view are currently rendered client-side by the canvas engine, which is expensive when displaying many at once. This issue implements server-side (or edge-function) thumbnail generation that pre-renders play diagrams as optimized PNG/WebP images, caches them, and serves them as static images in the grid. The canvas engine is only used for the full-size editable view.
**Acceptance Criteria:**
- [ ] Thumbnail images generated as WebP at 300x200px resolution
- [ ] Thumbnails regenerate automatically when a play is modified
- [ ] Thumbnails cached in Supabase Storage or a CDN-backed bucket
- [ ] Grid view loads thumbnail images instead of rendering full canvas instances
- [ ] Fallback to client-side canvas rendering if thumbnail image is not yet generated
- [ ] Grid view with 100 plays loads in under 1.5 seconds on a 4G connection
- [ ] Thumbnail generation completes within 3 seconds of play save

---

## Issue #225: Bundle size optimization and code splitting
**Labels:** `infra`, `chore`
**Milestone:** Infrastructure
**Priority:** High
**Description:** The canvas library (Konva.js or Fabric.js), PDF generation library, and other heavy dependencies inflate the initial bundle size. Coaches on slow school WiFi or cellular connections need the app to load fast. This issue implements aggressive code splitting so that the initial load contains only the shell and field canvas, with libraries, game planning, output, and admin features loaded on demand.
**Acceptance Criteria:**
- [ ] Initial JavaScript bundle under 150KB gzipped (shell + canvas core only)
- [ ] PDF generation library loaded on-demand when export is triggered
- [ ] Game planning, practice script, and scouting modules loaded on first navigation
- [ ] Route/formation/defense libraries loaded when the picker is first opened
- [ ] Admin and team settings loaded on-demand
- [ ] Lighthouse performance score above 90 on mobile simulation
- [ ] Bundle analysis report generated on each build (webpack-bundle-analyzer or equivalent)

---

## Issue #226: CDN setup for static assets and field textures
**Labels:** `infra`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** Static assets (field texture images, default formation thumbnails, app icons, fonts) should be served from a CDN edge location close to the user rather than from the Vercel origin. This reduces latency for coaches in rural areas with high-latency connections and improves the perceived performance of the initial app load and playbook browsing.
**Acceptance Criteria:**
- [ ] All static assets (images, fonts, icons) served via CDN with cache-control headers
- [ ] Vercel Edge Network configured for optimal caching of static resources
- [ ] Cache-busting via content hashing on asset filenames
- [ ] CDN cache hit rate above 95% for static assets after warm-up
- [ ] First Contentful Paint under 1.5 seconds on a simulated 4G connection
- [ ] Custom domain configured with CDN-backed SSL
- [ ] Asset preloading for critical above-the-fold resources (field canvas assets)

---

## Issue #227: Database index optimization for common queries
**Labels:** `infra`, `data`
**Milestone:** Infrastructure
**Priority:** High
**Description:** As playbooks grow and multiple teams share the same Supabase instance, unindexed queries will degrade. This issue audits all hot-path queries and adds appropriate indexes. Key areas: playbook plays filtered by folder, plays filtered by tags, game plan sections by game plan ID, and search across play names and tags.
**Acceptance Criteria:**
- [ ] Composite index on `playbook_plays(folder_id, sort_order)` for ordered folder listing
- [ ] GIN index on `plays.tags` for tag-based filtering
- [ ] Index on `plays(team_id, name)` for search queries
- [ ] Index on `game_plan_sections(game_plan_id, sort_order)` for game plan loading
- [ ] Index on `formations(team_id, is_default)` for formation picker
- [ ] `EXPLAIN ANALYZE` results confirm index usage on all hot-path queries
- [ ] No query in the hot path exceeds 50ms on a database with 10,000 plays across 100 teams
- [ ] Index maintenance documented in a migration file

---

## Issue #228: Memory management for large playbooks
**Labels:** `infra`, `core`
**Milestone:** Infrastructure
**Priority:** High
**Description:** A coach with a 300+ play playbook who browses through many plays in a single session can accumulate leaked canvas contexts, unreleased image data, and stale React component state. This issue implements a memory management strategy including canvas context pooling, aggressive cleanup of off-screen renderers, and monitoring for memory leaks during long editing sessions.
**Acceptance Criteria:**
- [ ] Canvas contexts are pooled and reused rather than created/destroyed per play view
- [ ] Off-screen `PlayRenderer` instances fully dispose their canvas context when unmounted
- [ ] Memory profiling shows stable heap usage after opening and closing 50 plays sequentially
- [ ] No more than 10 canvas contexts exist simultaneously (pooled)
- [ ] Image/texture data released when a play is scrolled out of the viewport
- [ ] Warning logged (dev mode) if memory usage exceeds 200MB
- [ ] Long session test: 30 minutes of active use with no memory growth beyond initial baseline + 20%

---

## Issue #229: Server-side rendering for shared play links
**Labels:** `infra`, `feature`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** When a coach shares a play link via QR code or URL (Issue #41), the recipient currently loads the full SPA before seeing the play. This issue implements server-side rendering for shared/public play views so that the play diagram renders as part of the initial HTML payload. This improves time-to-first-paint, enables Open Graph previews (play thumbnail in iMessage/Slack/Twitter), and reduces the JavaScript required for read-only viewing.
**Acceptance Criteria:**
- [ ] Shared play URLs return server-rendered HTML with the play diagram visible before JavaScript loads
- [ ] Open Graph meta tags include a thumbnail image of the play for social/chat previews
- [ ] Time-to-first-paint for shared links under 1 second on 4G
- [ ] JavaScript for interactivity (swipe, zoom) hydrates after initial render
- [ ] Server-rendered view works with JavaScript disabled (static image fallback)
- [ ] No flash of unstyled content or layout shift during hydration
- [ ] Shared links for expired or revoked tokens show a clean "Link expired" page, not an error

---

## Issue #230: Web worker for background sync operations
**Labels:** `infra`, `core`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** The background sync between IndexedDB and Supabase (Issue #14) currently runs on the main thread, which can cause micro-jank during play editing when a sync operation triggers. This issue moves all sync logic (diffing local vs remote state, uploading changes, downloading updates, conflict resolution) into a dedicated Web Worker so the main thread remains completely free for canvas rendering and user interaction.
**Acceptance Criteria:**
- [ ] Dedicated Web Worker handles all IndexedDB-to-Supabase sync operations
- [ ] Main thread communicates with the worker via `postMessage` for sync status updates
- [ ] Sync indicator in the UI updates based on worker messages (saved/syncing/offline)
- [ ] Zero main-thread blocking during sync — canvas interactions remain at 60fps during active sync
- [ ] Worker handles conflict resolution (last-write-wins) and reports conflicts to the main thread
- [ ] Worker gracefully handles network failures with exponential backoff retry
- [ ] Worker is shared across all open tabs to prevent duplicate sync operations (SharedWorker or BroadcastChannel)

---


---

# Canvas & Drawing (#250-261)


## Issue #250: Snap-to-grid with configurable grid size
**Labels:** `feature`, `ui/ux`, `core`
**Milestone:** Phase 2
**Priority:** Medium
**Description:** When placing or moving players, their positions should snap to an invisible grid to produce clean, evenly-spaced formations. The grid size should be configurable (1-yard, half-yard, or off) so coaches can choose between precise alignment and freeform placement. Snap-to-grid is especially important for the formation builder where exact alignment to hash marks and yard lines matters.
**Acceptance Criteria:**
- [ ] Players snap to grid positions when dragged near a grid intersection
- [ ] Grid size configurable: 1 yard, 0.5 yard, or off (freeform)
- [ ] Snap threshold: player snaps when within 25% of grid cell size from an intersection
- [ ] Hold Shift (desktop) or toggle button (mobile) to temporarily disable snap while dragging
- [ ] Visual grid overlay option: coach can toggle a faint grid display for alignment reference
- [ ] Grid aligns to hash marks and yard lines on the field
- [ ] Grid preference persists per coach in localStorage

---

## Issue #251: Route path editing — move individual waypoints
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 2
**Priority:** High
**Description:** After a route is drawn (freehand or from the library), the coach should be able to fine-tune it by selecting individual waypoints (the inflection/break points along the path) and dragging them to new positions. This allows precise adjustments without redrawing the entire route. It is the equivalent of editing bezier control points in a vector drawing tool, but simplified for football context.
**Acceptance Criteria:**
- [ ] Tapping a drawn route enters edit mode showing all waypoints as draggable handles
- [ ] Dragging a waypoint moves that point while maintaining smooth curves to adjacent segments
- [ ] Break points (hard cuts) remain crisp when adjacent waypoints are moved
- [ ] Adding a new waypoint: tap on the route path between existing points to insert one
- [ ] Deleting a waypoint: select and press delete/backspace or tap a remove button
- [ ] Route endpoint (arrowhead) is also draggable to extend or shorten the route
- [ ] Editing a library-linked route creates a per-play override without modifying the library original
- [ ] Waypoint editing works on both touch and mouse input

---

## Issue #252: Copy/paste routes between players
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 2
**Priority:** Medium
**Description:** Coaches frequently want the same route on multiple receivers (e.g., four verticals where all eligible receivers run Go routes). Rather than drawing the same route four times, the coach should be able to copy a route from one player and paste it onto another. The pasted route adjusts its origin to the target player's position while maintaining its shape, depth, and break angles.
**Acceptance Criteria:**
- [ ] Select a player's route, then Cmd+C / Ctrl+C (or context menu "Copy Route")
- [ ] Select another player, then Cmd+V / Ctrl+V (or context menu "Paste Route")
- [ ] Pasted route originates from the target player's position with the same relative path
- [ ] Route direction mirrors if pasting from a left-side player to a right-side player (configurable)
- [ ] Multi-paste: copy once, paste onto multiple players sequentially
- [ ] Mobile workflow: tap route -> "Copy" button -> tap target player -> "Paste" button
- [ ] Pasted route is an independent copy (editing one does not affect the other)

---

## Issue #253: Mirror play — flip horizontally
**Labels:** `feature`, `ui/ux`, `competitive`
**Milestone:** Phase 2
**Priority:** High
**Description:** Every play needs a mirrored variant. Trips Right becomes Trips Left, Power Right becomes Power Left. Rather than redrawing, the coach should be able to mirror any play with a single tap. The mirror operation flips all player positions and routes across the vertical center axis of the field, reversing left/right while maintaining all assignments and relationships.
**Acceptance Criteria:**
- [ ] "Mirror" button on any play in the editor
- [ ] All player positions flip across the field's vertical center axis
- [ ] All routes and blocking assignments flip correspondingly
- [ ] Player labels update if they contain directional references (configurable)
- [ ] Mirroring creates a new play (does not modify the original) — coach can also choose "mirror in place"
- [ ] Defense overlay also mirrors if present
- [ ] Double-mirror returns to the original layout (mathematically correct flip)
- [ ] Mirrored play saves with auto-generated name: "[Original Name] (Flipped)"

---

## Issue #254: Player label customization
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 2
**Priority:** Medium
**Description:** Different coaching systems use different labeling conventions. Some use letters (X, Z, H, Y, F), some use numbers (1, 2, 3, 4, 5), some use position names (SE, FL, TE, TB, FB), and some use custom terminology. Coaches need to define their own label set and have it apply consistently across all formations and plays.
**Acceptance Criteria:**
- [ ] Team-level label configuration: define label names for each offensive and defensive position
- [ ] Default label set pre-loaded (X, Z, H, Y, F for receivers; T, G, C for line; QB, RB for backfield)
- [ ] Coach can override any label (e.g., change "H" to "Slot" or "3")
- [ ] Labels support up to 4 characters (to fit inside player icons)
- [ ] Label changes propagate to all plays using that position
- [ ] Font size auto-adjusts based on label length (1 char = large, 4 chars = smaller)
- [ ] Defensive labels configurable separately (E, T, N, W, M, S, C, FS, SS, etc.)
- [ ] Label set exportable with install migration (Issue #192)

---

## Issue #255: Zone coverage shading
**Labels:** `feature`, `ui/ux`, `competitive`
**Milestone:** Phase 4
**Priority:** High
**Description:** When a zone coverage is applied (Cover 2, Cover 3, Cover 4, etc.), the field should display shaded zones representing each defender's coverage responsibility area. This is how coaches teach coverage on a whiteboard — colored zones showing who is responsible for which area of the field. The shading should be semi-transparent, color-coded per defender, and toggle-able independently of player icons.
**Acceptance Criteria:**
- [ ] Zone shading renders automatically when a zone coverage is selected from the defense library
- [ ] Each zone is a semi-transparent polygon matching the defender's coverage responsibility
- [ ] Zones are color-coded: deep zones (blue), underneath zones (yellow), flat zones (green), hook/curl zones (orange)
- [ ] Zone boundaries align with standard coverage landmarks (hash marks, numbers, sideline)
- [ ] Coach can toggle zone shading on/off independently of the defensive player icons
- [ ] Zone shading works for Cover 1 (man + free zone), Cover 2, Cover 3, Cover 4, Cover 6, and custom coverages
- [ ] Zone shading renders at card and full sizes (hidden at thumbnail/wristband sizes for clarity)
- [ ] Shading opacity is adjustable (25%-50% range)

---

## Issue #256: Motion/shift pre-snap animation
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 5
**Priority:** Medium
**Description:** Many plays involve pre-snap motion (a receiver running across the formation before the snap) or shifts (multiple players repositioning pre-snap). The coach should be able to define a motion/shift path that animates when the play is viewed, showing where the player starts, where they move to, and where the play begins from. This is distinct from post-snap route animation (Issue #45) — this shows only the pre-snap movement.
**Acceptance Criteria:**
- [ ] Coach can draw a motion path from a player's starting position to their motion destination
- [ ] Motion path renders as a dashed or wavy line on the static play diagram
- [ ] "Animate" button shows the player moving along the motion path before the snap
- [ ] Motion timing is adjustable (slow, medium, fast)
- [ ] Multiple players can have simultaneous shift paths (for shift plays)
- [ ] Post-snap routes begin from the motion destination, not the original position
- [ ] Motion paths are included in play exports (PNG/PDF) as dashed lines
- [ ] Motion indicator icon on play thumbnails so coaches can identify motion plays at a glance

---

## Issue #257: Custom field markings (hash marks, numbers, end zone)
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 2
**Priority:** Medium
**Description:** High school, college, and NFL fields have different hash mark widths (53'4" wide field is the same, but HS hashes are 53'4"/3 apart, college are 40' apart, and NFL hashes are 18'6" apart). The field renderer needs to support configurable hash mark positions so that player alignments are accurate for the coach's level of play. Additionally, coaches should be able to toggle end zones, field numbers, and sideline details.
**Acceptance Criteria:**
- [ ] Hash mark width presets: High School, College, NFL (with correct measurements)
- [ ] Team-level setting for hash mark configuration (persists for all plays)
- [ ] End zone rendering toggle (on/off, useful for goal line plays)
- [ ] Field numbers (10, 20, 30...) toggle on/off
- [ ] Sideline and boundary lines toggle on/off
- [ ] "Field section" selector: show full field, red zone (20-yard line to end zone), or custom yard range
- [ ] All field markings render correctly at every `PlayRenderer` size variant
- [ ] Hash mark setting included in install migration export (Issue #192)

---

## Issue #258: Ruler/measurement tool
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 3
**Priority:** Low
**Description:** Coaches care about exact depths and splits (how far a receiver aligns from the tackle, how deep a route breaks). A ruler/measurement tool lets the coach tap two points on the field and see the distance in yards. This is useful for verifying alignment accuracy, ensuring route depths match the route tree, and teaching players exact spacing.
**Acceptance Criteria:**
- [ ] Ruler tool selectable from the canvas toolbar
- [ ] Tap two points on the field to see the distance in yards (to one decimal place)
- [ ] Measurement line renders between the two points with the distance label
- [ ] Measurement snaps to players: tap a player then tap the yard line to measure their depth
- [ ] Multiple measurements can be visible simultaneously
- [ ] Measurements are temporary (not saved with the play) unless the coach pins them
- [ ] Pinned measurements render on exports as subtle dimension lines
- [ ] Unit display: yards (default), feet (toggle)

---

## Issue #259: Multi-select and group move
**Labels:** `feature`, `ui/ux`, `core`
**Milestone:** Phase 2
**Priority:** High
**Description:** When adjusting formations or moving clusters of players, the coach needs to select multiple players and drag them as a group while preserving their relative spacing. This is essential for shifting an entire formation left or right, adjusting the backfield depth, or moving all receivers simultaneously. Without this, repositioning 11 players one at a time is tedious.
**Acceptance Criteria:**
- [ ] Lasso select: draw a selection rectangle around multiple players (desktop: click-drag on empty space; mobile: two-finger drag)
- [ ] Shift+click (desktop) or tap-to-toggle (mobile) to add/remove individual players from selection
- [ ] "Select All" shortcut (Cmd+A / Ctrl+A)
- [ ] Dragging any selected player moves the entire group, preserving relative positions
- [ ] Group selection highlighted with a bounding box and selection count indicator
- [ ] Group delete: press Delete to remove all selected players
- [ ] Group route actions: apply the same route to all selected eligible receivers in one action
- [ ] Deselect all: tap empty space or press Escape

---

## Issue #260: Canvas zoom persistence across sessions
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 1
**Priority:** Low
**Description:** When a coach sets a specific zoom level and pan position on the canvas (e.g., zoomed into the red zone, or viewing only the right side of the field), that view state should persist when they navigate away and return. Currently, zoom resets to the default each time a play is opened. This is especially annoying for coaches who always work zoomed into a specific field section.
**Acceptance Criteria:**
- [ ] Canvas zoom level and pan offset saved to localStorage on every change (debounced)
- [ ] On play open, canvas restores the last-used zoom level and pan position
- [ ] Per-play zoom memory: each play remembers its own zoom state (if the coach zoomed in on a specific area for that play)
- [ ] Global default zoom preference in settings (e.g., "always start at red zone view")
- [ ] "Reset zoom" button to return to the default full-field view
- [ ] Zoom state included in session recovery (Issue #56)

---

## Issue #261: High-DPI canvas rendering
**Labels:** `infra`, `ui/ux`, `core`
**Milestone:** Phase 1
**Priority:** High
**Description:** Modern iPads and Retina displays have a device pixel ratio of 2x or 3x. If the canvas renders at 1x resolution, lines appear blurry and player icons look fuzzy. This issue ensures the canvas renders at the device's native pixel density so that yard lines are crisp, route lines are sharp, and player labels are legible at any zoom level. This is a foundational visual quality requirement.
**Acceptance Criteria:**
- [ ] Canvas element sized at `width * devicePixelRatio` and `height * devicePixelRatio` with CSS scaling
- [ ] All drawing operations account for the pixel ratio (line widths, font sizes, icon sizes)
- [ ] Routes and lines render crisp on iPad Retina (2x) and iPad Pro (2x)
- [ ] Player labels and field numbers render without blur at any zoom level
- [ ] No performance regression from high-DPI rendering on supported devices
- [ ] Graceful fallback on 1x displays (no double-size rendering)
- [ ] Export (PNG) uses 2x resolution regardless of display device for print-quality output

---

# Output & Export (#280–289)


## Issue #280: Batch export all plays as PDF playbook
**Labels:** `feature`, `print`, `competitive`
**Milestone:** Phase 5: Output & Distribution
**Priority:** High
**Description:** Coaches need to export their entire playbook (or a selected subset) as a single, bound-ready PDF document. The export should support a table of contents generated from the folder structure, chapter dividers by section (Run Game, Pass Game, Special Teams), and configurable plays-per-page layouts (1-up, 2-up, 4-up, 6-up). Each page should include the team header (name, logo, colors) and page numbers. This replaces the manual process of exporting individual plays and assembling them in Word or PowerPoint.
**Acceptance Criteria:**
- [ ] Coach can select an entire playbook or specific folders for export
- [ ] Auto-generated table of contents from folder hierarchy
- [ ] Chapter divider pages between top-level sections
- [ ] Configurable layout: 1-up, 2-up, 4-up, or 6-up plays per page
- [ ] Team branding (name, logo, colors) on header/footer of every page
- [ ] Page numbers throughout the document
- [ ] PDF generates in under 10 seconds for a 200-play playbook
- [ ] Export includes play name, tags, and optional notes beneath each diagram

---

## Issue #281: Customizable call sheet templates
**Labels:** `feature`, `print`, `ui/ux`
**Milestone:** Phase 5: Output & Distribution
**Priority:** High
**Description:** Different coaches organize their call sheets differently. Beyond the default auto-generated call sheet (Issue #37), coaches should be able to customize the layout: choose which situation sections appear, set section ordering, adjust the number of columns per section, toggle between diagram-only and diagram-plus-name views, and control color-coding rules. Templates should be saveable so a coach builds their preferred call sheet format once and reuses it every week. This directly competes with the manual PowerPoint call sheet workflow coaches currently endure.
**Acceptance Criteria:**
- [ ] Template editor with drag-to-reorder situation sections
- [ ] Configurable column count per section (1–4 columns)
- [ ] Toggle: show play diagram, play name only, or both
- [ ] Custom color-coding rules (map play type to color)
- [ ] Save and name templates for reuse across game plans
- [ ] At least 3 built-in starter templates (spread offense, pro-style, run-heavy)
- [ ] PDF export respects template layout
- [ ] Template preview renders in real-time as coach adjusts settings

---

## Issue #282: Wristband layout editor
**Labels:** `feature`, `print`, `ui/ux`
**Milestone:** Phase 5: Output & Distribution
**Priority:** Medium
**Description:** Extend the wristband generator (Issue #38) with a full visual layout editor. Coaches should be able to drag plays into specific grid cells, resize the grid (3x3 through 8x8), set cell background colors by category, add section headers within the grid (e.g., "RUN" / "PASS" / "SCREEN" dividers), and choose between play-name-only or mini-diagram cells. The editor should support multiple wristband variants (QB wristband, receiver wristband, etc.) within the same game plan, each with different play subsets.
**Acceptance Criteria:**
- [ ] Visual grid editor with drag-and-drop play placement
- [ ] Configurable grid size from 3x3 to 8x8
- [ ] Cell background color assignment by play category
- [ ] Section header rows/columns within the grid
- [ ] Toggle between play-name-only and mini-diagram cells
- [ ] Multiple wristband variants per game plan (QB, WR, RB, etc.)
- [ ] PDF export with cut lines sized for standard wristband inserts
- [ ] Preview mode showing actual print dimensions

---

## Issue #283: Scout card template builder
**Labels:** `feature`, `print`, `competitive`
**Milestone:** Phase 5: Output & Distribution
**Priority:** Medium
**Description:** Build a template system for scout cards that goes beyond the default 4-up and 6-up layouts (Issue #40). Coaches should be able to define custom scout card templates that include: the defensive front diagram, play call or tendency label, down-and-distance context, hash mark indicator (left/right/middle), and free-text coaching notes. Templates should support both offensive scout cards (showing the opponent's offense for the defensive scout team) and defensive scout cards (showing the opponent's defense for the offensive scout team). Cards should be optimized for quick printing and cutting for practice distribution.
**Acceptance Criteria:**
- [ ] Template builder with configurable card fields (diagram, label, D&D, hash, notes)
- [ ] Support for offensive and defensive scout card types
- [ ] Configurable cards-per-page (2-up, 4-up, 6-up, 8-up)
- [ ] Hash mark indicator on each card (left/right/middle of field)
- [ ] Down-and-distance context displayed per card
- [ ] Coaching notes field per card (truncated to fit)
- [ ] Print-ready PDF with cut guides and consistent margins
- [ ] Auto-populate from game plan defense overlays or opponent tendency data

---

## Issue #284: PowerPoint and Google Slides export
**Labels:** `feature`, `competitive`, `print`
**Milestone:** Phase 5: Output & Distribution
**Priority:** High
**Description:** Many coaching staffs still present playbooks and install sheets via PowerPoint or Google Slides in team meetings. Export any play collection (playbook folder, game plan, scout cards, nine-box) as a .pptx file or directly to Google Slides via the Google Slides API. Each slide should contain one play diagram rendered as a high-resolution image, with the play name as the slide title and tags/notes in the speaker notes area. This is critical for coaches migrating from Pro Quick Draw, which lives entirely in the PowerPoint ecosystem.
**Acceptance Criteria:**
- [ ] Export any play collection as .pptx file download
- [ ] Each slide contains one play diagram as a high-res PNG embed
- [ ] Play name as slide title, tags and notes in speaker notes
- [ ] Team branding (logo, colors) applied to slide master template
- [ ] Google Slides export via OAuth + Google Slides API
- [ ] Configurable slides-per-play (1 slide per play or 2-up/4-up layouts)
- [ ] Export includes cover slide with team name, opponent, and week info
- [ ] File size optimized (compressed images, under 50MB for 200 plays)

---

## Issue #285: CSV play data export
**Labels:** `feature`, `data`
**Milestone:** Phase 5: Output & Distribution
**Priority:** Low
**Description:** Export play metadata as a CSV file for coaches who want to analyze their playbook data in Excel, Google Sheets, or custom analytics tools. The export should include one row per play with columns for: play name, formation, concept, personnel, tags (situation, custom), folder path, creation date, and last modified date. This supports the data-driven coaches who want to audit their playbook balance (e.g., "How many of our plays are from 11 personnel?", "What percentage of our game plan is run vs. pass?").
**Acceptance Criteria:**
- [ ] Export button available at playbook and game plan level
- [ ] CSV includes columns: play name, formation, concept, personnel, tags, folder, dates
- [ ] Proper CSV formatting with quoted fields and escaped commas
- [ ] Filter options before export (by folder, tags, formation, concept)
- [ ] Game plan export includes additional columns: situation section, sort order
- [ ] Downloads as .csv file with a descriptive filename (e.g., "Playbook_Export_2025-09-15.csv")

---

## Issue #286: Shareable formation library
**Labels:** `feature`, `ui/ux`, `competitive`
**Milestone:** Phase 5: Output & Distribution
**Priority:** Medium
**Description:** Allow coaches to share their custom formation libraries with other coaches on the platform. A coach who has built a complete Wing-T formation set, for example, can publish it as a shareable library that other coaches can browse and import into their own team. This creates a community-driven content flywheel and reduces onboarding friction for new coaches. Shared libraries should be read-only for importers and include a description, formation count, and coach/creator attribution.
**Acceptance Criteria:**
- [ ] Coach can mark a formation library (or subset) as "shareable"
- [ ] Generates a unique share link and optional listing in a public library directory
- [ ] Shared library page shows: description, formation thumbnails, formation count, creator name
- [ ] Other coaches can preview formations before importing
- [ ] One-tap import copies formations into the importing coach's team library
- [ ] Imported formations are independent copies (no link to original)
- [ ] Coach can unshare at any time, revoking the public link
- [ ] Search and browse public formation libraries by system type (Spread, Wing-T, I-Form, etc.)

---

## Issue #287: Embed play diagram in website or blog
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 5: Output & Distribution
**Priority:** Low
**Description:** Generate an embeddable iframe snippet or static image embed code for any play diagram, so coaches or content creators can embed plays in their coaching blogs, team websites, or articles. The embedded play should render as a clean, non-editable `PlayRenderer` with optional dark or light background. This supports content marketing for the product (every embed is a subtle ad) and serves the growing football coaching content creator community.
**Acceptance Criteria:**
- [ ] "Embed" button on any play generates an iframe snippet and a static image URL
- [ ] Iframe renders a responsive, non-editable play diagram
- [ ] Configurable embed options: dark/light background, show/hide play name, width
- [ ] Static image URL serves a high-res PNG for platforms that do not support iframes
- [ ] Embedded plays include a small "Made with Big Ball Guy" watermark (removable on Pro plan)
- [ ] Embed respects play sharing permissions (only shared or public plays can be embedded)
- [ ] Embed code is copy-to-clipboard with one tap

---

## Issue #288: Print preview with page break control
**Labels:** `feature`, `print`, `ui/ux`
**Milestone:** Phase 5: Output & Distribution
**Priority:** Medium
**Description:** Before exporting any PDF (playbook, call sheet, scout cards, practice script), show a full print preview with explicit page break controls. Coaches should see exactly how their content will print, including page boundaries, margins, and header/footer placement. They should be able to drag page breaks to control where content splits, force a page break before a specific section, and toggle between portrait and landscape orientation per section. This prevents the frustrating "print it, see it's wrong, reprint" cycle.
**Acceptance Criteria:**
- [ ] Print preview modal renders all pages of the PDF in a scrollable view
- [ ] Page break indicators visible between pages
- [ ] Drag page break positions to adjust content flow
- [ ] "Force page break before" option on any section or play
- [ ] Toggle portrait/landscape orientation per page or globally
- [ ] Margin adjustment controls (narrow, normal, wide)
- [ ] Real-time preview updates as settings change
- [ ] "Export PDF" button directly from the preview modal
- [ ] Preview renders in under 3 seconds for documents up to 50 pages

---

## Issue #289: Email play or playbook to coaching staff
**Labels:** `feature`, `ui/ux`
**Milestone:** Phase 5: Output & Distribution
**Priority:** Medium
**Description:** Allow coaches to email individual plays, game plan sections, or entire playbooks directly from the app to staff members or players. The email should include either a shareable link (for interactive viewing) or an attached PDF (for offline reference), with the coach choosing the format. The recipient list should auto-suggest from the team's coach roster and support manual email entry for external contacts. This replaces the "export PDF, open email, attach, send" workflow that wastes 2 minutes per share.
**Acceptance Criteria:**
- [ ] "Email" button available on plays, game plan sections, folders, and full playbooks
- [ ] Recipient field with auto-suggest from team roster and manual email entry
- [ ] Format choice: shareable link or attached PDF
- [ ] Email includes play/section name in subject line and a brief preview
- [ ] Sent via transactional email service (SendGrid, Resend, or similar)
- [ ] Email delivery confirmation shown in the UI
- [ ] Rate limit to prevent abuse (max 50 emails per coach per day)
- [ ] Email template is clean, mobile-friendly, and branded with team colors

---


---

# Business & Competitive (#310–320)


## Issue #310: Stripe subscription integration
**Labels:** `business`, `infra`, `core`
**Milestone:** Business & Growth
**Priority:** Critical
**Description:** Integrate Stripe for handling all subscription billing across the three paid tiers: Coach Pro ($15/mo), Program ($49/mo), and Enterprise (custom). Implement Stripe Checkout for initial sign-up, Stripe Customer Portal for self-service billing management (update card, view invoices, cancel), and webhook handling for subscription lifecycle events (created, updated, canceled, payment failed). The subscription status should gate feature access throughout the app based on the team's current plan tier.
**Acceptance Criteria:**
- [ ] Stripe Checkout flow for Coach Pro and Program plan sign-ups
- [ ] Stripe Customer Portal link for billing management (update card, invoices, cancel)
- [ ] Webhook handler for subscription events: created, updated, canceled, past_due, payment_failed
- [ ] Subscription status stored in database and associated with the team
- [ ] Feature gating middleware that checks plan tier before allowing access to gated features
- [ ] Annual billing option with discount (e.g., 2 months free)
- [ ] Proration handled correctly when upgrading/downgrading mid-cycle
- [ ] Stripe test mode for development and staging environments
- [ ] PCI compliance maintained (no raw card data touches our servers)

---

## Issue #311: Free tier limits and upgrade prompts
**Labels:** `business`, `ui/ux`
**Milestone:** Business & Growth
**Priority:** Critical
**Description:** Enforce the free tier limitations (1 playbook, 20 plays max, single user, watermarked exports, basic formations/routes) and surface contextual upgrade prompts when coaches hit those limits. Prompts should feel helpful, not annoying — they should appear at the moment of friction (e.g., "You've used 18 of 20 plays. Upgrade to Coach Pro for unlimited plays.") rather than as random pop-ups. The free tier is the top of the funnel; the upgrade experience must feel natural and demonstrate clear value, not punish the coach for using the product.
**Acceptance Criteria:**
- [ ] Play count limit enforced: block creation at 20 plays with upgrade prompt
- [ ] Playbook count limit enforced: block creation at 1 playbook with upgrade prompt
- [ ] Export watermark applied on free tier (subtle "Made with Big Ball Guy" on PDF/PNG)
- [ ] Watermark removed on paid plans
- [ ] Single-user enforcement: team invitation disabled on free tier
- [ ] Upgrade prompt UI is contextual, non-modal, and dismissible
- [ ] Upgrade prompts link directly to Stripe Checkout for the recommended plan
- [ ] Usage meter visible in settings (e.g., "18 / 20 plays used")
- [ ] Grace period: plays created before hitting the limit are never deleted or locked

---

## Issue #312: Team invitation and onboarding flow
**Labels:** `feature`, `ui/ux`, `business`
**Milestone:** Business & Growth
**Priority:** High
**Description:** Build the complete team invitation and new-coach onboarding experience for the Program and Enterprise tiers. The head coach (team admin) should be able to invite assistant coaches via email. Invited coaches receive an email with a one-click join link that handles account creation and team association. New coaches who accept an invitation should see a brief, skippable onboarding walkthrough highlighting the 3 things they need to know: how to draw a play, how to use formations, and where to find the playbook. This flow must feel welcoming and take under 60 seconds.
**Acceptance Criteria:**
- [ ] Team admin can invite coaches by email from team settings
- [ ] Invitation email sent with a branded, one-click join link
- [ ] Join link handles new account creation OR links existing account to the team
- [ ] Invited coach lands on a brief onboarding walkthrough (3 steps, skippable)
- [ ] Onboarding highlights: draw a play, use formations, find the playbook
- [ ] Team admin sees pending invitations with resend/revoke options
- [ ] Coach role assignment on invite: admin, coordinator, position coach (view-only option)
- [ ] Invitation count respects plan limits (Program: 10 coaches, Enterprise: unlimited)
- [ ] Invitation link expires after 7 days with option to resend

---

## Issue #313: Usage analytics dashboard (admin)
**Labels:** `business`, `data`, `infra`
**Milestone:** Business & Growth
**Priority:** Medium
**Description:** Build an internal admin dashboard for the Big Ball Guy team to monitor platform health, user engagement, and business metrics. This is not customer-facing; it is for the product team to make data-driven decisions. Track key SaaS metrics: total teams, active teams (7-day, 30-day), new sign-ups (daily/weekly/monthly), free-to-paid conversion rate, churn rate, MRR, plays created per team, most-used features, and export volume. Data should be queryable by date range and exportable as CSV.
**Acceptance Criteria:**
- [ ] Secured admin route accessible only to internal team members
- [ ] Dashboard shows: total teams, active teams (7d/30d), new sign-ups (daily/weekly/monthly)
- [ ] Revenue metrics: MRR, ARR, free-to-paid conversion rate, churn rate
- [ ] Engagement metrics: plays created (total and per-team average), exports generated, game plans created
- [ ] Feature usage breakdown: which features are most/least used
- [ ] Date range filter on all metrics
- [ ] CSV export for any metric view
- [ ] Auto-refreshing or manual refresh for real-time monitoring
- [ ] Data sourced from Supabase + Stripe API

---

## Issue #314: Customer feedback widget
**Labels:** `business`, `ui/ux`
**Milestone:** Business & Growth
**Priority:** Medium
**Description:** Integrate an in-app feedback widget so coaches can submit feature requests, bug reports, and general feedback without leaving the app. The widget should be accessible from a persistent but non-intrusive icon in the corner of every page. Submissions should capture the coach's current page/context, browser info, and optional screenshot. Feedback should flow into a central queue visible to the product team (via integration with a tool like Canny, Linear, or a simple Supabase-backed board). This is how we learn what coaches actually need.
**Acceptance Criteria:**
- [ ] Floating feedback button visible on all pages (not overlapping critical UI)
- [ ] Feedback form: type (bug, feature request, general), description (required), screenshot (optional)
- [ ] Auto-capture: current page URL, browser/OS info, user plan tier
- [ ] Submissions stored in a central feedback table or forwarded to an external tool (Canny, Linear)
- [ ] Coach receives a confirmation ("Thanks! We read every submission.")
- [ ] Product team can view, tag, and respond to feedback entries
- [ ] Optional follow-up email to the coach when their feedback is addressed
- [ ] Rate limit: max 10 submissions per coach per day

---

## Issue #315: Referral program
**Labels:** `business`, `feature`
**Milestone:** Business & Growth
**Priority:** Medium
**Description:** Build a referral program where existing coaches can invite other coaches and both parties receive a benefit. Coaching communities are tight-knit and word-of-mouth is the primary discovery channel. Each coach gets a unique referral link. When a referred coach signs up and activates a paid plan, the referrer receives one month free on their current plan. The referred coach gets their first month at 50% off. Referral tracking, reward fulfillment, and a simple dashboard showing referral status should all be built in.
**Acceptance Criteria:**
- [ ] Each coach has a unique referral link accessible from their account settings
- [ ] Referral link tracks sign-ups via a referral code parameter
- [ ] Referred coach gets 50% off their first month (applied as Stripe coupon)
- [ ] Referrer gets one month free when the referred coach activates a paid plan (applied as Stripe credit)
- [ ] Referral dashboard in account settings: total referrals, pending, converted, rewards earned
- [ ] Email notification to referrer when a referral converts
- [ ] Anti-abuse: cannot self-refer, max 20 referral rewards per year
- [ ] Referral link is shareable via copy-to-clipboard, email, or social media share buttons

---

## Issue #316: White-label option for leagues and organizations
**Labels:** `business`, `feature`, `future`
**Milestone:** Business & Growth
**Priority:** Low
**Description:** Offer a white-label configuration for state athletic associations, youth leagues, and coaching organizations that want to provide the playbook tool to their member coaches under their own branding. The white-label option replaces the Big Ball Guy logo, colors, and domain with the organization's branding. All underlying functionality remains the same. This unlocks bulk licensing deals where one organization purchases access for 50-500 coaches at a discounted per-seat rate, creating a high-value enterprise revenue stream.
**Acceptance Criteria:**
- [ ] Organization-level settings: custom logo, color scheme, display name
- [ ] Custom subdomain support (e.g., texashsfootball.bigballguy.com) or CNAME mapping
- [ ] All UI surfaces render the organization's branding instead of Big Ball Guy
- [ ] Exports (PDF, PNG, email) use the organization's branding
- [ ] Organization admin dashboard: manage member coaches, view usage, manage billing
- [ ] Bulk seat licensing: organization purchases X seats at a per-seat rate
- [ ] Coaches within the organization see no Big Ball Guy branding
- [ ] SSO integration option (SAML/OAuth) for organizations with existing identity providers

---

## Issue #317: Content marketing — blog with coaching tips
**Labels:** `business`, `competitive`
**Milestone:** Business & Growth
**Priority:** Medium
**Description:** Build a blog section on the marketing site featuring football coaching tips, playbook strategy articles, and product tutorials. Content should target the searches coaches actually make: "best spread offense plays for high school," "how to build a call sheet," "inside zone blocking rules explained." Each article should include embedded play diagrams (via Issue #287) that serve as both content and product demo. The blog drives SEO traffic, establishes credibility with the coaching community, and provides natural upgrade funnels. Use a headless CMS (Sanity, Contentful, or MDX in the repo) for content management.
**Acceptance Criteria:**
- [ ] Blog section accessible from the marketing site navigation
- [ ] CMS integration for authoring and publishing articles (headless CMS or MDX)
- [ ] Article template with: title, author, date, featured image, body content, embedded play diagrams
- [ ] SEO metadata: title tag, meta description, Open Graph tags, structured data (Article schema)
- [ ] Responsive design matching the marketing site aesthetic
- [ ] Category and tag system for articles (Offense, Defense, Game Planning, Coaching Tips, etc.)
- [ ] RSS feed for subscribers
- [ ] CTA (call-to-action) block within articles linking to sign-up or free trial
- [ ] Social sharing buttons on each article

---

## Issue #318: SEO landing pages for each sport level
**Labels:** `business`, `competitive`
**Milestone:** Business & Growth
**Priority:** Medium
**Description:** Create dedicated landing pages targeting each sport level segment: high school football, college football (FCS/D2/D3/NAIA/JUCO), youth football, and NFL/FBS. Each page should speak directly to the pain points and budget realities of that segment, feature testimonials from coaches at that level (when available), highlight the specific features most relevant to their workflow, and include level-appropriate pricing guidance. These pages serve as SEO entry points for level-specific searches like "high school football playbook software" or "college football play designer."
**Acceptance Criteria:**
- [ ] Dedicated landing page for: high school, small college, youth, and pro/FBS
- [ ] Each page has unique copy addressing that level's specific pain points and workflows
- [ ] Level-appropriate feature highlights (e.g., youth: simplicity; college: collaboration and staff size)
- [ ] Pricing section relevant to that level's budget (e.g., youth: free tier emphasis; college: Program plan emphasis)
- [ ] Testimonial/quote section (placeholder until real testimonials are collected)
- [ ] SEO-optimized: unique title tags, meta descriptions, H1s, and structured data per page
- [ ] Responsive design with clear CTA buttons (sign up / start free trial)
- [ ] Internal linking between level pages and relevant blog content

---

## Issue #319: App Store listing via PWA or Capacitor wrapper
**Labels:** `business`, `mobile`, `infra`
**Milestone:** Business & Growth
**Priority:** Low
**Description:** Publish the app to the Apple App Store and Google Play Store to increase discoverability and trust with coaches who expect a "real app" in the store. Use either a Capacitor wrapper around the existing Next.js PWA or a TWA (Trusted Web Activity) for Android. The store listing should include screenshots of the play designer on iPad, call sheet generation, and the formation picker. App Store presence is a credibility signal for coaches evaluating the tool, even if the underlying technology is the same web app. Handle in-app purchase or link to web billing per store policies.
**Acceptance Criteria:**
- [ ] Capacitor (or TWA) wrapper builds and runs the web app as a native shell
- [ ] Apple App Store listing with screenshots, description, and keywords
- [ ] Google Play Store listing with screenshots, description, and keywords
- [ ] App icon and splash screen matching brand identity
- [ ] Push notification support via native wrapper (for share notifications, game plan reminders)
- [ ] Billing: link to web-based Stripe billing or implement in-app purchase per store requirements
- [ ] App passes Apple and Google review guidelines
- [ ] Automated build pipeline for native wrapper updates when the web app ships new features

---

## Issue #320: Competitive feature comparison page
**Labels:** `business`, `competitive`
**Milestone:** Business & Growth
**Priority:** Medium
**Description:** Build a dedicated comparison page on the marketing site that positions Big Ball Guy against Pro Quick Draw, PowerPoint/Google Slides, Hudl, and pen-and-paper workflows. The page should feature a comparison table showing feature availability, platform support, pricing, and ease of use across each competitor. Each row should be honest — acknowledge where competitors have strengths (e.g., Hudl video integration) while clearly highlighting where Big Ball Guy wins (auto-blocking, concept assembly, cross-platform, real-time collaboration, price). This page targets coaches who are actively evaluating tools and searching for alternatives.
**Acceptance Criteria:**
- [ ] Comparison table with columns: Big Ball Guy, Pro Quick Draw, PowerPoint/Slides, Hudl
- [ ] Rows covering: pricing, platform, mobile support, collaboration, route library, blocking auto-assign, concept assembly, scout cards, call sheet generation, offline support, learning curve
- [ ] Honest treatment of competitor strengths (no misleading claims)
- [ ] Clear visual indicators: checkmark, X, partial support, "coming soon"
- [ ] SEO-optimized for queries like "Pro Quick Draw alternative" and "football playbook software comparison"
- [ ] Responsive design with horizontal scroll on mobile for the table
- [ ] CTA button below the table linking to sign-up or free trial
- [ ] Maintained and updated as new features ship (process documented)

---


---

# Testing & DevOps (#340–351)


## Issue #340: End-to-end tests with Playwright
**Labels:** `testing`, `infra`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Set up Playwright for end-to-end testing covering the critical user flows: sign up, create a play (place formation, draw a route, save), open the playbook browser, export a play as PNG/PDF, and share via link. E2E tests should run against a local dev server with a seeded test database. These tests are the safety net that prevents regressions in the core coaching workflows. Focus on the happy paths first, then expand to edge cases (offline mode, error states, mobile viewport).
**Acceptance Criteria:**
- [ ] Playwright installed and configured with the project
- [ ] Test database seeding script creates a team, coach, formations, and sample plays
- [ ] E2E test: sign up flow (email/password)
- [ ] E2E test: create a new play (select formation, draw route, save)
- [ ] E2E test: open playbook browser, verify play thumbnails render
- [ ] E2E test: export play as PNG and verify file downloads
- [ ] E2E test: share play via link and verify shared view renders
- [ ] Tests run in CI (GitHub Actions) on every PR
- [ ] Tests pass in Chromium, Firefox, and WebKit browsers
- [ ] Test execution completes in under 3 minutes

---

## Issue #341: Visual regression testing for canvas rendering
**Labels:** `testing`, `ui/ux`
**Milestone:** Infrastructure
**Priority:** High
**Description:** The play designer canvas is the core of the product, and visual regressions (misaligned players, broken route rendering, incorrect field markings) would destroy coach trust instantly. Set up visual regression testing using Playwright screenshot comparison (or a dedicated tool like Percy/Chromatic) to capture baseline screenshots of key canvas states: empty field, formation placed, routes drawn, defense overlay, all four PlayRenderer sizes (full, card, thumbnail, wristband). On each PR, compare screenshots against baselines and flag visual diffs for review.
**Acceptance Criteria:**
- [ ] Baseline screenshots captured for: empty field, each default formation, routes drawn, defense overlay
- [ ] Screenshots captured for all PlayRenderer size variants (full, card, thumbnail, wristband)
- [ ] Visual diff comparison runs on every PR
- [ ] Pixel-level threshold configurable (allow minor anti-aliasing differences)
- [ ] Visual diff report generated with side-by-side comparison images
- [ ] Baseline update workflow: approved changes update the baselines
- [ ] Tests cover dark mode and light mode canvas rendering
- [ ] Canvas screenshots are deterministic (no flaky rendering differences between runs)

---

## Issue #342: CI/CD pipeline with GitHub Actions
**Labels:** `devops`, `infra`
**Milestone:** Infrastructure
**Priority:** Critical
**Description:** Build a comprehensive CI/CD pipeline using GitHub Actions that runs on every push and PR. The pipeline should include: TypeScript type checking, ESLint linting, Prettier formatting check, unit tests (Vitest/Jest), E2E tests (Playwright), visual regression tests, build verification, and bundle size check. Successful merges to main should auto-deploy to production via Vercel. PRs should get preview deployments with a comment linking to the preview URL. The pipeline is the foundation of shipping quality code confidently and frequently.
**Acceptance Criteria:**
- [ ] GitHub Actions workflow triggers on push to main and all PRs
- [ ] Pipeline stages: lint, typecheck, unit test, build, E2E test, visual regression
- [ ] Each stage runs in parallel where possible for speed
- [ ] PR comment with preview deployment URL (via Vercel integration)
- [ ] Merge to main triggers production deployment
- [ ] Bundle size check: warn if JS bundle increases by more than 10%
- [ ] Pipeline completes in under 8 minutes for a typical PR
- [ ] Status checks required for merge: all stages must pass
- [ ] Secrets managed via GitHub Actions secrets (Supabase keys, Stripe keys, etc.)

---

## Issue #343: Staging environment setup
**Labels:** `devops`, `infra`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Set up a persistent staging environment that mirrors production for pre-release testing. Staging should have its own Supabase project (separate database, auth, storage), its own Stripe test mode keys, and its own Vercel deployment URL. The staging environment should auto-deploy from a `staging` branch and be seeded with realistic test data (sample teams, playbooks with 50+ plays, game plans). This gives the team a safe place to test features end-to-end with production-like data before shipping to real coaches.
**Acceptance Criteria:**
- [ ] Separate Supabase project for staging (database, auth, storage)
- [ ] Staging Vercel deployment with its own URL (e.g., staging.bigballguy.com)
- [ ] Auto-deploy from `staging` branch
- [ ] Stripe test mode keys configured for staging
- [ ] Database seed script: creates 3 teams, 5 coaches, 10 formations, 50+ plays, 2 game plans
- [ ] Staging environment clearly labeled in the UI (banner: "STAGING ENVIRONMENT")
- [ ] Staging data reset script for periodic cleanup
- [ ] Environment variables cleanly separated (no risk of staging hitting production services)

---

## Issue #344: Error monitoring with Sentry
**Labels:** `devops`, `infra`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Integrate Sentry for real-time error monitoring and alerting across the application. Capture both client-side errors (React rendering errors, canvas exceptions, network failures) and server-side errors (API route failures, Supabase query errors, Stripe webhook failures). Errors should include rich context: the coach's team, current page, recent actions, browser/device info, and the play being edited (if applicable). Set up alerts for error spikes so the team knows immediately when something breaks for coaches.
**Acceptance Criteria:**
- [ ] Sentry SDK integrated in both client-side (Next.js) and server-side (API routes)
- [ ] React Error Boundary integration captures component-level crashes
- [ ] Canvas-specific error handling catches rendering and interaction exceptions
- [ ] Error context includes: team ID, coach ID, current route, browser/OS, play ID (if applicable)
- [ ] Source maps uploaded to Sentry for readable stack traces in production
- [ ] Alert rules: notify on error spike (>10 errors in 5 minutes), new unhandled error type
- [ ] Sentry performance tracing enabled for API routes (identifies slow queries)
- [ ] User feedback prompt on crash ("Something went wrong — tell us what happened")
- [ ] Sensitive data scrubbed (no passwords, tokens, or PII in error reports)

---

## Issue #345: Performance monitoring with Web Vitals
**Labels:** `devops`, `infra`, `ui/ux`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** Implement Web Vitals monitoring to track real-user performance metrics: Largest Contentful Paint (LCP), First Input Delay (FID) / Interaction to Next Paint (INP), Cumulative Layout Shift (CLS), and Time to First Byte (TTFB). Track these metrics per page (home, play editor, playbook browser, game plan) and per device type (desktop, tablet, mobile). Set performance budgets and alert when metrics regress. The play editor canvas must maintain 60fps interaction, so also track custom canvas frame rate metrics during route drawing and player dragging.
**Acceptance Criteria:**
- [ ] Web Vitals collection via Next.js built-in reporting or a dedicated library
- [ ] Metrics tracked: LCP, INP, CLS, TTFB, FCP per page
- [ ] Custom canvas performance metric: average frame rate during interaction (drag, draw)
- [ ] Metrics segmented by device type (desktop, tablet, mobile)
- [ ] Performance budget: LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Alert when any metric exceeds budget threshold for >5% of sessions
- [ ] Dashboard or report (Vercel Analytics, Sentry Performance, or custom) showing trends over time
- [ ] Canvas frame rate must stay above 55fps during route drawing on iPad Air or equivalent

---

## Issue #346: Database backup automation
**Labels:** `devops`, `infra`, `data`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Implement automated database backup for the Supabase Postgres database to protect against data loss. Coaches entrust their entire playbook, game plans, and scouting data to the platform — losing that data would be catastrophic and unrecoverable. Set up daily automated backups with point-in-time recovery capability. Backups should be stored in a separate cloud storage location (e.g., AWS S3 or GCS bucket) from the primary database. Test the restore process regularly to ensure backups are actually usable.
**Acceptance Criteria:**
- [ ] Daily automated backups of the full Supabase Postgres database
- [ ] Backups stored in a separate cloud storage bucket (S3, GCS, or equivalent)
- [ ] Point-in-time recovery enabled (Supabase Pro plan feature or custom WAL archiving)
- [ ] Backup retention policy: daily backups for 30 days, weekly for 90 days, monthly for 1 year
- [ ] Automated backup verification: restore to a test instance weekly and validate data integrity
- [ ] Alert if a backup fails or is missed
- [ ] Documented restore procedure with estimated RTO (Recovery Time Objective) under 1 hour
- [ ] Storage bucket access restricted to infrastructure admin only (no public access)

---

## Issue #347: Load testing for real-time collaboration features
**Labels:** `testing`, `devops`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** When real-time collaborative editing (Issue #47) ships, it must handle multiple coaches editing the same playbook simultaneously without degradation. Build a load testing suite using k6, Artillery, or a similar tool that simulates concurrent users performing: simultaneous play edits via Supabase Realtime subscriptions, rapid player position updates, route drawing events, and playbook browsing. Establish performance baselines and identify the breaking point for concurrent users per team and across the platform.
**Acceptance Criteria:**
- [ ] Load testing tool configured (k6, Artillery, or equivalent)
- [ ] Test scenarios: 5, 10, 25, 50 concurrent editors on the same playbook
- [ ] Test scenarios: 100, 500, 1000 concurrent users across different teams
- [ ] Metrics captured: message latency (p50, p95, p99), error rate, server CPU/memory
- [ ] Supabase Realtime subscription stress test: rapid updates (10/second per user)
- [ ] Baseline established: acceptable latency thresholds per scenario
- [ ] Breaking point identified and documented
- [ ] Load tests runnable on demand and in CI (nightly schedule)
- [ ] Results report generated with charts for latency distribution and throughput

---

## Issue #348: Accessibility audit automation with axe-core
**Labels:** `testing`, `a11y`, `ui/ux`
**Milestone:** Infrastructure
**Priority:** Medium
**Description:** Integrate automated accessibility testing using axe-core to catch WCAG 2.1 Level AA violations on every PR. While the canvas itself presents unique accessibility challenges, all surrounding UI (navigation, forms, modals, buttons, playbook browser, settings) must be fully accessible. Run axe-core against key pages in the Playwright E2E test suite and fail the build on any critical or serious violations. This ensures the app is usable by coaches with visual or motor impairments and protects against legal liability.
**Acceptance Criteria:**
- [ ] axe-core integrated into the Playwright E2E test suite
- [ ] Accessibility checks run on: home page, playbook browser, game plan builder, settings, login/signup
- [ ] Build fails on critical or serious axe-core violations
- [ ] Warnings logged (but do not fail build) for moderate and minor violations
- [ ] Accessibility report generated per PR showing pass/fail results
- [ ] Canvas accessibility strategy documented (keyboard navigation, screen reader announcements for player placement and route drawing)
- [ ] Color contrast ratios verified for both dark and light themes
- [ ] All interactive elements have accessible names and ARIA labels

---

## Issue #349: API integration testing
**Labels:** `testing`, `infra`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Build a comprehensive integration test suite for all API routes (Next.js API routes + Supabase queries). Tests should cover: CRUD operations for all major entities (plays, formations, playbooks, game plans, routes, blocking schemes, defenses), authentication and authorization (RLS policies), Stripe webhook processing, share link generation, and edge cases (duplicate names, missing fields, unauthorized access). Use a test database instance with seeded data and reset between test runs.
**Acceptance Criteria:**
- [ ] Integration tests for all play CRUD operations (create, read, update, delete)
- [ ] Integration tests for formation, route, blocking scheme, and defense library CRUD
- [ ] Integration tests for playbook and game plan management
- [ ] Auth tests: protected routes reject unauthenticated requests
- [ ] RLS tests: coaches cannot access other teams' data
- [ ] Stripe webhook tests: subscription created, updated, canceled, payment failed
- [ ] Share link tests: generation, access, expiration
- [ ] Tests run against a dedicated test Supabase instance with seeded data
- [ ] Database reset between test suites (clean state)
- [ ] Tests run in CI and complete in under 2 minutes

---

## Issue #350: Feature flag system
**Labels:** `devops`, `infra`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Implement a feature flag system to safely roll out new features, A/B test variations, and instantly disable problematic features without deploying new code. Use a service like LaunchDarkly, Flagsmith, or a simple Supabase-backed config table. Feature flags should be checkable on both client and server, support targeting by team ID (for beta testers), plan tier (features for Pro only), and percentage rollout (10% of teams see the new feature). This is critical for shipping confidently to coaches who depend on the tool for their weekly game planning workflow.
**Acceptance Criteria:**
- [ ] Feature flag service integrated (LaunchDarkly, Flagsmith, or custom Supabase-backed)
- [ ] Flags checkable in both client components and server API routes
- [ ] Targeting rules: by team ID, by plan tier, by percentage rollout
- [ ] Admin UI or config file for creating/updating/toggling flags
- [ ] Default fallback values when flag service is unreachable
- [ ] Flags cached client-side to avoid latency on every check
- [ ] Audit log: who changed which flag and when
- [ ] At least 5 initial flags created for upcoming features (e.g., real_time_collab, play_animation, voice_to_play, ai_scouting, hudl_integration)
- [ ] Flag evaluation adds less than 5ms latency to any request

---

## Issue #351: Deployment rollback strategy
**Labels:** `devops`, `infra`
**Milestone:** Infrastructure
**Priority:** High
**Description:** Define and implement a deployment rollback strategy so that if a production deployment introduces a breaking bug, the team can revert to the previous working version in under 5 minutes. Leverage Vercel's instant rollback to a previous deployment, but also plan for database rollback scenarios (breaking schema migration). Document the rollback procedure, test it quarterly, and integrate rollback triggers with Sentry error monitoring (auto-alert when error rates spike post-deploy, with a one-click rollback link in the alert).
**Acceptance Criteria:**
- [ ] Vercel instant rollback configured and tested (revert to previous deployment)
- [ ] Rollback procedure documented: who, when, how, and communication steps
- [ ] Database migration rollback scripts for every migration (up + down migrations)
- [ ] Sentry alert integration: post-deploy error spike triggers rollback recommendation alert
- [ ] One-click rollback link in the Sentry alert (or Slack notification)
- [ ] Rollback tested quarterly in staging environment (documented test results)
- [ ] Post-rollback checklist: verify app health, notify team, create incident report
- [ ] Deploy metadata tracked: every production deploy logged with commit SHA, timestamp, deployer
- [ ] Maximum rollback time target: under 5 minutes from decision to live rollback

---

# Security (#65-79)


---

## Issue #65: [EPIC] Security Hardening
**Labels:** `epic`, `security`
**Milestone:** Security Hardening
**Priority:** Critical
**Description:** Comprehensive security audit and hardening pass across the entire application. Covers multi-tenant data isolation, authentication strengthening, input sanitization, transport security, compliance, and offline data protection. All sub-issues must be resolved before public launch.
**Acceptance Criteria:**
- [ ] All sub-issues (#66-#79) completed and verified
- [ ] Third-party penetration test passes with no critical or high findings
- [ ] Security documentation published for the team

---

## Issue #66: Multi-tenant Row Level Security (RLS) policies
**Labels:** `security`, `data`, `core`
**Milestone:** Security Hardening
**Priority:** Critical
**Description:** Every Supabase table must enforce Row Level Security so that coaches can only read and write data belonging to their own team. Without RLS, any authenticated user could query or modify another team's playbooks, formations, game plans, and scouting data. This is the single most critical security control in the entire application.
**Acceptance Criteria:**
- [ ] RLS enabled on every table (teams, coaches, formations, routes, blocking_schemes, defensive_fronts, plays, playbooks, playbook_folders, playbook_plays, game_plans, game_plan_sections, game_plan_plays, practice_scripts, practice_periods, practice_period_plays, call_sheets, scratch_plays)
- [ ] SELECT policies restrict rows to the authenticated user's team_id
- [ ] INSERT policies enforce that new rows belong to the authenticated user's team_id
- [ ] UPDATE and DELETE policies restrict modifications to the user's own team data
- [ ] Coach role hierarchy enforced (head coach can manage team, assistant coaches cannot delete team)
- [ ] RLS policies tested with automated tests simulating cross-tenant access attempts
- [ ] Supabase service role key never exposed to the client — only anon key used in browser
- [ ] Edge case: shared links bypass team RLS using a scoped read-only token (not the user's session)

---

## Issue #67: Rate limiting on authentication endpoints
**Labels:** `security`, `infra`
**Milestone:** Security Hardening
**Priority:** Critical
**Description:** Authentication endpoints (login, signup, magic link, password reset) must be rate-limited to prevent brute-force attacks and credential stuffing. Without rate limiting, an attacker could attempt thousands of password combinations or flood the magic link system to drain email sending quotas.
**Acceptance Criteria:**
- [ ] Login endpoint limited to 5 failed attempts per email per 15-minute window
- [ ] Signup endpoint limited to 3 accounts per IP per hour
- [ ] Magic link endpoint limited to 3 requests per email per 10-minute window
- [ ] Password reset endpoint limited to 3 requests per email per hour
- [ ] Rate limit responses return HTTP 429 with a Retry-After header
- [ ] User-facing error message explains the lockout without revealing internal details
- [ ] Rate limit state stored server-side (not client-enforceable only)
- [ ] Logging of rate-limit triggers for security monitoring

---

## Issue #68: Multi-factor authentication (MFA)
**Labels:** `security`, `feature`
**Milestone:** Security Hardening
**Priority:** High
**Description:** Offer optional MFA via TOTP (authenticator app) for coaches who want additional account protection. MFA should be strongly recommended for head coaches and required for Enterprise-tier accounts where playbook data is highly sensitive.
**Acceptance Criteria:**
- [ ] MFA enrollment flow: coach scans QR code with authenticator app (Google Authenticator, Authy, etc.)
- [ ] MFA verification on login after password step
- [ ] Recovery codes generated at enrollment (8 single-use codes)
- [ ] Coach can disable MFA from settings (requires current MFA code to disable)
- [ ] Enterprise tier: admin can enforce MFA for all team members
- [ ] MFA status visible in team management for head coaches
- [ ] Supabase Auth MFA factor management integrated correctly

---

## Issue #69: Share link security with expiring tokens
**Labels:** `security`, `feature`
**Milestone:** Security Hardening
**Priority:** High
**Description:** Shared playbook links (QR codes, player distribution links) must use cryptographically signed, time-limited tokens instead of predictable or permanent URLs. A leaked share link should not grant indefinite access to playbook content, and old links should expire automatically.
**Acceptance Criteria:**
- [ ] Share tokens are cryptographically random (minimum 32 bytes, URL-safe base64)
- [ ] Tokens include an expiration timestamp (configurable: 24 hours, 1 week, end of season, custom)
- [ ] Expired tokens return a friendly "This link has expired" page with instructions to request a new one
- [ ] Coach can manually revoke any active share link from the share management panel
- [ ] Share links are scoped to specific content (a play, a folder, a game plan) — not a blanket team access grant
- [ ] Optional PIN protection on share links for extra-sensitive content (e.g., game plan for this week)
- [ ] Shared content renders in a read-only view with no ability to navigate to unshared team data
- [ ] Share link access logged (timestamp, IP, device) for the coach to review

---

## Issue #70: XSS sanitization of play names, notes, and user-generated text
**Labels:** `security`, `core`
**Milestone:** Security Hardening
**Priority:** Critical
**Description:** All user-generated text fields (play names, play notes, scouting notes, tag names, folder names, team names, coach names) must be sanitized to prevent stored XSS attacks. Since this content is rendered in shared views without authentication, an attacker could inject malicious scripts visible to players and other coaches.
**Acceptance Criteria:**
- [ ] All user input fields sanitized on the server before storage (strip HTML tags, encode special characters)
- [ ] Client-side rendering uses safe methods (React's default JSX escaping, no dangerouslySetInnerHTML on user content)
- [ ] Rich text fields (if any, such as play notes) use an allowlist-based sanitizer (e.g., DOMPurify) permitting only safe formatting tags
- [ ] SVG/canvas path data validated to prevent script injection via SVG event handlers
- [ ] Automated tests attempt XSS payloads in every user-input field and verify they are neutralized
- [ ] Shared/public views (player distribution, QR link pages) apply the same sanitization

---

## Issue #71: CSRF protection on all state-changing API routes
**Labels:** `security`, `infra`
**Milestone:** Security Hardening
**Priority:** High
**Description:** All state-changing API endpoints (POST, PUT, DELETE) must be protected against Cross-Site Request Forgery. Since the app uses cookie-based sessions via Supabase Auth, an attacker could craft a malicious page that triggers requests on behalf of a logged-in coach.
**Acceptance Criteria:**
- [ ] CSRF tokens generated per session and included in all state-changing requests
- [ ] Server validates CSRF token on every POST/PUT/DELETE request
- [ ] SameSite=Lax (or Strict) attribute set on all authentication cookies
- [ ] API routes that accept JSON verify the Content-Type header matches application/json
- [ ] Supabase client library configured to include CSRF headers automatically
- [ ] Automated tests verify that requests without valid CSRF tokens are rejected with HTTP 403

---

## Issue #72: File upload validation and size limits
**Labels:** `security`, `feature`
**Milestone:** Security Hardening
**Priority:** High
**Description:** File uploads (team logos, video clips, imported play data) must be validated for type, size, and content to prevent malicious file storage and serving. An attacker could upload executable files, oversized blobs, or files with misleading extensions to exploit the storage system or other users.
**Acceptance Criteria:**
- [ ] File type validated by both extension and MIME type (magic bytes) — not extension alone
- [ ] Allowed types: images (PNG, JPG, SVG, WebP), video (MP4, WebM), data (JSON, CSV)
- [ ] SVG uploads sanitized to remove embedded scripts, event handlers, and external references
- [ ] Image uploads re-encoded/re-saved server-side to strip EXIF data and embedded payloads
- [ ] Maximum file sizes enforced: images 5MB, videos 100MB, data files 2MB
- [ ] Total storage quota per team enforced (based on plan tier)
- [ ] Uploaded files served from a separate domain or CDN with Content-Disposition: attachment where appropriate
- [ ] Antivirus/malware scan on uploaded files before they are accessible to other users (or use Supabase Storage policies)

---

## Issue #73: Session management and device tracking
**Labels:** `security`, `feature`
**Milestone:** Security Hardening
**Priority:** High
**Description:** Coaches should have visibility and control over their active sessions across devices. If a coach's device is lost or stolen, they need to be able to revoke access remotely. Session tokens should have reasonable lifetimes and refresh securely.
**Acceptance Criteria:**
- [ ] Active sessions listed in coach's account settings (device name/type, IP, last active timestamp)
- [ ] Coach can revoke any individual session (force logout on that device)
- [ ] "Log out all devices" option for emergency use
- [ ] Session tokens expire after 7 days of inactivity (configurable per tier)
- [ ] Refresh tokens rotate on each use (refresh token rotation)
- [ ] Session invalidated on password change
- [ ] Suspicious activity detection: alert coach if login from a new device/location (email notification)
- [ ] Session data stored securely — never in localStorage in plaintext

---

## Issue #74: API key rotation for Program-tier integrations
**Labels:** `security`, `feature`
**Milestone:** Security Hardening
**Priority:** Medium
**Description:** Program and Enterprise tier teams have API access for video platform integrations. API keys must be rotatable, scoped, and auditable. A compromised key should be replaceable without disrupting the team's workflow beyond a brief key swap.
**Acceptance Criteria:**
- [ ] API keys generated per team with a descriptive label (e.g., "Hudl Integration Key")
- [ ] Keys are scoped to specific permissions (read-only, read-write, specific resources)
- [ ] Key rotation: generate a new key before revoking the old one (overlap window)
- [ ] Old keys can be revoked immediately
- [ ] API key usage logged (endpoint, timestamp, IP) and visible in team settings
- [ ] Keys displayed only once at creation — stored hashed server-side
- [ ] Rate limiting per API key (separate from user session rate limits)
- [ ] Maximum of 5 active keys per team

---

## Issue #75: GDPR and FERPA compliance for student athlete data
**Labels:** `security`, `compliance`
**Milestone:** Security Hardening
**Priority:** Critical
**Description:** High school and college programs may store student athlete names, jersey numbers, scouting notes, and quiz performance data — all of which are protected under FERPA (US education records) and potentially GDPR (EU users). The application must provide data governance controls, consent tracking, and data portability to ensure legal compliance.
**Acceptance Criteria:**
- [ ] Privacy policy clearly states what data is collected, stored, and shared
- [ ] Data Processing Agreement (DPA) template available for school districts and institutions
- [ ] Data export: coach can export all team data as a structured archive (JSON + media files) within 48 hours
- [ ] Data deletion: coach can request full account and team data deletion — completed within 30 days
- [ ] Player-facing shared views collect no personal data (no cookies, no tracking, no analytics on shared links)
- [ ] Scouting notes and tendency data that reference student athletes can be bulk-purged at end of season
- [ ] Consent banner for any analytics or tracking on the main application (not shared views)
- [ ] Data residency: documentation of where data is stored (Supabase region) for institutional procurement
- [ ] Audit log of data access available for compliance reviews

---

## Issue #76: Export watermarking for free-tier and attribution
**Labels:** `security`, `feature`, `print`
**Milestone:** Security Hardening
**Priority:** Medium
**Description:** Free-tier PDF and PNG exports should include a subtle watermark ("Created with Big Ball Guy") for attribution and to encourage upgrades. Additionally, all exports should embed invisible metadata identifying the source team and export timestamp to deter unauthorized redistribution of paid playbook content.
**Acceptance Criteria:**
- [ ] Free-tier exports include a visible "Created with Big Ball Guy" watermark in the footer
- [ ] Watermark is clean and professional — not obstructive but clearly present
- [ ] Paid-tier exports have no visible watermark (clean output)
- [ ] All exports (free and paid) embed invisible metadata: team ID, coach ID, export timestamp, plan tier
- [ ] Metadata embedded in PNG EXIF/tEXt chunks and PDF document properties
- [ ] Watermark cannot be trivially removed by cropping (positioned across the content area at low opacity)
- [ ] Preview of watermarked export shown before download on free tier

---

## Issue #77: Device encryption for offline IndexedDB data
**Labels:** `security`, `infra`, `mobile`
**Milestone:** Security Hardening
**Priority:** Medium
**Description:** Plays stored in IndexedDB for offline use contain potentially sensitive game plan data. On shared or stolen devices, this data is accessible without authentication. Offline data should be encrypted at rest using a key derived from the coach's credentials so that raw IndexedDB inspection reveals nothing useful.
**Acceptance Criteria:**
- [ ] IndexedDB play data encrypted using AES-256-GCM via the Web Crypto API
- [ ] Encryption key derived from the coach's auth token (PBKDF2 or HKDF) — not stored in plaintext
- [ ] Decryption happens transparently on app load after authentication
- [ ] If the auth token is expired and the coach is offline, data remains encrypted until re-authentication
- [ ] Performance: encryption/decryption adds no more than 50ms latency to play load/save
- [ ] Fallback: if Web Crypto API is unavailable (very old browsers), warn the user that offline data is unencrypted
- [ ] Clear all offline data on explicit logout ("Log out" button wipes IndexedDB)

---

## Issue #78: Content Security Policy (CSP) and security headers
**Labels:** `security`, `infra`
**Milestone:** Security Hardening
**Priority:** High
**Description:** Configure strict HTTP security headers to mitigate XSS, clickjacking, MIME-sniffing, and other client-side attacks. A robust Content Security Policy is especially important because the app renders user-generated content (play names, notes) and embeds third-party video (YouTube, Hudl).
**Acceptance Criteria:**
- [ ] Content-Security-Policy header configured: restrict script-src to self and trusted CDNs, disallow inline scripts (use nonces for any necessary inline), restrict frame-src to YouTube and Hudl domains
- [ ] X-Frame-Options set to DENY (or SAMEORIGIN if the app needs to iframe itself)
- [ ] X-Content-Type-Options set to nosniff
- [ ] Referrer-Policy set to strict-origin-when-cross-origin
- [ ] Strict-Transport-Security (HSTS) header with max-age of at least 1 year and includeSubDomains
- [ ] Permissions-Policy header disabling unnecessary browser features (camera, microphone, geolocation — unless needed for voice-to-play)
- [ ] CSP violation reporting endpoint configured to capture and log violations
- [ ] Headers verified on every deployment via automated test or monitoring

---

## Issue #79: Security audit logging and anomaly detection
**Labels:** `security`, `infra`
**Milestone:** Security Hardening
**Priority:** Medium
**Description:** All security-relevant events must be logged to an append-only audit trail for incident investigation and compliance. Anomalous patterns (bulk data exports, login from unusual locations, rapid API calls) should trigger alerts so the team can respond before damage occurs.
**Acceptance Criteria:**
- [ ] Audit log captures: login success/failure, password changes, MFA enrollment/removal, share link creation/revocation, data exports, team member additions/removals, API key creation/rotation, role changes
- [ ] Log entries include: timestamp, actor (coach ID), action, target resource, IP address, user agent
- [ ] Logs stored in an append-only table with RLS preventing modification by any user (service role only)
- [ ] Log retention: minimum 1 year for compliance
- [ ] Anomaly alerts: more than 10 failed logins across any accounts from the same IP in 5 minutes
- [ ] Anomaly alerts: bulk export of more than 50 plays in a single session
- [ ] Anomaly alerts: access from a TOR exit node or known VPN/proxy (configurable — coaches may use VPNs legitimately)
- [ ] Admin dashboard for reviewing audit logs with search and filter (Enterprise tier)

---


---

# UX & Accessibility (#100-114)


---

## Issue #100: [EPIC] UX & Accessibility Improvements
**Labels:** `epic`, `ui/ux`, `a11y`
**Milestone:** UX & Accessibility
**Priority:** High
**Description:** Comprehensive pass to improve onboarding, error handling, loading states, accessibility compliance, and power-user workflows. Every coach — regardless of ability, device, or experience level — should be able to use the app effectively from their first session.
**Acceptance Criteria:**
- [ ] All sub-issues (#101-#114) completed and verified
- [ ] WCAG 2.1 AA compliance audit passes
- [ ] Usability tested with 3 coaches who have never seen the app

---

## Issue #101: Onboarding wizard for new coaches
**Labels:** `ui/ux`, `onboarding`, `feature`
**Milestone:** UX & Accessibility
**Priority:** High
**Description:** A lightweight, skippable onboarding flow that guides new coaches through first-time setup without blocking them from using the app. The wizard should respect the "zero training required" philosophy by being optional and quick, while still helping coaches who want guidance get their system configured faster.
**Acceptance Criteria:**
- [ ] Triggered on first login only (not on subsequent visits)
- [ ] Step 1: Welcome screen with "Quick Setup" and "Skip — Just Start Drawing" options
- [ ] Step 2: Pick your level (high school, college, pro) — sets default hash mark width and field dimensions
- [ ] Step 3: Pick 3-5 base formations from visual thumbnails (pre-selects common defaults)
- [ ] Step 4: Set team colors and upload logo (optional, skippable)
- [ ] Step 5: Quick draw tutorial — interactive prompt to place a player, draw a route, and save (30 seconds)
- [ ] Skippable at any step — coach lands in the app immediately
- [ ] Progress saved — coach can resume setup later from settings
- [ ] Wizard does not appear again after completion or skip (stored in user preferences)

---

## Issue #102: Contextual empty states for all views
**Labels:** `ui/ux`, `feature`
**Milestone:** UX & Accessibility
**Priority:** Medium
**Description:** Every view that can be empty (playbook with no plays, game plan with no plays assigned, scratch pad with no sketches) should display a helpful, action-oriented empty state instead of a blank screen. Empty states should tell the coach what this area is for and provide a single clear action to get started.
**Acceptance Criteria:**
- [ ] Playbook empty state: illustration + "Your playbook is empty. Draw your first play or pick a formation to get started." + primary action button
- [ ] Game plan empty state: "No plays added yet. Drag plays from your playbook or tap + to browse." + link to playbook
- [ ] Scratch pad empty state: "No quick sketches yet. Tap Quick Draw to sketch an idea." + Quick Draw button
- [ ] Formation library empty state: "Start with our defaults or create your own." + "Load Defaults" button
- [ ] Scout cards empty state: "Set up a game plan with defense overlays to auto-generate scout cards."
- [ ] Each empty state includes a relevant illustration or icon (not just text)
- [ ] Empty states disappear as soon as content is added (no manual dismissal needed)

---

## Issue #103: Error boundary with recovery options
**Labels:** `ui/ux`, `infra`
**Milestone:** UX & Accessibility
**Priority:** High
**Description:** React error boundaries should catch rendering failures across the app and display a user-friendly recovery screen instead of a white screen or cryptic error. The canvas is especially critical — a crash in the play designer should not lose the coach's current work or require a full page reload.
**Acceptance Criteria:**
- [ ] Top-level error boundary catches unhandled exceptions and renders a friendly error screen
- [ ] Canvas-specific error boundary wraps the play designer — if the canvas crashes, the sidebar and navigation remain functional
- [ ] Error screen shows: "Something went wrong" message, "Try Again" button (re-renders the component), "Go Home" button (navigates to dashboard)
- [ ] Error details logged to a monitoring service (Sentry or equivalent) with play ID, coach ID, and action context
- [ ] Auto-save state preserved — recovering from an error does not lose unsaved changes (IndexedDB snapshot intact)
- [ ] Canvas recovery attempts to reload the last saved state of the play
- [ ] Error boundary does not trigger on expected errors (network offline, 404s) — only on unexpected crashes

---

## Issue #104: Loading skeletons for all data-fetching views
**Labels:** `ui/ux`, `feature`
**Milestone:** UX & Accessibility
**Priority:** Medium
**Description:** Replace all loading spinners with skeleton screens that match the shape of the content being loaded. Skeletons reduce perceived load time and prevent layout shift, making the app feel faster and more polished — especially on slow school WiFi networks.
**Acceptance Criteria:**
- [ ] Playbook grid view: skeleton cards matching play thumbnail dimensions
- [ ] Game plan view: skeleton situation slots with placeholder play cards
- [ ] Formation picker: skeleton thumbnail grid
- [ ] Play editor: skeleton field canvas with placeholder toolbar
- [ ] Settings page: skeleton form fields
- [ ] Skeletons animate with a subtle shimmer effect (pulsing gradient)
- [ ] Skeletons match dark mode and light mode color schemes
- [ ] Transition from skeleton to real content is smooth (no flash or layout jump)

---

## Issue #105: Color-blind safe palette for routes and canvas elements
**Labels:** `ui/ux`, `a11y`
**Milestone:** UX & Accessibility
**Priority:** High
**Description:** Route lines, blocking assignments, coverage zones, and scouting alerts currently rely on color to convey meaning (red = unblocked, green = advantage). Approximately 8% of male coaches are color-blind. The app must use a palette that is distinguishable by users with protanopia, deuteranopia, and tritanopia, and supplement color with shape/pattern cues.
**Acceptance Criteria:**
- [ ] Default route/blocking color palette tested with a color-blindness simulator (Coblis or similar) for all three common types
- [ ] Scouting alerts use shape + color (e.g., triangle icon for warning, not just red)
- [ ] Coverage zone overlays use hatching patterns in addition to color fills
- [ ] Numbers advantage indicators use icons (+ / - / =) alongside green/yellow/red
- [ ] "Color-blind mode" toggle in settings that switches to a high-contrast, pattern-heavy palette
- [ ] Color-blind palette does not degrade the visual quality for non-color-blind users
- [ ] All color choices pass WCAG 2.1 AA contrast ratio (4.5:1 for text, 3:1 for large elements)

---

## Issue #106: Full keyboard navigation for all features
**Labels:** `ui/ux`, `a11y`
**Milestone:** UX & Accessibility
**Priority:** High
**Description:** Every feature in the app must be operable via keyboard alone, without requiring a mouse or touch input. This is essential for accessibility compliance (WCAG 2.1 AA) and also benefits power-user coaches who work faster with keyboard-driven workflows at a desk.
**Acceptance Criteria:**
- [ ] All interactive elements (buttons, links, dropdowns, modals, pickers) are focusable via Tab key
- [ ] Focus order follows a logical reading/interaction sequence on every page
- [ ] Visible focus indicator on all focused elements (not just browser default — styled to match the dark theme)
- [ ] Modal dialogs trap focus within the modal and return focus to the trigger on close
- [ ] Formation picker, concept picker, and defense picker navigable with arrow keys and selectable with Enter
- [ ] Canvas player selection via arrow keys (cycle through players) and route drawing mode via keyboard shortcuts
- [ ] Escape key closes any open panel, modal, or picker
- [ ] No keyboard traps — user can always Tab out of any component
- [ ] Skip-to-content link at the top of every page for screen reader users

---

## Issue #107: Font scaling and text size accessibility
**Labels:** `ui/ux`, `a11y`
**Milestone:** UX & Accessibility
**Priority:** Medium
**Description:** Coaches with low vision or those projecting the app in meeting rooms need to increase text size without breaking the layout. All text must use relative units and the UI must remain functional at up to 200% browser zoom and with system-level font size overrides.
**Acceptance Criteria:**
- [ ] All font sizes defined in rem or em units — no hardcoded px values for text
- [ ] UI remains fully functional at 200% browser zoom (no overlapping text, no hidden controls, no horizontal scroll)
- [ ] Respects OS-level font size preferences (e.g., iOS Dynamic Type, Android font scale)
- [ ] Canvas player labels scale proportionally with zoom level
- [ ] Call sheet and wristband print layouts accommodate larger text without breaking grid structure
- [ ] In-app font size control in settings: Small / Medium / Large / Extra Large
- [ ] Minimum text size across the app is 14px equivalent (no text smaller than that at default zoom)

---

## Issue #108: Confirmation dialogs for destructive actions
**Labels:** `ui/ux`, `feature`
**Milestone:** UX & Accessibility
**Priority:** High
**Description:** Destructive actions (deleting plays, removing a game plan, clearing a folder, revoking a share link, deleting the team) must require explicit confirmation to prevent accidental data loss. Confirmation dialogs should clearly describe what will be lost and offer a final chance to cancel.
**Acceptance Criteria:**
- [ ] Delete play: "Delete [play name]? This cannot be undone. Plays referenced in game plans will also be removed." + Cancel / Delete buttons
- [ ] Delete folder: "Delete [folder name] and all [N] plays inside? This cannot be undone." + Cancel / Delete
- [ ] Delete game plan: "Delete game plan for Week [N] vs [opponent]?" + Cancel / Delete
- [ ] Clear scratch pad: "Clear all [N] scratch plays? This cannot be undone." + Cancel / Clear All
- [ ] Revoke share link: "Revoke this share link? Anyone with this link will lose access immediately." + Cancel / Revoke
- [ ] Delete team: Requires typing the team name to confirm (high-friction confirmation for high-stakes action)
- [ ] Destructive button styled in red/warning color, positioned away from the cancel button to prevent mis-taps
- [ ] Confirmation dialogs are keyboard accessible (Escape to cancel, Enter to confirm when the cancel button is focused by default)

---

## Issue #109: Undo toast notification with undo action
**Labels:** `ui/ux`, `feature`
**Milestone:** UX & Accessibility
**Priority:** Medium
**Description:** For reversible destructive actions (deleting a play, removing a play from a game plan, clearing tags), show a toast notification at the bottom of the screen with an "Undo" button instead of requiring a confirmation dialog. This follows the "undo over confirm" pattern that reduces friction while still preventing data loss.
**Acceptance Criteria:**
- [ ] Toast appears at the bottom of the screen after a reversible destructive action
- [ ] Toast message describes what happened: "Play deleted" / "Removed from game plan" / "Tags cleared"
- [ ] "Undo" button on the toast reverses the action immediately
- [ ] Toast auto-dismisses after 8 seconds if no action is taken
- [ ] Action is soft-deleted during the toast window — only hard-deleted after the toast dismisses
- [ ] Multiple toasts stack (most recent on top) if rapid actions are taken
- [ ] Toast is accessible: announced to screen readers, Undo button is keyboard-focusable
- [ ] Works alongside the canvas undo/redo system (Ctrl+Z) without conflict

---

## Issue #110: Feature discovery tooltips
**Labels:** `ui/ux`, `onboarding`
**Milestone:** UX & Accessibility
**Priority:** Low
**Description:** Power features (concept assembly, defense overlay, blocking auto-assign, scout card generation, Cmd+K search) are invisible to coaches who do not explore the UI. Contextual tooltips should surface these features at the right moment — when the coach is doing something that a power feature could accelerate.
**Acceptance Criteria:**
- [ ] "Did you know?" tooltip when coach manually draws 5+ routes: "Tip: Use Concept Assembly to auto-draw routes from your library. Try tapping the Concept picker."
- [ ] Tooltip when coach creates a game plan without a defense overlay: "Add a defense overlay to see how your plays look against their front."
- [ ] Tooltip when coach exports plays one by one: "Tip: Select multiple plays and export them all at once as a PDF."
- [ ] Tooltip when coach draws blocking manually vs a defense: "Your blocking scheme library can auto-assign blocks. Set it up in Libraries."
- [ ] Each tooltip shown at most once per coach (stored in preferences)
- [ ] Tooltips are dismissible with an "X" and a "Don't show tips" toggle in settings
- [ ] Tooltips are non-blocking — they do not cover the content the coach is working on
- [ ] Tooltips appear with a subtle animation (fade in, not pop)

---

## Issue #111: Breadcrumb navigation for nested views
**Labels:** `ui/ux`, `feature`
**Milestone:** UX & Accessibility
**Priority:** Medium
**Description:** When a coach drills into nested views (Playbook > Offense > Run Game > Inside Zone > specific play), they need a clear breadcrumb trail showing where they are and how to navigate back. Without breadcrumbs, coaches lose context and resort to the browser back button, which may behave unpredictably in a single-page app.
**Acceptance Criteria:**
- [ ] Breadcrumb bar renders below the top navigation on all nested views
- [ ] Breadcrumb path reflects the current location: Home > Playbook > [Folder] > [Sub-folder] > [Play Name]
- [ ] Each breadcrumb segment is clickable and navigates to that level
- [ ] Game plan breadcrumbs: Home > Game Plans > Week [N] vs [Opponent] > [Section]
- [ ] Practice script breadcrumbs: Home > Practice > [Date] > [Period]
- [ ] Breadcrumbs truncate gracefully on narrow screens (show first and last segments with "..." in between)
- [ ] Breadcrumbs update in real-time as the coach navigates
- [ ] Breadcrumbs are accessible: rendered as a nav element with aria-label="Breadcrumb"

---

## Issue #112: Search-everything command palette (Cmd+K)
**Labels:** `ui/ux`, `feature`
**Milestone:** UX & Accessibility
**Priority:** Medium
**Description:** A global command palette (triggered by Cmd+K or Ctrl+K) that lets coaches search across plays, formations, game plans, settings, and actions from anywhere in the app. This is the power-user equivalent of the playbook search but scoped to the entire application — coaches should never need to navigate to a specific page to find something.
**Acceptance Criteria:**
- [ ] Cmd+K (Mac) / Ctrl+K (Windows) opens a centered modal search palette from any page
- [ ] Search across: play names, formation names, game plan names, folder names, tags, coach names, settings pages
- [ ] Results grouped by category (Plays, Formations, Game Plans, Actions, Settings)
- [ ] Actions searchable: "Export", "New Play", "Quick Draw", "Share", "Dark Mode", "Keyboard Shortcuts"
- [ ] Fuzzy matching: typing "msh" finds "Mesh", typing "iz" finds "Inside Zone"
- [ ] Arrow keys navigate results, Enter selects, Escape closes
- [ ] Recent searches shown when palette opens with no query
- [ ] Results render within 100ms of keystroke (client-side index, no server round-trip)
- [ ] Accessible: palette is announced to screen readers, results are navigable via keyboard only

---

## Issue #113: Settings page with organized preference panels
**Labels:** `ui/ux`, `feature`
**Milestone:** UX & Accessibility
**Priority:** Medium
**Description:** A centralized settings page where coaches can manage account preferences, team configuration, display options, and security settings. Currently settings are scattered or missing — a single organized page reduces confusion and makes the app feel polished and trustworthy.
**Acceptance Criteria:**
- [ ] Settings accessible from the top navigation (gear icon) and from Cmd+K search
- [ ] Account panel: name, email, password change, MFA enrollment, session management, delete account
- [ ] Team panel: team name, colors, logo, manage coaches (invite, remove, change roles), plan/billing
- [ ] Display panel: theme (dark/light/system), font size, color-blind mode, field hash marks (high school/college/pro), default zoom level
- [ ] Notifications panel: email notifications for team invites, share link access, security alerts
- [ ] Data panel: export all data, delete all data, privacy settings
- [ ] Keyboard shortcuts reference panel (same content as the ? overlay)
- [ ] Settings changes save immediately with a subtle "Saved" confirmation
- [ ] Settings page is responsive and works on mobile

---

## Issue #114: Screen reader support and ARIA landmarks
**Labels:** `ui/ux`, `a11y`
**Milestone:** UX & Accessibility
**Priority:** High
**Description:** The app must be usable with screen readers (VoiceOver, NVDA, JAWS) for coaches with visual impairments. This requires proper ARIA landmarks, roles, labels, and live regions throughout the application. The canvas-based play designer presents a unique challenge and needs an alternative text representation for screen reader users.
**Acceptance Criteria:**
- [ ] ARIA landmarks on every page: banner, navigation, main, complementary (sidebar), contentinfo (footer)
- [ ] All interactive elements have accessible names (aria-label or visible label association)
- [ ] Form inputs have associated labels (not just placeholder text)
- [ ] Dynamic content changes announced via aria-live regions (save status, toast notifications, error messages)
- [ ] Canvas play diagrams have an aria-label describing the play: "[Play Name]: [Formation], [Concept], [N] routes, [N] blocking assignments"
- [ ] Play details available as a text-based alternative view: list of players with their assignments (e.g., "X: Post route, 15 yards. Z: Dig route, 12 yards.")
- [ ] Dropdown menus, modals, and pickers use correct ARIA roles (menu, dialog, listbox)
- [ ] Screen reader testing completed with VoiceOver (Mac/iOS) and NVDA (Windows)
- [ ] No ARIA misuse — roles match actual component behavior

---

## Issue Summary (Audit)

| Category | Issue Range | Count | Focus |
|----------|------------|-------|-------|
| Security | #65-79 | 15 | RLS, auth, tokens, XSS, CSRF, uploads, sessions, compliance, encryption, CSP, audit logging |
| UX & Accessibility | #100-114 | 15 | Onboarding, empty states, errors, loading, color-blind, keyboard, font scaling, undo, search, settings, screen readers |
| **Total** | | **30 issues** | |
