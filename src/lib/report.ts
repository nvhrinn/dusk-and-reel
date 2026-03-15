import { Resend } from "resend";

const resend = new Resend("re_378XCzxf_5qN1eHR42YcdJgNbbsDWyhra");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, page } = req.body;

  if (!message || message.length < 5) {
    return res.status(400).json({ error: "Pesan terlalu pendek" });
  }

  try {
    await resend.emails.send({
      from: "Report <report@domainkamu.com>",
      to: "gmailkamu@gmail.com",
      subject: "Website Report",
      text: `
Page: ${page}

Message:
${message}
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengirim email" });
  }
}
