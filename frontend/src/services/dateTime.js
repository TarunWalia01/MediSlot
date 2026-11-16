export const CLINIC_TIME_ZONE = import.meta.env.VITE_CLINIC_TIME_ZONE || 'Asia/Kolkata';

export function getClinicToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatClinicTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: CLINIC_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date(value));
}

export function formatClinicDateTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: CLINIC_TIME_ZONE,
    dateStyle: 'medium',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}
