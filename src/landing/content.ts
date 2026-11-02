// Static copy for the landing page sections.

export const APP_URL = './app/';

export const TICKER = [
  ['SIGNED AT THE METER', ''],
  ['EIP-712 READINGS', '#F2B33D'],
  ['CAPACITY GUARD', ''],
  ['150M REWARD VAULT', '#6FD6E8'],
  ['HALVING / 365 DAYS', ''],
  ['AI AGENTS PAY FOR DATA', '#E6F7F2'],
  ['50% BACK TO PRODUCERS', '#F2B33D'],
  ['30% BURNED', '#FF8A6B'],
  ['0% TAX', ''],
  ['NOTHING TO CLAIM', '#B79CFF'],
] as const;

export const ENGINES = [
  {
    tag: 'REGISTRY',
    kicker: 'METERS',
    name: 'Meter registry',
    color: '#6FD6E8',
    glow: 'cyan',
    d: 'Every device has its own key, a rated capacity and a payout wallet fixed at registration.',
    points: [
      'One signing key per meter, ideally in a secure element',
      'Capacity caps what any reading can claim',
      'Compromised keys revoked for good',
    ],
  },
  {
    tag: 'VAULT',
    kicker: 'REWARDS',
    name: 'Reward vault',
    color: '#F2B33D',
    glow: 'amber',
    d: '150M $GRID held by the contract, never a team wallet. Paid per verified kWh.',
    points: [
      '1 $GRID per kWh at launch, halving yearly',
      'At most 1.5M paid in any 7-day epoch',
      'Refilled by agent payments via recycle()',
    ],
  },
  {
    tag: 'MARKET',
    kicker: 'AI AGENTS',
    name: 'Data market',
    color: '#E6F7F2',
    glow: 'violet',
    d: 'Agents buy access to the verified data with $GRID. The payment is split on the spot.',
    points: [
      '50% back to producers, 30% burned, 20% treasury',
      'Producer share can never drop below 40%',
      'Access tracked per agent wallet',
    ],
  },
  {
    tag: 'RAILS',
    kicker: 'SAFETY',
    name: 'Safety rails',
    color: '#FF8A6B',
    glow: 'coral',
    d: 'Guard rails that can stop bad readings without ever trapping anyone’s rewards.',
    points: [
      'Pause switch and two-step ownership',
      'Rewards keep flowing if ownership is renounced',
      'Gateway rejects bad readings before gas is spent',
    ],
  },
];

export const METER_KINDS = [
  {
    letter: 'A',
    name: 'Rooftop solar',
    rewarded: true,
    color: '#F2B33D',
    lines: [
      'Homes, schools, small business',
      'Inverter or meter signs readings',
      'Paid per kWh generated',
    ],
  },
  {
    letter: 'B',
    name: 'Wind',
    rewarded: true,
    color: '#6FD6E8',
    lines: ['Farm and community turbines', 'Capacity from the nameplate', 'Paid per kWh generated'],
  },
  {
    letter: 'C',
    name: 'Microgrids',
    rewarded: true,
    color: '#7BE0A6',
    lines: ['Many arrays, one operator', 'One key per metering point', 'Separate payout per meter'],
  },
  {
    letter: 'D',
    name: 'Battery storage',
    rewarded: false,
    color: '#B79CFF',
    lines: [
      'Signed discharge readings',
      'Shown live on the grid',
      'Not rewarded, no double counts',
    ],
  },
  {
    letter: 'E',
    name: 'EV charging',
    rewarded: false,
    color: '#FF8A6B',
    lines: [
      'Depot and public chargers',
      'Signed delivery readings',
      'Tracked as load, not rewarded',
    ],
  },
];

export const PARAMS = [
  {
    k: 'signature',
    t: 'Signed or rejected.',
    d: 'EIP-712, bound to the chain and contract. Change one field and it fails.',
  },
  {
    k: 'periodStart',
    t: 'No replays.',
    d: 'Each reading must start after the meter’s last accepted one.',
  },
  {
    k: 'capacityW',
    t: 'Physically possible.',
    d: 'Energy can’t exceed rated watts multiplied by the period’s length.',
  },
  {
    k: 'payout',
    t: 'Fixed destination.',
    d: 'Rewards go to the registered wallet, never one the relayer picks.',
  },
  {
    k: 'epochBudget',
    t: 'Paced emissions.',
    d: 'A weekly cap stops any week, or any operator, from draining the vault.',
  },
];

export const AGENT_STEPS = [
  ['01', 'Agent signs a request', 'Its wallet signs method, path and time. No API key.'],
  ['02', 'No plan? 402', 'The gateway answers Payment Required with the market address.'],
  ['03', 'Buys a plan on-chain', 'GRID is split 50/30/20 in the same transaction.'],
  ['04', 'Data flows', 'Verified readings, aggregates and a live stream.'],
] as const;

export const AGENT_KINDS = [
  {
    name: 'Trading bots',
    endpoint: 'GET /data/stream',
    d: 'Read live generation across the network to anticipate grid and energy-market moves.',
  },
  {
    name: 'Climate models',
    endpoint: 'GET /data/aggregates',
    d: 'Train and calibrate on metered output instead of satellite estimates.',
  },
  {
    name: 'Carbon accountants',
    endpoint: 'GET /data/readings',
    d: 'Trace every kWh to a signed reading and an on-chain transaction.',
  },
];

export const LAYERS = [
  {
    id: 'L4',
    name: 'ACCESS',
    border: 'rgba(255,255,255,0.09)',
    bg: '#11151B',
    boxes: [
      ['3D dashboard', 'grid · agents · wallet'],
      ['Agent SDK', 'signed requests · plans'],
      ['Firmware SDK', 'signTypedData()'],
      ['Wallets', 'EIP-1193 on Base'],
    ],
  },
  {
    id: 'L3',
    name: 'GATEWAY',
    border: 'rgba(111,214,232,0.28)',
    bg: 'rgba(111,214,232,0.05)',
    boxes: [
      ['Ingest webhook', 'POST /ingest/readings'],
      ['Data API', 'readings · aggregates · stream'],
      ['Relayer', 'pays gas, holds no GRID'],
    ],
  },
  {
    id: 'L2',
    name: 'CONTRACTS',
    border: 'rgba(242,179,61,0.35)',
    bg: 'rgba(242,179,61,0.06)',
    boxes: [
      ['EnergyRewards', 'registry · checks · vault'],
      ['DataMarket', 'plans · 50/30/20 split'],
      ['GridToken', 'fixed 1B ERC-20'],
      ['VestingWallet', '12-month treasury'],
    ],
  },
  {
    id: 'L1',
    name: 'CHAIN',
    border: 'rgba(183,156,255,0.3)',
    bg: 'rgba(183,156,255,0.05)',
    boxes: [
      ['Base', 'low-fee EVM settlement'],
      ['EIP-712', 'typed, chain-bound signatures'],
      ['ERC-20', 'standard, tax-free'],
    ],
  },
] as const;

export const FUNCTIONS = [
  {
    sig: 'submitReading()',
    t: 'Verify and pay',
    d: 'Checks signature, ordering and capacity, then pays the meter’s wallet in one call.',
    color: '#F2B33D',
  },
  {
    sig: 'registerMeter()',
    t: 'Add a device',
    d: 'A device key with its rated watts. Readings only count from this moment on.',
    color: '#6FD6E8',
  },
  {
    sig: 'revokeMeter()',
    t: 'Kill a bad key',
    d: 'Shuts off a compromised key for good. It can never be registered again.',
    color: '#FF8A6B',
  },
  {
    sig: 'setPayout()',
    t: 'Your wallet, your call',
    d: 'Only the current payout wallet can move future rewards somewhere else.',
    color: '#B79CFF',
  },
  {
    sig: 'subscribe()',
    t: 'Agents buy data',
    d: 'Pays for a plan and splits the GRID to producers, burn and treasury.',
    color: '#E6F7F2',
  },
  {
    sig: 'recycle()',
    t: 'Refill the vault',
    d: 'Moves GRID into the vault and raises its cap, so agent money pays future readings.',
    color: '#F2B33D',
  },
  {
    sig: 'currentRatePerKWh()',
    t: 'Halving schedule',
    d: 'Starts at 1 $GRID per kWh and halves every 365 days.',
    color: '#7BE0A6',
  },
  {
    sig: 'remainingInEpoch()',
    t: 'Weekly budget',
    d: 'What’s left of this week’s emissions, readable by anyone.',
    color: '#ECEEF5',
  },
];

export const ALLOCATION = [
  { pct: 60, label: 'Fair-launch bonding curve. No presale.', bar: '#ECEEF5', text: '#ECEEF5' },
  { pct: 20, label: 'Liquidity at graduation, LP tokens locked.', bar: '#4A5568', text: '#8D97AB' },
  { pct: 15, label: 'Meter rewards, held by the contract.', bar: '#F2B33D', text: '#F2B33D' },
  { pct: 5, label: 'Treasury, vesting over 12 months.', bar: '#B79CFF', text: '#B79CFF' },
];

export const CONTRACTS = [
  { name: 'GridToken', role: 'ERC-20, 1B fixed supply' },
  { name: 'EnergyRewards', role: 'Meter registry and 150M reward vault' },
  { name: 'DataMarket', role: 'Agent data plans, 50/30/20 split' },
  { name: 'VestingWallet', role: '50M treasury, 12-month linear vesting' },
];

export const FAQS = [
  [
    'Why would anyone need $GRID?',
    'AI agents need it to buy EcoGrid’s verified energy data. Each plan is paid in $GRID on the DataMarket contract, and that spending is split: half back to producers, 30% burned, 20% to the treasury.',
  ],
  [
    'What do AI agents get for their $GRID?',
    'Signed, capacity-checked energy readings from real meters: a filtered feed, time-series aggregates, the meter registry and a live stream. Requests are signed by the agent’s wallet, so there are no API keys to leak.',
  ],
  [
    'Is $GRID a carbon credit?',
    'No. $GRID rewards verified energy reporting and pays for data. EcoGrid does not issue carbon credits or offsets.',
  ],
  [
    'Do producers have to claim rewards?',
    'No. When a reading is accepted, the contract transfers $GRID straight to the meter’s payout wallet in the same transaction.',
  ],
  [
    'What stops fake readings?',
    'Each reading must be signed by a registered meter key, can’t overlap an earlier one, and can’t exceed the meter’s rated capacity. A tampered device can still lie within its capacity, which is why keys can be revoked and secure-element hardware is on the roadmap.',
  ],
  [
    'Can EcoGrid redirect my payouts?',
    'No. The payout wallet is stored per meter on-chain, and only that wallet can change it.',
  ],
  [
    'What happens when the weekly budget runs out?',
    'Readings are still recorded but pay nothing until the next 7-day epoch, so no single week or operator can drain the vault.',
  ],
  [
    'Has the code been audited?',
    'Not yet. The contracts and gateway have public test suites, and an independent audit happens before mainnet.',
  ],
] as const;
