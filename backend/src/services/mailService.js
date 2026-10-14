import nodemailer from 'nodemailer';
import config from '../config/config.js';

class MailService {
  constructor() {
    this.transporter = null;
    if (config.mail.user && config.mail.pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: config.mail.host,
          port: config.mail.port,
          secure: config.mail.port === 465,
          auth: {
            user: config.mail.user,
            pass: config.mail.pass,
          },
        });
      } catch (err) {
        console.warn('Failed to initialize mail transporter:', err.message);
      }
    }
  }

  async sendWelcomeEmail(user, rawPassword) {
    const recipient = user.personal_email || user.email;
    if (!recipient) return;

    const mailOptions = {
      from: `"${config.mail.fromName}" <${config.mail.fromAddress}>`,
      to: recipient,
      subject: 'Welcome to Leave Management System',
      text: `Hello ${user.first_name},\n\nYour account has been created successfully.\n\nLogin Email: ${user.email}\nTemporary Password: ${rawPassword}\n\nPlease log in and update your password immediately.\n\nBest regards,\nHR Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Welcome to Leave Management System</h2>
          <p>Hello <strong>${user.first_name} ${user.last_name}</strong>,</p>
          <p>Your employee account has been created successfully.</p>
          <div style="background: #f4f6f8; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Employee Number:</strong> ${user.employee_number}</p>
            <p style="margin: 4px 0;"><strong>Login Email:</strong> ${user.email}</p>
            <p style="margin: 4px 0;"><strong>Temporary Password:</strong> ${rawPassword}</p>
          </div>
          <p>Please log in and change your password upon your first login.</p>
          <p>Best regards,<br/><strong>HR Operations Team</strong></p>
        </div>
      `,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
      } catch (err) {
        console.warn('Mail send failed (non-blocking):', err.message);
      }
    } else {
      console.log(`[Mail Mock] Welcome email for ${recipient} (password: ${rawPassword})`);
    }
  }
}

export default new MailService();
