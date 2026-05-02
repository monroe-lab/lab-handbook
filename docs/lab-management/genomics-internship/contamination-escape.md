---
type: guide
title: "Genomics Internship — Contamination Escape Protocol"
---

# Contamination Escape

When your T-DNA PCR (Week 3) shows a **wild-type allele** in your seedlings, you have wild-type seed contamination. Don't sequence it — that's a mixed sample and the assembly will be useless.

This is **not** your fault. Stock contamination happens. We have a backup in the freezer for this exact reason.

## How you know you have a problem

T-DNA genotyping PCR is two reactions:

- **Reaction 1 (T-DNA + gene-specific primer):** amplifies the disrupted allele → you should see a band
- **Reaction 2 (gene-specific primer pair flanking the insertion):** would amplify a *wild-type* allele → you should see **no band** in a homozygous mutant

If Reaction 2 gives a clean wild-type band, the seedling pool you harvested has wild-type seed mixed in.

## Stop. Do not start library prep.

A mixed sample assembles into garbage. Pivot now — you'll lose at most a day, not a week.

## The pivot

1. **Tell Kehan.** Slack and pull her in person. She'll confirm the pivot.
2. **Pull pre-staged backup tissue.** The lab maintains genotype-confirmed bulk tissue per line, frozen at -80°C. Your line's backup is in [[freezer-minus80-a]] (specific position logged in your line's accession card).
3. **Re-extract HMW DNA from the backup tissue.** Same protocol you ran on your seedlings. Backup tissue is ~500 mg — enough for one or two HMW runs.
4. **Re-run the T-DNA PCR on the backup-tissue DNA.** Confirm: Reaction 1 band present, Reaction 2 clean.
5. **Proceed to library prep with the backup-tissue DNA.**

## Document the pivot in your lab notebook

This is not a failure — it's a real result. Log it the same day:

- The wild-type band you saw, with the gel image annotated
- Why you pivoted (mixed sample → mixed assembly = useless)
- The backup tissue source, generation, freezer position
- The clean PCR on backup tissue, with annotated gel image
- That your assembly will be from backup tissue, not your grown seedlings — note this in the methods section of your week-10 presentation too

## What if backup tissue is also contaminated?

This is rare. Three out of three labs would still call it bad luck.

- Stop. **Tell Grey directly.** This is now a lab-side problem, not a student-side problem.
- Grey will decide whether to (a) source fresh seed from the original SALK stock and restart for next quarter, or (b) reassign you to a different line and skip ahead in the timeline using a known-clean line's pre-staged tissue.

You will **not** be penalized in the capstone evaluation for double-contamination. Document everything; the troubleshooting story is itself presentation-worthy.

## Why we plan for this

DNA-repair-deficient lines in long-term MA propagation are exactly the lines most prone to drift, escape, and contamination — by design, they accumulate weird stuff. The backup tissue is staged precisely so that one bad seed batch doesn't blow up a whole quarter.

## Related

- [[t-dna-genotyping-pcr]]
- [[lab-prep-checklist]] (lab-side staging of backup tissue)
- [[capstone-rubric]] (presentation methods section)
