# Customizing your Farm shell with `~/.bashrc`

This note shows you how to:

- Edit your `~/.bashrc` file  
- Add **aliases** (shortcuts for commands)  
- Add small **functions** (reusable mini-scripts)  
- Set up a few **Farm- and Slurm-specific helpers**

Most of this is just copy-paste examples you can adapt.

---

## 1. What is `~/.bashrc`?

- Farm uses **bash** as the default shell (`/bin/bash`).
- When you start an **interactive bash shell**, bash reads your `~/.bashrc` file.
- Anything you put in there (aliases, functions, environment variables) will be available every time you open a new shell.

So `~/.bashrc` is the right place to put:

- Your favorite shortcuts (e.g. `ll` for long `ls`)
- Functions you use all the time
- Prompt tweaks, PATH tweaks, etc.

---

## 2. Editing and reloading `~/.bashrc`

### 2.1 Edit the file

```bash
nano ~/.bashrc
```

Scroll to the **bottom** and add your aliases/functions there.

Save and exit:

- `Ctrl + O` → Enter (to save)  
- `Ctrl + X` → exit

---

### 2.2 Reload without logging out

After editing, reload it in the current shell:

```bash
source ~/.bashrc
# or:
. ~/.bashrc
```

Now your new aliases/functions are immediately available.

---

## 3. Basic alias examples

An **alias** is just a shortcut:

```bash
alias name='some long command with options'
```

### 3.1 Safer, nicer `ls`

Put this in `~/.bashrc`:

```bash
# Colored ls (Linux / Ubuntu: --color, no -G)
alias ls='ls --color=auto'

# Long listing, human-readable sizes
alias ll='ls -lh'

# Long + show hidden files
alias la='ls -lha'

# Sort by modification time, newest first
alias lt='ls -lht'
```

Notes:

- On Linux (Ubuntu), you want `--color=auto`.  
  (`-G` is for macOS and will error on Farm.)

---

### 3.2 Navigation shortcuts

Handy for your group directories:

```bash
# Quick jump to home
alias cdh='cd ~'

# Quick jump to group storage (adjust paths as needed)
alias cdg2='cd /group/gmonroegrp2'
alias cdg3='cd /group/gmonroegrp3'

# Example: project directory shortcut
alias cdproj='cd /group/gmonroegrp2/projects'
```

---

### 3.3 Disk usage helpers

```bash
# Show sizes of everything in current dir, sorted smallest -> largest
alias dus='du -sh * | sort -h'

# Total size of current directory
alias du.='du -sh .'

# Quick check of disk usage in project dir
alias dug2='cd /group/gmonroegrp2 && du -sh . && cd -'
alias dug3='cd /group/gmonroegrp3 && du -sh . && cd -'
```

---

### 3.4 Slightly safer `rm`

If you like a bit of protection:

```bash
# Ask before deleting individual files
alias rm='rm -i'
```

For directories you still need `rm -r` or `rm -ri`. This won’t save you from every mistake, but it makes accidental deletions slightly less “instant.”

---

## 4. Slurm helpers (aliases + small functions)

These can make checking jobs a lot nicer.

### 4.1 Quick view of your jobs

```bash
# Show only your jobs in the queue
alias sq='squeue -u $USER'

# Show your jobs with a few useful columns
alias sqs='squeue -u $USER -o "%.18i %.9P %.20j %.8u %.2t %.10M %.6D %R"'
```

Explanation for `-o` fields:

- `%i` JobID
- `%P` Partition
- `%j` JobName
- `%u` User
- `%t` State (R, PD, etc.)
- `%M` Time used
- `%D` Nodes
- `%R` Reason / NodeList

---

### 4.2 Show recent job history (sacct)

```bash
# Last 24 hours of jobs
alias sqh='sacct -u $USER --starttime=now-1day \
  --format=JobIDRaw,JobName,Partition,State,Elapsed,MaxRSS'
```

You can change `now-1day` to `now-3days`, etc.

---

### 4.3 Simple function to watch your queue

Add this function:

```bash
# Watch your queue, updating every N seconds (default 5)
wq() {
    local interval="${1:-5}"
    watch -n "$interval" "squeue -u $USER -o '%.18i %.9P %.20j %.2t %.10M %.6D %R'"
}
```

Usage:

```bash
wq          # update every 5 seconds
wq 10       # update every 10 seconds
```

---

### 4.4 Quick interactive job starter

You can also make a helper to start an interactive shell on a compute node:

```bash
# Simple interactive job on bmh with our group
srun_bmh() {
    local time="${1:-01:00:00}"
    local cpus="${2:-4}"
    local mem="${3:-16G}"

    echo "Requesting interactive job on bmh: time=$time, cpus=$cpus, mem=$mem"
    srun --pty \
         --account=gmonroegrp \
         --partition=bmh \
         --time="$time" \
         --cpus-per-task="$cpus" \
         --mem="$mem" \
         bash
}
```

Usage:

```bash
srun_bmh           # 1 hour, 4 CPUs, 16G
srun_bmh 02:00:00 8 32G
```

Adjust defaults as you like.

---

## 5. Color and prompt tweaks

### 5.1 Ensure colored output for `grep`, `diff`, etc.

```bash
# Color for common tools (if supported by the tool)
alias grep='grep --color=auto'
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'
```

Many programs respect `--color=auto` similarly to `ls`.

---

### 5.2 Custom prompt with conda env + cwd

A minimal but useful prompt (shows conda env and current directory):

```bash
# Simple PS1: [env] user@host:cwd $
export PS1='(${CONDA_DEFAULT_ENV:-base}) \u@\h:\w\$ '
```

- `\\u` = username
- `\\h` = hostname
- `\\w` = current working directory
- `${CONDA_DEFAULT_ENV:-base}` shows current conda env (or `base` if none)

You can get fancier later, but this is already helpful on clusters.

---

## 6. Example: some aliases/functions all together

Here’s a block you could drop near the end of `~/.bashrc` and tweak:

```bash
########## Farm customizations ##########

# Safer-ish rm
alias rm='rm -i'

# Colored ls (Linux)
alias ls='ls --color=auto'
alias ll='ls -lh'
alias la='ls -lha'
alias lt='ls -lht'

# Quick navigation
alias cdh='cd ~'
alias cdg2='cd /group/gmonroegrp2'
alias cdg3='cd /group/gmonroegrp3'

# Disk usage helpers
alias dus='du -sh * | sort -h'
alias du.='du -sh .'

# Slurm queue helpers
alias sq='squeue -u $USER'
alias sqs='squeue -u $USER -o "%.18i %.9P %.20j %.8u %.2t %.10M %.6D %R"'
alias sqh='sacct -u $USER --starttime=now-1day --format=JobIDRaw,JobName,Partition,State,Elapsed,MaxRSS'

# Watch my queue
wq() {
    local interval="${1:-5}"
    watch -n "$interval" "squeue -u $USER -o '%.18i %.9P %.20j %.2t %.10M %.6D %R'"
}

# Interactive session on bmh with our account
srun_bmh() {
    local time="${1:-01:00:00}"
    local cpus="${2:-4}"
    local mem="${3:-16G}"

    echo "Requesting interactive job on bmh: time=$time, cpus=$cpus, mem=$mem"
    srun --pty \
         --account=gmonroegrp \
         --partition=bmh \
         --time="$time" \
         --cpus-per-task="$cpus" \
         --mem="$mem" \
         bash
}

# Color grep
alias grep='grep --color=auto'
alias egrep='egrep --color=auto'
alias fgrep='fgrep --color=auto'

# Simple prompt showing conda env + cwd
export PS1='(${CONDA_DEFAULT_ENV:-base}) \\u@\\h:\\w\\$ '
########################################
```

After adding this, don’t forget:

```bash
source ~/.bashrc
```

---

## 7. General advice

- Add **only things you understand** to `~/.bashrc`. If something breaks, it’s usually because of a typo or a line in this file.
- If your shell starts behaving strangely, you can temporarily move it:

  ```bash
  mv ~/.bashrc ~/.bashrc.bak
  exec bash
  ```

  Then copy back pieces until you find what broke it.

- Keep lab-specific aliases/functions in a clearly marked section (like the block above) so everyone can share/compare their `.bashrc` customizations easily.
