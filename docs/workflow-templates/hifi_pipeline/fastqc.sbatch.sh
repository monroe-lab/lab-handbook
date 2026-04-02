#!/bin/bash
#
#SBATCH --job-name=fastqc
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh
#SBATCH --time=24:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=8G
#SBATCH --output=logs/%x_%j.out
#SBATCH --error=logs/%x_%j.err

# Turn on -e and pipefail, but delay -u until after .bashrc
set -eo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: sbatch fastqc.sbatch.sh PROJECT_DIR FASTQ" >&2
  exit 1
fi

PROJDIR="$1"
FASTQ="$2"

mkdir -p "${PROJDIR}/0.1_fastq_qc" "${PROJDIR}/logs"
mkdir -p logs

# Load conda (via your usual interactive setup)
source ~/.bashrc
conda activate hifi_pipe

# Now it's safe to enforce unset-var errors
set -u

sample=$(basename "${FASTQ}")
sample=${sample%%.fastq.gz}

echo "[$(date)] Running FastQC on ${FASTQ} (sample=${sample})"
echo "Project dir: ${PROJDIR}"

fastqc \
  -t "${SLURM_CPUS_PER_TASK:-4}" \
  -o "${PROJDIR}/0.1_fastq_qc" \
  "${FASTQ}"

echo "[$(date)] FastQC done for ${sample}"
