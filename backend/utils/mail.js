import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.MAIL_USER, // your gmail address
    pass: process.env.MAIL_PASS, // app password
  },
});

export async function sendMail({ to, subject, html, text }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("MAIL_USER or MAIL_PASS is not set");
  }

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || `"Throughline" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
}