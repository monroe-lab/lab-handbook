#!/bin/bash -l
#SBATCH --job-name=svim_asm
#SBATCH --output=log/%x_%j.out
#SBATCH --error=log/%x_%j.err
#SBATCH --time=12:00:00
#SBATCH --partition=bmm
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G 

# load 
module load conda
module load samtools
module load minimap2
conda activate svimasm_env

input_fa=$1
ref_fa=$2
outname=$3

THREADS=4
mkdir $outname.svimasm

minimap2 -a -x asm5 --cs -r2k -t $THREADS $ref_fa $input_fa > $outname.actg.minimap_for_svim.sam
samtools sort -m4G -@4 -o $outname.actg.minimap_for_svim.sorted.bam $outname.actg.minimap_for_svim.sam
samtools index $outname.actg.minimap_for_svim.sorted.bam
svim-asm haploid $outname.svimasm $outname.actg.minimap_for_svim.sorted.bam $ref_fa

#rename the vcf file and move it one directory up
mv $outname.svimasm/variants.vcf $outname.SVIM-asm.vcf
