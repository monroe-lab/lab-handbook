#!/bin/bash
#
#SBATCH --job-name=call_vars
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh
#SBATCH --time=72:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --output=logs/%x_%j.out
#SBATCH --error=logs/%x_%j.err

set -eo pipefail

# Load conda (via your usual interactive setup)
source ~/.bashrc
conda activate hifi_pipe

# Now it's safe to enforce unset-var errors
set -u

if [[ $# -lt 2 ]]; then
  echo "Usage: sbatch call_variants.sbatch PROJECT_DIR READS [REF_FASTA] [CALLERS] [OVERWRITE]" >&2
  echo "" >&2
  echo "READS can be the original FASTQ(.gz) or a BAM name; this script infers the sample" >&2
  echo "and expects the aligned BAM at PROJECT_DIR/1_alignments/<sample>.bam." >&2
  echo "" >&2
  echo "Example (FASTQ-based):" >&2
  echo "  sbatch call_variants.sbatch \\" >&2
  echo "    /home/gmonroe/projects/20251208_mddcc \\" >&2
  echo "    0_raw_data/0855.fastq.gz \\" >&2
  echo "    ref/Col-CC.genomic.fna \\" >&2
  echo "    mpileup,longshot,pbsv \\" >&2
  echo "    overwrite" >&2
  echo "" >&2
  echo "Example (BAM-based):" >&2
  echo "  sbatch call_variants.sbatch \\" >&2
  echo "    /home/gmonroe/projects/20251208_mddcc \\" >&2
  echo "    1_alignments/0855.bam \\" >&2
  echo "    ref/Col-CC.genomic.fna" >&2
  echo "" >&2
  echo "CALLERS (comma-separated, no spaces):" >&2
  echo "  mpileup      — bcftools mpileup + call (baseline variant calls)" >&2
  echo "  longshot     — long-read-aware variant calling" >&2
  echo "  pbsv         — PacBio structural variant caller (discover + call)" >&2
  echo "" >&2
  echo "OVERWRITE (optional):" >&2
  echo "  omit or anything else  = do NOT overwrite: skip if output exists" >&2
  echo "  overwrite              = overwrite existing outputs for requested callers" >&2
  echo "" >&2
  echo "Defaults if not specified:" >&2
  echo "  CALLERS   = mpileup,longshot,pbsv" >&2
  echo "  OVERWRITE = (no overwrite; skip existing outputs)" >&2
  exit 1
fi

PROJDIR="$1"
READS="$2"         # can be FASTQ(.gz) or BAM; used only to infer sample name
REF="${3:-}"
CALLERS="${4:-mpileup,longshot,pbsv}"
OVERWRITE="${5:-}"   # only treated specially if equal to 'overwrite'

mkdir -p "${PROJDIR}/2_variant_calls" "${PROJDIR}/logs"
mkdir -p logs

# Auto-detect reference if not provided
if [[ -z "${REF}" ]]; then
  cand=$(find "${PROJDIR}/ref" -maxdepth 1 -type f \( -name "*.fna" -o -name "*.fa" -o -name "*.fasta" \) | head -n 2)
  n_cand=$(echo "${cand}" | sed '/^$/d' | wc -l)
  if [[ "${n_cand}" -eq 0 ]]; then
    echo "ERROR: No reference FASTA found in ${PROJDIR}/ref and none provided as argument." >&2
    exit 1
  elif [[ "${n_cand}" -gt 1 ]]; then
    echo "ERROR: Multiple reference FASTAs found in ${PROJDIR}/ref. Please specify REF_FASTA explicitly." >&2
    echo "${cand}" >&2
    exit 1
  else
    REF="${cand}"
  fi
fi

# Derive sample name from READS (handles FASTQ(.gz) or BAM/CRAM)
reads_base=$(basename "${READS}")
sample="${reads_base}"
for ext in ".fastq.gz" ".fq.gz" ".fastq" ".fq" ".bam" ".cram"; do
  sample="${sample%$ext}"
done

ALIGN_DIR="${PROJDIR}/1_alignments"
VCF_DIR="${PROJDIR}/2_variant_calls"
BAM="${ALIGN_DIR}/${sample}.bam"

if [[ ! -f "${BAM}" ]]; then
  echo "ERROR: BAM not found for sample ${sample}: ${BAM}" >&2
  exit 1
fi

echo "[$(date)] Calling variants for ${sample}"
echo "Project dir: ${PROJDIR}"
echo "Reference: ${REF}"
echo "BAM: ${BAM}"
echo "Variant callers: ${CALLERS}"
echo "Overwrite mode: ${OVERWRITE:-'(no overwrite)'}"

# Parse CALLERS into an array
IFS=',' read -ra CALLER_ARRAY <<< "${CALLERS}"

echo "[$(date)] Running variant callers: ${CALLER_ARRAY[*]}"

########################################
# 1) bcftools mpileup + call (baseline)
########################################

for caller in "${CALLER_ARRAY[@]}"; do
  if [[ "${caller}" == "mpileup" ]]; then
    BCFTOOLS_VCF="${VCF_DIR}/${sample}.bcftools.vcf.gz"
    BCFTOOLS_IDX="${BCFTOOLS_VCF}.csi"

    if [[ -f "${BCFTOOLS_VCF}" && "${OVERWRITE}" != "overwrite" ]]; then
      echo "[$(date)] bcftools VCF exists (${BCFTOOLS_VCF}); skipping (no overwrite)."
    else
      if [[ -f "${BCFTOOLS_VCF}" ]]; then
        echo "[$(date)] Overwrite enabled: removing existing bcftools outputs for ${sample}..."
        rm -f "${BCFTOOLS_VCF}" "${BCFTOOLS_IDX}" || true
      fi

      echo "[$(date)] Running bcftools mpileup + call for ${sample}..."

      bcftools mpileup -Ou -f "${REF}" "${BAM}" \
        | bcftools call -mv -Oz -o "${BCFTOOLS_VCF}"

      bcftools index "${BCFTOOLS_VCF}"

      echo "[$(date)] bcftools variant calling complete for ${sample}"
    fi
  fi
done

########################################
# 2) Longshot
########################################

for caller in "${CALLER_ARRAY[@]}"; do
  if [[ "${caller}" == "longshot" ]]; then
    LONGSHOT_VCF="${VCF_DIR}/${sample}.longshot.vcf"
    LONGSHOT_VCF_GZ="${LONGSHOT_VCF}.gz"
    LONGSHOT_IDX="${LONGSHOT_VCF_GZ}.tbi"

    if [[ -f "${LONGSHOT_VCF_GZ}" && "${OVERWRITE}" != "overwrite" ]]; then
      echo "[$(date)] longshot VCF exists (${LONGSHOT_VCF_GZ}); skipping (no overwrite)."
    else
      if [[ -f "${LONGSHOT_VCF_GZ}" || -f "${LONGSHOT_VCF}" ]]; then
        echo "[$(date)] Overwrite enabled: removing existing longshot outputs for ${sample}..."
        rm -f "${LONGSHOT_VCF}" "${LONGSHOT_VCF_GZ}" "${LONGSHOT_IDX}" || true
      fi

      echo "[$(date)] Running longshot for ${sample}..."

      longshot \
        --force_overwrite \
        --bam "${BAM}" \
        --ref "${REF}" \
        --out "${LONGSHOT_VCF}"

      # Compress & index longshot output
      bgzip -f "${LONGSHOT_VCF}"
      tabix -p vcf "${LONGSHOT_VCF_GZ}"

      echo "[$(date)] longshot variant calling complete for ${sample}"
    fi
  fi
done
########################################
# 3) pbsv (PacBio structural variants)
########################################

for caller in "${CALLER_ARRAY[@]}"; do
  if [[ "${caller}" == "pbsv" ]]; then
    SVSIG="${VCF_DIR}/${sample}.pbsv.svsig.gz"
    PBSV_VCF="${VCF_DIR}/${sample}.pbsv.vcf"
    PBSV_VCF_GZ="${PBSV_VCF}.gz"
    PBSV_IDX="${PBSV_VCF_GZ}.tbi"

    # ---- Make sure pbsv sees a .fa/.fasta reference ----
    PBSV_REF="${REF}"
    if [[ "${PBSV_REF}" != *.fa && "${PBSV_REF}" != *.fasta ]]; then
      mkdir -p "${PROJDIR}/ref"
      ref_base=$(basename "${REF}")
      PBSV_REF="${PROJDIR}/ref/${ref_base}.pbsv.fa"

      if [[ ! -e "${PBSV_REF}" ]]; then
        echo "[$(date)] Creating pbsv-friendly symlink for reference:"
        echo "         ${PBSV_REF} -> ${REF}"
        # Avoid race-condition crash if another job creates it first
        if ! ln -s "${REF}" "${PBSV_REF}" 2>/dev/null; then
          echo "[$(date)] Note: ${PBSV_REF} already exists (likely created by another job); proceeding."
        fi
      else
        echo "[$(date)] Using existing pbsv-friendly reference: ${PBSV_REF}"
      fi
    fi
    # -----------------------------------------------------

    if [[ -f "${PBSV_VCF_GZ}" && "${OVERWRITE}" != "overwrite" ]]; then
      echo "[$(date)] pbsv VCF exists (${PBSV_VCF_GZ}); skipping (no overwrite)."
    else
      if [[ -f "${PBSV_VCF_GZ}" || -f "${PBSV_VCF}" || -f "${SVSIG}" ]]; then
        echo "[$(date)] Overwrite enabled: removing existing pbsv outputs for ${sample}..."
        rm -f "${PBSV_VCF_GZ}" "${PBSV_VCF}" "${PBSV_IDX}" "${SVSIG}" || true
      fi

      echo "[$(date)] Running pbsv discover for ${sample}..."
      pbsv discover "${BAM}" "${SVSIG}"

      echo "[$(date)] Running pbsv call for ${sample}..."
      # --ccs is recommended for HiFi reads
      pbsv call --ccs "${PBSV_REF}" "${SVSIG}" "${PBSV_VCF}"

      echo "[$(date)] Compressing and indexing pbsv VCF for ${sample}..."
      bgzip -f "${PBSV_VCF}"
      tabix -p vcf "${PBSV_VCF_GZ}"

      echo "[$(date)] pbsv structural variant calling complete for ${sample}"
    fi
  fi
done

echo "[$(date)] All requested variant calling complete for ${sample}"
