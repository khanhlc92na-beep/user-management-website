-- Create a default super admin user for local development
INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role, 
  email_verified
) VALUES (
  'admin@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5W', -- password: admin123
  'Admin',
  'User',
  'super_admin',
  TRUE
) ON CONFLICT (email) DO NOTHING;
