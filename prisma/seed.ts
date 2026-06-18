import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── Super admin user ──
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@local.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { role: 'super_admin', isActive: true },
    create: {
      name: 'Super Admin',
      email,
      password: passwordHash,
      role: 'super_admin',
      isActive: true,
      isEmailVerified: true,
    },
  });

  // ── Default site settings (singleton) ──
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    const fomLogo =
      'https://images.squarespace-cdn.com/content/v1/68c03eefbb6dde4f22ccb573/a506a2c2-ad45-4e6a-a663-9b9748d01329/THE+FOM+Logo+2025.png?format=1500w';
    await prisma.settings.create({
      data: {
        siteName: 'The Friends of Mewar',
        logo: fomLogo,
        favicon: fomLogo,
        ogImage: fomLogo,
        email: 'info@thefriendsofmewar.org',
        address: 'Udaipur, Rajasthan, India',
        facebook: 'https://www.facebook.com/FriendsofMewar/',
        instagram: 'https://www.instagram.com/thefriendsofmewar',
        linkedin: 'https://www.linkedin.com/company/friends-of-mewar/',
        metaTitle: 'The Friends of Mewar | Join Us in Making a Difference',
        metaDescription:
          "Born from the values of the House of Mewar, we advance healthcare, women's empowerment & education, and cultural preservation. Join us in making a difference.",
        metaKeywords:
          'ngo, donation, mewar, udaipur, healthcare, education, heritage, 80g',
        copyrightText: `© ${new Date().getFullYear()} The Friends of Mewar. All Rights Reserved.`,
      },
    });
  }

  // ── Sample CMS / policy pages ──
  const pages = [
    { slug: 'about-us', title: 'About Us' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'terms-and-conditions', title: 'Terms & Conditions' },
    { slug: 'refund-policy', title: 'Refund Policy' },
    { slug: 'donation-policy', title: 'Donation Policy' },
  ];
  for (const p of pages) {
    await prisma.cmsPage.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        content: `<h2>${p.title}</h2><p>Edit this content from the admin panel → CMS Pages.</p>`,
        status: 'published',
        metaTitle: p.title,
      },
    });
  }

  console.log('✅ Seed complete.');
  console.log(`   Admin login → ${email} / ${password}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
