# Interacting with Farm from your personal computer

This tutorial explains how to connect to the **Farm** cluster from your own laptop/desktop using:

- The **terminal** (SSH, `scp`, `rsync`)
- **VS Code Remote – SSH**
- A few other useful tips and best practices

> **Note:** Replace `USERNAME` with your UC Davis HPC username and `farm-login-address` with the actual Farm login hostname given in the official HPC docs.

---

## 1. Prerequisites

Before you start:

1. **Farm account and SSH key**
   - Make sure you’ve requested an account and set up your SSH key as described in `cluster-access.md`.
2. **VPN (if required)**
   - If you’re off-campus, you may need to connect to the UC Davis VPN for SSH to work. Check the HPC documentation or lab instructions.

---

## 2. Basic SSH from the terminal

### 2.1 First connection

On macOS or Linux, open **Terminal**.  
On Windows, open **PowerShell** or **Windows Terminal** (or use WSL).

To log in:

```bash
ssh USERNAME@farm-login-address
```

Example (placeholder):

```bash
ssh jdoe@farm-login-address
```

The first time you connect, you’ll see something like:

```text
The authenticity of host 'farm-login-address (...)' can't be established.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Type `yes` and press Enter.

If you’re using SSH keys correctly, you may be prompted for your **key passphrase** (not your UC Davis password).

Once logged in, you’ll be on a **login node**. From here you can:

- Navigate with `cd`, `ls`, `pwd`
- Edit files with `nano`, `vim`, or `emacs`
- Submit Slurm jobs with `sbatch`

> **Important:** Do **not** run heavy compute jobs on the login node. Always use Slurm (`sbatch`, `srun`) to run jobs on compute nodes.

---

### 2.2 Using an SSH config (recommended)

To avoid typing the full command each time, you can configure a shortcut in `~/.ssh/config` on your personal machine.

Edit/create the file:

```bash
nano ~/.ssh/config
```

Add something like:

```text
Host farm
    HostName farm-login-address
    User USERNAME
    IdentityFile ~/.ssh/id_rsa   # or your actual key path
```

Save and exit. Now you can connect with:

```bash
ssh farm
```

This is also the name VS Code will use (see below).

---

## 3. Transferring files with `scp`

`scp` lets you copy files **between your local machine and Farm**.

### 3.1 Local → Farm

From your **local** terminal:

```bash
scp path/to/local_file.txt USERNAME@farm-login-address:/home/USERNAME/
```

Using the config shortcut:

```bash
scp path/to/local_file.txt farm:/home/USERNAME/
```

Copy a directory recursively:

```bash
scp -r my_project farm:/home/USERNAME/projects/
```

---

### 3.2 Farm → Local

To copy a file from Farm back to your machine:

```bash
scp farm:/home/USERNAME/results/output.txt ./output.txt
```

Or copy a directory:

```bash
scp -r farm:/home/USERNAME/results ./results
```

---

## 4. Syncing directories with `rsync` (recommended for projects)

`rsync` is more powerful than `scp` for **keeping directories in sync** and resuming interrupted transfers.

### 4.1 Local → Farm

```bash
rsync -avhP my_project/ farm:/home/USERNAME/projects/my_project/
```

- `-a`: archive mode (preserves permissions, etc.)
- `-v`: verbose
- `-h`: human-readable sizes
- `-P`: progress + partial transfer

### 4.2 Farm → Local

```bash
rsync -avhP farm:/home/USERNAME/projects/my_project/ ./my_project/
```

### 4.3 Be careful with `--delete`

You can add `--delete` to make the destination match the source exactly (removing files that don’t exist in the source), but use it with caution:

```bash
rsync -avhP --delete my_project/ farm:/home/USERNAME/projects/my_project/
```

---

## 5. Other useful terminal tricks

### 5.1 Persistent sessions with `tmux` or `screen`

Interactive work can be interrupted if your SSH connection drops. Use `tmux` or `screen` to keep a session running on Farm:

```bash
tmux new -s mysession
```

Inside `tmux`, you can run commands, editors, etc. To detach:

- Press `Ctrl + b`, then `d`

To reattach later:

```bash
tmux attach -t mysession
```

This is particularly useful for long-running interactive tasks.

---

### 5.2 Port forwarding (for Jupyter, RStudio, etc.)

If you start a Jupyter notebook on a compute node (via Slurm), you can forward the port to your local machine:

On your **local** machine:

```bash
ssh -L 8888:localhost:8888 USERNAME@farm-login-address
```

Then, on the Farm side, once you have a compute node:

```bash
jupyter lab --no-browser --port=8888
```

Open your browser locally and go to:

```text
http://localhost:8888
```

You’ll see the Jupyter instance running on Farm.

> Always start Jupyter on a **compute node** via `srun` or `sbatch`, not directly on the login node.

---

## 6. Using VS Code Remote – SSH

VS Code’s Remote - SSH extension lets you use the Farm filesystem and terminal **directly inside VS Code**, with IntelliSense, Git, etc.

### 6.1 Install requirements

On your personal machine:

1. Install **Visual Studio Code**.
2. Install the **Remote - SSH** extension:
   - In VS Code, go to the Extensions tab
   - Search for `Remote - SSH`
   - Install it

Make sure you can SSH into Farm from a terminal first (`ssh farm` or `ssh USERNAME@farm-login-address`).

---

### 6.2 Add Farm as a remote host

In VS Code:

1. Open the **Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
2. Type **“Remote-SSH: Add New SSH Host”** and select it.
3. Enter your SSH command, e.g.:

   ```text
   ssh USERNAME@farm-login-address
   ```

   or, if you set up `~/.ssh/config`:

   ```text
   ssh farm
   ```

4. Choose the SSH config file to update (usually `~/.ssh/config`).

---

### 6.3 Connect to Farm

1. Click the green icon in the bottom-left corner of VS Code (or use Command Palette: `Remote-SSH: Connect to Host...`).
2. Choose your host (`farm` or the full `USERNAME@farm-login-address`).
3. VS Code will:
   - Connect over SSH
   - Install the VS Code server on the remote host
   - Open a new window connected to Farm

You may be prompted for your SSH key passphrase.

---

### 6.4 Open folders on Farm

Once connected:

1. Go to **File → Open Folder...**
2. Enter a path on Farm, e.g.:
   - `/home/USERNAME`
   - `/group/gmonroegrp2/PROJECT_NAME`
3. VS Code will show that remote folder in the Explorer sidebar.

You can now:

- Edit scripts, configs, Markdown docs directly on Farm.
- Use the built-in terminal (which is actually running on Farm).
- Use extensions (Python, R, etc.) on the remote server.

---

### 6.5 Remote terminal in VS Code

Open a terminal in the remote VS Code window:

- **Terminal → New Terminal**

This gives you a shell **on Farm** (as if you had SSH’d in), but integrated into VS Code. From here you can:

- Navigate directories
- Run `sbatch`, `squeue`, etc.
- Edit files in VS Code while running jobs in the terminal.

---

### 6.6 Recommended workflow

A typical workflow might look like:

1. Open VS Code.
2. Connect to Farm via Remote - SSH.
3. Open your project folder on Farm.
4. Use VS Code to:
   - Edit job scripts (`*.sbatch`)
   - Edit analysis scripts (Python, R, bash)
   - Edit Markdown docs for the lab handbook
5. Use the VS Code terminal to:
   - Test commands on small subsets of data
   - Submit jobs via `sbatch`
   - Monitor jobs with `squeue`

---

## 7. Git + Farm

If you’re using Git and GitHub:

- Clone your repos **directly on Farm**:

  ```bash
  cd /home/USERNAME/projects
  git clone git@github.com:Monroe-Lab/your-repo.git
  ```

- Use VS Code (Remote - SSH) to work on the repo on Farm.
- Push/pull from within VS Code or the terminal as usual.

This avoids large file transfers between your laptop and Farm; most of the heavy data stays on Farm, while Git handles code and configuration.

---

## 8. Troubleshooting tips

- **SSH hangs or fails:**
  - Check if you’re on VPN (if required).
  - Verify that your SSH key is correctly configured and registered with HPC.
  - Try `ssh -v farm` for verbose output to see what’s wrong.

- **Permission denied (publickey):**
  - Ensure `~/.ssh` and key file permissions are correct on your local machine:
    ```bash
    chmod 700 ~/.ssh
    chmod 600 ~/.ssh/id_rsa
    ```
  - Make sure the correct public key is registered with the HPC system.

- **VS Code can't connect:**
  - Make sure plain SSH works from a terminal first.
  - Check that `Remote - SSH` is using the same SSH config you tested in the terminal.

If you’re stuck, post the error message (minus any sensitive info) in the lab Slack, or ask Grey or a more experienced lab member for help.
