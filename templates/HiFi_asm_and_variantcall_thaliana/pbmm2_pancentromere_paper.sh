#!/bin/bash -l
#SBATCH --job-name=pbmm2
#SBATCH --output=log/%j_maponly_pbmm2.out
#SBATCH --error=log/%j_maponly_pbmm2.err
#SBATCH --time=24:00:00
#SBATCH --partition=bmm
#SBATCH --cpus-per-task=8
#SBATCH --mem=128G


# USAGE:  # ./pbmm2_pancentromere_paper.sh <renamed_fa ACC> <bam CCS> <chromosome_len_list>
ACC=$1
CCS=$2
outname=$3
bed_len=$4
CORES=8
OUTDIR=$(dirname "$outname")
in_fa_basename=$(basename "$ACC")

WORKTMP=$PWD
CODE=$PWD

REF=$ACC
ChrM=~/refs/at_mitochondria.fa
ChrC=~/refs/at_chloroplast.fa

output=$OUTDIR
outputTMP=$OUTDIR/tmp

mkdir -p $outputTMP

echo "ACC=$ACC"
echo "CCS=$CCS"
echo "outname=$outname"
echo "OUTDIR=$OUTDIR"
echo "outputTMP=$outputTMP"
echo "in_fa_basename=$in_fa_basename"

module load samtools

echo "Adding ChrM and ChrC to REFerence..."

cat $REF $ChrM $ChrC > $ACC.scaffolds.ChrMChrC.fa


samtools faidx $ACC.scaffolds.ChrMChrC.fa

  

module load conda
conda activate pbsv-env

# hope this is called in pbmm2
export TMPDIR="$PWD/tmp_$SLURM_JOB_ID"
mkdir -p "$TMPDIR"




echo "Aligning CCS reads..."
# instead of using q20 fastq, just do 
pbmm2 align --sort -j $CORES \
    --log-level DEBUG \
    --preset SUBREAD \
    --min-length 5000 \
    $ACC.scaffolds.ChrMChrC.fa $CCS $outputTMP/$in_fa_basename.CCS.bam

echo "Filtering out unmapped reads, secondary and supplementary alignments..."

conda deactivate
module load samtools
samtools view -@ $CORES -b -F 2308 $outputTMP/$in_fa_basename.CCS.bam Chr1 Chr2 Chr3 Chr4 Chr5 > $outputTMP/$in_fa_basename.CCS.Chr.F2308.bam
samtools index $outputTMP/$in_fa_basename.CCS.Chr.F2308.bam

rm $outputTMP/$in_fa_basename.CCS.bam*

conda activate deeptools
bamfile=$outputTMP/$in_fa_basename.CCS.Chr.F2308.bam
bigwigfile=$(echo $bamfile | sed -e 's/bam/bw/')
bamCoverage -b $bamfile -o $bigwigfile --normalizeUsing RPKM --outFileFormat bigwig


conda deactivate
sbatch code/nucfreq.sh $outputTMP/$in_fa_basename.CCS.Chr.F2308.bam $outname $bed_len