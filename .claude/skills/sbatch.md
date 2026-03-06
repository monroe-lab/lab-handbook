The user wants to generate a Slurm sbatch script for the TGCA lab's Farm HPC cluster.

Ask for or infer from context:
- Job name / step (e.g., `align_sample1`, `variant_call_batch`)
- What the job does (alignment, variant calling, QC, custom script, etc.)
- Partition preference: `bmh` (high-priority, our nodes) or `bmm` (shared/burst, can be preempted)
- CPUs needed (default: 4)
- Memory needed (default: 32G)
- Time limit (default: 08:00:00; suggest higher for long jobs)
- Whether it uses a conda environment or module
- Whether it should be a job array (if processing multiple samples)

**Always include these lab defaults:**
```bash
#SBATCH --account=gmonroegrp
#SBATCH --output=logs/%x_%j.out
```

**Partition guidance:**
- `bmh`: jobs that must not be preempted, shorter/time-sensitive
- `bmm`: long non-urgent batches, tolerate preemption
- `gpu-a100-h`: only when explicitly needing GPU (add `--gres=gpu:1`)

**Always start the script body with:**
```bash
set -euo pipefail
echo "Job started on $(hostname) at $(date)"
echo "Job ID: $SLURM_JOB_ID"
```

**For conda environments**, include:
```bash
source ~/.bashrc
conda activate ENV_NAME
```

**For job arrays**, use `SLURM_ARRAY_TASK_ID` to index into `samples.txt`:
```bash
SAMPLE=$(sed -n "${SLURM_ARRAY_TASK_ID}p" samples.txt)
```
and set `#SBATCH --output=logs/%x_%A_%a.out`

**End every script with:**
```bash
echo "Job finished at $(date)"
```

Remind the user to `mkdir -p logs` before submitting. Output a clean, ready-to-use sbatch script.
