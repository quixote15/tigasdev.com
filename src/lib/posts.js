import fs from 'fs';
import path from 'path';
import showdown from 'showdown';
import 'highlight.js/styles/night-owl.css'// Then register the languages you need
import showdownPrettify from 'showdown-prettify';
import markdownit from 'markdown-it'
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);

// Register the prettify extension
showdown.extension('prettify', showdownPrettify);
showdown.setFlavor('github');
const postsDirectory = 'src/posts';

export function getAllPostIds() {
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames.map((filename) => {
        return  {
            params: {
                id: filename.replace(/\.md$/, '')
            }
        }
    })
}


export  async function getPostData(id) {

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

    const converter = new showdown.Converter({skin: 'Sunburst', lang: 'js',extensions: ['prettify'],ghCodeBlocks: true, omitExtraWLInCodeBlocks:true});
    converter.setFlavor('github');
    converter.setOption('tables', true);
    const fullPath = path.join(postsDirectory, `${id}.md`);

    const fileContents = fs.readFileSync(fullPath, 'utf8');
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