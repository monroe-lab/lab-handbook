---
type: protocol
title: "Primer Design for a Target Site"
---

# Primer Design for a Target Site

## Resources

**Tools:** [SALK T-DNA Primer Design Tool](http://signal.salk.edu/tdnaprimers.2.html), [Primer3](https://primer3.ut.ee/), TAIR (The Arabidopsis Information Resource)

**Related Protocols:** [[pcr-genotyping]], [[gel-electrophoresis]], [[sanger-sequencing]]

**Prerequisites:** Understanding of PCR (see [[pcr-genotyping]])

**Purpose:** Design PCR primers to genotype a T-DNA insertion line. This is how you confirm that your assigned SALK line carries the expected insertion in the expected gene. For the capstone project, you will design primers, order them, and use them to confirm your line's genotype before proceeding to DNA extraction and sequencing.

## Time estimate

**Wall time:** ~2-3 hr (including reading, design, and ordering) | **Hands-on:** ~2 hr

---

## Background

### What is a T-DNA insertion line?

The SALK collection consists of Arabidopsis lines where a piece of transferred DNA (T-DNA) from Agrobacterium was randomly inserted into the genome. Each line has the T-DNA in a different location, disrupting a different gene. By screening the SALK collection, you can find a line where the T-DNA disrupts your gene of interest, creating a loss-of-function mutant.

### The 3-primer genotyping strategy

To determine whether a plant is wild-type (WT), heterozygous (HET), or homozygous mutant (HOM) for the T-DNA insertion, you use three primers in a single PCR reaction:

- **LP (Left Primer):** binds upstream of the insertion site
- **RP (Right Primer):** binds downstream of the insertion site
- **BP (Border Primer):** binds to the T-DNA border sequence (LBb1.3 for SALK lines)

| Genotype | LP + RP band? | BP + RP band? |
|----------|--------------|---------------|
| Wild-type | Yes (~900-1100 bp) | No |
| Heterozygous | Yes | Yes (~400-800 bp) |
| Homozygous mutant | No (insert too large for PCR) | Yes |

## Procedure

### 1. Look up your SALK line

1. Go to the [SALK T-DNA Express Gene Mapping Tool](http://signal.salk.edu/cgi-bin/tdnaexpress).
2. Search for your SALK line number (e.g., SALK_045678).
3. Note: the gene name, the insertion location (exon, intron, UTR, or promoter), and the flanking sequence.

### 2. Design LP and RP using the SALK primer tool

1. Go to the [SALK T-DNA Primer Design Tool](http://signal.salk.edu/tdnaprimers.2.html).
2. Enter your SALK line number.
3. The tool will suggest LP and RP sequences, along with expected band sizes for WT and insertion bands.
4. **Record:**
   - LP sequence and Tm
   - RP sequence and Tm
   - Expected WT band size (LP + RP)
   - Expected insertion band size (BP + RP or BP + LP)
5. The BP primer for SALK lines is **LBb1.3**: `5'-ATTTTGCCGATTTCGGAAC-3'` (this is standard for all SALK lines; you do not need to design it).

### 3. Check primer quality

Good primers have:

| Parameter | Target range |
|-----------|-------------|
| Length | 18-25 nucleotides |
| Tm (melting temperature) | 58-62C (LP and RP should be within 2C of each other) |
| GC content | 40-60% |
| No strong secondary structure | Check in Primer3 or OligoCalc if concerned |
| No long runs of single nucleotides | Avoid AAAAA or GGGGG |

The SALK tool usually generates reasonable primers, but check the Tm values. If they are far outside 58-62C, consider redesigning manually using [Primer3](https://primer3.ut.ee/).

### 4. Alternative: design primers manually with Primer3

If the SALK tool doesn't give good results, or if you need primers for a non-SALK insertion:

1. Go to [Primer3](https://primer3.ut.ee/).
2. Paste the genomic sequence flanking your target site (get this from TAIR or the SALK tool).
3. Set parameters: Tm 58-62C, primer length 18-25 bp, product size 800-1200 bp for the WT band.
4. Primer3 will suggest multiple primer pairs ranked by quality.

### 5. Order primers

1. Choose a primer synthesis vendor. The lab uses **IDT (Integrated DNA Technologies)** or **Eurofins** for primer orders.
2. Order each primer at the **25 nmol scale, standard desalting** (the cheapest option, fine for genotyping).
3. Order quantities:
   - LP: 25 nmol
   - RP: 25 nmol
   - BP (LBb1.3): only if the lab doesn't already have stock. Check the primer inventory first.
4. Primers typically arrive in 1-2 business days.

**You order your own primers.** This is one of the few things students order directly (Grey approves the order). Ask Grey for the lab's IDT or Eurofins account login.

### 6. Resuspend primers

When primers arrive (lyophilized):

1. Spin down the tube briefly (pulse spin) to collect the pellet.
2. Add [[nuclease-free-water]] to make a **100 uM stock**. The amount of water depends on the nmol yield (printed on the tube or the spec sheet). For 25 nmol: add 250 uL water.
3. [[vortex-mixer|Vortex]] to dissolve. Pulse spin.
4. Make a **10 uM working stock**: 10 uL of 100 uM stock + 90 uL water.
5. Store 100 uM stock at **[[freezer-minus20|-20C]]**. Use 10 uM working stock for PCR reactions.
6. Label both tubes clearly. See [[tube-and-sample-labeling]].

### 7. Test your primers

Run a genotyping PCR (see [[pcr-genotyping]]) on:

1. **Col-0 wild-type DNA** (should give LP + RP band only)
2. **Your SALK line DNA** (should give the expected genotype pattern)
3. **No-template control** (water instead of DNA; should give no bands)

If the Col-0 control gives the expected WT band and the NTC is clean, your primers work.

## Documentation

Create a lab notebook entry. Date it. Cite this protocol. Include:

- SALK line number and gene name
- LP, RP, and BP sequences
- Expected band sizes
- Primer order details (vendor, date ordered, date received)
- Resuspension calculations
- Gel image from the test PCR (see [[gel-imaging-and-annotation]])
