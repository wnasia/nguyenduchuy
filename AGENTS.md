# Architecture rules

- Reuse `FanpageInboxWidget` for both Utilities and the admin sidebar module so Facebook inbox behavior has one implementation.
- Fanpage inbox mimics Messenger: fixed-height two-column layout, conversation list and message history scroll inside their panels, and the reply composer is pinned at the bottom below history — never above it.
- Reconcile Facebook inbox via webhook Realtime first and periodic sync as fallback; Meta may delay or miss webhook delivery and browsers require user interaction for sound alerts.
- Apply Meta's 24-hour Messenger response window server-side, using HUMAN_AGENT only within seven days when authorized; Meta rejects older replies regardless of UI state.