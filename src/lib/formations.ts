import type { Formation, Player } from '@/types';

// Helper: generate offensive line at standard positions
function oLine(losY: number): Player[] {
  return [
    { id: 'lt', position: 'LT', label: 'LT', location: { x: 310, y: losY }, side: 'offense' },
    { id: 'lg', position: 'LG', label: 'LG', location: { x: 350, y: losY }, side: 'offense' },
    { id: 'c', position: 'C', label: 'C', location: { x: 400, y: losY }, side: 'offense' },
    { id: 'rg', position: 'RG', label: 'RG', location: { x: 450, y: losY }, side: 'offense' },
    { id: 'rt', position: 'RT', label: 'RT', location: { x: 490, y: losY }, side: 'offense' },
  ];
}

const LOS_Y = 248;

export const BUILT_IN_FORMATIONS: Formation[] = [
  {
    id: 'builtin-singleback',
    name: 'Singleback',
    side: 'offense',
    personnel: '11',
    tags: ['base', 'pass', 'run'],
    isCustom: false,
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      ...oLine(LOS_Y),
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 330 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: LOS_Y }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: LOS_Y }, side: 'offense' },
      { id: 'h', position: 'WR', label: 'H', location: { x: 580, y: LOS_Y }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 520, y: LOS_Y }, side: 'offense' },
    ],
  },
  {
    id: 'builtin-iform',
    name: 'I-Form',
    side: 'offense',
    personnel: '21',
    tags: ['base', 'run', 'power'],
    isCustom: false,
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      ...oLine(LOS_Y),
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 280 }, side: 'offense' },
      { id: 'fb', position: 'FB', label: 'FB', location: { x: 400, y: 315 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 350 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: LOS_Y }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: LOS_Y }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 520, y: LOS_Y }, side: 'offense' },
    ],
  },
  {
    id: 'builtin-shotgun',
    name: 'Shotgun',
    side: 'offense',
    personnel: '11',
    tags: ['base', 'pass', 'spread'],
    isCustom: false,
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      ...oLine(LOS_Y),
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 310 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 360, y: 310 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: LOS_Y }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: LOS_Y }, side: 'offense' },
      { id: 'h', position: 'WR', label: 'H', location: { x: 600, y: LOS_Y }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 520, y: LOS_Y }, side: 'offense' },
    ],
  },
  {
    id: 'builtin-pistol',
    name: 'Pistol',
    side: 'offense',
    personnel: '11',
    tags: ['base', 'run', 'pass'],
    isCustom: false,
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      ...oLine(LOS_Y),
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 290 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 400, y: 340 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: LOS_Y }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 680, y: LOS_Y }, side: 'offense' },
      { id: 'h', position: 'WR', label: 'H', location: { x: 600, y: LOS_Y }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 520, y: LOS_Y }, side: 'offense' },
    ],
  },
  {
    id: 'builtin-empty',
    name: 'Empty',
    side: 'offense',
    personnel: '10',
    tags: ['pass', 'spread', 'empty'],
    isCustom: false,
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      ...oLine(LOS_Y),
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 310 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 60, y: LOS_Y }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 700, y: LOS_Y }, side: 'offense' },
      { id: 'h', position: 'WR', label: 'H', location: { x: 600, y: LOS_Y }, side: 'offense' },
      { id: 'f', position: 'WR', label: 'F', location: { x: 160, y: LOS_Y }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 520, y: LOS_Y }, side: 'offense' },
    ],
  },
  {
    id: 'builtin-trips',
    name: 'Trips',
    side: 'offense',
    personnel: '11',
    tags: ['pass', 'spread', 'trips'],
    isCustom: false,
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      ...oLine(LOS_Y),
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 310 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 360, y: 310 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: LOS_Y }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 700, y: LOS_Y }, side: 'offense' },
      { id: 'h', position: 'WR', label: 'H', location: { x: 620, y: LOS_Y }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 540, y: LOS_Y }, side: 'offense' },
    ],
  },
  {
    id: 'builtin-bunch',
    name: 'Bunch',
    side: 'offense',
    personnel: '11',
    tags: ['pass', 'bunch', 'concepts'],
    isCustom: false,
    teamId: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    players: [
      ...oLine(LOS_Y),
      { id: 'qb', position: 'QB', label: 'QB', location: { x: 400, y: 310 }, side: 'offense' },
      { id: 'rb', position: 'RB', label: 'RB', location: { x: 360, y: 310 }, side: 'offense' },
      { id: 'x', position: 'WR', label: 'X', location: { x: 80, y: LOS_Y }, side: 'offense' },
      { id: 'z', position: 'WR', label: 'Z', location: { x: 650, y: LOS_Y }, side: 'offense' },
      { id: 'h', position: 'WR', label: 'H', location: { x: 630, y: 270 }, side: 'offense' },
      { id: 'te', position: 'TE', label: 'Y', location: { x: 610, y: LOS_Y }, side: 'offense' },
    ],
  },
];

export function getBuiltInFormation(id: string): Formation | undefined {
  return BUILT_IN_FORMATIONS.find((f) => f.id === id);
}

export function getAllBuiltInFormations(): Formation[] {
  return [...BUILT_IN_FORMATIONS];
}
