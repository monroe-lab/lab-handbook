---
type: protocol
title: "Operating the Opentrons OT-2"
---

# Operating the Opentrons OT-2

**Purpose:** General-purpose handbook page for the lab's [[opentrons-ot2]]. The lab has owned the robot since 2020 but had no protocol page for it; this is the prerequisite reference for every OT-2 protocol in the handbook including [[ot2-hmw-shearing]] and [[flongle-rapid-barcoding-rbk114]].

## Hardware in the lab

- [[opentrons-ot2]] base unit (GEN2 chassis, delivered 2020-09)
- [[ot2-temperature-module]] (GEN2)
- [[ot2-magnetic-module]] (GEN2)
- [[ot2-thermocycler-module]]
- P10, P20, P300, P1000 single- and multi-channel pipettes (verify mounts before each run)

## Software

- **Opentrons App** — install from <https://opentrons.com/ot-app/>. Used to upload Python protocols, calibrate, and start runs.
- Python protocols use the **Opentrons API v2**. Reference: <https://docs.opentrons.com/v2/>.
- The OT-2 connects via USB or wifi to the lab laptop running the app.

## Powering on

1. Confirm the deck is clear and the gantry can move freely. **Never reach in during a run** — the gantry will hit you and the run will fail.
2. Power switch is on the back left. Lights come on, gantry homes itself.
3. Open the Opentrons App on the lab laptop. Connect to the robot when it appears in Devices.

## Calibration

Three things need to be calibrated, in this order:

1. **Deck calibration** — once after install or when the deck is bumped. App → Devices → Robot Settings → Deck Calibration.
2. **Pipette calibration** — once per pipette per mount. App → Devices → Pipettes → Calibrate. Use the calibration block.
3. **Labware offsets** — per protocol, per labware item. The App walks you through this when you start a run via Labware Position Check. Use it. It catches almost every "off by 1 mm" tip pickup failure.

Re-calibrate pipettes every 6 months or after any service. Log calibration in the OT-2 maintenance section of the Lab Handbook (TBD page).

## Running a Python protocol

1. Save the protocol `.py` file somewhere local.
2. App → Protocols → Import → select the file. The App parses it and shows the deck layout, required labware, and tips.
3. Set up the deck physically to match the layout shown. Load tip racks, plates, modules, reservoirs in the slots indicated.
4. App → Run → start the protocol. Run Labware Position Check first. This is the most common source of failed runs if you skip it.
5. Confirm modules connect (you should see green status for [[ot2-temperature-module]], [[ot2-magnetic-module]], [[ot2-thermocycler-module]] in the App).
6. Press Start. Walk away. Most protocols run unattended.

## Loading labware

- **Tips:** confirm the tip rack matches the pipette (P200 tips for P200, etc.). Wide-bore tips ([[wide-bore-filter-tips-p200]], [[wide-bore-filter-tips-p1000]]) are mandatory for any HMW DNA work. Narrow tips will re-shear samples — see [[in-house-hifi-shearing-pipeline]] § Critical gotchas.
- **Plates:** orient A1 to the back-left as shown in the App. The robot doesn't know if you flipped it.
- **Modules:** plug power and USB into the slot the protocol expects. The App shows green when the module is detected.
- **Reservoirs:** check the volumes the protocol expects and pre-fill before starting.

## Common gotchas

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Tip pickup fails on first column | Skipped Labware Position Check | Re-run with LPC |
| Module not detected | USB or power loose | Re-seat both, restart App |
| Pipette aspirates air | Wrong tip rack loaded | Verify pipette ↔ tip pairing |
| Volumes off by 5-10% | Pipette out of cal | Recalibrate |
| Protocol stalls on `pause` | Missing manual step acknowledgement in App | Click Resume in the App |
| HMW DNA is sheared after the run | **Wrong tips** (narrow instead of wide-bore) | Re-extract; this cannot be recovered |

## GEN1 fallback

The Sanger ToL protocols and most modern Python protocols expect GEN2 module identifiers:

```python
temp = protocol.load_module('temperature module gen2', 3)
mag = protocol.load_module('magnetic module gen2', 4)
```

If the lab's modules are GEN1 (verify the sticker on the side) the load lines become:

```python
temp = protocol.load_module('tempdeck', 3)
mag = protocol.load_module('magdeck', 4)
```

Note this in the protocol header before saving and rerun.

## Maintenance

- Wipe the deck with 70% ethanol after every run. Avoid the optical sensors on the gantry head.
- Pipette O-rings: replace yearly or whenever pipettes start aspirating air.
- Calibrate pipettes every 6 months.
- If the robot makes grinding noises, stop the run immediately and email Opentrons support — do not power-cycle through a stuck gantry, you will strip a belt.

## Safety

- Never reach into the deck during a run. The gantry moves fast and will not stop for your hand.
- Power off before swapping pipettes or modules.
- Ethanol on the deck is fine; bleach is not (it corrodes anodized aluminum).

## See also

- [[ot2-hmw-shearing]]
- [[flongle-rapid-barcoding-rbk114]]
- [[in-house-hifi-shearing-pipeline]]
- [Opentrons API v2 docs](https://docs.opentrons.com/v2/)
- [Opentrons Labware Library](https://labware.opentrons.com/)
