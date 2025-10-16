import React, { useState } from "react";

export default function AddMedicineForm({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    reminderTimes: []
  });
  const [currentTime, setCurrentTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addReminderTime = () => {
    if (currentTime && !formData.reminderTimes.includes(currentTime)) {
      setFormData({
        ...formData,
        reminderTimes: [...formData.reminderTimes, currentTime]
      });
      setCurrentTime("");
    }
  };

  const removeReminderTime = (time) => {
    setFormData({
      ...formData,
      reminderTimes: formData.reminderTimes.filter(t => t !== time)
    });
  };

  const save = async () => {
    if (!user) return alert("Please login first");
    
    if (!formData.name || !formData.dosage || !formData.frequency) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/medicine/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user.id,
          ...formData,
          endDate: formData.endDate || null
        }),
      });

      if (res.ok) {
        alert("Medicine added successfully!");
        setFormData({
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
          startDate: new Date().toISOString().split('T')[0],
          endDate: "",
          reminderTimes: []
        });
        onSuccess && onSuccess();
      } else {
        const data = await res.json();
        alert(data.message || "Error adding medicine");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Add New Medicine</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
          <input
            type="text"
            name="name"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Metformin"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
          <input
            type="text"
            name="dosage"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 500mg, 2 tablets"
            value={formData.dosage}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
          <select
            name="frequency"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={formData.frequency}
            onChange={handleChange}
            required
          >
            <option value="">Select frequency</option>
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="Every 8 hours">Every 8 hours</option>
            <option value="Every 12 hours">Every 12 hours</option>
            <option value="As needed">As needed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <input
            type="text"
            name="duration"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 30 days, until finished"
            value={formData.duration}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
          <textarea
            name="instructions"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Take with food, avoid alcohol"
            value={formData.instructions}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Times</label>
          <div className="flex space-x-2 mb-2">
            <input
              type="time"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={currentTime}
              onChange={(e) => setCurrentTime(e.target.value)}
            />
            <button
              type="button"
              onClick={addReminderTime}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          {formData.reminderTimes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.reminderTimes.map((time, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {time}
                  <button
                    type="button"
                    onClick={() => removeReminderTime(time)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            onClick={save}
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Adding..." : "Add Medicine"}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
