---
title: "Introduction to FARM/SLURM structure, organization, and jobs"
type: "protocol"
---
# Introduction to FARM/SLURM structure, organization, and jobs

*Created by percival-singson on 2026-07-10*

## Basic commands for moving/working within UNIX terminal

Think of the terminal as a big filing cabinet. Within the cabinet can be folders and the contents of folders. Directories are like folders, as they hold things. Folders can have files, scripts, or more folders within them. To move throughout the cabinet, you have to call folders/directories in a linear fashion.

* `cd [directory name]` : Call a directory, essentially a command that tells your computer to enter a directory, or a subset of labeled files and/or subdirectories
* `cd ..` go back to the previous directory. Adding `/..` will take you back additional one additional directory for each `/.. ` that you add.
* `ls` list the contents of the current directory you are in.
* `ls [directory name]` lists off the files/subdirectories in a directory that is located within your current directory without calling/entering it. Can also use `ls [path to directory from current location]` to list off contents of a directory you are not currently in.
* `mkdir [directory name]` makes a new directory
* `mv [current file name] [new file name]` renames a file within the current directory
* `mv [file name] [path to desired new file location, ex. /group/gmonroegrp2/percy/]` moves the location of a file to a new directory
* `rm [filename]` deletes a file within your current directory **PERMANENTLY.** Use this command with caution.
* `rm -r [directory name]` deletes a directory and all of the files with it **PERMANENTLY.** Use this command with caution.
* A shortcut to avoid typing out huge file and directory names is to start typing the name of what you are calling and hitting your tab button, which will auto fill with the name of your desired file/subdirectory within the current directory you have written out. However, if multiple files start with the same name as you have typed out, terminal will fill until a their names diverge. Ex. If you have `VA1.fasta` and `VA2.fasta`, typing `V` then hitting enter will fill to `VA`. If you then add 2 to that making it `VA2` then hitting enter, it will fill to `VA2.fasta/`.

## Home and Group Directories

There are two types of directories that you can use to store files, directories, CONDA environments etc as part of the lab.

1. **Your personal directory:** This is essentially your own personal storage tied to your ssh username. Under current HPC policies, the amount of storage on your personal directory is very low. Even a small amount of CONDA environments or files will take up this storage very quickly. You can see how much of your personal directory storage you are using by using the `df -h` command, and looking for your name.
2. **Group directories:** These are directories shared by the lab as a whole. The have much, much greater storage capacity and it is highly recommended that you store all of your work in here. The Monroe lab currently has two group directories that we use: `monroegrp2` and `monroegrp3`. You can call them from your terminal using `cd /group/gmonroegrp[#]/`. Inside one of these groups, you can make a directory labeled with your name (using `mkdir`) and store all of your materials inside of it.

## Using nano and sbatch to submit jobs

Scripts allow us to manipulate files to process data and get results out of them. Many scripts require a lot of computing power that our local personal computers do not have. To avoid this, we can submit these scripts as *jobs* to the FARM and it's high performance computing (HPC) power, using the project manager SLURM and a program called nano.

* To create a new job script, type `nano [script name].sh`. All nano files end in `.sh`. You must add `nano` before any `.sh `file in order to open and edit it.
* To submit a job, you must write `sbatch [script name].sh`. If your script requires input files you must write `sbatch [script name].sh filename1, filename2...etc` with the files in order of the variables they are being assigned to in the script.

### Writing a nano script

There are certain lines that must always be written when creating a new nano script. They are generally related to initialization and naming, telling SLURM your desired level of computing power and where to source this power from, and notification of the results of the job (ex. finishing, failing.)

Here is a breakdown of the typical lines that you must add to the header of your script:

1. `#!/bin/bash/ -l` This line must always be the first line as it initializes your script. Without it, the job cannot be submitted or run.
2. `#SBATCH -J [job name]` This is what your job will be named when it is submitted. It will help identify what you are running and help you track where it's computing location is and it's progress.
3. `#SBATCH -t [time alloted for job in ##:##:## format] `This determines the maximum time a job is allowed to run for before it is killed. You can usually determine a good range using your file sizes, script length, and memory/computing requirements. For example, a really big job you may want a maximum of 48:00:00 . It is important to specify this time so that you don't hog computing power, and often times if a job takes a ridiculous amount of time more than expected, something is wrong.
4. `#SBATCH --nodes=#` This tells SLURM how many nodes that you want for your job. Many jobs will only require one node, or computer. However if your job requires more computing power (either via CPUs or RAM) than one node can provide, you can take up multiple nodes. Each individual job you submit as well will be placed on a separate node, so multiple jobs will take up multiple nodes.
5. `#SBATCH --ntasks=# `This specifies how many parallel tasks that your job specifies for, which helps SLURM decide what nodes/CPUs to assign your job to. Commonly, you will only need `--ntasks=1.`
6. `#SBATCH --cpus-per-task=#` This specifies how many CPUs your job requires for each task. A larger, more complex script with larger files will require greater amounts of CPUs. Not enough CPUs will slow your job way down and may cause it to fail or incorrectly run.
7. `#SBATCH --mem=#G` This specifies how much memory your job needs. Jobs with larger files and heavier commands require more memory. Not enough memory will slow your job down, cause failure, or incorrectly run. 
8. `#SBATCH --partition=[partition name] `This tells SLURM what computing partition, or what computing resources your job should use. The Monroe lab has access to three different partitions: `bmh`, `bml`, and `low`.
    * `bmh` is our lab's specific partition that only we use. It has high memory and high job priority and is good for running heavy jobs that need to be run fast. Unfortunately, it will often be taken up by other people in lab and sometimes requires a level of coordination with other people to share it's resources.
    * `bml` is shared across many labs and is larger than `bmh`. It is a good alternative when `bmh `is all taken up. However, certain users do have higher priority levels and if they submit a job, yours may be paused until theirs is finished.
    * `low` is another shared partition between many labs. It is big in size, good for low priority jobs, and jobs with smaller memory requirements. There is no order of priority for users and is a really good resource. In order to use low, you must add another line above `--partition`,`#SBATCH --account=publicgrp`.
9. `#SBATCH --mail-type=END,FAIL` this will have SLURM send you an email whenever your job ends or fails.
10. `#SBATCH --mail-user=[your email] `this tells SLURM where to send your completion/failure email to.
11. `#SBATCH --output=./out_files/converted_slurm-%j.out `This will create a summary file of the job that you have ran. This is particularly important as this created file will tell you exactly what went wrong in the job execution if your job fails. 