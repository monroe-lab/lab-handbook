---
type: guide
title: "Monroe Lab Accession Tracker: How to Use It"
---

# Monroe Lab Accession Tracker: How to Use It

!!! tip "Quick Links"
    - **[Accessions Web App](https://monroe-lab.github.io/lab-handbook/app/accessions.html)** (searchable, filterable, editable — one row per accession)
    - **[Master Google Sheet](https://docs.google.com/spreadsheets/d/1XsnoTtnIW0kkQ7n9-2Z5YB0wjm4lMzpF5xIdsmcB-iI)** (original spreadsheet, read-only; kept for provenance)

---

## 1. What Is an Accession?

An **accession** is the concept of a biological sample the lab wants to study — a specific tree, a genotype, a mutation accumulation line, an elite crop line. It is not a physical object; it's the *idea* of that organism.

Under an accession, we track **instances** — the actual physical records:

| Instance type | What it is |
|---|---|
| 🌿 **Sample** | A tissue collection: a leaf punch, a root sample, a seed packet, flash-frozen shoot. |
| 🧪 **Extraction** | A DNA or RNA prep performed on one of the samples. |
| 📖 **Library** | A prepped sequencing library ready to pool or submit. |
| 🔀 **Pool** | A multiplexed mix of libraries going to one flow cell. |

This mirrors the inventory model: reagents have a concept (Ethanol Absolute) and bottles (physical jars). Accessions have a concept (Pistachio Tree #4) and samples/extractions/libraries/pools.

**One accession, many instances.** A single tree in the field becomes one accession, which might have three leaf samples (one primary + two backups), two DNA extractions (a first attempt + a re-do), one library, and appears in two pools. All of those instances link back to the same accession card via an `of:` field, so you can click any one of them and walk back to the tree.

**The tracker table shows the accession, not the instances.** The web app's main table lists accessions one-per-row, with pipeline status rolled up. Open an accession to see all its physical instances in the Contents column of the popup.

---

## 2. Column-by-Column Guide

| Column | What It Means | Example |
|--------|--------------|---------|
| **Accession ID** | Unique identifier. Use the naming convention for your project. | `R2_B4_C1`, `PIST-4`, `MA_founder_1` |
| **Project** | Which research project this accession belongs to. | `PBTS`, `[[pistachio-pangenome]]`, `MA Lines` |
| **Species** | Full species name (genus + species). | `Pistacia vera`, `Arabidopsis thaliana` |
| **Lead** | Who is responsible for this accession through the pipeline. | `Vianney Ahn / Matt Davis` |
| **Sequencing Type** | What kind of sequencing the accession needs. | `HiFi`, `Illumina WGS`, `RNA-seq` |
| **Status** | Current pipeline stage (see Status Options below). | `Shearing`, `DNA extracted`, `Complete` |
| **Priority** | Optional scheduling flag (see Priority Flags below). | `⭐`, `🌾`, `💎` |
| **Current Blocker** | If the accession is stuck, why? Leave blank if progressing normally. | `At Genome Center for QC and shearing` |
| **Last Updated** | Date of the most recent status change or note update. | `2026-03-24` |
| **Body / description** | Free-text markdown for phenotype, collection notes, yield figures, anything relevant — lives as the body of the accession's card, not a frontmatter column. | `Total DNA: 7.7 µg. Bushy phenotype.` |
| **Detail Sheet Link** | Link to a project-specific detail spreadsheet with full per-instance data. | Google Sheets URL |

---

## 3. Status Options

Statuses follow the sequencing pipeline in order. Color coding matches the web app and the legacy Google Sheet.

### Green (progressing or complete)

| Status | Meaning |
|--------|---------|
| **Complete** | Sequencing done, data in hand. Nothing left to do. |
| **Data received** | Raw data files received from sequencing facility. |
| **Submitted** | Accession submitted to sequencing facility. |
| **Ready to submit** | Library prep done; ready to go to the facility. |
| **Sequencing in progress** | At the facility, actively being sequenced. |

### Yellow (active lab work)

| Status | Meaning |
|--------|---------|
| **Library prep** | Library preparation underway. |
| **Shearing** | DNA is being sheared for library prep. |
| **QC passed** | Quality control passed, ready for next step. |
| **Needs QC** | DNA extracted but needs quality/quantity check. |

### Purple (early stages)

| Status | Meaning |
|--------|---------|
| **DNA extracted** | DNA has been extracted from tissue. |
| **Tissue collected** | Plant tissue has been collected but DNA not yet extracted. |
| **Tissue available** | Tissue source is identified and available for collection. |

### Red

| Status | Meaning |
|--------|---------|
| **On hold** | Paused for any reason. Check the Blocker column for why. |

### Grey

| Status | Meaning |
|--------|---------|
| **Not yet received** | Planned but tissue has not arrived or been collected yet. |

---

## 4. Priority Flags

Priority flags help with scheduling when multiple accessions compete for bench time or sequencing slots.

| Flag | Meaning | When to Use |
|------|---------|-------------|
| ⭐ **Priority** | High priority, process first. | Deadline-driven accessions, time-sensitive experiments, anything Grey flags. |
| 🌾 **Lots** | Large batch of similar accessions. | [[mutation-accumulation]] lines, population samples, anything where you are processing many at once. |
| 💎 **Rare** | Irreplaceable or hard-to-get material. | Unique genotypes, one-of-a-kind tissue, accessions that cannot be re-collected. Handle with extra care. |

Most accessions will have no priority flag. That is fine. Only flag accessions that genuinely need special attention.

---

## 5. How to Add a New Accession

1. Open the [Accessions web app](https://monroe-lab.github.io/lab-handbook/app/accessions.html) and sign in with GitHub (one-time setup).
2. Click **Add Accession** in the stats row.
3. Fill in at minimum: **Accession ID**, **Project**, and **Sequencing Type**.
4. Set the **Status** to the current pipeline stage (usually `Not yet received` or `Tissue available` for new accessions).
5. Add a **Lead** (who is responsible) and **Species**.
6. Click **Create**. The accession card opens immediately in edit mode — fill in the markdown body with whatever's worth remembering (source, phenotype, expected yield, etc).

---

## 6. How to Register a Physical Instance

Once an accession exists, attach physical records as instances:

1. Open the accession (click its row in the table).
2. In the **Contents** column on the right of the popup, click **Add instance**.
3. Pick the kind:
   - 🌿 **Sample** — for a tissue collection
   - 🧪 **Extraction** — for a DNA/RNA prep
   - 📖 **Library** — for a prepped sequencing library
   - 🔀 **Pool** — for a multiplexed pool
4. The new instance opens in edit mode with `of: [[accessions/<slug>]]` already filled in. Set the parent location (a freezer box, shelf, etc.), lot/date, and any type-specific fields (concentration, insert size, etc.).

Instances can also be created directly from the **Inventory** page (for bottles) or the **Lab Map** (for tubes placed in freezer boxes). Whichever path you use, the `of:` link is what ties the instance to its accession.

---

## 7. How to Update Status

1. Find the accession using the search bar or filters.
2. Click the **status pill** in its row — it's a dropdown. Pick the new status.
3. The change commits immediately. `last_updated` is stamped automatically.
4. For bigger changes (blocker resolved, notes to add), click the row to open the full editor.

**When to update:** Update the tracker whenever an accession moves to a new pipeline stage. Do not wait until the end. The tracker is only useful if it reflects reality.

---

## 8. How Detail Sheet Links Work

Many projects maintain a separate Google Sheet with detailed per-sample extraction data, QC measurements, gel images, and sample-level notes that don't fit cleanly in the accession card.

The **Detail Sheet Link** field links each accession to its project's detail sheet. In the web app, clicking it opens the sheet in a new tab.

If your project doesn't have a detail sheet, leave it blank. If you're starting a new project with multiple accessions, consider creating one and linking it.

---

## 9. FAQ / Common Scenarios

**Q: We used to call these "samples" — what changed?**
The word *sample* is now specifically a tissue collection (a leaf punch, a seed packet). The higher-level concept is an *accession*. One pistachio tree = one accession; the leaf you collected from it = one sample instance. The old tracker URL (`/sample-tracker/`) still works — it redirects to the new Accessions page.

**Q: I extracted DNA but haven't done QC yet. What status?**
Set the accession to `DNA extracted`. Move to `Needs QC` or `QC passed` once QC is done. Optionally register the extraction as an `extraction` instance with the yield + method fields.

**Q: An extraction failed QC. What do I do?**
Set the accession status to `On hold`, note the failure in **Current Blocker** (e.g., "Failed QC: low molecular weight, needs re-extraction"), and add details in the body. Keep the failed extraction as an instance — mark it clearly in its own card so future you knows what didn't work.

**Q: I'm processing 30 accessions from the same project. Do I enter all 30?**
Yes. Every accession that will be individually sequenced gets its own card. Use the `🌾 Lots` priority flag for the batch.

**Q: An accession is waiting on someone else (e.g., a collaborator sending tissue).**
Status `Not yet received`, with the blocker explaining who/what you're waiting for.

**Q: The sequencing facility has our sample but we haven't gotten data back yet.**
`Sequencing in progress`. Update to `Data received` when the files arrive.

**Q: Who should be listed as Lead?**
The person (or people) actively responsible for moving the accession through the pipeline. Usually the grad student or postdoc doing the bench work. Use `/` to list multiple people (e.g., `Vianney Ahn / Matt Davis`).

**Q: Can I bulk-edit accessions?**
The web app handles one accession at a time. For bulk edits, edit the markdown files in `docs/accessions/` directly on GitHub and commit — the tracker picks up changes on the next page load.
