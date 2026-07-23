import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import prisma from "../utils/prismaClient.js";
import { validatePassword } from "../utils/password.js";
import { listNonAdminUsers } from "../utils/dbUsers.js";
import { formatUser, formatUserWithCreatedAt } from "../utils/serializers.js";
import storage from "../storage/index.js";
import {
  REFRESH_TOKEN_EXPIRED,
  REFRESH_TOKEN_EXPIRED_MESSAGE,
  INVALID_REFRESH_TOKEN,
  INVALID_REFRESH_TOKEN_MESSAGE,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
} from "../constants/authErrors.js";

const normalizeEmail = (email) => email.trim().toLowerCase();

const formatUserResponse = (user) => ({
  ...formatUser(user),
  created_at: user.createdAt ?? null,
});

const removeFileFromStorageOrLocal = async (fileUrl) => {
  if (!fileUrl) return;

  const normalized = fileUrl.startsWith("/uploads/")
    ? fileUrl.replace(/^\/uploads\//, "")
    : fileUrl;

  if (!normalized || normalized.startsWith("http")) {
    return;
  }

  try {
    await storage.delete(normalized);
  } catch (_e) {
    // ignore cleanup errors
  }
};

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

const generateRefreshToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const createMailTransport = () => {
  return nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });
};

const sendResetPinEmail = async (email, pin) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: email,
    from: "austincomputadora@gmail.com",
    subject: "Tu código para recuperar contraseña de Teclia",
    text: `Tu código para restablecer la contraseña es: ${pin}. Este código expira en 15 minutos.`,
    html: `<p>Tu código para restablecer la contraseña es: <strong>${pin}</strong>.</p><p>Este código expira en 15 minutos.</p>`,
  };

  console.log("📨 Sending email to:", email);

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Email error:", error.response?.body || error);
    throw error;
  }
};

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Email, password, and name are required" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail } },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        name,
        role: "student",
      },
    });

    const token = generateToken(user.id, "student");
    const refreshToken = generateRefreshToken(user.id, "student");
    
    res.status(201).json({
      message: "User created successfully",
      token,
      refreshToken,
      user: formatUserResponse(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail } },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = bcryptjs.compareSync(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    
    res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      user: formatUserResponse(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, avatarUrl, removeAvatar } = req.body;
    const avatarFile = req.file;
    const shouldRemoveAvatar =
      removeAvatar === true || removeAvatar === "true" || removeAvatar === "1";

    if (!name && !avatarUrl && !avatarFile && !shouldRemoveAvatar) {
      return res.status(400).json({ error: "No profile information provided" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = {};

    if (name) {
      data.name = name;
    }

    if (avatarFile) {
      await removeFileFromStorageOrLocal(currentUser.avatarUrl);
      data.avatarUrl = await storage.upload(avatarFile, "avatars");
    } else if (shouldRemoveAvatar) {
      await removeFileFromStorageOrLocal(currentUser.avatarUrl);
      data.avatarUrl = null;
    } else if (avatarUrl) {
      data.avatarUrl = avatarUrl;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    res.json({
      message: "Profile updated successfully",
      user: formatUserResponse(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!bcryptjs.compareSync(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const hashedPassword = bcryptjs.hashSync(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: hashedPassword },
    });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail } },
    });

    if (!user) {
      return res.status(404).json({
        error:
          "Este correo no está registrado. Debes usar el mismo correo con el que iniciaste sesión.",
      });
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPin: pin, resetPinExpiresAt: expiresAt },
    });

    await sendResetPinEmail(user.email, pin);

    res.json({
      message: "Se ha enviado un PIN de recuperación al correo electrónico",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, pin, newPassword } = req.body;

    if (!email || !pin || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, PIN y nueva contraseña son requeridos" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail } },
    });

    if (!user) {
      return res
        .status(404)
        .json({
          error:
            "Este correo no está registrado. Usa el mismo correo con el que iniciaste sesión.",
        });
    }

    if (!user.resetPin || user.resetPin !== pin) {
      return res.status(401).json({ error: "PIN inválido" });
    }

    if (user.resetPinExpiresAt && user.resetPinExpiresAt < new Date()) {
      return res.status(401).json({ error: "El PIN ha expirado" });
    }

    const hashedPassword = bcryptjs.hashSync(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPin: null,
        resetPinExpiresAt: null,
      },
    });

    res.json({ message: "Contraseña restablecida correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: REFRESH_TOKEN_EXPIRED_MESSAGE, 
          code: REFRESH_TOKEN_EXPIRED,
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: INVALID_REFRESH_TOKEN_MESSAGE, 
          code: INVALID_REFRESH_TOKEN,
        });
      }
      return res.status(401).json({ error: INVALID_REFRESH_TOKEN_MESSAGE, code: INVALID_REFRESH_TOKEN });
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ error: USER_NOT_FOUND_MESSAGE, code: USER_NOT_FOUND });
    }

    const token = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.role);
    
    res.status(200).json({ 
      message: "Token refreshed successfully",
      token, 
      refreshToken: newRefreshToken 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    // Optional: Add logout timestamp to user record for audit purposes
    res.status(200).json({ 
      message: "Logout successful" 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyRecoveryEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El correo es obligatorio" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail } },
    });

    if (!user) {
      return res.status(404).json({
        error: "No existe una cuenta registrada con este correo.",
      });
    }

    res.json({ verified: true, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const listStudents = async (_req, res) => {
  try {
    const students = await listNonAdminUsers();
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateStudentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_tier } = req.body;
    const userId = Number(id);

    if (
      plan_tier !== null &&
      plan_tier !== "" &&
      !["basico", "pro", "master"].includes(plan_tier)
    ) {
      return res
        .status(400)
        .json({ error: "Plan no válido. Opciones: basico, pro, master" });
    }

    const normalizedPlan =
      plan_tier === "" || plan_tier === null ? null : plan_tier;
    const newRole = normalizedPlan ? "premium" : "student";

    const found = await prisma.user.findUnique({ where: { id: userId } });

    if (!found) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    if (found.role === "admin") {
      return res
        .status(400)
        .json({ error: "No se puede modificar un administrador" });
    }

    const student = await prisma.user.update({
      where: { id: userId },
      data: { planTier: normalizedPlan, role: newRole },
    });

    res.json({
      message: normalizedPlan
        ? `Plan ${normalizedPlan} asignado correctamente`
        : "Plan removido correctamente",
      student: formatUserWithCreatedAt(student),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const found = await prisma.user.findUnique({ where: { id: userId } });

    if (!found) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    if (found.role === "admin") {
      return res
        .status(400)
        .json({ error: "No se puede eliminar una cuenta de administrador" });
    }

    await removeFileFromStorageOrLocal(found.avatarUrl);

    const contentItems = await prisma.content.findMany({
      where: { uploadedBy: userId },
      select: { url: true },
    });

    for (const item of contentItems) {
      await removeFileFromStorageOrLocal(item.url);
    }

    await prisma.content.deleteMany({ where: { uploadedBy: userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
