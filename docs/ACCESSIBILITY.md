# Accessibility contract

Accessibility is part of lesson behavior, not a separate skin.

## Presentation

- The visual-comfort lab uses real course content and is always available again.
- Every theme must pass WCAG 2.2 AA contrast. The high-contrast profiles target AAA
  text contrast.
- Text reflows at a 320-pixel viewport even at the maximum 250% in-app text size,
  without horizontal reading.
- Font, size, weight, line height, letter spacing, word spacing, and reading width
  are independent controls.
- `prefers-reduced-motion`, forced colors, browser zoom, and system light/dark
  preferences are respected.
- No score, state, correction, or navigation cue depends only on hue.

## Media

- Adaptive playback renders semantic HTML in the active theme.
- Every visual statement is also present in narration or the descriptive transcript.
- Rendered videos carry WebVTT captions; the full transcript is always adjacent.
- No background music competes with speech.

## Interaction

- The entire application is keyboard operable with visible focus.
- Ordering questions support choose/remove and explicit left/right movement.
- Touch targets are at least 44 CSS pixels where space permits.
- Status changes use text and live regions rather than color alone.
- Microphone denial never blocks lesson or assessment completion.

Automated axe and reflow checks are necessary but not sufficient. New components
must also be reviewed with keyboard-only navigation, browser zoom, reduced motion,
and at least one light and one dark high-contrast profile.
