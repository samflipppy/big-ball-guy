-- ============================================================
-- 001_initial_schema.sql
-- Complete initial schema for the football playbook builder app
-- ============================================================

-- =========================
-- Helper function: updated_at trigger
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Helper function: is_team_member
-- Returns true if the current authenticated user is a member of the given team
-- =========================
CREATE OR REPLACE FUNCTION is_team_member(check_team_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM team_members
    WHERE team_members.team_id = check_team_id
      AND team_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================================
-- TABLES
-- =====================================================================

-- ----- teams -----
CREATE TABLE teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  school        text,
  level         text NOT NULL CHECK (level IN ('high_school', 'college', 'pro', 'youth')),
  primary_color text NOT NULL DEFAULT '#2563eb',
  secondary_color text NOT NULL DEFAULT '#ffffff',
  logo_url      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- profiles -----
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  display_name  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ----- team_members -----
CREATE TABLE team_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      text NOT NULL CHECK (role IN ('head_coach', 'coordinator', 'position_coach', 'player', 'viewer')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- ----- folders -----
CREATE TABLE folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name       text NOT NULL,
  parent_id  uuid REFERENCES folders(id) ON DELETE SET NULL,
  "order"    int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----- formations -----
CREATE TABLE formations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name       text NOT NULL,
  side       text NOT NULL CHECK (side IN ('offense', 'defense')),
  personnel  text NOT NULL DEFAULT '11',
  players    jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags       text[] NOT NULL DEFAULT '{}',
  is_custom  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER formations_updated_at
  BEFORE UPDATE ON formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- concepts -----
CREATE TABLE concepts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  routes      jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER concepts_updated_at
  BEFORE UPDATE ON concepts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- blocking_schemes -----
CREATE TABLE blocking_schemes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL CHECK (type IN ('run', 'pass')),
  rules      jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags       text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER blocking_schemes_updated_at
  BEFORE UPDATE ON blocking_schemes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- plays -----
CREATE TABLE plays (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id             uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name                text NOT NULL,
  formation_id        uuid NOT NULL REFERENCES formations(id) ON DELETE RESTRICT,
  concept_id          uuid REFERENCES concepts(id) ON DELETE SET NULL,
  blocking_scheme_id  uuid REFERENCES blocking_schemes(id) ON DELETE SET NULL,
  assignments         jsonb NOT NULL DEFAULT '[]'::jsonb,
  defensive_overlay   jsonb,
  tags                text[] NOT NULL DEFAULT '{}',
  notes               text,
  category            text,
  personnel           text NOT NULL DEFAULT '11',
  hash                text CHECK (hash IS NULL OR hash IN ('left', 'middle', 'right')),
  folder_id           uuid REFERENCES folders(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER plays_updated_at
  BEFORE UPDATE ON plays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- game_plans -----
CREATE TABLE game_plans (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name       text NOT NULL,
  opponent   text NOT NULL,
  week       int NOT NULL,
  season     text NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER game_plans_updated_at
  BEFORE UPDATE ON game_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- game_plan_sections -----
CREATE TABLE game_plan_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_plan_id uuid NOT NULL REFERENCES game_plans(id) ON DELETE CASCADE,
  situation    text NOT NULL,
  notes        text,
  "order"      int NOT NULL DEFAULT 0
);

-- ----- game_plan_plays -----
CREATE TABLE game_plan_plays (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES game_plan_sections(id) ON DELETE CASCADE,
  play_id    uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  "order"    int NOT NULL DEFAULT 0,
  notes      text
);

-- ----- practice_scripts -----
CREATE TABLE practice_scripts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name         text NOT NULL,
  date         date NOT NULL,
  game_plan_id uuid REFERENCES game_plans(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER practice_scripts_updated_at
  BEFORE UPDATE ON practice_scripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- practice_periods -----
CREATE TABLE practice_periods (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid NOT NULL REFERENCES practice_scripts(id) ON DELETE CASCADE,
  name      text NOT NULL,
  duration  int NOT NULL,
  type      text NOT NULL CHECK (type IN ('install', 'team', 'seven-on-seven', 'individual', 'scout', 'situational')),
  "order"   int NOT NULL DEFAULT 0,
  notes     text
);

-- ----- practice_plays -----
CREATE TABLE practice_plays (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES practice_periods(id) ON DELETE CASCADE,
  play_id   uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  "order"   int NOT NULL DEFAULT 0
);

-- ----- call_sheets -----
CREATE TABLE call_sheets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_plan_id uuid NOT NULL REFERENCES game_plans(id) ON DELETE CASCADE,
  team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER call_sheets_updated_at
  BEFORE UPDATE ON call_sheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- call_sheet_sections -----
CREATE TABLE call_sheet_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sheet_id uuid NOT NULL REFERENCES call_sheets(id) ON DELETE CASCADE,
  name          text NOT NULL,
  color         text,
  "order"       int NOT NULL DEFAULT 0
);

-- ----- call_sheet_plays -----
CREATE TABLE call_sheet_plays (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES call_sheet_sections(id) ON DELETE CASCADE,
  play_id    uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  "order"    int NOT NULL DEFAULT 0
);

-- ----- scouting_notes -----
CREATE TABLE scouting_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  game_plan_id uuid NOT NULL REFERENCES game_plans(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('player', 'play', 'formation', 'tendency')),
  target_id    text NOT NULL,
  content      text NOT NULL,
  sentiment    text NOT NULL CHECK (sentiment IN ('weakness', 'strength', 'neutral')),
  tags         text[] NOT NULL DEFAULT '{}',
  rating       int CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER scouting_notes_updated_at
  BEFORE UPDATE ON scouting_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----- tendency_entries -----
CREATE TABLE tendency_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent_id  text NOT NULL,
  situation    text NOT NULL,
  personnel    text NOT NULL,
  formation    text,
  play_type    text NOT NULL,
  direction    text CHECK (direction IS NULL OR direction IN ('left', 'right', 'middle')),
  percentage   numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  sample_size  int NOT NULL CHECK (sample_size >= 0),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ----- shared_links -----
CREATE TABLE shared_links (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  resource_id   uuid NOT NULL,
  token         text NOT NULL UNIQUE,
  permissions   jsonb NOT NULL DEFAULT '{"view": true}'::jsonb,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- plays
CREATE INDEX idx_plays_team_id ON plays(team_id);
CREATE INDEX idx_plays_formation_id ON plays(formation_id);
CREATE INDEX idx_plays_folder_id ON plays(folder_id);
CREATE INDEX idx_plays_tags ON plays USING GIN(tags);

-- game_plans
CREATE INDEX idx_game_plans_team_id ON game_plans(team_id);
CREATE INDEX idx_game_plans_season ON game_plans(team_id, season);

-- formations
CREATE INDEX idx_formations_team_id ON formations(team_id);

-- scouting_notes
CREATE INDEX idx_scouting_notes_team_id ON scouting_notes(team_id);
CREATE INDEX idx_scouting_notes_game_plan_id ON scouting_notes(game_plan_id);

-- shared_links
CREATE INDEX idx_shared_links_token ON shared_links(token);

-- Additional useful indexes
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_folders_team_id ON folders(team_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_concepts_team_id ON concepts(team_id);
CREATE INDEX idx_blocking_schemes_team_id ON blocking_schemes(team_id);
CREATE INDEX idx_game_plan_sections_game_plan_id ON game_plan_sections(game_plan_id);
CREATE INDEX idx_game_plan_plays_section_id ON game_plan_plays(section_id);
CREATE INDEX idx_practice_scripts_team_id ON practice_scripts(team_id);
CREATE INDEX idx_practice_periods_script_id ON practice_periods(script_id);
CREATE INDEX idx_call_sheets_team_id ON call_sheets(team_id);
CREATE INDEX idx_call_sheets_game_plan_id ON call_sheets(game_plan_id);
CREATE INDEX idx_call_sheet_sections_call_sheet_id ON call_sheet_sections(call_sheet_id);
CREATE INDEX idx_tendency_entries_team_id ON tendency_entries(team_id);
CREATE INDEX idx_shared_links_team_id ON shared_links(team_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- Enable RLS on ALL tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocking_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plan_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plan_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheet_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tendency_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- =========================
-- Profiles: users can read/update their own profile
-- =========================
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid());

-- =========================
-- Teams: accessible to members
-- =========================
CREATE POLICY teams_select ON teams
  FOR SELECT USING (is_team_member(id));

CREATE POLICY teams_insert ON teams
  FOR INSERT WITH CHECK (true);

CREATE POLICY teams_update ON teams
  FOR UPDATE USING (is_team_member(id));

CREATE POLICY teams_delete ON teams
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'head_coach'
    )
  );

-- =========================
-- Team members: accessible to fellow team members
-- =========================
CREATE POLICY team_members_select ON team_members
  FOR SELECT USING (is_team_member(team_id));

CREATE POLICY team_members_insert ON team_members
  FOR INSERT WITH CHECK (
    -- Allow head coaches to add members, or allow self-insert during team creation
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('head_coach', 'coordinator')
    )
  );

CREATE POLICY team_members_update ON team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('head_coach', 'coordinator')
    )
  );

CREATE POLICY team_members_delete ON team_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'head_coach'
    )
  );

-- =========================
-- Macro: team-scoped RLS for tables with a direct team_id column
-- We create select/insert/update/delete policies for each
-- =========================

-- folders
CREATE POLICY folders_select ON folders
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY folders_insert ON folders
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY folders_update ON folders
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY folders_delete ON folders
  FOR DELETE USING (is_team_member(team_id));

-- formations
CREATE POLICY formations_select ON formations
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY formations_insert ON formations
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY formations_update ON formations
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY formations_delete ON formations
  FOR DELETE USING (is_team_member(team_id));

-- concepts
CREATE POLICY concepts_select ON concepts
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY concepts_insert ON concepts
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY concepts_update ON concepts
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY concepts_delete ON concepts
  FOR DELETE USING (is_team_member(team_id));

-- blocking_schemes
CREATE POLICY blocking_schemes_select ON blocking_schemes
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY blocking_schemes_insert ON blocking_schemes
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY blocking_schemes_update ON blocking_schemes
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY blocking_schemes_delete ON blocking_schemes
  FOR DELETE USING (is_team_member(team_id));

-- plays
CREATE POLICY plays_select ON plays
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY plays_insert ON plays
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY plays_update ON plays
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY plays_delete ON plays
  FOR DELETE USING (is_team_member(team_id));

-- game_plans
CREATE POLICY game_plans_select ON game_plans
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY game_plans_insert ON game_plans
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY game_plans_update ON game_plans
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY game_plans_delete ON game_plans
  FOR DELETE USING (is_team_member(team_id));

-- game_plan_sections (access via parent game_plan)
CREATE POLICY game_plan_sections_select ON game_plan_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_plans gp
      WHERE gp.id = game_plan_sections.game_plan_id
        AND is_team_member(gp.team_id)
    )
  );
CREATE POLICY game_plan_sections_insert ON game_plan_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_plans gp
      WHERE gp.id = game_plan_sections.game_plan_id
        AND is_team_member(gp.team_id)
    )
  );
CREATE POLICY game_plan_sections_update ON game_plan_sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM game_plans gp
      WHERE gp.id = game_plan_sections.game_plan_id
        AND is_team_member(gp.team_id)
    )
  );
CREATE POLICY game_plan_sections_delete ON game_plan_sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM game_plans gp
      WHERE gp.id = game_plan_sections.game_plan_id
        AND is_team_member(gp.team_id)
    )
  );

-- game_plan_plays (access via parent section -> game_plan)
CREATE POLICY game_plan_plays_select ON game_plan_plays
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_plan_sections gps
      JOIN game_plans gp ON gp.id = gps.game_plan_id
      WHERE gps.id = game_plan_plays.section_id
        AND is_team_member(gp.team_id)
    )
  );
CREATE POLICY game_plan_plays_insert ON game_plan_plays
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_plan_sections gps
      JOIN game_plans gp ON gp.id = gps.game_plan_id
      WHERE gps.id = game_plan_plays.section_id
        AND is_team_member(gp.team_id)
    )
  );
CREATE POLICY game_plan_plays_update ON game_plan_plays
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM game_plan_sections gps
      JOIN game_plans gp ON gp.id = gps.game_plan_id
      WHERE gps.id = game_plan_plays.section_id
        AND is_team_member(gp.team_id)
    )
  );
CREATE POLICY game_plan_plays_delete ON game_plan_plays
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM game_plan_sections gps
      JOIN game_plans gp ON gp.id = gps.game_plan_id
      WHERE gps.id = game_plan_plays.section_id
        AND is_team_member(gp.team_id)
    )
  );

-- practice_scripts
CREATE POLICY practice_scripts_select ON practice_scripts
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY practice_scripts_insert ON practice_scripts
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY practice_scripts_update ON practice_scripts
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY practice_scripts_delete ON practice_scripts
  FOR DELETE USING (is_team_member(team_id));

-- practice_periods (access via parent script)
CREATE POLICY practice_periods_select ON practice_periods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_scripts ps
      WHERE ps.id = practice_periods.script_id
        AND is_team_member(ps.team_id)
    )
  );
CREATE POLICY practice_periods_insert ON practice_periods
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_scripts ps
      WHERE ps.id = practice_periods.script_id
        AND is_team_member(ps.team_id)
    )
  );
CREATE POLICY practice_periods_update ON practice_periods
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_scripts ps
      WHERE ps.id = practice_periods.script_id
        AND is_team_member(ps.team_id)
    )
  );
CREATE POLICY practice_periods_delete ON practice_periods
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM practice_scripts ps
      WHERE ps.id = practice_periods.script_id
        AND is_team_member(ps.team_id)
    )
  );

-- practice_plays (access via parent period -> script)
CREATE POLICY practice_plays_select ON practice_plays
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_periods pp
      JOIN practice_scripts ps ON ps.id = pp.script_id
      WHERE pp.id = practice_plays.period_id
        AND is_team_member(ps.team_id)
    )
  );
CREATE POLICY practice_plays_insert ON practice_plays
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_periods pp
      JOIN practice_scripts ps ON ps.id = pp.script_id
      WHERE pp.id = practice_plays.period_id
        AND is_team_member(ps.team_id)
    )
  );
CREATE POLICY practice_plays_update ON practice_plays
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_periods pp
      JOIN practice_scripts ps ON ps.id = pp.script_id
      WHERE pp.id = practice_plays.period_id
        AND is_team_member(ps.team_id)
    )
  );
CREATE POLICY practice_plays_delete ON practice_plays
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM practice_periods pp
      JOIN practice_scripts ps ON ps.id = pp.script_id
      WHERE pp.id = practice_plays.period_id
        AND is_team_member(ps.team_id)
    )
  );

-- call_sheets
CREATE POLICY call_sheets_select ON call_sheets
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY call_sheets_insert ON call_sheets
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY call_sheets_update ON call_sheets
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY call_sheets_delete ON call_sheets
  FOR DELETE USING (is_team_member(team_id));

-- call_sheet_sections (access via parent call_sheet)
CREATE POLICY call_sheet_sections_select ON call_sheet_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM call_sheets cs
      WHERE cs.id = call_sheet_sections.call_sheet_id
        AND is_team_member(cs.team_id)
    )
  );
CREATE POLICY call_sheet_sections_insert ON call_sheet_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM call_sheets cs
      WHERE cs.id = call_sheet_sections.call_sheet_id
        AND is_team_member(cs.team_id)
    )
  );
CREATE POLICY call_sheet_sections_update ON call_sheet_sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM call_sheets cs
      WHERE cs.id = call_sheet_sections.call_sheet_id
        AND is_team_member(cs.team_id)
    )
  );
CREATE POLICY call_sheet_sections_delete ON call_sheet_sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM call_sheets cs
      WHERE cs.id = call_sheet_sections.call_sheet_id
        AND is_team_member(cs.team_id)
    )
  );

-- call_sheet_plays (access via parent section -> call_sheet)
CREATE POLICY call_sheet_plays_select ON call_sheet_plays
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM call_sheet_sections css
      JOIN call_sheets cs ON cs.id = css.call_sheet_id
      WHERE css.id = call_sheet_plays.section_id
        AND is_team_member(cs.team_id)
    )
  );
CREATE POLICY call_sheet_plays_insert ON call_sheet_plays
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM call_sheet_sections css
      JOIN call_sheets cs ON cs.id = css.call_sheet_id
      WHERE css.id = call_sheet_plays.section_id
        AND is_team_member(cs.team_id)
    )
  );
CREATE POLICY call_sheet_plays_update ON call_sheet_plays
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM call_sheet_sections css
      JOIN call_sheets cs ON cs.id = css.call_sheet_id
      WHERE css.id = call_sheet_plays.section_id
        AND is_team_member(cs.team_id)
    )
  );
CREATE POLICY call_sheet_plays_delete ON call_sheet_plays
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM call_sheet_sections css
      JOIN call_sheets cs ON cs.id = css.call_sheet_id
      WHERE css.id = call_sheet_plays.section_id
        AND is_team_member(cs.team_id)
    )
  );

-- scouting_notes
CREATE POLICY scouting_notes_select ON scouting_notes
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY scouting_notes_insert ON scouting_notes
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY scouting_notes_update ON scouting_notes
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY scouting_notes_delete ON scouting_notes
  FOR DELETE USING (is_team_member(team_id));

-- tendency_entries
CREATE POLICY tendency_entries_select ON tendency_entries
  FOR SELECT USING (is_team_member(team_id));
CREATE POLICY tendency_entries_insert ON tendency_entries
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY tendency_entries_update ON tendency_entries
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY tendency_entries_delete ON tendency_entries
  FOR DELETE USING (is_team_member(team_id));

-- shared_links: team members can manage, public can read via token
CREATE POLICY shared_links_select_member ON shared_links
  FOR SELECT USING (is_team_member(team_id));

CREATE POLICY shared_links_select_public ON shared_links
  FOR SELECT USING (
    -- Public access via token: allow select if the token matches and link has not expired
    token IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY shared_links_insert ON shared_links
  FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY shared_links_update ON shared_links
  FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY shared_links_delete ON shared_links
  FOR DELETE USING (is_team_member(team_id));
