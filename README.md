# xxbaug - RVS Lighting Product Management System

This is a [Next.js](https://nextjs.org) project for managing RVS lighting products with advanced column configuration and user management.

## Features

- **Product Management**: Comprehensive product catalog with dynamic columns
- **User Management**: Multi-role system (admin, dealer, user)
- **Column Configuration**: Flexible table column management with 31 configurable columns
- **Image Management**: Tencent Cloud COS integration for image storage
- **Data Protection**: Automatic backup and recovery for critical configurations

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Column Configuration Management

This system includes 31 configurable columns for product management:
- **16 visible columns**: Standard product information visible to all users
- **15 hidden columns**: Advanced business data (vendor info, costs, etc.) visible only to admins

### Important: Data Protection

The system includes automatic protection for custom columns. See `scripts/README.md` for detailed information about:
- Backup and recovery procedures
- Column configuration scripts
- Emergency restoration methods

### Quick Recovery Commands

If column configurations are accidentally deleted:

```bash
# Backup current configuration
node scripts/backup-columns.js

# Restore deleted custom columns
node scripts/restore-deleted-columns.js

# Restore from backup file
node scripts/restore-from-backup.js
```

## Environment Setup

Create a `.env.local` file with:
```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=xxb
JWT_SECRET=your_jwt_secret
COS_SECRET_ID=your_tencent_cos_id
COS_SECRET_KEY=your_tencent_cos_key
COS_REGION=ap-guangzhou
COS_BUCKET=your_bucket_name
```

## Default Login Credentials

- **Admin**: admin / admin123
- **Contact**: Eva@rvs-lighting.com
