import { ADDRESS_RE } from './format';

/** Returns an error message for the register form, or null when it's valid. */
export function validateMeterForm(form: {
  address: string;
  payout: string;
  capacityW: string;
}): string | null {
  if (!ADDRESS_RE.test(form.address)) {
    return 'Meter address must be a 0x address (the public address of the meter’s signing key).';
  }
  if (!ADDRESS_RE.test(form.payout)) return 'Payout wallet must be a 0x address.';
  const watts = Number(form.capacityW);
  if (!Number.isInteger(watts) || watts <= 0) {
    return 'Rated capacity must be a whole number of watts, for example 5000.';
  }
  return null;
}
