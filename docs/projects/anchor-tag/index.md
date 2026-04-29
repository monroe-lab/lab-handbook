---
type: project
title: "Anchor Tag"
status: "active"
pi: "Grey Monroe"
---

# Anchor Tag

Engineered MSH6 Tudor reader-enzyme fusion proteins for antibody-free chromatin profiling of H3K4me1 in plants. The lab is designing, ordering, and testing recombinant fusions of the MSH6 Tudor domain (which binds H3K4me1) to two catalytic modules: *Staphylococcus aureus* micrococcal nuclease (MNase) for CUT&RUN-style targeted cleavage, and the non-specific adenine methyltransferase HiA5 for DiMeLo-Seq / Fiber-Seq-style long-read methylation profiling.

The project is the critical-path deliverable for the [NSF EAGER "Cracking the Histone Code"](../../index.md) grant (NSF 2317191, ending 2026-05-31) and is the scientific basis for the pivot from the original Tn5-based AnchorTag approach to MNase/HiA5 fusions.

## Goal

Produce, in milligram quantities and with confirmed enzymatic activity, two tag-free or minimally-tagged fusion proteins:

- **Tudor-MNase** — targeted DNA cleavage at H3K4me1 nucleosomes (CUT&RUN workflow).
- **Tudor-HiA5** — targeted adenine methylation at H3K4me1 nucleosomes (DiMeLo-Seq / Fiber-Seq workflow, read out by Nanopore long-read sequencing).

Both with matched 3A binding-pocket-knockout negative controls for specificity experiments.

## Team and responsibilities

| Role | Person | Responsibilities |
|------|--------|------------------|
| PI | [[grey-monroe]] | Design, ordering, training alongside Vianney to take over the wet-lab work after her departure |
| Jr. Specialist | [[vianney-ahn]] | Protein handling, QC, first experiments, protocol development (through end of June 2026) |
| Postdoc (reader-fusion strategy originator) | [[satoyo-oya]] | Round 1 construct design, architecture consult (remote, in Germany) |
| Project officer | Stephen DiFazio (NSF program officer) | NSF program director, endorsed the pivot to MNase/HiA5 fusions |

**Succession plan:** Grey is training with Vianney on the full Tudor-MNase CUT&RUN and Tudor-HiA5 DiMeLo-Seq workflows during her remaining time in the lab (through June 2026), so the project continues after she leaves. Vianney should write a written SOP for each protocol before she departs.

## Equipment and reagents needed

This section is the single source of truth for ordering on the project. Grey derives purchase requests from the items below and submits them through Susan Hendrickson (UC Davis purchasing) on the project's NSF EAGER chart string (see Accounts Overview *(private vault)* in the private vault; expires 2026-05-31, so orders must be placed before the end of the month).

### Tier 1: required for the first experiments (order ASAP)

#### 1. GenScript round 2 protein order — already queued

- **Vendor:** GenScript ([genscript.com](https://www.genscript.com/), account G5512511, PIN 3E48)
- **Contact:** Sophie Yang (sophie.yang@genscript.com), CC Annie Fan (annie.fan@genscript.com)
- **What:** 4 fusion protein constructs (A, C, E, F), E. coli 1 L standard expression, Ni purification, MBP-fusion form shipped (no GenScript cleavage), delivered in 50 mM Tris-HCl, 150 mM NaCl, 10% glycerol, pH 8.0
- **Status:** Quote request draft (`draft-20260411-genscript-tudor-round2`) ready in the Grey Matter queue, pending Grey's review and send
- **Expected cost:** ~$6–8k for 2 constructs (A+C, minimum viable) or ~$13–18k for all 4 (A+C+E+F, with matched neg controls). Sophie will quote both; Grey picks at PO time.
- **Expected lead time:** ~6 weeks from PO to shipment

#### 2. Nanopore sequencer — Grey decided 2026-04-11

- **Vendor:** Oxford Nanopore Technologies ([nanoporetech.com](https://nanoporetech.com/), nanoporetech.com/store)
- **What to order:** **MinION Mk1D** (the current generation, standalone USB device) or **MinION Mk1B** (older, laptop-tethered, cheaper). Mk1D is the better choice for Grey's lab — integrated compute, no dependency on a laptop sitting nearby, runs as a small appliance.
  - MinION Mk1D Starter Pack typically includes: 1× MinION Mk1D device, 1× MinION Flow Cell (R10.4.1), 1× Ligation Sequencing Kit (V14), configuration/materials kit. Starter pack is the right SKU for a first-time lab.
  - Expected cost range: ~$5k for the Mk1B starter pack, ~$8–10k for the Mk1D starter pack (confirm on nanoporetech.com/store)
- **Why this matters for the project:** DiMeLo-Seq and Fiber-Seq readout for the Tudor-HiA5 experiments depends on modified-base calling (m6A) on long reads. Without an in-house Nanopore, each DiMeLo-Seq experiment has to go to the UC Davis DNA Technologies Core or similar, adding 2–4 weeks per run. An in-house MinION cuts the turnaround to same-day.
- **Order timing:** ASAP. Ideally arrives before the GenScript proteins, so Grey has time to set up, run basecaller training, and do one test sequencing run on lambda DNA before the real experiments start.
- **Also needed with the device:**
  - Additional MinION Flow Cells R10.4.1 (FLO-MIN114), at least 2 extras beyond the one in the starter pack — one for the first Tudor-HiA5 test run, one in reserve. Flow cells are perishable (~6 month shelf life from ship date) so don't over-order.
  - **Dorado** basecaller — free, open-source from ONT, handles m6A modification calling. Install on Grey's Mac or Farm.

#### 3. Epicypher designer nucleosomes — H3K4me1 modified mononucleosomes

- **Vendor:** EpiCypher ([epicypher.com](https://www.epicypher.com/))
- **What:** Semi-synthetic recombinant mononucleosomes with site-specific H3K4me1 modification, plus a matched unmodified control.
  - Look for their **"designer nucleosome (dNuc)"** product line under Recombinant Nucleosomes.
  - Specifically: **H3K4me1 mononucleosome** (check epicypher.com catalog for current SKU; their H3K4me1 dNuc is typically sold as ~50 µg tubes)
  - Matched control: **recombinant unmodified mononucleosome** (same backbone, no modification)
- **Expected cost:** ~$300–500 per tube for each dNuc (check current pricing). Order one H3K4me1 and one unmodified control, minimum.
- **Why this matters:** Essential for the targeting QC experiment. The first "does our reagent actually work" question the lab will ask is: does WT Tudor-MNase (or Tudor-HiA5) preferentially act on H3K4me1-modified nucleosomes vs unmodified? The 3A negative control should fail to discriminate. Without these reference nucleosomes, that experiment is not possible.
- **Storage:** -80 °C, single-use aliquots recommended. Order timing: so they arrive alongside the GenScript proteins.
- **Alternative vendor:** Active Motif also sells semi-synthetic nucleosomes with defined modifications. Epicypher is the standard for CUT&RUN / CUT&Tag reagent validation so I'd start there.

### Tier 2: for the wet-lab workflow (order in parallel)

#### 4. MinION flow cells and library prep kits

- **MinION Flow Cell R10.4.1 (FLO-MIN114)** — Oxford Nanopore. Perishable (~6 months shelf life). Order 2 extras beyond the starter pack. ~$900 per flow cell.
- **Ligation Sequencing Kit V14 (SQK-LSK114)** — Oxford Nanopore. For HMW genomic DNA library prep from plant nuclei. Standard for Fiber-Seq / DiMeLo-Seq. Included in the MinION starter pack but a backup kit is reasonable.
- **Native Barcoding Kit 24 V14 (SQK-NBD114.24)** — optional, needed if Grey wants to multiplex multiple samples on one flow cell (recommended for the WT vs 3A comparison experiments, where you can run both in one flow cell).

#### 5. Biochemistry reagents (smaller items)

- **S-adenosyl methionine (SAM), NEB catalog B9003S** — methyl donor cofactor for Hia5 activity. Small aliquots (~32 mM stock, 100 µL). ~$100. Needed for all Hia5 reactions (activity QC + nuclei experiments).
- **DpnI restriction enzyme, NEB catalog R0176S** — cuts G[m6A]TC but not GATC. Used for the Hia5 activity readout (Hia5 deposits m6A on naked plasmid, then DpnI linearizes the methylated plasmid). ~$70. Confirm stock; usually already in the lab.
- **0.5 M EGTA, pH 8.0** — chelator for quenching Tudor-MNase reactions. Can be made from EGTA powder (Sigma E3889) + NaOH, or bought as a solution (Invitrogen 15425795 or similar). Confirm stock.
- **2 M CaCl₂ stock** — needed to trigger Tudor-MNase cleavage. Standard lab reagent, confirm stock.
- **Protease inhibitor cocktail** — Roche cOMPLETE EDTA-free tablets (catalog 11873580001). Use EDTA-free variant because EDTA chelates the Ca²⁺ needed for MNase activity. Critical detail.
- **Spermidine, spermine** — for nuclei extraction buffer. Standard, confirm stock.

#### 6. Optional / conditional

- **HRV3C (PreScission) protease, commercial** — ~$300 from Sigma (catalog GE27-0843-01) or Cytiva. Only needed if the team decides to cleave MBP off in-house for specific experiments. The default plan is to ship the MBP-fusion form from GenScript uncleaved, based on Aki 2023 FP data showing the fusion binds fine. Buy this only if a specific experiment reveals a need.
- **Epicypher H3K4me2 and H3K4me3 dNucs** — nice-to-have if Grey wants to test MSH6 Tudor specificity (is it really H3K4me1-selective, or does it also bind me2/me3?). Aki's 2023 FP data already addressed this for isolated Tudor; repeating on nucleosomes would confirm in a chromatin context. Budget for later, not round 1.

### Tier 3: confirm exists in lab inventory

Nothing to order if these are already stocked, but worth confirming before the proteins arrive:

- [ ] Arabidopsis nuclei extraction buffers (NPB, NEB2, NEB3) — Vianney already uses these for CUT&Tag
- [ ] High-molecular-weight DNA extraction pipeline validated (ideally giving >50 kb average fragment length post-shearing for Fiber-Seq input)
- [ ] Ca²⁺-free buffer stocks (Tris-NaCl base) for Tudor-MNase binding step
- [ ] Lambda DNA or a defined HMW control for Nanopore test run
- [ ] Qubit or Nanodrop for protein/DNA quantitation
- [ ] Standard gel boxes, agarose, DNA ladders (for activity QC gels)

## Current status (2026-04-11)

| Item | Status |
|------|--------|
| Round 1 GenScript order (U9375BAEG0) data analyzed | Done. Wild-type Tudor-HiA5 failed (<0.06 mg). Solubility-partner hypothesis confirmed by the yield pattern. See `~/Dropbox/Research/tudor-fusion-proteins/round2_design/round1_analysis.md` |
| Round 2 constructs designed | Done. A, C, E, F. Architecture = M + MBP + HRV3C site + Tudor (WT or 3A) + (G4S)4 linker + enzyme + 6xHis |
| Sequence provenance verified | Done. Tudor is byte-identical to Satoyo round 1, MSH6_tudor_domains.fa published entry, and a contiguous slice of AtMSH6 residues 119-184 (UniProt O04716). See `~/Dropbox/Research/tudor-fusion-proteins/round2_design/verify_tudor.py` output |
| GenScript round 2 quote request drafted | Done. `draft-20260411-genscript-tudor-round2` in the Grey Matter queue, pending review |
| Construct visualization files | Done. FASTA (full + cleaved), annotated GenBank (.gp), and standalone HTML viewers at `~/Dropbox/Research/tudor-fusion-proteins/round2_design/construct_designs/` |
| AlphaFold structure prediction | In progress. Inputs prepped at `alphafold_inputs/`. Running Boltz locally, Farm AF3 setup underway |
| In-house QC SOP written | Not started |
| CUT&RUN protocol written (for Tudor-MNase) | Not started. Based on Skene & Henikoff 2017 eLife |
| DiMeLo-Seq protocol written (for Tudor-HiA5) | Not started. Based on Altemose 2022 DiMeLo-Seq paper |
| Nanopore sequencer purchased | Not yet. Grey decided on 2026-04-11. Order ASAP |

## Timeline

Working backward from the NSF EAGER NCE 2 end date (2026-05-31):

```
2026-04-11 (now) ┃ Round 2 design complete, draft email prepared
                 ┃
2026-04-14/15    ┃ Grey reviews and sends GenScript quote request
                 ┃
2026-04-17/18    ┃ Quote received, PO submitted through UC Davis
                 ┃ Epicypher nucleosome order + Nanopore order on same PO
                 ┃
2026-04 → 05     ┃ GenScript production (~6 weeks estimated)
                 ┃ Vianney and Grey write QC + CUT&RUN + DiMeLo-Seq SOPs
                 ┃ Vianney validates HMW DNA pipeline for Fiber-Seq
                 ┃ Grey completes Nanopore install and training
                 ┃
2026-05-29 (est) ┃ Proteins ship from GenScript
                 ┃
2026-05-31       ┃ NSF EAGER NCE 2 ends (funds no longer drawable after)
                 ┃
2026-06-02 → 05  ┃ Proteins arrive, in-house activity QC (week 1)
                 ┃
2026-06-08 → 14  ┃ Designer nucleosome targeting test (week 2)
                 ┃
2026-06-15 → 28  ┃ First Arabidopsis nuclei experiments, concentration
                 ┃ titration, WT vs 3A comparison (2 weeks)
                 ┃
2026-06-30       ┃ Vianney departs
                 ┃
2026-07 onward   ┃ Grey continues: biological replicates, Nanopore
                 ┃ DiMeLo-Seq runs, CUT&RUN paired-end library prep,
                 ┃ data analysis, manuscript
```

**The critical date to respect:** Vianney and Grey need ~3 weeks of overlapping wet-lab time with the new reagents. Any slippage on the GenScript production compresses that window. If production takes 8 weeks instead of 6, proteins arrive ~2026-06-12 and the overlap with Vianney shrinks to 2 weeks.

## Checklists

### Before sending the GenScript quote request

- [x] Verify Tudor sequence matches round 1 Satoyo design (byte-for-byte)
- [x] Verify Tudor matches the published AtMSH6 domain
- [x] Verify 3A substitutions at the correct binding-pocket residues (W133, Y140, Y158)
- [x] Verify MBP sequence is canonical E. coli mature MalE (UniProt P0AEX9)
- [x] Verify MNase sequence is canonical S. aureus mature thermonuclease (UniProt P00644)
- [x] Confirm Aki's 2023 FP data validates the MBP-fusion form retains binding (EC50 ~36 µM)
- [x] Attach .gp annotated GenBank files for biochemist review
- [x] Inline full FASTA sequences in email body
- [x] Preserve reply thread with Sophie Yang
- [ ] **Grey reviews and sends** the draft

### While GenScript is producing (weeks 1–6)

- [ ] Vianney writes Tudor-MNase CUT&RUN SOP (based on Skene & Henikoff 2017 eLife, not the CUT&Tag protocol)
- [ ] Vianney writes Tudor-HiA5 DiMeLo-Seq SOP (based on Altemose 2022)
- [ ] Grey sets up Nanopore sequencer, completes basecalling / mod-calling training
- [ ] Confirm HMW DNA extraction pipeline gives reliable yield (>50 kb average fragment length post-shearing for Fiber-Seq)
- [ ] Grey shadows Vianney through full Arabidopsis nuclei prep protocol
- [ ] Epicypher nucleosomes arrive and are stored at -80 °C
- [ ] Dedicated Ca²⁺-free buffers prepared for Tudor-MNase workflow; quench buffer with EGTA prepared
- [ ] Run AlphaFold on the 4 constructs (Boltz locally or AF Server or Farm); review pocket accessibility and domain geometry
- [ ] Review GenScript in-progress updates (SDS-PAGE, expression check) when Sophie sends them

### When the proteins arrive (week 7+)

- [ ] Aliquot each construct into single-use portions at -80 °C (one fresh aliquot per experiment to avoid freeze-thaw)
- [ ] **Day 1:** Run SDS-PAGE on each protein alongside the expected molecular weight marker. Confirm size, purity visually.
- [ ] **Day 1–2:** Hia5 activity QC — incubate protein + SAM + linear DNA, digest with DpnI, run on gel. Both A and E should show activity (3A kills Tudor binding, not Hia5 catalysis).
- [ ] **Day 1–2:** MNase activity QC — incubate protein + supercoiled plasmid + 2 mM CaCl₂, quench with EGTA, run on gel. Both C and F should show laddering.
- [ ] **Day 3–5:** Designer nucleosome targeting test — mix WT and 3A reagents with Epicypher H3K4me1-modified vs unmodified nucleosomes. Key readout: WT preferentially acts on modified, 3A does not discriminate. This is the critical "it works" experiment.
- [ ] **Day 6–10:** Concentration titration on Arabidopsis nuclei (dilution series of each reagent to find the working concentration window)
- [ ] **Day 11–14:** First paired WT vs 3A experiment on Arabidopsis nuclei at the working concentration, with proper biological replicates planned for later

### Beyond the NCE (July 2026+)

- [ ] Full WT vs 3A experiment with ≥ 3 biological replicates (CUT&RUN side)
- [ ] Full WT vs 3A DiMeLo-Seq experiment with Nanopore readout, using HMW DNA from matched samples
- [ ] Cross-validate CUT&RUN and DiMeLo-Seq signal overlap on the same biological samples
- [ ] Draft figures for NSF final report and/or manuscript
- [ ] Consider ordering additional reagents (tandem-Tudor design, engineered affinity-matured Tudor variants) if the weak EC50 becomes a bottleneck

## Experimental strategy overview

### The CUT&RUN side (Tudor-MNase, construct C)

Tudor-MNase is added to permeabilized Arabidopsis nuclei in Ca²⁺-free buffer. The Tudor domain docks onto H3K4me1-containing nucleosomes. After a binding/wash phase, Ca²⁺ is added to activate MNase, which cleaves DNA immediately adjacent to the bound nucleosome. Reaction is quenched with EGTA, nuclei are lysed, short fragments are recovered and Illumina-sequenced. Peak calling reveals the genomic footprint of H3K4me1-associated regions as reported by MSH6 Tudor binding.

**Matched negative control (construct F, 3ATudor-MNase):** same protocol, but the 3A mutations abolish H3K4me1 binding. Any signal in this lane is background (nonspecific DNA cleavage, incomplete targeting, etc.). The WT - 3A difference is the targeted-cleavage signal.

### The DiMeLo-Seq side (Tudor-HiA5, construct A)

Tudor-HiA5 is added to permeabilized nuclei in a buffer containing SAM (the methyl donor). The Tudor domain docks onto H3K4me1 nucleosomes. HiA5 continuously deposits m6A marks on nearby DNA (non-sequence-specific). Unlike MNase, HiA5 does not need a trigger — activity is constant. Reaction is stopped, nuclei are lysed, **HMW DNA is extracted without fragmentation**, and run on Nanopore. Basecalling with m6A modification calling (Dorado or similar) reveals where m6A was deposited along each long read, identifying the in-nucleo footprint of MSH6 Tudor binding at single-molecule resolution.

**Matched negative control (construct E, 3ATudor-HiA5):** same protocol with the binding-knockout variant. Background m6A should be uniform across reads. The WT - 3A difference is the targeted methylation signal.

**The Nanopore purchase enables this side of the project** — without in-house long-read sequencing, Fiber-Seq / DiMeLo-Seq requires outside sequencing cores (UC Davis DNA Tech Core or similar) which adds weeks of turnaround per experiment. An in-house MinION lets Vianney / Grey run a DiMeLo-Seq experiment and see results the same week.

### The weak-affinity consideration

MSH6 Tudor binds H3K4me1 with EC50 ~36 µM (Aki 2023 FP data). That is on the weak end for chromatin readers. Practical implications:

- Working protein concentrations on nuclei will need to be in the low-µM to tens-of-µM range (compare to pM antibody concentrations in traditional CUT&RUN). Plan to order enough protein for a titration series on the first experiments.
- Signal-to-noise will depend on the matched 3A negative control being run in parallel. Do not rely on absolute signal — rely on the WT - 3A ratio.
- If the weak affinity is a bottleneck for biology-quality data, the future redesign path is a tandem Tudor fusion (Tudor-Tudor-enzyme) or an affinity-matured engineered Tudor variant (NSF EAGER Aim 4 territory). These are follow-on orders, not round 2.

## Critical technical notes

1. **MNase is Ca²⁺-activated.** Tudor-MNase is not a drop-in replacement for Tudor-Tn5 in the existing CUT&Tag protocol. Binding buffer must be Ca²⁺-free (or EGTA-containing) until you want cleavage. Cleavage is triggered with 2 mM CaCl₂. Reaction is quenched with 5 mM EGTA or EDTA. Cross-contamination from Ca²⁺ in nearby buffers can cause premature cleavage — use dedicated labware for this workflow.

2. **HiA5 needs SAM.** Tudor-HiA5 requires S-adenosyl methionine (SAM) in the reaction buffer as the methyl donor. Without SAM, no m6A is deposited regardless of binding. Confirm SAM stock is fresh (SAM degrades over time at -20 °C).

3. **DpnI digestion readout for HiA5 activity.** DpnI cuts G[m6A]TC but not GATC. Mix Tudor-HiA5 with naked plasmid DNA + SAM, incubate, then add DpnI. If the plasmid is cut, Tudor-HiA5 methylated it. Simple and cheap in-house QC.

4. **Post-HRV3C cleavage scar.** Constructs A/C/E/F as currently designed start with `(GP)Tudor...` after HRV3C cleavage (if we ever cleave them). The `GP` scar is on the N-terminus of the Tudor domain and is outside the aromatic binding pocket, so it does not affect function.

5. **HMW DNA for DiMeLo-Seq is the weak link on the Tudor-HiA5 side.** Fiber-Seq / DiMeLo-Seq requires long intact DNA fragments (>50 kb, ideally >100 kb) for Nanopore library prep. Standard extraction protocols (CTAB, DNeasy) produce 10-30 kb fragments. The lab's HMW pipeline needs to be validated before the Tudor-HiA5 experiment will give useful data.

## Resources

- AnchorTag proteins *(vault)* — active card with round 1 order history and round 2 reorder status
- Tudor-MNase design and order *(vault)* — parallel active card, now folded into the round 2 order
- NSF EAGER "Cracking the Histone Code" — the grant funding this work
- GenScript — vendor knowledge card with account details
- Susan Hendrickson (UC Davis purchasing) — UC Davis purchasing contact
- [[vianney-ahn]] — Jr. Specialist running the wet lab
- [[satoyo-oya]] — postdoc, round 1 construct designer, in Germany

### Working directory

`~/Dropbox/Research/tudor-fusion-proteins/`

```
tudor-fusion-proteins/
├── README.md
├── benchling_export_2026-04-11/     Satoyo's round 1 construct sequences
├── genscript_round1_archive/         CoA, order reports, gel images
└── round2_design/
    ├── build_constructs.py           Deterministic FASTA assembly
    ├── build_visualization.py        Annotated GenBank + HTML viewers
    ├── round1_analysis.md            Data-driven round 1 analysis
    ├── mnase_reference.md            MNase sequence provenance
    ├── additional_considerations.md  Strategic observations (read this)
    ├── reference_sequences/          Raw UniProt FASTAs for MBP, MNase
    ├── alphafold_inputs/             FASTAs ready for AF server / Boltz / Farm
    └── construct_designs/            Output: FASTA + GenBank + HTML for each construct
```

## Related protocols (to be written)

- Tudor-MNase CUT&RUN SOP *(to be written)* (to be written by Vianney before protein arrival)
- Tudor-HiA5 DiMeLo-Seq SOP *(to be written)* (to be written by Vianney before protein arrival)
- Tudor-fusion in-house QC SOP *(to be written)* (to be written by Vianney before protein arrival)
- HMW DNA extraction for Fiber-Seq *(to be written)* (may already exist in wet-lab section section)
- Nanopore MinION setup and run *(to be written)* (to be written once Nanopore hardware arrives)
