import client from './client'

// every ApiResponse<T> from the backend has shape { success, message, data, timestamp }
// these functions return response.data (the full ApiResponse envelope), so callers
// can read both .data.data (the payload) and .data.message (for OTP dev-mode display etc.)

export function register({ name, email, mobileNumber, role }) {
  return client.post('/api/auth/register', { name, email, mobileNumber, role })
    .then((res) => res.data)
}

export function verifyOtp({ mobileNumber, otp }) {
  return client.post('/api/auth/verify-otp', { mobileNumber, otp })
    .then((res) => res.data)
}

export function requestOtp({ mobileNumber }) {
  return client.post('/api/auth/request-otp', { mobileNumber })
    .then((res) => res.data)
}

export function login({ mobileNumber, otp }) {
  return client.post('/api/auth/login', { mobileNumber, otp })
    .then((res) => res.data)
}
