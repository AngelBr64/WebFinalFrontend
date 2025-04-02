import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Avatar, 
  Card, 
  Button, 
  message, 
  List, 
  Typography, 
  Skeleton,
  Divider,
  Space,
  Badge
} from 'antd';
import { 
  UserOutlined, 
  ArrowLeftOutlined, 
  MailOutlined,
  CalendarOutlined,
  EditOutlined,
  MessageOutlined,
  LikeOutlined
} from '@ant-design/icons';
import AuthContext from '../../context/AuthContext';
import { useContext } from 'react';
import './UserProfile.css';

const { Title, Text } = Typography;

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState({
    profile: true,
    posts: true
  });
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://webfinalbackend-production-c682.up.railway.app';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(prev => ({ ...prev, profile: true }));
        
        const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Error al cargar perfil de usuario');
        }
        
        const data = await response.json();
        setUserData(data.user);
        
        // Verificar si es el perfil del usuario actual
        if (currentUser && (currentUser.email === data.user.email || currentUser.id === userId)) {
          setIsCurrentUser(true);
        }
      } catch (error) {
        message.error(error.message);
        navigate('/dashboard');
      } finally {
        setLoading(prev => ({ ...prev, profile: false }));
      }
    };



    fetchUserData();
  }, [userId, currentUser, navigate]);

  const handleEditProfile = () => {
    navigate('/profile');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className="user-profile-container">
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '20px' }}
      >
        Volver
      </Button>

      <Card 
        loading={loading.profile}
        className="profile-card"
      >
        <div className="profile-header">
          <div className="avatar-container">
            {userData?.avatarUrl ? (
              <Avatar 
                src={userData.avatarUrl} 
                size={100}
                className="profile-avatar"
              />
            ) : (
              <Avatar 
                size={100}
                icon={<UserOutlined />}
                className="profile-avatar"
                style={{ 
                  backgroundColor: '#1890ff', 
                  color: 'white'
                }}
              />
            )}
          </div>
          
          <div className="profile-info">
            <Title level={3} className="username">
              {userData?.username || 'Usuario'}
              {isCurrentUser && (
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={handleEditProfile}
                  className="edit-profile-btn"
                />
              )}
            </Title>
            
          </div>
        </div>

        <Divider />

        <div className="profile-details">
          <div className="detail-item">
            <MailOutlined className="detail-icon" />
            <Text>{userData?.email || 'No disponible'}</Text>
          </div>
          
          <div className="detail-item">
            <CalendarOutlined className="detail-icon" />
            <Text>
              Miembro desde: {userData?.createdAt ? formatDate(userData.createdAt) : 'Fecha desconocida'}
            </Text>
          </div>
          
          {userData?.bio && (
            <div className="bio-section">
              <Text>{userData.bio}</Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;