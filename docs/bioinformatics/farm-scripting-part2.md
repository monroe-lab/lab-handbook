---
type: guide
title: "Farm code lesson 2: Bash scripting basics"
---

# Farm code lesson 2: Bash scripting basics

This lesson builds on **Linux basics (Part 1)** and introduces **Bash scripts** – small programs you write as text files and run on Farm.

If you can do everything in this document, you will be able to:

- Write simple shell scripts (`.sh` files)
- Run them directly or via `bash`
- Use **variables** inside scripts
- Use **arguments** (`$1`, `$2`, etc.) to make scripts configurable
- Write simple **`for` loops** to process multiple files or samples
- Connect this to **Slurm** (`sbatch`) in a basic way

More advanced topics (functions, `getopts`, big workflows) can come later. Here we focus on the **essentials** you need to be productive on Farm.

---

## 1. What is a Bash script?

A Bash script is just a **text file** containing shell commands that you could have typed one-by-one in the terminal.

Example (file: `hello.sh`):

```bash
#!/bin/bash

echo "Hello from Farm!"
echo "Today is: $(date)"
```

Key points:

- The first line `#!/bin/bash` is called the **shebang**; it tells the system to run this file with the `bash` interpreter.
- The rest is normal shell commands (`echo`, `date`, etc.).

---

## 2. Creating and running your first script

### 2.1 Create the script

From the terminal on Farm:

```bash
nano hello.sh
```

Paste in:

```bash
#!/bin/bash

echo "Hello from Farm!"
echo "Today is: $(date)"
```

Save and exit (`Ctrl + O`, Enter, then `Ctrl + X`).

(or ...*and recommended*... do this in Visual Studio Code remotely to create/save file)

---

### 2.2 Make it executable

Change the file’s permissions so it can be run:

```bash
chmod +x hello.sh
```

---

### 2.3 Run the script

```bash
./hello.sh
```

You should see something like:

```text
Hello from Farm!
Today is: Mon Dec 1 12:34:56 PST 2025
```

Alternative (without `chmod +x`):

```bash
bash hello.sh
```

Both are fine, but **making scripts executable** and using `./script.sh` is good practice.

---

## 3. Structure of a typical script

Most scripts you write for the cluster follow a rough pattern:

```bash
#!/bin/bash
set -euo pipefail

# 1. Parse arguments / set variables
# 2. Print basic info (log)
# 3. Run commands

echo "Running script: $0"
echo "Started at: $(date)"

# Your commands here...

echo "Finished at: $(date)"
```

New things here:

- `set -euo pipefail`:
  - `-e`: exit if any command fails
  - `-u`: error on use of undefined variables
  - `-o pipefail`: fail if any command in a pipeline fails
- `$0` is the script name.

You don’t *have* to use `set -euo pipefail`, but it is a good default for data-processing scripts.

---

## 4. Variables inside scripts

Variables are names that store values. In Bash:

```bash
#!/bin/bash

NAME="Grey"
PROJECT="/group/gmonroegrp2/my_project"

echo "Hello, $NAME!"
echo "Project path: $PROJECT"
```

Rules / conventions:

- No spaces around `=`:
  - ✅ `NAME="Grey"`
  - ❌ `NAME = "Grey"`
- To use a variable, prefix with `$`: `"$NAME"`, `"$PROJECT"`.
- Quote variables with double quotes (`"$VAR"`) to avoid issues with spaces or special characters.

Another example:

```bash
#!/bin/bash

INPUT_FASTQ="sample1.fastq.gz"
OUTDIR="results"

mkdir -p "$OUTDIR"
echo "Running analysis on $INPUT_FASTQ"
echo "Results will go to $OUTDIR"
```

---

## 5. Script arguments: `$1`, `$2`, `$@`

Instead of hard-coding values, you can **pass arguments** to scripts.

### 5.1 Basic positional arguments

Script `greet.sh`:

```bash
#!/bin/bash
set -euo pipefail

NAME="$1"

echo "Hello, $NAME!"
```

Run it:

```bash
chmod +x greet.sh
./greet.sh Alice
```

Output:

```text
Hello, Alice!
```

- `$1` is the **first argument** from the command line.
- `$2`, `$3`, etc. are the second, third, etc.

Example with two arguments:

```bash
#!/bin/bash
set -euo pipefail

NAME="$1"
FAVORITE_COLOR="$2"

echo "Hello, $NAME!"
echo "Your favorite color is $FAVORITE_COLOR"
```

Run:

```bash
./two_args.sh Alice blue
```

---

### 5.2 Providing defaults (`${VAR:-default}`)

Sometimes you want an argument but also a default:

```bash
#!/bin/bash
set -euo pipefail

NAME="${1:-world}"  # if $1 is empty/unset, use "world"

echo "Hello, $NAME!"
```

Now both work:

```bash
./greet_default.sh
# Hello, world!

./greet_default.sh Grey
# Hello, Grey!
```

---

### 5.3 All arguments: `$@`

`$@` is “all arguments”.

Example:

```bash
#!/bin/bash
set -euo pipefail

echo "You passed $# arguments:"   # $# = number of arguments
for ARG in "$@"; do
    echo " - $ARG"
done
```

Run:

```bash
./show_args.sh a b c
```

Output:

```text
You passed 3 arguments:
 - a
 - b
 - c
```

---

## 6. `for` loops in scripts

**Loops** let you repeat commands for multiple items (samples, files, chromosomes, etc.).

### 6.1 Loop over a list of values

```bash
#!/bin/bash
set -euo pipefail

for CHR in 1 2 3 4 5; do
    echo "Processing chromosome $CHR"
    # commands here, e.g.:
    # run_analysis_for_chr.sh "$CHR"
done
```

Run:

```bash
./loop_chr.sh
```

---

### 6.2 Loop over a numeric range

```bash
for i in {1..10}; do
    echo "i = $i"
done
```

You can put this directly in the terminal, or inside a script.

---

### 6.3 Loop over files

Example: process all `.fastq.gz` files in a directory.

```bash
#!/bin/bash
set -euo pipefail

for FQ in *.fastq.gz; do
    echo "Found file: $FQ"
    SAMPLE="${FQ%%.fastq.gz}"   # strip suffix
    echo "Sample: $SAMPLE"

    # Example command:
    # fastqc "$FQ" -o fastqc_out/
done
```

Notes:

- `*.fastq.gz` uses a **glob** to match all matching files.
- `${FQ%%.fastq.gz}` uses **parameter expansion** to strip the suffix.  
  (You can skip that if it feels too advanced for now and just use `"$FQ"`.)

---

### 6.4 Loop over lines in a file

Often you have a file like `samples.txt` with one sample ID per line.

`samples.txt`:

```text
sampleA
sampleB
sampleC
```

Script:

```bash
#!/bin/bash
set -euo pipefail

SAMPLES_FILE="$1"

while read -r SAMPLE; do
    echo "Processing sample: $SAMPLE"
    # run_pipeline_for_sample.sh "$SAMPLE"
done < "$SAMPLES_FILE"
```

Run:

```bash
./run_samples.sh samples.txt
```

---

## 7. Connecting scripts and `sbatch` (basic)

You’ll often:

1. Write a **job script** with `#SBATCH` headers, which:
   - Sets Slurm options
   - Runs a **Bash script or commands** inside.
2. Optionally pass arguments into the job.

### 7.1 Minimal `sbatch` job that calls a script

`my_job.sbatch`:

```bash
#!/bin/bash
#SBATCH --job-name=test_script
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh
#SBATCH --time=01:00:00
#SBATCH --cpus-per-task=2
#SBATCH --mem=8G
#SBATCH --output=logs/%x_%j.out

set -euo pipefail

./hello.sh
```

Submit:

```bash
sbatch my_job.sbatch
```

- Slurm uses the header to decide where/how to run the job.
- Inside the job, it just runs your existing `hello.sh`.

---

### 7.2 Passing arguments to the job script

You can pass arguments to the `.sbatch` script itself:

`run_sample.sbatch`:

```bash
#!/bin/bash
#SBATCH --job-name=run_sample
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmm
#SBATCH --time=04:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --output=logs/%x_%j.out

set -euo pipefail

SAMPLE="$1"

echo "Running sample: $SAMPLE"
./process_sample.sh "$SAMPLE"
```

Submit:

```bash
sbatch run_sample.sbatch sampleA
sbatch run_sample.sbatch sampleB
```

Inside the job:

- `$1` is `sampleA` (or `sampleB`, etc.).
- The job then calls `./process_sample.sh "$SAMPLE"`.

---

### 7.3 Using a generic script with different arguments

You can also keep the Slurm script minimal and pass args directly to a generic script:

`process_sample.sh`:

```bash
#!/bin/bash
set -euo pipefail

SAMPLE="$1"
FASTQ_DIR="/group/gmonroegrp3/projectX/raw"
OUTDIR="/group/gmonroegrp2/projectX/results/${SAMPLE}"

mkdir -p "$OUTDIR"

echo "Processing sample: $SAMPLE"
echo "FASTQ DIR: $FASTQ_DIR"
echo "OUTDIR: $OUTDIR"

# example command:
# my_tool --input "$FASTQ_DIR/${SAMPLE}.fastq.gz" --output "$OUTDIR"
```

`run_process.sbatch`:

```bash
#!/bin/bash
#SBATCH --job-name=proc_sample
#SBATCH --account=gmonroegrp
#SBATCH --partition=bmh
#SBATCH --time=08:00:00
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --output=logs/%x_%j.out

set -euo pipefail

SAMPLE="$1"

./process_sample.sh "$SAMPLE"
```

Submit:

```bash
sbatch run_process.sbatch sampleA
```

This pattern is very common:

- **One generic processing script**, configurable by arguments.
- **One or more Slurm job wrappers** that set resources and pass arguments in.

---

## 8. Good practices for scripts on Farm

1. **Use `set -euo pipefail`** at the top of scripts unless you have a good reason not to.
2. **Echo key information**:
   - Print the script name, sample name, date, node, etc.
   - This makes debugging much easier when looking at logs.

   ```bash
   echo "Script: $0"
   echo "Node: $(hostname)"
   echo "Started: $(date)"
   ```

3. **Keep scripts in `scripts/` directories** in your project:
   ```text
   project/
     data/
     scripts/
     results/
     logs/
   ```

4. **Make your scripts reusable**:
   - Accept arguments instead of hard-coding sample names or paths.
   - Use variables at the top for paths you might want to change later.

5. **Test scripts on small data interactively** before submitting huge jobs:
   - Use a tiny subset of data and run with `bash script.sh ...` on a login node or a short interactive job.
   - Once it works, scale up with `sbatch`.

---

## 9. Summary

After this lesson, you should be able to:

- Write simple Bash scripts with `#!/bin/bash`
- Make scripts executable and run them
- Use variables and arguments (`$1`, `$2`, `$@`)
- Write basic `for` loops over numbers, values, files, or lines in a file
- Use scripts inside Slurm job submissions (`sbatch`), and pass arguments into jobs

This is **enough scripting power** to:

- Automate repetitive tasks
- Run the same pipeline on many samples
- Keep your commands organized and reproducible

---

## 10. What’s next (future lessons)

In future “Farm code” lessons we can cover:

- Better argument parsing (`getopts`, named flags)
- Writing libraries of functions and reusing code between scripts
- More advanced Slurm features (job arrays, dependencies) combined with scripting
- Environment management (modules, conda, containers)

For now, if you can write and run the example scripts above and adapt them for your own projects, you’re in great shape.

