---
type: protocol
title: "Fiber-Seq / DiMeLo-Seq"
---

# Fiber-Seq / DiMeLo-Seq

Overview of Fiber-Seq

Structure of chromatin fibers:

- Chromatin fiber = 3D organization of chromatin wrapped around histones

- Map 3D organization “...at the level of individual linear chromatin molecules”

- Primary architecture of chromatin onto its underlying DNA template → i.e. how regulatory DNA is actuated on individual chromatin fibers

Fiber-seq enables nucleotide-precise chromatin accessibility, TF occupancy, and nucleosome occupancy patterns on individual multi-kilobase chromatin fiber

- Nonspecific (non–sequence context dependent) N6-adenine DNA methyltransferase (m6A-MTase)
- Chromatin Accessibility → regions of abundance 6mA

- “Non-chromatinized DNA”

- Chromatin = organization/complex of DNA bound to proteins (histones)
- Non-chromatinized DNA refers to DNA that is not associated with histones (e.g. bacteria)
- Check if the mA-MTases show any preference for non-chromatinized DNA, since they are native to bacterial species which lack histones.

- A protein footprint shows up as a localized region of reduced or absent methylation along a single long DNA molecule, because a bound protein physically blocks the methyltransferase from accessing the DNA

- Example: reduced 6mA overlapping TF binding motifs
- The typical “protected” length is dependent on the binding motif (?)
- Look at sequence data of binding motifs, proximity to TSS, promoters, etc.

Nucleosome Occupancy?

- Typical protected length is nucleosome-lengths (~150bp)
- Nucleosomes are separated by LINKER DNA
- Recurrent ~150bp regions of low/absent 6mA → indicates nucleosome occupancy

Nucleosome Positioning

- Controlled by combo of factors, including DNA sequence, competitive occupancy of TFs, nucleosome remodelers, interaction w/ RNA polymerases
- “well-positioned nucleosomes largely originated from fibers in which the regulatory element is in an actuated state”

- “Regulatory DNA actuation” = all or none adoption of nucleosome-free state resulting in hyperaccessibility of underlying DNA
- “DNA actuation” (fig 3C)

- Active modification to or marking of DNA in a controlled/regulatory manner to report chromatin state along single DNA molecules
- nucleosome positioning relative to regulatory sites (TSS, promoter, etc.)

- Accessible promoters
- TSS-disal DHS

DNase I-hypersensitive sites = DHS (another method for marking accessible DNA templates)

Methylase-accessible DNA sequences = MADs

- Compare the distribution of nonspecific m6A sites (MADs) with that of DHS

- Validate open chromatin state overlapping with DHS

- “The m6A-MTase – treated sample yielded an average coverage of 43 fibers for each DHS, with the average number of m6A-marked bases on each fiber overlapping a DHS mirroring the density of DNase I cleavages quantified by DNase I–seq from bulk nuclei”

- DHSs is a more global/wider indication of accessible chromatin VS MTase allows specific/targeted methylation
- MTases allow for nucleosome demarcation (i.e. boundaries b/w nucleosomes which coincides with closed state in DHS data)

- “...[categories] of (MADs) were evident:

- (i) sequence elements with an average length of 272 bp that coincided with DHSs and
- (ii) far more numerous shorter sequence elements with an average length of 67 bp and regularized spacing, paralleling the expected size and distribution of internucleo-somal linker regions”

Comparisons to ATAC-Seq, DNaseI-Seq?

---

→ How are reads analyzed?

[https://fiberseq.github.io/](https://fiberseq.github.io/)

[https://link.springer.com/article/10.1186/s13059-025-03592-9](https://link.springer.com/article/10.1186/s13059-025-03592-9)

- Collect 6mA info from PacBio reads -- MM tag or predict 6mA

- PacBio Jasmine

- Nucleosome Occupancy - FiberHMM

- TF footprints

- Fiber-seq Informed Regulatory Elements (FIREs)

- FIREs are MTase sensitive patches (MSPs) that are inferred to be regulatory elements on single chromatin fibers
- i.e. very accessible

---

→ Why does % of 6mA matter?

- If %6mA is too high, risk of overlabelling → hard to resolve what regions are accessible VS not if there is high levels of background 6mA
- PacBio:

- “Consistent with the literature and our QC metrics, for a typical Fiber-seq experiment, we targeted a working range of ~5–7% 6mA because it balances footprint resolution with avoidance of over-labeling (Figure 6)”
- Within putative FIREs, the fraction of 6mA per A/T increases with higher enzyme input (Figure 7; Table 2), supporting improved TF-footprint resolution at higher—but still moderate—labeling levels.

- Test by looking at inferred nucleosome lengths -- if too short than the known nucleosome length, it is likely that there is overlabelling

Optimizing %6mA to look at protein-DNA binding:

- Look at % of 6mA modifications per total # of A/T pairs within all putative FIRE regions

- Papers that use Fiber-Seq for DNA-binding proteins:

- [https://www.nature.com/articles/s41588-024-02067-0](https://www.nature.com/articles/s41588-024-02067-0)
- [linkinghub.elsevier.com/retrieve/pii/S1097276524006671](http://linkinghub.elsevier.com/retrieve/pii/S1097276524006671)
- [https://www.sciencedirect.com/science/article/pii/S2666979X25000758?via%3Dihub](https://www.sciencedirect.com/science/article/pii/S2666979X25000758?via%253Dihub)

Fiber-Seq Experiments

### Validate activity of Hia5 Enzymes

03.06.26

Protein List

| Name | Conc (mg/ml) | Purity (%) | nM Stock |
| --- | --- | --- | --- |
| Hia5  \* | 0.0029 | <30 | 81.68553884 |
| pA-Hia5 | 0.038 | 95 | 720.5840523 |
| pAG-Hia5 | 0.068 | 85 | 1133.276669 |
| Tudor-Hia5 \* | 0.0029 | <30 | 65.32855759 |
| 3ATudor-Hia5 | 0.028 | 70 | 635.0358342 |
| Epicypher Hia5 |  |  |  |
\* omitted for now, due to lack of protein stock….

Note: the Epicypher Hia5 concentration is unknown.

The working protein amount for the Fiber-Seq protocol is 2ul Hia5 stock per 1 million nuclei.

The DiMeLo-Seq protocol recommends a working protein concentration of 200nM in 200ul for 1-5 million nuclei. 50nM is ¼ the working conc.

If Fiber-Seq is similar to an ATAC-Seq → that means that DiMeLo-Seq requires higher input of (\_)-Hia5 than in Fiber-Seq protocol.

###

###

###

### Validate activity of synthesized Hia5 protein

- Restriction enzyme DnpI only cuts GATC sites when A is methylated (DamID)
- Incubate HMW DNA with pA/G-Hia5 with SAM, then DpnI digestion to confirm methyltransferase activity
- Apply method to artificial chromatin

- 601 sequence = a 147-bp artificial nucleosome-positioning DNA sequence
- Shows protection from methylation at 601 sequence/nucleosome positions → will this be an issue to map histone PTMs?

- Compare mA/A in free pA/G-Hia5 condition vs antibody-directed in regions that are and are not protected by nucleosomes.

Modified from [this protocol](https://www.protocols.io/view/purification-and-activity-testing-for-nanobody-hia-g3iibykcf.html) to test nanobody-Hia5 fusions:

We need to test 2 key functions of the (protein)-Hia5 fusions: (1) methyltransferase activity and; (2) protein-mediated target binding. The following assay tests methylation by checking for DpnI digestion of DNA after MTase treatment. Verify target binding via DiMeLo-Seq protocol?

| HMW DNA | a ul for 100-150ng per rxn |
| --- | --- |
| Purified (protein)-Hia5 | Titrate diff concentrations; 20ul MTase rxn volume: 25nM, 50nM, 100nM |
| SAM, up to 160uM | 1ul of 32mM stock to 200ul of Activation Buffer |
| 1X rCutSmart Digestion Buffer  (make 1 additional rxn for sufficient volume) | Mix 12ul of 10X rCutSmart + 108ul of H2O. |
| DpnI (NEB) | 1ul per rxn |
1. Prepare 200ul of the Activation Buffer, making sure to add x ul of SAM (final concentration 160uM). Treat the \*HMW DNA sample in 20ul of this buffer at 37C for 1h, testing various concentrations of the protein-Hia5 fusion: 25nM, 50nM, and 100nM.

- \*Note: the original protocol uses 2ul/reaction of ONT’s bacterial lambda DNA for this assay (50ng/ul \* 2ul = 100ng).
- Note: the concentration of SAM for the activity assay differs from the DiMeLo-Seq protocol.
- For the Fiber-Seq protocol (Epicypher), Hia5 stock amount:

“Transfer 1,000,000 nuclei to a PCR tube and bring the volume up to 56.5 µL with 1× Reaction Buffer.

Add 1.5 µL 32 mM SAM and 2 µL Hia5 to each reaction. The final reaction volume per tube should now be 60 µL. Note: SAM is a highly labile reagent and prone to degradation with repeated freezethaw cycles. Always use fresh, high-grade SAM for Fiber-seq labeling reactions to ensure optimal performance.

=> 0.67ul of Hia5 stock to 20ul, but reaction only lasts 10 minutes

Pipette gently to mix. Incubate reaction for 10 min at 25°C. We recommend using a thermocycler for this incubation for optimal labeling efficiency.

After 10 min at 25°C, stop the reaction by adding 6 µL 10% SDS. Vortex to mix.

Add 34 µL of 1× Reaction Buffer to bring the volume to 100 µL and proceed to gDNA extraction.”

2. During the MTase treatment, prepare the digestion buffer (1X NEB rCutSmart or older CutSmart).

- For 4rxns: 120ul of 1X buffer ; 140ul

3. Add 30ul of digestion buffer, 1ul of DpnI per rxn and pipette with a wide-bore tip to mix well, and incubate at 37C for 1h.

- For the no digestion (negative ctrl) conditions, use (r)CutSmart alone.

4. Load [[agarose]] gel of MTase-treated digested sample:

- Prepare a 1% agarose gel during the digestion incubation step.
- Run samples at 120B for 45 min, using as much of the sample that fits into each well.

1. Original DNA input
2. Negative control - no DpnI
3. Negative control - with DpnI
4. 25nM
5. 50nM
6. 100nM

- Expected result: 1-2 should be the same, and shorter fragments for 3-5.
- Complete digestion of HMW DNA at 25nM MTase will indicate high enzyme activity

Activation Buffer

|  | Final [ ] | Stock [ ] | To make 50ml | 10ml |
| --- | --- | --- | --- | --- |
| Tris, pH 8.0 | 15mM | 1M | 750ul | 150 ul |
| NaCl | 15mM | 5M | 150ul | 30ul |
| KCl | 60mM | 1M | 3ml | 0.6 |
| EDTA, 0.5 M, pH 8.0 | 1 mM |  | 100 uL | 20ul |
| [[egta]], 0.5 M, pH 8.0 | 0.5 mM | 0.5M | 50 uL | 10ul |
| [[spermidine]], 6.4 M  or   2M | 0.05 mM | 6.4M | 0.391 uL      or  1.25 ul | 0.08 ul      or  0.25ul |
| BSA | 0.1% | - | 50 mg | 10mg |
| H2O | - | - | fill to 50 mL | Fill to 10ml |
| SAM, 32 mM | 800 uM | 32mM | (\*add at activation step) |  |
Results

| Reaction | HMW DNA input | MTase | Restriction Enzyme |
| --- | --- | --- | --- |
| Forgot to include as part of incubations | 50ng  (13-3 B) | NONE | NONE |
| NULL | 50ng | NONE | DpnI |
| A | 50ng | pAG-Hia5 – 25nM  0.44uL | DpnI |
| B | 50ng | pAG-Hia5  – 50nM, 0.88uL | DpnI |
| C | 50ng | pAG-Hia5  – 100nM, 1.76uL | DpnI |
| D | 50ng | Epicypher Hia5    0.33ul | DpnI |
| E | 50ng | Epicypher Hia5  0.67ul | DpnI |
| F | 50ng | Epicypher Hia5  1ul | DpnI |
---

Results from 03.16.2026

- Used 0.5ul of each Hia5 stock per rxn.

| Reaction | HMW DNA input | MTase | Incubation time | Restriction Enzyme |
| --- | --- | --- | --- | --- |
| 0 | Raw DNA (13-3 A) |  |  |  |
| 1 | 100ng | NONE | 90 min | NONE |
| 2 | 100ng | NONE | 90 min | DpnI |
| 3 | 100ng | Epicypher Hia5 | 5 min | DpnI |
| 4 | 100ng | Epicypher Hia5 | 10 min | DpnI |
| 5 | 100ng | Epicypher Hia5 | 30 min | DpnI |
| 6 | 100ng | Epicypher Hia5 | 60 min | DpnI |
| 7 | 100ng | Epicypher Hia5 | 60 min | NONE |
| 8 | 100ng | Epicypher Hia5 | 90 min | DpnI |
| A | 100ng | pAG-Hia5 | 5 min | DpnI |
| B | 100ng | pAG-Hia5 | 10 min | DpnI |
| C | 100ng | pAG-Hia5 | 30 min | DpnI |
| D | 100ng | pAG-Hia5 | 60 min | DpnI |
| E | 100ng | pAG-Hia5 | 90 min | DpnI |
### Overview of Materials & Previous Results

|  | PacBio | Epicypher |
| --- | --- | --- |
| Nuclei / Cell Input | 1.8 million | 1 million |
| Hia5 | Epicypher CUTANA Hia5 | Epicypher CUTANA Hia5 |
| S-adenosylmethionine (SAM) | New England Biolabs B9003S  32mM | New England Biolabs B9003S  32mM |
| DNA Extraction | Extracting HMW DNA from cultured adherent cells using Nanobind® kits | Monarch Spin gDNA Extraction Kit (NEB T3010S / T3010L) |
| Library Prep | Preparing whole genome and metagenome libraries using SMRTbell prep kit 3.0    Using 3.5 ug of DNA input | Variable  In general, 0.5-2 µg of gDNA is typically required for library preparation. However, this is dependent on the LRS platform you intend to use to sequencing your Fiber-seq libraries. Please refer to the recommendations provided by the LRS platform you are using for applications involving direct or native whole genome sequencing. |
| Sequencing |  | 30X coverage |
PacBio tested with 0.25 - 8X Hia5 input:

- % 6mA increases with greater Hia5 input
- Null-controls (in human cells) show false-discovery rate (FDR) <1%

- Look at previous arabidopsis HiFi data that we have to check FDR for 6mA and check for any potential endogenous 6mA

- ### Scaling the Fiber-Seq reaction:

- ### The standard Fiber-seq labeling reaction is optimized to achieve ~6% 6mA labeling in 1,000,000 human nuclei.
- ### The Hia5 reaction generally follows Michaelis-Menten kinetics, meaning it scales proportionally with the amount of substrate (i.e., DNA). If you are using more than the equivalent of 1,000,000 human nuclei (e.g., > ~1,200,000 mouse nuclei) in a Fiber-seq reaction, the reaction volume and reagents should be increased proportionally to the additional nuclei to be used.

Library Prep:

- “Library preparation and sequencing (platform dependent) Follow LRS provider recommendations for shearing, library preparation, and instrument loading. Each sample should be sequenced to achieve 30× coverage. If haplotype phased data is desired, samples should be sequenced to achieve 30× coverage per haplotype (i.e., 60× coverage for diploid cell types).”

- This is the current protocol / kit we have in the lab: HiFi plex prep kit 96

- 300ng

###

---

###

### Fiber-Seq Test Using Arabidopsis Samples

​[https://www.pnas.org/doi/10.1073/pnas.2516708122](https://www.pnas.org/doi/10.1073/pnas.2516708122) protocol in Arabidopsis & maize

Adjust nuclei input for genome size:

(Recommendation from Epicypher: Keep the reaction volume and enzyme concentration the same, but adjust the number of nuclei to match the total DNA input of 1,000,000 human nuclei.)

| Organism | Genome Size | Genome Size Relative to Human | Nuclei Input per 60ul Reaction |
| --- | --- | --- | --- |
| Human | 3,200 Mb | 100% | 1 million |
| Drosophila | 143.7 Mb | 4.5% | 22, 270, 000 |
| Arabidopsis | 130 Mb | 4.06% | 24, 615, 000 |
| Walnut |  |  |  |
| Pistachio |  |  |  |
- For Arabidopsis, the in-house protocol using ~100mg of tissue yields 300,000 - 600,000 nuclei. For the desired target input, need to start with ~5-6g of tissue  = means need to scale up nuclei extraction protocol.
- Is it possible to SCALE DOWN the reactions for Arabidopsis?

- Test using 1/2 and 1/4 reaction volumes / input

Modified Nuclei Extraction:

- Scale-up the in-house protocol

- PacBio TissueRuptor protocol

- Protocol from PNAS article → uses 500mg of input…

- “For Arabidopsis, maize B73, and Jing724, approximately 500 mg of fresh tissue was ground into a fine powder in liquid nitrogen and
- incubated with 5 mL of nuclei isolation buffer (0.25 M sucrose, 10 mM Tris-HCl, 10 mM MgCl₂, 1% [[triton-x-100]], 5 mM β-mercaptoethanol, and 1× protease inhibitor cocktail) on ice for 20 min.
- The lysate was filtered through a 30 μm MACS SmartStrainer (Miltenyi Biotec, Cat. #130-098-458) and centrifuged at 3,000 × g for 15 min at 4 °C to pellet the nuclei.
- The pellet was gently resuspended in 5 mL of nuclei isolation buffer and centrifuged again under the same conditions. The supernatant was discarded, and the nuclear pellet was retained for subsequent steps (3).”

Check that 6mA labelling was successful:

I took a small aliquot of HMW DNA treated with Hia5 after DNA extraction and incubated with DpnI to confirm 6mA labelling.

Metrics to look at:

- % 6mA ….

- Overall
- In FIRE regions

- Predicted nucleosome lengths VS frequency/density (esp important for 1/2 and 1/4 rxns)

---

03.18.2026

“The Hia5 reaction generally follows Michaelis-Menten kinetics, meaning it scales proportionally with the amount of substrate (i.e., DNA). If you are using more than the equivalent of 1,000,000 human nuclei (e.g., > ~1,200,000 mouse nuclei) in a Fiber-seq reaction, the reaction volume and reagents should be increased proportionally to the additional nuclei to be used.”

- Protocol doesn’t recommend below 1 million equivalents of human nuclei, but will test.

Sample list: Col-0 seedlings from -80C

1. 24, 615, 000 nuclei input

- 2ul Hia5 (1X)
- 60 ul reaction volume (up to 56.5ul for nuclei)
- 0.8 mM SAM (1.5ul of 32mM SAM)

2. 1/2 input = 12, 310, 000 nuclei

- 1ul Hia5
- 30 ul reaction volume (up to 28.25ul for nuclei)

- Lots of nuclei; need to make sure that the nuclei are fully submerged in liquid.

- 0.75ul of SAM at 32mM
- 3ul of 10% SDS to stop the reaction.

- Add 67ul of 1x rxn buffer to bring the final volume up to 100ul before proceeding to DNA extraction.

DNA extraction: Monarch Spin gDNA Extraction Kit

Lysis - need to lyse nuclei & cleanup proteins

- While SDS is enough to quench the MTase activity, may need additional cleanup to remove proteins / RNA and sufficiently lyse nuclei.

1. Add 1 µl Proteinase K and 3 µl RNase A to the resuspended pellet and mix by vortexing briefly to ensure the enzymes are efficiently dispersed.

\*Do not add the enzymes and the Cell Lysis Buffer simultaneously, as the high viscosity of the lysate will prevent equal distribution of the enzymes.\*



2. Add 100 µl Cell Lysis Buffer and vortex immediately and thoroughly. The solution will rapidly become viscous.

3. Incubate for 5 minutes at 56°C in a thermal mixer with agitation at full speed (2000 rpm, or maximum speed available). If an incubator with agitation is not available, use a heating block and vortex once or twice during the incubation.

DNA extraction/purification:

- Elute in pre-heated buffer (55C)
- \*Check fragment size distribution after! This protocol uses high centrifugation speeds. If there is too much shearing, alternate to PCI extraction.

Nuclei Extraction

1 = 350 - 400mg tissue

2 = 700 - 800 mg tissue

Left: A1 and A2 nuclei isolates using the new protocol.

Right: B1 and B2 nuclei isolates using the default CUT&Tag nuclei isolation protocol.

Nuclei from A1, A2, B1, B2 combined, pelleted and resuspended in “ ul” reaction buffer.

Notice that the volume is much larger than target/as written in the protocol, as the nuclei pellet size is much larger …… ….many doubts that the CellDrop is under-counting the nuclei.

NEED TO [OPTIMIZE NUCLEI COUNTING](https://docs.google.com/document/d/1SCxOD0IBdeam4WwZuZ5zC7UfyPRE-9toy1YDwB1vjkY/edit?usp=sharing).

Concentration and 260/280 are ok; however there is a very low 260/230 value → carryover of guanidine salts from column.

Qubit BR concentration:

Nanodrop:

- The protocol / advice is counter-intuitive; says to invert the columns with gDNA wash buffer, yet it says to avoid splashing mixture into upper cap area

- Test gDNA extraction kit with & without inversion on fresh nuclei directly after isolation to see if there is an improvement
- With this contaminated sample, perform SPRI cleanup; following Satoyo’s Collibri cleanup protocol for HMW extraction
- For the next experiment, test the CTAB extraction method alongside columns (?) as referenced by the PNAS experiment.

Samples were frozen at -20C after extraction.

03.23.2026

SPRI-bead based cleanup of DNA.

Used 0.4% SeraMag prepared on 03.09.2026.

Input: 25ul of Fiber-Seq DNA at 20.6ng/ul => ~500ng

Output: 8.00ng/ul in 50ul => 400ng , which is 80% recovery with 260/280 = 1.868 and 260/230 = 2.362.

---

03.25.2026

Part I: Verify Fiber-Seq Test from 03.18.2026

| Reaction | HMW DNA input | MTase | Incubation time | Restriction Enzyme |
| --- | --- | --- | --- | --- |
| 0 | Raw Fiber-Seq gDNA |  |  |  |
| 1 | 50ng (6.25ul) of the Fiber-Seq Test1 DNA | Epicypher Hia5 (0.5ul) | 2 min | DpnI |
| 2 | 50ng | Epicypher Hia5 (0.5ul) | 5 min | DpnI |
| 3 | 50ng | Epicypher Hia5 (0.5ul) | 20 min | DpnI |
| 4 | 50ng | Epicypher Hia5 (0.5ul) | 1 hour | DpnI |
| 5 | 50ng | None | None | DpnI |
| 6 | 50ng | None | None | None, but incubated for 1 hour at 37C for the digestion step. |
---

03.25.2026

Part II: Fiber-Seq using Plant Protocols + Testing Nuclei Inputs

→ Issue with scaling the Fiber-Seq reaction for Arabidopsis → input nuclei amount?

- It is not straightforward to assume that # of accessible chromatin sites scales linearly with genome size, as the Epicypher protocol seems to imply…
- # of open-chromatin peaks in Col-0 seedlings vs human genome (on average, in ATAC-seq data)?

→ Impact of reaction volume?

- 1-6 million nuclei (maize or arabidopsis) + 0.5ul Hia5 in 100ul reaction volume (Li et al. 2025)
- 1 million nuclei (human) + 2ul Hia5 in 60ul reaction volume (Epicypher)

Papers that use Fiber-Seq:

Drosophila

[https://www.biorxiv.org/content/10.1101/2025.10.28.685222v1.full.pdf+html](https://www.biorxiv.org/content/10.1101/2025.10.28.685222v1.full.pdf%2Bhtml)

Plants

[https://www.pnas.org/doi/10.1073/pnas.2516708122](https://www.pnas.org/doi/10.1073/pnas.2516708122) (Nov 2025)

[https://www.nature.com/articles/s41477-025-02002-z](https://www.nature.com/articles/s41477-025-02002-z) (May 2025)

- BOTH papers use the same protocol: 1-6 million nuclei in 100ul of reaction volume, with addition of sucrose in the Hia5 activation buffer.

Fiber-seq data collection

Isolated protoplasts (1–5 million) were spun down at 2,000 g and resuspended in a 100 μl working buffer (400 mM sucrose, 15 mM Tris-Cl, 15 mM NaCl, 60 mM KCl, 1 mM EDTA, 0.5 mM EGTA, 0.5 mM spermidine), with 1.5 μl of 32 mM S-adenosylmethionine added to a final concentration of 0.8 mM along with 0.5 μl of Hia5 MTase (100 U), then carefully mixed by pipetting 10 times with wide bore tips. Reactions were incubated for 10 min at 25 °C, then stopped with 3 μl of 20% SDS (1% final concentration) and transferred to new 1.7 ml microfuge tubes. High molecular weight DNA was then extracted using the Promega Wizard HMW DNA extraction kit A2920. PacBio SMRTbell libraries were then constructed using the manufacturer’s SMRTbell prep kit 3.0 procedure. Two replicate samples were processed.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

Nuclei Isolation

Sample 1 = 500mg tissue (Col-0 seedlings in -80C)

Sample 2, 3 = 1g of tissue

side-by-side

1g

500mg

Notice that there is more green/debris/live cells in the 1g nuclei isolate than the 500mg isolate.

---

Fiber-Seq

Nuclei Inputs Tested:

- 1 million
- 2 million
- 6 million
- 10 million

Top: all nuclei isolated from 2.5g of tissue, suspended in 400ul of Hia5 activation buffer.

Pallet of…..left) 6 million nuclei, right) 10 million nuclei

Issues with DNA purity using NEB gDNA spin kits:

- The nuclei pellet is blocking the filter, making the supernatant (which still contains DNA) not bind to the column and flow through, even at max speed and increased duration.
- Either:

1. Test a different extraction protocol (e.g. CTAB)
2. After lysing the nuclei, centrifuge to separate supernatant (containing DNA) and nuclei pellet, then add to spin columns. (similar to CUT&RUN? But it depends on centrifuge speed + duration.)

---

03.30.2026

Verify 6mA presence in Fiber-Seq samples from 03.25.2026

|  | Reaction | HMW DNA input | MTase | MTase  Incubation time | Restriction Enzyme |
| --- | --- | --- | --- | --- | --- |
| 1 | FS\_1 - 3 | 50ng | None | 10 min | None |
| 2 | FS\_1 - 2 | 50ng | None | 10 min | DpnI |
| 3 | FS\_1 - 1 | 50ng | Epicypher Hia5 | 10 min | DpnI |
| 4 | FS\_2 - 3 | 50ng | None | 10 min | None |
| 5 | FS\_2 - 2 | 50ng | None | 10 min | DpnI |
| 6 | FS\_2 - 1 | 50ng | Epicypher Hia5 | 10 min | DpnI |
| 7 | FS\_6 - 3 | 50ng | None | 10 min | None |
| 8 | FS\_6 - 2 | 50ng | None | 10 min | DpnI |
| 9 | FS\_6 - 1 | 50ng | Epicypher Hia5 | 10 min | DpnI |
| 10 | FS\_10 - 3 | 50ng | None | 10 min | None |
| 11 | FS\_10 - 2 | 50ng | None | 10 min | DpnI |
| 12 | FS\_10- 1 | 50ng | Epicypher Hia5 | 10 min | DpnI |
| 13 | FS\_10S - 3 | 50ng | None | 10 min | None |
| 14 | FS\_10S - 2 | 50ng | None | 10 min | DpnI |
| 15 | FS\_10S - 1 | 50ng | Epicypher Hia5 | 10 min | DpnI |
17 lanes

---

03.30.2026

Validate rest of the Hia5 proteins.

- Hia5
- pA-Hia5
- Tudor-Hia5
- 3ATudor-Hia5

[Link](https://docs.google.com/spreadsheets/d/1pyyHEytcH9aMrAFBdlRdcpj74How3zIu2XH77paRY1I/edit?usp=sharing) to proteins list (used the “Activity Test” tab)

| Reaction | HMW DNA input | MTase | Incubation time | Restriction Enzyme |
| --- | --- | --- | --- | --- |
| 0 | Raw DNA ( ) |  |  |  |
| 1 | 100 ng | NONE | 1 hr | NONE |
| 2 | 100 ng | NONE | 1 hr | DpnI |
| E1 | 100 ng | Epicypher Hia5 | 5 min | DpnI |
| E2 | 100 ng | Epicypher Hia5 | 20 min | DpnI |
| E3 | 100 ng | Epicypher Hia5 | 1 hr | DpnI |
| A1 | 100 ng | Hia5 | 5 min | DpnI |
| A2 | 100 ng | Hia5 | 20 min | DpnI |
| A3 | 100 ng | Hia5 | 1 hr | DpnI |
| B1 | 100 ng | pA-Hia5 | 5 min | DpnI |
| B2 | 100 ng | pA-Hia5 | 20 min | DpnI |
| B3 | 100 ng | pA-Hia5 | 1 hr | DpnI |
| C1 | 100 ng | Tudor-Hia5 | 5 min | DpnI |
| C2 | 100 ng | Tudor-Hia5 | 20 min | DpnI |
| C3 | 100 ng | Tudor-Hia5 | 1 hr | DpnI |
| D1 | 100 ng | 3A-Tudor-Hia5 | 5 min | DpnI |
| D2 | 100 ng | 3A-Tudor-Hia5 | 20 min | DpnI |
| D3 | 100 ng | 3A-Tudor-Hia5 | 1hr | DpnI |
Gel 1:

Gel 2 (re-run w/ more DNA; sample 1 omitted from gel):

DiMeLo-Seq Experiments

Related Methods - Hi-C

Hi-C, CiFi … iterative, building on 3C

[https://www.cd-genomics.com/epigenetics/resource-hi-c-protocols-analysis-guide.html](https://www.cd-genomics.com/epigenetics/resource-hi-c-protocols-analysis-guide.html)

[https://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2024.1377238/full](https://www.frontiersin.org/journals/genetics/articles/10.3389/fgene.2024.1377238/full)

[https://www.nature.com/articles/s41592-021-01248-7](https://www.nature.com/articles/s41592-021-01248-7)

[https://www.cell.com/trends/biochemical-sciences/fulltext/S0968-0004(18)30060-4](https://www.google.com/url?q=https://www.cell.com/trends/biochemical-sciences/fulltext/S0968-0004(18)30060-4&sa=D&source=editors&ust=1775198821418617&usg=AOvVaw1-lDpaNUbriatgvvRQ3r4W)

(more method-based) [https://pmc.ncbi.nlm.nih.gov/articles/PMC3874846/](https://pmc.ncbi.nlm.nih.gov/articles/PMC3874846/), [https://www.sciencedirect.com/science/article/pii/S1046202312001168](https://www.sciencedirect.com/science/article/pii/S1046202312001168)

Overview of method (Hi-C):

1. Formaldehyde fixation - to coagulate proteins involved in chromatin interactions
2. Restriction enzyme digestion (e.g. EcoR1, HindIII) - to cut genome into ~4000bp fragments

- How does fragment size affect sequencing resolution? Downstream analysis?
- Any bias due to restriction enzyme(s) used?

3. End repair & mark with biotin labels
4. Ligation to form loops (‘chimeras’) between interacting fragments
5. Protein of the linked DNA fragments then digested to obtain cross-linked fragments (de-crosslinking)
6. Biotin is removed from the ends of linear fragments and the molecules are fragmented to reduce their overall size.
7. Molecules with internal biotin incorporation are pulled down with streptavidin coated magnetic beads.
8. Adapter ligation, library amplification.
9. Quantitation of chromatin interactions is achieved through massively parallel deep sequencing.

→ Chromatin interactions?

- Cis vs trans-interactions (long-range)
- Cell-type specific
- Chromosomal “territories” or “compartments” (A/B) distinguished by accessibility,  levels of transcriptional activity, histone modification enrichment, etc.

- Chromatin loops = ring-like structures formed by proteins & other molecules that mediate folding of chromatin

- Appears as local dots in chromatin map (0.1 - 1 Mb scale)
- Loop extrusion =

- TADs (topologically associating domains)  = the fundamental structural units of chromatin and the basic regulatory units of the genome, and they are enriched with various regulatory elements and their target genes internally

- …are self-interacting genomic domains ; with less interactions w/ other regions
- TADs are conserved among cell-types
- Cohesin-mediated loop extrusion is stalled at convergent CCCTC-binding factor (CTCF) sites (i.e. maintains the boundaries of TADs)

- Stripe-like patterns anchored at specific sites that block loop extrusion

- Depletion of interactions across blocking sites lead to domain boundations (“insulation”)

→ Interpreting Hi-C data:

[CD genomics guide](https://www.cd-genomics.com/epigenetics/resource-hic-sequencing-heatmaps-genomic-interactiond-chromatin.html)

- Contact maps, interaction maps

- 2 axes represent positions in genome
- Matrix of values describing interactions b/w two regions; represented on a color-scale based on intensity

- e.g. interaction frequency

Data analysis sources:

[https://link.springer.com/protocol/10.1007/978-1-0716-4136-1\_8](https://link.springer.com/protocol/10.1007/978-1-0716-4136-1_8)

[https://link.springer.com/article/10.1186/S13059-015-0831-X](https://link.springer.com/article/10.1186/S13059-015-0831-X)

→ How does Hi-C data improve genome assembly/scaffolding?

[https://pmc.ncbi.nlm.nih.gov/articles/PMC11249255/](https://pmc.ncbi.nlm.nih.gov/articles/PMC11249255/)

→ In silico methods to predict chromatin and RNA organization from genomic sequence:

- C. origami

- [https://www.nature.com/articles/s41587-022-01612-8](https://www.nature.com/articles/s41587-022-01612-8)

- Brandon Gaut’s paper on smRNA structure

- Martin, G. T., Solares, E., Guadardo-Mendez, J., Muyle, A., Bousios, A., & Gaut, B. S. (2023).  miRNA-like secondary structures in maize (Zea mays) genes and transposable elements correlate with small RNAs, methylation, and expression.

Data Analysis

[Start guide](https://fiberseq.github.io/quick-start.html)

PNAS article protocol

Protocol from PNAS article → uses 500mg of input…

Nuclei isolation

- “For Arabidopsis, maize B73, and Jing724, approximately 500 mg of fresh tissue was ground into a fine powder in liquid nitrogen and
- incubated with 5 mL of nuclei isolation buffer (0.25 M sucrose, 10 mM Tris-HCl, 10 mM MgCl₂, 1% Triton X-100, 5 mM β-mercaptoethanol, and 1× protease inhibitor cocktail) on ice for 20 min.
- The lysate was filtered through a 30 μm MACS SmartStrainer (Miltenyi Biotec, Cat. #130-098-458) and centrifuged at 3,000 × g for 15 min at 4 °C to pellet the nuclei.
- The pellet was gently resuspended in 5 mL of nuclei isolation buffer and centrifuged again under the same conditions. The supernatant was discarded, and the nuclear pellet was retained for subsequent steps (3).”

Nucleic acid extraction

- Nuclei were resuspended in 100 μL of working buffer (400 mM sucrose, 15 mM Tris-HCl pH 8.0, 15 mM NaCl, 60 mM KCl, 1 mM EDTA, 0.5 mM EGTA, and 0.5 mM spermidine).
- After counting the nuclei, take 1-6 million nuclei, and normalize the volume to 100 μL with working buffer. To this, 1.5 μL of 32 mM Sadenosylmethionine (SAM; final concentration 0.8 mM) and 0.5 μL of Hia5 MTase (100 U) were added.
- The mixture was gently pipetted 10 times with wide-bore tips to ensure even mixing and incubated for 10 min at 25 °C. The reaction was stopped by adding 3 μL of 20% SDS (final concentration 1%). Genomic DNA was then extracted from nuclei using the cetyltrimethylammonium bromide (CTAB) method (Dataset S12).

Fiber-seq library preparation and sequencing

- HiFi libraries were constructed using the SMRTbell Express Template Prep Kit 3.0 (Pacific Biosciences, #102-182-700). For WT Arabidopsis (replicate 2) and maize B73 and Jing724, DNA was sheared, followed by damage repair, end repair, hairpin adapter ligation, purification, and Pippin HT size selection.
- For the size selection procedure, ‘0.75% Agarose 15-20kb high-pass 75E’ was selected, with the range settings as follows: Start: 15000bp, End: 50000bp. After quality control, a 15 kb HiFi library was obtained and sequenced on the PacBio Revio platform (Pacific Biosciences, USA).
- To evaluate the effect of reduced input material, a 10 kb HiFi library was prepared from WT Arabidopsis (replicate 1) using the SMRTbell Express Template Prep Kit 3.0 (Pacific Biosciences, #102-182-700). The steps included DNA shearing, damage repair, end repair, hairpin adapter ligation, purification, and AMPure PB bead size selection.
- Sequencing was performed on the PacBio Revio system (Pacific Biosciences, #102-090-600) using Revio SMRT Cell Tray (Pacific Biosciences, #102-202-200), Revio Sequencing Plate (Pacific Biosciences, #102-587-400), and Polymerase Kit (Pacific Biosciences, #102-817-600), following the manufacturer's protocol. Parameters were set as follows: a movie acquisition time of 30 h and base kinetics enabled (Yes).
