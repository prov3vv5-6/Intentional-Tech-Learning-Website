# Learning Resources Roadmap

A running list of the interactive learning resources for the Intentional Tech
Learning site. Each one is a self-contained, static page that shares the common
stylesheet (`styles.css`) and the sticky scoreboard + instant-feedback pattern.

## Built

- [x] **Icon Recognition** — `icons.html` — recognize the symbols across phones,
  tablets, and websites; self-scored G/Y/R quiz with difficulty modes.
- [x] **Touch Gestures** — `gestures.html` — practice tap, scroll, swipe, hold,
  double-tap, and pinch with auto-detection.

## Planned (priority order)

- [ ] **Spot the Scam (online safety)** — _building now_ — decide whether a text,
  email, pop-up, or call is **Safe** or a **Scam**, with feedback explaining the
  red flags. Highest real-world impact for seniors.
- [ ] **Tech Words Made Simple** — friendly glossary/quiz for confusing terms
  (browser, app, Wi-Fi, cloud, download vs. upload, the address bar).
- [ ] **Passwords & Account Safety** — spot weak vs. strong passwords, avoid
  reuse, understand password managers; interactive strength meter + do/don't quiz.
- [ ] **Video Call Basics** — join a call, mute/unmute, camera on/off. Also
  supports the coaching sessions, which run on Google Meet.

## More ideas (later)

- [ ] Using a web browser (address bar vs. search, tabs, back button, bookmarks)
- [ ] Email basics (reply vs. reply-all, attachments, spam folder)
- [ ] Managing photos (find, view, delete, share)
- [ ] Adjusting your screen (text size, zoom, brightness, dark mode)

---

### Adding a new resource

1. Create `<name>.html` (copy `gestures.html` or `icons.html` scaffolding) and, if
   it needs interactivity, `<name>.js`.
2. Reuse `styles.css` tokens; append a page-specific section if needed.
3. Add a `.resource-card` to `index.html` with an accent class (`rc-icons`,
   `rc-gestures`, or `rc-alt`) — the home grid reflows automatically.
4. Tick it off above.
