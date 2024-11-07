import Layout from "@components/Layout";
//import 'highlight.js/styles/night-owl.css'// Then register the languages you need
import 'highlight.js/styles/a11y-dark.css';
import { getPostData, getAllPostIds } from "src/lib/posts";
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import { useEffect } from "react";

// Then register the languages you need

export default function Post({postData}) {
    useEffect(() => {
        hljs.registerLanguage('javascript', javascript);
        hljs.highlightAll();
    }, []);
    return (
        <Layout>
            
            <div className="mx-auto w-10/12 shadow shadow-black drop-shadow-2xl" dangerouslySetInnerHTML={{__html: postData.contentHtml}}/>

        </Layout>
    );
}


export async function getStaticPaths() {
    const paths = getAllPostIds();
    return {
        paths,
        fallback: false // false means other routes should 404.
    }
}


export async function getStaticProps({params}) {
    const postData = await getPostData(params.id);
    return{
        props: {
            postData
        }
    }
}