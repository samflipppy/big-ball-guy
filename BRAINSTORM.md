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

## Next Steps

1. Scaffold the Next.js project
2. Build the canvas-based field renderer
3. Implement player placement and route drawing
4. Add formation templates
5. Wire up Supabase for persistence
6. Deploy to Vercel
7. Get it in front of 3 coaches for feedback
