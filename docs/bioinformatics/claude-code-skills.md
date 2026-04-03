---
type: protocol
title: "Using Claude Code Skills for Lab Bioinformatics Workflows"
---

# Using Claude Code Skills for Lab Bioinformatics Workflows

This lab uses [Claude Code](https://claude.ai/code) — an AI coding assistant you can run in your terminal — with custom skills tailored to our workflows on Farm. These skills give Claude context-specific knowledge about our cluster setup, conventions, and pipelines so you get useful, copy-paste-ready output instead of generic advice.

---

## Setup

1. **Install Claude Code** and authenticate (ask Grey or see the Claude Code docs).
2. **Clone this repo** locally or on Farm:
   ```bash
   git clone https://github.com/TGCA-lab/lab-handbook
   ```
3. **Open a terminal in the repo directory** when you want to use the skills. Claude Code picks up skills from the `.claude/skills/` directory automatically when you run it from the project.

   ```bash
   cd /path/to/lab-handbook
   claude
   ```

---

## Available Skills

Invoke a skill with `/skill-name` at the Claude Code prompt. Each skill loads lab-specific instructions so Claude knows our Farm setup, partitions, account name, directory conventions, and templates.

---

### `/new-farm-project`

**Scaffolds a new project directory on Farm following lab conventions.**

Prompts you for a project name, pipeline type, and your username, then outputs ready-to-run shell commands to:
- Create the standard `code/`, `data/`, `results/`, `logs/` layout
- Set up numbered pipeline subdirectories (`0_rawlinks/`, `1_trimmed/`, etc.)
- Symlink raw data from `/group/gmonroegrp3/`

Example:
```
/new-farm-project
> Project: pistachio_mutation_2025
> Username: jsmith
> Pipeline: Illumina short-read variant calling
```

---

### `/sbatch`

**Generates a Slurm sbatch script following lab best practices.**

Knows our account (`gmonroegrp`), partitions (`bmh`, `bmm`, `gpu-a100-h`), and conventions. Will produce a correct script with:
- Proper `--account`, `--output=logs/%x_%j.out`, and `set -euo pipefail`
- The right partition for your use case
- Conda environment activation if needed
- Job array support for multi-sample jobs

Example:
```
/sbatch
> Step: align reads with bwa-mem2
> Samples: 20 samples from samples.txt
> Environment: env_shortread
> Partition: bmm (non-urgent batch)
```

---

### `/hifi-pipeline`

**Sets up and runs the lab's PacBio HiFi pipeline.**

Knows the scripts at `/home/gmonroe/scripts/hifi_pipeline/`, the `hifi_pipe` conda environment, and the full pipeline (FastQC → pbmm2 → bcftools/longshot/pbsv). Will walk you through:
- Project directory setup with correct layout
- Symlinking reference and raw data
- Submitting QC, alignment, and variant calling jobs
- Checking project status
- Re-running failed samples with overwrite

Example:
```
/hifi-pipeline
> Project: /home/jsmith/projects/20250601_arabidopsis
> Raw data: /group/gmonroegrp3/jsmith/20250601_arabidopsis
> Reference: /home/jsmith/data/Arabidopsis_TAIR10.fna
> Step: full pipeline setup and submission
```

---

### `/blast`

**Sets up a BLAST job using the lab's template.**

Knows the `blastn-job.sbatch` template, Farm module setup (`module load blast`), and outfmt6 output format. Will produce:
- A ready-to-submit sbatch command or full script
- Suggested parameter tweaks (E-value, percent identity, max hits) based on your use case
- Tips for parsing the output with R or Python

Example:
```
/blast
> Reference: genome.fasta
> Query: candidate_genes.fasta
> Need: strict hits only (>95% identity)
```

---

### `/conda-env`

**Creates, manages, or exports a conda environment for bioinformatics on Farm.**

Knows our channel conventions (`conda-forge`, `bioconda`), the rule against polluting `base`, and common tool groupings for our pipelines. Will output:
- `conda create` commands with correct channel order
- Export commands for `.yml` reproducibility files
- Activation patterns for use inside sbatch scripts

Example:
```
/conda-env
> Need: short-read alignment pipeline (fastp, bwa-mem2, samtools, bcftools)
> Name: env_shortread
```

---

### `/review-script`

**Reviews a shell or sbatch script for correctness and lab convention compliance.**

Checks for:
- Correct Slurm headers (`--account=gmonroegrp`, partition choice, log paths, resource sizing)
- `set -euo pipefail` and logging echoes
- Thread flags matching `$SLURM_CPUS_PER_TASK`
- Raw data access via symlinks (not copies)
- Numbered output subdirectories
- Hard-coded paths that should be variables

Paste in a script or give a file path and get a checklist of issues with fixes.

Example:
```
/review-script
> [paste script content, or: "review code/align_reads.sbatch"]
```

---

## Tips for Getting the Best Results

- **Give paths when you have them.** The more specific you are (actual project dirs, sample names, reference paths), the more Claude can fill in the commands directly.
- **Use the handbook as context.** If you're in the `lab-handbook` directory, Claude has access to the docs and templates, so you can ask things like "what partition should I use for a 3-day assembly job?" and get answers grounded in our actual setup.
- **Paste error messages.** If a job failed, paste the relevant `.err` log into the conversation. Claude can diagnose Slurm errors, conda activation failures, tool crashes, etc.
- **Iterate.** Start with a skill invocation, then keep chatting to refine the output — adjust memory, switch callers, add steps.

---

## Farm Quick Reference

| Thing | Value |
|---|---|
| Slurm account | `gmonroegrp` |
| High-priority partition | `bmh` |
| Burst/shared partition | `bmm` |
| GPU partition | `gpu-a100-h` |
| Raw data storage | `/group/gmonroegrp3/` |
| Final results storage | `/group/gmonroegrp2/` |
| Working projects | `~/projects/` |
| HiFi pipeline scripts | `/home/gmonroe/scripts/hifi_pipeline/` |
| HiFi conda env | `hifi_pipe` |
| HPC support email | `farm-hpc@ucdavis.edu` |

---

See also: [Project directory structure](project-structure-on-farm.md), [[[slurm_basics]]](slurm_basics.md), [Slurm advanced](slurm-advanced.md), [Software & environments](farm-software-part4.md)
