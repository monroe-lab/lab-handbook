---
type: "protocol"
title: "Protocol Template"
---
# Protocol Template

*Use the **Duplicate** button (top right) to create a copy, then rename and edit it for your own protocol.*

<br>
<br>
![1000009772](images/1000009772.jpg)

![1000009774](images/1000009774.jpg)

<video controls style="max-width:100%;border-radius:8px;margin:12px 0"><source src="images/1000009338.mp4" type="video/mp4">Your browser does not support video.</video>

**Purpose:** Brief statement of what this protocol achieves and when you would use it.

**Author:** [[grey-monroe]]

**Last verified:** 2026-04-04

***

## Overview

| Step | Description | Hands-on | Wait time | Total |
| ---- | ----------- | -------- | --------- | ----- |
| 1 | Prepare workspace | 10 min | — | 10 min |
| 2 | Sample preparation | 5 min | 10 min (incubation) | 15 min |
| 3 | Purification | 15 min | 5 min (centrifuge) | 20 min |
| 4 | Quality check | 10 min | 30 min (gel run) | 40 min |
|  | **Total** | **\~40 min** | **\~45 min** | **\~1.5 hr** |

***

## Background

Provide context so someone unfamiliar with the technique understands *why* each step matters, not just *what* to do. A good background section answers: What is the biological or chemical principle? Why this method over alternatives? What can go wrong if steps are skipped?

For example, if your protocol involves DNA extraction, explain why you lyse cells before adding binding buffer, or why you use a specific pH. This turns the protocol from a recipe into a teaching tool.

***

## Safety

> ⚠️ **PPE Required**
> Always wear nitrile gloves and safety glasses for this procedure. If working with volatile reagents, use the [[fume-hood]]. Check the SDS for any unfamiliar chemical before handling. Click any reagent pill below to see its location and SDS link.

***

## Materials

### Reagents

| Reagent | Amount per sample | Notes |
| ------- | ----------------- | ----- |
| [[ethanol-70]] | 1 mL | For surface sterilization |
| [[triton-x-100]] | 50 uL of 20% stock | Surfactant, improves wetting |
| [[agarose]] | 0.5 g per 50 mL | For gel electrophoresis QC |

### Equipment

Your workspace should look something like this:

![Laminar flow hood setup](images/laminar-flow-hood-example.jpg)

*A laminar flow hood provides a sterile work surface with HEPA-filtered airflow. Always work with the sash at the appropriate height.*

| Equipment | Purpose |
| --------- | ------- |
| [[clean-bench]] | Sterile work surface |
| [[tube-rotator]] | Gentle mixing during incubation |

### Stocks

You can link biological stocks too:

* [[col-0-wild-type]] (control genotype)
* [[bl21-de3-competent-cells]] (if doing a transformation step)

***

## Procedure

### Step 1: Prepare workspace

1. Turn on the [[clean-bench]] and let it run for **10 minutes** before starting
2. Wipe down the surface with 70% ethanol
3. Gather all reagents and label your tubes

> 💡 **Tip**
> Label tubes *before* you start the protocol. Once your gloves are wet with reagents, markers won't write on tubes. Use a fine-point permanent marker and include: your initials, date, sample ID, and step number.

### Step 2: Sample preparation

1. Transfer tissue to a labeled 1.5 mL tube
2. Add **400 uL** extraction buffer
3. Grind with a micropestle for **30 seconds** until homogenized
4. Incubate at **65 C** for **10 minutes**

> ⚠️ **Warning**
> Do not exceed 15 minutes at 65 C. Extended heat exposure degrades DNA and will reduce your yield significantly. Set a timer.

> ℹ️ **Note**
> If your tissue is particularly tough (woody stems, mature leaves), freeze in liquid nitrogen first and grind to a fine powder before adding buffer. This dramatically improves lysis efficiency.

### Step 3: Purification

1. Add **400 uL** chloroform:isoamyl alcohol (24:1)
2. Vortex for **10 seconds**
3. Centrifuge at **13,000 rpm** for **5 minutes**
4. Transfer the upper aqueous phase (\~300 uL) to a new tube

> 🔀 **Column-based alternative**
> If you prefer a spin-column kit over organic extraction:
>
> 1. Add **200 uL** binding buffer (from kit) to your lysate
> 2. Load onto the spin column
> 3. Centrifuge **30 seconds** at 10,000 rpm
> 4. Wash 2x with **500 uL** wash buffer
> 5. Elute in **50 uL** warm EB buffer
>
> *Trade-off:* Columns are faster and avoid toxic solvents, but yield is typically 30-50% lower than organic extraction. Use columns for genotyping PCR; use organic extraction when you need high-molecular-weight DNA (e.g., long-read sequencing).
> 🔀 **High-throughput (96-well plate format)**
> For processing many samples simultaneously:
>
> 1. Use a 96-well deep-well plate instead of individual tubes
> 2. Scale all volumes to **200 uL** (half the single-tube protocol)
> 3. Use a multichannel pipette for all liquid handling
> 4. Centrifuge plates at **3,000 rpm** (lower speed to avoid cracking wells)
>
> *Note:* Plate format is essential for projects like [[mutation-accumulation]] where you may process hundreds of lines at once.

### Step 4: Quality check

Run your samples on a gel to verify extraction worked:

1. Pour a **1% agarose** gel with 1x TAE buffer
2. Load **5 uL** sample + **1 uL** loading dye
3. Run at **100V** for **30 minutes**
4. Image on a UV transilluminator

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

***

## Media & animations

Use the **Media** buttons in the editor toolbar to insert images, GIFs, and videos. Everything uploads and embeds automatically.

### Static image & animated GIF

Click **Image / GIF** in the Media bar, pick a file from your computer. It uploads to the repo and appears inline. GIFs animate automatically.

![Pipetting technique demo](images/pcr-cycle-animation.gif)

*Animated GIFs are great for showing hand positions, mixing techniques, or short equipment operation demos.*

### YouTube video

Click **YouTube** in the Media bar, paste any YouTube URL. A thumbnail preview appears in the editor; the full embedded player shows in the rendered view.

<iframe width="560" height="315" src="https://www.youtube.com/embed/iQsu3Kz9NYo" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:12px 0"></iframe>

<iframe width="560" height="315" src="https://www.youtube.com/embed/c1WOBy5vSg8" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:12px 0"></iframe>

### Local video file

Click **Video file** in the Media bar, pick an mp4 or webm (max 25 MB). For longer videos, use YouTube instead.

<video controls style="max-width:100%;border-radius:8px;margin:12px 0"><source src="images/test-video.mp4" type="video/mp4">Your browser does not support video.</video>

***

## Troubleshooting

| Problem | Likely cause | Solution |
| ------- | ------------ | -------- |
| No DNA band on gel | Incomplete lysis | Grind more thoroughly; freeze tissue first |
| Smeared DNA | Degradation from nucleases | Work faster; keep samples on ice |
| Low A260/A280 ratio (<1.8) | Protein contamination | Add a second chloroform extraction |
| Brown pellet | Polyphenol co-precipitation | Add PVP to extraction buffer |

***

## Expected results

* **Yield:** 5-20 ug DNA per 100 mg fresh tissue
* **Purity:** A260/A280 of 1.8-2.0
* **Integrity:** Sharp high-MW band on gel, minimal smearing

***

## Related protocols

* [[wet-lab/seed-sterilization]] (if growing plants for tissue)
* [[wet-lab/gel-electrophoresis]] (detailed gel protocol)
* [[wet-lab/pcr-genotyping]] (downstream application)

## Related projects

* [[mutation-accumulation]]
* [[alfalfa-pangenome]]

***

## Revision history

| Date | Author | Change |
| ---- | ------ | ------ |
| 2026-04-04 | [[grey-monroe]] | Initial template created |

***

## About this template

*Every **h2 section** on this page is **collapsible**. Click any section header to collapse or expand it. This also applies when printing: collapse sections you don't need before hitting Print.*

*The special blocks (variants, warnings, tips, notes) are also collapsible. Use these to add context without cluttering the main procedure.*

*Use the **Duplicate** button (top right) to make a copy and start writing your own protocol.*