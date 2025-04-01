import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Form, Input, Upload, message, Avatar, List, Row, Col, Modal, Popconfirm, Dropdown, Menu } from 'antd';
import { UserOutlined, UploadOutlined, ArrowLeftOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const { Content } = Layout;

const Profile = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    bio: '',
    avatarUrl: ''
  });
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState({
    profile: false,
    update: false,
    posts: false,
    avatar: false,
    editing: false,
    deleting: false
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchProfile();
      fetchUserPosts();
    }
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      const email = localStorage.getItem('email');
      
      const response = await fetch(`${API_BASE_URL}/user-profile?email=${email}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load profile');
      
      const data = await response.json();
      setUserData({
        username: data.username || '',
        email: data.email || '',
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || ''
      });
      
      form.setFieldsValue({
        username: data.username || '',
        bio: data.bio || ''
      });
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const fetchUserPosts = async () => {
    try {
      setLoading(prev => ({ ...prev, posts: true }));
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      
      if (!token || !email) {
        throw new Error('Authentication data missing');
      }
  
      const response = await fetch(`${API_BASE_URL}/user_posts?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load user posts');
      }
  
      const data = await response.json();
      setUserPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      message.error(error.message || 'Error loading your posts');
      if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        navigate('/login');
      }
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(prev => ({ ...prev, update: true }));
      const response = await fetch(`${API_BASE_URL}/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: localStorage.getItem('email'),
          ...values
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      message.success('Profile updated successfully!');
      await fetchProfile();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleAvatarChange = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(prev => ({ ...prev, avatar: true }));
      return;
    }

    if (info.file.status === 'done') {
      try {
        const formData = new FormData();
        formData.append('avatar', info.file.originFileObj);
        formData.append('email', localStorage.getItem('email'));

        const response = await fetch(`${API_BASE_URL}/upload-avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload avatar');
        }
        
        const data = await response.json();
        setUserData(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        message.success('Avatar updated successfully!');
      } catch (error) {
        message.error(error.message);
      } finally {
        setLoading(prev => ({ ...prev, avatar: false }));
      }
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return Upload.LIST_IGNORE;
    }
    return true;
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

  const handleUpdatePost = async (values) => {
    try {
      setLoading(prev => ({ ...prev, editing: true }));
      const response = await fetch(`${API_BASE_URL}/update-post/${editingPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...values,
          email: localStorage.getItem('email')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update post');
      }
      
      message.success('Post updated successfully!');
      setEditModalVisible(false);
      await fetchUserPosts();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, editing: false }));
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      setLoading(prev => ({ ...prev, deleting: true }));
      const response = await fetch(`${API_BASE_URL}/delete-post/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: localStorage.getItem('email')
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete post');
      }
      
      message.success('Post deleted successfully!');
      await fetchUserPosts();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
    }
  };

  const renderPostActions = (post) => {
    const menu = (
      <Menu>
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => showEditModal(post)}>
          Edit
        </Menu.Item>
        <Menu.Item key="delete" icon={<DeleteOutlined />}>
          <Popconfirm
            title="Are you sure to delete this post?"
            onConfirm={() => handleDeletePost(post.id)}
            okText="Yes"
            cancelText="No"
          >
            Delete
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ 
          background: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/dashboard')}
            style={{ marginBottom: '24px' }}
          >
            Back to Dashboard
          </Button>
          
          <Row gutter={[24, 24]}>
            {/* Sección de perfil */}
            <Col xs={24} md={8}>
              <Card loading={loading.profile} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={beforeUpload}
                    onChange={handleAvatarChange}
                    customRequest={({ file, onSuccess }) => {
                      setTimeout(() => onSuccess("ok"), 0);
                    }}
                    accept="image/*"
                  >
                    <div style={{ position: 'relative' }}>
                      <Avatar
                        size={128}
                        icon={<UserOutlined />}
                        src={userData.avatarUrl}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: userData.avatarUrl ? 'transparent' : '#1890ff',
                          marginBottom: '16px'
                        }}
                      />
                      {loading.avatar && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          borderRadius: '50%'
                        }}>
                          <div className="ant-spin ant-spin-spinning">
                            <span className="ant-spin-dot ant-spin-dot-spin">
                              <i className="ant-spin-dot-item"></i>
                              <i className="ant-spin-dot-item"></i>
                              <i className="ant-spin-dot-item"></i>
                              <i className="ant-spin-dot-item"></i>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Upload>
                  <Button 
                    type="link" 
                    icon={<UploadOutlined />}
                    onClick={() => document.querySelector('.ant-upload input').click()}
                  >
                    Change Avatar
                  </Button>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    JPG, PNG (max 2MB)
                  </div>
                </div>
                
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  initialValues={{
                    username: userData.username,
                    bio: userData.bio
                  }}
                >
                  <Form.Item label="Email">
                    <Input value={userData.email} disabled />
                  </Form.Item>
                  
                  <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                    <Input placeholder="Enter your username" />
                  </Form.Item>
                  
                  <Form.Item name="bio" label="Bio">
                    <Input.TextArea rows={4} placeholder="Tell us about yourself..." />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading.update}
                      style={{ width: '100%' }}
                    >
                      Update Profile
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            
            {/* Sección de publicaciones */}
            <Col xs={24} md={16}>
              <Card 
                title="My Posts" 
                loading={loading.posts}
                style={{ minHeight: '100%' }}
              >
                {userPosts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px' }}>
                    You haven't posted anything yet.
                  </div>
                ) : (
                  <List
                    itemLayout="vertical"
                    dataSource={userPosts}
                    renderItem={(post) => (
                      <List.Item
                        key={post.id}
                        actions={[
                          <span>{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'No date'}</span>,
                          renderPostActions(post)
                        ]}
                        extra={
                          post.audioUrl && (
                            <div style={{ width: '250px' }}>
                              <audio
                                controls
                                style={{ width: '100%' }}
                                controlsList="nodownload"
                              >
                                <source src={post.audioUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )
                        }
                      >
                        <List.Item.Meta
                          title={<h3>{post.title || 'Untitled Post'}</h3>}
                          description={post.description || 'No description'}
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>
          </Row>
        </div>

        {/* Modal de edición */}
        <Modal
          title="Edit Post"
          open={editModalVisible}
          onCancel={handleEditCancel}
          footer={null}
          destroyOnClose
        >
          <Form form={editForm} onFinish={handleUpdatePost} layout="vertical">
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input placeholder="Post title" />
            </Form.Item>
            <Form.Item name="description" label="Description" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="Describe your audio..." />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading.editing}
                style={{ width: '100%' }}
              >
                Update Post
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Profile;