-- ============================================================
-- Curriculum catalog
-- Stable source of truth for picker labels and sort order.
-- Question availability still comes from static_question_sets.active.
-- ============================================================

create table if not exists public.curriculum_subjects (
  education_type text not null,
  subject text not null,
  display_label text not null,
  sort_order integer not null check (sort_order >= 1),
  show_in_picker boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (education_type, subject)
);

create table if not exists public.curriculum_topics (
  education_type text not null,
  subject text not null,
  topic text not null,
  topic_key text not null,
  display_label text not null,
  sort_order integer not null check (sort_order >= 1),
  show_in_picker boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (education_type, subject, topic),
  foreign key (education_type, subject)
    references public.curriculum_subjects (education_type, subject)
    on delete cascade
);

create index if not exists curriculum_subjects_picker_idx
  on public.curriculum_subjects (education_type, sort_order, display_label);

create index if not exists curriculum_topics_picker_idx
  on public.curriculum_topics (education_type, subject, sort_order, display_label);

create index if not exists curriculum_topics_topic_key_idx
  on public.curriculum_topics (education_type, subject, topic_key, sort_order);

alter table public.curriculum_subjects enable row level security;
alter table public.curriculum_topics enable row level security;

drop policy if exists "Curriculum subjects are viewable by everyone" on public.curriculum_subjects;
create policy "Curriculum subjects are viewable by everyone" on public.curriculum_subjects
  for select using (true);

drop policy if exists "Curriculum topics are viewable by everyone" on public.curriculum_topics;
create policy "Curriculum topics are viewable by everyone" on public.curriculum_topics
  for select using (true);

insert into public.curriculum_subjects (
  education_type,
  subject,
  display_label,
  sort_order,
  show_in_picker
)
values
  ('O Level', 'Mathematics B/D', 'Mathematics B/D', 1, true),
  ('O Level', 'Pure Mathematics', 'Pure Mathematics', 2, true),
  ('O Level', 'Physics', 'Physics', 3, true),
  ('O Level', 'Chemistry', 'Chemistry', 4, true),
  ('O Level', 'Biology', 'Biology', 5, true)
on conflict (education_type, subject) do update
set
  display_label = excluded.display_label,
  sort_order = excluded.sort_order,
  show_in_picker = excluded.show_in_picker,
  updated_at = now();

insert into public.curriculum_topics (
  education_type,
  subject,
  topic,
  topic_key,
  display_label,
  sort_order,
  show_in_picker
)
values
  ('O Level', 'Pure Mathematics', 'Logarithmic functions and indices', 'logarithmic_functions_and_indices', 'Logarithmic functions and indices', 1, true),
  ('O Level', 'Pure Mathematics', 'The quadratic function', 'the_quadratic_function', 'The quadratic function', 2, true),
  ('O Level', 'Pure Mathematics', 'Identities and inequalities', 'identities_and_inequalities', 'Identities and inequalities', 3, true),
  ('O Level', 'Pure Mathematics', 'Graphs', 'graphs', 'Graphs', 4, true),
  ('O Level', 'Pure Mathematics', 'Series', 'series', 'Series', 5, true),
  ('O Level', 'Pure Mathematics', 'The binomial series', 'the_binomial_series', 'The binomial series', 6, true),
  ('O Level', 'Pure Mathematics', 'Scalar and vector quantities', 'scalar_and_vector_quantities', 'Scalar and vector quantities', 7, true),
  ('O Level', 'Pure Mathematics', 'Rectangular Cartesian coordinates', 'rectangular_cartesian_coordinates', 'Rectangular Cartesian coordinates', 8, true),
  ('O Level', 'Pure Mathematics', 'Calculus', 'calculus', 'Calculus', 9, true),
  ('O Level', 'Pure Mathematics', 'Trigonometry', 'trigonometry', 'Trigonometry', 10, true),
  ('O Level', 'Mathematics B/D', 'Number', 'number', 'Number', 1, true),
  ('O Level', 'Mathematics B/D', 'Number Skills', 'number', 'Number', 1, true),
  ('O Level', 'Mathematics B/D', 'Sets', 'sets', 'Sets', 2, true),
  ('O Level', 'Mathematics B/D', 'Algebra', 'algebra', 'Algebra', 3, true),
  ('O Level', 'Mathematics B/D', 'Functions', 'functions', 'Functions', 4, true),
  ('O Level', 'Mathematics B/D', 'Matrices', 'matrices', 'Matrices', 5, true),
  ('O Level', 'Mathematics B/D', 'Geometry', 'geometry', 'Geometry', 6, true),
  ('O Level', 'Mathematics B/D', 'Mensuration', 'mensuration', 'Mensuration', 7, true),
  ('O Level', 'Mathematics B/D', 'Vectors and transformation geometry', 'vectors_and_transformation_geometry', 'Vectors and transformation geometry', 8, true),
  ('O Level', 'Mathematics B/D', 'Trigonometry', 'trigonometry', 'Trigonometry', 9, true),
  ('O Level', 'Mathematics B/D', 'Statistics and probability', 'statistics_and_probability', 'Statistics and probability', 10, true),
  ('O Level', 'Physics', 'Forces and motion', 'forces_and_motion', 'Forces and motion', 1, true),
  ('O Level', 'Physics', 'Electricity', 'electricity', 'Electricity', 2, true),
  ('O Level', 'Physics', 'Waves', 'waves', 'Waves', 3, true),
  ('O Level', 'Physics', 'Energy resources and energy transfers', 'energy_resources_and_energy_transfers', 'Energy resources and energy transfers', 4, true),
  ('O Level', 'Physics', 'Solids, liquids and gases', 'solids_liquids_and_gases', 'Solids, liquids and gases', 5, true),
  ('O Level', 'Physics', 'Solids, liquids, gases', 'solids_liquids_and_gases', 'Solids, liquids and gases', 5, true),
  ('O Level', 'Physics', 'Magnetism and electromagnetism', 'magnetism_and_electromagnetism', 'Magnetism and electromagnetism', 6, true),
  ('O Level', 'Physics', 'Magnetism', 'magnetism_and_electromagnetism', 'Magnetism and electromagnetism', 6, true),
  ('O Level', 'Physics', 'Radioactivity and particles', 'radioactivity_and_particles', 'Radioactivity and particles', 7, true),
  ('O Level', 'Physics', 'Astrophysics', 'astrophysics', 'Astrophysics', 8, true),
  ('O Level', 'Chemistry', 'Principles of chemistry', 'principles_of_chemistry', 'Principles of chemistry', 1, true),
  ('O Level', 'Chemistry', 'Inorganic chemistry', 'inorganic_chemistry', 'Inorganic chemistry', 2, true),
  ('O Level', 'Chemistry', 'Physical chemistry', 'physical_chemistry', 'Physical chemistry', 3, true),
  ('O Level', 'Chemistry', 'Organic chemistry', 'organic_chemistry', 'Organic chemistry', 4, true)
on conflict (education_type, subject, topic) do update
set
  topic_key = excluded.topic_key,
  display_label = excluded.display_label,
  sort_order = excluded.sort_order,
  show_in_picker = excluded.show_in_picker,
  updated_at = now();
