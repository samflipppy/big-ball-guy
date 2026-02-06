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

## Next Steps

1. Scaffold the Next.js project
2. Build the canvas-based field renderer
3. Implement player placement and route drawing
4. Add formation templates
5. Wire up Supabase for persistence
6. Deploy to Vercel
7. Get it in front of 3 coaches for feedback
