# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PME2GO is a React-based business ecosystem platform that connects SMEs, startups, experts, mentors, incubators, investors, financial institutions, and other specialized profiles. It features user authentication, profile matching, messaging, opportunities marketplace, analytics, and event management.

## Development Commands

### Core Commands
- `npm start` - Start React development server on http://localhost:3001
- `npm run server` - Start Express API server on http://localhost:3002
- `npm run dev` - Start both frontend and backend concurrently
- `npm run build` - Build production bundle
- `npm test` - Run test suite with Jest
- `npm run eject` - Eject from Create React App (not reversible)

### Database Commands
- `npm run migrate` - Run database migration (create schema + insert demo data)
- `node server/test-db.js` - Test PostgreSQL connection

### Package Management
- `npm install` - Install all dependencies
- `npm install <package>` - Add new dependency
- `npm install --save-dev <package>` - Add development dependency

## Architecture Overview

### Hybrid Architecture (Database + Demo Mode)
- **Frontend**: React app on port 3001
- **Backend**: Express API server on port 3002
- **Database**: PostgreSQL with automatic fallback to demo data
- **API Layer**: RESTful API with comprehensive endpoints

### State Management
- **Global State**: React Context API with useReducer (`src/contexts/AppContextWithAPI.js`)
- **Authentication**: JWT-based with bcrypt password hashing
- **Data Flow**: API calls with demo data fallback
- **Database**: PostgreSQL schema with comprehensive tables and indexes
- **Demo Data**: Fallback data from `src/data/demoData.js` when database unavailable

### Database Integration
- **Connection**: Multiple configuration attempts with graceful fallback
- **Schema**: Comprehensive PostgreSQL schema in `server/schema.sql`
- **Migration**: Automated setup with `server/migrate.js`
- **API Service**: Centralized API calls in `src/services/api.js`

### Component Structure
```
src/components/
├── Auth/           # LoginForm, RegisterForm with demo account quick access
├── Dashboard/      # Personalized dashboard with profile-specific content
├── Search/         # Advanced search with filtering and compatibility scoring
├── Profile/        # Profile management and detail views
├── Messages/       # Real-time messaging system
├── Opportunities/  # Marketplace for jobs, funding, consulting
├── Events/         # Event calendar and registration
├── Analytics/      # Interactive charts using Recharts
├── Layout/         # Header, Sidebar with responsive navigation
└── UI/            # Reusable components (Card, Modal, LoadingSpinner)
```

### User Types and Roles
The platform supports 8 distinct user types defined in `USER_TYPES` constant:
- PME/Startup, Expert/Consultant, Mentor, Incubateur, Investisseur, Institution Financière, Organisme Public, Partenaire Tech

### Key Features
- **Profile Matching**: Compatibility scoring algorithm based on industry, location, interests, and stage
- **Demo Authentication**: 6 pre-configured accounts for testing different user types
- **Responsive Design**: Mobile-first approach using Tailwind CSS
- **Dark Mode**: Theme switching capability built-in
- **Notifications**: Toast notification system with auto-dismiss
- **Search & Filters**: Multi-criteria search with real-time filtering

## Styling System

### Tailwind CSS Configuration
- **Custom Colors**: Extended palette with primary, secondary, success, warning, danger color scales
- **Dark Mode**: Class-based dark mode support (`dark:` prefixes)
- **Animations**: Custom animations (fade-in, slide-in, bounce-soft, pulse-soft)
- **Custom Shadows**: Card shadows and hover effects

### Design Tokens
- Professional business color scheme (blues, whites, accent colors)
- Responsive breakpoints follow Tailwind defaults
- Custom component variants for different user types

## Data Structure

### Demo Users
Each user has comprehensive profile data including:
- Basic info (name, email, type, industry, location)
- Professional details (experience, skills, availability)
- Statistics (connections, projects, rating, reviews)
- Type-specific fields (funding stage, ticket size, portfolio, etc.)

### Context State
Key state properties:
- `user` - Current authenticated user
- `users` - All platform users
- `opportunities` - Job/funding/consulting opportunities  
- `messages` - Direct messaging data
- `events` - Platform events
- `notifications` - Toast notifications queue
- `searchFilters` - Current search criteria

## Development Patterns

### Component Conventions
- Functional components with hooks
- useApp() hook for accessing global state
- Conditional rendering based on user type
- Responsive design with mobile-first approach
- Accessibility considerations (sr-only labels, proper ARIA)

### State Updates
- All state changes go through AppContext dispatchers
- Optimistic updates with immediate UI feedback
- Auto-dismiss notifications after 5 seconds
- Real-time search filtering

### Routing
- View-based routing via currentView state (no react-router)
- Navigation handled through setView() function
- Deep linking not implemented (SPA state-based navigation)

## Dependencies

### Core Dependencies
- **react** (^18.2.0) - UI framework
- **react-dom** (^18.2.0) - DOM rendering
- **lucide-react** (^0.263.1) - Icon library
- **recharts** (^2.8.0) - Charts and analytics
- **tailwindcss** (^3.3.0) - CSS framework
- **react-scripts** (5.0.1) - Create React App tooling

### Backend Dependencies
- **express** (^5.1.0) - Web server framework
- **pg** (^8.16.3) - PostgreSQL client
- **bcrypt** (^6.0.0) - Password hashing
- **cors** (^2.8.5) - Cross-origin resource sharing
- **dotenv** (^17.2.1) - Environment variables
- **concurrently** (^9.2.0) - Run multiple commands simultaneously

### Key Libraries Usage
- Lucide React for consistent iconography throughout the app
- Recharts for dashboard analytics and data visualization
- No external routing library (state-based navigation)
- No external state management beyond React Context

## Database Setup

### PostgreSQL Configuration
1. **Database Name**: pme-360-db
2. **Default Credentials**: postgres/Postgres (configurable in .env)
3. **Connection**: Automatic fallback to demo mode if database unavailable
4. **Schema**: Comprehensive tables with indexes and triggers

### Environment Variables (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pme-360-db
DB_USER=postgres
DB_PASSWORD=Postgres
PORT=3001
SERVER_PORT=3002
```

### Database Schema
- **users**: Complete user profiles with type-specific fields
- **opportunities**: Job/funding/consulting opportunities  
- **messages**: Direct messaging between users
- **events**: Platform events and registrations
- **applications**: Opportunity applications
- **favorites**: User favorites system
- **notifications**: System notifications

## Testing & Development

### Demo Account Access
Quick login available on LoginForm with pre-configured accounts:
1. TechStart Solutions (PME/Startup) - contact@techstart.fr
2. Marie Dubois (Expert/Consultant) - marie.dubois@consulting.fr
3. Jean-Pierre Martin (Mentor) - jp.martin@mentor.fr
4. Innovation Hub Paris (Incubateur) - contact@innovhub-paris.fr
5. Capital Ventures (Investisseur) - deals@capitalventures.fr
6. Crédit Entreprise Plus (Institution Financière) - pro@creditentreprise.fr

**Password for all demo accounts**: demo123

### Development Modes
- **Database Mode**: Full PostgreSQL integration with real data persistence
- **Demo Mode**: Fallback mode using local data when database unavailable
- **Connection Status**: Visual indicator shows current mode in bottom-right corner

### Browser Support
Configured for modern browsers with automatic polyfills via react-scripts browserslist configuration.