#!/bin/bash
#
#SBATCH --job-name=pbmm2_align
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh
#SBATCH --time=72:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --output=logs/%x_%j.out
#SBATCH --error=logs/%x_%j.err

# Turn on -e and pipefail first; delay -u until after .bashrc
set -eo pipefail

# Load conda (via your usual interactive setup)
source ~/.bashrc
conda activate hifi_pipe

# Now it's safe to enforce unset-var errors
set -u

if [[ $# -lt 3 ]]; then
  echo "Usage: sbatch align_pbmm2.sbatch.sh PROJECT_DIR READS REF_FASTA [CALL_VARIANTS] [OVERWRITE]" >&2
  echo "" >&2
  echo "READS can be a PacBio HiFi FASTQ (.fastq.gz) or BAM (.bam) file." >&2
  echo "" >&2
  echo "Examples:" >&2
  echo "  # Align only (FASTQ input)" >&2
  echo "  sbatch align_pbmm2.sbatch.sh \\" >&2
  echo "    /home/gmonroe/projects/20251208_mddcc \\" >&2
  echo "    0_raw_data/0855.fastq.gz \\" >&2
  echo "    ref/Col-CC.genomic.fna" >&2
  echo "" >&2
  echo "  # Align only (BAM input)" >&2
  echo "  sbatch align_pbmm2.sbatch.sh \\" >&2
  echo "    /home/gmonroe/projects/20251208_mddcc \\" >&2
  echo "    0_raw_data/m84191_250220_174152_s3.bc1009.bam \\" >&2
  echo "    ref/Col-CC.genomic.fna" >&2
  echo "" >&2
  echo "  # Align and then submit variant-calling job" >&2
  echo "  sbatch align_pbmm2.sbatch.sh \\" >&2
  echo "    /home/gmonroe/projects/20251208_mddcc \\" >&2
  echo "    0_raw_data/0855.fastq.gz \\" >&2
  echo "    ref/Col-CC.genomic.fna \\" >&2
  echo "    call_variants" >&2
  echo "" >&2
  echo "  # Align, force overwrite existing outputs, and then call variants" >&2
  echo "  sbatch align_pbmm2.sbatch.sh \\" >&2
  echo "    /home/gmonroe/projects/20251208_mddcc \\" >&2
  echo "    0_raw_data/0855.fastq.gz \\" >&2
  echo "    ref/Col-CC.genomic.fna \\" >&2
  echo "    call_variants \\" >&2
  echo "    overwrite" >&2
  echo "" >&2
  echo "OVERWRITE (optional):" >&2
  echo "  omit or anything else  = do NOT overwrite: skip if BAM already exists" >&2
  echo "  overwrite              = overwrite existing BAM/QC/BED12 outputs" >&2
  exit 1
fi

PROJDIR="$1"
READS="$2"      # can be FASTQ(.gz) or BAM
REF="$3"
CALL_VARIANTS="${4:-}"   # Optional 4th argument; defaults to empty string
OVERWRITE="${5:-}"       # Optional 5th argument; only 'overwrite' is special

mkdir -p "${PROJDIR}/1_alignments" "${PROJDIR}/1.1_alignment_qc" "${PROJDIR}/logs"
mkdir -p logs

# Make REF absolute if user gave a project-relative path
if [[ ! -f "${REF}" && -f "${PROJDIR}/${REF}" ]]; then
  REF="${PROJDIR}/${REF}"
fi

if [[ ! -f "${REF}" ]]; then
  echo "ERROR: Reference FASTA not found: ${REF}" >&2
  exit 1
fi

# Derive sample name robustly from READS filename:
# strip common PacBio / FASTQ / BAM suffixes
reads_base=$(basename "${READS}")
sample="${reads_base}"

for ext in ".fastq.gz" ".fq.gz" ".fastq" ".fq" ".bam" ".cram"; do
  sample="${sample%$ext}"
done

ALIGN_DIR="${PROJDIR}/1_alignments"
QC_DIR="${PROJDIR}/1.1_alignment_qc"

BAM_TMP="${ALIGN_DIR}/${sample}.tmp.bam"
BAM_OUT="${ALIGN_DIR}/${sample}.bam"
BAM_IDX="${BAM_OUT}.bai"

BED12="${ALIGN_DIR}/${sample}.bed12.gz"
MULTI_NAMES="${ALIGN_DIR}/${sample}.multimapped.names"
MULTI_BED12="${ALIGN_DIR}/${sample}.multimapped.bed12.gz"

FLAGSTAT="${QC_DIR}/${sample}.flagstat.txt"
IDXSTATS="${QC_DIR}/${sample}.idxstats.txt}"

echo "[$(date)] Aligning ${READS} (sample=${sample}) to ${REF}"
echo "Project dir: ${PROJDIR}"
echo "Overwrite mode: ${OVERWRITE:-'(no overwrite)'}"

# Build pbmm2 index once per reference
REF_MMI="${REF}.mmi"
if [[ ! -f "${REF_MMI}" ]]; then
  echo "[$(date)] pbmm2 index not found. Building ${REF_MMI}..."
  pbmm2 index "${REF}" "${REF_MMI}"
fi

############################################
# Alignment + QC + BED12, with overwrite logic
############################################

if [[ -f "${BAM_OUT}" && "${OVERWRITE}" != "overwrite" ]]; then
  echo "[$(date)] Existing BAM found (${BAM_OUT}); not overwriting (no 'overwrite' flag)."
  echo "[$(date)] Skipping alignment/QC/BED12 and reusing existing BAM."
else
  if [[ -f "${BAM_OUT}" ]]; then
    echo "[$(date)] Overwrite enabled: removing existing alignment/QC/BED12 outputs for ${sample}..."
    rm -f "${BAM_OUT}" "${BAM_IDX}" \
          "${BED12}" "${MULTI_NAMES}" "${MULTI_BED12}" \
          "${FLAGSTAT}" "${IDXSTATS}" || true
  fi

  echo "[$(date)] Running pbmm2 alignment..."

  # Decide whether input is FASTQ (or FASTQ.GZ) vs BAM
  INPUT_IS_BAM=0
  case "${READS}" in
    *.bam)      INPUT_IS_BAM=1 ;;
    *.bam.pbi)  INPUT_IS_BAM=1 ;;  # just in case, though you shouldn't pass .pbi
  esac

  if [[ "${INPUT_IS_BAM}" -eq 1 ]]; then
    echo "[$(date)] Detected BAM input; running pbmm2 align WITHOUT --rg (using existing read groups)..."
    pbmm2 align \
      "${REF_MMI}" \
      "${READS}" \
      "${BAM_TMP}" \
      --sort \
      --preset CCS \
      --num-threads "${SLURM_CPUS_PER_TASK:-8}"
  else
    echo "[$(date)] Detected FASTQ input; running pbmm2 align WITH explicit read group..."
    pbmm2 align \
      "${REF_MMI}" \
      "${READS}" \
      "${BAM_TMP}" \
      --sort \
      --preset CCS \
      --rg "@RG\tID:${sample}\tSM:${sample}\tPL:PacBio" \
      --num-threads "${SLURM_CPUS_PER_TASK:-8}"
  fi

  mv "${BAM_TMP}" "${BAM_OUT}"

  echo "[$(date)] Alignment done, indexing BAM..."
  samtools index "${BAM_OUT}"

  mkdir -p "${QC_DIR}"

  echo "[$(date)] Running alignment QC for ${sample}..."
  samtools flagstat "${BAM_OUT}" > "${FLAGSTAT}"
  samtools idxstats "${BAM_OUT}" > "${IDXSTATS}"

  ############################################
  # BED12 outputs + multi-mapped reads
  ############################################

  echo "[$(date)] Converting BAM to gzipped BED12 for ${sample}..."
  bedtools bamtobed -bed12 -i "${BAM_OUT}" | gzip > "${BED12}"

  echo "[$(date)] Identifying multi-mapped / split reads for ${sample}..."
  # Find read names (col 4) that appear more than once
  gzip -dc "${BED12}" | cut -f4 | sort | uniq -d > "${MULTI_NAMES}"

  # If there are any multi-mapped names, extract their BED12 entries and gzip
  if [[ -s "${MULTI_NAMES}" ]]; then
    gzip -dc "${BED12}" | \
      awk 'NR==FNR {multi[$1]=1; next} ($4 in multi) {print}' "${MULTI_NAMES}" - | \
      gzip > "${MULTI_BED12}"
    n_multi=$(gzip -dc "${MULTI_BED12}" | wc -l)
    echo "[$(date)] Wrote ${n_multi} gzipped BED12 records for multi-mapped/split reads to ${MULTI_BED12}"
  else
    echo "[$(date)] No multi-mapped/split reads detected for ${sample} (no duplicate read names)."
    # Create an empty gzipped file just so downstream code can rely on it existing
    : | gzip > "${MULTI_BED12}"
  fi

  echo "[$(date)] Alignment + QC + BED12 export complete for ${sample}"
fi

############################################
# Optional: submit variant-calling job
############################################

if [[ -n "${CALL_VARIANTS}" ]]; then
  echo "[$(date)] Submitting variant calling job for ${sample}..."
  VARIANT_SCRIPT="/home/gmonroe/scripts/hifi_pipeline/call_variants.sbatch.sh"

  if [[ ! -f "${VARIANT_SCRIPT}" ]]; then
    echo "ERROR: Variant calling script not found: ${VARIANT_SCRIPT}" >&2
    exit 1
  fi

  # Default callers used when align script is the driver
  CALLERS_DEFAULT="mpileup,longshot,pbsv"

  if [[ "${OVERWRITE}" == "overwrite" ]]; then
    # Propagate overwrite flag to variant calling
    sbatch "${VARIANT_SCRIPT}" "${PROJDIR}" "${READS}" "${REF}" "${CALLERS_DEFAULT}" "overwrite"
  else
    sbatch "${VARIANT_SCRIPT}" "${PROJDIR}" "${READS}" "${REF}" "${CALLERS_DEFAULT}"
  fi

  echo "[$(date)] Variant calling job submitted. Check 'squeue -u $USER' for status."
else
  echo "[$(date)] Alignment complete. To run variant calling manually, execute, e.g.:"
  echo "  # default callers: mpileup,longshot,pbsv"
  if [[ "${OVERWRITE}" == "overwrite" ]]; then
    echo "  sbatch /home/gmonroe/scripts/hifi_pipeline/call_variants.sbatch.sh \\"
    echo "    \"${PROJDIR}\" \"${READS}\" \"${REF}\" mpileup,longshot,pbsv overwrite"
  else
    echo "  sbatch /home/gmonroe/scripts/hifi_pipeline/call_variants.sbatch.sh \\"
    echo "    \"${PROJDIR}\" \"${READS}\" \"${REF}\""
  fi
fi
