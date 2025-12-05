# Storage and backup

Our group has **~300 TB** of storage on Farm. That sounds like a lot, but with modern genomics datasets it can be used very quickly. We need to be intentional about **where** things live and **what** we keep.

At a high level, we have **three main storage locations**:

1. **Home directory** – working space for active projects  
2. **Group 3** – raw, immutable data  
3. **Group 2** – long-term storage of derived / processed data

---

## 1. Storage locations

### 1.1 Home directory

- Path: `~/` or `/home/$USER/`
- This is part of a shared pool of home directories for all users on Farm.
- Treat this as your **working directory** for:
  - Scripts, notebooks, small text files
  - Active project folders
  - Small test datasets

**Do NOT** store large raw sequencing data here, and avoid keeping huge intermediate files long-term.

---

### 1.2 Group 3: raw data

- Path: `/group/gmonroegrp3/`
- Purpose: **raw, immutable data storage**, such as:
  - Original FASTQ files from the Genome Center or other sequencing providers
  - Raw long-read data (e.g., HiFi CCS BAM/FASTQ)
  - Original reference genomes / annotation files (if not already centrally available)

Rules of thumb:

- Group 3 is the **“source of truth”** for raw data.
- Raw files should be **written once**, then treated as read-only:
  - Don’t edit or move raw data around arbitrarily.
  - If you need it somewhere else, use **soft links** (see commands below).
- Any analysis should point back to data in `/group/gmonroegrp3/` via symlinks, not copies, unless the software absolutely requires local copies.

---

### 1.3 Group 2: derived data

- Path: `/group/gmonroegrp2/`
- Purpose: **long-term storage of derived/processed data**, such as:
  - Cleaned / trimmed FASTQ files
  - Alignment files (BAM/CRAM) that we decide to keep
  - VCF and other variant files
  - Genome assemblies and annotations
  - Processed phenotype tables, summary stats, etc.

General workflow:

1. **Raw data** lives in `/group/gmonroegrp3/`.
2. You **work** in your home directory on a project (scripts, logs, small test files).
3. When a project reaches a stable stage (e.g., final alignments, final VCFs, final assembly):
   - Move those **final derived outputs** into `/group/gmonroegrp2/PROJECT_NAME/`.
   - Clean up unnecessary intermediates in your home directory and working locations.

Group 2 is where **important derived results** should live for the long term.

---

## 2. Documenting your data

For every project, both raw and derived data must be **discoverable and understandable** in the future.

For each project directory (in Group 3 and Group 2):

- Create a `README.md` (or similar) that includes:
  - **Project name and brief description**
  - **Who** generated the data (person, lab, collaborator)
  - **When** the data were generated / received
  - **Source** (e.g., Genome Center order ID, sequencing provider, public archive)
  - **File descriptions**:
    - What each major file or subdirectory contains
    - Any non-obvious formats or conventions
  - **Pipeline notes**:
    - Brief summary of the pipeline and software used
    - Where to find the scripts or workflow (git repo, path, etc.)

We also maintain a **shared data inventory** (see the link in the main lab handbook README). Whenever you add a new major dataset to Group 2 or Group 3, add an entry to that inventory.

Think of this as answering:  
> "If someone comes back in two years and needs this data, can they tell what it is and how it was generated without emailing you?"

---

## 3. Best practices for data storage

1. **Compress files whenever possible**
   - Use `gzip`, `bgzip`, or other appropriate compression tools.
   - Examples: `*.fastq.gz`, `*.vcf.gz`.
   - Many genomics tools can read compressed files directly.

2. **Avoid copying large files**
   - Prefer **soft links** (symlinks) instead of making duplicate copies.
   - This is especially important for raw FASTQs, BAMs, and other multi-GB files.

3. **Delete unnecessary intermediates**
   - Pipelines often produce multiple large intermediate files. For example:
     - Raw BAM → sorted BAM → mark-dup BAM
   - If only the final `sorted, mark-dup` BAM is used downstream, delete the earlier intermediates once you’ve verified success.
   - Similarly, if you generate temporary FASTQ subsets, intermediate VCFs, or indexing files that are easily reproducible, **remove them** when the pipeline finishes successfully.

4. **Design pipelines to minimize intermediates**
   - Where possible, **pipe** commands instead of writing intermediate files:
     - e.g., `samtools view | samtools sort | samtools markdup` in a single chain.
   - Use existing workflow engines (Snakemake, Nextflow, etc.) that manage temporary files and clean up automatically.

5. **Keep scripts, not extra copies of data**
   - As long as you:
     - Have the **raw data**, and
     - Keep the **scripts / workflow files** used to produce derived data
   - You can always regenerate intermediates later. This is better than paying permanent storage costs for everything.

6. **Flag candidates for deletion at project end**
   - In your project `README.md`, add a section like:
     - `## Deletion candidates`
   - List:
     - Large intermediates that can be safely regenerated (e.g., alignments if we have raw reads + pipeline).
     - Temporary working directories that can be deleted after paper submission or after a defined period.

---

## 4. Useful commands

### 4.1 Creating soft links

Create a symlink in your working directory pointing to raw data in Group 3:

```bash
# From your project directory
ln -s /group/gmonroegrp3/PROJECT/raw_data/sample1_R1.fastq.gz .
ln -s /group/gmonroegrp3/PROJECT/raw_data/sample1_R2.fastq.gz .
```

Now your pipeline sees the files locally, but they only exist once on disk.

To link a whole directory:

```bash
ln -s /group/gmonroegrp3/PROJECT/raw_data raw_data
```

---

### 4.2 Compressing files with gzip

Compress a single file:

```bash
gzip myfile.fastq
# -> myfile.fastq.gz
```

Compress all FASTQ files in a directory:

```bash
gzip *.fastq
```

Use `gunzip` to decompress:

```bash
gunzip myfile.fastq.gz
```

---

### 4.3 Checking disk usage

Check your usage in the current directory:

```bash
du -sh .
```

Check the size of each item in the current directory, sorted by size:

```bash
du -sh * | sort -h
```

Check your home directory usage:

```bash
du -sh /home/$USER
```

Check a specific project directory in Group 2 or Group 3:

```bash
du -sh /group/gmonroegrp2/PROJECT_NAME
du -sh /group/gmonroegrp3/PROJECT_NAME
```

These commands help you find the **biggest offenders** so you can decide what to compress, move, or delete.

---

If you’re unsure where to put a dataset or whether something can be deleted, ask in the lab Slack or check with Grey before removing large files.
