#!/bin/bash -l
#SBATCH --job-name=pbmm2
#SBATCH --output=log/%j_pbmm2.out
#SBATCH --error=log/%j_pbmm2.err
#SBATCH --time=24:00:00
#SBATCH --partition=bmm
#SBATCH --cpus-per-task=8
#SBATCH --mem=128G



in_bam=$1
#outname is out_dir/outbam_prefix
outname=$2

CORES=8


module load conda
conda activate pbsv-env

# ref including the Mt,Pt
COL_CEN_CC=/home/soya/refs/Col-CC/Col_CEN_CC.mmi
REF_fa=/home/soya/refs/Col-CC/Col_CEN_CC_ChrM_P.fasta
repeats=/home/soya/refs/Col-CC/Col_CEN_CC.trf.bed

echo "Aligning HiFi reads..."
pbmm2 align --preset CCS --sort $COL_CEN_CC $in_bam $outname".bam"

echo "submitting variant callers..."
sbatch code/sniffles_with_pbmmreads.sh $outname $REF_fa $repeats
sbatch code/pbsv_with_pbmmreads.sh $outname $REF_fa $repeats
sbatch code/cuteSV.sh $outname $REF_fa
sbatch code/deepvariant_with_pbmmreads.sh $outname $REF_fa
sbatch code/clair3.sh $outname $REF_fa
sbatch code/pepper_margin_deepvar.sh $outname $REF_fa

# select alignment file (primary read only)
echo "Filtering out unmapped reads, secondary and supplementary alignments..."
conda deactivate
module load samtools

samtools index $outname".bam"
samtools view -@ $CORES -b -F 2308 -b $outname".bam" Chr1 Chr2 Chr3 Chr4 Chr5 >  $outname"_F2308.bam"
samtools index $outname"_F2308.bam"


