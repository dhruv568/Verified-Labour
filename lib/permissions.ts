export interface PermissionDef {
  key: string;
  category: string;
  label: string;
  description: string;
}

export const PERMISSION_CATEGORIES = [
  'DASHBOARD',
  'USERS',
  'WORKERS',
  'JOBS',
  'BOOKINGS',
  'PAYMENTS',
  'CATEGORIES',
  'TESTIMONIALS',
  'CONTENT',
  'STAFF',
  'ROLES',
  'SETTINGS',
  'ANALYTICS',
  'AUDIT',
] as const;

export type PermissionCategory = typeof PERMISSION_CATEGORIES[number];

export const ALL_PERMISSIONS: PermissionDef[] = [
  // DASHBOARD
  {
    key: 'dashboard.view',
    category: 'DASHBOARD',
    label: 'View Dashboard',
    description: 'Access the admin dashboard overview and key metrics.',
  },

  // USERS
  {
    key: 'users.view',
    category: 'USERS',
    label: 'View Users',
    description: 'View list of registered users and customer profiles.',
  },
  {
    key: 'users.details',
    category: 'USERS',
    label: 'View User Details',
    description: 'View full user profile, contact info, and activity history.',
  },
  {
    key: 'users.edit',
    category: 'USERS',
    label: 'Edit Users',
    description: 'Update user profile details and status.',
  },
  {
    key: 'users.disable',
    category: 'USERS',
    label: 'Disable Users',
    description: 'Suspend or deactivate customer accounts.',
  },
  {
    key: 'users.delete',
    category: 'USERS',
    label: 'Delete Users',
    description: 'Permanently remove customer accounts.',
  },

  // WORKERS
  {
    key: 'workers.view',
    category: 'WORKERS',
    label: 'View Workers',
    description: 'View directory of registered worker profiles.',
  },
  {
    key: 'workers.details',
    category: 'WORKERS',
    label: 'View Worker Details',
    description: 'View worker documents, skills, Aadhaar, and bank details.',
  },
  {
    key: 'workers.edit',
    category: 'WORKERS',
    label: 'Edit Workers',
    description: 'Update worker trade details, rates, and service areas.',
  },
  {
    key: 'workers.verify',
    category: 'WORKERS',
    label: 'Verify Workers',
    description: 'Approve KYC documents and mark worker identity verified.',
  },
  {
    key: 'workers.reject',
    category: 'WORKERS',
    label: 'Reject Workers',
    description: 'Reject worker KYC applications with feedback reason.',
  },
  {
    key: 'workers.disable',
    category: 'WORKERS',
    label: 'Disable Workers',
    description: 'Suspend or block worker accounts.',
  },

  // JOBS / WORK REQUIREMENTS
  {
    key: 'jobs.view',
    category: 'JOBS',
    label: 'View Jobs',
    description: 'View job posts, open requirements, and bulk requests.',
  },
  {
    key: 'jobs.details',
    category: 'JOBS',
    label: 'View Job Details',
    description: 'View complete job timeline, addresses, and voice notes.',
  },
  {
    key: 'jobs.edit',
    category: 'JOBS',
    label: 'Edit Jobs',
    description: 'Modify job pricing, schedules, or categories.',
  },
  {
    key: 'jobs.delete',
    category: 'JOBS',
    label: 'Delete Jobs',
    description: 'Remove job listings or cancel requests.',
  },

  // BOOKINGS
  {
    key: 'bookings.view',
    category: 'BOOKINGS',
    label: 'View Bookings',
    description: 'Access booking records and active assignments.',
  },
  {
    key: 'bookings.details',
    category: 'BOOKINGS',
    label: 'View Booking Details',
    description: 'View detailed job dispatch and worker allocation history.',
  },
  {
    key: 'bookings.manage',
    category: 'BOOKINGS',
    label: 'Manage Bookings',
    description: 'Assign, reassign, or resolve booking disputes.',
  },
  {
    key: 'bookings.cancel',
    category: 'BOOKINGS',
    label: 'Cancel Bookings',
    description: 'Force cancel active bookings with refund handling.',
  },

  // PAYMENTS
  {
    key: 'payments.view',
    category: 'PAYMENTS',
    label: 'View Payments',
    description: 'View payment transactions and revenue breakdown.',
  },
  {
    key: 'payments.details',
    category: 'PAYMENTS',
    label: 'View Payment Details',
    description: 'View Cashfree payment IDs, gateways, and signatures.',
  },
  {
    key: 'payments.refund',
    category: 'PAYMENTS',
    label: 'Refund Payments',
    description: 'Process customer refunds and payout adjustments.',
  },
  {
    key: 'payments.settings',
    category: 'PAYMENTS',
    label: 'Payment Settings',
    description: 'View platform commission percentages and payout rules.',
  },

  // SERVICES / CATEGORIES
  {
    key: 'categories.view',
    category: 'CATEGORIES',
    label: 'View Categories',
    description: 'Browse service categories and trade skills.',
  },
  {
    key: 'categories.create',
    category: 'CATEGORIES',
    label: 'Create Category',
    description: 'Add new trade categories or subcategories.',
  },
  {
    key: 'categories.edit',
    category: 'CATEGORIES',
    label: 'Edit Category',
    description: 'Modify existing service categories and base rates.',
  },
  {
    key: 'categories.delete',
    category: 'CATEGORIES',
    label: 'Delete Category',
    description: 'Remove empty service categories.',
  },

  // TESTIMONIALS
  {
    key: 'testimonials.view',
    category: 'TESTIMONIALS',
    label: 'View Testimonials',
    description: 'View homepage customer and worker testimonials.',
  },
  {
    key: 'testimonials.create',
    category: 'TESTIMONIALS',
    label: 'Create Testimonial',
    description: 'Add new customer testimonial cards.',
  },
  {
    key: 'testimonials.edit',
    category: 'TESTIMONIALS',
    label: 'Edit Testimonial',
    description: 'Edit testimonial content, images, crop offsets, and ratings.',
  },
  {
    key: 'testimonials.delete',
    category: 'TESTIMONIALS',
    label: 'Delete Testimonial',
    description: 'Remove testimonial cards.',
  },

  // CONTENT
  {
    key: 'content.manage',
    category: 'CONTENT',
    label: 'Manage Website Content',
    description: 'Edit live website text, headlines, and announcements.',
  },
  {
    key: 'content.homepage',
    category: 'CONTENT',
    label: 'Manage Homepage',
    description: 'Edit homepage hero section, badges, and banners.',
  },
  {
    key: 'content.footer',
    category: 'CONTENT',
    label: 'Manage Footer',
    description: 'Update footer text, legal notices, and support numbers.',
  },
  {
    key: 'content.faqs',
    category: 'CONTENT',
    label: 'Manage FAQs',
    description: 'Update public FAQ section questions and answers.',
  },

  // STAFF
  {
    key: 'staff.view',
    category: 'STAFF',
    label: 'View Staff',
    description: 'View list of admin staff members.',
  },
  {
    key: 'staff.create',
    category: 'STAFF',
    label: 'Create Staff',
    description: 'Invite new staff members and assign initial roles.',
  },
  {
    key: 'staff.edit',
    category: 'STAFF',
    label: 'Edit Staff',
    description: 'Update staff member names and details.',
  },
  {
    key: 'staff.disable',
    category: 'STAFF',
    label: 'Disable Staff',
    description: 'Disable or enable staff member admin access.',
  },
  {
    key: 'staff.delete',
    category: 'STAFF',
    label: 'Delete Staff',
    description: 'Remove staff members from admin access.',
  },
  {
    key: 'staff.assign_roles',
    category: 'STAFF',
    label: 'Assign Roles',
    description: 'Change assigned roles for existing staff members.',
  },

  // ROLES
  {
    key: 'roles.view',
    category: 'ROLES',
    label: 'View Roles',
    description: 'View custom roles and permission configurations.',
  },
  {
    key: 'roles.create',
    category: 'ROLES',
    label: 'Create Roles',
    description: 'Create new custom roles and configure permission matrices.',
  },
  {
    key: 'roles.edit',
    category: 'ROLES',
    label: 'Edit Roles',
    description: 'Update role names, descriptions, and assigned permissions.',
  },
  {
    key: 'roles.delete',
    category: 'ROLES',
    label: 'Delete Roles',
    description: 'Delete custom roles not in active use.',
  },
  {
    key: 'roles.manage_permissions',
    category: 'ROLES',
    label: 'Manage Permissions',
    description: 'Grant or revoke permissions on roles.',
  },

  // SETTINGS
  {
    key: 'settings.view',
    category: 'SETTINGS',
    label: 'View Settings',
    description: 'View admin settings and security policies.',
  },
  {
    key: 'settings.edit',
    category: 'SETTINGS',
    label: 'Edit Website Settings',
    description: 'Update security settings, passwords, and configurations.',
  },

  // ANALYTICS
  {
    key: 'analytics.view',
    category: 'ANALYTICS',
    label: 'View Analytics',
    description: 'View platform analytics, metrics, and growth reports.',
  },

  // AUDIT LOGS
  {
    key: 'audit.view',
    category: 'AUDIT',
    label: 'View Audit Logs',
    description: 'View security audit trail, IP records, and change logs.',
  },
];

export const PERMISSIONS_BY_CATEGORY: Record<string, PermissionDef[]> = ALL_PERMISSIONS.reduce((acc, perm) => {
  if (!acc[perm.category]) {
    acc[perm.category] = [];
  }
  acc[perm.category].push(perm);
  return acc;
}, {} as Record<string, PermissionDef[]>);

export function getPermissionLabel(key: string): string {
  const found = ALL_PERMISSIONS.find((p) => p.key === key);
  return found ? found.label : key;
}
