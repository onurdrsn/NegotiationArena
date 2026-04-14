export async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  if (!apiKey) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject} | html: ${html}`);
    return { success: true, mocked: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Negotiation Arena <noreply@onurd.com.tr>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to send email:', errorText);
    throw new Error('Failed to send email');
  }

  return response.json();
}

export function generateVerificationCode() {
  // 6 digit numerical code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getVerificationEmailHtml(code: string) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #050810; padding: 40px; color: #ffffff;">
      <div style="max-w-4xl max-width: 600px; margin: 0 auto; background-color: #0a1628; border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #22c55e; padding: 20px; text-align: center;">
          <h1 style="color: #000000; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Kimlik Doğrulama</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #9ca3af;">Müzakere Masasına oturmadan önce aşağıdaki 6 haneli yetki doğrulama kodunu sisteme girmeniz gerekmektedir:</p>
          <div style="background-color: #050810; border: 1px solid #374151; padding: 20px; text-align: center; margin: 30px 0; border-radius: 4px;">
            <span style="font-size: 32px; font-weight: bold; color: #eab308; letter-spacing: 5px; font-family: monospace;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Bu kod 15 dakika boyunca geçerlidir. Başarısızlık durumunda tüm sorumluluk size aittir.</p>
        </div>
      </div>
    </div>
  `;
}

export function getResetPasswordHtml(code: string) {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #050810; padding: 40px; color: #ffffff;">
      <div style="max-w-4xl max-width: 600px; margin: 0 auto; background-color: #0a1628; border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #eab308; padding: 20px; text-align: center;">
          <h1 style="color: #000000; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Şifre Sıfırlama</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #9ca3af;">Şifrenizi sıfırlamak için bir talepte bulundunuz. Aşağıdaki kodu kullanarak yeni bir şifre belirleyebilirsiniz:</p>
          <div style="background-color: #050810; border: 1px solid #374151; padding: 20px; text-align: center; margin: 30px 0; border-radius: 4px;">
            <span style="font-size: 32px; font-weight: bold; color: #22c55e; letter-spacing: 5px; font-family: monospace;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelin.</p>
        </div>
      </div>
    </div>
  `;
}
