---
title: "SyRI analysis"
type: "protocol"
---
# SyRI analysis

*Created by percival-singson on 2026-07-10*

SyRI is a conda program that can be used to generate chromosome synteny analysis, or visual representations of structural variants that have arisen in your genomes of interest. This protocol is specific to doing SyRI analysis on long read sequences.

**Necessary CONDA programs for your environment:**

* syri (creates syntenic analysis)
* hifiasm (assembles HiFi reads from raw data)
* samtools (use to remove extra contigs, converts BAM files to SAM files)
* ragtag (scaffolds assembled reads against a reference, and labels chromosomes)
* minimap2 (aligns assembled and scaffolded genomes against each other)
* pandas<2.0, as of 7/10/26 (circumvents a language error with syri that happens with a new pandas version installed)

All of these can be installed using `conda install [program name] -c bioconda`

<br>
