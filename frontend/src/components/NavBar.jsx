import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function NavBar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/identify">Identify</NavLink>
      <NavLink to="/species">Species</NavLink>
      <NavLink to="/walks">Walks</NavLink>
      {user && (
        <>
          <span>{user.username}</span>
          <button onClick={handleLogout}>Log out</button>
        </>
      )}
    </nav>
  )
}