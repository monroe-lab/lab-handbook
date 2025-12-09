# HiFi Pipeline Scripts (/home/gmonroe/scripts/hifi_pipeline)


### This is a fairly basic pipeline for calling variants from PacBio HiFi data. Note, it does not include DeepVariant calling. 

## Quick Start: How to Actually Use This

You only need **three things** to spin up a new HiFi project and run the pipeline:

1. **A project directory** – where all results will live (BAMs, VCFs, logs, etc.).  
2. **A source data directory** – where the raw PacBio HiFi reads live (`.fastq.gz` or `.bam`).  
3. **A reference genome FASTA** – the file you want to map to (can be anywhere; you’ll symlink it).

### 1. Set your variables

```bash
# Example paths – change these for your project
projdir=/home/gmonroe/projects/20251208_mddcc          # NEW project directory
datadir=/group/gmonroegrp3/grey/20251208_mddcc         # Where raw HiFi files live (.fastq.gz or .bam)
ref_src=/home/gmonroe/data/Col-CC/ncbi_dataset/data/GCA_028009825.2/GCA_028009825.2_Col-CC_genomic.fna
```

### 2. Create the standard project layout

```bash
mkdir -p "${projdir}"/{0_raw_data,0.1_fastq_qc,1_alignments,1.1_alignment_qc,2_variant_calls,ref,logs}
```

### 3. Symlink the reference into the project

```bash
ln -s "${ref_src}" "${projdir}/ref/Col-CC.genomic.fna"
```

Now the reference is available inside the project as:

```text
${projdir}/ref/Col-CC.genomic.fna
```

### 4. Symlink your raw data into `0_raw_data/`

This works for both `*.fastq.gz` **and** `*.bam` input files; they’ll be treated as separate “samples” by name.

```bash
cd "${projdir}/0_raw_data"

# Symlink all fastq.gz and/or bam files from the source directory
for f in "${datadir}"/*.fastq.gz "${datadir}"/*.bam; do
  [ -e "$f" ] || continue   # skip if no matches of that pattern
  ln -s "$f" .
done

ls -l
```

At this point, your project directory is ready for the pipeline scripts.

### 5. Run QC + alignment + variant calling for all samples

From inside the project directory:

```bash
proj="${projdir}"
ref=ref/Col-CC.genomic.fna
cd "$proj"

# FastQC on all FASTQs (only runs on .fastq.gz files)
for fq in 0_raw_data/*.fastq.gz; do
  [ -e "$fq" ] || continue
  sbatch /home/gmonroe/scripts/hifi_pipeline/fastqc.sbatch.sh "$proj" "$fq"
done

# Alignment + automatic variant calling on all inputs (FASTQ *or* BAM)
for f in 0_raw_data/*.{fastq.gz,bam}; do
  [ -e "$f" ] || continue
  sbatch /home/gmonroe/scripts/hifi_pipeline/align_pbmm2.sbatch.sh     "$proj"     "$f"     "$ref"     call_variants
done
```

What this does, per sample:

- Aligns reads with **pbmm2** (if input is FASTQ).  
- If the input is already a BAM, it **skips alignment** but still runs QC + BED12 export.  
- Submits a follow-on **variant-calling job** (`call_variants.sbatch.sh`) using:
  - `bcftools mpileup + call`
  - `longshot`
  - `pbsv` (structural variants)

You can monitor progress inside a project with:

```bash
/home/gmonroe/scripts/hifi_pipeline/check_project_status.sh
```

---

## At a Glance

- **Mapper:** `pbmm2` (PacBio-aware minimap2 wrapper)
- **Variant callers (SNVs/indels/SVs):**
  - `bcftools mpileup + call` ("mpileup") – baseline small-variant calls
  - `longshot` – long-read–aware small-variant caller
  - `pbsv` – PacBio structural variant (SV) caller
- **Read QC:** `FastQC`
- **Utilities:** `samtools`, `bedtools`, `mosdepth`, `bcftools`, `seqkit`

All scripts assume you are using the **`hifi_pipe`** conda/mamba environment and running on the Farm Slurm cluster.  
They accept **either** gzipped FASTQs (`*.fastq.gz`) **or** aligned BAMs (`*.bam`) as inputs:

- If you pass a **FASTQ**, `align_pbmm2.sbatch.sh` will perform alignment and create the BAM.  
- If you pass a **BAM**, `align_pbmm2.sbatch.sh` will detect it and **reuse** the existing BAM, only running QC + BED12 and optional variant calling.

---

## 1. Conda / mamba environment

Environment is created once (documented here so you remember what’s inside):

```bash
# Create environment
conda create -n hifi_pipe   -c conda-forge -c bioconda   pbmm2   samtools   bcftools   seqkit   fastqc   longshot   mosdepth   bedtools   -y

# Inside the environment, install pbsv (PacBio SV caller)
mamba install -n hifi_pipe -c bioconda -c conda-forge pbsv -y

# (Optional) Export environment
conda activate hifi_pipe
conda env export > ~/scripts/hifi_pipeline/hifi_pipe_env.yaml
```

Each `sbatch` script does:

```bash
source ~/.bashrc
conda activate hifi_pipe
```

so the tools above are available on the cluster nodes.

---

## 2. Scripts in this folder

This folder is intended to live at:

```text
/home/gmonroe/scripts/hifi_pipeline/
```

and currently contains (at least):

- `fastqc.sbatch.sh` – run FastQC on a single FASTQ
- `align_pbmm2.sbatch.sh` – map one FASTQ/BAM to a reference with pbmm2 (+ BAM QC + BED12 + optional variant calling)
- `call_variants.sbatch.sh` – call variants from an existing BAM using bcftools, longshot, pbsv
- `check_project_status.sh` – summarize the status of a project directory (which steps completed for which samples)

Each of these is **project-agnostic**: you always pass a `PROJECT_DIR` and an input file (`FASTQ` or `BAM`), plus a `REF_FASTA` where needed.

---

## 3. Script details

### 3.1. `fastqc.sbatch.sh`

**Purpose:**  
Run FastQC on a single FASTQ and write HTML/zip outputs into the project’s QC directory.

> Note: this script is only for `*.fastq.gz` inputs (FastQC works on FASTQs, not BAMs).

**Usage:**

```bash
sbatch fastqc.sbatch.sh PROJECT_DIR FASTQ
```

- `PROJECT_DIR` – path to the project (e.g. `/home/gmonroe/projects/20251208_mddcc`)
- `FASTQ` – FASTQ file path *relative to `PROJECT_DIR`* or absolute (e.g. `0_raw_data/0855.fastq.gz`)

**Outputs (inside `PROJECT_DIR`):**

- `0.1_fastq_qc/SAMPLE_fastqc.html`
- `0.1_fastq_qc/SAMPLE_fastqc.zip`
- Slurm logs in `logs/fastqc_JOBID.out/err`

---

### 3.2. `align_pbmm2.sbatch.sh`

**Purpose:**  
Map one HiFi FASTQ to a reference using `pbmm2`, generate BAM + basic alignment QC, and export BED12 + multi-mapped read summaries.  
If the input is already an aligned BAM, the script **reuses that BAM** and still produces QC and BED12 outputs.  
Optionally, it can immediately submit a follow-on variant-calling job.

**Usage:**

```bash
sbatch align_pbmm2.sbatch.sh PROJECT_DIR INPUT REF_FASTA [CALL_VARIANTS] [OVERWRITE]
```

- `PROJECT_DIR` – project directory (e.g. `/home/gmonroe/projects/20251208_mddcc`)
- `INPUT` – either:
  - a FASTQ path relative to `PROJECT_DIR` (e.g. `0_raw_data/0855.fastq.gz`), or
  - a BAM path relative to `PROJECT_DIR` (e.g. `0_raw_data/0855.bam`)
- `REF_FASTA` – reference FASTA; absolute or relative to `PROJECT_DIR` (e.g. `ref/Col-CC.genomic.fna`)
- `CALL_VARIANTS` (optional) – if set to `call_variants`, submit `call_variants.sbatch.sh` after alignment/QC
- `OVERWRITE` (optional) – if set to `overwrite`, delete and recreate all BAM/QC/BED12 outputs for that sample

**Key behavior:**

- If `INPUT` ends in `.bam`:
  - Treats that as the **BAM for the sample**, and **skips alignment**.
  - Still runs QC (`flagstat`, `idxstats`) and BED12/multi-mapper export.
- If `INPUT` ends in `.fastq.gz`:
  - Builds `pbmm2` index `REF_FASTA.mmi` if it does not exist.
  - Runs `pbmm2 align` to produce `SAMPLE.bam` in `1_alignments/`.

Per sample, writes to `PROJECT_DIR/1_alignments/`:

- `SAMPLE.bam` + `SAMPLE.bam.bai`
- `SAMPLE.bed12.gz` – gzipped BED12 from `bedtools bamtobed -bed12`
- `SAMPLE.multimapped.names` – read names appearing more than once in BED12 (multi-mapped/split reads)
- `SAMPLE.multimapped.bed12.gz` – BED12 subset for those multi-mapped reads

Per sample, writes to `PROJECT_DIR/1.1_alignment_qc/`:

- `SAMPLE.flagstat.txt`
- `SAMPLE.idxstats.txt`

**Overwrite logic:**

- If `OVERWRITE != overwrite` and `SAMPLE.bam` exists in `1_alignments/`, alignment/QC/BED12 steps are **skipped**.
- If `OVERWRITE == overwrite`, existing BAM/QC/BED12 outputs are removed and recomputed (or regenerated from an input BAM).

**Chaining to variant calling:**

- If `CALL_VARIANTS` is exactly `call_variants`, the script runs:

  ```bash
  sbatch /home/gmonroe/scripts/hifi_pipeline/call_variants.sbatch.sh PROJECT_DIR INPUT REF_FASTA [CALLERS] [OVERWRITE]
  ```

  passing the same `PROJECT_DIR`, `INPUT`, `REF_FASTA`, and propagating `OVERWRITE`.  
  The variant-calling script figures out the sample name from the basename of `INPUT`.

---

### 3.3. `call_variants.sbatch.sh`

**Purpose:**  
Call variants for one sample using one or more of:

- `bcftools mpileup + call` – baseline SNV/indel calls
- `longshot` – PacBio-aware SNV/indel calls
- `pbsv` – PacBio structural variants

**Usage:**

```bash
sbatch call_variants.sbatch.sh PROJECT_DIR INPUT [REF_FASTA] [CALLERS] [OVERWRITE]
```

- `PROJECT_DIR` – project directory (e.g. `/home/gmonroe/projects/20251208_mddcc`)
- `INPUT` – same string used for `align_pbmm2.sbatch.sh`:
  - usually a FASTQ path like `0_raw_data/0855.fastq.gz`, or
  - a BAM path like `0_raw_data/0855.bam`
- The script derives the sample name from the basename of `INPUT` and expects the BAM as:
  - `PROJECT_DIR/1_alignments/SAMPLE.bam`
- `REF_FASTA` (optional) – reference FASTA; if omitted, script tries to auto-detect a single FASTA in `PROJECT_DIR/ref/`
- `CALLERS` (optional) – comma-separated list, no spaces; default: `mpileup,longshot,pbsv`  
  - Allowed values: `mpileup`, `longshot`, `pbsv`
- `OVERWRITE` (optional) – if `overwrite`, existing VCFs for that sample and caller are deleted and re-run

**Expected inputs:**

- Corresponding BAM in `PROJECT_DIR/1_alignments/SAMPLE.bam` (from `align_pbmm2.sbatch.sh` or pre-existing).

**Outputs (per sample) in `PROJECT_DIR/2_variant_calls/`:**

- If `mpileup` selected:
  - `SAMPLE.bcftools.vcf.gz`
  - `SAMPLE.bcftools.vcf.gz.csi`
- If `longshot` selected:
  - `SAMPLE.longshot.vcf.gz`
  - `SAMPLE.longshot.vcf.gz.tbi`
- If `pbsv` selected:
  - `SAMPLE.pbsv.svsig.gz` (intermediate signal file)
  - `SAMPLE.pbsv.vcf.gz`
  - `SAMPLE.pbsv.vcf.gz.tbi`

**Overwrite logic:**

- For each caller, if the main output VCF exists and `OVERWRITE != overwrite`, that caller is **skipped**.
- If `OVERWRITE == overwrite`, any existing outputs for that caller are removed before re-running.

**Reference naming quirk for `pbsv`:**

- `pbsv` is picky about the reference file extension. If `REF_FASTA` does **not** end in `.fa` or `.fasta` (e.g. `.fna`), the script automatically creates a symlink with a `.fa` suffix in the project’s `ref/` directory and uses that for `pbsv call`.

---

### 3.4. `check_project_status.sh`

**Purpose:**  
Quickly summarize the state of a HiFi project directory: which steps have been run for which samples.

**Usage (run from inside a project):**

```bash
proj=/home/gmonroe/projects/20251208_mddcc
cd "$proj"

/home/gmonroe/scripts/hifi_pipeline/check_project_status.sh
```

**What it reports:**

- Checks for expected directories:
  - `0_raw_data/`, `0.1_fastq_qc/`, `1_alignments/`, `1.1_alignment_qc/`, `2_variant_calls/`, `ref/`, `logs/`
- Lists reference FASTA(s) in `ref/` and prints symlink targets.
- Confirms presence of the core scripts in `~/scripts/hifi_pipeline/`.
- For each input file in `0_raw_data/` (by basename), prints a simple status table with columns like:
  - `FQ/BAM` – input file found
  - `QC` – FastQC HTML exists (for FASTQs)
  - `BAM` – BAM exists
  - `BED12` – `SAMPLE.bed12.gz` exists
  - `bcftools` – `SAMPLE.bcftools.vcf.gz` exists
  - `longshot` – `SAMPLE.longshot.vcf.gz` exists
  - `pbsv` – `SAMPLE.pbsv.vcf.gz` exists

This gives you an at-a-glance view of which samples have completed which stages.

---

## 4. Minimal usage examples

Assume:

```bash
proj=/home/gmonroe/projects/20251208_mddcc
ref=ref/Col-CC.genomic.fna
cd "$proj"
```

### 4.1. Run FastQC for all FASTQs

```bash
for fq in 0_raw_data/*.fastq.gz; do
  [ -e "$fq" ] || continue
  sbatch /home/gmonroe/scripts/hifi_pipeline/fastqc.sbatch.sh "$proj" "$fq"
done
```

### 4.2. Align all inputs and immediately call variants

Works whether `0_raw_data/` contains `*.fastq.gz`, `*.bam`, or both:

```bash
for f in 0_raw_data/*.{fastq.gz,bam}; do
  [ -e "$f" ] || continue
  sbatch /home/gmonroe/scripts/hifi_pipeline/align_pbmm2.sbatch.sh     "$proj"     "$f"     "$ref"     call_variants
done
```

### 4.3. Re-run everything for a single sample with overwrite

```bash
input=0_raw_data/0855.fastq.gz   # or 0_raw_data/0855.bam

sbatch /home/gmonroe/scripts/hifi_pipeline/align_pbmm2.sbatch.sh   "$proj"   "$input"   "$ref"   call_variants   overwrite
```

---

## 5. Where to look when something breaks

- **Conda / tools not found:**  
  Check `~/.bashrc` for `conda init` and verify `hifi_pipe` exists:
  ```bash
  conda env list | grep hifi_pipe
  ```
- **Slurm errors / crashes:**  
  Examine corresponding `logs/*.err` and `logs/*.out` (or use your `slog` helper).
- **Missing outputs for some samples:**  
  Run:
  ```bash
  /home/gmonroe/scripts/hifi_pipeline/check_project_status.sh
  ```
  to see which stage failed or was skipped.

This README is meant to be a quick reference for *what each script does* and *how to use the pipeline end-to-end* without digging into the code every time.
