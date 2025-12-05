# Slurm job headers and advanced options

This page explains the most important `#SBATCH` options in a Slurm job script, recommended defaults for **our lab**, and some advanced features that are easy to overlook.

A typical job script starts with a header like:

```bash
#!/bin/bash
#SBATCH --job-name=my_job
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh
#SBATCH --time=04:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --output=logs/%x_%j.out

# Your commands here
```

Everything starting with `#SBATCH` tells Slurm **how** to schedule and run your job.

---

## 1. Core header options

### 1.1 `--job-name`

```bash
#SBATCH --job-name=my_job
```

- A short, descriptive name for the job.
- Shows up in `squeue` and log files if you use `%x` in `--output`.
- Use names that are meaningful, e.g. `rnavar_chr1`, `assembly_hifiasm`, `deepvariant_batch1`.

**Best practice:** include project + step, so you can tell jobs apart at a glance.

---

### 1.2 `--account`

```bash
#SBATCH --account=gmonroegrp
```

- Charges the job to our lab’s allocation.
- You should **always** include this so we get proper accounting and access to our partitions.

---

### 1.3 `--partition`

```bash
#SBATCH --partition=bmh
```

- Chooses which **queue / set of nodes** to run on.
- Common partitions for us:
  - `bmh` – high-priority, big-memory nodes we own
  - `bmm` – shared/burst, can be preempted
  - `gpu-a100-h` – GPU partition

**Best practice (rough guide):**

- Use `bmh` for:
  - Jobs that really shouldn’t be preempted
  - Shorter or more time-sensitive jobs
- Use `bmm` for:
  - Long-running, non-urgent jobs that can tolerate pausing/preemption
- Use `gpu-a100-h` only when you actually need a GPU (`--gres=gpu:1`, etc.)

---

### 1.4 `--time`

```bash
#SBATCH --time=HH:MM:SS     # or D-HH:MM:SS
```

Examples:

```bash
#SBATCH --time=04:00:00     # 4 hours
#SBATCH --time=2-00:00:00   # 2 days
```

- Sets the **wall-clock limit** for your job.
- If your job runs longer than this, Slurm kills it.

**Best practices:**

- We are not penalized for requesting more time than needed, so guess high to avoid having job fail due to time out.

---

### 1.5 CPU options

Most common:

```bash
#SBATCH --cpus-per-task=4
```

- Requests 4 CPU cores *for a single task*.
- Use this when your tool has a `--threads` or `-t` option and can use multiple cores internally.

Less commonly used, but good to know:

```bash
#SBATCH --ntasks=10
#SBATCH --cpus-per-task=1
```

- Requests 10 separate tasks with 1 core each (e.g., MPI jobs or multiple independent processes).

**Best practices:**

- Match `--cpus-per-task` to the number of threads your program actually uses.
- IMPORTANT: If a program is single-threaded, there is no benefit to requesting more than 1 CPU.

---

### 1.6 Memory options

Common pattern:

```bash
#SBATCH --mem=32G
```

- Requests 32 GB of RAM **per node** for your job.

Some sites use `--mem-per-cpu` instead:

```bash
#SBATCH --mem-per-cpu=4G
```

- Requests 4 GB of RAM **per CPU core**.

**Best practices:**

- Use `--mem` unless you know the scheduler is tuned for `--mem-per-cpu`.
- Don’t over-request “just because.” but also avoid under-request which will end up wasting your time too. Check logs or read about tools to infer how much memory they need, and adjust based on experience.
- If a job fails with an out-of-memory error, check the logs and increase memory in reasonable steps.

---

### 1.7 Output and error logs

```bash
#SBATCH --output=logs/%x_%j.out
#SBATCH --error=logs/%x_%j.err   # optional; often combined with output
```

- `--output` sets where STDOUT goes.
- `--error` sets where STDERR goes (if omitted, often merged with `--output`).
- `%x` = job name, `%j` = job ID.

**Best practices:**

- Always send logs to a dedicated `logs/` directory. (You will need to make sure this directory exists!)
- Use `%x_%j` so each job has a unique log file.
- Create `logs/` in your project directory and `.gitignore` it if using git for configs.

Example:

```bash
mkdir -p logs
```

Then in your script:

```bash
#SBATCH --output=logs/%x_%j.out
```

---

### 1.8 GPU requests

For GPU jobs:

```bash
#SBATCH --partition=gpu-a100-h
#SBATCH --gres=gpu:1
```

- `--gres=gpu:1` requests one GPU.
- Some sites support specifying a type, e.g. `--gres=gpu:a100:1`.

**Best practices:**

- Only use GPU partitions when your code actually uses GPUs.
- Match `--cpus-per-task` and `--mem` to what the GPU job needs (data loading, preprocessing, etc.).

---

## 2. Lab-specific best practices

1. **Use `gmonroegrp` as the account**  
   Always include:

   ```bash
   #SBATCH --account=gmonroegrp
   ```

2. **Keep working directories clean**
   - Use some kind of personalized but standarized system of subdirectories. eg `logs/`, `data/`, `scripts/`, `results/`, `tmp/` 
   - Don’t dump everything into one huge flat directory.

3. **Symlink raw data from Group 3**
   - Don’t copy giant FASTQs or BAMs into your working directory.
   - Use `ln -s` to link from `/group/gmonroegrp3/...`.

4. **Use arrays for many similar jobs**  
   Instead of copying the same script 100 times, use a job array (see below).

5. **Start small when you’re unsure**
   - Use short test jobs (small subsets of data, single job).
   - Scale up once you know the pipeline works.

---

## 3. Advanced and useful options

### 3.1 Job arrays

Job arrays let you submit many similar jobs with one script:

```bash
#SBATCH --array=1-10
```

Inside the script, use `SLURM_ARRAY_TASK_ID`:

```bash
#!/bin/bash
#SBATCH --job-name=array_example
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmm
#SBATCH --array=1-10
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=12:00:00
#SBATCH --output=logs/%x_%A_%a.out

set -euo pipefail

ID=${SLURM_ARRAY_TASK_ID}
SAMPLE=$(sed -n "${ID}p" samples.txt)

echo "Processing sample: ${SAMPLE}"

run_pipeline_for_sample.sh "${SAMPLE}"
```

- `%A` = array job ID, `%a` = array task ID.
- Arrays are perfect for per-sample analyses.

---

### 3.2 Job dependencies

Run job B only **after** job A finishes successfully:

```bash
# submit job A
JOBID=$(sbatch step1_preprocessing.sbatch | awk '{print $4}')

# submit job B, depending on A
sbatch --dependency=afterok:${JOBID} step2_analysis.sbatch
```

Common dependency types:

- `afterok:JOBID` – run after job completes successfully.
- `afterany:JOBID` – run after job finishes, regardless of success/failure.
- `afternotok:JOBID` – run only if job fails.

Useful for chaining multi-step pipelines without manual babysitting.

---

### 3.3 E-mail notifications

If you want e-mail notifications:

```bash
#SBATCH --mail-type=END,FAIL
#SBATCH --mail-user=YOUR_EMAIL@ucdavis.edu
```

- `BEGIN` – when job starts
- `END` – when job ends
- `FAIL` – if job fails
- `ALL` – all of the above

Use sparingly to avoid inbox spam; `END,FAIL` is usually enough.

---

### 3.4 Changing working directory

```bash
#SBATCH --chdir=/path/to/project
```

- Sets the directory the job runs from.
- Alternatively, you can start your script with:

  ```bash
  cd /path/to/project
  ```

This helps ensure relative paths behave as expected.

---

## 4. Putting it all together: template header

Here’s a general-purpose template you can adapt:

```bash
#!/bin/bash
#SBATCH --job-name=PROJECT_STEP
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh         # or bmm / gpu-a100-h
#SBATCH --time=08:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --output=logs/%x_%j.out
# #SBATCH --array=1-10          # uncomment for arrays
# #SBATCH --mail-type=END,FAIL
# #SBATCH --mail-user=YOUR_EMAIL@ucdavis.edu

set -euo pipefail

echo "Job started on $(hostname) at $(date)"
echo "Job ID: $SLURM_JOB_ID"
echo "CPUs: $SLURM_CPUS_PER_TASK"

# Load modules / activate env
# module load ...
# conda activate ...

# Your analysis commands here

echo "Job finished at $(date)"
```

Use this as a starting point and customize for each project. If you discover additional useful patterns, add them to this doc or to the `templates/` directory in the handbook repo.
