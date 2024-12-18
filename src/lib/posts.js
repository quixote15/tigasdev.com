import fs from 'fs';
import path from 'path';
import showdown from 'showdown';
import 'highlight.js/styles/night-owl.css'// Then register the languages you need
import showdownPrettify from 'showdown-prettify';
import markdownit from 'markdown-it'
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java)

// Register the prettify extension
showdown.extension('prettify', showdownPrettify);
showdown.setFlavor('github');
const postsDirectory = 'src/posts';

export async function getAllPostIds() {
   const posts = await getAllPosts()
   // const fileNames = fs.readdirSync(postsDirectory);
    const result =  posts.map((post) => {
        return  {
            params: {
                id: post.id
            }
        }
    })

    console.log(result, 'result')
    return result
}


export  async function getPostData(id) {

    console.log('getting post data', id)

    const md = markdownit({
        html: true,
        highlight: function (str, lang) {
            console.log(lang, 'language')
            if (lang && hljs.getLanguage(lang)) {
              try {
                //return '<pre class="hljs"><code>' +
                  //     hljs.highlight(str, { language: 'javascript', ignoreIllegals: true }).value +
                    //   '</code></pre>';
                    return hljs.highlight(str, { language: lang, ignoreIllegals: true,  }).value;
              } catch (__) {
                console.log(__);
              }
            }
            console.log('no language')
        
            return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        }
    })

    const post = await fetch('https://getpost-oqmhrivq7a-uc.a.run.app?id=' + id, {method: 'GET'})
    const data = await post.json()
    const converter = new showdown.Converter({skin: 'Sunburst', lang: 'js',extensions: ['prettify'],ghCodeBlocks: true, omitExtraWLInCodeBlocks:true});
    converter.setFlavor('github');
    converter.setOption('tables', true);
   // const fullPath = path.join(postsDirectory, `${id}.md`);

//    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const fileContents = data.content;
    const mdResult = md.render(fileContents);

//    const matterResult = matter(fileContents);
    //const contentHtml = converter.makeHtml(fileContents);
/*
    const processedContent = await remark()
    .use(html)
    .process(matterResult.content);

    const contentHtml = processedContent.toString();
*/
    return {
        id,
        contentHtml: mdResult,
    }
}


export const getAllPosts  = async () => {
    const posts = await fetch('https://getposts-oqmhrivq7a-uc.a.run.app', {method: 'GET'})
    const data = await posts.json()
    return data
}
