---
type: "room"
title: "UC Davis DNA Technologies Core"
label_1: "DNA Technologies & Expression Analysis Core"
notes: "UC Davis Genome Center sequencing core. PacBio Revio, ONT PromethION, Element AVITI, Illumina. Also runs LightBench size selection and FemtoPulse QC as a service."
---

# UC Davis DNA Technologies Core

The sequencing core the lab sends libraries to. Official name **DNA Technologies & Expression
Analysis Core**, part of the UC Davis Genome Center ([[room-genome-center]]).

Website: <https://dnatech.ucdavis.edu/>

## What the lab uses it for

| Service | Notes |
| --- | --- |
| PacBio Revio HiFi sequencing | The Fiber-seq route. **Base kinetics must be requested** — without it there are no `MM`/`ML` tags and no m6A calls |
| LightBench size selection | Max 25 µL input, min 1 µg. See [[hmw-size-selection]] |
| FemtoPulse QC | $27/sample as a service; see [[hifi-dna-extraction]] |

> ⚠️ **Base kinetics is not the default.** A Revio run submitted without base kinetics enabled
> returns ordinary HiFi reads with no methylation information, which makes a Fiber-seq
> experiment unrecoverable. Confirm it in writing on the submission. See
> [[1-fiber-seq-master-protocol]].

## Instruments

PacBio Revio, Oxford Nanopore PromethION, Element AVITI, Illumina NovaSeq X, NextSeq 2000, and
MiSeq.

## Contacts

- **Noravit Chumchim** — reviewed the lab's Fiber-seq FemtoPulse traces and recommended CTAB
  over column extraction; also advised on when a library can skip shearing. See
  [[fiber-seq-hmw-extraction]].
- **Oanh** — LightBench size selection input requirements.
  `[VERIFY: full name and current role]`
- **Mohan** — named in [[hmw-extraction-challenging-plants]]. `[VERIFY: full name and role]`

## See also

- [[room-genome-center]] — the building
- [[pacbio-hifi-sequencing]] — the lab's submission record
- [[hmw-size-selection]]
- [[ot2-hmw-shearing]]
- [[1-fiber-seq-master-protocol]]
