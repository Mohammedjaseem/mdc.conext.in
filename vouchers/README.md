# Staff voucher portal

Static page at `/vouchers/`, linked from the home page. No build step is required.
Uses the Connect API at `https://conext.in`, staff login at
`/custom_users/api/login/`, and token authentication. The token is kept in this
tab's session storage and cleared on sign-out or a 401 response.

The page supports new requests, paginated/searchable personal vouchers,
and editing when the API returns `can_edit: true`. It fetches the detail again
before opening an edit, prefills IDs, sends multipart PATCH requests to
`/voucher_redeem/voucher/api/edit_voucher_redeem/`, retains existing bills,
and refreshes the list after saving. Validation errors keep entered values
and selected files intact. Approval/rejection rules are enforced by the backend.

Deploy the backend changes, including the `https://mdc.conext.in` CORS origin,
before publishing this frontend. The live edit endpoint returned HTTP 404
at the time of implementation. The frontend repository's publishing branch
is `gh-pages`.

Verified against a local API fixture in the browser: staff sign-in, pending
versus approved edit visibility, prefilled edit form, successful PATCH and
list refresh, validation failure preserving input, manager review between
list load and Edit click, new request submission, and sign-out. JavaScript
syntax and Git whitespace checks also pass. These checks do not verify a
live authenticated production voucher update.
