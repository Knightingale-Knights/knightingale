-- Facility booking texts are logged with the shift too.
alter table app.text_log drop constraint if exists text_log_kind_check;
alter table app.text_log add constraint text_log_kind_check
  check (kind in ('checkin', 'checkout', 'notes_1', 'notes_2', 'notes_3', 'booking_ack', 'booking_alert'));
