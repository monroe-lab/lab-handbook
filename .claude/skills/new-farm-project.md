The user wants to scaffold a new bioinformatics project on the TGCA lab's Farm HPC cluster.

Ask for the following if not provided:
- Project name (use descriptive names like `pistachio_mutation_2025` or `YYYYMMDD_shortdesc`)
- Their Farm username (e.g., `gmonroe`)
- The type of pipeline (HiFi long-read, Illumina short-read, BLAST, RNA-seq, or general)

Then output a ready-to-run shell block they can paste into their Farm terminal. Follow these lab conventions exactly:

**Directory structure:**
```
~/projects/PROJECT_NAME/
├── code/
├── data/
│   ├── samples.txt
│   ├── 0_rawlinks/
│   ├── 1_trimmed/      (or 1_alignments/ for HiFi)
│   ├── 2_aligned/      (adjust numbering to pipeline type)
│   └── 3_variants/
├── results/
│   ├── vcfs/
│   ├── assemblies/
│   └── tables/
└── logs/
```

For HiFi pipelines, use this layout instead for data/:
`0_raw_data/`, `0.1_fastq_qc/`, `1_alignments/`, `1.1_alignment_qc/`, `2_variant_calls/`, `ref/`, `logs/`

**Raw data** lives in `/group/gmonroegrp3/PROJECT_NAME/` — never copy it; always symlink.
**Final results** go to `/group/gmonroegrp2/PROJECT_NAME/` when the project is stable.

Output the setup commands, then show the symlink pattern for linking raw data from Group 3:
```bash
ln -s /group/gmonroegrp3/PROJECT_NAME/raw/SAMPLE.fastq.gz data/0_rawlinks/
```

Also output a starter `samples.txt` reminder and a note about the `logs/` directory needing to exist before submitting sbatch jobs.

Keep output concise and copy-paste ready.
