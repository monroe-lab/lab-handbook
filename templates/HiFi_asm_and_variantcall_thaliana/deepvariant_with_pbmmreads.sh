#!/bin/bash
#SBATCH --job-name=deepvariant_pbmm
#SBATCH --output=0_log/%x_%j.out
#SBATCH --error=0_log/%x_%j.err
#SBATCH --time=24:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --partition=bmm


# load apptainer
module load apptainer



OUTNAME=$1
REF=$2


SIF=/group/gmonroegrp2/soya/containers/deepvariant_1.6.0.sif

apptainer exec "$SIF" /opt/deepvariant/bin/run_deepvariant \
  --model_type=PACBIO \
  --ref="$REF" \
  --reads="${OUTNAME}.bam" \
  --output_vcf="${OUTNAME}_deepvariant.vcf" \
  --output_gvcf="${OUTNAME}_deepvariant.g.vcf.gz" \
  --num_shards=8