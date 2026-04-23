#!/bin/bash -l
#SBATCH --job-name=sniffles_pbmm
#SBATCH --output=log/%x_%j.out
#SBATCH --error=log/%x_%j.err
#SBATCH --time=01:00:00
#SBATCH --cpus-per-task=8
#SBATCH --partition=bmm

set -euo pipefail

# Load Conda, bash -l allows the use of login node and is necessary to run module load conda
module load conda
conda activate sniffles-env

outname=$1
Ref_fa=$2
repeats=$3


# Sniffles2 call
sniffles --input $outname".bam" --vcf $outname"_sniffles.vcf" --threads 8 --tandem-repeats $repeats
