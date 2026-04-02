# BLASTN sbatch template

**Script:** `blastn-job.sbatch`  
**Purpose:** Run a nucleotide BLAST (BLASTN) on FARM, creating a BLAST database from a reference FASTA if needed and searching it with a query FASTA.

This is a simple, general template for “reference vs query” nucleotide alignment.  
You provide:

- `ref.fasta` – reference sequences (used to build the BLAST database)
- `query.fasta` – query sequences to search against the reference

The script will:

1. Check that both FASTA files exist.
2. Create a BLAST **nucleotide** database from `ref.fasta` (if it doesn’t already exist).
3. Load the BLAST module (`module load blast`) and run `blastn` using the FARM Slurm resources you requested.
4. Write tabular results (`outfmt 6`) to a TSV file.

---

## Usage

From a directory where you want to run BLAST:

```bash
# FYI: we use a "logs/" folder because the sbatch script writes Slurm stdout/stderr there.
# This is a Slurm/FARM convention, not part of BLAST itself.
mkdir -p logs

# Basic usage
sbatch blastn-job.sbatch ref.fasta query.fasta

# Optional: specify an output prefix
sbatch blastn-job.sbatch ref.fasta query.fasta my_blast_run
```

Arguments:

1. `$1` – reference FASTA (used to build the BLAST DB)
2. `$2` – query FASTA
3. `$3` – output prefix (optional; default: `blast_results`)

Output:

- Alignment results: `<out_prefix>.blastn.outfmt6.tsv`
- Log files: `logs/blast_job_<jobid>.out` and `.err`

---

## Default BLASTN behavior in this template

The script runs BLAST with a minimal set of options, roughly:

```bash
blastn   -query "$QUERY_FASTA"   -db "$DB_PREFIX"   -out "$OUT_TAB"   -outfmt 6   -num_threads "${SLURM_CPUS_PER_TASK:-1}"
```

Everything else uses BLASTN’s built-in defaults. In practice, that means:

- A relatively **permissive E-value threshold** (many weak hits will be reported).
- **No explicit percent-identity filter** — alignments of any identity can appear if they score well enough.
- A default **word size**, scoring scheme, and gap penalties that are fine for general DNA–DNA homology searches.
- BLAST will typically return multiple hits per query, sometimes many, depending on how similar your database is.

For quick exploratory searches, these defaults are usually fine. For more stringent analyses, you’ll probably want to tighten the criteria (see below).

---

## Output format: BLAST tabular (outfmt 6)

The script uses `-outfmt 6`, which is tab-delimited with one hit per line.  
Default columns (in order):

1. `qseqid` – query sequence ID  
2. `sseqid` – subject (reference) sequence ID  
3. `pident` – percent identity  
4. `length` – alignment length  
5. `mismatch` – number of mismatches  
6. `gapopen` – number of gap openings  
7. `qstart` – start of alignment in query  
8. `qend` – end of alignment in query  
9. `sstart` – start of alignment in subject  
10. `send` – end of alignment in subject  
11. `evalue` – expectation value  
12. `bitscore` – bit score

You can parse this file with R, Python, or command-line tools (e.g. `cut`, `awk`, `csvkit`).

---

## Changing BLAST parameters

To change thresholds or behavior, edit the `blastn` command near the bottom of the sbatch script.

Common tweaks:

- **Stricter E-value cutoff (fewer, stronger hits):**
  ```bash
  blastn     -query "$QUERY_FASTA"     -db "$DB_PREFIX"     -out "$OUT_TAB"     -outfmt 6     -evalue 1e-5     -num_threads "${SLURM_CPUS_PER_TASK:-1}"
  ```

- **Limit the number of hits per query:**
  ```bash
  blastn     -query "$QUERY_FASTA"     -db "$DB_PREFIX"     -out "$OUT_TAB"     -outfmt 6     -max_target_seqs 50     -num_threads "${SLURM_CPUS_PER_TASK:-1}"
  ```

- **Require higher percent identity (e.g., ≥95%):**
  ```bash
  blastn     -query "$QUERY_FASTA"     -db "$DB_PREFIX"     -out "$OUT_TAB"     -outfmt 6     -perc_identity 95     -num_threads "${SLURM_CPUS_PER_TASK:-1}"
  ```

You can combine these (e.g. `-evalue 1e-20 -perc_identity 90 -max_target_seqs 20`) depending on how strict you want the search to be.

---

## Notes and other BLAST types

- This script assumes **nucleotide** sequences and uses:
  ```bash
  makeblastdb -dbtype nucl
  blastn -db <db> -query <query>
  ```
- To adapt for **protein** or translated BLAST:
  - Build a protein DB (`-dbtype prot`) from a protein FASTA.
  - Use `blastp`, `tblastn`, `tblastx`, etc. instead of `blastn`.
  - Adjust parameters (`-evalue`, scoring matrix, etc.) as needed for your use case.

BLAST+ documentation and other BLAST types:  
- https://blast.ncbi.nlm.nih.gov/Blast.cgi

---

**Author:** Grey  
**Last updated:** Dec 6, 2025
