---
type: protocol
title: "Water Bath and Heat Block"
---

# Water Bath and Heat Block

## Resources

**Equipment:** [[water-bath]], [[heat-block]] (standalone), heat block (Opentrons temperature module)

**Location:** [[bench]] in [[room-robbins-0170]]

**Related Protocols:** [[lab-orientation]], [[qiagen-dneasy-extraction]]

**Purpose:** Learn when to use a water bath vs. a heat block, how to set the temperature, and how to verify it's equilibrated before putting your samples in.

## Time estimate

**Wall time:** ~30 min | **Hands-on:** 30 min

---

## Water Bath vs. Heat Block

Both heat samples to a target temperature. The difference is heat transfer.

| | Water Bath | Heat Block |
|---|-----------|------------|
| **How it works** | Tubes sit in heated water | Tubes sit in metal wells |
| **Heat transfer** | Excellent (water contacts entire tube) | Good but slower (metal-to-plastic contact) |
| **Temperature uniformity** | Very even | Can have slight gradients |
| **Best for** | Incubations where precise, even heating matters (enzyme reactions, lysis steps, incubations >15 min) | Quick heating, small numbers of tubes, when you don't want to deal with water |
| **Drawbacks** | Water level maintenance, potential contamination, condensation on tube caps | Slower equilibration, less uniform for large batches |

**Rule of thumb:** If the protocol says "incubate at 55C for 30 minutes," a water bath is slightly better. If it says "heat to 65C for 5 minutes," either works. Use whatever is available.

## Procedure

### Water Bath

1. **Check the water level.** The water should be high enough to submerge your tubes to the level of the liquid inside them. Add distilled water if needed.
2. **Set the temperature.** Turn the dial or use the digital controls to set your target temperature.
3. **Wait for equilibration.** The water bath needs time to reach the target temperature. Turn it on 15-30 minutes before you need it, or leave it running at a commonly used temperature (37C or 55C).
4. **Verify the temperature.** Check the thermometer (most water baths have one built in or floating in the water). Do not trust the dial setting alone.
5. **Place your tubes.** Use a floating rack to keep tubes upright and prevent them from sinking. Make sure tube caps are above the water line to prevent contamination.
6. **Set a timer.** Do not walk away without a timer.
7. **Remove tubes.** Wipe the outside of tubes dry before opening to prevent water from dripping into your sample.

### Heat Block

1. **Select the correct insert** for your tube size (0.5 mL, 1.5 mL, 2.0 mL, or Falcon tube).
2. **Set the temperature.**
3. **Wait for equilibration.** Heat blocks take 5-10 minutes to stabilize.
4. **Place tubes in the wells.** Push them down fully so the tube bottom contacts the metal.
5. **Set a timer.**

### After use

- If you changed the water bath temperature, set it back to the default (ask Grey or check the label on the unit).
- Turn off the heat block if no one else needs it.
- Do not leave the water bath running indefinitely unless it's kept at a standard temperature for shared use.

## Documentation

No separate lab notebook entry needed for learning to use these. You will use them during extraction and other protocols, and those protocols have their own documentation steps.
