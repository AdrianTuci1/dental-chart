import React from 'react';
import { useParams } from 'react-router-dom';
import usePatientStore from '../store/patientStore';
import { Printer, Download, Mail } from 'lucide-react';

import './PatientReportPage.css';

const PatientReportPage = () => {
    const { patientId } = useParams();
    const { selectedPatient } = usePatientStore();

    if (!selectedPatient) return <div>Loading...</div>;

    return (
        <div className="report-container">
            <div className="report-header">
                <h1 className="report-title">Patient Report</h1>
                <div className="report-actions">
                    <button className="action-btn">
                        <Printer size={18} /> Print
                    </button>
                    <button className="action-btn">
                        <Download size={18} /> PDF
                    </button>
                    <button className="action-btn-primary">
                        <Mail size={18} /> Email
                    </button>
                </div>
            </div>

            <div className="report-card">
                <div className="clinic-header">
                    <div>
                        <h2 className="clinic-name">Dental Clinic</h2>
                        <p className="clinic-info">123 Smile Avenue, Tooth City</p>
                        <p className="clinic-info">Phone: (555) 123-4567</p>
                    </div>
                    <div className="report-meta">
                        <h3 className="report-meta-title">Examination Report</h3>
                        <p className="report-meta-date">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="section-container">
                    <h4 className="section-title">Patient Details</h4>
                    <div className="patient-details-grid">
                        <div>
                            <p className="detail-label">Name</p>
                            <p className="detail-value">{selectedPatient.fullName}</p>
                        </div>
                        <div>
                            <p className="detail-label">Date of Birth</p>
                            <p className="detail-value">{selectedPatient.dateOfBirth}</p>
                        </div>
                        <div>
                            <p className="detail-label">Patient ID</p>
                            <p className="detail-value">{selectedPatient.id}</p>
                        </div>
                        <div>
                            <p className="detail-label">Email</p>
                            <p className="detail-value">{selectedPatient.email}</p>
                        </div>
                    </div>
                </div>

                <div className="section-container">
                    <h4 className="section-title">Treatment Plan Summary</h4>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Tooth</th>
                                <th>Procedure</th>
                                <th className="text-right">Cost</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>18</td>
                                <td>Extraction</td>
                                <td className="text-right">$150.00</td>
                                <td>Proposed</td>
                            </tr>
                            <tr>
                                <td>24</td>
                                <td>MOD Composite</td>
                                <td className="text-right">$200.00</td>
                                <td>Accepted</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} className="text-right">Total</td>
                                <td className="text-right">$350.00</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="section-container">
                    <h4 className="section-title">Notes</h4>
                    <p className="notes-content">
                        Patient presented with sensitivity in upper right quadrant. Examination revealed caries on tooth 24.
                        Extraction recommended for tooth 18 due to severe decay.
                    </p>
                </div>

                <div className="report-footer">
                    <div>
                        <p className="doctor-name">Dr. Demo Dentist</p>
                        <p className="doctor-license">License #123456</p>
                    </div>
                    <div className="text-right">
                        <div className="signature-line"></div>
                        <p className="signature-label">Signature</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientReportPage;
