---
type: "protocol"
title: "Farm resources, CPUs, and storage"
---
# Farm resources, CPUs, and storage

This is the Monroe Lab's guide to **what we have on the UC Davis [Farm cluster](https://hpc.ucdavis.edu/farm-cluster)** and **how we share it**. It covers compute partitions, storage tiers, lab norms for being a good citizen, and the safe places to keep your data long-term.

If you're brand new to Farm, start here, then read [[cluster-access]], [[slurm_basics]], and [[storage-and-backup]] for the technical onboarding.

> **Why this doc exists.** Farm has been changing how it manages storage and home directories over the past year, and that has caused some confusion in the lab about what's safe, what's at risk, and what counts as "ours." This page is the lab's source of truth so you don't have to guess. If anything here conflicts with what you've heard elsewhere, this is the version to follow.

***

## TL;DR

1. **Long-term storage** lives in `/group/gmonroegrp2` and `/group/gmonroegrp3`. **Anything else is not safe long-term.**
2. **Use partition `bmh`** for short and medium jobs. **Use partitions `bml` or `low`** for long jobs and bulk work.
3. **Always leave headroom in `bmh`.** If you're going to use more than \~50% of our `bmh` cores, post to **`#farming`** on Slack with at least **48 hours** of notice. No reply = fair game.
4. **Test small first.** Especially if running something new: Run one tiny instance of your pipeline before launching the full thing, and check the Slurm log output to see what your job actually used.
5. **Be careful to avoid under-requesting** memory or time. A job that runs out of either fails, and a failed job wastes CPU time.

***

## Hardware overview

Farm III has two categories of compute hardware:

* **27 bigmem nodes (`bm1`–`bm27`)** — up to 128 CPUs and 2 TB RAM each. Served by the `bml` and `bmh` partitions.
* **\~60 parallel nodes** — up to 64 CPUs and 256 GB RAM each. Served by the `low` and `high` partitions.
* **GPU node** — 32 CPUs, 125 GB RAM, NVIDIA A100. Served by `gpu-a100-h`.

### What the Monroe lab owns

Our lab has bought into the bigmem tier. **We own 352** (96+128+128) **CPUs with \~2,929 GB of RAM** on the bigmem nodes, accessible at high priority through `bmh`.

Our Slurm account is `gmonroegrp` (use `--account=gmonroegrp` in your sbatch headers). See [[slurm-advanced]] for the full header template.

### Partitions

| Partition | What it is | Best for |
| --------- | ---------- | -------- |
| **`bmh`** (bigmem high) | Our owned, guaranteed bigmem allocation. Jobs here get the "one-minute guarantee" and can preempt `bml` jobs. **352 CPUs / \~2.9 TB RAM** of headroom. | Short-to-medium jobs that need big memory. Interactive `srun` sessions. Time-sensitive. Computaitons that cannot tolerate being requed. |
| **`bml`** (bigmem low) | The rest of the bigmem pool, shared across the whole Farm community. Up to \~3,456 CPUs / \~30 TB RAM theoretical capacity. **Jobs here can be killed and requeued** if a `bmh` job needs the resources — progress is lost unless your code checkpoints. | Large numbers of small jobs, and those that are written so that tolerate checkpoint or restart. Exploratory analyses, test runs, long term computation that can run in the background. |
| **`low`** | A separate pool of regular parallel nodes — **\~14,500 CPUs / \~63 TB RAM across 98 nodes**. Idle time on community hardware. Add `--account=publicgrp --partition=low` to your batch script. | Large batch sweeps, embarrassingly parallel work, anything you'd want to "just dump." Fire away in here. |
| **`gpu-a100-h`** | One GPU node, 32 CPUs, 125 GB RAM, A100 GPU. This is our lab's. | GPU-accelerated tools. RStudio with GPU support reportedly works here too, worth a try. |

> Submitting to `low` and **`bml`** can be bumped, job could be re-queued at any time.

***

## CPU and job submission policy

Slurm's fairshare scheduler does a reasonable job of balancing usage automatically, but the things below are the norms we've agreed on as a lab. They mostly come down to one principle:

> **Be considerate of what other people are trying to do.** i.e. treat others the way you would want to be treated. That's it. Everything else is just instances of that rule.

### The 50% / 48-hour rule

If you are about to submit a workload that will consume **more than \~50% of our `bmh` allocation for more than a day** (more than \~176 CPUs, or a comparable share of memory):

1. **Post a heads-up in `#farming` on Slack** describing what you're running, how big it is, and roughly how long it'll take.
2. **Wait at least 48 hours.** If anyone in the lab has a time-sensitive thing they're trying to get on, this gives them a chance to flag it.
3. **No replies after 48 hours = fair game.** Submit and run to your heart's content (but always leave some headroom - 10% of nodes open for interactive jobs or other quick work needed by others)

Dont think of it as asking permission. It's about giving people a chance to coordinate when something they're working on can't slip.

### Use `bml` whenever you can — but write resilient code

`bml` jobs can be **killed and requeued at any time** when a `bmh` job needs the resources. That sounds painful but it isn't, *if* your code is written sensibly:

* **Chunk your work.** Process samples one at a time, or in small groups, with each chunk writing its output before the next one starts.
* **Make it resumable.** Before doing work, the script checks whether the output already exists and skip it if so. This pattern alone makes most pipelines safely requeueable.
* **Use Slurm job arrays** ([[slurm-advanced]]) so each task is independent — one task getting bumped doesn't lose the whole batch.

If your code is structured this way, `bml` is essentially free compute. You should default to it for long-running work.

### Use `low` heavily

`low` is huge, mostly idle, and great for bulk work. Throw as much at it as you want. The only caveat is the same as `bml`: jobs can be preempted, so write resumable code.

```bash
#SBATCH --account=publicgrp
#SBATCH --partition=low
```

### `bmh` etiquette beyond the 50% rule

Even when you're under the 50% threshold, try to keep `bmh` healthy for everyone:

* **Leave headroom for interactive `srun` sessions.** Don't claim the very last available CPUs in `bmh` for a multi-day job. Someone might need to spin up an interactive session for a quick test or a debugging round.
* **The closer you get to filling `bmh`, the shorter your job should be.** Loose guidance:
    * Filling most of the available headroom → keep your job under **12 hours**, ideally under **4**.
    * Taking the very last slots → keep it under **1 hour**, and only if it's something that genuinely can't wait.
* **Don't grab the last node.** If `bmh` is nearly full, route long work to `bml` or `low` instead.

<iframe width="560" height="315" src="https://www.youtube.com/embed/IbwUTQJHS8c" frameborder="0" allowfullscreen style="max-width:100%;border-radius:8px;margin:12px 0"></iframe>

### Check what's available before you submit

Before you fire off a big job, **look at what's currently free**. A handful of one-line aliases will tell you everything you need to know in two seconds. Drop these in your `~/.bashrc` (see [[bashrc-customization]] for the file itself):

```bash
# Snapshot of all our key partitions: nodes, allocated/idle/other/total CPUs, memory
alias farm-status='sinfo -p bmh,bml,low,gpu-a100-h -o "%.12P %.6a %.6D %.15C %.10m"'

# Just the idle nodes — handy when bmh feels tight
alias farm-idle='sinfo -p bmh,bml,low,gpu-a100-h -t idle -o "%.12P %.10n %.6c %.10m"'

# My running and queued jobs
alias myjobs='squeue -u $USER -o "%.10i %.9P %.20j %.8T %.10M %.6D %R"'

# All Monroe lab jobs across the lab account — see what your labmates are doing
alias labjobs='squeue -A gmonroegrp -o "%.10i %.9u %.9P %.20j %.8T %.10M %R"'

# Efficiency report for one finished job: did it actually use what it asked for?
seff_id() { seff "$1"; }   # usage: seff_id 12345678

# Quick recap of today's jobs (CPUs, memory, exit code, runtime)
alias today='sacct -u $USER --starttime today --format=JobID%14,JobName%20,Partition,AllocCPUS,State,ExitCode,Elapsed,MaxRSS'
```

`farm-status` is the one to run **before submitting anything large**. If `bmh` is showing very few idle CPUs and you were about to launch a multi-day job there, that's your cue to either route it to `bml`/`low` or post the heads-up in `#farming`.

> Chaehee Lee has his own set of aliased commands for checking partition status that he's used in practice — ask him directly if you want a battle-tested version of the above. We should probably consolidate them into [[bashrc-customization]] at some point.

### Test small before you scale

Before launching a full pipeline, **run one instance** — one sample, one chromosome, one whatever — and check the Slurm log:

* Did it actually use all the CPUs you requested? If you asked for 32 and the job used 4, your code isn't parallelized like you thought it was. Drop the request.
* Did it use the memory you requested? If you asked for 200 GB and peaked at 12 GB, drop the request — those reserved resources weren't available for anyone else to use.
* Did it finish in the wall time you asked for? Use that to calibrate the full run.

The Slurm output file at the end of every job has a summary: CPU time, wall time, max memory, exit code. It's worth reading — that's where you find out whether your job actually behaved the way you expected.

### Don't undercall memory or time either

The flip side of "don't request more than you need":

* **Memory undercall** → job killed by the OOM-killer → CPU time wasted → resources held from someone else. Always give yourself \~20% memory headroom over what you saw in the test run.
* **Time undercall** → job hits the wall and dies right before finishing → eight hours of compute thrown away because you asked for eight instead of ten. Give yourself slack, especially if you can't checkpoint.
* Wall-time requests are an **upper bound**, not a budget. Slurm doesn't penalize you for finishing early. It does penalize you for finishing late.

### Let Claude help you check

Auditing every Slurm log file by hand is tedious, but it's exactly the kind of thing a [Claude Code](https://claude.com/claude-code) agent can do well. A good use case:

> "Look at the `*.out` and `*.err` files in this directory. For each completed job, tell me how many CPUs I requested vs. how many I actually used, how much memory I requested vs. peak memory, and whether the wall-time request was reasonable. Flag any jobs that wasted significant resources."

Run that in your project directory and you'll get a list of inefficiencies in seconds. Use it before you scale a pipeline up.

***

## Storage policy

### The short version

> **Long-term storage = `/group/gmonroegrp2` and `/group/gmonroegrp3`. Everything else is working space, not safe storage.**

### The three tiers

| Tier | Path | Purpose | Safe long-term? |
| ---- | ---- | ------- | --------------- |
| **Working** | `~/` (home directory) | Active analysis, scripts, small test data, code repos | **No.** Use it freely for work-in-progress, but don't park anything irreplaceable here. |
| **Derived / processed** | `/group/gmonroegrp2` (\~100 TB) | Long-term storage of intermediate and processed results | **Yes.** |
| **Raw / primary** | `/group/gmonroegrp3` (\~200 TB) | The single source of truth for raw sequencing data and other primary data | **Yes.** |

Together, gmonroegrp2 and gmonroegrp3 give us **\~300 TB of safe long-term capacity**. Both are heavily used already, so be tidy: compress what you can, delete what you don't need, and use symlinks to point your working directories at the canonical copies. See [[storage-and-backup]] and [[project-structure-on-farm]] for the detailed conventions.

### Home directories are working space, not archives

Your Farm home directory is fine for what you're actively doing right now: scripts, code, configs, small datasets you're poking at. It is **not** the right place to keep:

* Primary data
* "I might need this later" data
* Anything you can't afford to lose

If it matters, it goes in `gmonroegrp2` or `gmonroegrp3`. If it doesn't matter, it doesn't need to be on Farm at all.

### A note on legacy 100+ TB allocations

A few of us — \*\*Matt Davis, Chaehee Lee, [[Kehan Zhao]], and Grey\*\* — are grandfathered into the older Farm storage model and have large allocations on the legacy `/group/gmonroeroot` mount (formerly `/nas-5-3/gmonroegrp`). That hardware is **5+ years old, \~89% full, and slated for retirement.**

> **If you joined the lab recently, this section doesn't affect you.** New lab members never had access to the old NAS — you got a standard Farm home directory from day one. You can ignore everything below.

If you *are* one of the legacy users:

* **Treat that space as scratch from now on.** Anything you want to keep needs to move to `gmonroegrp2` or `gmonroegrp3` (or to the backup option below) before the old NAS goes away.
* **You're the only one who knows what's important** in your own directory, so the cleanup is yours to do.
* **If you're not sure what's worth keeping**, the storage scan utilities under `/group/gmonroegrp2/chaehee/` (e.g. `job_storage_scan-DEPTH.sh`) are a starting point for figuring out where your space is going.

### Backup option: PSIT 100 TB SFTP server

Separate from Farm, the lab has access to a **100 TB SFTP backup server** managed by **John Hall (jnhall@ucdavis.edu)** at UC Davis Plant Sciences IT. This is a different machine, on a different network, intended for backed-up copies of vital data.

If you have data that's truly irreplaceable and you want a second copy somewhere off Farm, this is an option to consider. The transfer is straightforward — `sftp` or `rsync` from Farm directly to the backup host. Credentials and the hostname are issued per-user; **email John Hall to request access.**

> This is optional, not required. The default expectation is that gmonroegrp2 and gmonroegrp3 are sufficient for long-term lab storage. The PSIT backup is a "belt and suspenders" option for the most vital stuff.

***

## Things we'd like to build

A few tools that don't exist yet but would make the lab's life easier. If you have time and interest, please build one and add it to the handbook:

* **A live "Farm CPU availability" dashboard** — a tiny web page or terminal TUI that shows free CPUs in `bmh`, `bml`, `low`, and `gpu-a100-h` at a glance, refreshing every few seconds. The aliases above are good enough to check on demand, but a persistent view in a tmux pane would be even better.
* **A Claude Code skill or shell script** that audits a directory of Slurm log files for CPU/memory waste and prints a summary.
* **A storage cleanup helper** that walks `gmonroegrp2` or `gmonroegrp3` and surfaces large/stale files that might be candidates for deletion.
* **Consolidate Chaehee's aliased commands** into [[bashrc-customization]] so everyone's using the same set.

If you build one, add it to [[bashrc-customization]] or drop it in the handbook under `bioinformatics/`.

***

## Questions or concerns

If anything here is unclear, if you think a rule isn't working in practice, or if you're worried about your storage situation — **talk to Grey**. This document is about lab usage and norms, so concerns about it come to him directly. We can update the page as the situation evolves.

For backup-server access specifically, email **John Hall (jnhall@ucdavis.edu)** at Plant Sciences IT — he issues credentials per user.

## Related handbook pages

* [[cluster-access]] — getting onto Farm in the first place
* [[slurm_basics]] — partitions, basic sbatch templates
* [[slurm-advanced]] — full sbatch headers, job arrays, dependencies
* [[storage-and-backup]] — directory layout, compression, symlinks
* [[project-structure-on-farm]] — recommended project directory structure
* [[interacting-with-farm]] — login, scp, rsync, screen/tmux
* [[bashrc-customization]] — useful shell aliases for Farm

## Outside resources

* [UC Davis HPC: Farm cluster docs](https://hpc.ucdavis.edu/farm-cluster)
* [Slurm documentation](https://slurm.schedmd.com/documentation.html)
* [Linuxize: how to use sftp](https://linuxize.com/post/how-to-use-linux-sftp-command-to-transfer-files/) (referenced in the original PSIT backup instructions)