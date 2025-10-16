import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddMedicineForm from "../components/AddMedicineForm";
import MedicineCard from "../components/MedicineCard";
import SOSButton from "../components/SOSButton";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [todayMedicines, setTodayMedicines] = useState([]);
  const [activeTab, setActiveTab] = useState("today");
  const [showAddForm, setShowAddForm] = useState(false);
  const [adherenceStats, setAdherenceStats] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchMedicines();
      fetchTodayMedicines();
    }
  }, [user]);

  const fetchMedicines = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/medicine/patient/${user.id}`);
      const data = await res.json();
      setMedicines(data);
    } catch (err) {
      console.error("Error fetching medicines:", err);
    }
  };

  const fetchTodayMedicines = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/medicine/patient/${user.id}/today`);
      const data = await res.json();
      setTodayMedicines(data);
    } catch (err) {
      console.error("Error fetching today's medicines:", err);
    }
  };

  const handleMedicineAction = async (medicineId, action, notes = "") => {
    try {
      const res = await fetch(`http://localhost:5000/api/medicine/${medicineId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user.id,
          status: action,
          notes,
          location: await getCurrentLocation()
        }),
      });

      if (res.ok) {
        fetchTodayMedicines();
        fetchMedicines();
      } else {
        alert("Error recording medicine activity");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  };

  const handleSOS = async () => {
    try {
      const location = await getCurrentLocation();
      const res = await fetch("http://localhost:5000/api/sos/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user.id,
          location,
          emergencyType: "General"
        }),
      });

      if (res.ok) {
        alert("SOS alert sent to your doctor and family members!");
      } else {
        alert("Error sending SOS alert");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Taken": return "bg-green-100 text-green-800";
      case "Missed": return "bg-red-100 text-red-800";
      case "Skipped": return "bg-yellow-100 text-yellow-800";
      case "Delayed": return "bg-orange-100 text-orange-800";
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
              <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.name}</p>
              <p className="text-sm text-blue-600">Your Code: {user.uniqueCode}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Medicine
              </button>
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
                onClick={() => setActiveTab("today")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "today"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Today's Medicines
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                All Medicines
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

        {/* Today's Medicines Tab */}
        {activeTab === "today" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Today's Medicine Schedule</h2>
            {todayMedicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No medicines scheduled for today
              </div>
            ) : (
              <div className="grid gap-4">
                {todayMedicines.map((medicine) => (
                  <div key={medicine._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{medicine.name}</h3>
                        <p className="text-gray-600">{medicine.dosage}</p>
                        <p className="text-sm text-gray-500">{medicine.frequency}</p>
                        {medicine.reminderTimes.length > 0 && (
                          <p className="text-sm text-blue-600">
                            Times: {medicine.reminderTimes.join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(medicine.status)}`}>
                          {medicine.status}
                        </span>
                        {medicine.status === "Pending" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleMedicineAction(medicine._id, "Taken")}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Taken
                            </button>
                            <button
                              onClick={() => handleMedicineAction(medicine._id, "Missed")}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Missed
                            </button>
                            <button
                              onClick={() => handleMedicineAction(medicine._id, "Skipped")}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                            >
                              Skip
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Medicines Tab */}
        {activeTab === "all" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Medicines</h2>
            {medicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No medicines added yet
              </div>
            ) : (
              <div className="grid gap-4">
                {medicines.map((medicine) => (
                  <div key={medicine._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{medicine.name}</h3>
                        <p className="text-gray-600">{medicine.dosage}</p>
                        <p className="text-sm text-gray-500">{medicine.frequency}</p>
                        <p className="text-sm text-gray-500">
                          Duration: {medicine.duration}
                        </p>
                        {medicine.instructions && (
                          <p className="text-sm text-gray-500 mt-2">
                            Instructions: {medicine.instructions}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          medicine.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {medicine.isActive ? "Active" : "Inactive"}
                        </span>
                        <button
                          onClick={() => fetch(`http://localhost:5000/api/medicine/${medicine._id}/adherence`)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          View Report
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
            <h2 className="text-xl font-semibold mb-4">Adherence Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Weekly Report</h3>
                <p className="text-gray-600">View your medication adherence for the past 7 days</p>
                <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Generate Report
                </button>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Monthly Report</h3>
                <p className="text-gray-600">View your medication adherence for the past 30 days</p>
                <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Generate Report
                </button>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">Export Data</h3>
                <p className="text-gray-600">Download your medication data as CSV or PDF</p>
                <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <AddMedicineForm 
              user={user} 
              onClose={() => setShowAddForm(false)}
              onSuccess={() => {
                setShowAddForm(false);
                fetchMedicines();
                fetchTodayMedicines();
              }}
            />
          </div>
        </div>
      )}

      {/* SOS Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleSOS}
          className="bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
