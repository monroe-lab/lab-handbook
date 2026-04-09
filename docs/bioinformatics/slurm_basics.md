---
type: guide
title: "Slurm basics"
---

# Slurm basics

Farm uses the **Slurm** workload manager. You don’t run jobs directly on the login node; instead you submit them to the scheduler using `sbatch` (for batch scripts) or `srun` (for interactive jobs).

Our lab’s Slurm **account / group** is:

```bash
--account=gmonroegrp
```

You should include this in all your `sbatch`/`srun` commands so that jobs are charged to our group’s allocation.

---

## Our lab hardware on Farm

We have purchased multiple **big-memory CPU nodes** and a **GPU node** on Farm. These live in special partitions that are primarily reserved for our group:

| Account     | Partition   | Cores | Memory (GB) |
|------------|-------------|-------|-------------|
| gmonroegrp | `bmh`       | 352   | 2929        |
| gmonroegrp | `gpu-a100-h`| 32    | 125         |

- **BM** nodes are “big-memory” nodes (∼1 TB+ RAM per node, aggregated across several nodes we own).
- The `gpu-a100-h` partition has our GPU resources (A100) for GPU-accelerated workflows.

We also have access to the **`bmm`** partition, which is a shared/burst partition (see priorities below).

---

## Partitions and priorities

We mainly use three partitions:

- **`bmh`** – big-memory, **high-priority** for our group
  - Jobs run on our purchased nodes.
  - If resources are free, jobs should start quickly.
  - Other users **cannot preempt** us here; once your job is running, it won’t be kicked off by other groups.

- **`bmm`** – shared burst partition
  - Good for **long, less time-sensitive jobs**.
  - Other groups may have higher priority usage; **your job can be preempted/paused** if someone else with higher priority needs the resources.
  - This is a good place to “dump” lots of long-running jobs that can tolerate being stopped and restarted by the scheduler.

- **`gpu-a100-h`** – GPU partition
  - Use this when you explicitly need GPUs (e.g., deep learning, GPU-accelerated tools).
  - You’ll need to request GPUs explicitly in your job script (example below).

A common strategy:
- Prefer **`bmm`** for big batches of long, non-urgent jobs (to maximize overall throughput).
- Use **`bmh`** when you need more predictable runtime or your job really shouldn’t get preempted.

---

## Basic Slurm commands

From a login node:

```bash
# Submit a batch job
sbatch my_job.sbatch

# See your jobs
squeue -u $USER

# Cancel a job
scancel JOBID
```

For simple interactive sessions (e.g., quick testing, debugging):

```bash
srun --pty -A gmonroegrp -p bmh -c 4 -t 01:00:00 bash
```

This requests a 1-hour interactive shell with 4 cores on `bmh` under our account.

---

## Example: basic CPU job on `bmh`

Save as `basic_bmh.sbatch`:

```bash
#!/bin/bash
#SBATCH --job-name=test_bmh
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=04:00:00
#SBATCH --output=logs/%x_%j.out

set -euo pipefail

echo "Running on host: $(hostname)"
echo "Starting at: $(date)"

# Your commands here
module load some_module  # if needed
python my_script.py

echo "Finished at: $(date)"
```

Submit with:

```bash
sbatch basic_bmh.sbatch
```

---

## Example: long jobs on `bmm`

```bash
#!/bin/bash
#SBATCH --job-name=long_bmm
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmm
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --time=2-00:00:00      # 2 days
#SBATCH --output=logs/%x_%j.out

# NOTE: jobs on bmm may be preempted.
# Use tools/workflows that can handle being re-run or restarted.

run_my_long_analysis.sh
```

Be prepared to **re-run** or **resume** these jobs if they are preempted.

---

## Example: GPU job on `gpu-a100-h`

```bash
#!/bin/bash
#SBATCH --job-name=gpu_job
#SBATCH --account=gmonroegrp
#SBATCH --partition=gpu-a100-h
#SBATCH --gres=gpu:1          # request 1 GPU
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=08:00:00
#SBATCH --output=logs/%x_%j.out

module load cuda
python train_model.py
```

---

If you’re unsure which partition to use or how to size your job (cores/memory/time), ask in the lab Slack or check the **templates** in the `templates/` directory of this repo for more examples.
