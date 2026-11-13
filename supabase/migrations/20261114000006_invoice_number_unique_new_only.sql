-- Bubble history contains repeated invoice numbers. Enforce uniqueness only
-- for invoices created in the new app (no bubble_id).
drop index app.invoices_invoice_number_key;
create unique index invoices_invoice_number_key
  on app.invoices (invoice_number) where invoice_number is not null and bubble_id is null;
