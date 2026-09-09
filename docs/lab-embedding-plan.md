# Direct lab integration

The acceptance contract is the user's pasted goal. No Be Art project mutations.

Baseline inventory: `lab-control-inventory.json`, recorded before implementation.
It includes all original controls/actions and their choices, including generated
Triangle controls. Native dynamic Canvas palette inputs also need runtime parity.

Implementation uses the actual lab documents in same-origin iframes. Each lab
moves its existing art and controls into separate regions of that SAME document
when embedded. The iframe occupies just the banner in review mode; in edit mode
it expands to a workspace containing the banner preview and the native panel.
No controls are recreated or moved between documents. Standalone entrypoints
continue to run the same source. A small shared bridge handles host layout,
state/validation, transport, pause/visibility and cleanup.

The Canvas/Circle text implementation must be extracted into shared source used
by the original Canvas page and other embedded labs, including all existing logo
and text effects. Controls/markup should remain canonical, not hand-selected
copies. Native settings and complete shared text state are saved together.

Sequence: ellipse + control/output parity; remaining native labs; shared text;
remove superseded showcase modules; complete parity/lifecycle/JSON/browser tests;
update Pages dependency packaging; commit, deploy, verify.
