# Farm code lesson 4: Software, modules, and environments

This lesson is about **how we get bioinformatics software running on Farm** without losing our minds.

By the end you should:

- Understand the difference between:
  - **Modules** (software installed by Farm staff)
  - **Conda environments** (software you manage yourself)
- Know why we **avoid installing from raw source** if at all possible
- Have a basic mental model of:
  - What the **PATH** is and how commands are found
  - Why **dependencies** and version conflicts are a big deal
  - Why we use **environments** instead of dumping everything into one place
- Know the key commands to:
  - Look for and use **modules**
  - Create and use **Conda environments**

We will **not** go deep into containers here, but we’ll mention them at a high level.

---

## 1. Reality check: software installs are painful

On a cluster like Farm:

- You **cannot use `sudo`** or system package managers (`apt-get`, `yum`) because you are not an admin.
- You generally **cannot use Docker** directly because it requires root privileges and is unsafe on multi-user systems.
- Farm staff maintain a shared software stack and the operating system.
- Occasionally, they do big system updates → things that used to work can **break**.

Because of this:

1. **Installing from raw source (`./configure`, `make`, `make install`) is usually a last resort.**  
   It can work, but:
   - It’s fragile.
   - It’s hard to reproduce.
   - Dependencies can be a nightmare.

2. Our **first choices** should be:
   - Existing **modules**
   - **Conda/mamba** environments
   - (Later, possibly containers like Apptainer/Singularity)

---

## 2. Modules: software installed and maintained by Farm staff

Farm uses a **module system** (e.g. Lmod or Environment Modules):

- Modules are **pre-installed software packages** you can load into your environment.
- When you `module load toolname`, it changes environment variables (PATH, etc.) so that the tool is available.

### 2.1 Why modules are nice

- They’re installed by **HPC staff**:
  - Typically compiled/tuned for the cluster
  - Shared by everyone
- If something breaks after a system update, they are responsible for fixing it.
- You don’t have to struggle with the build/install as much.

If you’re having trouble installing something yourself, you can email:

```text
farm-hpc@ec.davis.edu
```

You can:

- Ask if a tool is already available under a different name.
- Request that they install a new module (especially for widely-used tools).

They may not always say yes (or do it quickly), but it’s **worth asking**.

---

### 2.2 Basic module commands

From a Farm shell:

```bash
module avail          # show modules you can load
module spider NAME    # search for modules matching NAME (if available on this system)
module load NAME      # load a specific module
module list           # see what modules you have loaded
module unload NAME    # unload a module
module purge          # unload all modules
```

Examples:

```bash
module avail blast
module load blast
blastn -h             # check that the command works
```

If you run a command and get:

```text
bash: blastn: command not found
```

It means:

- The module may not be loaded, or
- The module doesn’t exist (check `module avail` / `module spider`), or
- It’s installed under a different name (check docs or ask HPC staff).

---

### 2.3 How modules work (conceptually)

When you run `module load blast`, the module system:

- Adds directories (like `/software/blast/bin`) to your **PATH**.
- Possibly sets other environment variables (e.g. `LD_LIBRARY_PATH`, `BLASTDB`, etc.).

That’s why the command suddenly becomes available: the shell now **knows where to find it**.

This leads us to an important concept…

---

## 3. PATH: how your shell finds commands

When you type a command like `samtools` and press Enter, your shell:

1. Looks at the environment variable `PATH`, which contains a **colon-separated list of directories**, e.g.:

   ```bash
   echo $PATH
   /home/USERNAME/miniconda3/bin:/usr/local/bin:/usr/bin:/bin:...
   ```

2. Searches each directory **in order** for an executable named `samtools`.

3. Runs the first match it finds.

So:

- If `samtools` is not in any directory listed in `PATH`, you get `command not found`.
- If you have **multiple versions** of a tool in different directories, whichever one appears **first** in `PATH` wins.

Tools like modules and conda **modify PATH** for you:

- `module load` → adds module’s bin directory.
- `conda activate myenv` → adds that environment’s `bin` directory.

This is why we generally do **not** want to manually fiddle with PATH in random ways unless we know what we’re doing.

---

## 4. Why environments matter (and why we like Conda)

### 4.1 The dependency problem

Bioinformatics tools often:

- Depend on specific versions of libraries (e.g. `htslib`, `zlib`).
- Require particular versions of Python, R, Java, etc.

If you try to:

- Install **everything into one place** (e.g. your base Conda environment or some `~/bin` folder), you eventually run into:
  - Conflicting library versions
  - Breaking one tool while installing another
  - “It worked yesterday and now my environment is broken”

### 4.2 Environments as isolated “software bubbles”

An **environment** is a **self-contained collection of software**:

- Has its own set of installed packages and versions.
- Modifying one environment doesn’t affect others.
- You can have:
  - `env_popgen` for a population-genetics pipeline
  - `env_assembly` for assemblies
  - `env_chipseq` for epigenomics
  - etc.

You **activate** the environment you need for a given project.

---

## 5. Conda, mamba, micromamba: our main environment tool

We primarily use the **Conda ecosystem** to manage environments.

Variants:

- **conda** – the original tool (Anaconda/Miniconda).
- **mamba** – a faster drop-in replacement for many conda commands.
- **micromamba** – similar, lighter weight, easier for some cluster setups.

You’ll mostly see:

- `conda` in documentation.
- `mamba` in practice when environment solves are slow.

The important idea: regardless of flavor, they let you:

- Create **named environments**
- Install **specific versions** of packages
- Activate/deactivate environments when you need them

---

## 6. Basic Conda workflow (per-user, per-project)

Assuming Conda is already installed (Miniconda is common). If not, Farm may have a `conda` or `mamba` module you can load; we can document that elsewhere.

### 6.1 See what environments you have

```bash
conda env list
```

You might see:

```text
# conda environments:
#
base                  *  /home/USERNAME/miniconda3
env_popgen               /home/USERNAME/miniconda3/envs/env_popgen
env_assembly             /home/USERNAME/miniconda3/envs/env_assembly
```

The `*` marks your currently active environment (often `base` at login if conda auto-activates).

---

### 6.2 Create a new environment

Example: environment for general BAM/VCF utilities:

```bash
conda create -n env_utils -c conda-forge -c bioconda     samtools bcftools bedtools
```

Breaking it down:

- `-n env_utils` – name of the new environment.
- `-c conda-forge -c bioconda` – channels to search (more on this next).
- `samtools bcftools bedtools` – packages to install.

Conda will show what it plans to install; confirm with `y`.

---

### 6.3 Channels: where packages come from

Conda “channels” are like repositories. For bioinformatics, the standard recipe is:

- `conda-forge` – huge general-purpose channel.
- `bioconda` – thousands of bioinformatics tools.
- `defaults` – the original Anaconda channel.

A common recommendation is to use:

```bash
conda create -n myenv -c conda-forge -c bioconda ...
```

where the channel order is:

1. `conda-forge`
2. `bioconda`

Once an environment is created, you can also set channel preferences in `~/.condarc`, but that’s beyond basic usage.

---

### 6.4 Activate and use the environment

```bash
conda activate env_utils
```

Now:

- Your prompt usually changes (e.g. `(env_utils)` prefix).
- `PATH` is updated so that `samtools`, `bcftools`, `bedtools`, etc. resolve to versions in this environment.

Test:

```bash
samtools --version
bcftools --version
bedtools --version
```

When done:

```bash
conda deactivate
```

This returns you to your previous environment (often `base`).

---

### 6.5 Installing more packages into an existing environment

With the environment active:

```bash
conda install -c bioconda pysam
```

**Caution:** Each time you add packages, Conda may need to “solve” dependencies again. This can:

- Take a long time.
- Occasionally break an environment (especially with complex mixes of Python, R, C++ libs, etc.).

If an environment gets messy, it’s sometimes easier to:

- Export its spec
- Create a new one cleanly (see below)

---

### 6.6 Exporting and recreating environments (for reproducibility)

From an environment:

```bash
conda activate env_utils
conda env export > env_utils.yml
```

Later (or on a different machine):

```bash
conda env create -f env_utils.yml
```

This is a nice way to:

- Share environments with labmates.
- Rebuild an environment after it’s broken or moved.

---

### 6.7 Best practices for Conda in our lab

- **Avoid using base for heavy installs.**
  - Use `base` minimally.
  - Create **named environments** for projects / pipelines.

- **Group related tools into logical environments.**
  - Don’t cram *everything* into one huge environment.
  - But also don’t create 100 tiny envs with 2 tools each.
  - Think in terms of “pipelines” or “project types.”

- **Document your environments.**
  - Add `env_*.yml` files to your project repo.
  - Mention which environment is required for each script.

- **If an environment becomes unstable, nuke and recreate.**
  - Don’t be sentimental. If it’s broken and unsalvageable, rebuild from the `yml`.

- **Combine modules + Conda carefully.**
  - E.g., you might load a GPU or compiler module, then activate a conda env.
  - Avoid random combinations of many modules + many envs unless you know why you need them.

---

## 7. How Conda interacts with PATH (and why that matters)

When you run:

```bash
conda activate env_utils
```

Conda:

- Adds `.../envs/env_utils/bin` at the **front** of `PATH`.
- That means:
  - If `samtools` is installed in both a module and in the Conda env, the **Conda version** wins.
  - This can be useful (you want a specific version), but can also be confusing (“Why did my samtools suddenly change?”).

To see **which** executable is being used:

```bash
which samtools
```

It will show the full path, e.g.:

```text
/home/USERNAME/miniconda3/envs/env_utils/bin/samtools
```

or

```text
/software/samtools/1.16/bin/samtools
```

This is essential debugging knowledge.

---

## 8. Dependencies, versions, and why environments save our sanity

Example problems:

- Tool A needs `libX` version 1.0.
- Tool B needs `libX` version 2.0.
- Tool C needs Python 3.10; D needs Python 3.7.

Trying to have **one global installation** that satisfies all of these simultaneously is often impossible or very fragile.

Environments let you:

- Put Tool A and its dependencies in `env_A`.
- Put Tool B and its dependencies in `env_B`.
- Keep Python 3.7 in `env_py37`, Python 3.11 in `env_py311`, etc.

Then, for a specific project:

- Activate the environment that matches the toolset you need.
- Avoid breaking every other project when you update one tool.

---

## 9. A few words about containers (and why Docker is tricky on Farm)

Containers (Docker, Singularity/Apptainer) are another way to bundle:

- Software
- Dependencies
- Sometimes even reference data or configurations

However:

- Docker usually requires **root privileges** and is not allowed on most shared HPC systems (including Farm).
- On clusters, the common alternative is **Singularity/Apptainer**, which:
  - Can often run Docker images without needing root.
  - Is designed for shared HPC environments.

On Farm:

- You **cannot** use Docker the way you might on your laptop.
- If/when we use containers, it will likely be via **Apptainer/Singularity** (probably as a module).

Containers are powerful but more advanced. For now:

- Focus on **modules** and **Conda environments** as your main tools.
- Later, containers can layer on top of that for fully reproducible pipelines.

---

## 10. When to use modules vs Conda vs (eventually) containers

A simple decision tree:

1. **Check for a module first.**
   - Run `module avail TOOL` or `module spider TOOL`.
   - If it exists and **the version is OK**, try using it.
   - If it works, you’re done.

2. **If no module or the version is wrong, consider Conda.**
   - Create a new environment for your project or pipeline.
   - Install the tool from `bioconda` / `conda-forge`.
   - Document the environment (`.yml` file).

3. **If Conda fails or is unavailable, consider containers** (later in your learning curve).
   - Use a published container from Docker Hub / Biocontainers, run via Apptainer/Singularity.
   - Only if this fits Farm’s policies and your comfort level.

4. **Only as a last resort: install from raw source.**
   - If you do, install into a **dedicated directory** for that project/env.
   - Add the bin directory to PATH *carefully* (and document it).

---

## 11. Admin limitations to keep in mind

- You are **not root** on Farm:
  - No `sudo apt-get install ...`
  - No system-wide library installs.
- The OS, drivers, and many libraries are centrally managed.
- System-wide updates may:
  - Change module behavior.
  - Require environment rebuilds or updates.
- This is normal in HPC life; it’s annoying but manageable if:
  - You document your environments and tool versions.
  - You expect that some things will need refreshing after big upgrades.

---

## 12. Summary

After this lesson, you should:

- Know that **modules** are cluster-managed software:
  - Use `module avail`, `module load`, `module list`, `module purge`.
  - Ask HPC staff (`farm-hpc@ec.davis.edu`) when you need help or a new tool.
- Understand that **Conda environments** are our main tool for:
  - Installing our own bioinformatics software.
  - Keeping dependencies isolated between projects.
  - Avoiding dependency hell in a single global environment.
- Have a mental model of:
  - **PATH** and how it determines which commands run.
  - How modules and `conda activate` change PATH.
  - Why different tools may need different environments.
- Recognize that:
  - We **avoid raw source installs** whenever possible.
  - Docker is generally off-limits on Farm; Apptainer/Singularity is the HPC-friendly container approach.
  - Environments and modules are the standard, reproducible way to manage software on a cluster.

If you’re comfortable with everything in lessons 1–4, you have enough background to:

- Log in to Farm
- Navigate the filesystem
- Write and run basic scripts
- Submit jobs with `sbatch`
- Use standard bioinformatics tools via modules or Conda environments

From here, you can start working on real lab projects and build deeper expertise as needed.
