#!/bin/bash -l
#SBATCH --job-name=minimap_and_SyRI
#SBATCH --output=log/%x_%j.out
#SBATCH --error=log/%x_%j.err
#SBATCH --time=99:00:00
#SBATCH --partition=bmm
#SBATCH --cpus-per-task=1
#SBATCH --mem=128G

# Load Conda, bash -l allows the use of login node and is necessary to run module load conda

module load minimap2


ref_nuc=$2
ragtagdir=$1
outname=$3
working_dir=$(dirname "$outname")
prefix=$(basename "$outname")

minimap2 -ax asm5 --eqx $ref_nuc $ragtagdir.renamed.fa > $working_dir/$prefix"_mapped_eqx.sam"

module load conda
conda activate nucmer
syri -c $working_dir/$prefix"_mapped_eqx.sam" -r $ref_nuc -q $ragtagdir.renamed.fa -k -F S --prefix $prefix --dir $working_dir

conda deactivate
#conda activate syri_gap

#grep 'U' $ragtagdir/*agp | cut -f 1,2,3 | sed -e 's/_RagTag//' > $working_dir/temp_liftbed
#python3 code/liftover_gap.py $working_dirtemp_liftbed ${outname}syri.out ${outname}_gap_coords_on_SYN.txt
