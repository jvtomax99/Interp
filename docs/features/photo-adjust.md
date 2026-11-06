# Adjust your photo

**Status: built 2026-11-06** (`features/photo-adjust.js`, styles in
`app.css`, "Adjust your photo"; test `tests/suites/photo-adjust.cjs`).

Jose, 2026-11-06: "We need the ability to adjust our profile picture. I
uploaded mine and it cut my face." The cause: `compressAvatarToBlob`
(`index.html`) saved the middle square of whatever was picked, so a tall
selfie lost its head or chin; the opening's badge then trims that square's
sides (a 66 x 86 slot).

## What it does

After you pick a photo of yourself in the name sheet (your initial at the
top right, then the round photo spot), **Adjust your photo** opens over it:

- Drag to move; pinch, the slider, or a mouse wheel to zoom (1x to 4x);
  arrow keys and + / - once the photo has focus. The photo always covers
  the frame (`paClamp`), so no empty edge can be saved.
- A tall photo starts a little above its middle (where faces are); a wide
  one in the middle.
- A white ring shows how Team Chat rounds it. Two live previews below:
  **Team Chat** (round, 56px) and **Your badge** (66 x 86, the square's
  middle, as the opening's badge shows it).
- **Save** draws exactly the square in the frame at 320 x 320 (JPEG .86,
  `PA_OUT`) and hands it to `uploadAvatar`, which uploads it as before;
  the name sheet's own Save then keeps it. **Cancel** or Escape: nothing
  uploaded, the photo you had stays.

`photoAdjust(file)` returns a Promise of the Blob, or null. Without it
(the file failed to load), `uploadAvatar` falls back to the middle square.

## Similar tools (from memory, not re-checked)

WhatsApp and iPhone Contacts: a circle over the photo, pinch and drag,
Choose / Cancel. Slack: a square box dragged over the photo. Ours also
shows the badge's tall shape, which the others don't have, and has a zoom
slider for one hand.

## Not in this version

- Re-adjusting a saved photo without picking it again (Jose's pick: the
  saved copy is only the 320 square, so the cut parts are gone; a full-size
  copy kept for that was the other option).
- Rotating, filters.
- Teammates', providers' or doctors' photos.
