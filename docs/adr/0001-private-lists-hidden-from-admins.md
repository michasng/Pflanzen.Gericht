# Private Lists are hidden even from Admins

Admins can see and edit every other contribution. Private Lists are the exception: only their Owner can read them, enforced by RLS without an Admin bypass. A List is a personal choice rather than a contribution to the catalog, and Users must be able to trust that "private" really means private. We give up the ability to moderate Private Lists in exchange for that trust.

## Consequences

A Merge runs in the client as the Admin, so the client can't read the List entries of the Duplicates. Moving List entries to the merged Product therefore happens in a security-definer database function. It moves entries without ever returning them to the Admin. If both Duplicates are on the same List, the merged Product appears once and keeps the earlier added date.
