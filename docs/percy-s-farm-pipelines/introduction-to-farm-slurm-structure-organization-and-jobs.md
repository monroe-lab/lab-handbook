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

<br>
