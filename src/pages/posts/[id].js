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
          <div className="mx-auto post-item w-10/12" dangerouslySetInnerHTML={{__html: postData.contentHtml}}/>
        </Layout>
    );
}


export async function getStaticPaths() {
    const paths = await getAllPostIds();
    return {
        paths,
        fallback: false // false means other routes should 404.
    }
}


export async function getStaticProps({params}) {
    console.log(params, 'params get post ')
    const postData = await getPostData(params.id);
   // const postData = await fetch('http://127.0.0.1:5001/tigasdev-154f6/us-central1/getPost?id=' + params.id).then(res => res.json());
    console.log(postData, 'postData')

    return {
        props: {
            postData
        }
    }
}