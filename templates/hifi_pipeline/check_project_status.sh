#!/bin/bash
#
# Quick status summary for a HiFi PacBio project directory.
# Usage:
#   /home/gmonroe/scripts/hifi_pipeline/check_project_status.sh        # uses $PWD
#   /home/gmonroe/scripts/hifi_pipeline/check_project_status.sh /path/to/project

set -euo pipefail

PROJDIR="${1:-$PWD}"

echo "=== HiFi project status ==="
echo "Project directory: ${PROJDIR}"
echo

########################################
# 1. Check required directory structure
########################################

required=(
  "0_raw_data"
  "0.1_fastq_qc"
  "1_alignments"
  "1.1_alignment_qc"
  "2_variant_calls"
  "ref"
  "logs"
)

echo "== Required subdirectories =="
missing_any=0
for d in "${required[@]}"; do
  if [[ -d "${PROJDIR}/${d}" ]]; then
    printf "  [OK]   %s\n" "${d}"
  else
    printf "  [MISS] %s (not found)\n" "${d}"
    missing_any=1
  fi
done
echo

########################################
# 2. Reference genome(s) in ref/
########################################

echo "== Reference FASTA(s) in ref/ =="

if [[ -d "${PROJDIR}/ref" ]]; then
  shopt_orig=$(shopt -p nullglob || true)
  shopt -s nullglob
  ref_files=( "${PROJDIR}"/ref/*.fa "${PROJDIR}"/ref/*.fna "${PROJDIR}"/ref/*.fasta )
  eval "${shopt_orig:-:}"

  if (( ${#ref_files[@]} == 0 )); then
    echo "  (none found in ref/)"
  else
    for f in "${ref_files[@]}"; do
      if [[ -L "${f}" ]]; then
        tgt=$(readlink -f "${f}" 2>/dev/null || readlink "${f}")
        echo "  $(basename "${f}") -> ${tgt}"
      else
        size=$(du -h "${f}" | cut -f1)
        echo "  $(basename "${f}") (${size})"
      fi
    done
  fi
else
  echo "  ref/ directory missing."
fi
echo

########################################
# 3. Check central pipeline scripts
########################################

echo "== Pipeline scripts =="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Looking for scripts in: ${SCRIPT_DIR}"

scripts=( fastqc.sbatch.sh align_pbmm2.sbatch.sh call_variants.sbatch.sh check_project_status.sh )

for s in "${scripts[@]}"; do
  if [[ -f "${SCRIPT_DIR}/${s}" ]]; then
    printf "  [OK]   %s\n" "${s}"
  else
    printf "  [MISS] %s\n" "${s}"
  fi
done
echo

########################################
# 4. Sample-level status summary
########################################

echo "== Sample status (by basename of raw reads) =="

RAWDIR="${PROJDIR}/0_raw_data"

if [[ ! -d "${RAWDIR}" ]]; then
  echo "0_raw_data/ missing; cannot summarize samples."
  exit 0
fi

# Collect raw read files (FASTQ and BAM), ignoring .pbi
shopt -s nullglob
read_files=( "${RAWDIR}"/*.fastq.gz "${RAWDIR}"/*.fq.gz "${RAWDIR}"/*.fastq "${RAWDIR}"/*.fq "${RAWDIR}"/*.bam )
shopt -u nullglob

if (( ${#read_files[@]} == 0 )); then
  echo "No FASTQ or BAM files found in 0_raw_data/"
  exit 0
fi

# Build sample list and track which have FASTQ vs BAM
declare -A samples
declare -A has_fq
declare -A has_rawbam

for f in "${read_files[@]}"; do
  base=$(basename "${f}")
  sample="${base}"
  for ext in ".fastq.gz" ".fq.gz" ".fastq" ".fq" ".bam" ".cram"; do
    sample="${sample%$ext}"
  done

  samples["${sample}"]=1

  case "${f}" in
    *.bam)      has_rawbam["${sample}"]="yes" ;;
    *.fastq.gz|*.fq.gz|*.fastq|*.fq)
                has_fq["${sample}"]="yes" ;;
  esac
done

# Header
printf "%-25s %-3s %-3s %-3s %-5s %-5s %-9s %-9s %-5s\n" \
  "sample" "FQ" "RB" "QC" "BAM" "BED12" "MULTI" "bcftools" "pbsv"
printf "%-25s %-3s %-3s %-3s %-5s %-5s %-9s %-9s %-5s\n" \
  "------" "---" "---" "---" "-----" "-----" "---------" "---------" "-----"

ALIGN_DIR="${PROJDIR}/1_alignments"
VCF_DIR="${PROJDIR}/2_variant_calls"

# Iterate over samples (sorted for readability)
for sample in $(printf "%s\n" "${!samples[@]}" | sort); do
  fq_ok="${has_fq[${sample}]:-no}"
  rb_ok="${has_rawbam[${sample}]:-no}"

  qc_html="${PROJDIR}/0.1_fastq_qc/${sample}_fastqc.html"
  [[ -f "${qc_html}" ]] && qc_ok="yes" || qc_ok="no"

  bam="${ALIGN_DIR}/${sample}.bam"
  [[ -f "${bam}" ]] && bam_ok="yes" || bam_ok="no"

  bed12="${ALIGN_DIR}/${sample}.bed12.gz"
  [[ -f "${bed12}" ]] && bed_ok="yes" || bed_ok="no"

  multi_bed12="${ALIGN_DIR}/${sample}.multimapped.bed12.gz"
  [[ -f "${multi_bed12}" ]] && multi_ok="yes" || multi_ok="no"

  bcftools_vcf="${VCF_DIR}/${sample}.bcftools.vcf.gz"
  [[ -f "${bcftools_vcf}" ]] && bcftools_ok="yes" || bcftools_ok="no"

  pbsv_vcf="${VCF_DIR}/${sample}.pbsv.vcf.gz"
  [[ -f "${pbsv_vcf}" ]] && pbsv_ok="yes" || pbsv_ok="no"

  printf "%-25s %-3s %-3s %-3s %-5s %-5s %-9s %-9s %-5s\n" \
    "${sample}" "${fq_ok}" "${rb_ok}" "${qc_ok}" "${bam_ok}" "${bed_ok}" "${multi_ok}" "${bcftools_ok}" "${pbsv_ok}"
done

echo
echo "Total samples detected (FASTQ and/or BAM): ${#samples[@]}"
