import prisma from './db';
import { hashPassword } from './auth';

export const DEFAULT_SITE_CONTENT: Record<string, string> = {
  // Site Basic Settings
  site_name: 'Verified Labour',
  site_tagline: 'Shrivastava ProFunnels Ventures Pvt Ltd',
  maintenance_mode: 'false',
  platform_fee_percent: '10',
  default_search_radius_km: '15',

  // Hero Section
  hero_title: "India's #1 Labour Hub",
  hero_subtitle: 'Verified. Nearby. Reliable.',
  hero_description:
    'From electricians to cooks, from house caretakers to office boys — find verified workers near you, just like Ola or Uber.',
  hero_button_primary: 'Find a Worker',
  hero_button_secondary: 'Become a Worker',
  hero_promotional_tag: 'Different Jobs | Same Opportunities | A Stronger India',
  hero_yellow_banner_text: 'Who is NOT on Verified Labour?',
  hero_image_url: '/images/home/hero-workers-group.jpg',

  // About Section
  about_title: "India's Most Trusted On-Demand Labour Marketplace",
  about_subtitle: 'Connecting households and businesses with Aadhaar & Bank verified skilled craftsmen.',
  about_content:
    'Verified Labour was founded to organize India\'s informal labour workforce. Every worker on our platform undergoes strict Aadhaar identity verification and Cashfree bank account validation before taking jobs.',
  about_image_url: '/images/home/about-banner.jpg',

  // How It Works
  how_it_works_title: 'How Verified Labour Works',
  how_it_works_subtitle: 'Book a verified professional in 3 simple steps',
  how_it_works_json: JSON.stringify([
    { step: 1, title: 'Search & Select', desc: 'Browse nearby verified workers by skill, rating, and hourly rate.' },
    { step: 2, title: 'Book & Confirm', desc: 'Choose preferred time and share job location with OTP security.' },
    { step: 3, title: 'Job Done & Pay', desc: 'Pay securely via UPI, Card, or Cash after work is completed.' },
  ]),

  // FAQs
  faqs_title: 'Frequently Asked Questions',
  faqs_json: JSON.stringify([
    {
      q: 'How are workers verified on Verified Labour?',
      a: 'Every worker undergoes 2-step verification: 1) Cashfree Aadhaar KYC check and 2) Bank account penny drop validation.',
    },
    {
      q: 'What if I am not satisfied with the work?',
      a: 'You can raise a dispute directly from your customer dashboard. Our admin team reviews evidence and handles refunds or re-assignments.',
    },
    {
      q: 'Is cash payment allowed?',
      a: 'Yes! You can pay cash directly to the worker or pay online via UPI / Credit / Debit Cards.',
    },
    {
      q: 'How fast can a worker arrive?',
      a: 'Most nearby verified workers arrive within 30 to 45 minutes of booking confirmation.',
    },
  ]),

  // Contact Information
  contact_email: 'verifiedlabour@gmail.com',
  contact_phone: '+91 93698 99597',
  contact_address: 'Surat, Gujarat, India - 395007',
  contact_hours: 'Monday to Sunday: 8:00 AM - 9:00 PM',

  // Footer Content
  footer_text:
    "India's trusted on-demand local skilled labour marketplace. Connecting customers and businesses with Aadhaar KYC verified & bank-validated craftsmen.",
  footer_copyright: '© 2026 Verified Labour. All rights reserved.',

  // Social Links
  social_facebook: 'https://facebook.com/verifiedlabour',
  social_instagram: 'https://instagram.com/verifiedlabour',
  social_whatsapp: 'https://wa.me/919369899597',

  // Announcement Banner
  announcement_enabled: 'false',
  announcement_text: '⚡ Welcome to Verified Labour! Get zero platform fees on your first 3 bookings.',
  announcement_type: 'info',
};

/**
 * Fetch all platform content from DB merged with default fallback content.
 */
export async function getSiteContent(): Promise<Record<string, string>> {
  try {
    const configs = await prisma.platformConfig.findMany();
    const result = { ...DEFAULT_SITE_CONTENT };
    for (const item of configs) {
      result[item.key] = item.value;
    }
    return result;
  } catch (err) {
    console.error('Failed to load site content from DB, returning defaults:', err);
    return { ...DEFAULT_SITE_CONTENT };
  }
}

/**
 * Update multiple platform config key-values in DB and record audit log.
 */
export async function updateSiteContent(
  updates: Record<string, string>,
  adminId?: string
): Promise<boolean> {
  try {
    const transactions: any[] = [];
    for (const [key, value] of Object.entries(updates)) {
      transactions.push(
        prisma.platformConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value, description: `Managed via Admin Content Panel (${key})` },
        })
      );
    }

    if (adminId) {
      transactions.push(
        prisma.auditLog.create({
          data: {
            adminId,
            action: 'UPDATE_WEBSITE_CONTENT',
            targetType: 'PLATFORM_CONFIG',
            targetId: 'site_content',
            newState: JSON.stringify(updates),
          },
        })
      );
    }

    await prisma.$transaction(transactions);
    return true;
  } catch (err) {
    console.error('Failed to update site content:', err);
    return false;
  }
}
