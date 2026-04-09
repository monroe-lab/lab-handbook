---
type: guide
title: "Hazardous Waste Guide"
---

# Hazardous Waste in the Monroe Lab

This page tracks our active hazardous waste containers and explains what every lab member needs to know about handling, labeling, and disposing of waste safely.

The official UC Davis system is **WASTe** (Waste Accumulation Storage Tracking electronically) at [ehs.ucop.edu/waste](https://ehs.ucop.edu/waste/). Not everyone in the lab has an account there, so this page mirrors the essentials and is the place to look first.

**Reference:** [WASTe Factsheet (PDF)](../_supplemental/WASTe_Factsheet.pdf)

## Active Waste Containers

- [[paraquat-wash-waste]] — paraquat wash waste, Robbins 0170
- [[paraquat-solid-waste]] — paraquat solid waste, Robbins 0170
- [[nib-buffer-bme-waste]] — NIB buffer + BME, Robbins 0170 (bay 170U fume hood)

When a container is full or no longer needed, mark its `status` as `ready_for_pickup` and tell Grey or the lab manager so it can be tagged in WASTe and picked up by EH&S.

## Lab Policies — What You Need To Do

**1. Never pour hazardous waste down the drain.** When in doubt, ask. This includes anything with organic solvents (chloroform, phenol, isoamyl alcohol, BME), heavy metals, ethidium bromide, paraquat or other reproductive toxins, and most kit reagents.

**2. Use the right container.** Each waste stream has a dedicated container listed above. If you are starting a new kind of waste that does not fit any existing container, talk to Grey or the lab manager before you start — we will create a new container entry on this page and a tag in WASTe.

**3. Label as you go.** Every container must have a label that lists every chemical inside it and the approximate amount or percentage. "Misc waste" is not acceptable. If you add something new to a container, update the label and update the markdown file on this page.

**4. Keep containers closed.** Funnels with caps are fine while you are actively pouring. Otherwise the cap goes back on. Open containers in a fume hood are still not "closed."

**5. Mind the accumulation date.** UC Davis allows hazardous waste to accumulate in the lab for **9 months** from the start date. After that we are out of compliance and EH&S can fine us. Each container's markdown file has a `started` date — when it gets close to 9 months, request pickup.

**6. Storage location matters.** Waste lives where it is generated, in a labeled secondary containment tray. Robbins 0170 is the main accumulation area. Do not move waste between rooms without checking first.

**7. Solids vs liquids.** Pipette tips, gloves, and tubes contaminated with hazardous chemicals go in the appropriate **solid** waste container, not regular trash and not the liquid waste. Each solid container is listed above the same way.

**8. Request a pickup through WASTe.** When a container is ready, the lab manager (or Grey) submits a pickup request in WASTe. EH&S typically picks up within a week. Do not move containers to the loading dock yourself.

## When You Are Unsure

Ask. The cost of asking is zero. The cost of mislabeling, mixing incompatible waste, or pouring something down the drain can be a fine, an injury, or a lab shutdown. Grey, the lab manager, or any senior lab member would rather answer a question than fix a mistake.

For chemical-specific guidance, check the SDS (search "[chemical name] SDS" on Sigma or Fisher) or ask before you start the experiment, not after you have a beaker of mystery liquid.

## Adding a New Waste Container

1. Duplicate one of the existing container files in `docs/waste/`
2. Update the frontmatter (title, contents, location, started date)
3. Add a wikilink to it in the **Active Waste Containers** list above
4. Create a matching tag in WASTe (or ask the lab manager to)

## Related

- [[lab-safety]]
- [WASTe Factsheet (PDF)](../_supplemental/WASTe_Factsheet.pdf)
- [UC Davis WASTe System](https://ehs.ucop.edu/waste/)
