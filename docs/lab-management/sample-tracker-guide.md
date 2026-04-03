---
type: protocol
title: "Monroe Lab Sample Tracker: How to Use It"
---

# Monroe Lab Sample Tracker: How to Use It

!!! tip "Quick Links"
    - **[Sample Tracker Web App](https://monroe-lab.github.io/lab-handbook/sample-tracker/)** (searchable, filterable, editable)
    - **[Master Google Sheet](https://docs.google.com/spreadsheets/d/1XsnoTtnIW0kkQ7n9-2Z5YB0wjm4lMzpF5xIdsmcB-iI)** (original spreadsheet)

---

## 1. Purpose and Philosophy

The Sample Tracker is a single dashboard for every sequencing sample in the Monroe Lab. Instead of hunting through Slack threads, email chains, or scattered spreadsheets, everyone can check one place to see where a sample stands in the pipeline.

**One sheet, one truth.** Every sample the lab plans to sequence, is actively sequencing, or has completed sequencing lives here. If it is not in the tracker, it does not exist as far as the sequencing pipeline is concerned.

**Pipeline visibility.** The tracker is organized around the sequencing pipeline stages, from tissue collection through data delivery. At a glance, you can see bottlenecks, blockers, and what needs attention next.

---

## 2. Column-by-Column Guide

| Column | What It Means | Example |
|--------|--------------|---------|
| **Sample ID** | Unique identifier for the sample. Use the naming convention for your project. | `R2_B4_C1`, `MA_founder_1` |
| **Project** | Which research project this sample belongs to. | `PBTS`, `[[pistachio-pangenome]]`, `MA Lines` |
| **Species** | Full species name (genus + species). | `Pistacia vera`, `Arabidopsis thaliana` |
| **Lead** | Who is responsible for this sample through the pipeline. | `Vianney Ahn / Matt Davis` |
| **Sequencing Type** | What kind of sequencing this sample needs. | `HiFi`, `Illumina WGS`, `RNA-seq` |
| **Status** | Current pipeline stage (see Status Options below). | `Shearing`, `DNA extracted`, `Complete` |
| **Priority** | Optional flag for scheduling and attention (see Priority Flags below). | `⭐`, `🌾`, `💎` |
| **Current Blocker** | If the sample is stuck, why? Leave blank if progressing normally. | `At Genome Center for QC and shearing` |
| **Last Updated** | Date of the most recent status change or note update. | `2026-03-24` |
| **Notes** | Free-text details: yields, QC results, phenotype info, anything relevant. | `Total DNA: 7.7 ug. Bushy phenotype.` |
| **Detail Sheet Link** | Link to a project-specific detail spreadsheet with full extraction/QC data. | Google Sheets URL |

---

## 3. Status Options

Statuses follow the sequencing pipeline in order. Color coding matches both the Google Sheet and the web app.

### Green (progressing or complete)

| Status | Meaning |
|--------|---------|
| **Complete** | Sequencing done, data in hand. Nothing left to do. |
| **Data received** | Raw data files received from sequencing facility. |
| **Submitted** | Sample submitted to sequencing facility. |
| **Ready to submit** | Library prep done, sample is ready to go to the facility. |
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
| **Not yet received** | Sample is planned but tissue has not arrived or been collected yet. |

---

## 4. Priority Flags

Priority flags help with scheduling when multiple samples compete for bench time or sequencing slots.

| Flag | Meaning | When to Use |
|------|---------|-------------|
| ⭐ **Priority** | High priority, process first. | Deadline-driven samples, time-sensitive experiments, samples Grey flags. |
| 🌾 **Lots** | Large batch of similar samples. | [[mutation-accumulation]] lines, population samples, anything where you are processing many at once. |
| 💎 **Rare** | Irreplaceable or hard-to-get material. | Unique genotypes, one-of-a-kind tissue, samples that cannot be re-collected. Handle with extra care. |

Most samples will have no priority flag. That is fine. Only flag samples that genuinely need special attention.

---

## 5. How to Add a New Sample

1. Open the [Sample Tracker web app](https://monroe-lab.github.io/lab-handbook/sample-tracker/) and connect to GitHub (one-time setup).
2. Click **Add Sample** in the top right.
3. Fill in at minimum: **Sample ID**, **Project**, and **Sequencing Type**.
4. Set the **Status** to the current pipeline stage (usually `Not yet received` or `Tissue available` for new samples).
5. Add a **Lead** (who is responsible) and **Species**.
6. Add any relevant **Notes** (source, phenotype, expected yield, etc.).
7. If the project has a detail spreadsheet, paste the link in **Detail Sheet Link**.
8. Click **Save Sample**. This commits the change directly to the lab handbook repository.

---

## 6. How to Update Status

1. Find your sample using the search bar or filters.
2. Click the **edit icon** (pencil) on the sample row.
3. Change the **Status** dropdown to the new pipeline stage.
4. Update **Current Blocker** if there is one (or clear it if the blocker is resolved).
5. Add any relevant info to **Notes** (QC results, yield measurements, etc.).
6. Click **Save Sample**.

**When to update:** Update the tracker whenever a sample moves to a new pipeline stage. Do not wait until the end. The tracker is only useful if it reflects reality.

---

## 7. How Detail Sheet Links Work

Many projects maintain a separate Google Sheet with detailed extraction data, QC measurements, gel images, and per-sample notes that do not fit in the tracker's Notes column.

The **Detail Sheet Link** column links each sample to its project's detail sheet. In the web app, this appears as a clickable external link icon. Click it to jump directly to the full data for that sample.

If your project does not have a detail sheet, leave it blank. If you are starting a new project with multiple samples, consider creating one and linking it.

---

## 8. FAQ / Common Scenarios

**Q: I extracted DNA but have not done QC yet. What status?**
Set to `DNA extracted`. Move to `Needs QC` or `QC passed` once QC is done.

**Q: A sample failed QC. What do I do?**
Set status to `On hold`, note the failure in **Current Blocker** (e.g., "Failed QC: low molecular weight, needs re-extraction"), and add details in **Notes**.

**Q: I am processing 30 samples from the same project. Do I enter all 30?**
Yes. Every sample that will be individually sequenced gets its own row. Use the `🌾 Lots` priority flag for the batch.

**Q: A sample is waiting on someone else (e.g., a collaborator sending tissue). What status?**
`Not yet received` with the blocker explaining who/what you are waiting for.

**Q: The sequencing facility has our sample but we have not gotten data back yet.**
`Sequencing in progress`. Update to `Data received` when the files arrive.

**Q: Who should be listed as Lead?**
The person (or people) actively responsible for moving the sample through the pipeline. Usually the grad student or postdoc doing the bench work. Use `/` to list multiple people (e.g., `Vianney Ahn / Matt Davis`).

**Q: Can I bulk-edit samples?**
The web app handles one sample at a time. For bulk edits, use the [Google Sheet](https://docs.google.com/spreadsheets/d/1XsnoTtnIW0kkQ7n9-2Z5YB0wjm4lMzpF5xIdsmcB-iI) directly, then re-export to update the web app data.
