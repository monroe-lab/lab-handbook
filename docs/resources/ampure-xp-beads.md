---
title: AMPure XP Beads
type: kit
status: in_stock
vendor: Beckman Coulter
catalog_number: A63881
---
# AMPure XP Beads

> ℹ️ **Chemistry**
> Carboxyl-coated paramagnetic polystyrene beads in a PEG/NaCl buffer. Under crowding conditions, DNA collapses onto the bead surface (SPRI chemistry); washing with ethanol removes salts and short fragments while DNA stays bound until eluted in low-salt buffer.

> 💡 **Lab use**
> Size-selective DNA cleanup for nearly every NGS library prep. Bead:sample ratio sets the size cutoff (lower ratio = bigger fragments retained), so the same bottle handles HMW HiFi prep and short-fragment Illumina cleanups.

> ⚠️ **Safety**
> Low hazard under normal lab handling; the storage buffer contains sodium azide as a preservative — do not pour large volumes down copper drains.

SPRI paramagnetic beads for DNA cleanup. Used in [[ot2-automated-nbd114-prep]] and [[nbd114-multiplexed-flongle-prep]] for three cleanups (post end-prep, post pool, final library). **Ratio depends on use case: 0.6× for HiFi shearing QC and HMW work, 1.8× for Illumina library QC via [[illumina-library-qc-on-flongle]].** Do not change the ratio without re-validating. **Constant elution bias for fragments >30 kb** (5–30% loss to incomplete elution) — characterized in [[in-house-hifi-shearing]] § Validation Phase.
