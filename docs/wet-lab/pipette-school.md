---
type: protocol
title: "Pipette School"
---

# Pipette School

## Resources

**Equipment:** [[micropipette-p10]], [[micropipette-p20]], [[micropipette-p200]], [[micropipette-p1000]], [[analytical-balance]]

**Consumables:** [[pipette-tips-p10]], [[pipette-tips-p20]], [[pipette-tips-p200]], [[pipette-tips-p1000]], [[filter-tips-p10]], [[filter-tips-p20]], [[filter-tips-p200]], [[filter-tips-p1000]], [[microtube]], [[pcr-strip-tubes-0-2ml]], [[parafilm]]

**Reagents:** Distilled water, food coloring (optional, for visibility)

**Related Protocols:** [[tube-and-sample-labeling]], [[how-to-use-the-scale]]

**Purpose:** Learn to pipette accurately and consistently. Pipetting is the most fundamental lab skill. Every protocol downstream depends on your ability to deliver precise volumes. This is a dedicated ~2.5 hour training session with structured exercises.

## Time estimate

**Wall time:** ~2.5 hr | **Hands-on:** 2.5 hr

---

## Background

A micropipette is a precision instrument for transferring small liquid volumes (0.1 uL to 1000 uL). Different pipette sizes cover different volume ranges. Using the wrong size or technique introduces errors that compound through every downstream step.

**Why this matters:** A 10% pipetting error in a PCR master mix means some reactions get too much enzyme and some get too little. A sloppy DNA quantification means you load the wrong amount into a library prep. Pipetting errors are the #1 source of failed experiments for new lab members.

## The Pipettes

<!-- PHOTO: Our Fisher Elite pipette set on the bench, showing P10/P20/P200/P1000 — TODO add -->

The lab has several micropipettes. Each covers a specific volume range. **Never dial a pipette outside its stated range** — this damages the calibration.

| Pipette | Range | Tip color | When to use |
|---------|-------|-----------|-------------|
| P2 | 0.1–2 uL | | Very small volumes (rare in routine work) |
| [[micropipette-p10|P10]] | 0.5–10 uL | | Enzyme additions, small reagent volumes |
| [[micropipette-p20|P20]] | 2–20 uL | | PCR components, small buffer additions |
| [[micropipette-p200|P200]] | 20–200 uL | | Most common. DNA samples, buffer additions, gel loading |
| [[micropipette-p1000|P1000]] | 100–1000 uL | | Large volumes. Filling tubes, buffer prep |

### Reading the volume dial

The pipette has a three-digit (or four-digit) display on the plunger. The decimal point position depends on the pipette size:

- **P10:** digits read as X.XX uL (e.g., 0.50 = 0.50 uL, 10.0 = 10.0 uL)
- **P20:** digits read as XX.X uL (e.g., 15.0 = 15.0 uL)
- **P200:** digits read as XXX uL (e.g., 150 = 150 uL)
- **P1000:** digits read as XXXX uL (e.g., 1000 = 1000 uL)

If you aren't sure how to read the display, ask before pipetting.

## Tips

![Pipette tips in boxes](../images/pipette-tips-in-boxes.jpg)

- **Always use the correct tip size** for your pipette. Tips are not interchangeable.
- **Filter tips** (available for all pipette sizes — [[filter-tips-p10|P10]], [[filter-tips-p20|P20]], [[filter-tips-p200|P200]], [[filter-tips-p1000|P1000]]) sit inside the tip and catch aerosols before they reach the pipette barrel. Use them when cross-contamination would wreck the experiment: PCR master mix, low-copy templates, sensitive amplicon work, RNA handling. Don't default to filter tips for everything — they cost more per tip, and for routine transfers (most DNA pipetting, buffers, water, training exercises) regular tips are fine. Pick based on what you're actually doing.
- **Tip ejection:** Use the ejector button to drop the tip into the waste. Never pull a tip off by hand.

### Your tip boxes

Every trainee gets their own set of tip boxes — one per pipette size (P10, P20, P200, P1000), plus filter-tip boxes if your work calls for them. These live at your bench, not in the shared stock.

**Label them.** Put your name on the side of each box with a sharpie or label tape (see [[tube-and-sample-labeling]] for labeling conventions). Unlabeled boxes wander, get mixed up, or end up refilled wrong. A named box is your box.

**Where tips live.** Fresh boxes are on the **shelf by the fridge** or **above the [[opentrons-ot2|OT-2]]**. Sizes are labeled. Filter and non-filter tips are stored separately — look before you grab.

**When you run out mid-protocol.** Walk to one of those two spots, pull a fresh sealed box of the right size, bring it back, and keep going. Swap the empty one out of your bench setup so you don't reach for it by mistake.

**When the shared stock is low.** If you pulled the last (or close to last) box of any size, flag it in the [inventory app](../inventory-app/) as needs-ordering. Don't assume someone else noticed. You do not order supplies yourself — flagging in inventory is the signal to Grey or your mentor to reorder.

**Empty boxes.** Don't throw them out. Empty tip boxes get refilled from bulk tips and autoclaved for reuse — see [[autoclave]]. **Stack empty boxes by the trashcans at the bench ends.** Lids stay with boxes. If it's empty, it goes on the stack, not in the trash.

## Technique

### Forward pipetting (standard)

This is the technique you will use 99% of the time.

<iframe width="560" height="315" src="https://www.youtube.com/embed/Wx8clzD-CO4" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:12px 0"></iframe>

*Video: How to Pipette in 5 Simple Steps (Eppendorf) — 5-minute walkthrough of proper forward pipetting technique.*

See also the [Eppendorf Video Guide to Perfecting Your Pipetting Technique](https://www.eppendorf.com/us-en/lab-academy/topics-methods-technology/pipetting-dispensing/the-eppendorf-video-guide-to-perfecting-your-pipetting-technique/) for the full series.

1. **Set the volume** by turning the dial. Never force the dial past the pipette's range.
2. **Attach a tip** by pressing the pipette firmly into the tip box. One firm push. Don't hammer it.
3. **Depress the plunger to the first stop.** You will feel a clear resistance point. Stop there.
4. **Insert the tip** into the liquid. Submerge 2-3 mm below the surface. Not deeper.
5. **Slowly release the plunger.** Let it rise smoothly. Do not let it snap back. Liquid draws into the tip.
6. **Pause** for 1 second with the tip still in the liquid. This allows the full volume to enter the tip.
7. **Withdraw the tip** from the liquid. Touch the tip to the vessel wall briefly to remove any droplet hanging on the outside.
8. **Move to the destination vessel.**
9. **Depress the plunger to the first stop** to dispense. Then push through to the **second stop** (blowout) to expel the last drop.
10. **Withdraw the tip** while holding the plunger at the second stop.
11. **Release the plunger** only after the tip is out of the liquid.
12. **Eject the tip.**

### Common errors

| Error | What happens | How to avoid |
|-------|-------------|--------------|
| Plunging too fast | Air bubbles in the tip, inaccurate volume | Slow, steady pressure |
| Submerging too deep | Liquid on the outside of the tip, extra volume delivered | 2-3 mm below surface |
| Letting plunger snap back | Inconsistent aspiration, aerosol into barrel | Control the release |
| Not pausing after aspiration | Incomplete fill, short volume | Count "one-one-thousand" |
| Forgetting blowout | Residual liquid left in tip | Always push to second stop on dispense |
| Pipetting with the pipette at an angle | Volume error | Hold pipette vertically during aspiration |

## Exercises

<iframe width="560" height="315" src="https://www.youtube.com/embed/videoseries?list=PLCKY0OHNBaBnoeWPIuWhL-rPeTrAZ9cFy" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:12px 0"></iframe>

*Video: Micropipetting Tutorial Series (miniPCR) — 4-video series covering pipette selection, technique, and practice exercises.*

Do all of these. They are not optional.

### Exercise 1: Consistency test (P200)

1. Set P200 to 100 uL.
2. Pipette 100 uL of water into a microcentrifuge tube. Repeat 10 times into the same tube (total: 1000 uL = 1 mL).
3. The final volume should be exactly at the 1 mL mark on the tube.
4. If it's noticeably over or under, your technique needs adjustment. Repeat.

### Exercise 2: Consistency test (P20)

1. Set P20 to 10 uL.
2. Pipette 10 uL of water 10 times into a PCR tube (total: 100 uL).
3. Compare the volume against a single 100 uL pipette from the P200.
4. They should match. If they don't, you have a technique problem at the small-volume end.

### Exercise 3: Small volume precision (P10)

1. Set P10 to 2 uL.
2. Pipette 2 uL of colored water onto a piece of parafilm. Repeat 5 times, making 5 separate droplets.
3. All droplets should be the same size. Visually compare them.
4. If one is obviously larger or smaller, identify what you did differently on that pipette.

### Exercise 4: Serial dilution

1. Label 5 microcentrifuge tubes: 1, 2, 3, 4, 5.
2. Put 900 uL of water in each tube.
3. Add 100 uL of colored water to tube 1. Mix by pipetting up and down 5 times.
4. Transfer 100 uL from tube 1 to tube 2. Mix.
5. Transfer 100 uL from tube 2 to tube 3. Mix. Continue to tube 5.
6. You should see a clear gradient of decreasing color intensity from tube 1 to tube 5. Photograph the series.

This is a 1:10 serial dilution. Each tube is 10x more dilute than the previous. You will use serial dilutions when preparing DNA standards, diluting primers, and setting up Qubit assays.

### Exercise 5: Mock PCR reaction (dyes instead of reagents)

Before setting up a real PCR, practice the motions with colored water. It builds muscle memory for small precise volumes and catches technique problems before you waste enzyme. The volumes below are the exact recipe used in [[pcr-genotyping]], so this is literally a dry run of the reaction you'll be doing on real samples.

**Stock tubes (shared on the bench):**

- **Yellow** = 2x master mix (Emerald, in the real protocol)
- **Red** = primer mix
- **Blue** = DNA template
- One tube of clear distilled water labeled "water"

**Per trainee:** one clean 1.5 mL microtube for the master mix, one PCR strip (0.2 mL, 8-well), and a fresh tip for every transfer.

**Step 1 — Prepare master mix for 5 reactions.** You're setting up 4 real reactions plus one extra volume for pipetting loss — this is how you do it at the bench. In your clean 1.5 mL tube, combine:

| Component | Stock | Volume (5x) |
|-----------|-------|-------------|
| 2x master mix | yellow | 25 uL |
| Primer mix | red | 1 uL |
| PCR-grade water | clear | 19 uL |
| **Total master mix** | | **45 uL** |

Use the P20 for the yellow, the P2 or low-end P10 for the red 1 uL, and the P20 for the water. Flick the 1.5 mL tube to mix or pipette up and down 3 times.

**Step 2 — Aliquot master mix into PCR tubes.** Dispense **9 uL of master mix** into each of 4 PCR tubes (wells 1-4 of the strip). Same tip is fine for this step — you're pulling from a homogeneous mix. Well 5 will be the negative control, so also put 9 uL of master mix there.

**Step 3 — Add template to wells 1-4.** Using a fresh tip each time, add **1 uL of blue (DNA)** to wells 1, 2, 3, 4. This is 1 uL at the bottom of the P2 or P10 range — slow plunger, pause after aspiration, touch off on the tube wall.

**Step 4 — Add water to well 5 (negative control).** Fresh tip. Add **1 uL of clear water** to well 5 instead of template. This is your no-template control — in a real PCR, any band here means contamination.

**Targets:**

- Final volume in every well: 10 uL
- Wells 1-4: same pale orange-green tint (yellow + faint red + blue). Held up side by side, they should be indistinguishable.
- Well 5: same tint but without the blue contribution (so slightly more yellow-red).
- If one well is off-color or off-volume, you can usually identify which step went wrong by which color is short or extra.

The real genotyping reaction is exactly this geometry: 5 uL master mix per rxn + 0.2 uL primers + 3.8 uL water + 1 uL template = 10 uL. When you run [[pcr-genotyping]] for real, you'll recognize the motions from this exercise.

### Exercise 6: Gravimetric accuracy check (real numbers on the [[analytical-balance|analytical balance]])

This is how pipettes are actually calibrated. Water at room temp weighs ~1.00 mg per uL, and the lab's [[analytical-balance]] resolves 0.1 mg. Weigh what you pipette and you get a real number for your accuracy — not a vibe.

Before you start, read [[how-to-use-the-scale]] if you haven't. Close the draft shield doors for every reading, wait for the display to stop flickering, and tare between samples.

**Part A — Forward: dial a volume, weigh the error.**

For each test below: tare an empty microtube on the balance, pipette the target volume of distilled water into it, close the doors, record the mass in mg. Do 5 replicates per condition, into a fresh tared tube each time. Compute mean, standard deviation, and %CV (= std dev ÷ mean × 100) for each.

| Pipette | Volume | Expected mass | Passing accuracy | Passing %CV |
|---------|--------|--------------|------------------|-------------|
| P1000 | 1000 uL | 1000.0 mg | within ±0.8% (±8 mg) | < 0.3% |
| P200 | 200 uL | 200.0 mg | within ±0.8% (±1.6 mg) | < 0.3% |
| P200 | 20 uL | 20.0 mg | within ±3% (±0.6 mg) | < 1.5% |
| P20 | 20 uL | 20.0 mg | within ±1% (±0.2 mg) | < 0.5% |
| P20 | 2 uL | 2.0 mg | within ±5% (±0.1 mg) | < 2% |
| P10 | 1 uL | 1.0 mg | within ±3% (±0.03 mg) | < 2% |

Two things this exercise teaches. First: **every pipette is worse at the bottom of its range.** 20 uL on a P200 is much sloppier than 20 uL on a P20. If your volume is at the low end of one pipette's range and the high end of a smaller pipette, grab the smaller pipette. Second: **your technique is the variable, not the pipette.** A new lab member and a senior postdoc using the same P200 get different %CVs. If your numbers are ugly, it's fixable — slow down, pause after aspiration, watch the plunger speed.

Keep your numbers. Paste them in your lab notebook. In six months, rerun this and see if you got better.

**Part B — Reverse: weigh first, work out the volume.**

Now flip the exercise. Your partner dials a "mystery" volume on the P20 or P200 without showing you the display. You pipette one aliquot of water into a tared tube, close the doors, read the mass. Back-calculate the volume (mass in mg ≈ volume in uL). Write down your guess. Your partner reveals what they dialed.

Two reasons this is worth doing. First, it drills into you that **the scale is ground truth, not the dial.** A pipette dial is a request; the scale tells you what actually came out. When a buffer recipe isn't behaving, this is the skill you reach for. Second, it's the foundation of **gravimetric verification** — the method you'll use later to check a suspicious pipette or qualify a new one before trusting it on real samples.

Swap roles. Do it a few times at different volumes.

## When you are done

- You should feel confident picking up any pipette, setting a volume, and delivering it accurately.
- You should know which pipette to grab for a given volume without thinking about it.
- You should be able to do a serial dilution without guidance.

## Documentation

Create a lab notebook entry. Date it. Cite this protocol. Include:

- Photographs of your serial dilution (Exercise 4)
- Your gravimetric accuracy table from Exercise 6 — mean, std dev, and %CV for each pipette/volume combination
- Notes on any exercises where you had to repeat
- Which pipette sizes you practiced with
