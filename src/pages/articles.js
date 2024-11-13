import Layout from "@components/Layout";
import Link from "next/link";


const posts = [
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
    }
]

export const PostItem = ({title, createdAt, description,id}) => {
    return (
        <div className="flex flex-col gap-2 ">
            <label className="text-slate-400 text-md">{createdAt}</label>
            <Link className="cursor-pointer" href={`/posts/${id}`}>
            <label className="text-2xl text-white cursor-pointer">{title}</label>
            </Link>
            <label className="text-muted text-md">{description}</label>
        </div>
    )
}

export default function articles() {
    return (
        <Layout>
            <div className="flex flex-col gap-8 h-screen items-center mt-10">
  <input class="placeholder:italic placeholder:text-slate-400 block bg-white w-10/12 border border-slate-300 rounded-md py-2 pl-9 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm" placeholder="Search for anything..." type="text" name="search"/>
        <div className=" border-b-[1px] border-gray-100 opacity-10 w-full"></div>

                {posts.map((post) => (<PostItem key={post.id} {...post} />))}
        <div className=" border-b-[1px] border-gray-100 opacity-10 w-full"></div>
            </div>
        </Layout>
    )
}