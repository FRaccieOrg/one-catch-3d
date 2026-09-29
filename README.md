# One Catch Company — Three.js Design v3

This package now contains the **actual uploaded 24-9-2026 OBJ and MTL**, so the viewer no longer depends on manually selecting a model.

## What changed

- Bundled `assets/model/24-9-2026.obj`
- Bundled `assets/model/24-9-2026.mtl`
- OBJ loads automatically when the viewer starts
- The original OBJ scale is preserved (the scan is roughly 16.75 m × 23.03 m × 2.78 m)
- The principal retail design volume is mapped directly into the uploaded OBJ coordinate system
- One Catch Company architectural design is a separate overlay
- No retail furniture is included

## MTL textures

The MTL references five JPG textures, but those JPG files were not uploaded. Neutral fallback JPGs are included under `assets/model/textures/` so the scan can always load without 404s.

The scan is hidden by default because the original scan contains the existing/demolition-state visual noise. Enable **Show scan model** to verify alignment.

## One Catch design included

- Warm Ivory large-format floor
- Obsidian suspended ceiling
- Warm architectural track lighting
- perimeter indirect warm LED
- antique-gold detailing
- bronze vertical slats
- black-stone feature surfaces
- One Catch Company branding feature
- front glass façade treatment
- design treatment of the long internal partition visible in the OBJ
- Play Area architectural lighting only — no tables or chairs yet

## Corrected plan anchors

- Entrance: bottom-right `ENTREE`
- Toilet: first green cross
- Safe: green cross inside the orange highlighted area
- Zone 3: Play Area

The marker layer is hidden by default and can be enabled in the viewer.

## Run on Windows

Double-click `START_SERVER.bat`, or:

```powershell
cd one-catch-threejs-design-v3
py -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

Internet access is required for the Three.js library itself because this source uses the official ES-module build from unpkg.

## Important

This pass deliberately does **not** include:
- vitrines
- counters
- retail cabinets
- Play Area tables/chairs
- raw card bins
- slab displays

Those should only be added after the architectural design/alignment is approved.
