import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AetherImage from '../../assets/img/Aether.png';
import FondoImage from '../../assets/img/fondo.jpg';
import './Register.css';

const Register = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaData, setMfaData] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.password && formData.confirmPassword) {
      setPasswordMatch(formData.password === formData.confirmPassword);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('https://webfinalbackend-production-c682.up.railway.app/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.name
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en el registro');
      }
      
      setMfaData({
        ...data.mfa,
        tempUserId: data.tempUserId
      });
      setMfaStep(true);
      
    } catch (err) {
      console.error('Error de registro:', err);
      setErrors({ apiError: err.message || 'Error al registrar. Por favor intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaVerification = async (e) => {
    e.preventDefault();
    
    // Validación más estricta
    if (!mfaToken || !/^\d{6}$/.test(mfaToken)) {
      setErrors({ mfaError: 'Por favor ingresa un código de 6 dígitos numéricos' });
      return;
    }
  
    setMfaVerifying(true);
    setErrors({});
    
    try {
      const response = await fetch('https://webfinalbackend-production-c682.up.railway.app/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempUserId: mfaData.tempUserId,
          token: mfaToken
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al verificar el código MFA');
      }
      
      // Registro exitoso - maneja el token JWT si lo recibes
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          email: formData.email,
          username: formData.name,
          id: data.userId,
          mfaEnabled: true
        }));
      }
      
      navigate('/dashboard', { 
        replace: true,
        state: { 
          mfaSetupComplete: true,
          newUser: true
        } 
      });
      
    } catch (err) {
      console.error('Error en verificación MFA:', err);
      setErrors({ 
        mfaError: err.message || 'El código es incorrecto o ha expirado. Intenta con un código nuevo.' 
      });
      
      // Opcional: Reintentar o volver al paso anterior
      if (err.message.includes('expirado')) {
        setTimeout(() => {
          navigate('/register');
        }, 3000);
      }
    } finally {
      setMfaVerifying(false);
    }
  };

  if (mfaStep && mfaData) {
    return (
      <div 
        className="register-container"
        style={{ 
          backgroundImage: `url(${FondoImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="register-form">
          <div className="register-header">
            <img src={AetherImage} alt="Aether Logo" className="register-logo" />
            <h2>Configurar Autenticación MFA</h2>
          </div>
          
          <p className="mfa-instructions">
            Escanea el código QR con Microsoft Authenticator o ingresa manualmente el código:
          </p>
          
          <div className="mfa-qr-container">
            <img src={mfaData.qrCode} alt="MFA QR Code" className="mfa-qr-code" />
            <p className="mfa-manual-code">
              Código manual: <strong>{mfaData.manualEntryCode}</strong>
            </p>
          </div>
          
          <form onSubmit={handleMfaVerification}>
            <div className="form-group">
              <label htmlFor="mfaToken">Código de verificación</label>
              <input
                type="text"
                id="mfaToken"
                name="mfaToken"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                required
                placeholder="Ingresa el código de 6 dígitos"
                className={errors.mfaError ? 'input-error' : ''}
              />
              {errors.mfaError && <span className="error-message">{errors.mfaError}</span>}
            </div>

            <button 
              type="submit" 
              className="register-button"
              disabled={mfaVerifying || !mfaToken}
            >
              {mfaVerifying ? 'Verificando...' : 'Verificar y Completar Registro'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="register-container"
      style={{ 
        backgroundImage: `url(${FondoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="register-form">
        <div className="register-header">
          <img src={AetherImage} alt="Aether Logo" className="register-logo" />
          <h2>Crear Cuenta</h2>
        </div>
        
        {errors.apiError && <div className="register-error">{errors.apiError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej: Juan Pérez"
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

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
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
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
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
            {formData.password && formData.confirmPassword && (
              <span className={passwordMatch ? 'password-match' : 'password-mismatch'}>
                {passwordMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={isLoading || !passwordMatch}
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="register-switch">
          ¿Ya tienes una cuenta?{' '}
          <span onClick={() => navigate('/login')}>Inicia sesión aquí</span>
        </p>
      </div>
    </div>
  );
};

export default Register;