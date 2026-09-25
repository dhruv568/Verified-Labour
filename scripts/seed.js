const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Verified Labour database...');

  // 1. Seed Platform Configuration
  const configs = [
    { key: 'hero_title', value: "India's #1 Labour Hub", description: 'Homepage Hero Title' },
    { key: 'PLATFORM_COMMISSION_PCT', value: '10', description: 'Platform fee percentage on completed jobs' },
    { key: 'DEFAULT_SEARCH_RADIUS_KM', value: '15', description: 'Default radius for worker search in KM' },
    { key: 'MAX_SEARCH_RADIUS_KM', value: '50', description: 'Maximum radius allowed for search' },
    { key: 'MIN_JOB_PRICE_INR', value: '150', description: 'Minimum base job price' },
    { key: 'ALLOW_CANCELLATION_MINS', value: '15', description: 'Minutes after acceptance where free cancellation is permitted' },
    { key: 'AUTO_EXPIRE_REQUEST_MINS', value: '30', description: 'Minutes before an unaccepted job request expires' },
  ];

  for (const cfg of configs) {
    await prisma.platformConfig.upsert({
      where: { key: cfg.key },
      update: { value: cfg.value, description: cfg.description },
      create: cfg,
    });
  }
  console.log('✔ Platform configs seeded.');

  // 2. Blueprint 18 Categories and their services
  const categoryDefs = [
    {
      name: 'Construction',
      slug: 'construction',
      nameHi: 'निर्माण एवं मजदूरी',
      iconUrl: 'Hammer',
      description: 'Masonry, plastering, tiling, brickwork, and general construction labour.',
      services: [
        { name: 'Masonry & Brickwork', slug: 'masonry-brickwork', basePrice: 650, priceUnit: 'per day' },
        { name: 'Plastering & Tiling', slug: 'plastering-tiling', basePrice: 700, priceUnit: 'per day' },
        { name: 'General Construction Labour', slug: 'general-construction-labour', basePrice: 500, priceUnit: 'per day' },
      ],
    },
    {
      name: 'Plumbing',
      slug: 'plumbing',
      nameHi: 'नलसाजी (प्लम्बर)',
      iconUrl: 'Wrench',
      description: 'Tap repair, pipe leakage, sanitary fittings, and water pump repair.',
      services: [
        { name: 'Tap & Shower Fitting/Repair', slug: 'tap-shower-repair', basePrice: 250, priceUnit: 'per job' },
        { name: 'Pipeline Leakage Fixing', slug: 'pipe-leakage', basePrice: 400, priceUnit: 'per job' },
        { name: 'Toilet / Sanitary Installation', slug: 'sanitary-installation', basePrice: 600, priceUnit: 'per job' },
        { name: 'Water Tank Cleaning', slug: 'water-tank-cleaning', basePrice: 800, priceUnit: 'per tank' },
      ],
    },
    {
      name: 'Electrical',
      slug: 'electrical',
      nameHi: 'बिजली का काम (इलेक्ट्रीशियन)',
      iconUrl: 'Zap',
      description: 'Wiring, switchboards, fan repair, light installation, and inverter setups.',
      services: [
        { name: 'Fan / Light Fitting & Repair', slug: 'fan-light-repair', basePrice: 200, priceUnit: 'per item' },
        { name: 'Complete Room Wiring', slug: 'room-wiring', basePrice: 1200, priceUnit: 'per room' },
        { name: 'Switchboard Installation', slug: 'switchboard-install', basePrice: 300, priceUnit: 'per board' },
        { name: 'Inverter & MCB Setup', slug: 'inverter-mcb-setup', basePrice: 500, priceUnit: 'per job' },
      ],
    },
    {
      name: 'Painting',
      slug: 'painting',
      nameHi: 'पुताई एवं पेंटिंग',
      iconUrl: 'Paintbrush',
      description: 'Interior & exterior wall painting, waterproof coating, and wood polishing.',
      services: [
        { name: 'Interior Wall Painting', slug: 'interior-painting', basePrice: 12, priceUnit: 'per sq ft' },
        { name: 'Exterior Weatherproof Coat', slug: 'exterior-painting', basePrice: 16, priceUnit: 'per sq ft' },
        { name: 'Door & Wood Polish', slug: 'wood-polishing', basePrice: 450, priceUnit: 'per door' },
      ],
    },
    {
      name: 'Loading & Moving',
      slug: 'loading-moving',
      nameHi: 'सामान ढुलाई एवं लोडिंग',
      iconUrl: 'Truck',
      description: 'Loading, unloading, furniture shifting, and warehouse material handling.',
      services: [
        { name: 'Furniture Shifting Labour', slug: 'furniture-shifting', basePrice: 600, priceUnit: 'per helper' },
        { name: 'Truck / Tempo Loading & Unloading', slug: 'tempo-loading', basePrice: 700, priceUnit: 'per helper' },
        { name: 'Warehouse Material Handling', slug: 'warehouse-handling', basePrice: 550, priceUnit: 'per day' },
      ],
    },
    {
      name: 'Cleaning',
      slug: 'cleaning',
      nameHi: 'सफाई कर्मचारी',
      iconUrl: 'Sparkles',
      description: 'Deep home cleaning, bathroom cleaning, kitchen degreasing, and office cleaning.',
      services: [
        { name: 'Bathroom Deep Cleaning', slug: 'bathroom-deep-cleaning', basePrice: 399, priceUnit: 'per bath' },
        { name: 'Full Home Deep Clean (1BHK/2BHK)', slug: 'full-home-deep-clean', basePrice: 1499, priceUnit: 'per apartment' },
        { name: 'Kitchen Chimney & Counter Degreasing', slug: 'kitchen-degreasing', basePrice: 600, priceUnit: 'per kitchen' },
      ],
    },
    {
      name: 'Cook',
      slug: 'cook',
      nameHi: 'रसोइया (कुक)',
      iconUrl: 'Utensils',
      description: 'Daily home meals, event catering, North Indian, South Indian, and Gujarati cuisines.',
      services: [
        { name: 'Daily Meal Cook (Monthly/Trial)', slug: 'daily-home-cook', basePrice: 3500, priceUnit: 'per month' },
        { name: 'One-Time Party / Event Cook', slug: 'party-event-cook', basePrice: 1200, priceUnit: 'per event' },
      ],
    },
    {
      name: 'Carpenter',
      slug: 'carpenter',
      nameHi: 'बढ़ई (कारपेंटर)',
      iconUrl: 'Scissors',
      description: 'Furniture repair, door lock installation, wardrobe assembly, and woodwork.',
      services: [
        { name: 'Door Lock / Handle Fitting', slug: 'door-lock-fitting', basePrice: 250, priceUnit: 'per lock' },
        { name: 'Modular Furniture Assembly', slug: 'furniture-assembly', basePrice: 500, priceUnit: 'per unit' },
        { name: 'Custom Wood Repair & Polishing', slug: 'woodwork-repair', basePrice: 450, priceUnit: 'per job' },
      ],
    },
    {
      name: 'Driver',
      slug: 'driver',
      nameHi: 'चालक (ड्राइवर)',
      iconUrl: 'Car',
      description: 'Personal car drivers, commercial drivers, outstation trips, and daily commute.',
      services: [
        { name: 'City One-Day Driver', slug: 'city-day-driver', basePrice: 600, priceUnit: 'per 8 hours' },
        { name: 'Outstation Trip Driver', slug: 'outstation-trip-driver', basePrice: 1000, priceUnit: 'per day + food' },
        { name: 'Monthly Personal Driver', slug: 'monthly-driver', basePrice: 16000, priceUnit: 'per month' },
      ],
    },
    {
      name: 'Washerman',
      slug: 'washerman',
      nameHi: 'धोबी (लॉन्ड्री)',
      iconUrl: 'Shirt',
      description: 'Washing, ironing, dry cleaning pick-up, and curtain washing.',
      services: [
        { name: 'Steam Press & Ironing', slug: 'steam-press', basePrice: 15, priceUnit: 'per cloth' },
        { name: 'Wash & Fold / Laundry', slug: 'wash-and-fold', basePrice: 50, priceUnit: 'per kg' },
      ],
    },
    {
      name: 'Computer Hardware',
      slug: 'computer-hardware',
      nameHi: 'कंप्यूटर हार्डवेयर रिपेयर',
      iconUrl: 'Cpu',
      description: 'Desktop repair, laptop screen/RAM upgrade, printer repair, and CCTV setup.',
      services: [
        { name: 'Desktop/Laptop Diagnosis & Repair', slug: 'pc-laptop-repair', basePrice: 350, priceUnit: 'per visit' },
        { name: 'CCTV Camera Installation', slug: 'cctv-install', basePrice: 400, priceUnit: 'per camera' },
      ],
    },
    {
      name: 'Computer Software',
      slug: 'computer-software',
      nameHi: 'सॉफ्टवेयर एवं ओएस इंस्टॉलेशन',
      iconUrl: 'Monitor',
      description: 'OS formatting, antivirus setup, data backup/recovery, and Wi-Fi configuration.',
      services: [
        { name: 'Windows OS Reinstall & Drivers', slug: 'os-reinstall', basePrice: 450, priceUnit: 'per PC' },
        { name: 'Office Wi-Fi & LAN Setup', slug: 'lan-wifi-setup', basePrice: 600, priceUnit: 'per setup' },
      ],
    },
    {
      name: 'Confectioner',
      slug: 'confectioner',
      nameHi: 'हलवाई (मिठाई/कैटरिंग)',
      iconUrl: 'Cookie',
      description: 'Sweets preparation, festival specials, wedding snacks, and catering chiefs.',
      services: [
        { name: 'Festival Sweets / Farsan Chef', slug: 'sweets-farsan-chef', basePrice: 1500, priceUnit: 'per day' },
        { name: 'Wedding Halwai Team Booking', slug: 'wedding-halwai', basePrice: 5000, priceUnit: 'per event' },
      ],
    },
    {
      name: 'Car / 2 Wheeler Mechanic',
      slug: 'mechanic',
      nameHi: 'गाड़ी मैकेनिक (कार/बाइक)',
      iconUrl: 'Tool',
      description: 'On-demand puncture, battery jumpstart, roadside breakdown, and bike servicing.',
      services: [
        { name: 'Doorstep Bike General Service', slug: 'doorstep-bike-service', basePrice: 350, priceUnit: 'per bike' },
        { name: 'Car Battery Jumpstart / Puncture', slug: 'car-jumpstart-puncture', basePrice: 300, priceUnit: 'per visit' },
      ],
    },
    {
      name: 'Gas Cylinder Delivery',
      slug: 'gas-cylinder',
      nameHi: 'गैस सिलेंडर सहायक',
      iconUrl: 'Flame',
      description: 'Doorstep gas cylinder shifting, stove pipe connection, and leak check.',
      services: [
        { name: 'Cylinder Delivery / Carrying to Floor', slug: 'cylinder-floor-carrying', basePrice: 100, priceUnit: 'per cylinder' },
        { name: 'Stove Regulator & Hose Replacement', slug: 'regulator-hose-fitting', basePrice: 200, priceUnit: 'per job' },
      ],
    },
    {
      name: 'Watchman',
      slug: 'watchman',
      nameHi: 'सुरक्षा गार्ड / चौकीदार',
      iconUrl: 'Shield',
      description: 'Day/night society security guards, commercial complex watchmen, and event guards.',
      services: [
        { name: '12-Hour Shift Security Guard', slug: '12hr-guard-shift', basePrice: 600, priceUnit: 'per shift' },
        { name: 'Monthly Society Guard', slug: 'monthly-society-guard', basePrice: 13500, priceUnit: 'per month' },
      ],
    },
    {
      name: 'House Care Taker',
      slug: 'house-care-taker',
      nameHi: 'हाउस केयरटेकर / घरेलू सहायक',
      iconUrl: 'Home',
      description: 'Property maintenance, elder assistance, villa maintenance, and pet care.',
      services: [
        { name: 'Elderly Assistance / Daily Help', slug: 'elder-care-assistant', basePrice: 700, priceUnit: 'per day' },
        { name: 'Vacant Property Caretaking', slug: 'vacant-property-care', basePrice: 2500, priceUnit: 'per month' },
      ],
    },
    {
      name: 'Office Boy',
      slug: 'office-boy',
      nameHi: 'ऑफिस बॉय / चपरासी',
      iconUrl: 'Briefcase',
      description: 'Pantry help, document filing, office errands, courier dispatch, and tea service.',
      services: [
        { name: 'Daily Office Attendant (Day Shift)', slug: 'daily-office-attendant', basePrice: 500, priceUnit: 'per day' },
        { name: 'Monthly Office Assistant', slug: 'monthly-office-assistant', basePrice: 12000, priceUnit: 'per month' },
      ],
    },
  ];

  const categoryMap = {};

  for (let i = 0; i < categoryDefs.length; i++) {
    const cat = categoryDefs[i];
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        nameHi: cat.nameHi,
        description: cat.description,
        iconUrl: cat.iconUrl,
        sortOrder: i,
        isActive: true,
      },
      create: {
        slug: cat.slug,
        name: cat.name,
        nameHi: cat.nameHi,
        description: cat.description,
        iconUrl: cat.iconUrl,
        sortOrder: i,
        isActive: true,
      },
    });
    categoryMap[cat.slug] = createdCat;

    for (const svc of cat.services) {
      await prisma.service.upsert({
        where: { slug: svc.slug },
        update: {
          name: svc.name,
          basePrice: svc.basePrice,
          priceUnit: svc.priceUnit,
          categoryId: createdCat.id,
          isActive: true,
        },
        create: {
          slug: svc.slug,
          name: svc.name,
          basePrice: svc.basePrice,
          priceUnit: svc.priceUnit,
          categoryId: createdCat.id,
          isActive: true,
        },
      });
    }
  }
  console.log(`✔ All ${categoryDefs.length} blueprint categories & services seeded.`);

  // 3. Admin User
  const adminPasswordHash = await bcrypt.hash('Pass@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'verifiedlabour@gmail.com' },
    update: { role: 'ADMIN', status: 'ACTIVE', passwordHash: adminPasswordHash, isPhoneVerified: true, isEmailVerified: true },
    create: {
      phone: '+910000000000',
      email: 'verifiedlabour@gmail.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      adminUser: {
        create: {
          permissions: 'ALL',
          department: 'Platform Operations & Compliance',
        },
      },
    },
  });
  console.log('✔ Admin user seeded (verifiedlabour@gmail.com / Pass@123).');

  // 4. Test Customer User
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);
  const customerUser = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: { role: 'CUSTOMER', status: 'ACTIVE', isPhoneVerified: true, isEmailVerified: true },
    create: {
      phone: '+919876543210',
      email: 'rajesh.sharma@example.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      customerProfile: {
        create: {
          fullName: 'Rajesh Sharma',
          email: 'rajesh.sharma@example.com',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          addresses: {
            create: [
              {
                label: 'Home',
                contactName: 'Rajesh Sharma',
                contactPhone: '+919876543210',
                formattedAddress: '402, Shivalik Heights, Adajan Gam Road, Surat, Gujarat 395009',
                landmark: 'Opp. Star Bazaar',
                city: 'Surat',
                state: 'Gujarat',
                postalCode: '395009',
                latitude: 21.192572,
                longitude: 72.793345,
                isDefault: true,
              },
              {
                label: 'Office',
                contactName: 'Rajesh Sharma',
                contactPhone: '+919876543210',
                formattedAddress: 'Office 701, International Business Center, Piplod, Surat, Gujarat 395007',
                landmark: 'Near Rahul Raj Mall',
                city: 'Surat',
                state: 'Gujarat',
                postalCode: '395007',
                latitude: 21.155823,
                longitude: 72.775892,
                isDefault: false,
              },
            ],
          },
        },
      },
    },
    include: {
      customerProfile: {
        include: { addresses: true },
      },
    },
  });
  console.log('✔ Test customer user seeded (+919876543210 / Customer@123).');

  // 5. Test Business User
  const businessPasswordHash = await bcrypt.hash('Business@123', 10);
  const businessUser = await prisma.user.upsert({
    where: { phone: '+919888877777' },
    update: { role: 'BUSINESS', status: 'ACTIVE', isPhoneVerified: true, isEmailVerified: true },
    create: {
      phone: '+919888877777',
      email: 'operations@suratinfra.com',
      passwordHash: businessPasswordHash,
      role: 'BUSINESS',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      businessProfile: {
        create: {
          companyName: 'Surat Infrastructure & Builders Pvt Ltd',
          gstin: '24AAACS1429B1Z2',
          pan: 'AAACS1429B',
          contactPerson: 'Vikram Mehta',
          contactPhone: '+919888877777',
          contactEmail: 'operations@suratinfra.com',
          address: 'Floor 5, Diamond Tower, Ring Road, Surat, Gujarat 395002',
          isVerified: true,
        },
      },
    },
    include: { businessProfile: true },
  });

  // Seed bulk requirement for business
  const constructionCat = categoryMap['construction'];
  await prisma.bulkRequirement.create({
    data: {
      businessId: businessUser.businessProfile.id,
      categoryId: constructionCat.id,
      title: 'Need 8 Skilled Masons & Concrete Finishers',
      workersNeeded: 8,
      experienceRequiredYears: 2,
      location: 'Site A-4, Vesu Canal Road, Near VIP Road, Surat',
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '395007',
      startDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      endDate: new Date(Date.now() + 86400000 * 32), // 30 days
      dailyHours: 8,
      budgetPerWorker: 750,
      status: 'OPEN',
      description: 'Looking for verified and hardworking masons for ongoing residential tower plastering and exterior brickwork. Lunch & PPE provided on site.',
    },
  });
  console.log('✔ Test business user & bulk requirement seeded.');

  // 6. Test Verified Workers in Surat
  const defaultWorkerPass = await bcrypt.hash('Worker@123', 10);

  const testWorkers = [
    {
      phone: '+919111122221',
      email: 'ramesh.patel@example.com',
      fullName: 'Ramesh Patel',
      categorySlug: 'plumbing',
      bio: 'Master Plumber with 8 years of residential and commercial plumbing experience. Certified in modern CPVC and brass fittings.',
      experienceYears: 8,
      lat: 21.1945,
      lng: 72.8021,
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '395009',
      hourlyRate: 350,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      maskedAadhaar: 'XXXXXXXX8291',
      nameOnAadhaar: 'Ramesh Mohanbhai Patel',
      maskedBank: 'XXXXXXXX4512',
      ifsc: 'SBIN0001824',
      accountHolderName: 'Ramesh Patel',
      serviceAreas: ['Adajan', 'Pal', 'Rander', 'Athwa', 'Vesu'],
    },
    {
      phone: '+919111122222',
      email: 'suresh.kumar@example.com',
      fullName: 'Suresh Kumar Prajapati',
      categorySlug: 'electrical',
      bio: 'Licensed electrician specializing in home wiring, fuse/MCB panels, inverter setup, and emergency power issues. Quick response guaranteed.',
      experienceYears: 6,
      lat: 21.1785,
      lng: 72.8256,
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '395001',
      hourlyRate: 300,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      maskedAadhaar: 'XXXXXXXX4910',
      nameOnAadhaar: 'Suresh Kumar Prajapati',
      maskedBank: 'XXXXXXXX7834',
      ifsc: 'BKID0002015',
      accountHolderName: 'Suresh Kumar Prajapati',
      serviceAreas: ['Ring Road', 'Nanpura', 'Begampura', 'Varachha', 'Katargam'],
    },
    {
      phone: '+919111122223',
      email: 'dilip.suthar@example.com',
      fullName: 'Dilip Suthar',
      categorySlug: 'carpenter',
      bio: 'Skilled carpenter with 10+ years experience in customized wooden doors, modular kitchen cabinets, hinge replacements, and lock repair.',
      experienceYears: 10,
      lat: 21.1623,
      lng: 72.7845,
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '395007',
      hourlyRate: 400,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      maskedAadhaar: 'XXXXXXXX6712',
      nameOnAadhaar: 'Dilip Hasmukhbhai Suthar',
      maskedBank: 'XXXXXXXX9081',
      ifsc: 'HDFC0000412',
      accountHolderName: 'Dilip H Suthar',
      serviceAreas: ['Piplod', 'Vesu', 'Althan', 'Bhimrad', 'Dumas Road'],
    },
    {
      phone: '+919111122224',
      email: 'kamlesh.solanki@example.com',
      fullName: 'Kamlesh Solanki',
      categorySlug: 'painting',
      bio: 'Professional wall painter. Expertise in Asian Paints Royal shine, texture work, waterproof putty, and ceiling damping repair.',
      experienceYears: 7,
      lat: 21.2154,
      lng: 72.8398,
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '395004',
      hourlyRate: 350,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
      maskedAadhaar: 'XXXXXXXX3145',
      nameOnAadhaar: 'Kamlesh N Solanki',
      maskedBank: 'XXXXXXXX6621',
      ifsc: 'BARB0VARAXX',
      accountHolderName: 'Kamlesh Solanki',
      serviceAreas: ['Katargam', 'Varachha', 'Amroli', 'Sarthana', 'Kamrej'],
    },
    {
      phone: '+919111122225',
      email: 'sunita.rathod@example.com',
      fullName: 'Sunita Ben Rathod',
      categorySlug: 'cleaning',
      bio: 'Meticulous deep cleaner for kitchens, bathrooms, and full residences. Trained in professional sanitization and eco-friendly products.',
      experienceYears: 5,
      lat: 21.1895,
      lng: 72.8152,
      city: 'Surat',
      state: 'Gujarat',
      postalCode: '395002',
      hourlyRate: 250,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      maskedAadhaar: 'XXXXXXXX1198',
      nameOnAadhaar: 'Sunita Bharat Rathod',
      maskedBank: 'XXXXXXXX3412',
      ifsc: 'ICIC0000189',
      accountHolderName: 'Sunita B Rathod',
      serviceAreas: ['Majura Gate', 'Ghopad', 'Athwa Lines', 'Citylight', 'Adajan'],
    },
  ];

  for (const w of testWorkers) {
    const category = categoryMap[w.categorySlug];
    const user = await prisma.user.upsert({
      where: { phone: w.phone },
      update: { role: 'WORKER', status: 'ACTIVE', email: w.email, isPhoneVerified: true, isEmailVerified: true },
      create: {
        phone: w.phone,
        email: w.email,
        passwordHash: defaultWorkerPass,
        role: 'WORKER',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
        workerProfile: {
          create: {
            fullName: w.fullName,
            bio: w.bio,
            experienceYears: w.experienceYears,
            primaryCategoryId: category ? category.id : null,
            status: 'VERIFIED',
            isAvailable: true,
            autoAccept: false,
            latitude: w.lat,
            longitude: w.lng,
            city: w.city,
            state: w.state,
            postalCode: w.postalCode,
            serviceRadiusKm: 20.0,
            hourlyRate: w.hourlyRate,
            avatarUrl: w.avatar,
            identityVerified: true,
            bankVerified: true,
            skillVerified: true,
            aadhaarVerif: {
              create: {
                refId: `CF_AADHAAR_${Date.now()}`,
                maskedAadhaar: w.maskedAadhaar,
                nameOnAadhaar: w.nameOnAadhaar,
                status: 'VERIFIED',
                verifiedAt: new Date(),
              },
            },
            bankVerif: {
              create: {
                refId: `CF_BANK_${Date.now()}`,
                maskedAccountNo: w.maskedBank,
                ifsc: w.ifsc,
                accountHolderName: w.accountHolderName,
                nameMatchScore: 98.5,
                bankName: 'State Bank of India',
                status: 'VERIFIED',
                verifiedAt: new Date(),
              },
            },
            serviceAreas: {
              create: w.serviceAreas.map((area) => ({
                city: 'Surat',
                areaName: area,
                postalCode: w.postalCode,
              })),
            },
            availability: {
              create: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
                dayOfWeek: day,
                startTime: '08:00',
                endTime: '20:00',
                isWorking: day !== 0, // Works Mon-Sat
              })),
            },
            skills: {
              create: [
                {
                  categoryId: category.id,
                  yearsExperience: w.experienceYears,
                  isVerified: true,
                },
              ],
            },
          },
        },
      },
      include: {
        workerProfile: true,
      },
    });

    // Add review for Ramesh Patel (Plumber) to show real ratings
    if (w.categorySlug === 'plumbing') {
      const plumbingServices = await prisma.service.findMany({ where: { categoryId: category.id } });
      if (plumbingServices.length > 0 && customerUser.customerProfile) {
        // Create an example completed job and review
        const jobReq = await prisma.jobRequest.create({
          data: {
            customerId: customerUser.customerProfile.id,
            categoryId: category.id,
            serviceId: plumbingServices[0].id,
            description: 'Fix dripping kitchen tap and replace washer',
            formattedAddress: 'Adajan Gam Road, Surat, Gujarat',
            latitude: 21.1925,
            longitude: 72.7933,
            preferredDate: '2026-09-15',
            preferredTime: '10:00 AM',
            status: 'MATCHED',
          },
        });

        const job = await prisma.job.create({
          data: {
            jobRequestId: jobReq.id,
            customerId: customerUser.customerProfile.id,
            workerId: user.workerProfile.id,
            serviceId: plumbingServices[0].id,
            status: 'COMPLETED',
            baseAmount: 350,
            finalAmount: 350,
            scheduledStartTime: new Date(Date.now() - 86400000 * 5),
            actualStartTime: new Date(Date.now() - 86400000 * 5 + 3600000),
            actualEndTime: new Date(Date.now() - 86400000 * 5 + 7200000),
            history: {
              create: [
                { fromStatus: 'REQUESTED', toStatus: 'ACCEPTED', note: 'Worker accepted job' },
                { fromStatus: 'ACCEPTED', toStatus: 'ARRIVED', note: 'Worker reached customer home' },
                { fromStatus: 'ARRIVED', toStatus: 'WORK_STARTED', note: 'Started fixing plumbing' },
                { fromStatus: 'WORK_STARTED', toStatus: 'WORK_COMPLETED', note: 'Fixed tap leak' },
                { fromStatus: 'WORK_COMPLETED', toStatus: 'PAID', note: 'Payment captured online' },
                { fromStatus: 'PAID', toStatus: 'COMPLETED', note: 'Job marked completed' },
              ],
            },
            review: {
              create: {
                customerId: customerUser.customerProfile.id,
                workerId: user.workerProfile.id,
                rating: 5,
                comment: 'Ramesh arrived promptly within 20 minutes! Very professional, brought his own tools, and fixed the kitchen faucet leak neatly. Highly recommended!',
                categoryFeedback: JSON.stringify({ punctuality: 5, cleanliness: 5, technicalSkill: 5 }),
                isModerated: true,
              },
            },
            payment: {
              create: {
                paymentProvider: 'CASHFREE',
                providerOrderId: `order_test_${Date.now()}`,
                providerPaymentId: `pay_test_${Date.now()}`,
                paymentSessionId: `session_mock_${Date.now()}`,
                amount: 350,
                status: 'CAPTURED',
                method: 'UPI',
              },
            },
            transaction: {
              create: {
                grossAmount: 350,
                platformFee: 35,
                taxAmount: 6.3,
                workerAmount: 308.7,
                paymentStatus: 'CAPTURED',
                settlementStatus: 'SETTLED',
              },
            },
          },
        });
      }
    }
  }
  console.log(`✔ Seeded ${testWorkers.length} verified workers with real ratings, schedules, and masked Cashfree records.`);

  console.log('--- DATABASE SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
