# Pin sheets (Soft studio 3D)

Jose's generated sheets from `docs/art/pin-prompts-soft-3d.md`, kept as the
source for `pins/<key>.webp`. Not deployed (`docs` is in `.vercelignore`).

Cut one sheet into pins (192 px, pin fills 176 px, soft navy shadow):

```
python3 docs/art/pin-sheets/cutsheet.py docs/art/pin-sheets/sheet-1.png 4 3 \
  cardiology,neurology,pulmonology,nephrology,ophthalmology,ent,endocrinology,urology,orthopedics,hematology,infectious-disease,genetics \
  /tmp/pins-out
```

The sheets come with a see-through haze around each pin; the script keeps
only the solid pin (alpha 150 to 235 ramps in) and adds its own shadow.

| Sheet | Status |
|---|---|
| 1 (12 organs) | Received 2026-11-03, cuts checked on Home |
| 2 (12 specialties) | Received 2026-11-03, cut clean. Teddy bear and surgeon came out with blank faces: redone in sheet 4 |
| 3 | Waiting |
| 4 | Waiting |
