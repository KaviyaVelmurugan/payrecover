# Security Policy

## Supported versions

PayRecover is currently an early-stage educational project. Security fixes are applied to the latest version on the `main` branch.

| Version | Supported |
| --- | --- |
| Latest `main` | Yes |
| Older commits or forks | No |

## Reporting a vulnerability

Please do not disclose security vulnerabilities in a public issue.

Use the repository's **Security** tab and select **Report a vulnerability** to submit a private report. If private vulnerability reporting is not yet enabled, open a public issue containing no exploit details and request a private communication channel.

Include, when possible:

- A clear description of the vulnerability and its potential impact.
- The affected route, component, or commit.
- Reproduction steps or a minimal proof of concept.
- Any suggested remediation.

You should receive an acknowledgement within seven days. Confirmed issues will be prioritized according to their severity, and reporters will be credited unless they prefer to remain anonymous.

## Security scope

The current application uses simulated payment outcomes and does not process real money. Never commit payment API keys, webhook secrets, customer payment credentials, or production data to this repository.
