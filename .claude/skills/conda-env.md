The user wants help creating, managing, or exporting a conda/mamba environment for bioinformatics work on Farm.

Ask for or infer:
- Environment name (use descriptive names like `env_popgen`, `env_assembly`, `env_chipseq`)
- Tools to install (ask if unclear)
- Whether to export an existing environment to a `.yml` file
- Whether to recreate from an existing `.yml` file

**Lab rules for conda environments:**
- Never install heavy tools into `base` — always create named environments
- Group related tools logically (one env per pipeline/project type)
- Always export to `.yml` and commit it to the project repo
- Use channels: `-c conda-forge -c bioconda` in that order

**Create a new environment:**
```bash
conda create -n ENV_NAME -c conda-forge -c bioconda TOOL1 TOOL2 TOOL3 -y
```

**Activate and verify:**
```bash
conda activate ENV_NAME
which TOOL1   # confirm it resolves to the env path
TOOL1 --version
```

**Export for reproducibility:**
```bash
conda activate ENV_NAME
conda env export > ENV_NAME.yml
```

**Recreate from yml:**
```bash
conda env create -f ENV_NAME.yml
```

**Common tool groupings to suggest:**
- General utilities: `samtools bcftools bedtools`
- Short-read alignment: `bwa-mem2 samtools bcftools fastp fastqc multiqc`
- HiFi/long-read: `pbmm2 samtools bcftools longshot pbsv mosdepth bedtools seqkit fastqc`
- Variant calling: `gatk4 bcftools deepvariant`
- Epigenomics/ChIP: `bowtie2 samtools macs2 deeptools multiqc`
- Assembly: `hifiasm samtools seqkit quast`
- Population genetics: `plink2 vcftools bcftools`

**For sbatch scripts**, remind the user to activate the env like this:
```bash
source ~/.bashrc
conda activate ENV_NAME
```

**Troubleshooting tips:**
- If solve is slow, try `mamba` instead of `conda`
- If environment is broken, export spec, delete, and recreate: `conda env remove -n ENV_NAME`
- Use `which TOOL` to confirm which version is active
- Check `module avail TOOL` first — if Farm already has a module, you might not need conda

Output the exact commands for their use case.
