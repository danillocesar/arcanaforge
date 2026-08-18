const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'ArcanaForge <onboarding@resend.dev>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function sendSessionProposalEmail(party, proposal) {
  if (!resend) return; // sem chave configurada: recurso continua funcionando só via UI

  const proposer = party.members.find((m) => m.uid === proposal.proposedBy);
  const recipients = party.members
    .filter((m) => m.uid !== proposal.proposedBy && m.email)
    .map((m) => m.email);
  if (recipients.length === 0) return;

  const when = proposal.time ? `${proposal.date} às ${proposal.time}` : proposal.date;
  const link = `${CLIENT_URL}/tormenta/party/${party._id}/calendar`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: recipients,
    subject: `${party.name}: nova data de sessão proposta`,
    html: `<p>${proposer?.email || 'Alguém'} propôs jogar em <strong>${when}</strong>.</p>
           <p><a href="${link}">Confirme ou recuse aqui</a>.</p>`,
    text: `${proposer?.email || 'Alguém'} propôs jogar em ${when}. Confirme ou recuse em: ${link}`,
  });
}

module.exports = { sendSessionProposalEmail };
