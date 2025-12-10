#!/bin/bash -l
#SBATCH --job-name=hifiasm_and_asmQC
#SBATCH --output=log/%x_%j.out
#SBATCH --error=log/%x_%j.err
#SBATCH --time=5-00:00:00
#SBATCH --partition=bmm
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=10
#SBATCH --mem=64G 

fastq=$1
#outdir/outname_prefix
outname=$2
#to be plotted with nucfreq
in_bam=$3


echo "Assembly..."
/home/soya/hifiasm/hifiasm -t $SLURM_CPUS_PER_TASK -l0 -f0 -o $outname'.asm' $fastq

module load conda
conda activate contig_select

gfatools gfa2fa $outname.asm.bp.a_ctg.gfa > $outname.asm.bp.a_ctg.fa
gfatools gfa2fa $outname.asm.bp.p_ctg.gfa > $outname.asm.bp.p_ctg.fa
seqkit seq -m 100000 $outname.asm.bp.a_ctg.fa > $outname.asm.bp.a_ctg_long.fa
seqkit seq -m 100000 $outname.asm.bp.p_ctg.fa > $outname.asm.bp.p_ctg_long.fa


echo "Scaffolding..."
conda deactivate
conda activate ragtag-env
ragtag.py scaffold -q 60 -f 30000 -i 0.5 --remove-small /home/soya/refs/TAIR10_masked/TAIR10.hard_masked.fa $outname.asm.bp.p_ctg_long.fa -o $outname._long_strict.ragtag


echo "submitting SyRI..."
ragtagdir=$outname._long_strict.ragtag
REF_fa=/home/soya/refs/Col-CC/Col_CEN_CC.fasta

sed -e 's/_RagTag//' $ragtagdir/ragtag.scaffold.fasta |/home/soya/tools/seqkit grep -n -f contigs_to_keep.txt > $ragtagdir.renamed.fa 
sbatch code/minimap_and_SyRI_Col_CEN_CC.sh $ragtagdir $REF_fa $outname

echo "submitting SVIM-asm..."
sbatch code/SVIM_asm.sh $outname.asm.bp.a_ctg.fa $REF_fa $outname

echo "repeat and Mt annotation..."
sbatch code/repeat_and_Mt_annotation.sh $ragtagdir $outname



echo "submitting mapping and NucFreq..."
/home/soya/tools/seqkit fx2tab -n -l $ragtagdir.renamed.fa | cut -f 2 > $outname.temp
paste bed_c12.txt  $outname.temp > $outname.length.txt
sbatch code/pbmm2_pancentromere_paper.sh $ragtagdir.renamed.fa $in_bam $outname $outname.length.txt


