# Interpreter Hub HD icon asset plan

The website uses the approved enamel-pin artwork through `pin-icons.js`. The HD runtime asset keeps the existing icon mapping and layout intact; only the raster source resolution and rendering quality change.

## UI / utility artwork
- Hello → waving hand
- Home → house
- About → laptop with hearts
- Favorites → star
- Search → magnifying glass
- Settings → gear
- All Tools → four-color grid
- Locations → map pin
- Calendar → calendar
- Time & Conversions → clock
- Calculators → calculator
- Education → books
- Phrases / Chat → speech bubbles
- Medical Terminology → multilingual speech bubbles
- Spanish ↔ English → A/Z book
- Interpreter Resources → globe
- Notes → notepad
- Printables → printer
- Templates → folder
- References → chain link
- Training → graduation cap
- Self Care → mug
- Support → handshake with heart
- More → signpost

## Medical / clinical artwork
- Doctor → smiling doctor
- Cardiology → anatomical heart
- Pulmonology → lungs
- Neurology → brain
- Gastroenterology → stomach
- Nephrology → kidneys
- Hepatology → liver
- Orthopedics → bone
- Oncology / Hematology → ribbon
- OB/GYN → mother and baby
- Pediatrics → baby
- Emergency → Star of Life
- Surgery → surgeon
- Ophthalmology → eye
- ENT → ear
- Dental → tooth
- Dermatology → skin cross-section
- Psychiatry / Mental Health → profile with heart
- Rehabilitation → walking figure
- Geriatrics → older adult
- Infusion → IV bag
- Wound Care → bandages
- Infectious Disease → virus
- Lab Results → microscope
- Imaging → X-ray
- Procedures → clinical monitor
- Clinical Notes → checklist
- Medications → capsules
- Vaccines → syringe
- Blood Bank → blood drop
- Genetics → DNA
- Infection Control → medical shield
- Patient Rights → document with shield
- Legal / Ethics → scales

## Branding
Hackensack Meridian Health continues to use the repository's real `hmh-mark.png` symbol only. No generated HMH wordmark is used.

## Resolution rules
- The runtime HD sprite is 1024×1024, four times the width and height of the previous 256×256 sprite.
- Each 8×8 sprite cell is 128×128 source pixels and is displayed at roughly 23–34 CSS pixels, providing enough source resolution for high-density/Retina screens.
- High-quality Lanczos resampling plus light sharpening is applied to preserve edges, highlights, gold outlines, and small internal details when the icons are displayed smaller.
- Browser rendering uses `image-rendering: auto`; the site never stretches the HD cell beyond its source resolution.
- No badge, bubble, plate, or rounded background is added around the artwork.
