import axios from 'axios';

export const AUTH_TOKEN_KEY = 'medislot_auth_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 5000
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function getHealthStatus() {
  const response = await api.get('/health');
  return response.data;
}

export async function registerAccount(accountDetails) {
  const response = await api.post('/auth/register', accountDetails);
  return response.data;
}

export async function loginAccount(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function getDoctors(params = {}) {
  const response = await api.get('/doctors', { params });
  return response.data;
}

export async function getDoctor(id, params = {}) {
  const response = await api.get(`/doctors/${id}`, { params });
  return response.data;
}

export async function createDoctor(doctorDetails) {
  const response = await api.post('/doctors', doctorDetails);
  return response.data;
}

export async function updateDoctor(id, doctorDetails) {
  const response = await api.put(`/doctors/${id}`, doctorDetails);
  return response.data;
}

export async function deactivateDoctor(id) {
  const response = await api.delete(`/doctors/${id}`);
  return response.data;
}

export async function getServices(params = {}) {
  const response = await api.get('/services', { params });
  return response.data;
}

export async function getService(id, params = {}) {
  const response = await api.get(`/services/${id}`, { params });
  return response.data;
}

export async function createService(serviceDetails) {
  const response = await api.post('/services', serviceDetails);
  return response.data;
}

export async function updateService(id, serviceDetails) {
  const response = await api.put(`/services/${id}`, serviceDetails);
  return response.data;
}

export async function deactivateService(id) {
  const response = await api.delete(`/services/${id}`);
  return response.data;
}

export async function getDoctorSchedules(doctorId, params = {}) {
  const response = await api.get(`/schedules/${doctorId}`, { params });
  return response.data;
}

export async function getAdminSchedules(params = {}) {
  const response = await api.get('/schedules/admin', { params });
  return response.data;
}

export async function createSchedule(scheduleDetails) {
  const response = await api.post('/schedules', scheduleDetails);
  return response.data;
}

export async function updateSchedule(id, scheduleDetails) {
  const response = await api.put(`/schedules/${id}`, scheduleDetails);
  return response.data;
}

export async function deactivateSchedule(id) {
  const response = await api.delete(`/schedules/${id}`);
  return response.data;
}

export async function createAppointment(appointmentDetails) {
  const response = await api.post('/appointments', appointmentDetails);
  return response.data;
}

export async function getMyAppointments(params = {}) {
  const response = await api.get('/appointments/my', { params });
  return response.data;
}

export async function cancelAppointment(id) {
  const response = await api.patch(`/appointments/${id}/cancel`);
  return response.data;
}

export async function getAdminAppointments(params = {}) {
  const response = await api.get('/appointments', { params });
  return response.data;
}

export async function updateAppointmentStatus(id, status) {
  const response = await api.patch(`/appointments/${id}/status`, { status });
  return response.data;
}
