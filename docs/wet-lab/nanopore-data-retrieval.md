---
type: protocol
title: "Nanopore Data Retrieval"
---

# Nanopore Data Retrieval

## Resources

**Software:** MinKNOW (on the sequencing computer), file transfer tools (rsync, scp, or USB drive)

**Related Protocols:** [[loading-a-minion-flow-cell]], [[nanopore-rapid-library-prep]]

**Prerequisites:** A completed (or in-progress) MinION sequencing run

**Purpose:** Get your sequencing data off the MinION computer and into a location where it can be analyzed. Understand the file formats and how to assess data quality.

## Time estimate

**Wall time:** ~1 hr (depending on data size and transfer speed) | **Hands-on:** ~30 min

---

## Where MinKNOW Puts the Data

MinKNOW saves all run data to a default output directory on the sequencing computer. The path is typically:

```
/data/  (Linux)
~/MinKNOW/data/  (Mac)
C:\data\  (Windows)
```

Within this directory, each run gets its own folder named by the experiment name you set:

```
<experiment_name>/
  <run_id>/
    fastq_pass/      # Basecalled reads that passed quality filter
    fastq_fail/      # Reads that failed quality filter
    pod5_pass/        # Raw signal files (passed)
    pod5_fail/        # Raw signal files (failed)
    sequencing_summary_*.txt  # Per-read statistics
    report_*.html     # Run summary report
```

## File Formats

| Format | Extension | What it contains | Size | Use |
|--------|-----------|-----------------|------|-----|
| **FASTQ** | `.fastq.gz` | Basecalled sequences + quality scores | ~1-5 GB per run | Primary input for assembly and alignment |
| **POD5** | `.pod5` | Raw electrical signal | ~10-50 GB per run | Re-basecalling with newer models, signal-level analysis (methylation) |
| **Sequencing summary** | `.txt` | Per-read stats (length, quality, channel, time) | ~100 MB | QC analysis, plotting read length distributions |
| **Report** | `.html` | Run summary with plots | Small | Quick overview of run quality |

**For the capstone assembly, you need the `fastq_pass/` files.** The POD5 files are useful for advanced analysis (methylation calling) but are not needed for basic genome assembly.

## Procedure

### 1. Check the run report

Open `report_*.html` in a web browser. This gives you:

- Total bases sequenced
- Total reads
- Read length distribution
- Mean quality score
- Pore activity over time

### 2. Check sequencing summary

The sequencing summary file contains one row per read with columns for read length, mean quality, and other metrics. You can use this for more detailed QC:

```bash
# Count total reads
wc -l sequencing_summary_*.txt

# Quick stats with awk
awk -F'\t' 'NR>1 {sum+=$14; count++} END {print "Mean read length:", sum/count}' sequencing_summary_*.txt
```

### 3. Copy data to your analysis location

For the capstone, Grey will provide instructions on where to transfer the data (the Farm HPC cluster or a local analysis computer).

**Transfer options:**

```bash
# rsync (recommended for large transfers)
rsync -avP /path/to/fastq_pass/ user@farm.cse.ucdavis.edu:/group/monroelab/shared/nanopore/<your_name>/

# scp (simpler but no resume on failure)
scp -r /path/to/fastq_pass/ user@farm.cse.ucdavis.edu:/group/monroelab/shared/nanopore/<your_name>/

# Or use a USB drive for local transfer
```

### 4. Verify the transfer

After copying, verify the files transferred completely:

```bash
# Check file counts match
ls fastq_pass/*.fastq.gz | wc -l   # on source
ls /destination/fastq_pass/*.fastq.gz | wc -l   # on destination

# Check total size matches
du -sh fastq_pass/   # on source
du -sh /destination/fastq_pass/   # on destination
```

### 5. Concatenate FASTQ files (optional)

MinKNOW splits output into many small FASTQ files (one per batch of reads). For assembly, you may want to concatenate them:

```bash
cat fastq_pass/*.fastq.gz > all_reads.fastq.gz
```

## What Happens Next

Grey provides a bioinformatics module for the capstone assembly. You do not need to write code. The general pipeline is:

1. **Quality filter** reads (remove very short or low-quality reads)
2. **Assemble** the genome (using Flye, or another long-read assembler)
3. **Polish** the assembly (correct errors using the reads themselves)
4. **Assess** assembly quality (BUSCO completeness, contig N50, total size)

The assembled genome is the capstone deliverable.

## Data Management

- **Keep POD5 files** for at least 6 months. They can be re-basecalled with improved models.
- **Keep FASTQ files** indefinitely (they are the primary data).
- **Back up** the sequencing summary and report.
- **Do not delete data from the MinION computer** until Grey confirms it has been transferred and backed up.

## Documentation

Create a lab notebook entry. Date it. Cite this protocol. Note:

- Run ID and experiment name
- Total reads, total bases, N50, mean quality (from the report)
- Where you transferred the data (path on Farm or local)
- File counts and sizes (verification)
