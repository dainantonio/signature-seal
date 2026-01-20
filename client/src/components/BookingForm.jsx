// Make sure your frontend code includes these keys in the body!
const response = await fetch(`${API_URL}/api/bookings`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: formData.name,
    email: formData.email,
    service: formData.service,
    date: formData.date,
    time: formData.time,
    address: formData.address, // <--- Ensure this is here
    notes: formData.notes      // <--- Ensure this is here
  }),
});
