# Application Structure Diagram

## Route Hierarchy

```
/ (HomePage - Demo Login)
│
└── /patients (PatientsListPage)
    │
    └── /patients/:patientId (PatientLayout - Wrapper with navigation)
        │
        ├── /patients/:patientId/dashboard (PatientDashboardPage)
        │   ├── Treatment Plan
        │   ├── Treatment History
        │   ├── Soft Tissue Exam
        │   ├── Oral Health Metrics (Sidebar)
        │   ├── BPE (Sidebar)
        │   └── Medical Issues (Sidebar)
        │
        ├── /patients/:patientId/report (PatientReportPage)
        │   ├── Report Type Selector
        │   ├── Report Preview
        │   └── Export Options (PDF, Print, Email)
        │
        ├── /patients/:patientId/chart (PatientChartPage)
        │   │
        │   ├── /chart (default - ChartOverview)
        │   │   ├── Upper Buccal Row (18-11, 21-28)
        │   │   ├── Upper Occlusal Row
        │   │   ├── Lower Occlusal Row
        │   │   ├── Lower Buccal Row (48-41, 31-38)
        │   │   └── View Toggles (Endo, Perio, Dental)
        │   │
        │   ├── /chart/quickselect (ChartQuickselect)
        │   │   └── Rapid charting interface
        │   │
        │   ├── /chart/periodontal-probing (ChartPeriodontalProbing)
        │   │   └── Full-screen periodontal interface
        │   │
        │   ├── /chart/pathology (ChartPathology)
        │   │   └── Pathology marking view
        │   │
        │   └── /chart/restoration (ChartRestoration)
        │       └── Restoration planning view
        │
        └── /patients/:patientId/tooth/:toothNumber (ToothDetailPage)
            │
            ├── Left: ToothVisualization3Plane
            │   ├── Frontal View
            │   ├── Top View
            │   └── Lingual View
            │
            └── Right: Tabbed Interface
                ├── Overview Tab
                ├── Endodontic Tab (5 tests)
                ├── Periodontal Tab (6-site measurements)
                ├── Pathology Tab (6 categories)
                └── Restoration Tab (9 types)
```

## Component Hierarchy (Simplified)

```
App
│
├── GlobalSidebar (Fixed left sidebar)
│   ├── Navigation Icons
│   └── View Toggles (bottom)
│
├── Routes
│   ├── HomePage
│   │   └── LoginCard
│   │
│   ├── PatientsListPage
│   │   ├── SearchBar
│   │   ├── FilterOptions
│   │   └── PatientTable
│   │
│   └── PatientLayout (Wrapper)
│       ├── PatientHeader (Name + Tabs)
│       │
│       ├── PatientDashboardPage
│       │   ├── TreatmentPlan
│       │   ├── TreatmentHistory
│       │   ├── SoftTissueExam
│       │   └── Sidebar
│       │       ├── OralHealthMetrics
│       │       ├── BPE
│       │       └── MedicalIssues
│       │
│       ├── PatientChartPage
│       │   ├── TimeTravelControls
│       │   ├── ChartTabs (Overview, Quickselect, etc.)
│       │   └── ChartView
│       │       ├── JawRow (Upper Buccal)
│       │       │   └── ToothRenderer × 16
│       │       ├── JawRow (Upper Occlusal)
│       │       │   └── ToothRenderer × 16
│       │       ├── JawRow (Lower Occlusal)
│       │       │   └── ToothRenderer × 16
│       │       └── JawRow (Lower Buccal)
│       │           └── ToothRenderer × 16
│       │
│       ├── ToothDetailPage
│       │   ├── ToothVisualization3Plane
│       │   │   ├── ToothView (Frontal)
│       │   │   ├── ToothView (Top)
│       │   │   └── ToothView (Lingual)
│       │   └── ToothTabs
│       │       ├── ToothOverview
│       │       ├── ToothEndodontic
│       │       ├── ToothPeriodontal
│       │       ├── ToothPathology
│       │       └── ToothRestoration
│       │
│       └── PatientReportPage
│           ├── ReportTypeSelector
│           ├── ReportPreview
│           └── ExportToolbar
```

## Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Zustand Store Action
    ↓
Store State Update
    ↓
Component Re-render
    ↓
UI Update
```

### Example: Clicking a Tooth

```
User clicks tooth 24
    ↓
ChartOverview → handleToothClick(24)
    ↓
chartStore.selectTooth(24)
    ↓
Navigate to /patients/123/tooth/24
    ↓
ToothDetailPage loads
    ↓
Fetch tooth data from chartStore
    ↓
Render 3-plane view + tabs
```

## State Management (Zustand Stores)

```
authStore
├── user
├── isAuthenticated
└── demoMode

patientStore
├── patients []
├── selectedPatient
└── searchQuery

chartStore
├── teeth Map<toothNumber, tooth>
├── selectedTooth
├── selectedTeeth []
├── viewMode
├── historicalDate
├── showEndo
├── showPerio
└── showDental

toothStore
├── currentTooth
├── periodontalData
├── endodonticData
├── pathologyData
└── restorationData

dashboardStore
├── treatmentPlan
├── history
├── softTissue
├── oralHealthMetrics
└── medicalIssues
```

## Image Asset Structure

```
src/assets/teeth/
├── iso11-frontal.png
├── iso11-frontal-implant.png
├── iso11-frontal-missing.png
├── iso11-frontal-noroots.png
├── iso11-topview.png
├── iso11-topview-implant.png
├── iso11-lingual.png
├── ... (repeat for teeth 11-18, 41-48)
└── [330 total images]

Mirroring:
- Teeth 11-18 → Used directly
- Teeth 21-28 → Mirror 11-18 horizontally
- Teeth 41-48 → Used directly
- Teeth 31-38 → Mirror 41-48 horizontally
```

## Feature Interaction Map

```
Main Chart View
├── Click Tooth → Tooth Detail View
├── Toggle Endo → Show/Hide Root Canals
├── Toggle Perio → Show/Hide Gingival Data
├── Toggle Dental → Show/Hide Restorations
├── Time Travel → Load Historical Chart
└── Tab: Periodontal Probing → Full Perio Interface

Tooth Detail View
├── Endodontic Tab → Record Tests → Update Chart
├── Periodontal Tab → Record Measurements → Update Chart
├── Pathology Tab → Mark Pathology → Update Chart (colored overlay)
├── Restoration Tab → Add Restoration → Update Chart (colored overlay)
└── Quick Actions → Reset/Extract/Missing → Update Chart

Dashboard
├── Treatment Plan → Add Item → Link to Tooth/Pathology
├── Oral Health Metrics → View History → Trend Chart
├── BPE → Update Codes → Calculate Risk Level
└── Medical Issues → Update → Show Alerts
```

## Layer System (Z-Index)

```
Layer 8: Selection Highlight (top-most)
Layer 7: Annotations
Layer 6: Periodontal Data
Layer 5: Endodontic Indicators
Layer 4: Pathology Markers
Layer 3: Restorations
Layer 2: Gingival Tissue
Layer 1: Base Tooth Images (bottom)
```

## Tooth Numbering Layout (ISO 3950)

```
        Upper Jaw
    RIGHT    |    LEFT
 18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38
    RIGHT    |    LEFT
        Lower Jaw

Deciduous (Baby Teeth):
        Upper: 55 54 53 52 51 | 61 62 63 64 65
        Lower: 85 84 83 82 81 | 71 72 73 74 75
```

## Implementation Order Flowchart

```
Phase 1: Foundation
    ↓
Phase 2: Core Charting ← CRITICAL PATH
    ↓
Phase 3: Advanced Features ← PARALLEL TRACKS
    ├─ Periodontal Probing
    ├─ Pathology Menu
    ├─ Restoration Menu
    └─ Endodontic Tests
    ↓
Phase 4: Dashboard & Reports
    ↓
Phase 5: Enhancement & Polish
```

## Critical Path (Must Build First)

```
1. ToothRenderer Component
    ↓
2. JawRow Component
    ↓
3. ChartOverview Page
    ↓
4. Click to Detail Navigation
    ↓
5. ToothDetailPage Layout
    ↓
6. Basic Tooth Data Display

Everything else builds on these 6 foundations.
```

## Feature Dependencies

```
Periodontal Probing
├── Requires: ToothDetailPage
├── Updates: chartStore.teeth[n].periodontal
└── Affects: Chart visualization (gingiva layer)

Pathology Menu
├── Requires: ToothDetailPage
├── Updates: chartStore.teeth[n].pathology
└── Affects: Chart visualization (pathology layer)

Restoration Menu
├── Requires: ToothDetailPage
├── Updates: chartStore.teeth[n].restorations
└── Affects: Chart visualization (restoration layer)

Time Travel
├── Requires: Complete chart implementation
├── Creates: Historical snapshots
└── Enables: Comparison view
```

## Responsive Breakpoints

```
Desktop (1400px+)
├── Full layout
├── 4-jaw view
└── All features visible

Laptop (1024-1399px)
├── Compact layout
├── 4-jaw view
└── Most features visible

Tablet (768-1023px)
├── 2-jaw view (upper/lower)
├── Simplified controls
└── Bottom sheets for menus

Mobile (<768px)
├── Single jaw, scrollable
├── Bottom navigation
└── Full-screen modals
```

---

This diagram provides a visual overview of how all the pieces fit together. Use it alongside the detailed JSON specifications for implementation.

