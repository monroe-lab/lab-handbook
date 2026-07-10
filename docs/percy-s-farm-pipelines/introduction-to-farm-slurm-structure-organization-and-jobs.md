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

