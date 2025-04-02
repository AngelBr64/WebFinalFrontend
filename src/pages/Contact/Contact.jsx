import React, { useState } from 'react';
import { Button, Form, Input, message, Typography, Card } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Contact.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ContactPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('https://webfinalbackend-production-c682.up.railway.app:5000/api/contact', values, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        message.success('Mensaje enviado con éxito. Nos pondremos en contacto contigo pronto.');
        form.resetFields();
      } else {
        message.error(response.data.message || 'Hubo un problema al enviar tu mensaje.');
      }
    } catch (error) {
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        code: error.code
      });
      
      message.error(error.response?.data?.message || 
        'Error al conectar con el servidor. Por favor intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <Card className="contact-card">
        <div className="contact-header">
          <Title level={2} style={{ textAlign: 'center' }}>
            <MailOutlined /> Contáctanos
          </Title>
          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            ¿Tienes preguntas, sugerencias o comentarios? Escríbenos y te responderemos a la brevedad.
          </Text>
        </div>
        
        <Form
          form={form}
          name="contact"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          className="contact-form"
        >
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ 
              required: true, 
              message: 'Por favor ingresa tu nombre',
              whitespace: true
            }]}
          >
            <Input placeholder="Tu nombre completo" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Correo electrónico"
            rules={[
              { 
                required: true, 
                message: 'Por favor ingresa tu correo electrónico' 
              },
              { 
                type: 'email', 
                message: 'Por favor ingresa un correo electrónico válido' 
              }
            ]}
          >
            <Input placeholder="tu@email.com" />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Asunto"
            rules={[{ 
              required: true, 
              message: 'Por favor ingresa un asunto',
              max: 100,
              min: 5
            }]}
          >
            <Input placeholder="Asunto del mensaje" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Mensaje"
            rules={[
              { 
                required: true, 
                message: 'Por favor escribe tu mensaje' 
              },
              {
                min: 10,
                message: 'El mensaje debe tener al menos 10 caracteres'
              },
              {
                max: 1000,
                message: 'El mensaje no puede exceder los 1000 caracteres'
              }
            ]}
          >
            <TextArea 
              rows={6} 
              placeholder="Escribe tu mensaje aquí..." 
              showCount 
              maxLength={1000}
            />
          </Form.Item>

          <div className="contact-actions">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
              disabled={loading}
            >
              Enviar Mensaje
            </Button>
            
            <Button 
              type="default" 
              onClick={() => navigate(-1)}
              style={{ width: '100%', marginTop: '10px' }}
              disabled={loading}
            >
              Volver
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ContactPage;