import Head from 'next/head';
import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { ArrowLeft } from 'lucide-react';

export async function getStaticProps() {
  const posts = getAllPosts();
  return { props: { posts } };
}

export default function BlogIndex({ posts }) {
  return (
    <>
      <Head>
        <title>Blog — FPL Companion</title>
        <meta name="description" content="Tips, guides, and updates for Fantasy Premier League managers. Learn how to get the most out of FPL Companion." />
        <link rel="canonical" href="https://fplcompanion.com/blog" />
        <meta property="og:title" content="Blog — FPL Companion" />
        <meta property="og:description" content="Tips, guides, and updates for Fantasy Premier League managers." />
        <meta property="og:url" content="https://fplcompanion.com/blog" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="gradient-fpl text-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-fpl-green hover:text-white transition mb-4">
              <ArrowLeft size={16} />
              Back to FPL Companion
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">FPL Companion Blog</h1>
            <p className="text-fpl-green mt-2">Tips, guides, and updates for FPL managers</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {posts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No posts yet. Check back soon!</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300">{post.excerpt}</p>
                  )}
                  <span className="inline-block mt-3 text-fpl-purple dark:text-fpl-green text-sm font-semibold">
                    Read more &rarr;
                  </span>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
