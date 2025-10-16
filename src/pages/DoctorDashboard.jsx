import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientMedicines, setPatientMedicines] = useState([]);
  const [patientActivities, setPatientActivities] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== "Doctor") {
      navigate("/");
      return;
    }
    // Always refresh the doctor profile from the backend so we get the latest
    // linked patients list after any new linking operations
    (async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/profile/${userObj.id}`);
        if (res.ok) {
          const fresh = await res.json();
          setUser(fresh);
          // Keep localStorage in sync so subsequent loads are up to date
          localStorage.setItem("user", JSON.stringify(fresh));
        } else {
          // Fallback to local copy if server profile fails temporarily
          setUser(userObj);
        }
      } catch {
        setUser(userObj);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchPatients();
      fetchSOSAlerts();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      if (user.patients && user.patients.length > 0) {
        const patientPromises = user.patients.map(async (patient) => {
          // backend returns array of populated users or ids depending on source
          const id = patient.id || patient._id || patient;
          const res = await fetch(`http://localhost:5000/api/auth/profile/${id}`);
          return await res.json();
        });
        const patientData = await Promise.all(patientPromises);
        setPatients(patientData.filter(Boolean));
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
      setPatients([]);
    }
  };

  const fetchSOSAlerts = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/sos/alerts/${user.id}`);
      const data = await res.json();
      setSosAlerts(data);
    } catch (err) {
      console.error("Error fetching SOS alerts:", err);
    }
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const [medicinesRes, activitiesRes] = await Promise.all([
        fetch(`http://localhost:5000/api/medicine/patient/${patientId}`),
        fetch(`http://localhost:5000/api/medicine/patient/${patientId}/today`)
      ]);
      
      const medicines = await medicinesRes.json();
      const activities = await activitiesRes.json();
      
      setPatientMedicines(medicines);
      setPatientActivities(activities);
    } catch (err) {
      console.error("Error fetching patient details:", err);
    }
  };

  const getAdherenceColor = (adherence) => {
    if (adherence >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (adherence >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getAdherenceStatus = (adherence) => {
    if (adherence >= 90) return "Excellent";
    if (adherence >= 70) return "Moderate";
    return "Poor";
  };

  const generateReport = async (type) => {
    try {
      if (type === 'adherence') {
        let reportData = "Patient Adherence Report:\n\n";
        for (const patient of patients) {
          const adherence = Math.floor(Math.random() * 40) + 60; // Mock data
          reportData += `${patient.name}: ${adherence}% (${getAdherenceStatus(adherence)})\n`;
        }
        alert(reportData);
      } else if (type === 'emergency') {
        alert(`Emergency Alerts Report:\n\nTotal Alerts: ${sosAlerts.length}\nActive Alerts: ${sosAlerts.filter(a => a.status === 'Active').length}`);
      } else if (type === 'export') {
        // Create CSV content for all patients
        const csvContent = [
          ['Patient Name', 'Email', 'Phone', 'Adherence Rate', 'Status'],
          ...patients.map(patient => [
            patient.name,
            patient.email,
            patient.phone || 'N/A',
            `${Math.floor(Math.random() * 40) + 60}%`,
            getAdherenceStatus(Math.floor(Math.random() * 40) + 60)
          ])
        ].map(row => row.join(',')).join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `doctor_patients_report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert("Data exported successfully!");
      }
    } catch (err) {
      alert("Error generating report: " + err.message);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600">Welcome back, Dr. {user.name}</p>
              <p className="text-sm text-blue-600">Your Code: {user.uniqueCode}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate("/")}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Patient Overview
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "alerts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                SOS Alerts {sosAlerts.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-1">
                    {sosAlerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reports"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Reports
              </button>
            </nav>
          </div>
        </div>

        {/* Patient Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Patient Overview</h2>
            {patients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No patients linked yet. Share your unique code: {user.uniqueCode}
              </div>
            ) : (
              <div className="grid gap-6">
                {patients.map((patient) => {
                  // Mock adherence calculation (in real app, calculate from actual data)
                  const adherence = Math.floor(Math.random() * 40) + 60;
  return (
                  <div key={patient.id || patient._id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{patient.name || 'Unnamed patient'}</h3>
                          <p className="text-gray-600">{patient.email || '—'}</p>
                          <p className="text-sm text-gray-500">Phone: {patient.phone || "Not provided"}</p>
                          <p className="text-sm text-gray-500">Emergency: {patient.emergencyContact || "Not provided"}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getAdherenceColor(adherence)}`}>
                            {getAdherenceStatus(adherence)} ({adherence}%)
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                fetchPatientDetails(patient.id || patient._id);
                                setActiveTab("patient-detail");
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                            >
                              View Details
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const medName = prompt('Enter medicine name to update/create');
                                  if (!medName) return;
                                  const dosage = prompt('Enter dosage (e.g., 500mg)') || '1 unit';
                                  const frequency = prompt('Enter frequency (e.g., Once daily)') || 'Once daily';
                                  const timesInput = prompt('Reminder times (comma-separated HH:MM, e.g., 08:00,20:00)', '08:00,20:00') || '';
                                  const reminderTimes = timesInput
                                    .split(',')
                                    .map(t => t.trim())
                                    .filter(t => /^\d{2}:\d{2}$/.test(t));
                                  const today = new Date().toISOString().split('T')[0];

                                  const payload = {
                                    patientId: patient.id || patient._id,
                                    name: medName,
                                    dosage,
                                    frequency,
                                    duration: '',
                                    instructions: '',
                                    startDate: today,
                                    endDate: null,
                                    reminderTimes
                                  };

                                  const res = await fetch('http://localhost:5000/api/medicine/add', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(payload)
                                  });
                                  const data = await res.json();
                                  if (!res.ok) {
                                    alert(data.message || 'Failed to update prescription');
                                    return;
                                  }
                                  alert('Prescription updated');
                                  fetchPatientDetails(patient.id || patient._id);
                                } catch (e) {
                                  alert('Error updating prescription');
                                }
                              }}
                              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                            >
                              Update Prescription
                            </button>
                          </div>
                        </div>
      </div>
    </div>
  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SOS Alerts Tab */}
        {activeTab === "alerts" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Emergency Alerts</h2>
            {sosAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active emergency alerts
              </div>
            ) : (
              <div className="grid gap-4">
                {sosAlerts.map((alert) => (
                  <div key={alert._id} className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-red-800">
                          Emergency Alert - {alert.emergencyType}
                        </h3>
                        <p className="text-red-600">Patient: {alert.patient.name}</p>
                        <p className="text-sm text-red-500">
                          Time: {new Date(alert.timestamp).toLocaleString()}
                        </p>
                        {alert.location && (
                          <p className="text-sm text-red-500">
                            Location: {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                          </p>
                        )}
                        {alert.notes && (
                          <p className="text-sm text-red-500 mt-2">Notes: {alert.notes}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            // Handle SOS response
                            fetch(`http://localhost:5000/api/sos/${alert._id}/respond`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: user.id, notes: "Responded by doctor" })
                            }).then(() => {
                              fetchSOSAlerts();
                            });
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                        >
                          Respond
                        </button>
                        <button
                          onClick={() => {
                            if (!alert.location) return;
                            const lat = alert.location.latitude;
                            const lng = alert.location.longitude;
                            const url = `https://www.google.com/maps?q=${lat},${lng}`;
                            window.open(url, '_blank');
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                        >
                          View Location
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Patient Detail View */}
        {activeTab === "patient-detail" && selectedPatient && (
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={() => setActiveTab("overview")}
                className="mr-4 text-blue-600 hover:text-blue-800"
              >
                ← Back to Overview
              </button>
              <h2 className="text-xl font-semibold">Patient Details: {selectedPatient.name}</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Medicines */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Current Medications</h3>
                {patientMedicines.length === 0 ? (
                  <p className="text-gray-500">No medications found</p>
                ) : (
                  <div className="space-y-3">
                    {patientMedicines.map((medicine) => (
                      <div key={medicine._id} className="border rounded p-3">
                        <h4 className="font-medium">{medicine.name}</h4>
                        <p className="text-sm text-gray-600">{medicine.dosage} - {medicine.frequency}</p>
                        <p className="text-sm text-gray-500">{medicine.instructions}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Today's Activities */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Today's Medication Status</h3>
                {patientActivities.length === 0 ? (
                  <p className="text-gray-500">No activities for today</p>
                ) : (
                  <div className="space-y-3">
                    {patientActivities.map((activity) => (
                      <div key={activity._id} className="border rounded p-3">
                        <div className="flex justify-between items-center">
        <div>
                            <h4 className="font-medium">{activity.name}</h4>
                            <p className="text-sm text-gray-600">{activity.dosage}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-sm ${
                            activity.status === "Taken" ? "bg-green-100 text-green-800" :
                            activity.status === "Missed" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
        <div>
            <h2 className="text-xl font-semibold mb-4">Generate Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Patient Adherence Report</h3>
                <p className="text-gray-600">Generate comprehensive adherence reports for all patients</p>
                <button 
                  onClick={() => generateReport('adherence')}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Generate Report
                </button>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Emergency Alerts Report</h3>
                <p className="text-gray-600">Export emergency alert history and response times</p>
                <button 
                  onClick={() => generateReport('emergency')}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Generate Report
                </button>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Export All Data</h3>
                <p className="text-gray-600">Download all patient data as CSV or PDF</p>
                <button 
                  onClick={() => generateReport('export')}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Export Data
                </button>
        </div>
            </div>
        </div>
        )}
      </div>
    </div>
  );
}
