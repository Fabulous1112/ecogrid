import { formatGrid, REJECTION_TEXT, weiToGrid } from './format';
import type { Activity } from './types';

/** One-line, plain-language description of an activity entry. */
export function describeActivity(a: Activity): string {
  switch (a.type) {
    case 'reading.accepted': {
      const wh = Number(a.energyWh);
      const energy = wh >= 1000 ? `${(wh / 1000).toFixed(2)} kWh` : `${wh} Wh`;
      return a.onchain
        ? `${energy} logged, ${formatGrid(weiToGrid(a.rewardWei))} GRID paid`
        : `${energy} logged`;
    }
    case 'reading.rejected':
      return `Rejected: ${REJECTION_TEXT[a.code] ?? a.code}`;
    case 'agent.subscribed':
      return `Bought ${a.plan || 'a'} data plan, ${formatGrid(weiToGrid(a.paidWei))} GRID (${formatGrid(weiToGrid(a.recycledWei))} to producers)`;
    case 'meter.registered':
      return 'Meter registered';
    case 'meter.revoked':
      return 'Meter revoked';
  }
}
