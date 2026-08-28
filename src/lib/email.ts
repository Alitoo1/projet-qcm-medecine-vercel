import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const fromEmail = process.env.EMAIL_FROM || 'no-reply@qcm-medecine.com'
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function sendWelcomeEmail(to: string, prenom: string): Promise<void> {
  const dashboardUrl = `${baseUrl}/tableau-de-bord`

  if (!resend) {
    console.log(`\n========================================`)
    console.log(`[EMAIL BIENVENUE (Dev Mode)]`)
    console.log(`À: ${to} (${prenom})`)
    console.log(`Accès Dashboard: ${dashboardUrl}`)
    console.log(`========================================\n`)
    return
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Bienvenue sur QCM Médecine FMP Fès ! 🩺',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0d9488; margin-bottom: 8px;">Bienvenue sur QCM Médecine, ${prenom} ! 🩺</h1>
            <p style="color: #64748b; font-size: 15px;">Votre compte a été activé avec succès.</p>
          </div>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #0f172a; margin-top: 0;">Comment bien démarrer votre entraînement :</h3>
            <ul style="padding-left: 20px; color: #334155;">
              <li><strong>Entraînement par cours :</strong> Explorez vos semestres et modules avec correction immédiate et explications détaillées.</li>
              <li><strong>Examens Blancs :</strong> Testez vos connaissances en conditions réelles avec minuteur chronométré.</li>
              <li><strong>Favoris &amp; Notes :</strong> Épinglez les questions clés (⭐) et rédigez vos fiches mémos privées (📝).</li>
              <li><strong>Mode Révision :</strong> Rejouez automatiquement uniquement les questions où vous avez fait des erreurs.</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
              Accéder à mon tableau de bord
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Faculté de Médecine et de Pharmacie de Fès — Université Sidi Mohamed Ben Abdellah
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de bienvenue:", error)
  }
}

export async function sendVerificationEmail(to: string, token: string, prenom: string): Promise<void> {
  const verifyUrl = `${baseUrl}/verifier-email?token=${token}`

  if (!resend) {
    console.log(`\n========================================`)
    console.log(`[EMAIL VERIFICATION (Dev Mode)]`)
    console.log(`À: ${to} (${prenom})`)
    console.log(`Lien: ${verifyUrl}`)
    console.log(`========================================\n`)
    return
  }

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Confirmation de votre compte — QCM Médecine FMP Fès',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #0d9488;">Bienvenue sur QCM Médecine, ${prenom} !</h2>
        <p>Merci pour votre inscription. Veuillez cliquer sur le bouton ci-dessous pour activer votre compte :</p>
        <div style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Vérifier mon adresse email
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${verifyUrl}</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">Ce lien est valable 24 heures.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, token: string, prenom: string): Promise<void> {
  const resetUrl = `${baseUrl}/reinitialiser?token=${token}`

  if (!resend) {
    console.log(`\n========================================`)
    console.log(`[PASSWORD RESET (Dev Mode)]`)
    console.log(`À: ${to} (${prenom})`)
    console.log(`Lien: ${resetUrl}`)
    console.log(`========================================\n`)
    return
  }

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Réinitialisation de votre mot de passe — QCM Médecine',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #0d9488;">Bonjour ${prenom},</h2>
        <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte.</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Créer un nouveau mot de passe
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${resetUrl}</p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
      </div>
    `,
  })
}
