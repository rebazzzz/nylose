const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log("Email service error:", error);
  } else {
    console.log("Email service ready");
  }
});

class EmailService {
  // Send registration confirmation email
  async sendRegistrationConfirmation(userEmail, userData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "Välkommen till Nylöse SportCenter!",
      html: this.getRegistrationEmailTemplate(userData),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Registration email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending registration email:", error);
      return { success: false, error: error.message };
    }
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(userEmail, paymentData) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: "Betalning bekräftad - Nylöse SportCenter",
      html: this.getPaymentEmailTemplate(paymentData),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Payment confirmation email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending payment email:", error);
      return { success: false, error: error.message };
    }
  }

  // Email templates
  getRegistrationEmailTemplate(userData) {
    return `
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Välkommen till Nylöse SportCenter</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4ed15; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f5f5f0; }
          .footer { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
          .btn { background-color: #0069bb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nylöse SportCenter</h1>
            <p>Välkommen som medlem!</p>
          </div>

          <div class="content">
            <h2>Hej ${userData.first_name}!</h2>
            <p>Tack för att du registrerat dig hos Nylöse SportCenter. Din registrering har mottagits och är nu aktiv.</p>

            <h3>Dina uppgifter:</h3>
            <ul>
              <li><strong>Namn:</strong> ${userData.first_name} ${userData.last_name}</li>
              <li><strong>E-post:</strong> ${userData.email}</li>
              <li><strong>Telefon:</strong> ${userData.phone || "Ej angivet"}</li>
              <li><strong>Medlemskap:</strong> 3 månader (600 kr/termin)</li>
            </ul>

            <p><strong>Nästa steg:</strong> Slutför din betalning för att aktivera ditt medlemskap.</p>

            <p>Du kan nu logga in på vår hemsida för att:</p>
            <ul>
              <li>Se ditt schema</li>
              <li>Uppdatera dina uppgifter</li>
              <li>Se dina betalningar</li>
            </ul>

            <a href="http://localhost:3000" class="btn">Logga in nu</a>
          </div>

          <div class="footer">
            <p>Nylöse SportCenter<br>
            Bergsgårdsgärdet 89C, 424 32 Angered<br>
            E-post: nylosesportcenter@gmail.com<br>
            Telefon: +46-72-910-25-75</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentEmailTemplate(paymentData) {
    return `
      <!DOCTYPE html>
      <html lang="sv">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Betalning bekräftad - Nylöse SportCenter</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4ed15; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f5f5f0; }
          .footer { background-color: #1a1a1a; color: white; padding: 20px; text-align: center; }
          .success { color: #28a745; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nylöse SportCenter</h1>
            <p class="success">Betalning bekräftad!</p>
          </div>

          <div class="content">
            <h2>Betalning mottagen</h2>
            <p>Tack för din betalning! Ditt medlemskap är nu fullt aktiverat.</p>

            <h3>Betalningsuppgifter:</h3>
            <ul>
              <li><strong>Belopp:</strong> ${paymentData.amount} kr</li>
              <li><strong>Betalningsmetod:</strong> ${paymentData.payment_method}</li>
              <li><strong>Transaktions-ID:</strong> ${paymentData.transaction_id || "N/A"}</li>
              <li><strong>Datum:</strong> ${new Date(paymentData.payment_date).toLocaleDateString("sv-SE")}</li>
            </ul>

            <h3>Ditt medlemskap:</h3>
            <ul>
              <li><strong>Startdatum:</strong> ${new Date(paymentData.membership_start).toLocaleDateString("sv-SE")}</li>
              <li><strong>Slutdatum:</strong> ${new Date(paymentData.membership_end).toLocaleDateString("sv-SE")}</li>
              <li><strong>Status:</strong> Aktiv</li>
            </ul>

            <p>Välkommen att träna! Du hittar schemat och mer information på vår hemsida.</p>
          </div>

          <div class="footer">
            <p>Nylöse SportCenter<br>
            Bergsgårdsgärdet 89C, 424 32 Angered<br>
            E-post: nylosesportcenter@gmail.com<br>
            Telefon: +46-72-910-25-75</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
