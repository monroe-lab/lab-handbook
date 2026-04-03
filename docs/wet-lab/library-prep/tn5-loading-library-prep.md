---
type: protocol
title: "Tn5 Loading & Library Prep"
---

# Tn5 Loading & Library Prep

Transposase Assembly and Validation Protocol

Overview

Adapter Sequences

| ME-A | TCGTCGGCAGCGTCAGATGTGTATAAGAGACAG |
| --- | --- |
| ME-B | GTCTCGTGGGCTCGGAGATGTGTATAAGAGACAG |
| ME-reverse | [PHO/PO4]CTGTCTCTTATACACATCT |
The sequence in bold are the mosaic end sequences that will anneal with the ME-R oligo.

The underlined sequences of ME-A and ME-B are Nextera overhang (stub) sequences such that a second PCR (library prep) will add full adapters containing P5/P7 flow-cell sequences and indexes to the tagmented DNA.

Structure of indexed primers used for library prep:

- i7 or i5 are the unique barcodes
- Underlined will anneal to the stub sequences
- The rest are the P7/P5 sequences.

---

[Protocol] Assemble Transposase with adapters

Calculate molarity of Tn5 protein in the stock samples based on given stock concentration and purity.

Example:

Total concentration considering purity = 0.13mg/ml \* 0.8 = 0.104 mg/ml

MW = 93.6 kDA (estimate based on amino acid sequence of protein)

Molarity in uM = (concentration ng/ul) / (MW kDa) = 104 ng/ul / 93.6 kDa = 1.11uM

(1) Prepare Mosaic End Adapter Mixes:

1. Prepare 200uM stocks of primers in annealing buffer (10mM Tris-HCl,  1mM EDTA [1X TE], 50mM NaCl)
2. Mix ME-A + ME-Reverse and ME-B + ME-Reverse in equal volumes. Once the primers are annealed, this will result in two 100uM oligo mixes A and B.
3. Incubate the oligo mixes in a hot block at 95C x 5 minutes (3-5 min). Then cool the tubes at RT for 45 minutes (leave the tubes in the heat block, but away from the heat source; i.e. use residual heat)

(2) Load Transposomes:

1. Add to a new tube 1:1:1 molar ratios of Tn5 : A oligo mix : B oligo mix (example: in the final solution, each oligo mix and Tn5 will be added to the molarity of 1.11 uM)

The final volume of the assembled Tn5 is arbitrary. To start, for each tube of assembled Tn5, aim for 10ug of protein → which means 10ug / 104 ug/ul = 96.15 ul of the protein stock

….and I want each stock to be made up to 100ul. Then:

(100uM primer mix) (x) = (1.11 uM equal molar ratio) (100ul final solution)

x = 1.11ul of each primer to add

2. Mix by pipette and incubate on a rotating platform ([[hula-mixer]]) at RT for 1 hour.
3. If needed, dilute to 1 μM in 1X Transposome Storage Buffer (store at RT).

4. Store assembled transposase at -20C.

Tagmentation & Library Prep Validation

Tagmentation activity & efficiency assay:

1. Prepare 25ul reactions for a titrated volume of Tn5

| HMW DNA | a ul for 100-150ng |
| --- | --- |
| Assembled Tn5 | x ul        (titrate concentrations; e.g. 1-5ul) |
| 5X [[taps]] Buffer  (50mM TAPS-NaOH, 25mM MgCl2) | 5ul |
| H2O | 20 - a - x |
|  | 25 ul total rxn volume |
2. Incubate at 55C x \*15-20 minutes at 650-700 rpm on the [[thermomixer]].
3. Add 2.22ul of 1% SDS (for final conc. 0.1%), and incubate additional 7 min x 55C.
4. Clean tagmented samples with SPRI beads (1.8X = 36ul) to desalt/remove SDS. Elute DNA in 25ul EB buffer or H2O.
5. QC: Run tagmented DNA on a gel or load 1-2ul on bioanalyzer to determine optimal volume of transposase for your reaction.

\*Note: tagmentation is also affected by incubation time during tagmentation. Aim for Tn5 volumes that show similar traces on bioanalyzer to the transposase (e.g. Epicypher pAG-Tn5, at 2.5ul) that the protocol using the assembled transposase is originally written for.

Library Prep:

6. Use 12-15ul of tagmented DNA as input for library prep. Prepare 25ul PCR reactions, run for 15-20 cycles (only for verification of successful library prep on [[agarose]] gel, so higher cycle # ok); 3ul to load gel.

|  | 12-15 ul DNA  5 ul 5X Q5 reaction buffer  4.75 - 1.75 ul nuclease-free water  1.25 ul of each forward/reverse primer (10uM)  0.5 ul dNTPs (10mM)  0.25 ul Q5 polymerase |
| --- | --- |
PCR Cycle Conditions

|  | 72C for 5 min |
| --- | --- |
| Initial Denaturation | 98C for 30 seconds |
| 15-20 cycles | 98C for 10s  63C for 10s |
| Final Extension | 72C for 1 minute |
| Hold | 10C |
For more detailed instructions, refer to the [[[cut-and-tag]]](https://docs.google.com/document/d/1rTRJISdgs6TK0SNbs5arAiXBsZ93d-MYPAy5G7-tHCo/edit?usp=sharing).

7. Use 1.3X (32.5 ul) single-sided SPRI beads for library cleanup (retain >75bp fragments; to remove leftover adapters/primers).
8. Use cold 80% ethanol for all bead-based cleanups; 2x washes.

---

Example Results

---
