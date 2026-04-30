# A11y Manual Testing Runbook

Automated axe scans catch ~57% of WCAG issues. This runbook covers the remainder —
screen reader, keyboard, zoom, contrast, and motion — for each release.

## Prerequisites

- macOS with Safari / VoiceOver (built-in)
- Windows VM with Chrome / NVDA (free download from nvaccess.org)
- iOS device or Simulator with VoiceOver enabled
- Android device or Emulator with TalkBack enabled

---

## 1. Keyboard-only smoke test (all platforms)

Goal: every action is reachable and operable without a mouse.

**Setup:** Open Chrome, disable mouse cursor (`Tab` key only).

| Step | Pass criteria |
|---|---|
| Press `Tab` from a fresh page load | First focus is the **Skip to main content** link |
| Activate skip link (`Enter`) | Focus jumps to `#main-content`, bypassing nav |
| Tab through sidebar nav items | Each nav item receives visible focus ring |
| Press `Enter` on a nav item | Page changes; focus lands inside new page |
| Press `⌘K` / `Ctrl+K` | Command palette opens; search input is focused |
| Arrow-key navigate results | Selected item changes; `aria-activedescendant` updates |
| Press `Escape` | Palette closes; focus returns to previously focused element |
| Open Settings > Models > Manage (a provider) | Drawer opens; focus moves inside |
| Press `Tab` inside drawer | Focus is trapped — cannot escape to behind-drawer content |
| Press `Escape` or click Close | Drawer closes; focus returns to the Manage button |
| Open any ConfirmDialog | Dialog opens with `role=alertdialog`; Cancel and Confirm are Tab-reachable |
| Type in ChatComposer textarea | Text appears; `Enter` submits; `Shift+Enter` inserts newline |
| Open Settings tabs | Arrow keys navigate between tabs (`role=tab`) |
| Resize browser to 390 px wide | Hamburger button is Tab-reachable; activating it opens mobile nav |

---

## 2. Screen reader: macOS VoiceOver + Safari

**Setup:** System Preferences > Accessibility > VoiceOver: on. Use `VO = Ctrl+Option`.

| Step | Pass criteria |
|---|---|
| Load the app | VoiceOver announces page title |
| `VO+U` to open the Rotor | Shows Headings, Landmarks (header, main, nav) |
| Navigate by heading (`VO+Cmd+H`) | Logical heading hierarchy (no jumps from h1 to h3) |
| Navigate by landmark | `main` region exists; `nav Main navigation` exists |
| Focus ThemeToggle | Reads "Switch to dark mode, button" (or light) |
| Activate ThemeToggle | Reads "Switch to light mode" — label updates |
| Focus a StatusPill | Reads "Status: connected" (or relevant status) |
| Focus ChatComposer | "Chat message composer, form" announced; textarea reads "Message" |
| Type and submit | VoiceOver reads new assistant message via live region |
| Focus HermesAvatar | Reads "Hermes, image" |
| Streaming response | New tokens announced via `aria-live="polite"` without interrupting |
| Open CommandPalette | "Command palette, dialog" announced; search field focused |
| Type a query | Result count announced ("5 results") |
| Arrow to item | Reads item label and shortcut if present |
| Gateway banner (offline mode) | Banner read immediately as `role=alert` |

---

## 3. Screen reader: Windows NVDA + Chrome

**Setup:** Install NVDA, open Chrome, enable NVDA's browse mode (default).

Repeat all VoiceOver checks above. Additional Chrome-specific:
- Links list (`NVDA+F7`) — verify no duplicate/ambiguous link text
- Form mode: check that all inputs have labels announced before the input itself
- Status messages: press `F6` to jump between landmarks

---

## 4. iOS VoiceOver + Safari

**Setup:** Settings > Accessibility > VoiceOver: on. Swipe to navigate.

| Step | Pass criteria |
|---|---|
| Swipe to hamburger menu | "Open navigation, button" read |
| Activate | Drawer opens; focus moves into drawer |
| Swipe through nav items | Each item labelled, current page marked with "selected" |
| Close drawer | Focus returns to hamburger |
| Landscape orientation | No content clipped; reflow works at all orientations |
| Mobile ChatComposer | Textarea and Send button focusable |

---

## 5. Android TalkBack + Chrome

**Setup:** Settings > Accessibility > TalkBack: on.

Repeat iOS VoiceOver checks for Android patterns.

---

## 6. Zoom & reflow (all browsers)

| Scenario | Pass criteria |
|---|---|
| 200% browser zoom (desktop) | All content visible without horizontal scroll |
| 400% zoom (WCAG 1.4.10 Reflow) | Content reflows to single column; no loss of functionality |
| 200% text-only zoom (Firefox about:config `layout.css.devPixelsPerPx`) | No text truncation; containers expand |
| iOS pinch-zoom | Content not locked; page zooms |

---

## 7. Colour contrast

Run the automated axe colour-contrast scan in both light and dark themes via:

```bash
pnpm exec playwright test --project=a11y-desktop --project=a11y-dark
```

Additional manual checks:

| Scenario | Target |
|---|---|
| Body text on page background | ≥ 4.5:1 (AA) |
| Large text (≥ 18pt / 14pt bold) | ≥ 3:1 (AA) |
| StatusPill dot (decorative) | Not tested — purely decorative |
| Focus outline vs adjacent background | ≥ 3:1 (WCAG 2.2 2.4.11) |
| ThemeToggle icon | ≥ 3:1 against button bg |
| Approval card category badge text | ≥ 4.5:1 |
| `--text-muted` on `--surface-elevated` | ≥ 3:1 for UI components |

Measure with [paciellogroup/colour-contrast-analyser](https://www.tpgi.com/color-contrast-checker/) or browser DevTools contrast inspector.

---

## 8. Reduced motion

```css
@media (prefers-reduced-motion: reduce) { … }
```

| Scenario | Pass criteria |
|---|---|
| Typewriter animation in streaming responses | Static text, no animation |
| Status dot pulse animation | No pulse animation |
| Drawer / dialog open/close | Instant or minimal (< 100ms) |
| Tab transitions | No slide animations |
| Hold-progress bar in ApprovalCard | Fills instantly or no animation |

Test by enabling "Reduce Motion" in macOS System Preferences > Accessibility > Display.

---

## 9. Forced colors / Windows high-contrast

In Chrome DevTools: Rendering > Emulate CSS media feature `forced-colors: active`.

| Scenario | Pass criteria |
|---|---|
| All text visible | No text disappears |
| Focus rings visible | Focus rings respect `ButtonText` / `Highlight` system colors |
| Status badges | Color is not the only differentiator — text label also present |
| Icons | Visible (icons use `currentColor` strokes) |

---

## 10. Cognitive / motion

| Scenario | Pass criteria |
|---|---|
| No content auto-updates unexpectedly | Streaming is user-initiated |
| Session timeout / expiry | Not applicable (local app) |
| Consistent navigation | Sidebar order is the same on all pages |
| Error identification | Form errors state what is wrong (not just highlighted) |

---

## Release gate

Before shipping, all checks in sections 1–3 must pass. Sections 4–5 (native mobile) at
a minimum require sections 4.1–4.5 (nav + composer). Sections 6–10 are recommended.

File failures as GitHub issues labelled `a11y` and block ship on any WCAG 2.2 AA
violation (critical or serious per axe impact levels).
