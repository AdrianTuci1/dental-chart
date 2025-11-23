import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PatientsListPage from './pages/PatientsListPage';
import PatientLayout from './components/PatientLayout';
import PatientDashboardPage from './pages/PatientDashboardPage';
import PatientReportPage from './pages/PatientReportPage';
import PatientChartPage from './pages/PatientChartPage';
import ToothDetailPage from './pages/ToothDetailPage';

// Chart sub-components
import ChartOverview from './components/Chart/ChartOverview';
import ChartQuickselect from './components/Chart/ChartQuickselect';
import ChartPeriodontalProbing from './components/Chart/ChartPeriodontalProbing';
import ChartPathology from './components/Chart/ChartPathology';
import ChartRestoration from './components/Chart/ChartRestoration';

// Tooth sub-components
import ToothOverview from './components/Tooth/ToothOverview';
import ToothEndodontic from './components/Tooth/ToothEndodontic';
import ToothPeriodontal from './components/Tooth/ToothPeriodontal';
import ToothPathology from './components/Tooth/ToothPathology';
import ToothRestoration from './components/Tooth/ToothRestoration';

import './App.css'


function App() {
  return (
    <BrowserRouter>
      <div className="application">
        <div className="">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/patients" element={<PatientsListPage />} />

            <Route path="/patients/:patientId" element={<PatientLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PatientDashboardPage />} />
              <Route path="report" element={<PatientReportPage />} />

              <Route path="chart" element={<PatientChartPage />}>
                <Route index element={<ChartOverview />} />
                <Route path="overview/:view?" element={<ChartOverview />} />
                <Route path="quickselect/:view?" element={<ChartQuickselect />} />
                <Route path="periodontal-probing/:view?" element={<ChartPeriodontalProbing />} />
                <Route path="pathology/:view?" element={<ChartPathology />} />
                <Route path="restoration/:view?" element={<ChartRestoration />} />
                <Route path=":view" element={<ChartOverview />} />
              </Route>

              <Route path="tooth/:toothNumber" element={<ToothDetailPage />}>
                <Route index element={<ToothOverview />} />
                <Route path="endodontic" element={<ToothEndodontic />} />
                <Route path="periodontal/:site?" element={<ToothPeriodontal />} />
                <Route path="pathology/:type?" element={<ToothPathology />} />
                <Route path="restoration/:type?" element={<ToothRestoration />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </div>
    </BrowserRouter >
  );
}

export default App;
