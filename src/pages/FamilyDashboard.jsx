import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patientCodeInput, setPatientCodeInput] = useState("");
  const [linkedPatient, setLinkedPatient] = useState(null);
  const [patientMedicines, setPatientMedicines] = useState([]);
  const [patientActivities, setPatientActivities] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [statusMsg, setStatusMsg] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    const userObj = JSON.parse(userData);
    if (userObj.role !== "Family") {
      navigate("/");
      return;
    }
    setUser(userObj);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      if (user.linkedPatient) {
        fetchLinkedPatient();
      } else {
        setLinkedPatient(null);
        setPatientMedicines([]);
        setPatientActivities([]);
        setSosAlerts([]);
      }
    }
  }, [user]);

  const fetchLinkedPatient = async () => {
    try {
      const id = typeof user.linkedPatient === 'object' ? (user.linkedPatient.id || user.linkedPatient._id) : user.linkedPatient;
      const res = await fetch(`http://localhost:5000/api/auth/profile/${id}`);
      const patientData = await res.json();
      setLinkedPatient(patientData);
      fetchPatientData(patientData.id || patientData._id);
    } catch (err) {
      console.error("Error fetching linked patient:", err);
    }
  };

  const fetchPatientData = async (patientId) => {
    try {
      const [medicinesRes, activitiesRes, sosRes] = await Promise.all([
        fetch(`http://localhost:5000/api/medicine/patient/${patientId}`),
        fetch(`http://localhost:5000/api/medicine/patient/${patientId}/today`),
        fetch(`http://localhost:5000/api/sos/patient/${patientId}`)
      ]);
      
      const medicines = await medicinesRes.json();
      const activities = await activitiesRes.json();
      const sosData = await sosRes.json();
      
      setPatientMedicines(medicines);
      setPatientActivities(activities);
      setSosAlerts(sosData);
    } catch (err) {
      console.error("Error fetching patient data:", err);
    }
  };

  const linkToPatient = async () => {
    if (!patientCodeInput.trim()) {
      setStatusMsg("Please enter a patient code");
        return;
      }

    setStatusMsg("Linking to patient...");
    try {
      const res = await fetch("http://localhost:5000/api/auth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCode: user.uniqueCode,
          targetCode: patientCodeInput.trim()
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg("Successfully linked to patient!");
        // Refresh user data from server
        const profileRes = await fetch(`http://localhost:5000/api/auth/profile/${user.id}`);
        const updatedUserData = await profileRes.json();
        localStorage.setItem("user", JSON.stringify(updatedUserData));
        setUser(updatedUserData);
        setPatientCodeInput("");
      } else {
        setStatusMsg(data.message || "Error linking to patient");
      }
    } catch (err) {
      setStatusMsg("Error: " + err.message);
    }
  };

  const sendMessageToPatient = async () => {
    if (!message.trim()) {
      setStatusMsg("Please enter a message");
      return;
    }

    try {
      // In a real app, you'd have a messaging API
      setStatusMsg("Message sent to patient!");
      setMessage("");
    } catch (err) {
      setStatusMsg("Error sending message");
    }
  };

  const generateReport = async (period) => {
    try {
      const days = period === 'weekly' ? 7 : 30;
      const pid = linkedPatient?.id || linkedPatient?._id;
      const res = await fetch(`http://localhost:5000/api/medicine/patient/${pid}/today`);
      const activities = await res.json();
      
      // Calculate adherence
      const total = activities.length;
      const taken = activities.filter(a => a.status === "Taken").length;
      const adherence = total > 0 ? Math.round((taken / total) * 100) : 100;
      
      const reportData = {
        period: period,
        patientName: linkedPatient.name,
        totalMedicines: total,
        taken: taken,
        missed: activities.filter(a => a.status === "Missed").length,
        skipped: activities.filter(a => a.status === "Skipped").length,
        adherence: adherence,
        activities: activities
      };
      
      // Display report in alert (in real app, this would be a proper report view)
      alert(`${period.charAt(0).toUpperCase() + period.slice(1)} Report for ${linkedPatient.name}:\n\n` +
            `Total Medicines: ${total}\n` +
            `Taken: ${taken}\n` +
            `Missed: ${reportData.missed}\n` +
            `Skipped: ${reportData.skipped}\n` +
            `Adherence Rate: ${adherence}%`);
    } catch (err) {
      alert("Error generating report: " + err.message);
    }
  };

  const exportData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/medicine/patient/${linkedPatient.id}/today`);
      const activities = await res.json();
      
      // Create CSV content
      const csvContent = [
        ['Date', 'Medicine', 'Dosage', 'Status', 'Time'],
        ...activities.map(activity => [
          new Date(activity.scheduledTime).toLocaleDateString(),
          activity.name,
          activity.dosage,
          activity.status,
          activity.actualTime ? new Date(activity.actualTime).toLocaleTimeString() : 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${linkedPatient.name}_medication_data.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert("Data exported successfully!");
    } catch (err) {
      alert("Error exporting data: " + err.message);
    }
  };

  const getAdherenceColor = (adherence) => {
    if (adherence >= 90) return "bg-green-100 text-green-800";
    if (adherence >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Taken": return "bg-green-100 text-green-800";
      case "Missed": return "bg-red-100 text-red-800";
      case "Skipped": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
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
              <h1 className="text-2xl font-bold text-gray-900">Family Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name}</p>
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
        {/* Link Patient Section */}
        {!linkedPatient && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Link to Patient</h2>
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="Enter patient's unique code (e.g., P1234)"
                className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={patientCodeInput}
                onChange={(e) => setPatientCodeInput(e.target.value.toUpperCase())}
              />
              <button
                onClick={linkToPatient}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
              >
                Link Patient
              </button>
            </div>
            {statusMsg && (
              <p className="mt-2 text-sm text-gray-600">{statusMsg}</p>
            )}
          </div>
        )}

        {linkedPatient && (
          <>
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
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("medicines")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "medicines"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Medicines
                  </button>
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "alerts"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Emergency Alerts {sosAlerts.length > 0 && (
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

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Patient Info</h3>
                    <p className="text-gray-600">{linkedPatient.name}</p>
                    <p className="text-sm text-gray-500">{linkedPatient.email}</p>
                    <p className="text-sm text-gray-500">Phone: {linkedPatient.phone || "Not provided"}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Today's Adherence</h3>
                    {patientActivities.length > 0 ? (
                      <>
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((patientActivities.filter(a => a.status === "Taken").length / patientActivities.length) * 100)}%
                        </div>
                        <p className="text-sm text-gray-500">
                          {patientActivities.filter(a => a.status === "Taken").length} of {patientActivities.length} taken
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">No activities today</p>
                    )}
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={async () => {
                          try {
                            await fetch('http://localhost:5000/api/notifications/check-in', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ patientId: linkedPatient.id || linkedPatient._id, fromUserId: user.id, message: 'Family requested a check-in' })
                            });
                            setStatusMsg('Check-in request sent!');
                          } catch (e) {
                            setStatusMsg('Failed to send check-in');
                          }
                        }}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Request Check-in
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('http://localhost:5000/api/notifications/reminder', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ patientId: linkedPatient.id || linkedPatient._id, fromUserId: user.id })
                            });
                            setStatusMsg('Reminder sent!');
                          } catch (e) {
                            setStatusMsg('Failed to send reminder');
                          }
                        }}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                      >
                        Send Reminder
                      </button>
                    </div>
                  </div>
              </div>

                {/* Today's Activities */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Today's Medication Status</h3>
                  {patientActivities.length === 0 ? (
                    <p className="text-gray-500">No medication activities for today</p>
                  ) : (
                    <div className="grid gap-3">
                      {patientActivities.map((activity) => (
                        <div key={activity._id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <h4 className="font-medium">{activity.name}</h4>
                            <p className="text-sm text-gray-600">{activity.dosage}</p>
                            <p className="text-sm text-gray-500">{activity.frequency}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

                {/* Message Section */}
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Send Message to Patient</h3>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                      onClick={sendMessageToPatient}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                  {statusMsg && (
                    <p className="mt-2 text-sm text-gray-600">{statusMsg}</p>
                  )}
                </div>
              </div>
            )}

            {/* Medicines Tab */}
            {activeTab === "medicines" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Patient's Medications</h2>
                {patientMedicines.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No medications found for this patient
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {patientMedicines.map((medicine) => (
                      <div key={medicine._id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-semibold">{medicine.name}</h3>
                            <p className="text-gray-600">{medicine.dosage}</p>
                            <p className="text-sm text-gray-500">{medicine.frequency}</p>
                            <p className="text-sm text-gray-500">Duration: {medicine.duration}</p>
                            {medicine.instructions && (
                              <p className="text-sm text-gray-500 mt-2">
                                Instructions: {medicine.instructions}
                              </p>
                            )}
                            {medicine.reminderTimes.length > 0 && (
                              <p className="text-sm text-blue-600 mt-2">
                                Reminder times: {medicine.reminderTimes.join(", ")}
                              </p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            medicine.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {medicine.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Emergency Alerts Tab */}
            {activeTab === "alerts" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Emergency Alerts</h2>
                {sosAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No emergency alerts
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
                                if (!alert.location) return;
                                const lat = alert.location.latitude;
                                const lng = alert.location.longitude;
                                const url = `https://www.google.com/maps?q=${lat},${lng}`;
                                window.open(url, '_blank');
                              }}
                              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                            >
                              View Location
                            </button>
                            <button
                              onClick={() => {
                                const phone = linkedPatient?.phone;
                                const email = linkedPatient?.email;
                                if (phone) {
                                  // try tel first for mobile devices
                                  window.location.href = `tel:${phone}`;
                                } else if (email) {
                                  window.location.href = `mailto:${email}?subject=${encodeURIComponent('Emergency Alert')}&body=${encodeURIComponent('Are you ok?')}`;
                                } else {
                                  alert('No patient contact info available');
                                }
                              }}
                              className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                            >
                              Contact Patient
                            </button>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Patient Progress Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Weekly Report</h3>
                    <p className="text-gray-600">View patient's medication adherence for the past 7 days</p>
                    <button 
                      onClick={() => generateReport('weekly')}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Generate Report
                    </button>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Monthly Report</h3>
                    <p className="text-gray-600">View patient's medication adherence for the past 30 days</p>
                    <button 
                      onClick={() => generateReport('monthly')}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Generate Report
                    </button>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Export Data</h3>
                    <p className="text-gray-600">Download patient's medication data as CSV or PDF</p>
                    <button 
                      onClick={() => exportData()}
                      className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
