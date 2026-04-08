---
type: project
title: "Validation Plan"
---

# Validation Plan

Prerequisite to production use of the [[in-house-hifi-shearing]] workflow. Until this calibration is logged, treat all in-house results as provisional and continue parallel FemtoPulse on critical batches.

## Goal

Characterize the bias of the AMPure cleanup + Flongle read-length path relative to the Genome Center FemtoPulse, so we have a known correction factor to apply when interpreting in-house QC results.

## Procedure

1. Take one batch of 8-12 HMW DNA samples.
2. Shear all on the OT-2 using [[ot2-hmw-shearing]].
3. Split each sample into two aliquots:
   - **Aliquot A**: Genome Center FemtoPulse (~$27/sample). Requires Noravit back from leave (~early May 2026).
   - **Aliquot B**: in-house Flongle path ([[flongle-rapid-barcoding-rbk114]] then [[flongle-sequencing-and-analysis]]).
4. Compare per-sample read-length distributions.
5. Log the offset (e.g., "Flongle reads X% shorter mean and Y% narrower than FemtoPulse on the same input") in the master pipeline page as a constant correction factor.
6. The validation must use the **same AMPure beads, ratio, and protocol** that production will use. Any change invalidates the calibration.

## Exit criteria

Once the offset is logged in [[in-house-hifi-shearing-pipeline]], the in-house workflow is cleared for production.
