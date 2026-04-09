---
type: guide
title: "Farm code lesson 3: Bioinformatics tools & file formats (crash course)"
---

# Farm code lesson 3: Bioinformatics tools & file formats (crash course)

This lesson is a **high‑level tour of bioinformatics on Farm**: what kinds of tools exist, what file formats you’ll see, and what it *feels like* to run real tools at the command line.

By the end you should:

- Recognize the **core file types** we use (FASTQ, FASTA, BAM, BED, VCF, GFF, etc.)
- Have a sense of the **main categories of tools** (QC, alignment, variant calling, assembly, epigenomics, utilities)
- Be able to run a **simple BLAST example** using `module load blast`

In **Lesson 4**, we’ll go deeper into:

- `module load` / modules in general  
- Installing your own tools  
- Managing **software environments** (conda/mamba, containers, etc.)

For now, this is a conceptual “map” of the landscape plus one concrete hands‑on tool (BLAST).

---

## 1. Big picture: what does a bioinformatics pipeline do?

For our lab, a typical project looks roughly like:

1. **Data generation**  
   - Sequencing at the Genome Center or elsewhere.
   - Data arrives as:
     - Short reads (Illumina) – usually **FASTQ** files (`*.fastq.gz`)
     - Long reads (PacBio HiFi) – often **BAM** files or FASTQ files

2. **Pre‑processing / QC**
   - Check read quality.
   - Possibly trim adapters / low‑quality bases.
   - Maybe filter reads or remove contaminants.

3. **Alignment / mapping** or **assembly**
   - **Alignment**: map reads to a reference genome → **BAM** files.
   - **Assembly**: build a genome from reads → **FASTA** assembly and related files.

4. **Variant calling / feature calling**
   - Identify SNPs, indels, structural variants → **VCF** or similar.
   - For epigenomics / ChIP‑seq / ATAC‑seq → call peaks, coverage tracks, etc.

5. **Annotation and interpretation**
   - Map variants or peaks to genes → **GFF/GTF**, BED, etc.
   - Merge results with phenotypes, statistics, plots, etc.

Along the way, we use **many tools**, but the basic patterns repeat:

- A tool reads input files (e.g. FASTQ, BAM).
- You specify options/arguments (e.g. number of threads, mode).
- It writes output files (BAM, VCF, etc.).
- You may need to **index** the outputs to use them efficiently later.

---

## 2. Core file formats you’ll see a lot

There are dozens of file types, but these are some essential **basics**.

### 2.1 FASTQ – raw reads with quality

- Contains **sequencing reads** and associated **per‑base quality scores**.
- Each read = 4 lines:
  1. `@` + read ID
  2. Sequence (A/C/G/T/N)
  3. `+` (optional ID again)
  4. Quality string (ASCII encoding of Phred scores)

Usually compressed:

```text
sample1_R1.fastq.gz
sample1_R2.fastq.gz
```

We often keep FASTQ files in **Group 3** storage as raw data.

---

### 2.2 FASTA – sequences only (no quality)

- Just names and sequences:
  - `>` header line with ID
  - One or more lines of sequence

Example:

```text
>chr1
ACGTTGCAACGTTGCA...
>chr2
...
```

Used for:

- Reference genomes
- Assembled contigs / scaffolds
- Protein sequences (for BLASTP)

---

### 2.3 SAM / BAM – alignments or read containers

- **SAM**: text format for sequence alignments.
- **BAM**: binary, compressed version of SAM (much smaller and faster).

Rows represent reads, with information like:

- Which reference sequence they align to
- Position on the reference
- Mapping quality
- CIGAR string (how the read aligns)
- Flags (paired, reverse‑complement, etc.)

**Important:** BAM files can be:

- **Aligned BAM**: reads mapped to a reference (what we usually mean by “BAM” in pipelines).
- **Unaligned BAM**: container for raw reads (e.g. PacBio HiFi output before mapping).

We usually:

- Keep **raw BAMs** (long reads) in Group 3.
- Use **aligned BAMs** as intermediate or derived data (often stored in Group 2 if they’re “final” outputs we care about).

---

### 2.4 BED – intervals/regions

- A simple tab‑delimited format for genomic intervals:
  - `chrom`, `start`, `end`, plus optional columns (name, score, strand, etc.).

Example:

```text
chr1    1000    2000    peak1
chr2    500     900     region2
```

Used for:

- Peaks (e.g. from MACS)
- Genomic windows
- Gene regions or other annotations

Many tools (like **bedtools**) work with BED files.

---

### 2.5 VCF – variants

- Variant Call Format (VCF) stores SNPs/indels (and sometimes structural variants).
- Contains:
  - Header with metadata and INFO/FORMAT definitions.
  - One line per variant position.

Key columns:

- CHROM, POS, ID, REF, ALT, QUAL, FILTER, INFO, FORMAT, [per‑sample genotypes].

Example (simplified):

```text
chr1    12345   .   A   G   60  PASS    DP=35;AF=0.50   GT:DP  0/1:35
```

Compressed as `.vcf.gz` and indexed with `tabix` for fast random access.

---

### 2.6 GFF / GTF – annotations

- Describe gene models and features on the genome:
  - Genes, exons, transcripts, CDS, UTRs, etc.
- Used to map variants/peaks to known features.

Example (simplified GFF):

```text
chr1    source  gene        1000  5000  .  +  .  ID=gene1;Name=ABC1
chr1    source  mRNA        1000  5000  .  +  .  ID=transcript1;Parent=gene1
chr1    source  exon        1000  1200  .  +  .  Parent=transcript1
```

Tools like **bedtools**, **bcftools**, and various R packages interact with these.

---

## 3. What is “indexing” and why does it matter?

Many large genomic files are **random‑access**: tools jump directly to certain positions instead of reading everything from the start. To do that quickly, the file needs an **index**.

Common examples:

- `samtools index alignments.bam` → `alignments.bam.bai`
- `samtools faidx reference.fasta` → `reference.fasta.fai`
- `bgzip file.vcf` + `tabix -p vcf file.vcf.gz` → `file.vcf.gz.tbi`

Why index?

- To view alignments in a **genome browser**.
- To extract data from a specific region (e.g. `samtools view alignments.bam chr1:10000-20000`).
- To allow tools (variant callers, peak callers) to do region‑based access efficiently.

**Rule of thumb:**  
If a tool complains about “index missing” or “cannot perform random access,” you probably need to:

- `samtools index` for BAM
- `samtools faidx` for FASTA
- `tabix` (with bgzip) for VCF/other interval‑like files

---

## 4. Major categories of tools you’ll encounter

This is not exhaustive, but covers the categories most relevant to our lab.

### 4.1 Quality control and trimming

- **FastQC** – QC reports for FASTQ files.
- **MultiQC** – aggregates many QC reports.
- **Trimming tools**:
  - `fastp`, `Trimmomatic`, `Cutadapt`, etc.

These typically:

- Take **FASTQ** as input.
- Output:
  - Summaries / HTML reports.
  - Cleaned FASTQ files (possibly smaller).

---

### 4.2 Read alignment / mapping

For **short reads** (Illumina):

- **BWA** (bwa mem)
- **bowtie2**
- **HISAT2**
- **STAR** (often for RNA‑seq)

For **long reads** (PacBio HiFi, ONT):

- **minimap2**
- **pbmm2** (PacBio’s wrapper around minimap2)
- Others depending on use case.

They typically:

- Take **FASTQ (or unaligned BAM)** + **reference FASTA**.
- Possibly require a **reference index** (e.g. `bwa index`, `samtools faidx`).
- Output **SAM/BAM** with alignments.

---

### 4.3 Variant calling

Once you have aligned BAM files, you run **variant callers**.

**SNPs/indels (short variants):**

- **bcftools mpileup/call**
- **GATK** (HaplotypeCaller, etc.)
- **FreeBayes**
- **DeepVariant** (uses machine learning; often for germline; can handle long reads with appropriate models)

**Somatic mutation callers** (tumor/normal style):

- Mutect2 (GATK), Strelka2, Varscan, etc.

**Structural variant callers** (SVs: big deletions/insertions/inversions):

- Sniffles2, SVIM, pbsv (for PacBio), etc.

They usually:

- Input: **BAM** + **reference FASTA** (with indexes).
- Output: **VCF** (plus logs/stats).

---

### 4.4 Genome assembly (long reads)

For PacBio HiFi data, tools like:

- **hifiasm**

- Input: **HiFi reads** (FASTQ or BAM).
- Output: **draft assemblies** in FASTA.
- Sometimes produce intermediate graph formats, logs, etc.

We then may polish, scaffold, and annotate those assemblies.

---

### 4.5 Epigenomics / peak calling

For things like **ChIP‑seq**, **ATAC‑seq**, and some other epigenomic assays, after mapping reads we often:

- Use **MACS2** to call **peaks** (regions of enrichment).
- Then work with:
  - **BED** files of peaks.
  - Coverage tracks (e.g. bigWig, bedGraph).
  - Additional tools for motif analysis, annotation, etc.

---

### 4.6 Utility toolkits (you’ll see these *everywhere*)

These are the “Swiss Army knife” tools for working with common file formats:

- **samtools**
  - View, filter, sort, index BAM/CRAM.
  - Example: `samtools view`, `samtools sort`, `samtools index`, `samtools flagstat`.

- **bcftools**
  - View, filter, query VCF files.
  - Example: `bcftools view`, `bcftools filter`, `bcftools stats`.

- **vcftools**
  - Older but still useful for some population genetics metrics, filtering tasks.

- **bedtools**
  - Operations on BED/VCF/GFF and other interval‑like files:
    - `intersect`, `merge`, `window`, etc.
  - Example: find overlap between peaks and genes, or between variants and regions.

Learning these utility tools is a long‑term project, but you’ll use them over and over.

---

## 5. Common patterns when running tools

Most command‑line bioinformatics tools follow a similar shape:

```bash
tool_name [subcommand] [options] [inputs]
```

Examples:

```bash
samtools view -b -o out.bam in.sam
bcftools view -Ov -o out.vcf in.vcf.gz
bedtools intersect -a peaks.bed -b genes.bed > peaks_in_genes.bed
blastn -query query.fasta -db db_name -out results.txt -outfmt 6
```

Key ideas:

- Some tools use **subcommands**:
  - `samtools view`, `samtools sort`, `samtools index`
  - `bcftools view`, `bcftools filter`, `bcftools query`
- Options typically start with `-` or `--`:
  - Single letter: `-v`, `-o`
  - Long: `--output`, `--threads`, `--min-qual`
- Input files usually appear **at the end**, but not always.

You don’t need to memorize everything; you do need to be comfortable reading:

- `tool --help`
- Tool documentation or examples

---

## 6. Hands‑on mini‑exercise: running BLAST via modules

On Farm, many tools are provided as **modules** (shared centrally installed software). We’ll go into modules and environments more in **Lesson 4**. For now, we’ll just:

1. Load `blast`.
2. Create a tiny FASTA.
3. Make a small BLAST database.
4. Run a simple BLAST search and inspect output.

> **Note:** The exact module name may differ slightly (e.g. `blast`, `blast+/2.12.0`, etc.), but the HPC docs should show what’s available. The commands below show the general pattern.

---

### 6.1 Load the BLAST module

From a Farm terminal:

```bash
module avail blast   # see what BLAST modules exist
module load blast    # or: module load blast+/<version>
```

Check that BLAST is in your PATH:

```bash
blastn -h
```

You should see a help message for BLASTN.

---

### 6.2 Create a tiny FASTA file

Make a working directory and a simple FASTA:

```bash
mkdir -p ~/blast_demo
cd ~/blast_demo

cat > toy_seqs.fasta <<EOF
>seq1
ACGTTGCAACGTTGCA
>seq2
ACGTTGCAACGTCGCA
>seq3
TTTTGGGGCCCCAAAA
EOF
```

Now list the file:

```bash
ls
# toy_seqs.fasta
```

---

### 6.3 Create a BLAST database (makeblastdb)

BLAST needs a **database** to search against. We’ll just use our toy FASTA as both database and query.

```bash
makeblastdb -in toy_seqs.fasta -dbtype nucl -out toy_db
```

- `-in toy_seqs.fasta` – input FASTA.
- `-dbtype nucl` – nucleotide database.
- `-out toy_db` – base name for the database files.

You should now see files like:

```bash
ls
# toy_seqs.fasta  toy_db.nsq  toy_db.nin  toy_db.nhr  (names may vary slightly by version)
```

---

### 6.4 Run BLASTN

Now run BLASTN, using the same sequences as both query and database:

```bash
blastn   -query toy_seqs.fasta   -db toy_db   -out toy_results.txt   -outfmt 6
```

- `-query` – query FASTA file.
- `-db` – base name of database from `makeblastdb`.
- `-out` – output file name.
- `-outfmt 6` – tab‑delimited format (easy to parse and inspect).

Inspect the results:

```bash
head toy_results.txt
```

You should see lines like:

```text
seq1    seq1    100.00  16  0  0  1 16  1 16  0.0  32.0
...
```

Columns (for `outfmt 6`) are:

1. Query ID
2. Subject ID
3. % identity
4. Alignment length
5. Mismatches
6. Gap opens
7. Query start
8. Query end
9. Subject start
10. Subject end
11. E‑value
12. Bit score

The biological meaning here isn’t important; the main goals are:

- You successfully used `module load` to access a tool.
- You ran a real **bioinformatics command** with multiple arguments.
- You produced an output file and inspected it.

---

## 7. BLAST as a template for other tools

BLAST is just one example, but most tools feel similar:

- They require certain **input formats** (FASTA, FASTQ, BAM, etc.).
- They have **many options**, but you often need only a small subset for basic tasks.
- They produce **text outputs** or new files that can be analyzed, indexed, or visualized.

When learning a new tool, a good habit is to:

1. Run `tool -h` or `tool --help` to see the options.
2. Skim the docs for a **minimal example**.
3. Create a tiny test dataset (like we did with BLAST) so you can see how inputs and outputs behave before running on large real data.

---

## 8. Putting it all together: an example “mental map”

For a typical DNA variant‑calling project in our lab, you might see something like this:

- **Input**:
  - `sample1_R1.fastq.gz`, `sample1_R2.fastq.gz` (Illumina)
  - Reference genome: `ref.fasta` + `ref.fasta.fai`
- **QC & trimming**:
  - `fastqc`, `fastp` → produce QC reports, cleaned FASTQs.
- **Alignment**:
  - `bwa mem` or `minimap2` → `sample1.bam` (aligned).
  - `samtools sort` / `samtools index` → `sample1.sorted.bam`, `sample1.sorted.bam.bai`.
- **Variant calling**:
  - `bcftools mpileup` + `bcftools call` or `DeepVariant` → `sample1.vcf.gz`, `sample1.vcf.gz.tbi`.
- **Annotation and intervals**:
  - `bedtools` to intersect variants with `genes.gff`.
  - Custom scripts for filtering, plotting, etc.

Throughout, you rely on:

- **File type knowledge** (what each file is and where it “lives” in the pipeline).
- **Indexes** to make tools fast and interactive.
- A **handful of core utilities** for manipulating BAM/VCF/BED/FASTA.

---

## 9. What you should take away from this lesson

You do **not** need to memorize every tool name and detail. Instead, you should:

- Recognize the names and **roles** of:
  - FASTQ, FASTA, BAM, BED, VCF, GFF/GTF.
  - Key utility tools: samtools, bcftools, bedtools, vcftools.
  - Big categories: QC, alignment, variant calling, assembly, epigenomics.
- Understand the concept of **indexing** and which tools create indexes.
- Feel comfortable running a basic command‑line tool like BLAST:
  - Using `module load`
  - Supplying input, db, and output arguments
  - Inspecting the resulting output file

---

## 10. Preview of Lesson 4

In **Farm code lesson 4**, we’ll focus on **software itself**:

- How to see what modules are available (`module avail`).
- How to load/unload modules (`module load`, `module list`).
- Why and how to use **conda/mamba** environments.
- When you might need **containers** (e.g. Singularity/Apptainer).
- Strategies for keeping your software setups **reproducible and shareable** across the lab.

For now, keep this lesson handy as a reference when you encounter new file types or tools in lab scripts.
