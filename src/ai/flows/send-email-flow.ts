
'use server';
/**
 * @fileOverview A flow for sending emails via SMTP.
 *
 * - sendEmail - A function that sends an email.
 */

import * as nodemailer from 'nodemailer';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ success: boolean; message: string }> {
  
    const { to, subject, html } = input;

    // Note: For this to work, you must configure SMTP settings in your .env file.
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"TenantCheck Platform" <${process.env.SMTP_USER}>`, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        html: html, // html body
      });
      return { success: true, message: 'Email sent successfully.' };
    } catch (error: any) {
        console.error("Failed to send email:", error);
        // In a real app, you might want more robust error handling or logging.
        // For now, we'll return a failure message.
        // Avoid exposing detailed error messages to the client.
        return { success: false, message: 'Failed to send email. Please check server logs and SMTP configuration.' };
    }
}
