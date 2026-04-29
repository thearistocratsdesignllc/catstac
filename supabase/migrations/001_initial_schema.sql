-- ============================================================
-- Catstac — Complete Schema
-- Run this once in the Supabase SQL editor on a fresh project.
-- As of: initial build + stock cats addition.
-- ============================================================
--
-- DATE COLUMN NAMING CONVENTION
-- voting_date  — the Pacific-time calendar day when cats are
--                available for voting (e.g. Monday).
--                Used on: submissions, catestants, votes.
-- cotd_date    — the Cat of the Day date displayed publicly
--                on the winners grid and in winner emails
--                (e.g. Tuesday, always voting_date + 1 day).
--                Used on: winners only.
--
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";


-- ============================================================
-- ENUMS
-- ============================================================

create type catestant_ai_status    as enum ('pending', 'passed', 'failed');
create type catestant_admin_status as enum ('pending_review', 'approved', 'rejected');
create type cat_sex                as enum ('tom', 'queen');
create type vote_type              as enum ('free', 'purchased');
create type credit_source          as enum ('purchase', 'spent');


-- ============================================================
-- STOCK CATS
-- ============================================================
-- Pre-loaded cat photos used to fill the grid during the cold
-- start period (target: no fewer than 100 cats in the stac).
-- The nightly cron pulls from this table and copies rows into
-- catestants with that day's voting_date, is_stock = true,
-- and admin_status = 'approved'.
-- Stock cats are voteable but cannot win.

create table public.stock_cats (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  cat_name            text not null,
  cat_sex             cat_sex not null,
  photo_url           text not null,
  photo_storage_path  text not null
);

comment on table public.stock_cats is
  'Pre-loaded stock cats used to fill the grid to 100 when real submissions are low. Source for the nightly cron backfill.';


-- ============================================================
-- SUBMISSIONS
-- ============================================================
-- One row per form submission from /submit.
-- Login is required to submit — user_id is never null.
-- A single submission can contain multiple cats (see catestants).
-- Human fields live here so they don't repeat per cat.

create table public.submissions (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  voting_date         date not null,
  submitter_email     text not null,
  submitter_instagram text,             -- optional, stored without @ prefix
  consent_given       boolean not null default false,
  user_id             uuid not null references auth.users(id) on delete restrict
);

comment on table public.submissions is
  'One row per /submit form submission. Login required. A submission can contain multiple catestants.';

comment on column public.submissions.voting_date is
  'The Pacific-time day the submitted cats will be available for voting. Set server-side.';

comment on column public.submissions.user_id is
  'Login is required to submit — never null.';


-- ============================================================
-- CATESTANTS
-- ============================================================
-- One row per cat competing on a given voting_date.
-- Real submissions come from the submit form.
-- Stock cats are copied in nightly by the cron job.
-- voting_date is denormalized for fast grid queries.

create table public.catestants (
  id                      uuid primary key default uuid_generate_v4(),
  created_at              timestamptz not null default now(),
  submission_id           uuid references public.submissions(id) on delete cascade,  -- null for stock cats
  voting_date             date not null,
  cat_name                text not null,
  cat_sex                 cat_sex not null,
  photo_url               text not null,
  photo_storage_path      text not null,
  is_stock                boolean not null default false,

  -- AI validation (OpenAI) — skipped for stock cats
  ai_status               catestant_ai_status not null default 'pending',
  ai_result               jsonb,
  ai_validated_at         timestamptz,

  -- Admin review — stock cats are pre-approved
  admin_status            catestant_admin_status not null default 'pending_review',
  admin_reviewed_at       timestamptz,
  admin_rejection_reason  text
);

comment on table public.catestants is
  'One row per cat competing on a given voting_date. Real submissions require AI validation + admin approval. Stock cats are inserted pre-approved.';

comment on column public.catestants.is_stock is
  'True for pre-loaded stock cats. Stock cats are voteable but cannot win. The winner query always filters is_stock = false.';

comment on column public.catestants.submission_id is
  'Null for stock cats — they do not belong to a submission.';

comment on column public.catestants.voting_date is
  'The day this cat is available for voting. Catestants from previous days do not appear in the grid.';


-- ============================================================
-- VOTES
-- ============================================================
-- One row per vote cast. Login is required — user_id is never null.
--
-- TWO RULES enforced by two separate indexes:
--
--   Rule 1 — One vote per user per catestant (free or purchased).
--            You cannot vote for the same cat twice regardless of
--            credit balance. Enforced by unique index on
--            (user_id, catestant_id).
--
--   Rule 2 — One free vote per user per voting day.
--            After your free vote is used on any cat, all further
--            votes that day must come from purchased credits.
--            Enforced by partial unique index on (user_id, voting_date)
--            where vote_type = 'free'.
--
-- Catestants belong to one voting_date and disappear after that
-- day, so Rule 1 is only ever relevant within a single day.

create table public.votes (
  id             uuid primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  catestant_id   uuid not null references public.catestants(id) on delete cascade,
  voting_date    date not null,         -- denormalized for fast nightly winner query
  user_id        uuid not null references auth.users(id) on delete cascade,
  vote_type      vote_type not null default 'free'
);

comment on table public.votes is
  'One row per vote. One vote per user per catestant. One free vote per user per voting day.';

-- Rule 1: one vote per user per catestant (free or purchased).
create unique index votes_one_per_user_per_cat
  on public.votes (user_id, catestant_id);

-- Rule 2: one free vote per user per voting day.
create unique index votes_one_free_per_user_per_day
  on public.votes (user_id, voting_date)
  where vote_type = 'free';


-- ============================================================
-- VOTE CREDITS
-- ============================================================
-- A ledger for purchased votes. Balance persists indefinitely —
-- unused credits carry forward day to day without expiry.
--
-- DEPOSIT  (+3 or +10) — when a package is purchased via Stripe.
-- WITHDRAWAL (-1)      — each time a purchased vote is cast.
--
-- Current balance = SUM(delta) for a given user_id.
-- Never update rows — only ever insert.

create table public.vote_credits (
  id                       uuid primary key default uuid_generate_v4(),
  created_at               timestamptz not null default now(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  delta                    integer not null,
  source                   credit_source not null,
  stripe_payment_intent_id text,           -- populated on 'purchase' rows
  catestant_id             uuid references public.catestants(id) on delete set null  -- populated on 'spent' rows
);

comment on table public.vote_credits is
  'Append-only ledger for purchased vote credits. Balance = SUM(delta) per user_id. Credits never expire.';

comment on column public.vote_credits.delta is
  '+3 or +10 for a purchase. -1 each time a purchased vote is spent.';


-- ============================================================
-- WINNERS
-- ============================================================
-- One row per winning cat per day. Ties produce multiple rows.
-- Only catestants where is_stock = false are eligible to win.

create table public.winners (
  id                    uuid primary key default uuid_generate_v4(),
  created_at            timestamptz not null default now(),
  cotd_date             date not null,
  catestant_id          uuid not null references public.catestants(id) on delete restrict,
  vote_count            integer not null,
  tie_sequence          integer not null default 1,

  -- AI-generated Dutch Master portrait
  portrait_url          text,            -- null until generated by nightly cron
  portrait_storage_path text,

  -- Instagram
  instagram_post_id     text,
  instagram_post_url    text,

  -- Winner notification email
  winner_email_sent_at  timestamptz      -- null = not yet sent
);

comment on table public.winners is
  'One row per winning cat per day. Ties allowed — multiple rows per cotd_date, ordered by tie_sequence. Stock cats are never winners.';

comment on column public.winners.cotd_date is
  'The Cat of the Day date shown publicly. Always voting_date + 1 day from the winning catestant. Set by the nightly cron job.';

comment on column public.winners.tie_sequence is
  '1-based ordering within a tie, sorted by catestant.created_at ascending (earlier submission = lower number).';


-- ============================================================
-- INDEXES
-- ============================================================

-- Home page: fetch today's approved catestants
create index catestants_by_voting_date
  on public.catestants (voting_date, admin_status);

-- Admin AI validation queue
create index catestants_ai_queue
  on public.catestants (ai_status)
  where ai_status = 'pending';

-- Admin review queue
create index catestants_admin_queue
  on public.catestants (admin_status)
  where admin_status = 'pending_review';

-- Nightly winner calculation: count votes per catestant
create index votes_by_catestant
  on public.votes (catestant_id, voting_date);

-- Winners page: most recent first
create index winners_by_cotd_date
  on public.winners (cotd_date desc, tie_sequence asc);

-- Credit balance lookup
create index vote_credits_by_user
  on public.vote_credits (user_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.stock_cats     enable row level security;
alter table public.submissions    enable row level security;
alter table public.catestants     enable row level security;
alter table public.votes          enable row level security;
alter table public.vote_credits   enable row level security;
alter table public.winners        enable row level security;

-- Stock cats: public read (nightly cron reads via service role)
create policy "Public can read stock cats"
  on public.stock_cats for select
  using (true);

-- Submissions: submitter can read their own
create policy "Submitters can read own submissions"
  on public.submissions for select
  using (auth.uid() = user_id);

-- Catestants: anyone can read approved ones
create policy "Public can read approved catestants"
  on public.catestants for select
  using (admin_status = 'approved');

-- Votes: public read (needed for nightly winner calculation)
create policy "Public can read votes"
  on public.votes for select
  using (true);

-- Vote credits: users can read their own balance rows
create policy "Users can read own credits"
  on public.vote_credits for select
  using (auth.uid() = user_id);

-- Winners: public read
create policy "Public can read winners"
  on public.winners for select
  using (true);