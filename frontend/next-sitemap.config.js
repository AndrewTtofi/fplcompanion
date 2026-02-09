/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://fplcompanion.com',
  generateRobotsTxt: false, // We have a manual robots.txt
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/404'],
  additionalPaths: async () => [
    { loc: '/', changefreq: 'daily', priority: 1.0, lastmod: new Date().toISOString() },
  ],
}
