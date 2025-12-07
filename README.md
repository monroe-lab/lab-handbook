# TGCA Lab Handbook

Welcome! This repo is **required reading for any new lab member** who will be using the FARM compute cluster or doing computational work in our group.

The goal of this handbook is to:
- Get you from “no idea what FARM is” to “running real jobs” safely.
- Capture shared best practices so no one has to reinvent the wheel.
- Serve as a living reference that **everyone in the lab helps maintain**.

If you’ve been invited to this repo, you have write access. Please fix errors, clarify explanations, and add useful content.

---

## Essentials (start here)

If you’re new to FARM or clusters, **start with these**. They cover what you need before submitting jobs or moving data around.

Even if you already have HPC/coding experience, please:
- **Read through all of these once** (skim what you already know).
- Make sure you understand how **FARM is set up for our lab specifically**.

- [Cluster access](docs/cluster-access.md)
- [Slurm basics](docs/slurm_basics.md)
- [Storage & backup](docs/storage-and-backup.md)
- [Interacting with Farm](docs/interacting-with-farm.md)
- [Slurm advanced](docs/slurm-advanced.md)

---

## Workflow templates (code library)

Before writing a new pipeline, **check the templates**:

- [Job sbatch script templates and workflows](templates/)

The `templates/` folder is a growing library of **FARM-ready workflows** (e.g. Assembly, Mapping, Variant Calling, ChIP/CUT&Tag + MACS, BLAST, RNA-seq, etc.). For any new task:

1. Look in `templates/` for something similar.
2. Check for a `README.md`.
3. Read the scripts as well.
4. Copy/modify what’s there instead of starting from scratch.

This will usually be faster and keeps our workflows more consistent.

---

## Farm Coding crash-course

For people newer to Linux, scripting, or bioinformatics. If you’re experienced, skim or jump to what you need.

- [Part 1: Linux basics](docs/linux-basics-part1.md)
- [Part 2: Bash scripting 101](docs/farm-scripting-part2.md)
- [Part 3: Intro to bioinformatics tools & file formats](docs/farm-bioinformatics-part3.md)
- [Part 4: Software, modules, and environments](docs/farm-software-part4.md)
- [Appendix: Customizing your `~/.bashrc`](docs/bashrc-customization.md)

---

## How to contribute (quick version)

You can edit everything directly in the **GitHub web UI** — no command-line git required.

- To edit a file: open it → click 🖉 **Edit** → change text → add a short commit message → **Commit changes**.
- To add a file: go to the folder → **Add file → Create new file** → include path if needed  
  (e.g. `templates/chipseq-macs/README.md`) → **Commit changes**.
- Please:
  - Fix typos, unclear sections, or outdated info when you see them.
  - Add tips/notes you wish you’d known earlier.
  - Sign new tutorials/scripts with your **name + date** (e.g. at the top or bottom).

Small edits are great. Don’t overthink it.

---

## Words of Wisdom

This is a place for short “blog posts” or notes to your future self and others: reflections, checklists, tricks, lessons learned.

If you’ve learned something the hard way, this is where you can help the next person avoid it.

Current posts:
- [Project directory structures on Farm, by Grey](docs/project-structure-on-farm.md)
- [Coding Strategy, by Grey](docs/coding-strategy.md)
- [My LLM philosophy, by Grey](docs/llm-philosophy-blog.md)

---

## Contributing templates (shared workflows)

The `templates/` folder is for **reusable workflows that match how we actually use FARM**.

Each workflow should live in its own subdirectory, e.g.:

- `templates/chipseq-macs/`
- `templates/rnaseq-salmon/`
- `templates/blast-basic/`

A good template directory usually has:

1. **One or more Slurm scripts**  
   - `sbatch` script with headers + resource requests  
   - Any helper shell scripts it calls

2. **A short `README.md`**  
   - What it does  
   - Example command(s)  
   - Inputs → outputs (file types, expected names)  
   - Key parameters a user might change  
   - Any known quirks or “gotchas”

3. **Environment info**  
   - Either a few `module load` lines **or**  
   - A Conda `.yml` exported from a working environment  

4. **Generalizable code**  
   - Use arguments instead of hard-coded paths where possible  
   - Comment the non-obvious parts  
   - Optional: include an example command with typical arguments  

5. **Authorship**  
   - Put your **name + date** in the README and/or script header.

**Fastest way to make a template:**
- Take code you already use → clean it a bit → generalize paths → add a small README and environment info → drop it under `templates/` and commit via the web UI.

Over time, this becomes the “grab-and-go” library for new and existing lab members.
