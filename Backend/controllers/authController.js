import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import { getDb, saveDatabase } from '../db/init.js';
import { getUploadsPath } from '../config/uploads.js';
import { validatePassword } from '../utils/password.js';
import { listNonAdminUsers, mapUserRows, normalizeLegacyUsers, ensureUserColumn } from '../utils/dbUsers.js';
import { uploadToStorage, getSignedStorageUrl, resolveStoragePath, deleteFromStorage } from '../lib/supabaseClient.js';

const normalizeEmail = (email) => email.trim().toLowerCase();

const formatUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  plan_tier: user.plan_tier || null,
  avatar_url: user.avatar_url || null,
});

const removeFileFromStorageOrLocal = async (fileUrl) => {
  if (!fileUrl) return;

  const storagePath = resolveStoragePath(fileUrl);
  if (storagePath) {
    try {
      await deleteFromStorage(storagePath);
    } catch (_e) {
      // ignore cleanup errors
    }
    return;
  }

  if (fileUrl.startsWith('/uploads/')) {
    const oldPath = path.join(getUploadsPath(), fileUrl.replace(/^\/uploads\//, ''));
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (_e) {
        // ignore cleanup errors
      }
    }
  }
};

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

const createMailTransport = () => {
  return nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
};

const sendResetPinEmail = async (email, pin) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: 'austincomputadora@gmail.com',
    subject: 'Tu código para recuperar contraseña de Teclia',
    text: `Tu código para restablecer la contraseña es: ${pin}. Este código expira en 15 minutos.`,
    html: `<p>Tu código para restablecer la contraseña es: <strong>${pin}</strong>.</p><p>Este código expira en 15 minutos.</p>`,
  };

  console.log('📨 Sending email to:', email);

  try {
    await sgMail.send(msg);
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Email error:', error.response?.body || error);
    throw error;
  }
};

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const normalizedEmail = normalizeEmail(email);
    const db = getDb();

    const existingUser = await db.exec('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (existingUser.length > 0 && existingUser[0].values.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    const insertResult = await db.exec(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?) RETURNING id',
      [normalizedEmail, hashedPassword, name, 'student']
    );

    saveDatabase();

    const userId = insertResult[0].values[0][0];

    const token = generateToken(userId, 'student');
    res.json({
      message: 'User created successfully',
      token,
      user: { id: userId, email: normalizedEmail, name, role: 'student', avatar_url: null }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const db = getDb();
    const result = await db.exec(
      'SELECT id, email, name, password_hash, role, plan_tier, avatar_url FROM users WHERE LOWER(email) = ?',
      [normalizedEmail]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const columns = result[0].columns;
    const values = result[0].values[0];
    const user = {};
    columns.forEach((col, idx) => {
      user[col] = values[idx];
    });

    const passwordMatch = bcryptjs.compareSync(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.avatar_url) {
      const avatarPath = resolveStoragePath(user.avatar_url);
      if (avatarPath) {
        user.avatar_url = await getSignedStorageUrl(avatarPath);
      }
    }

    const token = generateToken(user.id, user.role);
    res.json({
      message: 'Login successful',
      token,
      user: formatUser(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const db = getDb();
    const result = await db.exec('SELECT id, email, name, role, plan_tier, avatar_url FROM users WHERE id = ?', [req.user.id]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cols = result[0].columns;
    const vals = result[0].values[0];
    const user = {};
    cols.forEach((c, i) => (user[c] = vals[i]));

    if (user.avatar_url) {
      const avatarPath = resolveStoragePath(user.avatar_url);
      if (avatarPath) {
        user.avatar_url = await getSignedStorageUrl(avatarPath);
      }
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    const avatarFile = req.file;
    if (!name && !avatarUrl && !avatarFile) {
      return res.status(400).json({ error: 'No profile information provided' });
    }

    const db = getDb();
    const result = await db.exec('SELECT id, email, name, role, plan_tier, avatar_url FROM users WHERE id = ?', [req.user.id]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cols = result[0].columns;
    const vals = result[0].values[0];
    const currentUser = {};
    cols.forEach((c, i) => (currentUser[c] = vals[i]));

    const updates = [];
    const params = [];
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (avatarFile) {
      await removeFileFromStorageOrLocal(currentUser.avatar_url);

      const storagePath = `avatars/${req.user.id}-${Date.now()}-${avatarFile.filename}`;
      const fileBuffer = fs.readFileSync(avatarFile.path);
      await uploadToStorage(storagePath, fileBuffer, avatarFile.mimetype);

      updates.push('avatar_url = ?');
      params.push(storagePath);

      fs.unlinkSync(avatarFile.path);
    } else if (avatarUrl) {
      updates.push('avatar_url = ?');
      params.push(avatarUrl);
    }
    params.push(req.user.id);

    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDatabase();

    const updatedResult = await db.exec('SELECT id, email, name, role, plan_tier, avatar_url FROM users WHERE id = ?', [req.user.id]);
    const updatedCols = updatedResult[0].columns;
    const updatedVals = updatedResult[0].values[0];
    const user = {};
    updatedCols.forEach((c, i) => (user[c] = updatedVals[i]));

    if (user.avatar_url) {
      const avatarPath = resolveStoragePath(user.avatar_url);
      if (avatarPath) {
        user.avatar_url = await getSignedStorageUrl(avatarPath);
      }
    }

    res.json({ message: 'Profile updated successfully', user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const db = getDb();
    const result = await db.exec('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const storedHash = result[0].values[0][0];
    if (!bcryptjs.compareSync(currentPassword, storedHash)) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const hashedPassword = bcryptjs.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id]);
    saveDatabase();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const db = getDb();
    const result = await db.exec('SELECT id, email FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({
        error: 'Este correo no está registrado. Debes usar el mismo correo con el que iniciaste sesión.',
      });
    }

    const userId = result[0].values[0][0];
    const registeredEmail = result[0].values[0][1];
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.run('UPDATE users SET reset_pin = ?, reset_pin_expires_at = ? WHERE id = ?', [pin, expiresAt, userId]);
    saveDatabase();

    await sendResetPinEmail(registeredEmail, pin);

    res.json({ message: 'Se ha enviado un PIN de recuperación al correo electrónico' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, pin, newPassword } = req.body;
    if (!email || !pin || !newPassword) {
      return res.status(400).json({ error: 'Email, PIN y nueva contraseña son requeridos' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const normalizedEmail = normalizeEmail(email);
    const db = getDb();
    const result = await db.exec(
      'SELECT reset_pin, reset_pin_expires_at FROM users WHERE LOWER(email) = ?',
      [normalizedEmail]
    );
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Este correo no está registrado. Usa el mismo correo con el que iniciaste sesión.' });
    }

    const storedPin = result[0].values[0][0];
    const expiresAt = result[0].values[0][1];
    if (!storedPin || storedPin !== pin) {
      return res.status(401).json({ error: 'PIN inválido' });
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return res.status(401).json({ error: 'El PIN ha expirado' });
    }

    const hashedPassword = bcryptjs.hashSync(newPassword, 10);
    await db.run(
      'UPDATE users SET password_hash = ?, reset_pin = NULL, reset_pin_expires_at = NULL WHERE LOWER(email) = ?',
      [hashedPassword, normalizedEmail]
    );
    saveDatabase();

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  res.json({ message: 'Logout successful' });
};

export const verifyRecoveryEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El correo es obligatorio' });
    }

    const normalizedEmail = normalizeEmail(email);
    const db = getDb();
    const result = await db.exec(
      'SELECT id, email, name FROM users WHERE LOWER(email) = ?',
      [normalizedEmail]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({
        error: 'No existe una cuenta registrada con este correo.',
      });
    }

    const registeredEmail = result[0].values[0][1];
    res.json({ verified: true, email: registeredEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listStudents = async (req, res) => {
  try {
    const db = getDb();
    const result = await listNonAdminUsers(db);
    const students = mapUserRows(result, formatUser);
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStudentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_tier } = req.body;

    if (plan_tier !== null && plan_tier !== '' && !['basico', 'pro', 'master'].includes(plan_tier)) {
      return res.status(400).json({ error: 'Plan no válido. Opciones: basico, pro, master' });
    }

    const normalizedPlan = plan_tier === '' || plan_tier === null ? null : plan_tier;
    const newRole = normalizedPlan ? 'premium' : 'student';

    const db = getDb();
    await normalizeLegacyUsers(db);
    await ensureUserColumn(db, 'plan_tier', 'plan_tier TEXT DEFAULT NULL');

    const found = await db.exec('SELECT id, role FROM users WHERE id = ?', [id]);
    if (found.length === 0 || found[0].values.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    if (found[0].values[0][1] === 'admin') {
      return res.status(400).json({ error: 'No se puede modificar un administrador' });
    }

    await db.run('UPDATE users SET plan_tier = ?, role = ? WHERE id = ?', [normalizedPlan, newRole, id]);
    saveDatabase();

    const updated = await db.exec(
      'SELECT id, name, email, role, plan_tier, avatar_url, created_at FROM users WHERE id = ?',
      [id]
    );
    const cols = updated[0].columns;
    const vals = updated[0].values[0];
    const student = {};
    cols.forEach((col, i) => {
      student[col] = vals[i];
    });

    res.json({
      message: normalizedPlan ? `Plan ${normalizedPlan} asignado correctamente` : 'Plan removido correctamente',
      student: { ...formatUser(student), created_at: student.created_at },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const found = await db.exec('SELECT id, role, avatar_url FROM users WHERE id = ?', [id]);
    if (found.length === 0 || found[0].values.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    const role = found[0].values[0][1];
    const avatarUrl = found[0].values[0][2];

    if (role === 'admin') {
      return res.status(400).json({ error: 'No se puede eliminar una cuenta de administrador' });
    }

    await removeFileFromStorageOrLocal(avatarUrl);

    const contentResults = await db.exec('SELECT url FROM content WHERE uploaded_by = ?', [id]);
    if (contentResults.length > 0 && contentResults[0].values.length > 0) {
      for (const row of contentResults[0].values) {
        const fileUrl = row[0];
        await removeFileFromStorageOrLocal(fileUrl);
      }
      await db.run('DELETE FROM content WHERE uploaded_by = ?', [id]);
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);
    saveDatabase();

    res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
