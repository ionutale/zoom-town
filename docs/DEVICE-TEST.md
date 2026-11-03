# Device test — iPhone

A five-minute pass that covers what no emulator can: thumb feel, speaker audio,
a real Add to Home Screen, and service-worker behaviour on a cold launch.

Do this after any change to input, speed, laps, audio, or the service worker.

**URL:** https://zoom-town.aiu-media.com
**Record:** iOS version, iPhone model, whether the app was already installed, and
which step failed. A screen recording beats a description.

## 0. Before you start

- [ ] Note the iOS version (Settings → General → About) and the model.
- [ ] Decide the case you are testing:
  - **Fresh** — app removed from the home screen (long-press icon → Remove App).
  - **Upgrade** — the app is still installed from an older build. This is the
    one that matters for the service-worker fix.

## 1. Install (fresh only)

- [ ] Open the URL in **Safari** (not Chrome, not an in-app browser).
- [ ] The install banner appears on the first screen; "Installa Zoom Town" opens
      Share → Add to Home Screen → Add.
- [ ] The home-screen icon shows the blue car and balloon, not a blank square.
- [ ] Launching it opens full screen: no Safari bars, portrait, correct title.

## 2. Cold launch and offline

- [ ] Force-quit the app (swipe up), launch again. It must reach the profile
      picker without a reload flash.
- [ ] Turn on Airplane Mode, force-quit, launch again.
      **Pass:** profile picker appears. **Fail:** blank, black, or the recovery
      card. If you see the card, record the small grey detail line under it.
- [ ] Airplane Mode off. Reload. Normal.

**Upgrade case:** the first launch after this build may show one brief reload —
that is the legacy worker clearing old caches. It must land on the profile
picker, and the second launch must be instant. More than one reload, or a black
screen, is a failure.

## 3. Assisted mode (default)

- [ ] Pick a profile, pick **Dino Valley**, press GO.
- [ ] Countdown 3-2-1-GO, then the car drives itself while you steer with the two
      big arrows. Left arrow turns left, right turns right.
- [ ] Speedometer reads about **41 km/h** on a clear straight.
- [ ] Three lap pips at the top; the race keeps going on lap 1 and 2 after
      collecting balloons.
- [ ] Hold into the wall for two seconds: the **AUTO** badge appears and the car
      straightens itself out.
- [ ] Collect balloons, tap boost, hear the whoosh.
- [ ] Finish lap 3: confetti, stars, balloon count out of **15**, trophy/`NEW`
      car if earned.
- [ ] Play again and go home; both buttons work.

## 4. Advanced mode

- [ ] Settings → **Avanzata** on. The arrows disappear and a drag bar appears at
      the bottom.
- [ ] Drag left → car goes left. Drag right → car goes right. Lift → goes straight.
      A short 5–10 px drag does nothing (dead zone).
- [ ] No **AUTO** badge ever appears, even after sitting against a wall.
- [ ] On a clean straight the speedometer climbs past 41 and settles at
      **50**, nudging **52** after a couple of seconds. Hitting a wall drops it to
      about **32**, then it climbs back.
- [ ] Boost briefly reads near **60**.
- [ ] Drag while paused / during countdown does nothing.

## 5. Audio

- [ ] On the profile screen, the Italian or English voice is audible and clear.
- [ ] Music loops without a click at the seam.
- [ ] Balloon pop, boost, bump, rail scrape all distinct.
- [ ] Speaker volume at 50%: nothing clips or hisses.
- [ ] Mute in the pause menu silences everything and survives relaunch.

## 6. Layout and system

- [ ] Nothing hides under the notch, the home indicator, or the rounded corners.
- [ ] Rotating the phone shows "Mettimi in verticale"; rotating back resumes.
- [ ] Screen does not dim during a race (wake lock), and dims normally after
      leaving the app.
- [ ] Pause → Resume, Restart, Home, Tutorial replay all work.
- [ ] Tutorial can be skipped, and the first step says "trascina" when Advanced
      is on.

## 7. Feel (the only subjective part)

- [ ] 0–41 km/h takes about two seconds and feels quick, not twitchy.
- [ ] Steering at 41 km/h is controllable with one thumb; no sawing.
- [ ] Advanced at 50 km/h is noticeably faster but still fair in corners.
- [ ] After five minutes: no stutter, phone warm but not hot, battery drop normal.

## If something fails

Attach: step number, screenshot or recording, iOS version, fresh-vs-upgrade.

For a boot problem, also connect the iPhone to the Mac and use
**Safari → Develop → [iPhone] → Zoom Town**:

- **Console** — copy the first red error.
- **Storage → Service Workers** — note the script URL
  (`/service-worker.js` is current, `/sw.js` is the legacy bridge) and the cache
  name (`zoom-town-<build>`).
- **Storage → Cache Storage** — confirm entries exist for `/_app/…`.

Send that and the recovery-card detail line; both point straight at the failing
layer.
