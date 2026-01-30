# 🏥 Telehealth Resource Management Portal

A comprehensive telehealth platform for managing hybrid (in-person and remote) patient flows with intelligent resource allocation, real-time updates, and role-based dashboards.

## ✨ Features

- **🧠 Intelligent Triaging**: 3-question symptom check-in with priority scoring (0-100)
- **⚖️ Dynamic Load Balancing**: Auto-detection of delays with reassignment suggestions
- **🔄 Real-time Updates**: Instant synchronization across all dashboards via Supabase Realtime
- **👨‍⚕️ Provider Command Center**: Color-coded appointment tiles with priority queue
- **🎛️ Admin Bird's-Eye View**: Traffic comparison and reassignment management
- **📱 Patient Pizza Tracker**: Mobile-responsive progress tracking with live updates

## 🚀 Quick Start

### Prerequisites

1. **Node.js** 18+ and npm
2. **Supabase Account** - Create a free project at [supabase.com](https://supabase.com)

### 1. Clone and Install

```bash
cd Into the Repo
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up

#### Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste into the SQL Editor and click **Run**

This creates:
- `profiles` table (users with roles)
- `appointments` table (with priority scores)
- `queue_entries` table (for load balancing)
- All necessary indexes and RLS policies
- Realtime subscriptions

#### Create Demo Users

In Supabase SQL Editor, run:

```sql
-- Create demo users (you'll need to set passwords in Supabase Auth UI)
-- After creating users in Auth, insert their profiles:

-- Replace {user_id} with actual IDs from Supabase Auth
INSERT INTO profiles (id, role, name, specialization) VALUES
  ('{doctor_user_id}', 'doctor', 'Sarah Johnson', 'General Practice'),
  ('{admin_user_id}', 'admin', 'Admin User', NULL),
  ('{patient_user_id}', 'patient', 'John Doe', NULL);
```

**Alternative**: Use Supabase Auth UI to create users, then manually insert profiles.

### 3. Configure Environment Variables

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in your Supabase project settings under **API**.

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Login

Use the credentials you created in Supabase Auth:
- **Doctor**: doctor@example.com
- **Admin**: admin@example.com  
- **Patient**: patient@example.com

Each role redirects to their specific dashboard.

## 📁 Project Structure

```
telehealth-portal/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Authentication
│   │   ├── (dashboard)/
│   │   │   ├── provider/          # Provider Command Center
│   │   │   ├── admin/             # Admin Bird's-Eye View
│   │   │   └── patient/           # Patient Pizza Tracker
│   │   └── globals.css            # Clinical theme
│   ├── components/
│   │   ├── ui/                    # Shadcn UI components
│   │   ├── provider/              # Provider-specific components
│   │   ├── admin/                 # Admin-specific components
│   │   └── patient/               # Patient-specific components
│   ├── lib/
│   │   ├── supabase/              # Supabase client setup
│   │   ├── actions/               # Server actions
│   │   ├── utils/                 # Priority & load balancing logic
│   │   └── types.ts               # TypeScript definitions
│   ├── hooks/                     # Real-time hooks
│   └── middleware.ts              # Auth middleware
├── supabase/
│   └── migrations/                # Database schema
└── .env.local                     # Environment config
```

## 🎯 Core Features Explained

### Priority Scoring Algorithm

**3-Question Symptom Check-in**:
1. **Severity** (0-40 points): Critical → Minimal
2. **Duration** (0-30 points): Week+ → Under 24hrs  
3. **Pre-existing Conditions** (0-30 points): Multiple serious → None

**Total Score**: 0-100 (scores ≥70 flagged as urgent)

### Load Balancing Logic

- Monitors all active sessions in real-time
- Auto-flags appointments running **15+ minutes late**
- Finds available doctors with matching specialization
- Updates queue entries for admin review and approval

### Real-time Updates

All dashboards use Supabase Realtime:
- **Provider**: Subscribes to their appointments
- **Admin**: Subscribes to flagged reassignments
- **Patient**: Subscribes to their queue entry

Updates happen **instantly** without page refresh.

## 🎨 Dashboards

### 👨‍⚕️ Provider Command Center (`/provider`)

- **Color-coded tiles**: Green (active), Amber (delayed), White (scheduled)
- **Priority queue sidebar**: Next 3 patients sorted by urgency
- **Session controls**: Start/Complete buttons
- **Real-time updates**: Instant notification of reassignments

### 🎛️ Admin Bird's-Eye View (`/admin`)

- **Traffic comparison**: Physical vs. Digital patient loads
- **Capacity utilization**: Visual bar with color coding
- **Reassignment table**: Flagged appointments with delay times
- **System-wide monitoring**: All doctors and queues

### 📱 Patient Pizza Tracker (`/patient`)

- **5-stage progress bar**: Check-in → Nurse Review → Waiting → Consultation → Complete
- **Estimated wait time**: Dynamic calculation based on queue
- **Doctor information**: Name, specialization, appointment type
- **Mobile-responsive**: Optimized for phones and tablets

## 🔐 Security

- **Row Level Security (RLS)**: Patients can only see their data
- **Role-based Access**: Doctors, Admins, and Patients have different permissions
- **Supabase Auth**: Secure authentication with session management
- **Middleware Protection**: All dashboard routes require authentication

## 🛠️ Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS + Shadcn UI
- **Auth**: Supabase Auth
- **TypeScript**: Full type safety

## 📚 Documentation

- **[Implementation Plan](file:///home/eightex/.gemini/antigravity/brain/f2fe160c-eadf-479b-b74b-fb3c93e65be6/implementation_plan.md)**: Detailed technical architecture
- **[Walkthrough](file:///home/eightex/.gemini/antigravity/brain/f2fe160c-eadf-479b-b74b-fb3c93e65be6/walkthrough.md)**: Complete feature documentation
- **[Task List](file:///home/eightex/.gemini/antigravity/brain/f2fe160c-eadf-479b-b74b-fb3c93e65be6/task.md)**: Development checklist

## 🐛 Troubleshooting

### Build Error: "Invalid supabaseUrl"

This means `.env.local` is not configured. Update it with your Supabase credentials.

### "No appointments today"

You need to create sample appointments in the database. Use Supabase SQL Editor:

```sql
INSERT INTO appointments (patient_id, doctor_id, type, priority_score, scheduled_time, status)
VALUES 
  ('{patient_id}', '{doctor_id}', 'virtual', 75, NOW() + INTERVAL '1 hour', 'scheduled');
```

### Real-time not working

1. Check that Realtime is enabled in Supabase (Project Settings → API → Realtime)
2. Verify tables are added to publication: `ALTER PUBLICATION supabase_realtime ADD TABLE appointments;`

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Environment Variables for Production

Set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📝 License

MIT

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

---

**Built with ❤️ using Next.js 14, Supabase, and Tailwind CSS**
