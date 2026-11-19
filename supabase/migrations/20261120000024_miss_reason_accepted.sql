-- "accepted" on the Availability dropdown: a call that went well, kept alongside the misses for the reliability score.
insert into app.option_values (set_key, value, display, sort) values ('miss_reason', 'accepted', 'accepted', 0)
on conflict (set_key, value) do nothing;
