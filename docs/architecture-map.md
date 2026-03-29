# DChart Architecture Map

## How To Use

- Open this file with `Markmap: Open as mindmap` in VS Code for a navigable overview.
- Use CodeGraphy for the import graph, and use this map for architectural intent.
- Read from top to bottom: `pages -> layout -> components -> core/store -> api/server`.

## Application Entry

- `src/main.jsx`
  - Boots React.
  - Mounts the app shell.
- `src/App.jsx`
  - Defines the main routing tree.
  - Connects pages, layouts, and feature routes.

## Main Navigation

- `src/pages/HomePage.jsx`
  - Landing / home entry.
- `src/pages/PatientsListPage.jsx`
  - Patient list and selection flow.
- `src/components/PatientLayout.jsx`
  - Loads the full patient context.
  - Wraps all patient-scoped pages.
  - Feeds chart, dashboard, and tooth detail routes.

## Patient Scope

- `src/components/PatientSidebar.jsx`
  - Patient-level navigation.
  - Entry point toward dashboard, chart, report.
- `src/pages/PatientDashboardPage.jsx`
  - Summary surface for patient data.
  - Uses dashboard components like treatment plan and BPE.
- `src/pages/PatientChartPage.jsx`
  - Main dental chart workspace.
  - Hosts chart modes: overview, quickselect, pathology, restoration, perio.
- `src/pages/ToothDetailPage.jsx`
  - Single tooth workspace.
  - Shares preview state with pathology/restoration views.
- `src/pages/PatientReportPage.jsx`
  - Reporting / history oriented patient view.

## Chart Layer

- `src/components/Chart/ChartOverview.jsx`
  - General chart rendering entry.
- `src/components/Chart/ChartQuickselect.jsx`
  - Batch actions on selected teeth.
  - Opens endodontic, development, restoration drawers.
- `src/components/Chart/ChartPathology.jsx`
  - Pathology flow at chart level.
  - Maintains local preview teeth before save.
- `src/components/Chart/ChartRestoration.jsx`
  - Restoration flow at chart level.
  - Maintains local preview teeth before save.
- `src/components/Chart/views/NormalView.jsx`
  - Full-mouth view.
  - Shows endodontic indicators above/below teeth.
- `src/components/Chart/views/UpperJawView.jsx`
  - Upper jaw focused rendering.
- `src/components/Chart/views/LowerJawView.jsx`
  - Lower jaw focused rendering.
- `src/components/Chart/views/JawTooth.jsx`
  - Per-tooth rendering wrapper inside chart views.
  - Computes active conditions from tooth data + treatment plan.
- `src/components/Chart/ToothRenderer.jsx`
  - Renders tooth base image + overlay mask.
- `src/components/Chart/ToothMask.jsx`
  - Paints overlays for restorations, pathology, apical, endo.

## Tooth Detail Layer

- `src/pages/ToothDetailPage.jsx`
  - Source of `previewData` for live tooth preview.
  - Passes current tooth through `Outlet` context.
- `src/components/Tooth/ToothOverview.jsx`
  - Main per-tooth summary.
  - Connects endodontic tests, periodontal section, quick actions.
- `src/components/Tooth/ToothVisualization.jsx`
  - Large tooth visualizer for the selected tooth.
  - Supports `overrideToothData` for live preview.
- `src/components/Tooth/ToothPathology.jsx`
  - Tooth-level pathology flow.
  - Builds preview state without persisting until save.
- `src/components/Tooth/ToothRestoration.jsx`
  - Tooth-level restoration flow.
  - Builds preview state without persisting until save.
- `src/components/Tooth/ToothEndodontic.jsx`
  - Structured endodontic tests editor.
- `src/components/Tooth/EndodonticSection.jsx`
  - Summary list of endodontic tests and results.
- `src/components/Tooth/ToothPeriodontal.jsx`
  - Periodontal editing surface.
- `src/components/Tooth/PeriodontalSection.jsx`
  - Summary / entry point to perio data.
- `src/components/Tooth/ToothZones.jsx`
  - Interactive zone pad.
  - Selection is visual only until feature save.

## Drawer Layer

- `src/components/Drawers/PathologyDrawer/PathologyDrawer.jsx`
  - Chart-level pathology workflow.
  - Sends local preview changes upward.
- `src/components/Drawers/RestorationDrawer/RestorationDrawer.jsx`
  - Chart-level restoration workflow.
  - Sends local preview changes upward.
- `src/components/Drawers/EndodonticDrawer.jsx`
  - Quickselect batch editing for endodontic tests.
- `src/components/Drawers/DevelopmentDrawer.jsx`
  - Quickselect development / tooth stage flow.

## Dashboard Layer

- `src/components/Dashboard/TreatmentPlan.jsx`
  - Shows grouped treatment plan items.
  - Includes empty state when no treatments exist.
- Other dashboard widgets
  - BPE
  - oral health
  - history summaries
  - patient-level metadata

## Core Architecture

### Facade

- `src/core/AppFacade.js`
  - Main orchestration layer.
  - Central place for patient/chart updates and syncing behavior.
  - Frontend features should call here instead of hitting API ad hoc.

### Store

- `src/core/store/appStore.js`
  - Zustand entry for app state.
- `src/core/store/slices/chartSlice.js`
  - Tooth/chart mutations.
  - Selection and chart hydration.
- `src/core/store/slices/patientSlice.js`
  - Selected patient, treatment plan, history, patient metadata.

### Models

- `src/core/models/ChartModel.js`
  - Projects tooth state from history + treatment plan + backend chart.
  - Critical for sync correctness.
- `src/core/models/ToothModel.js`
  - Canonical tooth normalization and updates.
- `src/core/models/PatientModel.js`
  - Patient-level normalization and list/history/treatment-plan rules.

### Adapters And Builders

- `src/core/adapters/PatientAdapter.js`
  - Maps API patient payloads into frontend normalized shape.
- `src/core/builders/ToothBuilder.js`
  - Initializes tooth structures.

## API Layer

- `src/api/patientService.js`
  - Patient CRUD and update requests.
- `src/api/chartService.js`
  - Chart persistence operations.
- `src/api/toothService.js`
  - Tooth-level API calls if needed.
- `src/api/apiClient.js`
  - Shared HTTP client.

## Utility Layer

- `src/utils/toothUtils.js`
  - Maps tooth domain data to visual conditions.
  - Critical for pathology/restoration mask coloring.
- `src/utils/toothPreviewBuilders.js`
  - Shared preview builders for pathology/restoration.
  - Prevents duplication between drawers and tooth pages.
- `src/utils/endoUtils.js`
  - Endodontic normalization, display rules, endo overlay helpers.
- `src/utils/toothOverlayMapping.js`
  - Maps zones and conditions to SVG overlay assets.
- `src/utils/toothMaskTransforms.js`
  - View-specific transform rules for overlays.
- `src/utils/endoDiagnosis.js`
  - Suggested pulpal diagnosis rules.
- `src/utils/apicalConfig.js`
  - Apical marker positions.
- `src/utils/mockData.js`
  - Reference dataset useful for testing visual states.

## Legacy Domain Models

- `src/models/DentalModels.js`
  - Enumerations / dental domain constants still used by rendering and mock data.
- `src/models/Enums.js`
  - Shared enum values like tooth zones.
- `src/models/WaveInteractionModel.js`
  - Periodontal wave visualizer model.
- `src/models/PeriodontalFacade.js`
  - Older perio helper layer still used by some flows.

## Backend

- `server/src/services/PatientService.js`
  - Backend source of truth for patient create/update/load.
  - Returns the full updated patient record after mutations.
- `server/src`
  - API handlers, services, persistence, tests.

## Data Flow

- UI event
  - Drawer or tooth page edits local form state.
- Preview
  - `toothPreviewBuilders` builds temporary tooth projection.
  - Chart or tooth page renders preview without backend persistence.
- Save
  - Feature calls `AppFacade`.
  - Store updates normalized patient + tooth state.
  - API service sends backend update.
- Rehydration
  - `PatientAdapter` normalizes server payload.
  - `ChartModel` reprojects final tooth state.

## Feature Map

### Restoration

- Entry files
  - `src/components/Chart/ChartRestoration.jsx`
  - `src/components/Tooth/ToothRestoration.jsx`
  - `src/components/Drawers/RestorationDrawer/RestorationDrawer.jsx`
- Shared dependencies
  - `src/utils/toothPreviewBuilders.js`
  - `src/utils/toothUtils.js`
  - `src/core/AppFacade.js`
  - `src/core/models/ChartModel.js`

### Pathology

- Entry files
  - `src/components/Chart/ChartPathology.jsx`
  - `src/components/Tooth/ToothPathology.jsx`
  - `src/components/Drawers/PathologyDrawer/PathologyDrawer.jsx`
- Shared dependencies
  - `src/utils/toothPreviewBuilders.js`
  - `src/utils/toothUtils.js`
  - `src/core/AppFacade.js`
  - `src/core/models/ChartModel.js`

### Endodontic

- Entry files
  - `src/components/Tooth/ToothEndodontic.jsx`
  - `src/components/Tooth/EndodonticSection.jsx`
  - `src/components/Drawers/EndodonticDrawer.jsx`
  - `src/components/Chart/views/NormalView.jsx`
- Shared dependencies
  - `src/utils/endoUtils.js`
  - `src/utils/endoDiagnosis.js`
  - `src/utils/toothOverlayMapping.js`

### Periodontal

- Entry files
  - `src/components/Tooth/ToothPeriodontal.jsx`
  - `src/components/Tooth/PeriodontalSection.jsx`
  - `src/components/Chart/ChartPeriodontalProbing.jsx`
- Shared dependencies
  - `src/models/PeriodontalFacade.js`
  - `src/models/WaveInteractionModel.js`
  - `src/core/models/ChartModel.js`

### Dashboard

- Entry files
  - `src/pages/PatientDashboardPage.jsx`
  - `src/components/Dashboard/TreatmentPlan.jsx`
- Shared dependencies
  - `src/core/store/slices/patientSlice.js`
  - `src/core/AppFacade.js`

## Recommended Reading Order

- Start with `src/App.jsx`
- Then `src/components/PatientLayout.jsx`
- Then `src/pages/PatientChartPage.jsx` and `src/pages/ToothDetailPage.jsx`
- Then `src/core/AppFacade.js`
- Then `src/core/store/slices/chartSlice.js`
- Then `src/core/store/slices/patientSlice.js`
- Then `src/core/models/ChartModel.js`
- Then `src/core/models/ToothModel.js`
- Then feature files for pathology/restoration/endodontic

## Hotspots

- Sync hotspot
  - `src/core/AppFacade.js`
  - `src/core/models/ChartModel.js`
  - `src/core/adapters/PatientAdapter.js`
- Visual hotspot
  - `src/utils/toothUtils.js`
  - `src/components/Chart/ToothMask.jsx`
  - `src/utils/toothOverlayMapping.js`
- Feature hotspot
  - pathology / restoration drawers and tooth detail pages
- Patient hydration hotspot
  - `src/components/PatientLayout.jsx`
  - `src/core/store/slices/patientSlice.js`
