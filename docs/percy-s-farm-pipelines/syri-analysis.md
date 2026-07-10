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

## Step Specificities

### Step 2: Hifiasm

* This step can take a long time (It took me 10hrs for a 30G genome.) Therefore when setting your time, give it a lot, especially if the file is very big. For a 30G genome, I gave it `-t 48:00:00` and for a 2.1G genome I gave it `-t 24:00:00`. 
* Hifiasm is also very computationally heavy, and will require many CPUs and memory. For a 30G genome, I gave it `--cpus-per-task=32` and `--mem=250G`. For a 2.1G genome, I lowered the memory to `--mem=100G`.
* Here is an example sbatch script that I have ran:

`#!/bin/bash -l`
`#SBATCH  -J hifiasm`
`#SBATCH -t 24:00:00`
`#SBATCH --nodes=1`
`#SBATCH --ntasks=1`
`#SBATCH --cpus-per-task=32`
`#SBATCH --mem=100G`
`#SBATCH --partition=bmh`
`#SBATCH --mail-type=END,FAIL`
`#SBATCH --mail-user=[add your email]`
`#SBATCH --output=./out_files/converted_slurm-%j.out`

`set -euo pipefail`
`#Assembling VA2 from HiFi reads`
`hifiasm -o VA2_asm -t "$SLURM_CPUS_PER_TASK" VA2.fasta`
`#Taking primary continous DNA fragments from GFA to Fasta`
`awk '/^S/{print ">"$2"\n"$3}' VA2_asm.bp.p_ctg.gfa > VA2_asm.fasta`
`echo "Success"`