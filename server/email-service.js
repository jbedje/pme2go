const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'postgres',
  password: 'Postgres2024!',
  port: 5432,
});

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    // For development, use Ethereal email (fake SMTP service)
    // In production, replace with real SMTP credentials
    try {
      // Create test account for development
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('✅ Email service initialized with test account');
      console.log(`📧 Test email credentials: ${testAccount.user}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      
      // Fallback: Create a dummy transporter for development
      this.transporter = {
        sendMail: async (options) => {
          console.log('📧 [MOCK EMAIL]', JSON.stringify(options, null, 2));
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  // Generate verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Store verification token in database
  async storeVerificationToken(userId, token, type = 'email_verification', expiresInHours = 24) {
    const client = await pool.connect();
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Delete any existing tokens for this user and type
      await client.query(
        'DELETE FROM user_verification_tokens WHERE user_id = $1 AND token_type = $2',
        [userId, type]
      );

      // Insert new token
      const result = await client.query(`
        INSERT INTO user_verification_tokens (user_id, token, token_type, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [userId, token, type, expiresAt]);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Verify token
  async verifyToken(token, type = 'email_verification') {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT t.*, u.email, u.name, u.uuid
        FROM user_verification_tokens t
        JOIN users u ON t.user_id = u.uuid
        WHERE t.token = $1 AND t.token_type = $2 AND t.expires_at > NOW() AND t.used_at IS NULL;
      `, [token, type]);

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Mark token as used
  async markTokenAsUsed(token) {
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE user_verification_tokens SET used_at = NOW() WHERE token = $1',
        [token]
      );
    } finally {
      client.release();
    }
  }

  // Send verification email
  async sendVerificationEmail(user) {
    try {
      const token = this.generateVerificationToken();
      await this.storeVerificationToken(user.uuid, token, 'email_verification');

      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

      const mailOptions = {
        from: '"PME2GO" <noreply@pme2go.com>',
        to: user.email,
        subject: 'Vérifiez votre adresse email - PME2GO',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérification Email - PME2GO</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 40px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
              .content { padding: 40px 30px; }
              .welcome { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
              .message { color: #4b5563; margin-bottom: 30px; line-height: 1.7; }
              .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: transform 0.2s; }
              .button:hover { transform: translateY(-2px); }
              .footer { background: #f8fafc; padding: 30px 20px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb; }
              .footer p { margin: 5px 0; font-size: 14px; }
              .security-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .security-note p { margin: 0; color: #92400e; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 PME2GO</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Plateforme de mise en relation professionnelle</p>
              </div>
              
              <div class="content">
                <div class="welcome">
                  Bonjour ${user.name} ! 👋
                </div>
                
                <div class="message">
                  <p>Bienvenue sur <strong>PME2GO</strong> ! Nous sommes ravis de vous compter parmi nous.</p>
                  
                  <p>Pour finaliser la création de votre compte et accéder à toutes les fonctionnalités de notre plateforme, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${verificationUrl}" class="button">
                    ✅ Vérifier mon adresse email
                  </a>
                </div>
                
                <div class="security-note">
                  <p><strong>⚠️ Note de sécurité :</strong> Ce lien est valable pendant 24 heures. Si vous n'avez pas créé de compte sur PME2GO, vous pouvez ignorer cet email.</p>
                </div>
                
                <div class="message">
                  <p>Si le bouton ne fonctionne pas, vous pouvez copier-coller ce lien dans votre navigateur :</p>
                  <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
                </div>
                
                <div class="message">
                  <p>Une fois votre email vérifié, vous pourrez :</p>
                  <ul style="color: #4b5563;">
                    <li>🔍 Rechercher et découvrir des opportunités</li>
                    <li>💼 Publier vos propres offres</li>
                    <li>🤝 Vous connecter avec d'autres professionnels</li>
                    <li>💬 Échanger via notre système de messagerie</li>
                    <li>📅 Participer aux événements</li>
                  </ul>
                </div>
              </div>
              
              <div class="footer">
                <p><strong>PME2GO</strong> - Votre plateforme de mise en relation professionnelle</p>
                <p>Cet email a été envoyé à ${user.email}</p>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                  © 2024 PME2GO. Tous droits réservés.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Bonjour ${user.name},

          Bienvenue sur PME2GO !

          Pour finaliser la création de votre compte, veuillez confirmer votre adresse email en cliquant sur ce lien :
          ${verificationUrl}

          Ce lien est valable pendant 24 heures.

          Si vous n'avez pas créé de compte sur PME2GO, vous pouvez ignorer cet email.

          Cordialement,
          L'équipe PME2GO
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (info.messageId.startsWith('mock-')) {
        console.log('📧 Mock verification email sent to:', user.email);
        console.log('🔗 Verification URL:', verificationUrl);
      } else {
        console.log('📧 Verification email sent:', info.messageId);
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };

    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user) {
    try {
      const token = this.generateVerificationToken();
      await this.storeVerificationToken(user.uuid, token, 'password_reset', 2); // 2 hours expiry

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      const mailOptions = {
        from: '"PME2GO" <noreply@pme2go.com>',
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe - PME2GO',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Réinitialisation mot de passe - PME2GO</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 40px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
              .content { padding: 40px 30px; }
              .welcome { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
              .message { color: #4b5563; margin-bottom: 30px; line-height: 1.7; }
              .button { display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; transition: transform 0.2s; }
              .button:hover { transform: translateY(-2px); }
              .footer { background: #f8fafc; padding: 30px 20px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb; }
              .security-note { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .security-note p { margin: 0; color: #991b1b; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔒 PME2GO</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Réinitialisation de mot de passe</p>
              </div>
              
              <div class="content">
                <div class="welcome">
                  Bonjour ${user.name},
                </div>
                
                <div class="message">
                  <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte PME2GO.</p>
                  
                  <p>Si vous êtes à l'origine de cette demande, cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${resetUrl}" class="button">
                    🔑 Réinitialiser mon mot de passe
                  </a>
                </div>
                
                <div class="security-note">
                  <p><strong>⚠️ Important :</strong> Ce lien est valable pendant 2 heures seulement. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email et votre mot de passe restera inchangé.</p>
                </div>
                
                <div class="message">
                  <p>Si le bouton ne fonctionne pas, copiez-collez ce lien :</p>
                  <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; font-size: 14px;">${resetUrl}</p>
                </div>
              </div>
              
              <div class="footer">
                <p><strong>PME2GO</strong> - Sécurité de votre compte</p>
                <p>Si vous avez des questions, contactez notre support</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Bonjour ${user.name},

          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte PME2GO.

          Pour réinitialiser votre mot de passe, cliquez sur ce lien :
          ${resetUrl}

          Ce lien est valable pendant 2 heures.

          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

          Cordialement,
          L'équipe PME2GO
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (info.messageId.startsWith('mock-')) {
        console.log('📧 Mock password reset email sent to:', user.email);
        console.log('🔗 Reset URL:', resetUrl);
      } else {
        console.log('📧 Password reset email sent:', info.messageId);
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: '"PME2GO" <noreply@pme2go.com>',
        to: user.email,
        subject: 'Bienvenue sur PME2GO ! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px 20px; text-align: center; }
              .content { padding: 40px 30px; }
              .feature { display: flex; align-items: center; margin: 20px 0; }
              .feature-icon { font-size: 24px; margin-right: 15px; }
              .footer { background: #f8fafc; padding: 30px 20px; text-align: center; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Félicitations ${user.name} !</h1>
                <p>Votre compte PME2GO est maintenant actif</p>
              </div>
              
              <div class="content">
                <p>Votre adresse email a été vérifiée avec succès ! Vous pouvez maintenant profiter de toutes les fonctionnalités de PME2GO :</p>
                
                <div class="feature">
                  <span class="feature-icon">🔍</span>
                  <div>
                    <strong>Recherche avancée</strong><br>
                    Trouvez les opportunités qui vous correspondent
                  </div>
                </div>
                
                <div class="feature">
                  <span class="feature-icon">💼</span>
                  <div>
                    <strong>Gestion d'opportunités</strong><br>
                    Publiez et gérez vos offres facilement
                  </div>
                </div>
                
                <div class="feature">
                  <span class="feature-icon">🤝</span>
                  <div>
                    <strong>Réseau professionnel</strong><br>
                    Connectez-vous avec d'autres entrepreneurs
                  </div>
                </div>
                
                <div class="feature">
                  <span class="feature-icon">💬</span>
                  <div>
                    <strong>Messagerie intégrée</strong><br>
                    Communiquez directement avec vos contacts
                  </div>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    🚀 Commencer l'exploration
                  </a>
                </div>
              </div>
              
              <div class="footer">
                <p>Merci de faire confiance à PME2GO !</p>
                <p>L'équipe PME2GO</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();