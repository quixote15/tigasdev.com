import Layout from "@components/Layout";
import Link from "next/link";
import { getAllPosts } from "../lib/posts";
import { format } from 'date-fns';
/*
const posts = [
    {
        title: "How I built my blogging platform",
        createdAt: "May 13, 2024",
        description: 
        'I built my own blogging platform using Next.js, Tailwind CSS, and Markdown. Here is how I did it.',
        id: 'how-i-built-my-blog'
    },
    {
        title: "The 5 Best JavaScript Frameworks in 2022",
        createdAt: "March 24, 2022",
        description: "Example post with headers, lists, images, tables and more! Github Flavored Markdown guide with examples.",
        id: 'hello'
    }, 
    {
        title: "Article 2",
        createdAt: "March 24, 2022",
        description: "Example post with headers, lists, images, tables and more! Github Flavored Markdown guide with examples.",
        id: 'challenge-lego-blocks'
    },
    {
        title: "Article 3",
        createdAt: "March 24, 2022",
        description: "Example post with headers, lists, images, tables and more! Github Flavored Markdown guide with examples.",
        id: 'next-15-rc'
    },
    {
        title: "Article 4",
        createdAt: "March 24, 2022",
        description: "Example post with headers, lists, images, tables and more! Github Flavored Markdown guide with examples.",
        id: 'next-15-rc'
    },
]
*/

export const PostItem = ({title, createdAt, description,id}) => {
    return (
        <div className="flex flex-col gap-2 w-10/12 mx-auto px-10">
            <label className="text-slate-400 text-md">{format(createdAt, 'MMM, yyyy')}</label>
            <Link className="cursor-pointer" href={`/posts/${id}`}>
            <label className="text-md text-white cursor-pointer ">{title}</label>
            </Link>
            <label className="text-muted text-md text-wrap max-w-10/12">{description}</label>
        </div>
    )
}

export default function articles({posts}) { 
    return (
        <Layout>
            <div className="flex flex-col gap-8 items-center h-full mt-10 w-10/12">
                {posts.map((post) => (<PostItem key={post.id} {...post} />))}
                <div className=" border-b-[1px] border-gray-100 opacity-10 w-full"></div>
            </div>
        </Layout>
    )
}



export async function getStaticProps() {
    const posts = await getAllPosts();
    return {
        props: {
            posts
        }
    }
}