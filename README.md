# Family Finance - Home Finance Management App

A modern, responsive, multi-user Home Finance Management Web Application built with React, TypeScript, and Recharts.

## Features

- **Dashboard**: Overview of all financial metrics with interactive charts
- **Income Tracking**: Track and analyze income sources with detailed breakdowns
- **Expense Management**: Monitor expenses by category and family member
- **Savings Goals**: Track savings growth and account balances
- **Investment Portfolio**: Monitor investments, ROI, and asset allocation
- **Analytics**: Comprehensive financial analysis across all categories
- **Profile Management**: User and family member management

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Router DOM** for navigation
- **CSS Modules** for styling (no Tailwind/Bootstrap)

## Project Structure

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── Button/       # Button component with variants
│   │   ├── Card/         # Card container component
│   │   ├── FilterBar/    # Filter and search bar
│   │   └── Table/        # Sortable data table
│   ├── charts/           # Chart components
│   │   └── ChartCard/    # Chart wrapper component
│   └── layout/           # Layout components
│       ├── MainLayout/   # Main app layout
│       ├── Sidebar/      # Navigation sidebar
│       └── Topbar/       # Top navigation bar
├── contexts/             # React contexts
│   └── ThemeContext.tsx  # Theme management (light/dark)
├── data/                 # Mock data
│   └── mockData.ts       # Sample financial data
├── pages/                # Application pages
│   ├── Dashboard/        # Main dashboard
│   ├── Income/           # Income tracking
│   ├── Expenses/         # Expense tracking
│   ├── Savings/          # Savings management
│   ├── Investments/     # Investment tracking
│   ├── Analytics/       # Financial analytics
│   └── Profile/         # User profile
├── styles/               # Global styles
│   └── global.css        # CSS variables and base styles
├── types/                # TypeScript type definitions
│   └── index.ts          # All type definitions
├── App.tsx               # Main app component
└── main.tsx              # Application entry point
```

## Key Features

### 1. Theme System
- Light and dark mode support using CSS custom properties
- Theme persistence via localStorage
- Smooth theme transitions

### 2. Responsive Design
- Mobile-first approach
- Breakpoints for tablet and desktop
- Collapsible sidebar on mobile
- Responsive grid layouts

### 3. Component Architecture
- **Card**: Flexible container with variants (primary, success, warning, danger)
- **Button**: Multiple variants (primary, secondary, outline, ghost, danger) and sizes
- **ChartCard**: Wrapper for Recharts with consistent styling
- **Table**: Sortable data table with loading and empty states
- **FilterBar**: Combined search and filter controls

### 4. Charts & Visualizations
- Area charts for trends
- Pie charts for category breakdowns
- Bar charts for comparisons
- Line charts for growth tracking
- All charts are responsive and theme-aware

### 5. State Management
- React hooks for local state
- Context API for theme management
- Mock data layer for demonstration

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5175/`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Design System

### Color Palette

**Light Mode:**
- Primary: #0ea5e9 (Sky Blue)
- Success: #10b981 (Green)
- Warning: #f59e0b (Amber)
- Danger: #ef4444 (Red)
- Neutral: Gray scale from #f8fafc to #0f172a

**Dark Mode:**
- Primary: #38bdf8
- Success: #10b981
- Warning: #f59e0b
- Danger: #ef4444
- Neutral: Adjusted dark grays

### Spacing System
Based on 8px grid:
- 0.25rem (4px)
- 0.5rem (8px)
- 0.75rem (12px)
- 1rem (16px)
- 1.5rem (24px)
- 2rem (32px)
- 3rem (48px)
- 4rem (64px)

### Typography
- Font: Inter (system fallback)
- Sizes: xs (12px) to 4xl (36px)
- Weights: 400 (normal) to 700 (bold)
- Line heights: 1.25 to 1.75

### Border Radius
- Small: 0.375rem (6px)
- Medium: 0.5rem (8px)
- Large: 0.75rem (12px)
- XL: 1rem (16px)
- 2XL: 1.5rem (24px)

## Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox

## Notes

- This is a UI-only implementation with mock data
- No backend integration (as per requirements)
- All charts use Recharts library
- No UI frameworks (Tailwind/Bootstrap) - pure CSS Modules
- Production-ready code structure
- TypeScript for type safety

## Future Enhancements

- Backend API integration
- Real-time data updates
- Export functionality (PDF, CSV)
- Advanced filtering and search
- Date range picker
- Multi-currency support
- Budget planning features
- Bill reminders and notifications