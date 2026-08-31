#!/bin/bash
#SBATCH --job-name=pepper_margin_deepvariant_pbmm
#SBATCH --output=log/%x_%j.out
#SBATCH --error=log/%x_%j.err
#SBATCH --time=5-00:00:00
#SBATCH --cpus-per-task=16
#SBATCH --mem=64G
#SBATCH --partition=bmm

set -euo pipefail
module load apptainer

OUTARG="$1"        


REF_fa="$2"
SIF=/group/gmonroegrp2/soya/containers/pepper_deepvariant_r0.8.sif

DATADIR="$SLURM_SUBMIT_DIR"
REFDIR=$(dirname "$REF_fa")
REF=$(basename "$REF_fa")
THREADS=16


BAM_BASE="${DATADIR}/${OUTARG}" 
SAMPLE="$(basename "$BAM_BASE")"
BASEDIR="$(dirname "$BAM_BASE")"

BAM="${BAM_BASE}.bam"

# ---- output dir, avoid over writing by parallel jobs ----
OUTROOT="${BASEDIR}/${SAMPLE}.rpmd"
LOGDIR="${OUTROOT}/logs"
mkdir -p "$LOGDIR"

# ---- TMPDIR  ----
TMPDIR="$(mktemp -d -p "${OUTROOT}" tmp.$$.$(date +%Y%m%dT%H%M%S).XXXX)"
export TMPDIR
trap 'rm -rf "$TMPDIR" || true' EXIT

echo "[INFO] sample=${SAMPLE}"
echo "[INFO] BAM=${BAM}"
echo "[INFO] REF=${REFDIR}/${REF}"
echo "[INFO] OUTROOT=${OUTROOT}"
echo "[INFO] TMPDIR=${TMPDIR}"


# ---- run_pepper_margin_deepvariant----
set -euo pipefail
set -o pipefail
apptainer exec \
  -B "$BASEDIR":"$BASEDIR" \
  -B "$REFDIR":"$REFDIR" \
  -B "$OUTROOT":"$OUTROOT" \
  -B "$TMPDIR":"$TMPDIR" \
  "$SIF" \
  run_pepper_margin_deepvariant call_variant \
    -b "$BAM" \
    -f "${REFDIR}/${REF}" \
    -o "$OUTROOT" \
    -p "${SAMPLE}.pepper" \
    -t "$THREADS" \
    --hifi 2>&1 | tee "${LOGDIR}/00_rpmd_${SAMPLE}.log"


# unzip the final vcf and move to OUTARG location
gunzip -c "${OUTROOT}/${SAMPLE}.pepper.vcf.gz" > "${DATADIR}/${SAMPLE}_pepper.vcf"