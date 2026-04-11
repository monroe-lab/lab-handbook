---
type: "protocol"
title: "Protocol Template"
---

# Protocol Template

*This document is both a template and a guide. It has the same section layout as a real protocol, but every section explains **how to write that section well**. Duplicate it (top-right button), rename it, and replace the explanatory text with your actual protocol content.*

> 📝 **What you're reading**
> This page is structured as if it were a real protocol, but each section teaches what good looks like. Where a real protocol would list *"Add 400 uL buffer"*, this one talks about *"how to describe a reagent addition so someone unfamiliar with the procedure can follow it on the first try."*

***

## What makes a good protocol

A good protocol is **reproducible by someone who has never done it before**. That's the north star. Everything below follows from that one idea.

A good protocol:

1. **States its purpose clearly** — the reader knows in one sentence what they're about to do and why.
2. **Explains the *why*, not just the *what*** — steps carry reasoning so the reader can adapt when something goes off-script.
3. **Lists materials with links to inventory** — no hunting for what a reagent is or where it lives.
4. **Breaks the procedure into discrete, numbered steps with exact quantities and times** — no "add some buffer and wait a bit."
5. **Uses callouts for safety, tips, and variants** — the things you want the reader to *not miss* are visually distinct from the ordinary step flow.
6. **Shows instead of only telling** — a photo of what the correct tube should look like is worth a paragraph.
7. **Anticipates failure modes** — the troubleshooting section is often the most-read part of a protocol. Write it as if you were debugging with someone over Slack.
8. **Defines success quantitatively** — yield ranges, purity metrics, expected gel patterns.
9. **Links to related protocols and projects** — protocols don't live in isolation; the reader should be one click away from any dependency.
10. **Tracks its own revision history** — so reviewers know what changed and when.

The rest of this page walks through each section of the canonical protocol layout, explains the principle, and demonstrates a markdown feature you can use in that section.

***

## Purpose

**One or two sentences** describing what the protocol achieves and when you would use it. Write it so a lab member can read just this line and decide whether this is the right protocol for their task.

> 💡 **Principle**
> If your purpose sentence reads like "this protocol describes a procedure for doing X," delete the first six words. Start with the verb: "Extract genomic DNA from Arabidopsis leaves for genotyping PCR." The reader's time is precious.

**Example of a bad purpose:** *"This protocol describes the general procedure that may be used to prepare samples for downstream analysis."*

**Example of a good purpose:** *"Extract 5-20 ug of genomic DNA from 100 mg of Arabidopsis rosette leaves, suitable for genotyping PCR but not for long-read sequencing."*

Note the second one tells you **yield, input mass, what it's good for, and what it's not good for** in one sentence.

***

## Author, verification, linkage

Every protocol carries a small metadata block at the top:

**Author:** [[grey-monroe]] — link to the person card. If multiple people contributed, list them all.
**Last verified:** A date when the protocol was last actually run successfully. If it's older than a year, put a 🟡 next to it as a hint to the next user.
**Depends on:** List of prerequisite protocols (link them as wikilinks). Example: *"Assumes seeds have been sterilized — see [[seed-sterilization]]."*

> 💡 **Principle**
> Wikilinks are how your protocol plugs into the rest of the handbook. Every person, every reagent, every upstream protocol should be linked. The connection graph on the wiki page uses these links to show you what touches what.

***

## Overview table

A short table at the top of the protocol that a reader can scan in five seconds to decide whether they have time for this today.

| Step | Description | Hands-on | Wait time | Total |
| ---- | ----------- | -------- | --------- | ----- |
| 1 | Prepare workspace | 10 min | — | 10 min |
| 2 | Sample preparation | 5 min | 10 min (incubation) | 15 min |
| 3 | Purification | 15 min | 5 min (centrifuge) | 20 min |
| 4 | Quality check | 10 min | 30 min (gel run) | 40 min |
|  | **Total** | **~40 min** | **~45 min** | **~1.5 hr** |

> 💡 **Principle**
> Separate **hands-on time** from **wait time**. A protocol with 20 minutes hands-on and 2 hours wait is fundamentally different from one with 2 hours hands-on and no wait, even though both "take 2+ hours." The reader needs to know whether they can start a second task while this one runs.

***

## Background

Provide context so someone unfamiliar with the technique understands *why* each step matters, not just *what* to do. A good background section answers:

- What is the biological or chemical principle?
- Why this method over alternatives?
- What can go wrong if steps are skipped?

> 💡 **Principle**
> If your protocol involves a non-obvious step (adding PVP to the lysis buffer, or running a gel at unusually low voltage), the background is where you explain *why*. Without it, the next lab member to run the protocol will "optimize" that step away because they don't know it's load-bearing.

**Example paragraph** you might write here: "This protocol uses organic extraction (phenol-chloroform) rather than column-based purification because the downstream application (long-read sequencing) requires high-molecular-weight DNA. Columns introduce shearing during the bind-and-elute steps that cap the average fragment size at ~20 kb, below the useful range for PacBio HiFi sequencing."

***

## Safety

Every protocol must have a safety section, even if it's short. Use a **warning callout** to make the hazards visually obvious.

> ⚠️ **PPE Required**
> Nitrile gloves and safety glasses for all steps. Phenol (Step 3) requires work in a [[fume-hood]]. Liquid nitrogen (Step 2, if grinding frozen tissue) requires cryo gloves and a face shield — see [[liquid-nitrogen-refill]] and [[cryogens-sop]].

> 💡 **Principle**
> Link to the full SOPs (like [[cryogens-sop]]) rather than duplicating their contents. Protocols should tell you *which* PPE and *why*; SOPs tell you *how* to use PPE and *what to do when it fails*. Keeping these separate prevents the protocol from drifting out of sync with the authoritative safety doc.

***

## Materials

### Reagents

Every reagent should be a wikilink to the inventory card, so the reader can check stock levels and find the bottle location in one click.

| Reagent | Amount per sample | Notes |
| ------- | ----------------- | ----- |
| [[ethanol-absolute]] | 1 mL (diluted to 70%) | For surface sterilization |
| [[triton-x-100]] | 50 uL of 20% stock | Surfactant |
| [[agarose]] | 0.5 g per 50 mL | QC gel only |

> 💡 **Principle**
> Always link, never paste the name. If you write "Ethanol" instead of `[[ethanol-absolute]]`, the autocomplete breadcrumb disappears, the inventory roll-up breaks, and future lab members can't tell which of the seven ethanol bottles you meant.

### Equipment

| Equipment | Purpose |
| --------- | ------- |
| [[clean-bench]] | Sterile work surface |
| [[tube-rotator]] | Gentle mixing during incubation |

### Biological stocks

If the protocol depends on specific strains, seed lots, or cell lines, list them here with links.

- [[col-0-wild-type]] (reference control)
- [[bl21-de3-competent-cells]] (only needed for the transformation variant)

***

## Procedure

Numbered steps, short sentences, exact quantities and times. Each step should be atomic — a single action the reader can check off before moving to the next.

### Step 1: Prepare workspace

1. Turn on the [[clean-bench]] and let it run for **10 minutes** before starting.
2. Wipe down the surface with 70% ethanol.
3. Gather all reagents and label your tubes.

> 💡 **Tip**
> Label tubes *before* you start the protocol. Once your gloves are wet with reagents, markers won't write on plastic. Use a fine-point permanent marker and include: your initials, date, sample ID, and step number.

### Step 2: Sample preparation

1. Transfer tissue to a labeled 1.5 mL tube.
2. Add **400 uL** extraction buffer.
3. Grind with a micropestle for **30 seconds** until homogenized.
4. Incubate at **65 °C** for **10 minutes**.

> ⚠️ **Warning**
> Do not exceed 15 minutes at 65 °C. Extended heat exposure degrades DNA and will reduce yield significantly. Set a timer.

> ℹ️ **Note**
> If your tissue is woody or mature, freeze in liquid nitrogen first and grind to a fine powder before adding buffer. This dramatically improves lysis efficiency. See [[liquid-nitrogen-refill]] for how to get LN₂.

> 💡 **Principle**
> Notice how the **warning** is about something that will *ruin* the experiment, the **tip** is about something that will *improve* it, and the **note** is about a *conditional variation*. Picking the right callout type lets the reader triage their attention — they can skim notes and tips, but warnings are non-negotiable.

### Step 3: Purification

1. Add **400 uL** chloroform:isoamyl alcohol (24:1).
2. Vortex for **10 seconds**.
3. Centrifuge at **13,000 rpm** for **5 minutes**.
4. Transfer the upper aqueous phase (~300 uL) to a new tube.

> 🔀 **Variant: column-based purification**
> If you prefer a spin-column kit over organic extraction:
>
> 1. Add **200 uL** binding buffer (from kit) to your lysate.
> 2. Load onto the spin column.
> 3. Centrifuge **30 seconds** at 10,000 rpm.
> 4. Wash 2× with **500 uL** wash buffer.
> 5. Elute in **50 uL** warm EB buffer.
>
> *Trade-off:* Columns are faster and avoid toxic solvents, but yield is typically 30-50% lower than organic extraction. Use columns for genotyping PCR; use organic extraction when you need high-molecular-weight DNA (e.g., long-read sequencing).

> 🔀 **Variant: 96-well plate format**
> For processing many samples simultaneously:
>
> 1. Use a 96-well deep-well plate instead of individual tubes.
> 2. Scale all volumes to **200 uL** (half the single-tube protocol).
> 3. Use a multichannel pipette for all liquid handling.
> 4. Centrifuge plates at **3,000 rpm** (lower speed to avoid cracking wells).
>
> Essential for projects like [[mutation-accumulation]] where you process hundreds of lines at once.

> 💡 **Principle**
> **Variants** are different ways to get the same result. Use a `🔀 Variant:` callout instead of hiding them in the troubleshooting section. A reader choosing a method for the first time can compare options side by side without scrolling.

### Step 4: Quality check

1. Pour a **1% agarose** gel with 1× TAE buffer.
2. Load **5 uL** sample + **1 uL** loading dye.
3. Run at **100 V** for **30 minutes**.
4. Image on a UV transilluminator.

You should see a high-molecular-weight band (>10 kb). Smearing below the main band indicates degradation.

```
Expected gel pattern:

Lane:    M    1    2    3    4    5
         |    |    |    |    |    |
>10 kb   =    -    -    -    -    -    <-- intact genomic DNA
         |
 3 kb    =
         |
 1 kb    =
         |
500 bp   =
```

> 💡 **Principle**
> A **code block** (three backticks) is a great way to render schematic diagrams, gel patterns, folder layouts, sequence fragments, or anything else where whitespace and monospace matter. It's lighter weight than an image and editable later.

***

## Showing instead of telling: images and videos

When a step is easier to *show* than *describe*, insert a photo, GIF, or video. The editor's **Media** toolbar buttons handle all three.

### Static image

Click **Image** in the Media bar, pick a file. It uploads to the repo and appears inline. Include a caption that tells the reader **what to look for**, not just what's shown.

*Example caption:* "The tube on the left shows a correct pellet — compact, cream-colored, tight at the bottom. The tube on the right shows a failed extraction: the pellet is loose, brown, and streaked up the tube wall. If yours looks like the right one, stop and redo."

### Animated GIF

GIFs are great for showing hand positions, mixing techniques, or short equipment operations. Keep them under 5 seconds and under 2 MB — anything longer should be a video.

### Short video (local file)

Click **Video file** and pick an mp4 or webm (max 25 MB). Use for demonstrations that need audio or need to be longer than a GIF can reasonably be.

### YouTube video

Click **YouTube** and paste a URL. Great for pointing at a manufacturer's demo or an educational video from another lab. You're not reinventing content someone else already made well.

> 💡 **Principle**
> A 30-second video of someone pipetting correctly replaces three paragraphs of description. A picture of what "homogenized tissue" actually looks like replaces a paragraph and a half. Use media where it genuinely pays for its weight in page load time.

***

## Troubleshooting

A table mapping **symptom → likely cause → solution**. Write this section *after* you've run the protocol a few times and collected real failure modes from yourself and others.

| Problem | Likely cause | Solution |
| ------- | ------------ | -------- |
| No DNA band on gel | Incomplete lysis | Grind more thoroughly; freeze tissue first |
| Smeared DNA | Nuclease degradation | Work faster; keep samples on ice throughout |
| Low A260/A280 ratio (<1.8) | Protein contamination | Add a second chloroform extraction |
| Brown pellet | Polyphenol co-precipitation | Add PVP to extraction buffer |

> 💡 **Principle**
> The troubleshooting section is the most-read part of any protocol. When someone's experiment fails at 10 PM, this is the first place they look. Write it as if you were the experienced lab member being woken up over Slack: symptom first, likely cause second, solution third, terse and actionable.

***

## Expected results

Tell the reader what *success* looks like, quantitatively where possible.

- **Yield:** 5-20 ug DNA per 100 mg fresh tissue
- **Purity:** A260/A280 ratio 1.8-2.0
- **Integrity:** Sharp high-molecular-weight band on gel, minimal smearing

> 💡 **Principle**
> If the reader can't compare their results to something, they don't know whether they succeeded. A yield range, a purity ratio, a gel pattern — give them a number or a picture to compare against. Vague targets like "enough DNA for the next step" are an invitation for silent failures.

***

## Related protocols and projects

Link everything that depends on or feeds into this protocol. This is what turns the handbook from a list of documents into a navigable graph.

**Upstream (things you might do before this):**
- [[seed-sterilization]]
- [[planting-arabidopsis-on-ms-plates]]

**Downstream (things this enables):**
- [[pcr-genotyping]]
- [[gel-electrophoresis]]

**Projects that use this protocol:**
- [[mutation-accumulation]]
- [[alfalfa-pangenome]]

> 💡 **Principle**
> A reader landing on this protocol from a web search has no idea what to do *before* or *after* it. Upstream/downstream links solve that. Project links give the reader a reason to trust the protocol — "this is the one the alfalfa team actually uses, not a hypothetical."

***

## Revision history

A table tracking who changed what and when. Add a row whenever you meaningfully change the protocol (not for typo fixes).

| Date | Author | Change |
| ---- | ------ | ------ |
| 2026-04-11 | [[grey-monroe]] | Rewrote template as an educational roadmap (#44) |
| 2026-04-04 | [[grey-monroe]] | Initial template |

> 💡 **Principle**
> Git has the full history, but a human-readable change log at the top of the file is what catches the next reader's eye when they open the protocol six months from now. Keep entries terse: date, author wikilink, one-line description of what changed.

***

## Collapsing, printing, and navigation

- **Every `## section header` is collapsible.** Click a header to fold that section. Handy for focusing on one step during bench work, or for printing a shortened version.
- **Callout blocks are also collapsible.** Long tips, variants, and background notes can be folded away so the procedure flows linearly on first read.
- **Print-friendly layout.** Cmd/Ctrl-P produces a clean printout with the sidebar hidden and code blocks preserved. Collapse anything you don't need before printing.

***

## A final note on tone

Write protocols the way you'd talk to a lab member on their first day. Not aggressive, not condescending, but clear and direct. Assume the reader is smart and time-constrained. Show them respect by being specific and complete.

When in doubt, ask: *"If I were tired at 6 PM and had never done this before, could I follow this without messaging the author?"* If the answer is no, the protocol isn't done.

*Duplicate this template (top-right **Duplicate** button) to start a new protocol. Rename the file, replace the explanatory text with your actual protocol content, and commit when ready.*
