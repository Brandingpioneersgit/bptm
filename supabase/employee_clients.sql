create table if not exists employee_clients (
  employee_id uuid references employees(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  scope text,
  frequency text,
  inserted_at timestamptz default now(),
  primary key (employee_id, client_id, scope)
);
