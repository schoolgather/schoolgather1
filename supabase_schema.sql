-- ==============================================================================
-- School Gather - Supabase PostgreSQL Schema & Seed Data
-- Run this in your Supabase project's SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Create Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  tagline TEXT,
  description TEXT,
  curriculum_type TEXT NOT NULL,
  city TEXT,
  country TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  tuition_min NUMERIC DEFAULT 0,
  tuition_max NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  scholarship_available BOOLEAN DEFAULT false,
  age_range TEXT,
  student_teacher_ratio TEXT,
  status TEXT DEFAULT 'published',
  cover_image_url TEXT,
  logo_url TEXT,
  languages JSONB DEFAULT '[]'::jsonb,
  programs JSONB DEFAULT '[]'::jsonb,
  facilities JSONB DEFAULT '[]'::jsonb,
  extracurriculars JSONB DEFAULT '[]'::jsonb,
  learning_styles JSONB DEFAULT '[]'::jsonb,
  support_services JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  grades_offered JSONB DEFAULT '[]'::jsonb,
  fee_items JSONB DEFAULT '[]'::jsonb,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  admin_emails JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Create Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  guardian_name TEXT,
  guardian_email TEXT,
  guardian_phone TEXT,
  grade_applying TEXT,
  academic_year TEXT,
  personal_statement TEXT,
  current_school TEXT,
  learning_support TEXT,
  achievements TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Create Match Profiles Table
CREATE TABLE IF NOT EXISTS public.match_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. Create Tour Slots Table
CREATE TABLE IF NOT EXISTS public.tour_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT,
  type TEXT DEFAULT 'in_person', -- 'in_person' or 'virtual'
  capacity INTEGER DEFAULT 20,
  booked_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Create Tour Bookings Table
CREATE TABLE IF NOT EXISTS public.tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES public.tour_slots(id) ON DELETE CASCADE,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  guests INTEGER DEFAULT 1,
  status TEXT DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 6. Create Messages / Inquiries Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  recipient_email TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 7. Create Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_email, school_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Public read access for published schools and tour slots
CREATE POLICY "Public schools are readable by everyone" ON public.schools
  FOR SELECT USING (status = 'published');

CREATE POLICY "Tour slots are viewable by everyone" ON public.tour_slots
  FOR SELECT USING (true);

-- Applications policies
CREATE POLICY "Users can create applications" ON public.applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own applications" ON public.applications
  FOR SELECT USING (auth.jwt() ->> 'email' = student_email OR auth.jwt() ->> 'email' = guardian_email);

-- Match Profiles policies
CREATE POLICY "Users can view and insert match profiles" ON public.match_profiles
  FOR ALL USING (auth.jwt() ->> 'email' = user_email);

-- Bookmarks policies
CREATE POLICY "Users can manage their bookmarks" ON public.bookmarks
  FOR ALL USING (auth.jwt() ->> 'email' = user_email);

-- ==============================================================================
-- Seed Initial Schools
-- ==============================================================================
INSERT INTO public.schools (
  id, name, slug, tagline, description, curriculum_type, city, country, address,
  latitude, longitude, tuition_min, tuition_max, currency, rating, review_count,
  scholarship_available, age_range, student_teacher_ratio, cover_image_url, logo_url,
  languages, programs, facilities, extracurriculars, learning_styles, support_services, highlights, grades_offered
) VALUES
(
  'sch_oakwood_ib',
  'Oakwood International Academy',
  'oakwood-international-academy',
  'Empowering inquisitive global thinkers through the full IB Continuum.',
  'Oakwood International Academy is a premier co-educational day and boarding school offering the complete International Baccalaureate (PYP, MYP, and DP). With an emphasis on multilingual immersion, global citizenship, and cutting-edge science labs, Oakwood prepares students for the world''s most selective universities.',
  'IB', 'Geneva', 'Switzerland', 'Route de Suisse 45, 1290 Geneva',
  46.2044, 6.1432, 18000, 32000, 'USD', 4.9, 42,
  true, '3 - 18 years', '8:1',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80',
  'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&q=80',
  '["English", "French", "Spanish", "German"]'::jsonb,
  '["IB Primary Years (PYP)", "IB Middle Years (MYP)", "IB Diploma (DP)", "Bilingual Immersion"]'::jsonb,
  '["Olympic Pool", "Design & Robotics Lab", "Performing Arts Black Box", "Science Observatory", "Boarding Lodges"]'::jsonb,
  '["Model United Nations", "Robotics Club", "Competitive Rowing", "Chamber Orchestra", "Debate Society"]'::jsonb,
  '["Discussion & seminar led", "Creative & project-based", "Independent & self-paced"]'::jsonb,
  '["University College Counseling", "EAL Language Support", "Learning Resource Center", "Wellness & Mental Health"]'::jsonb,
  '["100% IB Diploma pass rate", "Top 1% average DP score of 37.8", "Ivy League & Oxbridge placements"]'::jsonb,
  '["Pre-K", "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]'::jsonb
),
(
  'sch_st_andrews_uk',
  'St. Andrews British Grammar',
  'st-andrews-british-grammar',
  'Academic rigour, timeless heritage, and exceptional pastoral care.',
  'Following the British National Curriculum through IGCSEs and Cambridge A-Levels, St. Andrews combines tradition with contemporary innovation. Our students excel in STEM, humanities, and competitive athletics in a supportive, inspiring environment.',
  'British', 'London', 'United Kingdom', '14 Queensborough Terrace, London W2 3SS',
  51.5123, -0.1878, 14000, 26000, 'USD', 4.8, 36,
  true, '4 - 18 years', '10:1',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=80',
  '["English", "Latin", "French", "Mandarin"]'::jsonb,
  '["Key Stage 1-3", "Cambridge IGCSE", "Cambridge International A-Levels", "EPQ Research Projects"]'::jsonb,
  '["Historic Library", "Astroturf Pitches", "Modern Chemistry & Physics Labs", "Fine Arts Studio"]'::jsonb,
  '["Competitive sports", "Debate & Model UN", "Visual arts", "Music & performing arts"]'::jsonb,
  '["Structured & academic", "Discussion & seminar led"]'::jsonb,
  '["Oxbridge Prep Mentorship", "Pastoral Tutoring", "SEN Specialist Support"]'::jsonb,
  '["88% A* to A at A-Levels", "The Duke of Edinburgh Gold Award Center", "National Champions in Math Olympiad"]'::jsonb,
  '["Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]'::jsonb
),
(
  'sch_horizon_prep_us',
  'Horizon STEM Prep Academy',
  'horizon-stem-prep-academy',
  'Inspiring the next generation of engineers, coders, and visionary leaders.',
  'Horizon Prep delivers an advanced American High School Diploma alongside 22 Advanced Placement (AP) courses. Featuring a college-level MakerSpace, incubator lab, and direct partnerships with university research programs.',
  'American', 'San Francisco', 'United States', '742 Innovation Way, San Francisco, CA 94107',
  37.7749, -122.4194, 16000, 29500, 'USD', 4.9, 51,
  true, '5 - 18 years', '9:1',
  'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
  '["English", "Spanish", "Japanese"]'::jsonb,
  '["American Curriculum", "AP Capstone Diploma", "Silicon Valley Tech Mentorship", "Biotech Honors"]'::jsonb,
  '["FabLab & 3D Printing Lab", "Cleanroom Simulation Studio", "Virtual Reality Sandbox", "Fitness Center"]'::jsonb,
  '["STEM & robotics", "Coding & AI", "Entrepreneurship", "Outdoor education"]'::jsonb,
  '["Creative & project-based", "Hands-on & practical", "Independent & self-paced"]'::jsonb,
  '["College Admission Advisory", "Peer Tutoring Network", "Accelerated Math Track"]'::jsonb,
  '["Ranked #1 STEM Private School in Region", "National Merit Scholars (34% of seniors)", "AP Capstone Excellence Award"]'::jsonb,
  '["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
