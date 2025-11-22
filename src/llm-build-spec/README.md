# Dental Charting Application - LLM Build Specification

This directory contains comprehensive JSON specifications for building a complete dental charting application using React + Vite.

## Overview

This is a professional dental practice management system focused on detailed tooth charting, periodontal records, pathology tracking, and treatment planning.

## Directory Structure

- `app-structure.json` - Overall application architecture and routing
- `data-models.json` - Complete data structures and schemas
- `asset-naming-convention.json` - Image asset naming and organization system
- `SVG_OVERLAY_SYSTEM.json` - SVG overlay system for coloring tooth surfaces
- `routes/` - Detailed specifications for each route
  - `home.json` - Landing/Sign-in page
  - `patients-list.json` - Patient listing and search
  - `patient-dashboard.json` - Patient overview, treatment plan, history
  - `patient-report.json` - Reporting interface
  - `patient-chart.json` - Main dental chart with multiple views
  - `tooth-detail.json` - Individual tooth examination interface
- `features/` - Specific feature specifications
  - `chart-views.json` - Chart display modes and toggles
  - `periodontal-probing.json` - Detailed periodontal examination
  - `pathology-menu.json` - Pathology selection and tracking
  - `restoration-menu.json` - Dental restorations
  - `endodontic-tests.json` - Endodontic examination
  - `time-travel.json` - Historical chart viewing
  - `oral-health-metrics.json` - Dashboard health indicators

## Usage Instructions

1. Read `app-structure.json` first to understand the overall architecture
2. Review `data-models.json` to understand data flow
3. Review `asset-naming-convention.json` for image asset requirements
4. Review `SVG_OVERLAY_SYSTEM.json` for tooth surface coloring system
4. Implement routes in order: home → patients → dashboard → chart → tooth detail
5. Each JSON file contains:
   - Detailed component specifications
   - UI/UX requirements
   - State management needs
   - API endpoints (for future backend)
   - Styling guidelines

## Asset Requirements

Before building, ensure you have tooth images following the naming convention:
- Format: `iso{toothNumber}-{view}-{state}.png`
- Examples: `iso11-frontal.png`, `iso24-topview-implant.png`
- See `asset-naming-convention.json` for complete details

## Technology Stack

- **Framework**: React 18+
- **Build Tool**: Vite
- **State Management**: Zustand (recommended for simplicity)
- **Routing**: React Router v6
- **Styling**: CSS Modules or Styled Components
- **UI Components**: Custom components (specifications provided)

## Color Palette

Primary colors used throughout the application:
- Primary Blue: `#00A3E0`
- Sidebar Blue: `#0083B8`
- Success Green: `#00C851`
- Warning Yellow: `#FFD700`
- Error Red: `#FF4444`
- Gray Scale: `#F5F5F5`, `#E0E0E0`, `#BDBDBD`, `#757575`, `#424242`
- Purple (Restoration): `#9575CD`
- Cyan (Restoration): `#4DD0E1`

## Build Order

1. Setup project structure and routing
2. Implement authentication (demo mode)
3. Build patient list page
4. Create dashboard with metrics
5. Implement main chart view with jaw displays
6. Add periodontal probing interface
7. Add pathology tracking
8. Add restoration interface
9. Implement individual tooth detail view
10. Add time-travel feature for historical data
11. Polish UI/UX and add transitions

