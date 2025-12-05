# How I (Grey) like to code: Farm + local workflow

This document outlines my **general strategy for coding and analysis**.  
It’s not a rigid rulebook, but it captures how I currently like to work and what I’d recommend as a starting point.

---

## 1. Big picture philosophy

1. **Use Farm for heavy lifting; use your laptop for thinking.**  
   - Farm is for running big jobs: alignment, variant calling, big matrix ops, etc.  
   - As soon as data is **small enough**, I try to **download it and do analysis locally** (RStudio, plotting, interactive exploration).

2. **Keep projects structured from day 1.**  
   - On Farm, follow the [project directory structure](docs/project-structure-on-farm.md) (or equivalent):
     - Raw data in `/group/gmonroegrp3`
     - Working directories in your home
     - Final results in `/group/gmonroegrp2`
   - Locally, mirror a simple, consistent folder layout so your future self can find things.

3. **Get to figures as fast as possible.**  
   The real insights often come when you’re looking at plots. The whole workflow is about getting to:
   - Small, tidy tables
   - Fast iteration in R
   - Lots of figures saved as PDFs

4. **Write code as reusable pieces.**  
   - Turn anything useful into a **function** and store it.  
   - Keep your “working scripts” short; they mainly **source functions** and call them.

5. **Use the tools that speed you up.**  
   - On Farm: VS Code remote, good directory structure, scripts that can be reused across projects.  
   - Locally: RStudio, `data.table`, and lots of small functions.  
   - Increasingly: LLMs to help write, refactor, and document code.

---

## 2. Working on Farm: VS Code + project structure

**Default rule:**  

> If you’re doing anything on Farm, do it through **Visual Studio Code with remote SSH**, not a naked terminal window.

Why:

- VS Code gives you:
  - An integrated **terminal** on Farm
  - A real **editor** for scripts (with syntax highlighting, search, etc.)
  - File browser for the remote filesystem
- You can edit `sbatch` scripts, shell scripts, and config files directly on Farm, with fewer typos and less friction.

On Farm, use the structured layout described in the **project structure guide**:

- Raw data → `/group/gmonroegrp3`
- Project working dir in your home, e.g.:

  ```text
  ~/projects/project_name/
  ├── code/
  ├── data/
  └── results/
  ```

- Heavy jobs (alignment, variant calling, big matrix pre-processing) happen here.
- Final, important outputs → `/group/gmonroegrp2`.

---

## 3. Moving to local as soon as possible

My general approach:

1. Run the big, expensive stuff on Farm until you’ve produced **intermediate files that are small enough** to move.
2. As soon as you have:
   - Tidy tables
   - Summarized matrices
   - Subsets of a larger dataset
   that are a **reasonable size**, download them and switch to local analysis.

Reasons:

- Local coding (RStudio + your laptop) is usually:
  - Faster for iteration
  - Better for plotting
  - Less annoying for copy/paste, multiple windows, etc.
- In the end, you need:
  - Tables
  - Figures
  - Objects you can put in a paper / slide deck
  Those are easiest to iterate on locally.

### 3.1 Strategies for shrinking data

If a file is too big to comfortably download, you can often create a **smaller, analysis-ready version** on Farm:

- **Subset columns** (e.g. only keep what you need):
  - VCFs where you only need a few columns → extract those columns.
  - Matrix files where you only need a subset of samples or features.
- **Subset rows/sites/samples:**
  - Random subset of variants to prototype code.
  - Subset to a single chromosome or region.
- **Convert to more compact formats:**
  - E.g. VCF → genotype matrix; drop unused info fields.

The pattern:

1. On Farm, pre-process into **smaller, tidy tables**.
2. Download those tables.
3. Build and test your R code locally.
4. If needed, bring the code back to Farm and run it at full scale there.

Goal: **coding and figure-making locally, big crunching on Farm.**

---

## 4. Local project organization: `code/`, `figures/`, and data

On your **local machine** (laptop/desktop), I tend to use a simple, consistent structure for each project, e.g.:

```text
project_name_local/
├── code/
├── data/
└── figures/
```

- `data/` – copies or downloads of processed/analysis-ready tables from Farm.
- `code/` – R scripts (and possibly a few helper shell scripts).
- `figures/` – PDFs (and maybe PNGs) of every figure you make.

### 4.1 The `figures/` folder

In R, I always save figures explicitly, usually as **PDFs**:

```r
pdf("figures/figure1_trait_vs_env.pdf", width = 6, height = 4)
# ... ggplot code ...
dev.off()
```

Over time:

- `figures/` becomes a **catalog** of everything you’ve tried.
- These PDFs can later be:
  - Dropped into PowerPoint/Keynote
  - Combined into composite figures
  - Shared easily with collaborators

---

## 5. How I structure R code locally

Inside `code/`, my pattern is usually:

```text
code/
├── functions.R
├── parse_data.R     # or make_tables.R
├── load_data.R
├── analysis_trait1.R
├── analysis_trait2.R
└── ...
```

### 5.1 `functions.R`

This file is the **heart** of the project’s code:

- Contains:
  - All the **packages** to load (e.g. `library(data.table)`, `library(ggplot2)`, etc.).
  - All **custom functions** I’ve written for this project.

Typical workflow:

- As soon as a chunk of code is useful and reusable, I:
  1. Turn it into a **function**.
  2. Put that function into `functions.R`.
- I **rarely delete** functions from `functions.R`; I might refine or rename them, but I keep the history of useful tools.

By the end of a project, `functions.R` may have **dozens or hundreds of functions**.

Example top of `functions.R`:

```r
## Packages
library(data.table)
library(ggplot2)
library(dplyr)
# ... others as needed ...

## Functions

read_dt <- function(path, ...) {
  data.table::fread(path, ...)
}

plot_trait_vs_env <- function(dt, trait, env_var, out_path = NULL) {
  p <- ggplot(dt, aes_string(x = env_var, y = trait)) +
    geom_point(alpha = 0.5) +
    theme_bw()
  if (!is.null(out_path)) {
    pdf(out_path, width = 6, height = 4)
    print(p)
    dev.off()
  } else {
    print(p)
  }
  invisible(p)
}
```

### 5.2 `parse_data.R` / `make_tables.R`

This script:

- Reads in **raw-ish** or intermediate files (from Farm or elsewhere).
- Performs all the **slow wrangling**:
  - Cleaning
  - Joining
  - Reshaping
  - Aggregating
- Writes out **clean tables** that are fast to load later.

Example pattern:

```r
source("code/functions.R")

# Read messy inputs
raw1 <- fread("data/raw_trait_table.tsv")
raw2 <- fread("data/raw_environment_table.tsv")

# Clean / join / reshape
dt <- clean_and_join(raw1, raw2)  # some function you wrote

# Write out tidy outputs
fwrite(dt, "data/trait_env_tidy.tsv")
```

You might run this script only occasionally (e.g., when new raw data arrives or you change the wrangling logic). It may be slow, and that’s fine.

### 5.3 `load_data.R`

This script is for **fast startup** when you’re ready to analyze:

```r
source("code/functions.R")

trait_env <- fread("data/trait_env_tidy.tsv")
geno_mat  <- fread("data/genotype_matrix.tsv")
# ... any other pre-made tables ...
```

Now, at the top of any analysis script you can just do:

```r
source("code/functions.R")
source("code/load_data.R")

# everything is loaded and ready
```

This means:

- When you open a fresh R session and run those two `source()` calls, you’re immediately in a state where:
  - All packages are loaded.
  - All functions are defined.
  - All key data objects are in memory.

### 5.4 Analysis scripts (`analysis_trait1.R`, etc.)

Each analysis script is:

- Focused on a **specific question** or figure set.
- Shorter, mostly a sequence of:
  - Function calls
  - Plot-making
  - Summary stats

Typical header:

```r
source("code/functions.R")
source("code/load_data.R")

# Now perform analysis for Trait 1
```

Because the heavy parsing is done in `parse_data.R` and the function definitions are in `functions.R`, these analysis scripts can stay relatively clean and readable.

---

## 6. Using subsets & small versions for code development

Especially when datasets are large:

- Create **small subsets** on Farm:
  - Fewer samples
  - Single chromosome / region
  - Fewer columns (e.g. first 5 columns of a VCF)
- Download the subset and use it to:
  - Prototype clean, well-structured code
  - Test functions
  - Develop figures

Once the code works on the subset:

- Either:
  - Run the same code on **full data locally** if it fits, or
  - Move the finalized code back to Farm and run it at scale there.

This way you get the best of both worlds:

- **Fast iteration** locally.
- **Full-scale computation** on Farm.

---

## 7. Libraries & tooling

### 7.1 `data.table` and friends

In R, I strongly recommend:

- `data.table` for:
  - Fast I/O (`fread`, `fwrite`)
  - Fast data manipulation
- `ggplot2` (and add-ons) for plotting
- Other libraries as needed, but avoid overcomplicating things unless necessary.

### 7.2 LLMs as coding partners

I increasingly use large language models to:

- Draft initial versions of functions or scripts.
- Refactor clunky code into something cleaner.
- Generate boilerplate for plotting, modeling, etc.
- Help remember syntax or edge cases without digging through documentation.

The workflow is still:

1. **You** decide the data structure and logic.
2. Use an LLM to help **fill in code** and **speed up iteration**.
3. You test, refine, and adapt.

---

## 8. Summary of the workflow

1. **On Farm:**
   - Use VS Code remote.
   - Follow the project directory structure.
   - Run heavy jobs to get from raw data → intermediate outputs → smaller tables.

2. **Move to local as early as possible:**
   - Download tidy, smaller tables or subsets.
   - Organize locally into `code/`, `data/`, `figures/`.

3. **In R locally:**
   - `functions.R` → packages + all your reusable functions.
   - `parse_data.R` / `make_tables.R` → once-off, slow wrangling, writes tidy tables.
   - `load_data.R` → fast loading of those tidy tables.
   - `analysis_*.R` → short scripts that source functions + data, then make figures and summaries.

4. **Constantly aim for:**
   - More work done as **functions** and reusable scripts.
   - Faster iteration on **figures** and **tables**.
   - A workflow where spinning up a new R session and being “ready to analyze” is basically:
     ```r
     source("code/functions.R")
     source("code/load_data.R")
     ```

That’s the core of how I like to code right now:  
**heavy compute on Farm, real thinking and plots locally, with lots of small functions and a clean project structure on both sides.**
