The user wants you to review a shell script or sbatch job script for correctness and adherence to TGCA lab conventions on Farm.

Read the provided script and check the following:

**Slurm header checks (for sbatch scripts):**
- [ ] `--account=gmonroegrp` is set
- [ ] `--partition` is one of: `bmh`, `bmm`, `gpu-a100-h`
  - Flag if `bmm` is used for short critical jobs (preemption risk)
  - Flag if GPU partition is used but no `--gres=gpu:N` is set
- [ ] `--output=logs/%x_%j.out` or similar pattern (not a flat filename)
- [ ] `--time` is set and reasonable for the task
- [ ] `--cpus-per-task` matches the tool's actual thread usage
- [ ] `--mem` is set and reasonable
- [ ] For arrays: `--output=logs/%x_%A_%a.out` and `SLURM_ARRAY_TASK_ID` is used

**Script body checks:**
- [ ] `set -euo pipefail` at the top (fail fast, catch errors)
- [ ] `echo` statements at start and end to log hostname, date, and job ID
- [ ] conda activation uses `source ~/.bashrc` before `conda activate ENV`
- [ ] Raw data is accessed via symlinks from `/group/gmonroegrp3/`, not copied
- [ ] Output goes to numbered subdirectories matching pipeline order (0_, 1_, 2_, etc.)
- [ ] No hard-coded absolute paths that only work for one user (should use variables or arguments)
- [ ] `logs/` directory creation reminder noted if needed

**General code quality:**
- [ ] Arguments/variables are documented or self-evident
- [ ] Tool thread flags (e.g., `-t`, `--threads`) match `$SLURM_CPUS_PER_TASK`
- [ ] File existence checks where appropriate
- [ ] No dangerous `rm -rf` without guards

For each issue found, explain:
1. What the problem is
2. Why it matters in the Farm context
3. The corrected version of that line/section

End with a summary: "Ready to submit" or list of required fixes before submission.
