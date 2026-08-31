#!/bin/bash
#SBATCH --job-name=clair3_pbmm
#SBATCH --output=log/%x_%j.out
#SBATCH --error=log/%x_%j.err
#SBATCH --time=48:00:00
#SBATCH --mem=64G
#SBATCH --partition=bmm
#SBATCH --cpus-per-task=16

module load apptainer


outname=$1
REF_fa=$2

SIF=/group/gmonroegrp2/soya/containers/clair3:v1.2.0.sif
DATADIR="$SLURM_SUBMIT_DIR"
REFDIR=$(dirname "$REF_fa")
REF=$(basename "$REF_fa")
OUTDIR=$(dirname "$outname")
THREADS=16

BAM=${outname}.bam
OUTPUT_DIR=$DATADIR/${OUTDIR}/clair3


mkdir -p $OUTPUT_DIR

apptainer exec \
  -B $DATADIR:$DATADIR \
  -B $REFDIR:$REFDIR \
  $SIF \
  /opt/bin/run_clair3.sh \
  --bam_fn=$DATADIR/$BAM \
  --ref_fn=$REFDIR/$REF \
  --threads=$THREADS \
  --platform="hifi" \
  --model_path=/opt/models/hifi_revio \
  --output=$OUTPUT_DIR \
  --include_all_ctgs

# unzip clair3/merge_output.vcf" and rename to outname_clair3.vcf
gunzip -c $OUTPUT_DIR/merge_output.vcf.gz > ${outname}_clair3.vcf