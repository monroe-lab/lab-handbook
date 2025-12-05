# Project directory structure on Farm

This guide explains how we **recommend structuring your project directories on Farm** so that:

- Raw data is clearly separated from working and results files  
- Projects are reproducible and easy for others to understand  
- You don’t end up with a giant, stressful folder full of hundreds of files

The high‑level idea:

- **Raw data** lives in **`/group/gmonroegrp3`**  
- **Working project directories** live in **your home directory**  
- **Final/important results** eventually move to **`/group/gmonroegrp2`** for long‑term storage

---

## 1. Where things live (big picture)

### 1.1 Raw data → `/group/gmonroegrp3`

- All **raw sequencing data** (FASTQ, BAM, etc.) from the Genome Center or other sources should be stored in:

  ```text
  /group/gmonroegrp3/
  ```

- Create **clear, descriptive directory names** so they can be found later, e.g.:

  ```text
  /group/gmonroegrp3/pistachio_mutation_2025/
  /group/gmonroegrp3/poplar_CBI_experiment1/
  ```

- Within those, you might have:

  ```text
  raw/
  ├── sample1_R1.fastq.gz
  ├── sample1_R2.fastq.gz
  ├── sample2_R1.fastq.gz
  └── sample2_R2.fastq.gz
  ```

Raw data in Group 3 is your **single source of truth**. Don’t copy these files all over the place—link to them.

---

### 1.2 Working projects → your home directory

Use your **home directory** as your sandbox and main working area:

```text
/home/yourID/
```

Here, for each project, create a project folder like:

```text
~/projects/pistachio_mutation_2025/
```

Inside that project folder, we recommend **three top‑level directories**:

```text
pistachio_mutation_2025/
├── code/
├── data/
└── results/
```

We’ll describe each of these in more detail below.

---

### 1.3 Final/important results → `/group/gmonroegrp2`

When a project reaches a **stable stage** (e.g. paper figures, final VCFs, final assemblies):

- Copy or move the key outputs to:

  ```text
  /group/gmonroegrp2/
  ```

- Organize them similarly to Group 3, with clear names:

  ```text
  /group/gmonroegrp2/pistachio_mutation_2025/
      final_vcfs/
      assemblies/
      annotations/
      summary_tables/
  ```

Think of Group 2 as the **long‑term home** for derived data:

- VCFs / variant call sets
- Final alignment sets (if you truly need to keep them)
- Final assemblies (FASTA)
- Final annotations (GFF/GTF)
- Final curated result tables, matrices, etc.

Your home directory remains the **scratch/work area**; Group 2 is for **stable outputs** worth preserving.

---

## 2. Using soft links to reference raw data

Raw data stays in `/group/gmonroegrp3`, but you often need it in your project `data/` pipeline. Instead of copying, use **symbolic links (soft links)**.

### 2.1 Basic `ln -s` syntax

```bash
ln -s /path/to/original /path/to/link
```

- First argument: the **real file or directory** (in Group 3).
- Second argument: the **link** you’re creating in your project directory.

Example: link raw FASTQs into your project `data/` directory:

```bash
cd ~/projects/pistachio_mutation_2025/data

ln -s /group/gmonroegrp3/pistachio_mutation_2025/raw/sample1_R1.fastq.gz .
ln -s /group/gmonroegrp3/pistachio_mutation_2025/raw/sample1_R2.fastq.gz .
```

Now commands run in your project directory can treat these as local files, but they **don’t consume extra storage**.

You can also link entire directories:

```bash
ln -s /group/gmonroegrp3/pistachio_mutation_2025/raw ./0_raw
```

---

## 3. Suggested layout inside `data/`

Inside the project’s `data/` directory, we recommend **numbered subdirectories** that follow the pipeline order. For example:

```text
data/
├── samples.txt
├── 1_trimmed/
├── 2_aligned/
└── 3_variants/
```

### 3.1 `samples.txt`

A simple text file listing sample IDs:

```text
sample1
sample2
sample3
```

This file can be used by scripts and Slurm arrays to loop over samples.

### 3.2 `1_trimmed/` – trimmed reads

- Contains **trimmed FASTQ files**, adapter‑removed/cleaned by tools like `fastp`, `Trimmomatic`, etc.
- Example:

  ```text
  data/1_trimmed/
  ├── sample1_trimmed_R1.fastq.gz
  ├── sample1_trimmed_R2.fastq.gz
  ├── sample2_trimmed_R1.fastq.gz
  └── sample2_trimmed_R2.fastq.gz
  ```

### 3.3 `2_aligned/` – alignments

- Contains **aligned BAMs** (and maybe indexes):

  ```text
  data/2_aligned/
  ├── sample1.sorted.bam
  ├── sample1.sorted.bam.bai
  ├── sample2.sorted.bam
  └── sample2.sorted.bam.bai
  ```

### 3.4 `3_variants/` – variant calls

- Contains **VCF** (or BCF) files and indexes:

  ```text
  data/3_variants/
  ├── sample1.vcf.gz
  ├── sample1.vcf.gz.tbi
  ├── sample2.vcf.gz
  └── sample2.vcf.gz.tbi
  ```

You can extend this pattern:

```text
4_qc/
5_joint_calls/
6_annotation/
```

The **numeric prefixes** help your future self (and others) quickly see the order of steps in the pipeline.

---

## 4. Structuring the `code/` directory

Inside `code/`, there are two common approaches. Use whichever fits your style and maturity of the project.

```text
code/
├── sbatch/
├── shell/
└── notebooks/   (optional: R, Python, etc.)
```

### 4.1 “Core script” approach (recommended long‑term)

Idea:

- You maintain **reusable, general scripts** in a central directory in your home:

  ```text
  ~/farm_core_scripts/
  ├── trim_fastqs.sbatch
  ├── align_reads.sbatch
  ├── call_variants.sbatch
  └── common_functions.sh
  ```

- These scripts should:
  - Be **general** (not hard‑coded to one project).
  - Accept **arguments**, e.g.:
    - input directory
    - output directory
    - samples file
    - reference path
  - Handle loops over samples internally, or via Slurm arrays.

- Then, in a specific project’s `code/` directory, you create **small wrapper scripts** that call those core scripts with project‑specific paths.

Example wrapper in `code/`:

```bash
#!/bin/bash
# code/run_trim_all.sh

set -euo pipefail

PROJECT_ROOT="$HOME/projects/pistachio_mutation_2025"
SAMPLES="${PROJECT_ROOT}/data/samples.txt"
RAW_DIR="/group/gmonroegrp3/pistachio_mutation_2025/raw"
OUT_DIR="${PROJECT_ROOT}/data/1_trimmed"

sbatch ~/farm_core_scripts/trim_fastqs.sbatch "$SAMPLES" "$RAW_DIR" "$OUT_DIR"
```

This way:

- You have **one well‑written script** for trimming, alignment, etc.
- Each project’s `code/` only contains simple, easy‑to‑read project‑specific wrappers.
- Bug fixes to your core scripts benefit all projects.

---

### 4.2 “Project‑local code” approach (simpler, but more duplication)

Alternative: just keep **all scripts directly in the project**:

```text
code/
├── trim_fastqs.sbatch
├── align_reads.sbatch
├── call_variants.sbatch
└── helper_functions.sh
```

Pros:

- Simple to understand.
- Everything is in one place for that project.

Cons:

- You’ll copy/paste similar sbatch scripts across many projects.
- Fixes need to be applied in multiple locations.
- Harder to maintain as you grow more projects.

This approach is fine when you’re starting out; over time, moving towards the **core script pattern** is usually better.

---

## 5. Structuring the `results/` directory

The `results/` directory is for **clean, interpretable outputs**:

- Final VCFs you care about.
- Assembly FASTA files and corresponding GFF annotations.
- Summary tables (e.g., TSV/CSV that will be used in R/Python for plotting).
- Figures, plots, and small processed datasets.

Example:

```text
results/
├── vcfs/
│   ├── pistachio_joint_filtered.vcf.gz
│   └── pistachio_joint_filtered.vcf.gz.tbi
├── assemblies/
│   ├── cultivarA_assembly.fasta
│   └── cultivarA_assembly.fasta.fai
├── annotations/
│   └── cultivarA_annotations.gff3
└── tables/
    ├── variant_summary_per_gene.tsv
    └── sample_qc_metrics.tsv
```

This is also often the best place to stage files that you plan to **download to your local machine** for downstream analysis or figure making.

Once these outputs are “final enough,” you should:

- Copy them to the appropriate directory in `/group/gmonroegrp2` for long‑term storage.
- Make sure there is a small `README.md` there describing:
  - What the files are
  - How they were generated (which script / commit / date)

---

## 6. Example full project layout

Putting it all together, a project might look like:

```text
~/projects/pistachio_mutation_2025/
├── code/
│   ├── run_trim_all.sh
│   ├── run_align_all.sh
│   ├── run_variant_calling.sh
│   └── helpers.sh
├── data/
│   ├── samples.txt
│   ├── 1_trimmed/
│   ├── 2_aligned/
│   └── 3_variants/
└── results/
    ├── vcfs/
    ├── assemblies/
    ├── annotations/
    └── tables/
```

Meanwhile:

```text
/group/gmonroegrp3/pistachio_mutation_2025/raw/     # raw reads only
/group/gmonroegrp2/pistachio_mutation_2025/         # final/important results
```

---

## 7. Keep things tidy (5‑minute cleanup rule)

To avoid chaotic directories:

- **Avoid huge flat folders** with hundreds of mixed files.
- Group related files into subdirectories (`1_trimmed`, `2_aligned`, `3_variants`, etc.).
- Use **consistent naming** for samples and outputs.

A simple habit that helps a lot:

> At the end of each Farm session, spend **5 minutes** tidying your project:
> - Delete obvious temporary files you won’t need again.
> - Move finalized outputs from `data/` into `results/` if appropriate.
> - Make sure new important files are documented in a small `README` in that folder.

Your future self (and your labmates) will be very grateful when they open the project six months later and can still understand what’s going on.

