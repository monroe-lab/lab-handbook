# [protocol][draft] Fast neutron treatment

### Objective

Fast neutron (FN) causes all kinds of mutation (source; ). See if the mutagenic effect of FN is altered in H3K4me-related/repair mutants.

### Prior works

Daniela did the first batch of FN treatment; { WT, atx12r7 (SI lines' next gen.)} x {Non treatment, treatment (one dose)} x { seeds, seedling }. Seeds are in storage, seedlings unfortunately died.

### Overall design

Genotype::

Seeds of {WT, atx12r7, pds5a-e, msh6 }

Dosage:

{Non-treatment, Low, Middle, High} (Exact Gy to be determined)

200 seeds/dose\*Genotype

Detection:

dosage-response curve based on germination rate

M2 sequence on the highest dose.

25 plants/dose\*Genotype

x48 depth/plant (estimated depth when max multiplexing (96) on Novaseq)

### Preparation

- Establish the recipe of MS plates
- Make sure the seeds to be used

- Germinate nearly 100 % without treatment, and
- Are from one progenitor.  If not, refresh the seeds.

### Procedure

1. Aliquot about 200 seeds / 4 envelopes for each line.
2. Bring the seeds to FN facility. Apply FN. Proceed immediately to 3.
3. Surface sterilize the seeds and sew them on MS plates. Keep in the fridge for 2 days, then move to LD incubator
4. Count the germination rate at 5~10 dai. (4 genotype x 4 dosage)
5. Randomly choose 30 x 2 plants par genotype, from non-treatment and highest dose, and plant them on the soil. (30 plants x 4 genotype x 2 dosage = 240 pots)
6. Collect seeds from 5 and sew about 10 seeds/line on MS plates for randomly chosen 25 M1 plants/genotype\*dosage
7. Randomly choose one plant/out of 25 lines/genotype\*dosage and extract DNA (25 plants x 4 genotype x high dosage (=100 plants) + ?? plants x 4 genotype x non treatment)

### Future Plans

- EM-seq

- Try other mutants as screening
- Try other ecotypes and GWAS (it might be more fun to do with UV)
- Test for fitness. The expectation is that impaired “essential”-gene-targeted-repair mechanism leads to severe phenotype par a number of mutations.
- Validate with demethylases (fld etc.) and independent mutant line
