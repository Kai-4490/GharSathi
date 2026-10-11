import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { homeFor, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'
import Login from './pages/Login'
import Listings from './pages/Listings'
import ListingDetail from './pages/ListingDetail'
import ListingForm from './pages/ListingForm'
import MyListings from './pages/MyListings'
import Suggestions from './pages/Suggestions'
import Matches from './pages/Matches'
import MessagesShell, { NoThread } from './pages/MessagesShell'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Blocked from './pages/Blocked'
import AdminDashboard from './pages/admin/AdminDashboard'
import UsersTab from './pages/admin/UsersTab'
import ReportsTab from './pages/admin/ReportsTab'
import VerificationsTab from './pages/admin/VerificationsTab'
import NotFound from './pages/NotFound'

// Register / Login: logged-in users are sent to their landing page.
function PublicOnly({ children }) {
  const { isAuthed, user } = useAuth()
  return isAuthed ? <Navigate to={homeFor(user.role)} replace /> : children
}

function RoleHome() {
  const { user } = useAuth()
  return <Navigate to={homeFor(user.role)} replace />
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<RoleHome />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listings/new" element={<ListingForm />} />
            <Route path="/listings/:id" element={<ListingDetail />} />
            <Route path="/listings/:id/edit" element={<ListingForm />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/matches" element={<Matches />} />
            <Route element={<MessagesShell />}>
              <Route path="/messages" element={<NoThread />} />
              <Route path="/chat/:otherUserId" element={<Chat />} />
            </Route>
            <Route path="/profile" element={<Profile />} />
            <Route path="/users/:id" element={<UserProfile />} />
            <Route path="/blocked" element={<Blocked />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />}>
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<UsersTab />} />
                <Route path="reports" element={<ReportsTab />} />
                <Route path="verifications" element={<VerificationsTab />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
