# Quick Start Guide for LLMs

## Overview
This directory contains a **complete specification** for building a professional dental charting application using **React + Vite**. Everything an LLM needs to implement this application is provided in structured JSON files.

## What You Have

### 📋 Core Specifications
1. **app-structure.json** - Overall architecture, routing, state management
2. **data-models.json** - Complete data structures and schemas
3. **asset-naming-convention.json** - Image asset organization system

### 🛣️ Route Specifications (routes/)
- **home.json** - Landing/sign-in page
- **patients-list.json** - Patient listing and search
- **patient-dashboard.json** - Treatment plans, metrics, medical history
- **patient-chart.json** - Main dental chart (4-jaw view)
- **tooth-detail.json** - Individual tooth examination
- **patient-report.json** - Report generation and export

### ✨ Feature Specifications (features/)
- **periodontal-probing.json** - Detailed periodontal measurements
- **pathology-menu.json** - Pathology tracking interface
- **restoration-menu.json** - Dental restoration planning
- **endodontic-tests.json** - Pulp vitality testing
- **oral-health-metrics.json** - Dashboard health indicators
- **time-travel.json** - Historical chart viewing
- **chart-views.json** - Display modes and layer system

### 📚 Additional Files
- **IMPLEMENTATION_GUIDE.json** - Step-by-step implementation phases
- **README.md** - Overview and usage instructions

## How to Use This Specification

### For LLMs Building the App

1. **Start with app-structure.json**
   - Understand routing structure
   - Review state management approach
   - Note the design system (colors, typography)

2. **Review data-models.json**
   - Understand tooth numbering (ISO 3950)
   - Learn data structures for teeth, patients, charts
   - Note all enums and constants

3. **Check asset-naming-convention.json**
   - Understand how tooth images are named
   - Learn mirroring rules
   - Note required assets (330 total)

4. **Review SVG_OVERLAY_SYSTEM.json**
   - Understand how to color tooth surfaces with SVG
   - Learn the hybrid PNG + SVG approach
   - See examples in SVG_EXAMPLES.md

5. **Read IMPLEMENTATION_GUIDE.json**
   - Follow 11 implementation phases
   - Start with Phase 1 (project setup)
   - Prioritize critical components

6. **Implement Route by Route**
   - Each route JSON has complete component specifications
   - Follow layout, styling, and functionality requirements
   - Use provided data models

7. **Add Features**
   - Each feature JSON has detailed specifications
   - Implement interactions and validations
   - Connect to state management

## Key Concepts

### Tooth Numbering (ISO 3950 / FDI)
```
Upper Right: 18-11  |  Upper Left: 21-28
Lower Right: 48-41  |  Lower Left: 31-38
```

### Image Asset Pattern
```
Format: iso{toothNumber}-{view}-{state}.png
Examples:
  - iso11-frontal.png (central incisor, front view, normal)
  - iso24-topview-implant.png (first premolar, top view, implant)
  - iso16-lingual-missing.png (first molar, back view, missing)
```

### Mirroring Rules
- Upper right (11-18): Original images
- Upper left (21-28): **Mirrored** horizontally
- Lower right (41-48): Original images
- Lower left (31-38): **Mirrored** horizontally

### State Management (Zustand)
5 stores:
- **authStore** - Authentication
- **patientStore** - Patient data
- **chartStore** - Dental chart state
- **toothStore** - Individual tooth data
- **dashboardStore** - Dashboard metrics

### View Toggles (Global Sidebar)
- **Endo** - Show/hide endodontic indicators
- **Perio** - Show/hide periodontal data
- **Dental** - Show/hide restorations/pathology

## Implementation Priority

### Phase 1-3: Foundation (MUST DO FIRST)
✅ Project setup  
✅ Data models  
✅ Authentication  
✅ Patient list  

### Phase 4-6: Core Features (HIGH PRIORITY)
🔥 Dashboard with metrics  
🔥 Chart visualization (4-jaw view)  
🔥 Tooth detail view  

### Phase 7-8: Advanced Features (HIGH PRIORITY)
🔥 Periodontal probing  
🔥 Pathology menu  
🔥 Restoration menu  

### Phase 9-11: Enhancement Features
⭐ Time travel  
⭐ Reports  
⭐ Polish & refinement  

## Critical Components

These are the backbone of the application:

1. **ToothRenderer** - Renders individual teeth with overlays
2. **JawRow** - Displays row of teeth (buccal/occlusal views)
3. **ChartOverview** - Main 4-jaw chart view
4. **PeriodontalProbing** - 6-site measurement interface
5. **PathologyMenu** - Pathology selection and tracking
6. **RestorationMenu** - Restoration planning

## Example: Building the Chart View

```javascript
// 1. Read routes/patient-chart.json
// 2. Understand layout: 4 rows (upper buccal, upper occlusal, lower occlusal, lower buccal)
// 3. For each row, render teeth using ToothRenderer
// 4. Apply correct image view (frontal/topview)
// 5. Show tooth numbers above/below
// 6. Add click handlers to navigate to tooth detail
// 7. Implement layer system for overlays
// 8. Connect view toggles to show/hide layers
```

## Data Flow Example

```
User clicks tooth 24 on chart
  ↓
ChartOverview handles click
  ↓
Navigate to /patients/123/tooth/24
  ↓
ToothDetailPage loads
  ↓
Fetch tooth data from chartStore
  ↓
Display 3-plane view + tabs
  ↓
User selects "Periodontal" tab
  ↓
Load PeriodontalProbing component
  ↓
Show 6-site measurements
  ↓
User updates probing depth
  ↓
Save to toothStore
  ↓
Update visual indicators on chart
```

## Asset Requirements

Before starting, ensure you have (or can generate placeholders for):

- **Permanent teeth**: 16 teeth × 3 views × 5 states = 240 images
- **Deciduous teeth**: 10 teeth × 3 views × 3 states = 90 images
- **Total**: 330 tooth images

**Views**: frontal, topview, lingual  
**States**: default, noroots, missing, implant, implant-noroots

## Color Palette (Use Consistently)

```css
--primary-blue: #00A3E0
--sidebar-blue: #0083B8
--success: #00C851
--warning: #FFD700
--error: #FF4444
--purple: #9575CD
--cyan: #4DD0E1
```

## Validation Rules

- Tooth numbers: 11-18, 21-28, 31-38, 41-48 (permanent) + deciduous
- Probing depth: 0-12mm (or >12)
- Gingival margin: -12 to +12mm
- EPT: 0-10
- All dates: ISO format
- All IDs: UUIDs

## Testing Checklist

- [ ] Can add/edit/delete patients
- [ ] Chart displays all 4 jaw views
- [ ] Can click tooth to see detail
- [ ] Can add periodontal measurements
- [ ] Can mark pathology
- [ ] Can add restorations
- [ ] View toggles work (endo/perio/dental)
- [ ] Time travel loads historical charts
- [ ] Reports generate and export
- [ ] Responsive on mobile/tablet/desktop

## Next Steps

1. **Read IMPLEMENTATION_GUIDE.json** for detailed phase-by-phase instructions
2. **Start with Phase 1** - Project setup and dependencies
3. **Follow each phase sequentially** - Don't skip ahead
4. **Reference route/feature JSONs** as you implement each section
5. **Test frequently** - Verify each component works before moving on

## Questions to Ask Yourself

✅ Have I read app-structure.json completely?  
✅ Do I understand the tooth numbering system?  
✅ Do I know how assets are named and loaded?  
✅ Have I reviewed the data models?  
✅ Am I following the implementation phases in order?  
✅ Am I testing each component as I build?  

## Support Resources

- **Dental terminology**: Reference data-models.json enums
- **UI patterns**: Check individual route JSONs for component specs
- **Styling**: Use design system from app-structure.json
- **State management**: Review store definitions in app-structure.json
- **Visual reference**: Screenshots in /public/ directory

---

## Ready to Build?

Start with **IMPLEMENTATION_GUIDE.json Phase 1** and work through sequentially. Each JSON file is designed to be self-contained but references others when needed. Good luck! 🦷✨

