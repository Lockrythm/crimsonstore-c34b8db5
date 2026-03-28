

## Plan: Add Contact Field with Visibility Toggle to Sell Form

### What changes

1. **Database migration** — Add two nullable columns to the `products` table:
   - `contact_info TEXT` (optional contact name/number)
   - `contact_public BOOLEAN DEFAULT false` (true = visible to everyone, false = admin only)

2. **Sell form (`src/pages/Sell.tsx`)** — Add a new optional "Contact" input field between Description and Submit. When the user types something in it, a checkbox appears below: "Make contact visible to everyone" (unchecked = admin-only by default). If the input is empty, the checkbox stays hidden.

3. **Product creation (`src/hooks/useProducts.ts`)** — Pass `contact_info` and `contact_public` in the insert call (already handled generically since it uses `ProductInsert` type).

4. **Product detail (`src/pages/ProductDetail.tsx`)** — Display the contact info on the product detail page:
   - If `contact_public` is true, show it to everyone
   - If false, only show it to admin users (check via `has_role`)

5. **Admin section** — Contact info should always be visible to admins when reviewing products.

### Technical details

- Migration adds two columns with safe defaults (NULL and false), no breaking changes
- The checkbox auto-hides via conditional rendering: `{formData.contact && <Checkbox .../>}`
- On ProductDetail, fetch user role to determine visibility of private contact info
- The types will auto-update after migration

