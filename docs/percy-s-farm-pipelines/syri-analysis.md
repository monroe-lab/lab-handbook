---
title: "SyRI analysis"
type: "protocol"
---
# SyRI analysis

*Created by percival-singson on 2026-07-10*

SyRI is a conda program that can be used to generate chromosome synteny analysis, or visual representations of structural variants that have arisen in your genomes of interest. This protocol is specific to doing SyRI analysis on long read sequences.

## Necessary CONDA programs for your environment:

* syri (creates syntenic analysis)
* hifiasm (assembles HiFi reads from raw data)
* samtools (use to remove extra contigs, converts BAM files to SAM files)
* ragtag (scaffolds assembled reads against a reference, and labels chromosomes)
* minimap2 (aligns assembled and scaffolded genomes against each other)
* pandas<2.0, as of 7/10/26 (circumvents a language error with syri that happens with a new pandas version installed)

All of these can be installed using `conda install [program name] -c bioconda`

## Pipeline Workflow Overview

1. Obtain raw, unaligned reads
2. Assemble the genomes using hifiasm
3. Scaffold using RagTag to label chromosomes and identify extra contigs (this step will require a reference genome from NCBI or TAIR, easier to download from TAIR.)
4. Remove extra contigs using samtools faidx and create new files if applicable.
5. Using these new files, run SyRI. Your SyRI script should:
    1. Align the two assembled/scaffolded genomes using minimap2
    2. Convert the produced BAM file to a SAM file
    3. Run SyRI to create syntenic alignments. (make sure you are using the right version of pandas, otherwise SyRI will have a language error, as of 7/10/26 need to use a pandas<2.0 version)