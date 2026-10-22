# Pflanzen.Gericht

A community catalog where users review and compare vegan products found in stores.

## Language

### Catalog

**Product**:
A specific vegan item sold in stores, as entered by a user. The same item in a different pack size is a different Product.
_Avoid_: Item, article, SKU

**Vegan**:
Free of animal-derived ingredients and made without animal exploitation at any stage of production (e.g. no animal testing, no animal-derived processing aids). Every Product in the catalog must be vegan.
_Avoid_: Plant-based (as a synonym)

**Base**:
The main ingredient of a Product: what you answer when asked what it is made of. Not necessarily a protein source.
_Avoid_: Protein source, main ingredient (as a separate term)

**Ingredient**:
A component of a Product as listed on its packaging, optionally with its share of the Product. Allergy and trace notices ("may contain …") are not Ingredients.
_Avoid_: Component, content

**Organic Ingredient**:
An Ingredient the packaging declares as organically farmed, either individually via a footnote marker or collectively for all Ingredients.
_Avoid_: Bio ingredient, eco ingredient

**Duplicate**:
A Product that describes the same physical item as another Product, because it was entered twice. Not a matter of opinion.
_Avoid_: Similar product, double

**Merge**:
An admin combining Duplicates into a single Product.
_Avoid_: Combine, dedupe

### People

**User**:
A registered person who contributes Products, Reviews, Price Reports, and Similarity Votes.
_Avoid_: Member, account, profile (as the person)

**Owner**:
The User who entered a Product and may therefore edit it.
_Avoid_: Creator, author

**Admin**:
A User with authority to edit any contribution and to Merge Duplicates.
_Avoid_: Moderator

### Prices

**Price Report**:
A User's observation of what a Product costs in a specific store and city.

**Regular Price**:
The price a store normally charges for a Product.
_Avoid_: Normal price, list price

**Sale Price**:
A temporarily reduced price observed alongside the Regular Price.
_Avoid_: Discount, offer price

**Effective Price**:
The price a shopper actually pays: the Sale Price if there is one, otherwise the Regular Price.
_Avoid_: Paid price, current price, final price

### Opinions

**Review**:
A user's rating of a Product at one point in time. Reviewing the same Product again creates a new Review rather than changing the old one.
_Avoid_: Rating (for the whole thing), revision

**Overall Score**:
The required one-to-five rating that sums up a Review.
_Avoid_: Rating, stars

**Aspect Score**:
An optional one-to-five rating of one aspect of a Product (taste, consistency, appearance, nutrition, or value).
_Avoid_: Score dimension, sub-rating

**Current Review**:
A user's latest Review of a Product; only Current Reviews count toward the Product's ratings.

**Superseded Review**:
A Review that has been replaced by a newer Review from the same user for the same Product.
_Avoid_: Old review, archived review

**Similarity**:
A user's opinion of how alike two things are. Expressed either as a Similarity Vote between two Products or as a similarity tag on a Review.

**Similarity Vote**:
A user's agreement or disagreement that two Products are similar to each other.
_Avoid_: Duplicate vote, match
