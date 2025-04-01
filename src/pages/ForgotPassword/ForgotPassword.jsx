import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AetherImage from '../../assets/img/Aether.png';
import FondoImage from '../../assets/img/fondo.jpg';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al solicitar recuperación');
      }

      setMessage('Se ha enviado un enlace de recuperación');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="forgot-password-container"
      style={{ 
        backgroundImage: `url(${FondoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="forgot-password-form">
        <div className="forgot-password-header">
          <img src={AetherImage} alt="Aether Logo" className="forgot-password-logo" />
          <h2>Recuperar Contraseña</h2>
        </div>
        <p>Ingresa tu correo electrónico para recibir un enlace de recuperación</p>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>

        <div className="back-to-login">
          <button onClick={() => navigate('/login')}>Volver al inicio de sesión</button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;