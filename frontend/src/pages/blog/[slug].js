import Head from 'next/head';
import Link from 'next/link';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { ArrowLeft } from 'lucide-react';

export async function getStaticPaths() {
  const posts = getAllPosts();
  const paths = posts.map((post) => ({ params: { slug: post.slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const post = await getPostBySlug(params.slug);
  return { props: { post } };
}

export default function BlogPost({ post }) {
  return (
    <>
      <Head>
        <title>{`${post.title} — FPL Companion Blog`}</title>
        <meta name="description" content={post.excerpt || ''} />
        <link rel="canonical" href={`https://fplcompanion.com/blog/${post.slug}`} />
        <meta property="og:title" content={`${post.title} — FPL Companion Blog`} />
        <meta property="og:description" content={post.excerpt || ''} />
        <meta property="og:url" content={`https://fplcompanion.com/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.date} />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="gradient-fpl text-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-fpl-green hover:text-white transition mb-4">
              <ArrowLeft size={16} />
              All posts
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">{post.title}</h1>
            <div className="text-sm text-fpl-green mt-2">
              {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {post.author && ` · ${post.author}`}
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-10 border border-gray-200 dark:border-gray-700">
            <div
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-fpl-purple dark:prose-a:text-fpl-green"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />
          </article>

          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-fpl-purple dark:text-fpl-green font-semibold hover:underline"
            >
              <ArrowLeft size={16} />
              Back to all posts
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
