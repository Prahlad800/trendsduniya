# TrendsDuniya Article CMS Backend

REST API for the TrendsDuniya news and article platform.

## URLs and Architecture

```text
Public frontend: http://localhost:3000
Admin panel:     http://localhost:3001
Backend API:     http://localhost:5000
MongoDB:         mongodb://127.0.0.1:27017/trendsduniya
```

Public APIs use `/api`. Admin management APIs use `/api/admin` and require a Bearer token.

## Stack

Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Cloudinary, Multer, Helmet, CORS, rate limiting, Express Validator, HTML sanitization, and slug generation.

## Installation

```bash
npm install
copy .env.example .env
npm run dev
```

Production:

```bash
npm start
```

### Vercel runtime compatibility

The `sanitize-html` dependency has a scoped `htmlparser2` override to version
`10.0.0`, which provides a CommonJS entry point. Its ESM-only version 12 crashes
inside Vercel's loader with `ERR_REQUIRE_ESM`, even though it imports successfully
on a local Node.js 24 installation. Keep this override until the deployed loader
supports that dependency chain. The sanitizer itself remains on its current version.

Run `npm run test:deployment` to check startup, health routes, and HTML sanitization
with `require(ESM)` disabled, without connecting to a database.

## Environment

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/trendsduniya
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-second-long-random-secret
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SITE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

Never commit `.env` or expose secrets.

## Authentication

Admin roles are `superadmin`, `admin`, `editor`, and `author`. Login returns access and refresh tokens. Protected requests use:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Admin login

```http
POST http://localhost:5000/api/admin/auth/login
```

Also available at `/api/auth/login`.

```json
{
	"email": "admin@example.com",
	"password": "Admin@123456"
}
```

### Admin auth endpoints

```http
GET  http://localhost:5000/api/admin/auth/me
POST http://localhost:5000/api/admin/auth/refresh
POST http://localhost:5000/api/admin/auth/logout
POST http://localhost:5000/api/admin/auth/admins
```

Refresh body:

```json
{ "refreshToken": "YOUR_REFRESH_TOKEN" }
```

Create-admin body, superadmin only:

```json
{
	"name": "Content Editor",
	"email": "editor@example.com",
	"password": "Editor@123456",
	"role": "editor"
}
```

Create the first admin from the terminal:

```bash
npm run create:admin -- "Main Admin" admin@example.com "Admin@123456" superadmin
```

## Public GET APIs

```http
GET http://localhost:5000/
GET http://localhost:5000/api/health
GET http://localhost:5000/api/articles
GET http://localhost:5000/api/articles?page=1&limit=20&sort=-publishedAt
GET http://localhost:5000/api/articles/search?q=nextjs&page=1&limit=10
GET http://localhost:5000/api/articles/:slug
GET http://localhost:5000/api/articles/:slug/related
GET http://localhost:5000/api/articles/category/:slug
GET http://localhost:5000/api/articles/tag/:slug
GET http://localhost:5000/api/articles/author/:slug
GET http://localhost:5000/api/categories
GET http://localhost:5000/api/categories/:slug
GET http://localhost:5000/api/tags
GET http://localhost:5000/api/tags/:slug
GET http://localhost:5000/api/authors
GET http://localhost:5000/api/authors/:slug
GET http://localhost:5000/sitemap.xml
GET http://localhost:5000/robots.txt
```

Only published articles are returned publicly.

Record a view with POST because it changes data:

```http
POST http://localhost:5000/api/articles/ARTICLE_ID/view
```

## Admin Article APIs

```http
GET    http://localhost:5000/api/admin/articles
GET    http://localhost:5000/api/admin/articles/:id
GET    http://localhost:5000/api/admin/articles/:id/preview
POST   http://localhost:5000/api/admin/articles
PUT    http://localhost:5000/api/admin/articles/:id
PATCH  http://localhost:5000/api/admin/articles/:id
DELETE http://localhost:5000/api/admin/articles/:id
POST   http://localhost:5000/api/admin/articles/:id/publish
POST   http://localhost:5000/api/admin/articles/:id/unpublish
POST   http://localhost:5000/api/admin/articles/:id/archive
POST   http://localhost:5000/api/admin/articles/:id/restore
DELETE http://localhost:5000/api/admin/articles/:id/permanent
POST   http://localhost:5000/api/admin/articles/:id/duplicate
GET    http://localhost:5000/api/admin/articles/:id/revisions
```

Admin filters:

```text
?page=1&limit=20&status=draft&category=CATEGORY_ID&author=AUTHOR_ID&tag=TAG_ID&search=nextjs&sort=-createdAt
```

### Create article body

```json
{
	"title": "Next.js SEO Guide 2026",
	"slug": "nextjs-seo-guide-2026",
	"excerpt": "Complete guide to Next.js SEO.",
	"summary": "Metadata, sitemap, canonical URLs and structured data.",
	"content": "<h2>Next.js SEO</h2><p>Article content goes here.</p>",
	"articleType": "guide",
	"category": "CATEGORY_ID",
	"author": "AUTHOR_ID",
	"tags": ["TAG_ID"],
	"status": "draft",
	"media": {
		"featuredImage": {
			"url": "https://res.cloudinary.com/demo/image/upload/example.jpg",
			"publicId": "trendsduniya/articles/example",
			"width": 1200,
			"height": 630,
			"format": "jpg",
			"bytes": 45000,
			"alt": "Next.js SEO Guide",
			"caption": "Next.js SEO illustration"
		},
		"images": []
	},
	"seo": {
		"searchIntent": "informational",
		"searchIntentDescription": "Users want to learn Next.js SEO.",
		"primaryKeyword": "Next.js SEO",
		"relatedKeywords": ["Next.js metadata", "Next.js sitemap"],
		"relatedTopics": ["technical SEO", "structured data"],
		"metaTitle": "Next.js SEO Guide 2026",
		"metaDescription": "Complete guide to optimizing Next.js websites for search engines.",
		"canonicalUrl": "https://trendsduniya.com/article/nextjs-seo-guide-2026",
		"robots": { "index": false, "follow": true }
	},
	"faq": [{
		"question": "What is Next.js SEO?",
		"answer": "Next.js SEO means optimizing a Next.js website for search engines."
	}],
	"source": {
		"name": "Original",
		"url": "",
		"type": "original",
		"attributionText": "Original reporting by TrendsDuniya"
	}
}
```

Publishing requires title, content, excerpt, author, category, featured image, meta title, and meta description.

Normal DELETE is a soft delete. Permanent delete is superadmin-only.

## Admin Taxonomy APIs

Categories:

```http
POST   http://localhost:5000/api/admin/categories
PUT    http://localhost:5000/api/admin/categories/CATEGORY_ID
DELETE http://localhost:5000/api/admin/categories/CATEGORY_ID
```

```json
{
	"name": "Technology",
	"slug": "technology",
	"description": "Technology news and guides",
	"isActive": true
}
```

Tags:

```http
POST   http://localhost:5000/api/admin/tags
PUT    http://localhost:5000/api/admin/tags/TAG_ID
DELETE http://localhost:5000/api/admin/tags/TAG_ID
```

```json
{
	"name": "Next.js",
	"slug": "nextjs",
	"description": "Next.js related content",
	"isActive": true
}
```

Authors:

```http
POST   http://localhost:5000/api/admin/authors
PUT    http://localhost:5000/api/admin/authors/AUTHOR_ID
DELETE http://localhost:5000/api/admin/authors/AUTHOR_ID
```

```json
{
	"name": "Rahul Sharma",
	"slug": "rahul-sharma",
	"bio": "Technology writer",
	"designation": "Senior Editor",
	"website": "https://example.com",
	"isActive": true
}
```

## Media APIs

Upload an image using `multipart/form-data` and field name `image`:

```http
POST http://localhost:5000/api/admin/upload/image
```

Maximum size is 5 MB. The response contains `url`, `publicId`, `width`, `height`, `format`, and `bytes`.

```http
DELETE http://localhost:5000/api/admin/upload/image/trendsduniya%2Farticles%2Fexample
```

## Dashboard

```http
GET http://localhost:5000/api/admin/dashboard
```

Returns article totals by status, total views, authors, categories, and tags.

## Data Models

Article fields:

```text
title, slug, excerpt, content, summary
status: draft | published | scheduled | archived | deleted
articleType: article | news | opinion | analysis | guide | tutorial | review | interview | press_release
category, subCategory, tags, author
media.featuredImage, media.images
seo, structuredData, faq, source, originalData
internalLinks, externalLinks, relatedArticles
publishedAt, scheduledAt, deletedAt
createdBy, updatedBy, publishedBy, deletedBy
analytics.views, analytics.uniqueViews, analytics.shares, analytics.readingTime
```

SEO fields:

```text
searchIntent, searchIntentDescription, primaryKeyword
relatedKeywords, relatedTopics, metaTitle, metaDescription
canonicalUrl, robots, openGraph, twitter
```

Admin fields:

```text
name, email, password, role, avatar, isActive
lastLoginAt, createdAt, updatedAt
```

Passwords are hashed and never returned.

## Response Format

```json
{
	"success": true,
	"message": "Articles loaded",
	"data": [],
	"pagination": {
		"page": 1,
		"limit": 20,
		"total": 100,
		"totalPages": 5,
		"hasNextPage": true,
		"hasPreviousPage": false
	}
}
```

Error response:

```json
{
	"success": false,
	"message": "Validation failed",
	"errors": []
}
```

## PowerShell Testing

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:5000/api/articles

$body = @{ email = "admin@example.com"; password = "Admin@123456" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/admin/auth/login -ContentType "application/json" -Body $body
$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

$body = @{ name = "Technology"; slug = "technology" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/admin/categories -Headers $headers -ContentType "application/json" -Body $body
```

## Security and Database Notes

- Public endpoints never return draft, archived, deleted, or unpublished articles.
- Normal article deletion is soft delete; permanent deletion requires `superadmin`.
- Cloudinary `publicId` is stored with every image.
- Article HTML is sanitized before storage.
- Use HTTPS and strong random secrets in production.
- MongoDB must be running for data APIs. `/api/health` reports `database: "disconnected"` when MongoDB is unavailable.

## Commands

```bash
npm run dev
npm start
npm run create:admin -- "Main Admin" admin@example.com "Admin@123456" superadmin
npm test
npm run lint
```
