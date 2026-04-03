---
type: protocol
title: "PacBio HiFi Sequencing (Col-0)"
---

# PacBio HiFi Sequencing (Col-0)

Tab 1

x[Col-0 HMW gDNA extractions & libraries](https://docs.google.com/spreadsheets/d/1nWy1T0GWThBWpcfzS10ANcgUsvvXtHLdVDAryb4O0ow/edit?usp=sharing)

Check PacBio [notes](https://www.pacb.com/wp-content/uploads/Technical-Note-Preparing-DNA-for-PacBio-HiFi-Sequencing-Extraction-and-Quality-Control.pdf) on preparing samples for sequencing

Submitting samples for pipette shearing:

- Dilute each sample to <10ng/µL in 200-500 µL. It's important not to have a concentration higher than 10ng/µL.
- Make sure that all the samples have the same volume (even if concentrations are different; though best to keep both concentration and volume consistent if possible).

Library Prep for PacBio Sequencing

[protocol for library prep kit](https://www.pacb.com/wp-content/uploads/Procedure-checklist-Preparing-multiplexed-whole-genome-and-amplicon-libraries-using-the-HiFi-plex-prep-kit-96.pdf)

- First bead cleanup step - used the 96-well magnet and added SMRTbeads directly to the plate used for shearing

- Next time, recommend NOT using this method as it is difficult to see supernatant or ethanol left behind during discard and wash steps + balancing centrifuge;
- Instead transfer all 300ul of the pipet-sheared DNA samples to new lo-bind 1.5ml tubes, then add 1X volume of beads

- Use 1ml 80% ethanol during wash steps

- Tips from Noravit at the Genome Center:

- While the maximum input for sequencing is 300ng per sample, for the very first bead-clean up step, expecting 10-30% loss, used ALL the DNA from pipette shearing (350ng)
- \*\*Increase the time for the Repair step. While the protocol says to run for 30 minutes, increase to 1 hour at 37C. Some people will even incubate at RT for this repair step.

- Sample pooling:

- Make sure the volume is 25ul, as it is the largest input volume for LightBench.
- According to Oanh, to be on the safe side of LightBench size selection, “please provide a minimum of 1 ug in 25 ul. If the next library has a similar (size-distribution) profile to the first library, 1 ug in 25 ul should be sufficient.”
- Satoyo: Previously, the final pooled library resulting from 300 ng x 20 samples was 1.8 µg. You are in a bit of a tight spot.
- It is important that the size-distribution of samples are consistent, as variable fragment size (shorter fragments) will reduce read quality & yield.

---

Concentration Range for Qubit Assays:

Used dsDNA BR to quantify HMW DNA extractions

Used dsDNA 1X HS to quantify pooled libraries.

---

Results from QC and Pipette Shearing - 1st pool

Subset of HMW gDNA samples from extraction:

Note low fragment size for VA\_1 and VA\_9; the normal expected fragment size distribution is  HiFi extraction VA\_13

Same samples as above, post-shearing:

- Uniform distribution after pipette shearing across samples;

- Mean ~22kb
- Mode

QC of Libraries Pooled (Pool #1) 10/08/2025:

---

Qubit Measurement from Genome Center: 11 ng/ul in 23 ul, 253 ng ← this is too low for Sequencing & LightBench Size Selection

Expected quality of sequencing given QC results?

- Look at median length; is median length << or considerably = to the average size?
- [https://www.pacb.com/wp-content/uploads/Technical-overview-HiFi-library-preparation-using-HiFi-prep-kits-for-high-throughput-sequencing-on-PacBio-long-read-systems.pdf](https://www.pacb.com/wp-content/uploads/Technical-overview-HiFi-library-preparation-using-HiFi-prep-kits-for-high-throughput-sequencing-on-PacBio-long-read-systems.pdf)

Sent rest of HMW DNA to be pipette sheared & second library prep:

\*NOTE: this second pool is missing VA\_9, though it was submitted for shearing.

QC of sheared DNA (same samples as before):

- Mean fragment sizes = 17474, 20265, 17389
- Modes: 18241, 19201, 19500

After library prep of pool #2, the final concentration was 36.4ng/ul in 25ul.

Pooled together Pool #1 (11ng/ul in 23ul) + Pool #2 using SMRTBell Cleanup Beads at 1X ratio.

FINAL concentration of pool to be sequenced = 43.8ng/ul in 26ul (Qubit measurement)

---

QC for final pooled libraries (Pool 1 + Pool 2) sent for LightBench size-selection and sequencing:

- Mean fragment size = 19772 bp
- Mode of distribution = 18150 bp
- Concentration of final pool: 48ng/ul in 25ul

- The size cut-off for LightBench will be <12kb.

Calculating expected sequencing yields:

Genome size \* desired coverage =>

---

01/08/2026

Large fraction of non-barcoded reads → this might be due to potential contamination in barcoding wells used (especially for pool 1)

- Also since the quality score of the non-barcoded reads are comparable to the samples’ qualities

Pool 1: 11\*ng/ul in 22ul = 253ng (~23%)

Pool 2: 34.6\*ng/ul in 25ul. = 865 ng (~77%)

Merged pool for submission: ​​43.8ng/ul in 25ul (used beads to concentrate into 25ul)

(\*when re-measured before merging two pools together)

Pool 1 should be 253

Thank you for taking the time to help us with the demultiplexing details, given the suboptimal library prep conditions.

The second library prep was done with the same biological samples (i.e. same DNA pool) however with 1 sample missing as a low amount of DNA that was extracted for that sample and was used in entirety for the first  The library prep protocol/kit that I used was the HiFi plex prep kit 96 following this protocol. The only change that I made during the second pool I prepared was that I increased the repair step from 30 minutes to 1 hour based on advice I received from Noravit to help increase library yield. As I was preparing the second library pool the first preparation was kept in the -20C freezer.

I am highly confident that all the indexes for the first pool that I prepared are correct.

However, one potential source of error from my part during the second library preparation was that I had written down all the adapter wells used on a piece of paper, and lost that piece of paper. I backtracked from the plates

hing to note was that for the second library preparation, I wrote down my record of

The only potential issue that I can think of leading to a mixup with the barcodes during the library prep process was that I used the 96 well adapter index plate that we have been re-using in our lab for some time. There may have been potential cross-contamination between indexes in the plate.

Overview of PacBio

Overview of PacBio Sequencing

[https://www.pacb.com/blog/smrt-cell/](https://www.pacb.com/blog/smrt-cell/)
