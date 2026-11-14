-- Participant group chats: when each person last read each chat, for unread badges.
create table if not exists app.chat_reads (
  user_id uuid not null references app.users(id) on delete cascade,
  group_chat uuid not null references app.group_chats(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, group_chat)
);
alter table app.chat_reads enable row level security;
create index if not exists messages_comms_book_created on app.messages (comms_book, created_at);
create index if not exists group_chats_participant on app.group_chats (participant);
