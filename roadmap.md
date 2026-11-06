# Tasks

- [ ] Complete Stock Market utility: repair verified live market-data sources and test the edge proxy; add missing labels in vi/en/zh/ja.

- [x] Make Fanpage replies accessible without scrolling through the full conversation on desktop and mobile.
- [x] Notify incoming messages through Realtime with sound and a sync fallback.
- [x] Handle old Messenger replies within Meta's permitted window; block expired replies with a clear explanation.
- [x] Rebuild the Fanpage inbox as a viewport-contained Messenger layout with a pinned composer on desktop and mobile.
- [x] Move page assignment and deletion into a dedicated management dialog with explicit delete confirmation.
- [ ] Verify live delivery and HUMAN_AGENT permission with an authenticated admin account and real Facebook message (requires authenticated access and Meta approval).
- [x] Maximize the Messenger reply window (HUMAN_AGENT retry, precise permission guidance) so replies do not silently stop after 24h.
- [x] Add message deletion synced with Facebook (Graph delete for page-moderable comments, plus local row removal) in the inbox UI.
- [ ] Apply for the HUMAN_AGENT permission in Meta App Review to unlock 24h–7 day replies (requires the user's Meta developer account; beyond 7 days Meta blocks all replies).- [x] Store AI chat sessions and messages in ai_chat_sessions/ai_chat_messages with contact extraction (working, verified end-to-end via live chat test).
- [x] Add "Chat AI" module to the admin sidebar with a Messenger-style inbox (realtime, sound alerts, unread badges, contact copy).
- [ ] Send the thank-you email when a customer leaves an email — blocked: Gmail rejects SMTP_USER/SMTP_PASS (535 BadCredentials); needs a new Gmail App Password from the user.
