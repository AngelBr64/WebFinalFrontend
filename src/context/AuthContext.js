import { createContext } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {}
});

export default AuthContext;