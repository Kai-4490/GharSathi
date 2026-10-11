import client from './client'

export const register = (body) => client.post('/api/auth/register', body).then((r) => r.data)
export const verifyOtp = (mobileNumber, otp) =>
  client.post('/api/auth/verify-otp', { mobileNumber, otp }).then((r) => r.data)
export const requestOtp = (mobileNumber) =>
  client.post('/api/auth/request-otp', { mobileNumber }).then((r) => r.data)
export const login = (mobileNumber, otp) =>
  client.post('/api/auth/login', { mobileNumber, otp }).then((r) => r.data)
