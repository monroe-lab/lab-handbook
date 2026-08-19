---
type: reagent
title: "S-Adenosylmethionine (SAM)"
status: needs_more
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
>   rather than relying on the initial charge. See [[fiber-seq-hia5-labeling]].

> 💡 **Lab use**
>
> Used in both [[fiber-seq-hia5-labeling]] (in-nuclei labeling) and [[hia5-dpni-activity-assay]]
> (in-vitro activity check). SAM concentration is one of the deliberately titrated variables in
> the assay — see the Critical note on that page before changing it.

## See also

- [[fiber-seq-hia5-labeling]]
- [[hia5-dpni-activity-assay]]
- [[epicypher-cutana-hia5]]
- [[fiber-seq-master-protocol]]
