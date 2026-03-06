The user wants to run a BLAST job on Farm using the lab's template.

Ask for or infer:
- Reference FASTA (sequences to build the database from)
- Query FASTA (sequences to search)
- Output prefix (default: `blast_results`)
- BLAST type: `blastn` (nucleotide-nucleotide, default), `blastp` (protein-protein), `tblastn` (protein vs nucleotide db), `tblastx`
- Any parameter tweaks: E-value threshold, percent identity cutoff, max hits per query

**Basic usage (after copying the template):**
```bash
mkdir -p logs
sbatch blastn-job.sbatch ref.fasta query.fasta output_prefix
```

**Output:** `output_prefix.blastn.outfmt6.tsv` — tab-delimited with columns:
`qseqid, sseqid, pident, length, mismatch, gapopen, qstart, qend, sstart, send, evalue, bitscore`

**Common parameter tweaks to suggest based on context:**
- Stricter hits: `-evalue 1e-5` or `-evalue 1e-20`
- Limit hits per query: `-max_target_seqs 50`
- Require high identity: `-perc_identity 95`
- Combine: `-evalue 1e-20 -perc_identity 90 -max_target_seqs 20`

**If not using the template script**, generate a standalone sbatch script that:
1. Uses `module load blast`
2. Checks input files exist
3. Runs `makeblastdb -in ref.fasta -dbtype nucl -out db_prefix` if DB doesn't exist
4. Runs `blastn -query query.fasta -db db_prefix -out results.tsv -outfmt 6 -num_threads $SLURM_CPUS_PER_TASK`
5. Follows all lab sbatch conventions (account=gmonroegrp, logs/%x_%j.out, set -euo pipefail)

Use `bmh` partition with 8 CPUs and 32G memory as defaults for BLAST jobs. Adjust based on database/query size.

Remind the user they can parse outfmt6 output with `awk`, `cut`, R's `data.table::fread()`, or Python pandas.
