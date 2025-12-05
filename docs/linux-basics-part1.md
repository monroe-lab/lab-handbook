# Linux basics for working on Farm (Part 1: Essentials)

This guide covers the **absolute essentials** you need to use the Farm cluster from the command line. If you can do everything in this document, you can:

- Move around the filesystem
- Create, view, and edit files
- Organize your projects
- Run scripts and inspect outputs

Later parts (not written yet) will cover:

- **Part 2:** Bioinformatics tools, modules, conda environments, etc.  
- **Part 3:** Containers (e.g. Singularity/Apptainer), workflow managers, more advanced shell tricks.

For now, this is **Part 1: Linux 101 for Farm**.

---

## 1. The shell and basic ideas

When you log in to Farm, you land in a **shell** (usually `bash`). You’ll see a **prompt**, something like:

```bash
[USERNAME@farm-login ~]$
```

You type **commands** and press Enter. A command is usually:

```bash
command  [options]  [arguments]
```

Examples:

```bash
ls -lh /group/gmonroegrp2
cd /group/gmonroegrp3/projectX
head results.txt
```

- `ls`, `cd`, `head` are **commands**
- `-l`, `-h` are **options** (or “flags”)
- `/group/gmonroegrp2`, `results.txt` are **arguments**

---

## 2. Where am I? (paths and directories)

### 2.1 Print working directory: `pwd`

```bash
pwd
```

Shows your **current directory**, for example:

```bash
/home/USERNAME
```

This is sometimes called your **current working directory**.

---

### 2.2 Home directory and `~`

Your home directory is typically:

```bash
/home/USERNAME
```

The shell uses `~` as a shortcut for “home”:

```bash
cd ~          # go to your home directory
cd            # also goes home (no argument)
```

---

### 2.3 Absolute vs relative paths

- **Absolute path**: starts from `/` (the filesystem root), e.g.
  - `/home/USERNAME`
  - `/group/gmonroegrp2/PROJECT_NAME`

- **Relative path**: relative to your current directory, e.g.
  - `scripts/` (if you are in `/home/USERNAME`)
  - `../data` (one directory up, then `data`)

Example:

```bash
cd /group/gmonroegrp2/PROJECT_NAME
pwd
# /group/gmonroegrp2/PROJECT_NAME

cd scripts
pwd
# /group/gmonroegrp2/PROJECT_NAME/scripts

cd ..
pwd
# /group/gmonroegrp2/PROJECT_NAME
```

---

## 3. Looking around: `ls` and friends

### 3.1 Basic listing: `ls`

```bash
ls
```

Lists files and directories in the current directory.

---

### 3.2 Useful `ls` options

```bash
ls -l        # long listing (permissions, size, dates)
ls -h        # human-readable sizes (use with -l)
ls -a        # show hidden files (starting with .)
ls -lh       # long + human-readable
ls -lha      # long + human-readable + hidden
ls -lt       # long listing, sorted by time (most recent first)
```

Examples:

```bash
ls -lh
ls -lha /group/gmonroegrp3
ls -lt logs/
```

---

### 3.3 Globs (wildcards)

- `*` matches “anything”
- `?` matches “any single character”

Examples:

```bash
ls *.sh           # all files ending in .sh
ls sample*_R1*    # files starting with sample and containing _R1
ls *.fastq.gz
```

Globs are incredibly useful for dealing with many related files (FASTQs, BAMs, etc.).

---

## 4. Moving around: `cd`

`cd` changes your current directory.

```bash
cd /group/gmonroegrp2
cd /group/gmonroegrp3/PROJECT_NAME
cd ~/projects/my_project
```

Special cases:

```bash
cd         # go to home directory
cd ~       # same as above
cd ..      # go up one directory
cd -       # go back to previous directory
```

**Tip:** Use **Tab completion**:

- Type part of a path, press `Tab` to auto-complete.
- Saves time and reduces typos.

Example:

```bash
cd /group/gmonroegrp2/PROJ<Tab>
# auto-completes to /group/gmonroegrp2/PROJECT_NAME if unique
```

---

## 5. Creating and managing files and directories

### 5.1 Make directories: `mkdir`

```bash
mkdir my_project
mkdir -p my_project/results/variant_calls
```

- `mkdir` creates a directory.
- `-p` creates parent directories as needed (no error if they already exist).

---

### 5.2 Create empty files: `touch`

```bash
touch notes.txt
touch samples.txt
```

- `touch` creates an empty file if it doesn’t exist.
- If it **does** exist, `touch` just updates its timestamp (useful sometimes, but you mostly use it to make empty files).

---

### 5.3 Copy files and directories: `cp`

```bash
cp file1.txt file2.txt         # copy file1.txt -> file2.txt
cp file1.txt backup/           # copy into backup directory
cp -r scripts/ scripts_backup/ # copy directory recursively
```

- `-r` means “recursive” (needed for directories).

---

### 5.4 Move / rename files: `mv`

```bash
mv old_name.txt new_name.txt           # rename a file
mv file.txt /group/gmonroegrp2/PROJECT # move file
mv *.sh scripts/                       # move many files into scripts/
```

- `mv` is both “move” and “rename.”
- No `-r` needed; it works on files and directories.

---

## 6. Deleting files **carefully**: `rm`

> **Danger:** `rm` permanently deletes files. There is no trash or undo by default.

Basic usage:

```bash
rm file.txt          # delete file.txt
rm *.tmp             # delete all .tmp files in current dir
```

To delete directories:

```bash
rm -r old_results/   # recursively delete directory and contents
```

**Best practices:**

1. **Double-check** before pressing Enter:
   - Use `ls` to see what you’re about to delete.
2. Avoid using `rm -rf` casually:
   - `-f` = “force” (no confirmations)
   - `-r` = “recursive”
   - `rm -rf` can destroy large parts of the filesystem if mis-typed.
3. For safety, you can use interactive mode:

   ```bash
   rm -i file.txt          # asks before deleting
   rm -ri old_results/     # asks for each file
   ```

4. When cleaning up large directories, it’s often safer to:
   - Move them somewhere like `trash/` first, then delete once you’re very sure.

---

## 7. Viewing text files: `cat`, `less`, `head`, `tail`

### 7.1 `cat` – print a file

```bash
cat file.txt
```

- Prints the entire file to the screen.
- Good for very small files; not great for huge.

---

### 7.2 `less` – scroll through a file (recommended)

```bash
less file.txt
less -S file.txt
```
- `-S` – wide view

Controls:

- `Down arrow` / `j` – scroll down
- `Up arrow` / `k` – scroll up
- `Space` – next page
- `b` – previous page
- `/pattern` – search forward for “pattern”
- `n` – next match
- `q` – quit

`less` is your friend for inspecting log files, scripts, configs, etc.

---

### 7.3 `head` and `tail`

```bash
head file.txt        # first 10 lines
tail file.txt        # last 10 lines
head -n 20 file.txt  # first 20 lines
tail -n 50 file.txt  # last 50 lines
```

Very useful for quickly checking the start or end of a file (e.g., checking a FASTQ header, looking at the end of a log file).

---

### 7.4 `tail -f` – live log viewing

```bash
tail -f logs/my_job.out
```

- Shows the last lines of `my_job.out` and **updates in real time** as new lines are written.
- Great for watching long-running jobs.

Press `Ctrl + C` to stop.

---

## 8. Editing files with `nano` (simple text editor)

`nano` is a simple, beginner-friendly editor that runs in the terminal.

Open (or create) a file:

```bash
nano script.sh
```

You’ll see the file contents and a menu at the bottom.

Key commands:

- **Ctrl + O** – Write out (save)
- **Enter** – Confirm filename when saving
- **Ctrl + X** – Exit
- **Ctrl + W** – Search within file
- **Ctrl + K** – Cut current line
- **Ctrl + U** – Paste

Typical workflow:

1. `nano my_script.sh`
2. Type your script.
3. `Ctrl + O`, then Enter to save.
4. `Ctrl + X` to exit.

VS Code Remote is much nicer for larger scripts, but `nano` is handy for quick edits.

---

## 9. Combining commands with pipes and redirection

### 9.1 Piping with `|`

The pipe (`|`) sends output from one command into another command.

Examples:

```bash
ls -lh | less
```

- List files in long format, then scroll the output with `less`.

```bash
cat big.log | grep ERROR | head
```

- Show the first few lines in `big.log` that contain the word “ERROR”.

---

### 9.2 Redirecting output to a file: `>` and `>>`

```bash
command > output.txt   # write output to file (overwrite)
command >> output.txt  # append output to file (add at end)
```

Examples:

```bash
ls -lh > listing.txt
echo "hello" > message.txt    # create/overwrite
echo "world" >> message.txt   # append to existing file
```

Use this to capture logs, summaries, listings, etc.

---

## 10. Searching within files: `grep` (basic)

```bash
grep "pattern" file.txt
```

- Prints lines in `file.txt` that contain `pattern`.

Case-insensitive search:

```bash
grep -i "pattern" file.txt
```

Search across multiple files:

```bash
grep "ERROR" logs/*.out
```

Common pattern:

```bash
grep -n "ERROR" logs/*.out
```

- `-n` shows line numbers.

For very large files, combine with `less`:

```bash
grep "ERROR" big.log | less
```

---

## 11. Checking file sizes and disk usage

### 11.1 `du` – disk usage

```bash
du -sh .
```

- Total size of the current directory.

```bash
du -sh *
```

- Size of each item in the current directory.

Sort by size:

```bash
du -sh * | sort -h
```

This is very helpful for finding **which directories are huge**.

---

### 11.2 `df` – free space

```bash
df -h
```

- Shows how much disk space is used/free on each filesystem (home, group directories, etc.).

---

## 12. Running scripts

### 12.1 Making a script executable

Create a simple script:

```bash
nano hello.sh
```

Put this inside:

```bash
#!/bin/bash
echo "Hello from Farm!"
```

Save and exit. Then:

```bash
chmod +x hello.sh        # mark as executable
./hello.sh
```

Output:

```text
Hello from Farm!
```

You don’t **have** to make scripts executable; you can also run them like:

```bash
bash hello.sh
```

But learning `chmod +x` is useful.

---

## 13. Command history and autocomplete

### 13.1 Command history

Use the **up arrow** to scroll through previous commands.

Other useful shortcuts:

- `Ctrl + R` – reverse search history:
  - Press `Ctrl + R`, start typing part of a previous command.
  - Press Enter to run it or use arrows to edit.

### 13.2 Tab completion

- Type part of a command or filename, then press `Tab`.
- If there’s a unique match, it auto-completes.
- If multiple matches, pressing `Tab` twice shows them.

Tab completion saves time and reduces errors.

---

## 14. Stopping commands

Things go wrong sometimes. To stop a running command:

- **Ctrl + C** – stop/interrupt current command.
- **Ctrl + Z** – suspend (pause) a command and return to the shell (advanced; usually Ctrl + C is enough).

If you accidentally start something large on the login node, use `Ctrl + C` to stop it.

---

## 15. Getting help: `man` and `--help`

Most commands have built-in help.

### 15.1 `--help`

```bash
ls --help
grep --help
```

Shows a quick summary of options.

---

### 15.2 `man` pages

```bash
man ls
man grep
man nano
```

- Opens the manual (“man page”) for the command.
- Navigate like `less`:
  - Arrow keys / Space to scroll
  - `/pattern` to search
  - `q` to quit

You don’t need to memorize every option; learn to read help quickly.

---

## 16. Good habits and gotchas

- **Linux is case-sensitive**:
  - `Data.txt` and `data.txt` are different files.
- Avoid spaces in filenames if possible:
  - Use `project_name` instead of `Project Name`.
  - If a file has spaces, you must quote it:

    ```bash
    ls "Project Name"
    ```

- Keep your directory structure organized:
  - Example layout:

    ```text
    project/
      data/
      scripts/
      results/
      logs/
      tmp/
    ```

- Don’t run heavy programs on the **login node**:
  - Use Slurm (`sbatch`/`srun`) to run jobs on compute nodes (see `slurm-basics.md` and `slurm-job-headers.md`).

---

## 17. What’s next (sneak peek of Parts 2 and 3)

Once you’re comfortable with everything above, you’ll be ready for:

- **Part 2:**  
  - Scripting 101

For now, focus on **Part 1**. If you can move around, inspect files, edit scripts, and keep your directories tidy, you’ll be able to work effectively on Farm and build from there.
