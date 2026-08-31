
# HiFi mapping, variant calling and assembly QC pipeline

This repository contains Slurm batch scripts to run two related pipelines on PacBio HiFi data:

1. **`pbmm2_vcfcalls.sh`**  
   Map HiFi reads to a Col-CC reference with `pbmm2` and run multiple small-variant and SV callers.

2. **`hifiasm_to_asmQC.sh`**  
   Assemble HiFi reads with `hifiasm`, scaffold with `ragtag`, compare to a reference with `SyRI`, and `SVIM-asm`
   annotate repeats/Mt, and generate mapping- and NucFreq-based QC tracks.



---

## 1. Overview

### 1.1 `pbmm2_vcfcalls.sh`

**Purpose:**  
Given a HiFi read BAM, this script:

1. Maps the reads to a Col-CC reference using `pbmm2` (`--preset CCS`, sorted BAM).
2. Submits multiple SV/variant callers as separate Slurm jobs:
   - `sniffles_with_pbmmreads.sh` (Sniffles2)
   - `pbsv_with_pbmmreads.sh` (pbsv)
   - `cuteSV.sh` (cuteSV)
   - `deepvariant_with_pbmmreads.sh` (DeepVariant via Apptainer)
   - `clair3.sh` (Clair3 via Apptainer)
   - `pepper_margin_deepvar.sh` (PEPPER-Margin-DeepVariant via Apptainer)
3. Filters the alignment to **primary mapped reads only** (`-F 2308`) and indexes the filtered BAM.

**Usage**

```bash
sbatch code/pbmm2_vcfcalls.sh path_to_unmapped_HiFibam outdir/outname
```

**Main output (per sample):**
under `outdir`,
- `<outname>.bam` – primary pbmm2 CCS alignments to the reference
- `<outname>_pbsv.vcf`, `<outname>_sniffles.vcf`, `<outname>_cuteSV.vcf`, `<outname>_deepvariant.vcf`, `<outname>_deepvariant.g.vcf.gz`, `<outname>.clair3.vcf`, `<outname>.pepper.vcf`
- `<outname>_F2308.bam` filtered alignment

---

### 1.2 `hifiasm_to_asmQC.sh`

**Purpose:**  
Given HiFi reads in FASTQ and a BAM for NucFreq plotting, this script:

1. Assembles the reads with `hifiasm`
2. Converts `hifiasm` GFAs to FASTA (`gfatools`) and selects long contigs (`seqkit`).
3. Scaffolds the assembly to a masked TAIR10 using `ragtag.py`.
4. Renames/scales the scaffolds and:
   - runs whole-genome alignment + `SyRI` (via `minimap_and_SyRI_Col_CEN_CC.sh`)
   - calls assembly-based SVs using `SVIM_asm.sh`
   - annotates repeats and mitochondrial sequences (`repeat_and_Mt_annotation.sh`)
5. call `pbmm2_pancentromere_paper.sh` to:
   - map reads to the scaffolds
   - run `nucfreq.sh` to generate NucFreq plots per chromosome.

**Usage**
```bash
sbatch code/hifiasm_to_asmQC.sh path_to_HiFi_fastq.gz outdir/outname path_to_unmapped_HiFibam
```

**Main output (per sample):**

- `<outname>.asm.bp.a_ctg.fa`, `<outname>.asm.bp.p_ctg.fa`, `*_long.fa` – `hifiasm` contigs
- `<outname._long_strict.ragtag/>` – `ragtag` scaffolds and AGP
- `*syri.out`, `*gap_coords_on_SYN.txt` – `SyRI` results and gap liftover
- RepeatMasker output files in the sample output directory
- coverage bigWigs and NucFreq plots from `pbmm2_pancentromere_paper.sh` and `nucfreq.sh`

---


## Conda environments used 

| Environment name | Used by scripts | Main tools |
|------------------|-----------------|-----------|
| `pbsv-env`       | `pbmm2_vcfcalls.sh`, `pbsv_with_pbmmreads.sh`, `pbmm2_pancentromere_paper.sh` | pbmm2, pbsv, samtools, bedtools, seqkit |
| `sniffles-env`   | `sniffles_with_pbmmreads.sh`, `cuteSV.sh` | sniffles2, cuteSV, samtools |
| `contig_select`  | `hifiasm_to_asmQC.sh` | gfatools, seqkit |
| `ragtag-env`     | `hifiasm_to_asmQC.sh`, `ragtag*.sh` | ragtag, minimap2, samtools |
| `svimasm_env`    | `SVIM_asm.sh` | svim-asm, minimap2, samtools |
| `repeatmasker_env` | `repeat_and_Mt_annotation.sh` | RepeatMasker and related tools |
| `nucmer`         | `minimap_and_SyRI_Col_CEN_CC.sh` | syri, mummer4 (nucmer) |
| `syri_gap`       | `minimap_and_SyRI_Col_CEN_CC.sh` | python (for `code/liftover_gap.py`) |
| `deeptools`      | `pbmm2_pancentromere_paper.sh` | deeptools, samtools |
| `nucfreq`        | `nucfreq.sh` | python stack for NucFreq (numpy, matplotlib, pandas) |

### Create the conda environments
the yml files can be found in `/yml`

```bash
module load conda

conda env create -f env_pbsv-env.yml
conda env create -f env_sniffles-env.yml
conda env create -f env_contig_select.yml
conda env create -f env_ragtag-env.yml
conda env create -f env_svimasm_env.yml
conda env create -f env_repeatmasker_env.yml
conda env create -f env_nucmer.yml
conda env create -f env_syri_gap.yml
conda env create -f env_deeptools.yml
conda env create -f env_nucfreq.yml
```
