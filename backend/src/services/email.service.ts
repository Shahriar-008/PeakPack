// ══════════════════════════════════════════════════════════════
// PeakPack — Email Service (Step 12)
// ══════════════════════════════════════════════════════════════

import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

// ── Transporter ───────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'localhost',
  port:   parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'PeakPack <noreply@peakpack.app>';

// ── HTML Template Base ────────────────────────────────────────

function baseTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f0f11; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e2e8f0; }
    .container { max-width: 560px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2d2d44; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .header .emoji { font-size: 48px; display: block; margin-bottom: 8px; }
    .body { padding: 32px 40px; }
    .body p { line-height: 1.7; color: #94a3b8; margin: 0 0 16px; }
    .body strong { color: #e2e8f0; }
    .stat-row { display: flex; gap: 16px; margin: 24px 0; }
    .stat { flex: 1; background: #0f0f1a; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #2d2d44; }
    .stat .value { font-size: 28px; font-weight: 800; color: #6366f1; display: block; }
    .stat .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-top: 4px; }
    .cta { display: block; width: fit-content; margin: 24px auto 0; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; text-align: center; }
    .footer { padding: 20px 40px; text-align: center; border-top: 1px solid #2d2d44; }
    .footer p { font-size: 12px; color: #475569; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="emoji">🏔️</span>
      <h1>PeakPack</h1>
    </div>
    <div class="body">${bodyHtml}</div>
    <div class="footer">
      <p>You're receiving this because you're part of PeakPack. <a href="${process.env.APP_URL}/settings" style="color:#6366f1">Manage notifications</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ── Templates ─────────────────────────────────────────────────

function welcomeTemplate(name: string): string {
  return baseTemplate('Welcome to PeakPack!', `
    <p><strong>Welcome to PeakPack, ${name}! 🎉</strong></p>
    <p>You've just joined a community of people who show up every day — for their health, their goals, and each other.</p>
    <p>Here's how to get started:</p>
    <p>1. <strong>Complete your first check-in</strong> to earn 50 XP<br/>
       2. <strong>Join or create a Pack</strong> — accountability is better together<br/>
       3. <strong>Set your goal</strong> so your Pack can cheer you on</p>
    <a href="${process.env.APP_URL}/onboarding" class="cta">Complete Onboarding →</a>
  `);
}

function streakReminderTemplate(name: string, streak: number): string {
  return baseTemplate('Your streak needs you!', `
    <p>Hey <strong>${name}</strong>,</p>
    <p>Your 🔥 <strong>${streak}-day streak</strong> is at risk! You haven't checked in yet today.</p>
    <p>It only takes a few seconds — log your workout or rest day before midnight UTC to keep the streak alive.</p>
    <a href="${process.env.APP_URL}/dashboard" class="cta">Check In Now →</a>
  `);
}

function streakBrokenTemplate(name: string, wasStreak: number): string {
  return baseTemplate('Your streak ended — start fresh!', `
    <p>Hey <strong>${name}</strong>,</p>
    <p>Your ${wasStreak}-day streak ended. That happens — what matters is what you do next.</p>
    <p>Every champion has a comeback story. Start fresh today and build something even bigger.</p>
    <a href="${process.env.APP_URL}/dashboard" class="cta">Start Fresh Today →</a>
  `);
}

function badgeUnlockedTemplate(name: string, badgeName: string, badgeEmoji: string, description: string): string {
  return baseTemplate(`Badge Unlocked: ${badgeName}`, `
    <p style="text-align:center;font-size:64px;margin:0">${badgeEmoji}</p>
    <p style="text-align:center"><strong>${name}</strong>, you just unlocked the <strong>${badgeName}</strong> badge!</p>
    <p style="text-align:center;color:#94a3b8">${description}</p>
    <a href="${process.env.APP_URL}/profile" class="cta">View Your Profile →</a>
  `);
}

function weeklyRecapTemplate(
  name: string,
  stats: {
    weeklyXP:     number;
    checkIns:     number;
    streak:       number;
    badgesEarned: number;
    packRank:     number | null;
  }
): string {
  return baseTemplate('Your Weekly Recap 📊', `
    <p>Great week, <strong>${name}</strong>! Here's how you did:</p>
    <div class="stat-row">
      <div class="stat"><span class="value">${stats.weeklyXP}</span><div class="label">XP Earned</div></div>
      <div class="stat"><span class="value">${stats.checkIns}</span><div class="label">Check-ins</div></div>
      <div class="stat"><span class="value">${stats.streak}🔥</span><div class="label">Streak</div></div>
    </div>
    ${stats.badgesEarned > 0 ? `<p>🏅 You earned <strong>${stats.badgesEarned} badge${stats.badgesEarned > 1 ? 's' : ''}</strong> this week!</p>` : ''}
    ${stats.packRank ? `<p>🏆 You're ranked <strong>#${stats.packRank}</strong> in your Pack this week!</p>` : ''}
    <p>Keep it up — next week, let's go even further.</p>
    <a href="${process.env.APP_URL}/dashboard" class="cta">See Full Stats →</a>
  `);
}

// ── Send Helpers ──────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_HOST || process.env.NODE_ENV === 'test') {
    logger.debug('Email skipped (no SMTP config or test env)', { to, subject });
    return;
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    logger.info('Email sent', { to, subject, messageId: info.messageId });
  } catch (err) {
    logger.error('Failed to send email', { to, subject, error: err });
    throw err;
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendEmail(to, 'Welcome to PeakPack! 🏔️', welcomeTemplate(name));
}

export async function sendStreakReminderEmail(to: string, name: string, streak: number): Promise<void> {
  await sendEmail(to, `🔥 Day ${streak} streak at risk — check in now!`, streakReminderTemplate(name, streak));
}

export async function sendStreakBrokenEmail(to: string, name: string, wasStreak: number): Promise<void> {
  await sendEmail(to, `Your ${wasStreak}-day streak ended. Time to rebuild 💪`, streakBrokenTemplate(name, wasStreak));
}

export async function sendBadgeUnlockedEmail(
  to: string,
  name: string,
  badgeName: string,
  badgeEmoji: string,
  description: string
): Promise<void> {
  await sendEmail(to, `${badgeEmoji} Badge Unlocked: ${badgeName}`, badgeUnlockedTemplate(name, badgeName, badgeEmoji, description));
}

export async function sendWeeklyRecapEmail(
  to: string,
  name: string,
  stats: {
    weeklyXP:     number;
    checkIns:     number;
    streak:       number;
    badgesEarned: number;
    packRank:     number | null;
  }
): Promise<void> {
  await sendEmail(to, '📊 Your PeakPack Weekly Recap', weeklyRecapTemplate(name, stats));
}

export const emailService = {
  sendWelcomeEmail,
  sendStreakReminderEmail,
  sendStreakBrokenEmail,
  sendBadgeUnlockedEmail,
  sendWeeklyRecapEmail,
};

export default emailService;
