import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import escapeHtml from 'escape-html';
import { Resend } from 'resend';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || '*',
  })
);
app.use(express.json());

// Rate limiting for public endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.',
    },
  },
});

// Validation Schema
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(1, 'Message is required').max(2000),
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Contact form endpoint
app.post('/api/contact', limiter, async (req, res) => {
  try {
    // Validate request body
    const data = contactSchema.parse(req.body);

    const timestamp = new Date().toLocaleString();
    const safeName = escapeHtml(data.name);
    const safeEmail = escapeHtml(data.email);
    const safeMessage = escapeHtml(data.message).replace(/\n/g, '<br>');

    const plainText = `You have received a new message from your portfolio contact form.

Name: ${data.name}
Email: ${data.email}
Timestamp: ${timestamp}

Message:
${data.message}`;

    const htmlText = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      <hr>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `;

    // Send email using Resend API
    const { data: resendData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: [process.env.CONTACT_EMAIL || 'admin@example.com'],
      replyTo: data.email,
      subject: `New Contact Form Submission from ${data.name}`,
      text: plainText,
      html: htmlText,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(error.message);
    }

    console.log('Message sent via Resend: %s', resendData?.id);

    res.json({
      success: true,
      data: {
        message: 'Your message has been sent successfully.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: (error as any).errors[0].message,
        },
      });
    } else {
      console.error('Email error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred while sending your message. Please try again later.',
        },
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
