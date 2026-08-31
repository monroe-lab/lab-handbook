#!/bin/bash -l
#SBATCH --job-name=pbsv
#SBATCH --output=0_log/%j_pbsv.out
#SBATCH --error=0_log/%j_pbsv.err
#SBATCH --time=01:00:00
#SBATCH --partition=bmm
#SBATCH --cpus-per-task=8
#SBATCH --mem=128G


module load conda
conda activate pbsv-env


outname=$1
out_prefix=$(dirname "$outname")
REF_fa=$2
repeats=$3
echo $outname".bam"

pbsv discover -s $out_prefix --hifi --tandem-repeats $repeats --log-level DEBUG $outname".bam" $outname".svsig.gz"
pbsv call $REF_fa $outname".svsig.gz" $outname"_pbsv.vcf"