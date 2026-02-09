#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'content', 'blog');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');
const SITE_URL = 'https://fplcompanion.com';

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run new-post "Your Blog Post Title"');
  process.exit(1);
}

// Generate slug from title
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const filePath = path.join(BLOG_DIR, `${slug}.md`);

if (fs.existsSync(filePath)) {
  console.error(`Post already exists: ${filePath}`);
  process.exit(1);
}

// Create blog directory if needed
if (!fs.existsSync(BLOG_DIR)) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
}

// Today's date in YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

// Create the markdown file
const content = `---
title: "${title}"
date: "${today}"
excerpt: ""
author: "FPL Companion"
---

Write your post here.
`;

fs.writeFileSync(filePath, content);
console.log(`Created: content/blog/${slug}.md`);

// Update sitemap
const blogUrl = `${SITE_URL}/blog/${slug}`;
const newEntry = `  <url>\n    <loc>${blogUrl}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;

let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');

if (!sitemap.includes(blogUrl)) {
  sitemap = sitemap.replace('</urlset>', `${newEntry}\n</urlset>`);
  fs.writeFileSync(SITEMAP_PATH, sitemap);
  console.log(`Sitemap updated with: ${blogUrl}`);
}

console.log(`\nEdit your post: frontend/content/blog/${slug}.md`);
