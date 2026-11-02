# Security policy

EcoGrid handles wallets and token rewards, so we take reports seriously.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Instead, use GitHub's
private reporting: go to the **Security** tab of this repository and choose
**Report a vulnerability**. Include steps to reproduce and the impact you expect.

You should get a reply within a few days. Please give us a reasonable chance to fix
the issue before disclosing it publicly.

## Scope

- This repository: the landing page and the dashboard (wallet connection, gateway client).
- The dashboard never asks for a private key or seed phrase. Anything that does is not EcoGrid.
- The admin token field in "Register meter" is sent only with that request and never stored.

## Status

The smart contracts and gateway are not yet published or audited. Do not send real funds to
any address until the contract addresses are listed on the official site.
