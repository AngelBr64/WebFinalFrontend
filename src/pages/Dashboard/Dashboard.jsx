import React, { useState, useEffect } from 'react';
import { 
  Layout, Button, Modal, Input, Form, Card, Col, Row, Upload, 
  message, Popconfirm, Dropdown, Menu, Avatar, List, Badge, Tooltip
} from 'antd';
import { 
  PlusCircleOutlined, UploadOutlined, EditOutlined, 
  DeleteOutlined, MoreOutlined, LikeOutlined, MessageOutlined,
  BellOutlined, UserOutlined, MailOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const { Header, Content } = Layout;

const CustomComment = ({ author, avatar, content, datetime }) => (
  <div style={{ 
    display: 'flex', 
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f0f0f0'
  }}>
    <div style={{ marginRight: '12px' }}>
      {avatar}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '4px'
      }}>
        <span style={{ fontWeight: '500' }}>{author}</span>
        <span style={{ color: '#888', fontSize: '12px' }}>{datetime}</span>
      </div>
      <div>{content}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [currentPostId, setCurrentPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [username, setUsername] = useState('');
  const [userLikes, setUserLikes] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [sseConnection, setSseConnection] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState({
    posts: false,
    submission: false,
    editing: false,
    deleting: false,
    profile: false,
    comments: false,
    addingComment: false,
    checkingLikes: false,
    notifications: false
  });
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://webfinalbackend-production-c682.up.railway.app:5000';

  const fetchUserProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      const email = localStorage.getItem('email');
      const response = await fetch(`${API_BASE_URL}/user-profile?email=${email}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar el perfil');
      
      const data = await response.json();
      setUsername(data.username || '');
      localStorage.setItem('username', data.username || '');
      if (data.avatarUrl) {
        localStorage.setItem('avatarUrl', data.avatarUrl);
      }
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const setupSSE = () => {
    const email = localStorage.getItem('email');
    if (!email) return;
  
    const eventSource = new EventSource(`${API_BASE_URL}/notifications?email=${encodeURIComponent(email)}`);
  
    eventSource.addEventListener('connection', () => {
      console.log('Conexión SSE establecida');
    });
  
    eventSource.addEventListener('notification', (e) => {
      try {
        const notification = JSON.parse(e.data);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => Math.max(prev + 1, 0));
        message.info(notification.message);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });
  
    eventSource.onerror = (e) => {
      console.error('SSE error:', e);
      eventSource.close();
      setTimeout(setupSSE, 5000);
    };
  
    return eventSource;
  };

  const loadNotifications = async () => {
    try {
      setLoading(prev => ({ ...prev, notifications: true }));
      const email = localStorage.getItem('email');
      const response = await fetch(`${API_BASE_URL}/get-notifications?email=${email}`);
      
      if (!response.ok) {
        throw new Error('Error loading notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      
      // Calcular notificaciones no leídas
      const unread = data.notifications.filter(n => !n.read).length;
      setUnreadCount(Math.max(unread, 0)); 
    } catch (error) {
      console.error('Notification error:', error);
      message.error(`Error al cargar notificaciones: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const markAllAsRead = async () => {
    try {
      const email = localStorage.getItem('email');
      const response = await fetch(`${API_BASE_URL}/mark-all-notifications-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Error al marcar notificaciones como leídas');

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
    }
  };

  const handleNotificationVisibleChange = (visible) => {
    setNotificationVisible(visible);
    if (visible && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.postId) {
      message.info(`ID de publicación: ${notification.postId}`);
    }
    setNotificationVisible(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        fetchUserProfile();
      }
      fetchPosts();
      loadNotifications();
      
      const sse = setupSSE();
      setSseConnection(sse);
      
      return () => {
        if (sse) sse.close();
      };
    }
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      setLoading(prev => ({ ...prev, posts: true }));
      const response = await fetch(`${API_BASE_URL}/posts`);
      if (!response.ok) throw new Error('Error al cargar publicaciones');
      const data = await response.json();
      setPosts(data.posts || []);
      
      if (data.posts && data.posts.length > 0) {
        data.posts.forEach(post => checkUserLike(post.id));
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  const checkUserLike = async (postId) => {
    try {
      setLoading(prev => ({ ...prev, checkingLikes: true }));
      const userId = localStorage.getItem('email');
      const response = await fetch(`${API_BASE_URL}/check-like?postId=${postId}&userId=${userId}`);
      
      if (!response.ok) throw new Error('Error al verificar like');
      
      const data = await response.json();
      setUserLikes(prev => ({
        ...prev,
        [postId]: data.liked
      }));
    } catch (error) {
      console.error('Error al verificar like:', error);
    } finally {
      setLoading(prev => ({ ...prev, checkingLikes: false }));
    }
  };

  const handleLike = async (postId) => {
    try {
      const userId = localStorage.getItem('email');
      const response = await fetch(`${API_BASE_URL}/like-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          postId, 
          userId 
        }),
      });

      if (!response.ok) throw new Error('Error al dar like');
      
      const data = await response.json();
      
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, likes: data.likes } : post
      ));
      
      setUserLikes(prev => ({
        ...prev,
        [postId]: data.action === 'liked'
      }));
      
      message.success(data.action === 'liked' ? '¡Like agregado!' : 'Like eliminado');
    } catch (error) {
      message.error(error.message);
    }
  };

  const showComments = async (postId) => {
    setCurrentPostId(postId);
    try {
      setLoading(prev => ({ ...prev, comments: true }));
      const response = await fetch(`${API_BASE_URL}/get-comments?postId=${postId}`);
      
      if (!response.ok) throw new Error('Error al cargar comentarios');
      
      const data = await response.json();
      setComments(data.comments || []);
      setCommentModalVisible(true);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, comments: false }));
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      message.error('El comentario no puede estar vacío');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, addingComment: true }));
      const userId = localStorage.getItem('email');
      const username = localStorage.getItem('username');
      const avatarUrl = localStorage.getItem('avatarUrl');
      
      const response = await fetch(`${API_BASE_URL}/add-comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: currentPostId,
          userId,
          text: commentText,
          username,
          avatarUrl
        }),
      });

      if (!response.ok) throw new Error('Error al agregar comentario');
      
      const data = await response.json();
      
      setComments(prev => [data.comment, ...prev]);
      setCommentText('');
      
      setPosts(posts.map(post => {
        if (post.id === currentPostId) {
          return {
            ...post,
            commentCount: (post.commentCount || 0) + 1
          };
        }
        return post;
      }));
      
      message.success('¡Comentario agregado correctamente!');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, addingComment: false }));
    }
  };

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setAudioFile(null);
  };

  const showEditModal = (post) => {
    setEditingPost(post);
    editForm.setFieldsValue({
      title: post.title,
      description: post.description
    });
    setEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    editForm.resetFields();
    setEditingPost(null);
  };

  const handleSubmit = async (values) => {
    if (!audioFile) {
      message.error('Por favor sube un archivo de audio');
      return;
    }

    const formData = new FormData();
    formData.append('email', localStorage.getItem('email') || '');
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('audio', audioFile);

    try {
      setLoading(prev => ({ ...prev, submission: true }));
      const response = await fetch(`${API_BASE_URL}/create-post`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al crear publicación');
      
      message.success('¡Publicación creada correctamente!');
      await fetchPosts();
      handleCancel();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }
  };

  const handleUpdate = async (values) => {
    try {
      setLoading(prev => ({ ...prev, editing: true }));
      const response = await fetch(`${API_BASE_URL}/update-post/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          email: localStorage.getItem('email')
        }),
      });
  
      if (!response.ok) {
        throw new Error('Error al actualizar publicación');
      }
      
      message.success('¡Publicación actualizada correctamente!');
      setEditModalVisible(false);
      await fetchPosts();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, editing: false }));
    }
  };
  
  const handleDelete = async (postId) => {
    try {
      setLoading(prev => ({ ...prev, deleting: true }));
      const response = await fetch(`${API_BASE_URL}/delete-post/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localStorage.getItem('email')
        }),
      });
  
      if (!response.ok) {
        throw new Error('Error al eliminar publicación');
      }
      
      message.success('¡Publicación eliminada correctamente!');
      await fetchPosts();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  };

  const handleAudioChange = (info) => {
    if (info.file.status === 'done') {
      setAudioFile(info.file.originFileObj);
      message.success(`${info.file.name} subido correctamente`);
    } else if (info.file.status === 'error') {
      message.error(`Error al subir ${info.file.name}`);
    }
  };

  const handleLogout = () => {
    if (sseConnection) {
      sseConnection.close();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('username');
    localStorage.removeItem('avatarUrl');
    navigate('/login');
    window.location.reload();
  };

  const renderPostActions = (post) => {
    const isCurrentUserPost = post.email === localStorage.getItem('email');
    
    if (!isCurrentUserPost) return null;

    const menu = (
      <Menu>
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => showEditModal(post)}>
          Editar
        </Menu.Item>
        <Menu.Item key="delete" icon={<DeleteOutlined />}>
          <Popconfirm
            title="¿Estás seguro de eliminar esta publicación?"
            onConfirm={() => handleDelete(post.id)}
            okText="Sí"
            cancelText="No"
          >
            Eliminar
          </Popconfirm>
        </Menu.Item>
      </Menu>
    );

    return (
      <Dropdown overlay={menu} trigger={['click']}>
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  const notificationMenu = (
    <Menu style={{ width: 350, maxHeight: 400, overflowY: 'auto' }}>
      <Menu.Item key="header" style={{ fontWeight: 'bold', cursor: 'default' }}>
        Notificaciones {unreadCount > 0 && `(${unreadCount} nuevas)`}
      </Menu.Item>
      {notifications.length === 0 ? (
        <Menu.Item key="empty" disabled>
          No hay notificaciones
        </Menu.Item>
      ) : (
        notifications.map(notification => (
          <Menu.Item 
            key={notification.id || notification.timestamp}
            onClick={() => handleNotificationClick(notification)}
            style={{
              background: !notification.read ? '#f0f7ff' : 'transparent',
              whiteSpace: 'normal',
              lineHeight: '1.4',
              padding: '12px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {notification.avatarUrl ? (
                <Avatar 
                  src={notification.avatarUrl} 
                  size={32}
                  style={{ marginRight: '8px' }}
                />
              ) : (
                <Avatar 
                  size={32}
                  style={{ 
                    backgroundColor: '#1890ff', 
                    color: 'white',
                    marginRight: '8px'
                  }}
                >
                  {notification.username ? notification.username.charAt(0).toUpperCase() : 'A'}
                </Avatar>
              )}
              <div>
                <div style={{ fontWeight: '500' }}>{notification.message}</div>
                {notification.commentText && (
                  <div style={{ 
                    color: '#666', 
                    fontStyle: 'italic',
                    marginTop: '4px'
                  }}>
                    "{notification.commentText.length > 50 
                      ? `${notification.commentText.substring(0, 50)}...` 
                      : notification.commentText}"
                  </div>
                )}
                <div style={{ 
                  color: '#888', 
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {new Date(notification.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </Menu.Item>
        ))
      )}
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 24px',
        background: '#001529',
        color: 'white'
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Musical Aether</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button type="text" onClick={() => navigate('/contact')} style={{ color: 'white' }}>
            <MailOutlined /> Contacto
          </Button>
          <Dropdown
            overlay={notificationMenu}
            trigger={['click']}
            visible={notificationVisible}
            onVisibleChange={handleNotificationVisibleChange}
          >
            <Tooltip title="Notificaciones">
              <Badge count={Math.max(unreadCount, 0)} overflowCount={9}>
                <Button 
                  type="text" 
                  icon={<BellOutlined />} 
                  style={{ color: 'white' }}
                />
              </Badge>
            </Tooltip>
          </Dropdown>
          
          <Button type="text" onClick={() => navigate('/profile')} style={{ color: 'white' }}>
            <UserOutlined /> Mi Perfil
          </Button>
          
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="user" disabled>
                  {username || 'Usuario'}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="logout" onClick={handleLogout}>
                  Cerrar sesión
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Avatar 
              src={localStorage.getItem('avatarUrl')}
              style={{ 
                backgroundColor: localStorage.getItem('avatarUrl') ? 'transparent' : '#1890ff',
                cursor: 'pointer'
              }}
            >
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </Dropdown>
        </div>
      </Header>

      <Content style={{ padding: '40px', background: '#f0f2f5', width: '60%', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0 }}>Publicaciones recientes</h2>
            <div className="floating-button">
              <Button 
                type="primary" 
                icon={<PlusCircleOutlined />} 
                onClick={showModal} 
                loading={loading.posts} 
                size="large"
              >
                Nueva publicación
              </Button>
            </div>
          </div>

          {loading.posts && posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>Cargando publicaciones...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>No hay publicaciones aún. ¡Sé el primero en compartir!</div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Row gutter={[0, 16]} style={{ maxWidth: '600px', width: '100%' }}>
                {posts.map((post) => (
                  <Col key={post.id} span={24}>
                    <Card
                      hoverable
                      style={{ borderRadius: '8px', width: '100%' }}
                        cover={
                          <div style={{ 
                            padding: '16px 24px 0 24px',
                            display: 'flex', 
                            alignItems: 'center',
                            borderBottom: '1px solid #f0f0f0',
                            marginBottom: '12px'
                          }}>
                            <div 
                              onClick={() => {
                                const currentUserEmail = localStorage.getItem('email');
                                if (post.email === currentUserEmail) {
                                  navigate('/profile');
                                } else {
                                  navigate(`/user/${post.userId || post.email}`);
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {post.avatarUrl ? (
                                <Avatar 
                                  src={post.avatarUrl} 
                                  size={32}
                                  style={{ marginRight: '8px' }}
                                />
                              ) : (
                                <Avatar 
                                  size={32}
                                  style={{ 
                                    backgroundColor: '#1890ff', 
                                    color: 'white',
                                    marginRight: '8px'
                                  }}
                                >
                                  {post.username ? post.username.charAt(0).toUpperCase() : 'U'}
                                </Avatar>
                              )}
                            </div>
                            <span 
                              style={{ fontWeight: '500', cursor: 'pointer' }}
                              onClick={() => {
                                const currentUserEmail = localStorage.getItem('email');
                                if (post.email === currentUserEmail) {
                                  navigate('/profile');
                                } else {
                                  navigate(`/user/${post.userId || post.email}`);
                                }
                              }}
                            >
                              {post.username || 'Usuario'}
                            </span>
                            
                            <div style={{ marginLeft: 'auto', color: '#888' }}>
                              {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        }
                      actions={[
                        <Button 
                          size="small" 
                          onClick={() => handleLike(post.id)}
                          type={userLikes[post.id] ? 'primary' : 'default'}
                          icon={<LikeOutlined />}
                        >
                          {post.likes || 0}
                        </Button>,
                        <Button 
                          size="small" 
                          onClick={() => showComments(post.id)}
                          icon={<MessageOutlined />}
                        >
                          {post.commentCount || 0}
                        </Button>,
                        renderPostActions(post)
                      ]}
                    >
                      <h3 style={{ marginBottom: '12px' }}>{post.title}</h3>
                      <p style={{ marginBottom: '16px' }}>{post.description}</p>
                      
                      {post.audioUrl && (
                        <div style={{ marginTop: '16px' }}>
                          <audio
                            controls
                            style={{ width: '100%' }}
                            controlsList="nodownload"
                          >
                            <source 
                              src={post.audioUrl} 
                              type={`audio/${post.audioUrl.split('.').pop().toLowerCase()}`} 
                            />
                            Tu navegador no soporta el elemento de audio.
                          </audio>
                          <div style={{ marginTop: 8, fontSize: 12 }}>
                            <a href={post.audioUrl} target="_blank" rel="noopener noreferrer">
                              Abrir en nueva pestaña
                            </a>
                          </div>
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </div>
      </Content>

      {/* Modal para crear nuevos posts */}
      <Modal
        title="Nueva publicación"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Por favor ingresa un título' }]}>
            <Input placeholder="Título de la publicación" />
          </Form.Item>
          <Form.Item name="description" label="Descripción" rules={[{ required: true, message: 'Por favor ingresa una descripción' }]}>
            <Input.TextArea rows={4} placeholder="Describe tu audio..." />
          </Form.Item>
          <Form.Item 
            name="audio" 
            label="Archivo de audio" 
            rules={[{ 
              required: true, 
              message: 'Por favor sube un archivo de audio MP3',
              validator: (_, value) => {
                if (value && value.file && !value.file.name?.endsWith('.mp3')) {
                  return Promise.reject(new Error('Solo se permiten archivos MP3'));
                }
                return Promise.resolve();
              }
            }]} 
          >
            <Upload
              accept=".mp3,audio/mp3"
              beforeUpload={(file) => {
                // Validación adicional por si el navegador no respeta el atributo accept
                if (!file.name.toLowerCase().endsWith('.mp3')) {
                  message.error('Solo se permiten archivos MP3');
                  return Upload.LIST_IGNORE;
                }
                setAudioFile(file);
                return false;
              }}
              maxCount={1}
              showUploadList={false}
              onChange={handleAudioChange}
            >
              <Button icon={<UploadOutlined />} block>
                {audioFile ? audioFile.name : 'Selecciona un archivo de audio (MP3)'}
              </Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading.submission} block size="large">
              Publicar
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para editar posts */}
      <Modal
        title="Editar publicación"
        open={editModalVisible}
        onCancel={handleEditCancel}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} onFinish={handleUpdate} layout="vertical">
          <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Por favor ingresa un título' }]}>
            <Input placeholder="Título de la publicación" />
          </Form.Item>
          <Form.Item name="description" label="Descripción" rules={[{ required: true, message: 'Por favor ingresa una descripción' }]}>
            <Input.TextArea rows={4} placeholder="Describe tu audio..." />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading.editing} 
              block 
              size="large"
            >
              Actualizar publicación
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para comentarios */}
      <Modal
        title="Comentarios"
        open={commentModalVisible}
        onCancel={() => setCommentModalVisible(false)}
        footer={null}
        width={700}
      >
        <div className="comment-list">
          {loading.comments ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>Cargando comentarios...</div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>No hay comentarios aún</div>
          ) : (
            <List
              dataSource={comments}
              renderItem={comment => (
                <CustomComment
                  author={comment.username}
                  avatar={comment.avatarUrl || (
                    <Avatar>
                      {comment.username ? comment.username.charAt(0).toUpperCase() : 'A'}
                    </Avatar>
                  )}
                  content={<p>{comment.text}</p>}
                  datetime={new Date(comment.createdAt).toLocaleString()}
                />
              )}
            />
          )}
        </div>
        
        <Input.TextArea
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Escribe un comentario..."
          style={{ marginBottom: '12px', marginTop: '16px' }}
        />
        <Button 
          type="primary" 
          onClick={handleAddComment}
          loading={loading.addingComment}
          block
        >
          Agregar comentario
        </Button>
      </Modal>
    </Layout>
  );
};

export default Dashboard;