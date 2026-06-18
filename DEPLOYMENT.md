# AWS Amplify Deployment Guide

## Prerequisites
- AWS Account with Amplify access
- GitHub repository with this code
- RDS PostgreSQL database already created
- AWS credentials for S3 access (if using S3)

## Deployment Steps

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Create Amplify App
1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Select GitHub and authorize Amplify to access your repository
4. Select the `arnold-irrigation` repository and branch (usually `main`)
5. Amplify will auto-detect the build settings from `amplify.yml`

### 3. Configure Build Settings
Amplify will auto-detect these settings from `amplify.yml`:
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Node version**: Latest (or specify in package.json)

### 4. Set Environment Variables
In Amplify Console, go to your app → App settings → Environment variables:

**Required variables:**
```
DATABASE_URL=postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/arnold_irrigation
JWT_SECRET=your-strong-random-secret-key
APP_AWS_REGION=us-west-2
APP_AWS_ACCESS_KEY_ID=your-aws-access-key
APP_AWS_SECRET_ACCESS_KEY=your-aws-secret-key
APP_AWS_S3_BUCKET=arnold-irrigation
```

**Important notes:**
- Use your actual RDS endpoint for `DATABASE_URL`
- Generate a strong random string for `JWT_SECRET` (use a password manager or `openssl rand -base64 32`)
- AWS credentials should have S3 permissions for the bucket

### 5. Database Security Group
Ensure your RDS security group allows inbound traffic from:
- Amplify deployment IPs (dynamic - may need to open to 0.0.0.0/0 temporarily during setup)
- Your local IP for development

### 6. Deploy
1. Click "Save and deploy" in Amplify Console
2. Amplify will build and deploy your Next.js app
3. The build process takes 2-5 minutes
4. You'll get a URL like: `https://main.xxxxxx.amplifyapp.com`

### 7. Custom Domain (Optional)
1. In Amplify Console → Domain management
2. Add your custom domain (e.g., `portal.arnoldid.com`)
3. Configure DNS records as instructed by Amplify
4. Enable SSL certificate (automatic)

## Environment-Specific Deployments

### Production
- Branch: `main`
- Environment variables as above
- Custom domain

### Staging
- Create a separate branch (e.g., `staging`)
- Amplify will auto-create a separate app instance
- Use staging database or same database with different schema
- URL: `https://staging.xxxxxx.amplifyapp.com`

## Troubleshooting

### Build Failures
- Check build logs in Amplify Console
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### Database Connection Issues
- Verify RDS security group allows Amplify IPs
- Check `DATABASE_URL` format is correct
- Ensure database is accessible from public internet (or use VPC)

### Environment Variables Not Loading
- Variables must be set in Amplify Console, not in `.env` file
- `.env` file is gitignored and not deployed
- Redeploy after adding new environment variables

## Continuous Deployment
Every push to your connected branch will trigger automatic deployment. To control this:
- Use pull requests for staging
- Merge to main for production
- Enable "Branch auto-deployment" settings in Amplify

## Monitoring
- Amplify Console provides build logs and deployment history
- Enable CloudWatch for application logs
- Set up alarms for build failures
