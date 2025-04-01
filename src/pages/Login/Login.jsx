import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AetherImage from '../../assets/img/Aether.png';
import FondoImage from '../../assets/img/fondo.jpg';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }
  
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
  
      localStorage.setItem('token', data.token);
      localStorage.setItem('email', data.user.email);
      onLogin({ name: data.user.username }, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      console.error('Error de login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  return (
    <div 
      className="login-container"
      style={{ 
        backgroundImage: `url(${FondoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="login-form">
        <div className="login-header">
          <img src={AetherImage} alt="Aether Logo" className="login-logo" />
          <h2>Iniciar Sesión</h2>
        </div>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Cargando...' : 'Ingresar'}
          </button>
        </form>

        <div className="login-extra-options">
          <p className="login-switch">
            ¿No tienes una cuenta?{' '}
            <span 
              className="link-text" 
              onClick={() => navigate('/register')}
            >
              Regístrate aquí
            </span>
          </p>
          <p className="forgot-password">
            <span 
              className="link-text"
              onClick={handleForgotPasswordClick}
            >
              ¿Olvidaste tu contraseña?
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;