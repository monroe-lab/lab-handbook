The user wants help setting up or running the lab's HiFi long-read pipeline on Farm.

The pipeline lives at `/home/gmonroe/scripts/hifi_pipeline/` and uses the `hifi_pipe` conda environment.
It handles: FastQC → pbmm2 alignment → bcftools/longshot/pbsv variant calling.

Ask for or infer:
- Project name and path (e.g., `projdir=/home/USERNAME/projects/20251208_mddcc`)
- Raw data location in Group 3 (e.g., `/group/gmonroegrp3/grey/20251208_mddcc`)
- Reference FASTA path
- Whether input is FASTQ or BAM (pipeline handles both)
- Which step they need help with (setup, QC, alignment, variant calling, status check)

**Full setup commands:**
```bash
projdir=/home/USERNAME/projects/PROJECT_NAME
datadir=/group/gmonroegrp3/USERNAME/PROJECT_NAME
ref_src=/path/to/reference.fna

mkdir -p "${projdir}"/{0_raw_data,0.1_fastq_qc,1_alignments,1.1_alignment_qc,2_variant_calls,ref,logs}

# Symlink reference
ln -s "${ref_src}" "${projdir}/ref/reference.fna"

# Symlink raw data
cd "${projdir}/0_raw_data"
for f in "${datadir}"/*.fastq.gz "${datadir}"/*.bam; do
  [ -e "$f" ] || continue
  ln -s "$f" .
done
```

**Run full pipeline (QC + alignment + variant calling):**
```bash
proj="${projdir}"
ref=ref/reference.fna
cd "$proj"

for fq in 0_raw_data/*.fastq.gz; do
  [ -e "$fq" ] || continue
  sbatch /home/gmonroe/scripts/hifi_pipeline/fastqc.sbatch.sh "$proj" "$fq"
done

for f in 0_raw_data/*.{fastq.gz,bam}; do
  [ -e "$f" ] || continue
  sbatch /home/gmonroe/scripts/hifi_pipeline/align_pbmm2.sbatch.sh "$proj" "$f" "$ref" call_variants
done
```

**Check project status:**
```bash
cd "$proj"
/home/gmonroe/scripts/hifi_pipeline/check_project_status.sh
```

**Re-run a single sample with overwrite:**
```bash
sbatch /home/gmonroe/scripts/hifi_pipeline/align_pbmm2.sbatch.sh "$proj" 0_raw_data/SAMPLE.fastq.gz "$ref" call_variants overwrite
```

**Variant callers available:** `mpileup` (bcftools), `longshot`, `pbsv` (SVs). Default runs all three.
Custom callers: pass comma-separated list as 4th arg to `call_variants.sbatch.sh`, e.g. `mpileup,longshot`

**Troubleshooting:**
- Tools not found → check `conda env list | grep hifi_pipe` and `~/.bashrc` for `conda init`
- Job failures → check `logs/*.err` files
- Missing outputs → run `check_project_status.sh`
- pbsv reference error → script auto-creates `.fa` symlink if ref ends in `.fna`

Guide the user through whichever step they need, providing copy-paste commands with their actual paths filled in where known.
