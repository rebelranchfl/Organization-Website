# RRA-2026-0001 Generated Visual Asset Intake

This directory is the required intake point for finished image-generation assets used by Water Through the Layers Visual Production.

The GitHub coding worker is integration/QA only. It is not authorized to substitute SVG/CSS wireframes, rectangle diagrams, or generic box charts for physical-system imagery that requires an image-generation model.

## Required manifest

Create `asset-manifest.json` in this directory only when at least one finished generated asset has been placed here. The manifest must use this shape:

```json
{
  "pipeline": "IMAGE_GENERATION",
  "project_id": "RRA-2026-0001",
  "assets": [
    {
      "file": "water-filtration-barrel-cutaway.png",
      "purpose": "55-gallon layered filtration physical-system visual",
      "approved_for_integration": true
    }
  ]
}
```

Every listed file must physically exist in this directory before the Academy integration runner can proceed.

## First required asset

A finished educational physical-system image for the layered filtration lesson showing a recognizable bucket/barrel/vessel, visible rock/gravel/sand/carbon media, water level/flow direction, inlet/outlet where applicable, and enough clean negative space that labels can be placed without colliding with the artwork.

The visual must support the approved safety boundary: clearer or filtered-looking water is not automatically potable.
