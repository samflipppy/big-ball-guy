# Big Ball Guy — Football Playbook Builder

> "Stop paying for Visio. Draw plays in your browser like you draw them on a whiteboard."

## The Problem

Football coaches at every level spend hours building playbooks, scout cards, and install sheets. The current tools are:

- **Pro Quick Draw** — a Microsoft Visio/PowerPoint plugin. Requires a $400+ Visio license, Windows-only, clunky UX, hidden pricing, no mobile support.
- **Hudl / Catapult** — video-first platforms. Playbook features are bolted on, not the core product.
- **PowerPoint / Google Slides** — what most coaches actually use. Painful, no football-specific tooling.
- **Pen and paper** — still shockingly common. Not shareable, not searchable, not reusable.

## The Product

A modern, web-based playbook builder designed for football coaches. Think **Figma meets football**.

### Core Concept: Composable Play Design

Coaches don't think in shapes and arrows — they think in **concepts**. Our tool matches how coaches actually build plays:

1. **Route Tree Library** — Define your route tree once (Hitch, Out, Corner, Post, Seam, etc.) with customizable stems, breaks, and depths. Every coach runs their routes slightly different — they own their library.

2. **Blocking Scheme Library** — Define your blocking schemes once (Inside Zone, Outside Zone, Power, Counter, Pass Pro rules). Assign rules per position (PST: base, PSG: combo to Mike, C: back block, etc.).

3. **Formation Library** — Build your formation catalog (Spread, Trips, I-Form, Pistol, Empty, etc.) with exact alignments. Snap to hash, field, boundary.

4. **Concept Assembly** — The magic. Coaches pick:
   - A formation
   - A pass concept or run scheme
   - Routes auto-populate on eligible receivers
   - Blocking auto-populates on the OL/TE/FB
   - Adjust, override, customize as needed

5. **Auto-Import vs. Defenses** — This is the game-changer:
   - Select an opponent defensive front/coverage (4-3 Cover 3, 3-4 Cover 1, Nickel Cover 2, etc.)
   - Your play renders WITH the defense overlaid
   - Blocking assignments auto-adjust based on defensive alignment
   - See how your concept attacks specific coverages
   - Build scout cards instantly: "Here's our top 5 plays vs their base defense"

### Play Designer (Canvas)

- HTML5 canvas with a football field (hash marks, yard lines, numbers)
- Drag-and-drop player icons (O, X, S, M, W, $, etc. with custom labels)
- Click a player → draw a route with smooth curves and sharp cuts
- Route snaps clean with consistent styling
- Blocking arrows: base, combo, pull, kick-out, lead, zone steps
- Defensive players with alignment labels (0-tech, 3-tech, 5-tech, etc.)
- Coverage shells overlaid (Cover 1/2/3/4/6 zone drops)

### Playbook Organization

- Folders: Offense / Defense / Special Teams / Scout
- Tag plays by situation: red zone, 3rd & long, 2-minute, goal line, backed up
- Tag by personnel: 11 personnel, 12, 21, 13, empty, etc.
- Search and filter across the entire playbook
- Drag to reorder, duplicate plays as variants
- Version history on every play

### Scout Cards

- Build cards from opponent tendencies
- Print-ready formatting (4-up or 6-up per page for practice)
- Share a read-only link with players (mobile-friendly)
- QR code generation for physical handouts

### Install Sheets

- Weekly game plan builder
- Organize plays by down & distance, field zone, and situation
- Auto-pull from your playbook based on tags
- Print-ready for the sideline call sheet

### Wristband Generator

- Select plays for the wristband
- Auto-format into a grid layout
- Color-coded by category
- Export to print, cut, and slip into wristbands

## Target Market

### Primary: High School & Small College Programs
- Can't afford Hudl's top tiers or Pro Quick Draw + Visio
- Coaches are tech-savvy enough for a web app but not for Visio
- Budget-conscious — free tier gets them in, $15/mo is a no-brainer
- Huge volume: ~16,000 high school programs in the US alone

### Secondary: College Programs (FCS, D2, D3, NAIA, JUCO)
- Need collaboration features for larger staffs
- Want branding/customization
- $49/mo program plan is trivial in their budget

### Tertiary: NFL / FBS
- Enterprise deals if the product is good enough
- These programs already have tools but the UX is still bad
- Real-time collaboration and modern UX could win them over

## Competitive Advantages

| Feature | Pro Quick Draw | PowerPoint | **Big Ball Guy** |
|---|---|---|---|
| Platform | Windows + Visio | Any | Web + iPad + any browser |
| Setup | Plugin install + license | None | Sign up and go |
| Pricing | Hidden / enterprise | Free (but painful) | Free tier + $15/mo |
| Mobile | None | Clunky | Responsive + tablet-first |
| Collaboration | Shared drive | Google Slides | Real-time multiplayer |
| Route library | Stencils | Manual | Composable + reusable |
| vs. Defense overlay | Manual | Manual | **Auto-import** |
| Blocking auto-assign | No | No | **Yes, rule-based** |
| Scout card generation | Templates | Manual | **One-click from tags** |
| Learning curve | Know Visio | Know PPT | Draw like a whiteboard |

## Tech Stack

- **Next.js** — app shell, auth, API routes, SSR
- **Konva.js or Fabric.js** — HTML5 canvas for the play designer
- **Supabase** — auth, Postgres database, file storage, real-time subscriptions
- **Tailwind CSS** — fast, clean, modern UI
- **Vercel** — deployment, edge functions, analytics
- **PWA** — installable on iPad/tablet for sideline use

## Data Model (High Level)

```
Team
  ├── Coaches (users)
  ├── Route Library
  │     └── Route (name, path data, tags)
  ├── Blocking Scheme Library
  │     └── Scheme (name, rules per position)
  ├── Formation Library
  │     └── Formation (name, player positions, personnel)
  ├── Defense Library
  │     └── Defense (name, front, coverage, player positions)
  ├── Playbooks
  │     ├── Offense
  │     │     └── Play (formation + concept + routes + blocking + tags)
  │     ├── Defense
  │     │     └── Play (front + coverage + blitz + tags)
  │     └── Special Teams
  │           └── Play (...)
  ├── Scout Reports
  │     └── Opponent
  │           ├── Tendencies
  │           └── Scout Cards
  └── Game Plans
        └── Week
              ├── Install Sheet
              ├── Call Sheet
              └── Wristbands
```

## Monetization

### Free Tier
- 1 playbook
- 20 plays max
- Basic formations and route library
- Watermarked PDF export
- Single user

### Coach Pro — $15/month
- Unlimited playbooks and plays
- Full route, blocking, and formation libraries
- Clean PDF/PNG export
- Scout card generation
- Wristband generator
- Install sheets

### Program — $49/month
- Everything in Coach Pro
- Up to 10 coaches on the team
- Real-time collaborative editing
- Team branding (colors, logo, fonts)
- Priority support
- API access for video platform integrations

### Enterprise — Custom
- Unlimited coaches
- SSO / IT integration
- Custom onboarding
- Dedicated support
- White-label options

## MVP Scope (v0.1)

The minimum viable demo that shows the vision:

1. **Field canvas** — renders a football field with yard lines and hashes
2. **Player placement** — drag offensive and defensive players onto the field
3. **Route drawing** — click a player, draw a route path, it renders clean
4. **Formation templates** — pick from 4-5 common formations, players snap into place
5. **Save/load** — persist plays to Supabase
6. **Export** — download play as PNG

That's the demo that gets coaches excited. Everything else builds on top.

## Name Ideas

- Big Ball Guy (current repo name — fun, memorable)
- ChalkTalk
- PlayForge
- FieldScript
- DrawItUp
- GridIron Studio
- The Playsheet

## UI/UX Philosophy: Zero Training Required

The #1 design principle: **a coach who has never seen this app should be able to create a play in under 60 seconds on their first visit.** If it needs a tutorial, it's too complicated. Every decision below serves that goal.

### 1. The Whiteboard Metaphor

Coaches already know how to draw plays. They do it on whiteboards, napkins, and foggy bus windows. The entire UI should feel like a digital whiteboard, not a software application.

- The field IS the app. When you open a new play, you see a field. That's it. No dashboards, no settings panels, no onboarding wizard.
- Tap the field to place a player. Tap a player to draw their route. Done.
- Two-finger draw (or click-drag) for freehand annotation — circle a gap, draw an arrow, scribble a note. Just like a dry-erase marker.
- Undo/redo with simple swipe gestures or Ctrl+Z. Mistakes cost nothing.

### 2. Progressive Disclosure — Show Less, Do More

Never show the coach 50 buttons. Show them 3 things, and reveal more only when they need it.

**Layer 0 — The Field (default view)**
- Empty field. A subtle "+" button or "Tap to add players" hint. That's ALL they see.

**Layer 1 — After adding players**
- A small floating toolbar appears: Formation templates, Route tool, Blocking tool, Text label.
- Tapping a player highlights it and shows contextual actions (draw route, set assignment, change label).

**Layer 2 — Power features (only when they go looking)**
- Route library, blocking scheme library, defensive overlays, tags, export options.
- These live in a clean sidebar that slides in. Never forced on the user.

**Layer 3 — Program management**
- Playbook organization, scout cards, install sheets, team settings.
- Accessed from a simple top nav. Completely invisible until needed.

### 3. Tap-First, Touch-Native Design

Coaches use iPads. A LOT. The entire interaction model should be designed for touch first, mouse second.

- **Big tap targets** — player icons are large, easy to grab with a finger
- **Gesture-based route drawing** — tap player, drag to draw the route, lift to finish. The line smooths and snaps automatically.
- **Pinch to zoom** the field, two-finger pan to scroll
- **Long-press** a player for a context menu (change position label, delete, duplicate)
- **Swipe between plays** in a playbook like flipping pages
- No right-click menus, no hover states that hide critical actions, no tiny toolbar icons

### 4. Smart Defaults That Speak Football

The app should know football. Out of the box, zero configuration:

- **Default route tree pre-loaded** — Hitch (5yd), Slant, Out (8yd), Curl (12yd), Corner, Post, Go, Wheel, Flat, Angle, Seam. Coach can customize later, but they never HAVE to.
- **Default formations pre-loaded** — Spread (2x2), Trips Right, I-Form, Single Back, Pistol, Empty, Goal Line. Tap one and 11 players appear in the right spots.
- **Default fronts pre-loaded** — 4-3, 3-4, Nickel, Dime, Bear, 46. Same idea for the defensive side.
- **Player labels default to football positions** — not "Player 1" but "X", "Z", "H", "Y", "F", "T", "G", "C". Coaches see their language instantly.
- **When you draw a route, the app suggests what it is** — "Looks like a Corner route" with a small label. Coach can accept or rename. Builds their library passively.

### 5. One-Tap Concept Assembly (The "Magic" UX)

This is where we leapfrog every competitor. The flow:

```
[Pick Formation] → [Pick Concept] → Play is drawn. Done.
```

- Coach taps "New Play"
- Sees a grid of their formations (visual thumbnails, not text lists). Taps "Trips Right."
- 11 offensive players appear on the field in Trips Right alignment.
- Bottom of screen shows concept cards: "Mesh", "Drive", "Smash", "Four Verts", "Inside Zone", "Counter", "Power"
- Coach taps "Mesh" — routes auto-draw on the eligible receivers, blocking assignments auto-populate on the line.
- Coach tweaks if needed (drag a route, change an assignment) or just saves.
- **Total time: 3 taps and maybe 10 seconds.**

Compare that to Pro Quick Draw: open Visio, load template, drag 11 stencils onto the field, manually draw every route and blocking arrow. 15-20 minutes.

### 6. Visual Route Drawing with Auto-Clean

When a coach draws a route freehand, it's going to be wobbly. The app should:

- **Auto-smooth** the path into clean curves and straight segments
- **Detect route breaks** — a sharp change in direction becomes a crisp cut (not a rounded curve)
- **Snap to common depths** — if you draw to roughly 5 yards, it snaps to 5. Roughly 10-12, it snaps to the coach's curl depth. Subtle, not aggressive.
- **Show a ghost line** while drawing so the coach sees the cleaned-up version in real-time
- **Arrow heads auto-appear** at the end of the route

The result: a coach scribbles a sloppy route with their finger and it comes out looking like a textbook diagram. That moment of "whoa" is what makes them tell another coach about it.

### 7. Contextual Intelligence

The app should feel like it understands the game:

- **Place a RB behind the QB** → app suggests "Add pass pro assignment?" with one tap
- **Draw 5 routes and no blocking** → subtle prompt: "Add protection?"
- **Tag a play as "Red Zone"** → app auto-suggests goal line formations
- **Import a 3-4 defense** → blocking rules auto-shift (Center IDs the nose, guard works to the backer)
- **Create 5 plays vs Cover 3** → app offers "Generate scout card?" with one tap

Never block the coach. Never force them through a wizard. Just quietly surface the next logical action.

### 8. Instant Share — QR Code + Link

After creating a play or playbook section:

- **One-tap share** generates a mobile-friendly read-only link
- **QR code** auto-generates — coach can project it in a meeting room, players scan with their phones
- **Players see a clean mobile view** — swipe through plays, pinch to zoom, no account needed
- **Practice script sharing** — share this week's install with the whole team in 5 seconds

No "export to PDF, email it, hope they open it" workflow. Just scan and see.

### 9. Dark Mode by Default (Coach Mode)

Coaches work late. Film rooms are dark. The default theme should be:

- **Dark background** with a clean green/white field
- High contrast player icons and route lines
- Easy on the eyes at 11 PM
- Light mode available but dark is the default — it signals "this was built for you, not for an office worker"

### 10. Offline-First PWA

Coaches are on buses, in locker rooms, at practice fields with no WiFi:

- **Works offline** — create and edit plays with no internet connection
- **Auto-syncs** when back online
- **Installable on iPad** home screen — feels like a native app
- **Fast.** No loading spinners. Plays render instantly. The canvas is local-first.

### 11. Animation / Play Simulation (Future, but plant the seed)

A "Play" button on any play that:

- Animates the routes and blocking assignments unfolding in real-time
- Shows the timing of the play (3-step, 5-step, 7-step drop)
- Lets coaches show players "here's what it looks like in motion"
- This is a massive differentiator and demo-able feature

### 12. Voice-to-Play (AI Feature, Future)

Coach speaks: "Trips right, X on a post, Z on a dig, H shallow cross, Y check-release, F on a wheel"

The app draws it. Coach tweaks if needed. This is the endgame UX — zero taps.

### 13. Keyboard Shortcuts for Power Users

For the OC sitting at a desk building the whole playbook:

- `F` — new formation
- `R` — route drawing mode
- `B` — blocking mode
- `D` — add defense overlay
- `S` — save
- `E` — export
- `1-9` — quick-select formation templates
- `Cmd+D` — duplicate play
- `Cmd+Z/Y` — undo/redo
- `Space` — play animation

Not required to use the app. But power users will fly.

### 14. Coach Workflows — One Tool, Every Context

A coach doesn't just "make plays." They operate in completely different modes depending on the day, the moment, and the audience. The critical insight: **a play is created ONCE and flows into every context automatically.** The coach never rebuilds, re-exports, or reformats. The same play data powers everything below.

#### Mode 1: Quick Sketch ("Napkin Mode")

**When:** Staff meeting, phone call with a coordinator, halftime, bus ride, random 2 AM idea.
**Need:** Get a play drawn in under 30 seconds. No friction. No saving required.

- **One-tap entry** — a "Quick Draw" button always visible. Tap it, you're on a blank field, drawing.
- No title required, no folder, no tags. Just draw.
- Auto-saves to a "Scratch Pad" inbox. Coach can organize later or never.
- Think of it like Apple Notes — you open it and start writing. No setup.
- Scratch plays can be promoted to the full playbook later with one tap: "Add to playbook → pick folder → done."
- The scratch pad is the first thing the coach sees when they have a half-baked idea. Zero commitment.

#### Mode 2: Playbook Building ("Architect Mode")

**When:** Offseason, preseason camp, installing a new system.
**Need:** Build the master library. Organized, tagged, complete.

- This is the deep work mode. Coach is at a desk or iPad with time.
- **Folder structure mirrors how coaches think:** Offense → Run Game → Inside Zone → variations. Or Offense → Pass Game → Dropback → Mesh → variations.
- **Concept-first organization** — coaches don't think "Play #47", they think "Mesh out of Trips." The playbook should organize by concept, not by arbitrary numbers.
- **Bulk operations** — duplicate a play into 4 formation variants with one action. "I want Mesh out of Spread, Trips, Empty, and Bunch." Tap tap tap tap, done.
- **Tagging is fast and optional** — situation tags (red zone, 3rd & long, 2-minute), personnel tags (11, 12, 21), concept tags. Never required, but powerful when used.
- **Visual playbook browser** — see plays as thumbnail cards in a grid, not a text list. Coaches recognize plays visually, not by name.

#### Mode 3: Game Planning ("War Room Mode")

**When:** Monday through Friday of game week. Preparing for a specific opponent.
**Need:** Pull plays from the master playbook and organize them into a game plan for THIS week vs THIS opponent.

- **"New Game Plan" → pick opponent → pick week.**
- Left panel: the coach's full playbook (filterable). Right panel: the game plan slots.
- **Drag plays from the playbook INTO the game plan.** The play isn't copied — it's referenced. Edit the master, the game plan updates.
- **Game plan organized by situation:**
  - Openers (scripted first 15)
  - 1st & 10
  - 2nd & Medium
  - 2nd & Long
  - 3rd & Short
  - 3rd & Long
  - Red Zone
  - Goal Line
  - 2-Minute
  - Backed Up (own 1-10)
- **Defense overlay per section** — "Our 1st & 10 plays, shown against their base 4-3 Cover 3." One toggle and every play in that section renders with the opponent's front.
- **"How does this look against their stuff?"** — the core question of game planning, answered visually and instantly.

#### Mode 4: Practice Scripting ("Practice Mode")

**When:** Day before or morning of practice.
**Need:** Build the practice script — an ordered list of plays the team will run, organized by period.

- **Practice template:** Coaches run practice in periods (Indy, Inside Run, Team Pass, Team Run, Red Zone, 2-Min, etc.)
- **Drag plays from the game plan into practice periods.** Again, referenced not copied.
- **Script view:** A clean sequential list — Period 1: plays 1-8. Period 2: plays 1-10. Etc.
- **Print-ready in one tap** — formatted for the coach's clipboard or projected on the practice field screen.
- **Scout team cards auto-generate** — if a play has a defense overlay, the scout card is already done. Print the defensive look for the scout team to line up in.
- **Rep tracking (future)** — check off plays as they're run. Track what got repped and what didn't. "We scripted 15 red zone plays but only got to 9."

#### Mode 5: Game Day ("Sideline Mode")

**When:** Saturday / Friday night. On the sideline or in the press box.
**Need:** The call sheet. Fast reference. No fumbling.

- **Auto-generated call sheet** from the game plan. One tap, it's formatted.
- **Laminated card layout** — plays organized by situation in a grid, color-coded by run/pass/screen/play-action.
- **Big text, high contrast** — readable in sunlight, rain, under stadium lights.
- **Tap any play on the call sheet → see the full diagram instantly.** Quick reference if the coach forgets the protection or a route adjustment.
- **Wristband auto-generated** — select which plays go on the QB wristband, auto-formatted into the grid, print and cut.
- **Halftime scratch pad** — quick draw mode is one tap away. Coach sees something at halftime, sketches an adjustment, shows the staff.

#### Mode 6: Player Distribution ("Share Mode")

**When:** After install meetings, before walkthroughs, anytime players need to see plays.
**Need:** Get plays to players' phones. Instantly. No app download.

- **Position-filtered views** — the X receiver only sees his route and assignment, not the whole play. Less noise, faster learning.
- **Meeting deck mode** — project plays on a screen in a team meeting. Swipe through one by one. Animate on tap.
- **QR code on the board** — coach projects QR code, players scan, they have the install on their phones. No group chat, no email attachment, no "coach can you send that again."
- **Player view is read-only, clean, mobile-optimized** — dark background, big diagrams, swipe to browse. No login required (share link with expiration).
- **Quiz mode (future)** — show a formation, ask the player "what's your assignment?" Flash card style learning from the actual playbook.

#### The Data Flow

This is the key architecture decision. A play lives in ONE place:

```
MASTER PLAYBOOK (source of truth)
    │
    ├──→ Game Plan (references plays, adds situation/opponent context)
    │       │
    │       ├──→ Practice Script (orders plays by period)
    │       ├──→ Call Sheet (formats plays for sideline)
    │       ├──→ Wristband (subset, grid format)
    │       └──→ Scout Cards (play + defense overlay, print-ready)
    │
    └──→ Player Share (filtered view per position)
```

**Edit a play in the master playbook → it updates everywhere.** The game plan, the practice script, the call sheet, the wristband — all reflect the change. No version control nightmares. No "wait, which version of Mesh did we put on the call sheet?"

#### What This Means for the UI

The app has ONE primary view — the play canvas. Everything else is just a different way to ORGANIZE and PRESENT the same plays:

| Mode | Entry Point | What the Coach Sees |
|---|---|---|
| Quick Sketch | "Quick Draw" button | Blank field, start drawing |
| Playbook | "Playbook" tab | Folder tree + play thumbnails |
| Game Plan | "Game Plans" tab → new/select week | Situation slots + playbook sidebar |
| Practice | "Practice" tab → new/select date | Period list + game plan sidebar |
| Game Day | "Game Day" tab | Call sheet + wristband layouts |
| Share | Share icon on any play/collection | QR code + link + position filter |

Six modes, but NOT six different apps. The chrome around the canvas changes. The canvas itself is always the same play designer the coach already knows.

### 15. Touch-Safe Interactions — No Drag-and-Drop Traps

Standard HTML drag-and-drop is BROKEN on mobile/tablet. It conflicts with scrolling, pinch-zoom, and browser gestures. We can't just slap desktop DnD onto an iPad and call it done. Every interaction needs a touch-native alternative.

#### The Problem with Drag-and-Drop on Touch

- A "drag" on mobile is also a "scroll." The browser doesn't know which one you mean.
- Long-press-to-drag delays feel sluggish and unpredictable.
- Accidentally dragging a play when you meant to scroll is infuriating.
- Drop targets are hard to hit precisely with a finger.
- If the coach pinch-zooms while dragging, everything breaks.

#### The Solution: Tap-to-Select, Tap-to-Place (Primary) + Drag (Optional)

**On the field canvas (placing players, drawing routes):**
- This is fine as drag/draw — the canvas is a controlled area, not a scrollable list.
- We own the touch handling here. Finger on a player = move it. Finger on empty field = pan.
- Clear mode separation: "Select" mode (tap to select, drag to move) vs "Draw" mode (finger draws a route). Toggle between them with a prominent button.
- Visual cues: selected player gets a glow ring. Draw mode shows a pencil cursor/icon.

**On lists and organizational views (playbook → game plan, game plan → practice script):**
- **PRIMARY: Tap-to-select, then tap destination.** This is the touch-safe pattern:
  1. Coach taps a play in the playbook → it highlights with a checkmark.
  2. Coach taps (or multi-selects several plays).
  3. Coach taps the "Add to →" button → sees the situation slots.
  4. Coach taps "Red Zone" → plays land there. Done.
  - No dragging. No collision with scrolling. Works perfectly on any device.

- **SECONDARY: Desktop drag-and-drop.** On desktop with a mouse, drag-and-drop also works because there's no scroll conflict. But it's a bonus, not the primary interaction.

- **Reordering within a list:** Tap the play, then use up/down arrow buttons to reorder. Or a "move to position" tap. Again, no drag required.

#### Mode Indicators — Always Know What Your Finger Will Do

The #1 confusion on touch canvas apps: "will my finger move this player, draw a route, or scroll the field?" We solve this with:

- **Clear mode toggle** at the bottom of the screen (large, thumb-reachable):
  - **Select** (hand icon) — tap to select players, drag to move them
  - **Draw** (pencil icon) — finger draws routes/assignments
  - **Pan** (arrows icon) — finger scrolls/zooms the field
- **The current mode is ALWAYS visible** — highlighted button, maybe a subtle border color change on the canvas
- **Auto-mode switching:** tap a player in Draw mode → starts drawing from that player. Tap empty space in Select mode → deselects all. Smart defaults reduce mode switching.

### 16. Auto-Save & Never Lose Work

A coach closes the tab, their phone dies, Safari crashes, they accidentally hit the back button. Doesn't matter. **Nothing is ever lost.**

#### Continuous Auto-Save

- **Every change saves instantly.** No save button needed (though we show one for comfort).
- Debounced writes — batch rapid changes (dragging a player around) into a single save every 500ms.
- **Save indicator:** a tiny cloud icon in the corner.
  - Checkmark = saved.
  - Spinning = saving.
  - Warning triangle = offline (will sync later).
- The coach never thinks about saving. It just happens.

#### Local-First Architecture

- All play data is written to **IndexedDB (browser local storage) FIRST**, then synced to Supabase.
- This means:
  - **Instant saves** — no network round-trip needed
  - **Works offline** — create and edit plays with no internet
  - **Tab crash recovery** — data is already in IndexedDB, not in memory
  - **Slow WiFi doesn't matter** — the UI never waits for the server
- When the network is back, changes sync in the background. Conflict resolution: last-write-wins at the play level (simple, good enough for v1).

#### Session Recovery

- **Close tab + reopen → you're exactly where you left off.** Same play open, same zoom level, same mode.
- **Browser back button:** doesn't navigate away from the editor. Instead, it undoes the last action (or navigates back through plays if in the playbook view). The `beforeunload` event warns if there are truly unsaved changes (there shouldn't be, but as a safety net).
- **"Recently edited" section** on the home screen — the last 10 plays the coach touched, with timestamps. One tap to jump back in.

#### Version History (Phase 2+)

- Every save creates a lightweight snapshot.
- Coach can tap "History" on any play → see a timeline of changes → tap to preview → restore any version.
- Not git-level complexity. Just "here's what this play looked like yesterday, last week, last month."
- Covers the "oh no I changed Mesh and broke it, what did it look like before?" panic.

#### Data Safety Summary

| Scenario | What happens |
|---|---|
| Close tab | Auto-saved to IndexedDB + cloud. Reopen → right where you left off. |
| Phone dies | Same as close tab. IndexedDB persists across sessions. |
| No WiFi | Everything works. Saves locally. Syncs when back online. |
| Safari crash | IndexedDB survives crashes. No data lost. |
| Delete browser cache | Cloud backup has everything. Re-syncs on next load. |
| Accidental edit | Undo (Ctrl+Z) or version history to restore. |
| "Which version did I have?" | Version history timeline on every play. |

### UX Principles Summary

| Principle | What it means in practice |
|---|---|
| **Whiteboard-first** | The field is the UI. Everything else is secondary. |
| **3-tap play creation** | Formation → Concept → Done. |
| **Touch-native** | Designed for iPad fingers, not desktop mouse pointers. |
| **Football-fluent** | Default labels, routes, formations speak coach language. |
| **Progressive disclosure** | Simple on the surface, powerful underneath. |
| **Auto-clean drawing** | Sloppy finger input → textbook diagram output. |
| **Instant sharing** | QR code + link, no export/email/download dance. |
| **Offline-first** | Works on the bus, at practice, in the film room. |
| **Dark by default** | Built for late nights in the film room. |

## Shared Component Architecture — Build Once, Use Everywhere

The entire app is built from a small set of reusable primitives. Every mode composes from the same pieces.

### Core Primitives (build these FIRST — everything else is free)

```
<FieldCanvas />
│  The football field. Renders yard lines, hashes, numbers.
│  Used in: EVERY mode. Literally everywhere.
│
├── <PlayerIcon />
│    A single player on the field. Draggable. Labeled (X, Z, T, etc).
│    Props: position, label, team (offense/defense), selected, onDrag
│    Used in: play designer, formation builder, scout cards, call sheet preview
│
├── <RouteLine />
│    A single route or blocking assignment drawn on the field.
│    Props: path (SVG data), type (route/block/motion), style (solid/dashed/wavy)
│    Used in: play designer, playbook thumbnails, scout cards, player share view
│
├── <FormationOverlay />
│    Places 11 players in a formation. Just maps a formation template → PlayerIcons.
│    Props: formation (from library), side (offense/defense)
│    Used in: play designer, formation picker thumbnails, concept assembly
│
└── <DefenseOverlay />
     Places defensive players in a front/coverage shell.
     Props: defense (from library), coverage
     Used in: play designer, game plan defense toggle, scout cards
```

### Play Renderer — The Single Most Important Component

```
<PlayRenderer />
│  Composes FieldCanvas + FormationOverlay + RouteLines + DefenseOverlay
│  Given a Play object, it renders the FULL diagram.
│
│  Props:
│    play: Play           — the play data
│    defense?: Defense    — optional defense overlay
│    editable: boolean    — can the coach modify it? (true in designer, false in call sheet)
│    size: 'full' | 'card' | 'thumbnail' | 'wristband'
│    highlights?: string[]  — highlight specific positions (for player-filtered view)
│    animated?: boolean   — play animation mode
│
│  THIS is the component that gets reused everywhere:
│
│  ┌─────────────────────────────────────────────────┐
│  │ Play Designer    → <PlayRenderer editable size="full" />           │
│  │ Playbook Grid    → <PlayRenderer size="thumbnail" />    (x40)     │
│  │ Game Plan Slot   → <PlayRenderer defense={opp} size="card" />     │
│  │ Scout Card       → <PlayRenderer defense={opp} size="card" />     │
│  │ Call Sheet Cell   → <PlayRenderer size="wristband" />             │
│  │ Wristband Cell   → <PlayRenderer size="wristband" />             │
│  │ Player Share     → <PlayRenderer highlights={["X"]} size="full" />│
│  │ Meeting Deck     → <PlayRenderer animated size="full" />          │
│  │ Quick Sketch     → <PlayRenderer editable size="full" />          │
│  └─────────────────────────────────────────────────┘
│
│  ONE component. Different props. Every view in the app.
```

### Layout Shells — Thin Wrappers, All the Reuse

Each "mode" is just a layout that arranges PlayRenderers and library pickers:

```
<QuickSketchPage />
│  Just a full-screen <PlayRenderer editable size="full" />
│  + a floating save button. That's it. Maybe 30 lines of code.

<PlaybookPage />
│  Left: folder tree
│  Right: grid of <PlayRenderer size="thumbnail" /> cards
│  Click a card → opens <PlayRenderer editable size="full" />

<GamePlanPage />
│  Left sidebar: <PlaybookPage /> (reused!) as a filterable list
│  Right: situation slots, each containing <PlayRenderer defense={opp} size="card" />
│  Drag from left → right.

<PracticeScriptPage />
│  Left sidebar: <GamePlanPage /> slots (reused!) as a source
│  Right: period list, each containing ordered <PlayRenderer size="card" />
│  Drag from left → right.

<GameDayPage />
│  Tab 1 — Call Sheet: grid of <PlayRenderer size="wristband" /> in situation buckets
│  Tab 2 — Wristband: smaller grid of <PlayRenderer size="wristband" />
│  Both auto-populated from the GamePlan.

<PlayerSharePage />
│  Full-screen <PlayRenderer highlights={[position]} size="full" />
│  Swipe to browse. Position filter toggle at top.
```

### Shared UI Components

```
<FormationPicker />    — grid of formation thumbnails. Used in play designer + concept assembly.
<ConceptPicker />      — grid of concept cards. Used in play designer + game plan.
<DefensePicker />      — grid of defensive fronts/coverages. Used in play designer + game plan.
<TagEditor />          — chips for situation/personnel tags. Used in playbook + game plan.
<ExportButton />       — PNG/PDF export. Used on any PlayRenderer.
<ShareButton />        — QR code + link generation. Used on any play or collection.
<PrintLayout />        — formats any collection of PlayRenderers for print (4-up, 6-up, call sheet, wristband).
```

### The Data Layer — One Schema, Every View

```typescript
// The core type — everything references this
type Play = {
  id: string
  name: string
  formation: FormationRef        // references the formation library
  concept?: ConceptRef           // references the concept library
  players: PlayerAssignment[]    // position + route/blocking overrides
  tags: string[]                 // situation + personnel tags
  notes?: string
}

// Game plan just references plays — never copies
type GamePlan = {
  id: string
  opponent: string
  week: number
  sections: {
    situation: string            // "Red Zone", "3rd & Long", etc.
    plays: PlayRef[]             // references to Play IDs
    defense?: DefenseRef         // opponent defense for this situation
  }[]
}

// Practice script references game plan sections
type PracticeScript = {
  id: string
  date: string
  gamePlanId: string
  periods: {
    name: string                 // "Inside Run", "Team Pass", etc.
    plays: PlayRef[]             // pulled from game plan
  }[]
}

// Call sheet is auto-derived from game plan
type CallSheet = {
  gamePlanId: string             // that's it — the rest is rendering logic
  wristbandPlays: PlayRef[]     // subset selected for wristband
}
```

**Notice:** `GamePlan`, `PracticeScript`, and `CallSheet` barely have their own data. They're mostly just references + layout instructions. The play is ALWAYS the source of truth. This means:

- Change a play → every view updates automatically
- The "game plan builder" is really just a drag-and-drop organizer
- The "call sheet" is just a print layout of the game plan
- The "practice script" is just an ordered subset of the game plan
- **Minimal new code per mode. Maximum reuse.**

### Build Order — What to Build and When

```
Phase 1: The Canvas Core (MVP)
  FieldCanvas → PlayerIcon → RouteLine → PlayRenderer (editable)
  = Quick Sketch mode works. Coach can draw plays.

Phase 2: Libraries
  FormationPicker → ConceptPicker → DefensePicker
  = Concept assembly works. 3-tap play creation.

Phase 3: Organization
  PlaybookPage (folders + thumbnails + tags)
  = Playbook mode works. Coach can organize plays.

Phase 4: Game Planning
  GamePlanPage (situation slots + defense overlay + drag from playbook)
  = War Room mode works. Weekly prep is possible.

Phase 5: Output
  PracticeScriptPage + CallSheet + Wristband + PrintLayout + ShareButton
  = Practice, Game Day, and Share modes all work.
  These are THIN layers — mostly layout and print formatting.
  Phase 5 is fast because it's all reuse.
```

Phase 1 is the hard work. Phases 2-5 get progressively easier because every new mode just composes existing components in a new layout.

## Next Steps

1. Scaffold the Next.js project
2. Build the canvas-based field renderer
3. Implement player placement and route drawing
4. Add formation templates
5. Wire up Supabase for persistence
6. Deploy to Vercel
7. Get it in front of 3 coaches for feedback
