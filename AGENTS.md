# Architecture rules

- Reuse `FanpageInboxWidget` for both Utilities and the admin sidebar module so Facebook inbox behavior has one implementation.
- Keep Fanpage inbox conversation and message history paged in document flow with the reply composer above history; this avoids nested scrolling and keeps replies visible on mobile and desktop.
- Reconcile Facebook inbox via webhook Realtime first and periodic sync as fallback; Meta may delay or miss webhook delivery and browsers require user interaction for sound alerts.
- Apply Meta's 24-hour Messenger response window server-side, using HUMAN_AGENT only within seven days when authorized; Meta rejects older replies regardless of UI state.