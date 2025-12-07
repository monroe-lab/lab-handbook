#!/bin/bash
#
#SBATCH --job-name=blast_job
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh
#SBATCH --time=02:00:00
#SBATCH --cpus-per-task=8
#SBATCH --mem=16G
#SBATCH --output=logs/%x_%j.out
#SBATCH --error=logs/%x_%j.err

set -euo pipefail

########################################
# Usage:
#   mkdir -p logs
#   sbatch blastn-job.sbatch ref.fasta query.fasta [out_prefix]
#
# Arguments:
#   $1 = reference FASTA (for BLAST database)
#   $2 = query FASTA
#   $3 = output prefix (optional, default: blast_results)
# 
# info: made by Grey, Dec 5, 2025
########################################

if [ "$#" -lt 2 ]; then
    echo "Usage: sbatch $0 ref.fasta query.fasta [out_prefix]" >&2
    exit 1
fi

REF_FASTA="$1"
QUERY_FASTA="$2"
OUT_PREFIX="${3:-blast_results}"

# Derive DB prefix from reference FASTA name (drop extension)
# e.g. ref.fasta -> ref, /path/to/ref.fa -> /path/to/ref
DB_PREFIX="${REF_FASTA%.*}"

echo "=== BLAST job starting ==="
echo "Reference FASTA : $REF_FASTA"
echo "Query FASTA     : $QUERY_FASTA"
echo "Output prefix   : $OUT_PREFIX"
echo "DB prefix       : $DB_PREFIX"
echo "CPUs            : ${SLURM_CPUS_PER_TASK:-1}"
echo "Node            : $(hostname)"
echo "Start time      : $(date)"
echo "=========================="

# Load BLAST module (adjust name/version if needed)
module load blast

# Basic checks
if [ ! -f "$REF_FASTA" ]; then
    echo "ERROR: reference FASTA not found: $REF_FASTA" >&2
    exit 1
fi

if [ ! -f "$QUERY_FASTA" ]; then
    echo "ERROR: query FASTA not found: $QUERY_FASTA" >&2
    exit 1
fi

# Create DB only if it doesn't already exist (check one of the index files)
if [ -f "${DB_PREFIX}.nhr" ]; then
    echo "BLAST DB already exists for prefix: $DB_PREFIX"
else
    echo "Creating BLAST DB for $REF_FASTA ..."
    makeblastdb \
        -in "$REF_FASTA" \
        -dbtype nucl \
        -out "$DB_PREFIX"
    echo "BLAST DB created."
fi

# Run BLASTN
OUT_TAB="${OUT_PREFIX}.blastn.outfmt6.tsv"

echo "Running BLASTN ..."
blastn \
    -query "$QUERY_FASTA" \
    -db "$DB_PREFIX" \
    -out "$OUT_TAB" \
    -outfmt 6 \
    -num_threads "${SLURM_CPUS_PER_TASK:-1}"

echo "BLASTN finished. Output:"
echo "  $OUT_TAB"

echo "End time: $(date)"
echo "=== BLAST job complete ==="
