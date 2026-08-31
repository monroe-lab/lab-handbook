#!/bin/bash -l
#SBATCH --job-name=repeat_Mt_anno
#SBATCH --output=log/%x_%j.out
#SBATCH --error=log/%x_%j.err
#SBATCH --time=99:00:00
#SBATCH --partition=bmm
#SBATCH --cpus-per-task=1
#SBATCH --mem=128G

ragtagdir=$1
outname=$2

module load minimap2

ChrM=~/refs/at_mitochondria.fa
minimap2 -k11 -w5 -m10 -N 100 --sr --secondary=yes -a $ragtagdir.renamed.fa $ChrM > $outname"_Mt_rlx.sam"
module load samtools
samtools view -b -S  $outname"_Mt_rlx.sam" >  $outname"_Mt_rlx.bam"
module load bedtools2
bedtools bamtobed -i  $outname"_Mt_rlx.sam" >  $outname"_Mt_rlx.bed"
rm $outname"_Mt_rlx.sam" $outname"_Mt_rlx.bam"

module purge # this may be the key
module load conda
conda activate repeatmasker_env

RepeatMasker -cutoff 200 -nolow -gff -xsmall -lib ~/refs/telomere_rDNA_CEN178q.fa $ragtagdir.renamed.fa


# move the repeat masker output to a designated directory
outdir=$(dirname "$outname")
prefix=$(basename "$ragtagdir")

mv $prefix.renamed.fa.ori.out $outdir/.
mv $prefix.renamed.fa.cat.gz $outdir/.
mv $prefix.renamed.fa.tbl $outdir/.
mv $prefix.renamed.fa.out $outdir/.
mv $prefix.renamed.fa.alert $outdir/.
mv $prefix.renamed.fa.masked $outdir/.
mv $prefix.renamed.fa.out.gff $outdir/.