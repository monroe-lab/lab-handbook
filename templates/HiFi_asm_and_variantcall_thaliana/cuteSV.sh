#!/bin/bash -l
#SBATCH --job-name=cuteSV
#SBATCH --output=0_log/%j_cuteSV.out
#SBATCH --error=0_log/%j_cuteSV.err
#SBATCH --time=99:00:00
#SBATCH --partition=bmm
#SBATCH --cpus-per-task=8
#SBATCH --mem=128G

# Load Conda, bash -l allows the use of login node and is necessary to run module load conda
module load conda
conda activate sniffles-env

outname=$1
ref=$2
tmpdir=$outname"_tempdir"

mkdir -p $tmpdir

cuteSV $outname".bam" $ref $outname"_cuteSV.vcf" $tmpdir \
  --max_cluster_bias_INS 100 \
  --diff_ratio_merging_INS 0.3 \
  --max_cluster_bias_DEL 100 \
  --diff_ratio_merging_DEL 0.3 \
  --genotype \
  --threads 8
