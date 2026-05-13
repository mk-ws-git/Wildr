import { NavLink } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function NavBar() {
  const { user, logout } = useAuthStore()

  return (
    <nav>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/identify">Identify</NavLink>
      <NavLink to="/species">Species</NavLink>
      <NavLink to="/walks">Walks</NavLink>
      {user && <span onClick={logout}>{user.username}</span>}
    </nav>
  )
}