---
type: reagent
title: "S-Adenosylmethionine (SAM)"
status: in_stock
vendor: New England Biolabs
catalog_number: B9003S
---

# S-Adenosylmethionine (SAM)

The **methyl donor** for every methyltransferase reaction in the Fiber-seq workflow. Hia5
transfers a methyl group from SAM onto the N6 position of accessible adenines; without SAM
there is no methylation, and with degraded SAM there is under-methylation that looks exactly
like a failed enzyme.

Supplied by NEB as **B9003S at 32 mM**.

> ⚠️ **SAM is labile — this is the most common silent failure in the workflow**
>
> SAM degrades in solution and with freeze-thaw. A tube that has been cycled repeatedly can
> still be at nominal concentration on the label and functionally dead in the reaction.
>
> - **Always use fresh, high-grade SAM.** Aliquot on receipt.
> - A methylation reaction that fails with no other explanation should be re-run with a new SAM
>   aliquot before the enzyme is blamed.
> - Supplement long incubations — the lab's labeling protocol re-spikes SAM partway through
>   rather than relying on the initial charge. See [[3-hia5-m6a-labeling-reaction-for-fiber-seq]].

> 💡 **Lab use**
>
> Used in both [[3-hia5-m6a-labeling-reaction-for-fiber-seq]] (in-nuclei labeling) and
> [[1-1-sometimes-hia5-enzyme-activity-test-in-vitro]] (in-vitro activity check). The two protocols deliberately use
> different SAM concentrations — 800 uM vs 160 uM — see the Critical note on either page
> before changing one to match the other.

## See also

- [[3-hia5-m6a-labeling-reaction-for-fiber-seq]]
- [[1-1-sometimes-hia5-enzyme-activity-test-in-vitro]]
- [[dpni-methylation-check]]
- [[epicypher-cutana-hia5]]
- [[fiber-seq-master-protocol]]
