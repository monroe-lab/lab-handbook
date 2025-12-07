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
3. Run `blastn` using the FARM Slurm resources you requested. `module load blast`
4. Write tabular results (`outfmt 6`) to a TSV file.

---

## Usage

From a directory where you want to run BLAST:

```bash

mkdir -p logs # FYI: this is just because we have our sbatch job set to write out log files to a directory called 'logs/' in the working directory.  It's not an essential part of Blast, per se  just a feature of our Slurm workflow 

# Basic usage
sbatch blastn-job.sbatch ref.fasta query.fasta

# Optional: specify an output prefix
sbatch blast-job.sbatch ref.fasta query.fasta my_blast_run
```

Arguments:

1. `$1` – reference FASTA (used to build the BLAST DB)
2. `$2` – query FASTA
3. `$3` – output prefix (optional; default: `blast_results`)

Output:

- Alignment results: `<out_prefix>.blastn.outfmt6.tsv`
- Log files: `logs/blast_job_<jobid>.out` and `.err`

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

## Notes and modifications

- This script assumes **nucleotide** sequences and uses:
  ```bash
  makeblastdb -dbtype nucl
  blastn -db <db> -query <query>
  ```
- To adapt for **protein** BLAST, you would:
  - Build a protein DB (`-dbtype prot`)
  - Use `blastp`, `tblastn`, or `tblastx` instead of `blastn`
  - Adjust parameters accordingly

BLAST+ documentation and other BLAST types:  
- <https://blast.ncbi.nlm.nih.gov/Blast.cgi>

---

**Author:** Grey  
**Last updated:** Dec 6, 2025
