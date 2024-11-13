# HOW I BUILT MY BLOGGING SOFTWARE

> This is still a Work in progress so you might find some mistakes here and there

I took this challenge from [John Cricket's Code challenges](https://codingchallenges.fyi/challenges/challenge-blog) and I am documenting the steps along the way.

This blog is gonna the part of my website that is intended to be regularly updated by me, hopefully. These updates are typically written in an informal style or as a series of articles/tutorials documenting or explaining something.

### Step Zero

In this step I have setup a Next.js project, bought a domain and setup a CI/CD pipeline using fastify to boost my productivity on the publishing process allowing me to focus on whats important: Coding the Blog!

Why Next.js? Well, besides its many features I wanted to learn more about this awesome framework so I decided kill two birds with a stone.


### Step 1

In this step the goal is to render some content in a template. Basically a blogging platform main job is to read articles from some form of datastore and render them as HTML using a common layout. That's All. 

That layout is usually defined with a template. For this step I've just added some static markdown files to a folder and then the process is to:

1. Parse markdown to html
2. Render html on the page


I basically created a JSON object containing information about the post and its file id, which is the name of the markdown file. 
```
{
 title:  "Article 4",
 createdAt:  "March 24, 2022",
 description:  "Example post with headers, lists, images, tables and more! Github Flavored Markdown guide with examples.",
 id:  'next-15-rc'
}
```



### Step 2 - TODO

In this step your goal is to be able to write the content of a blog post on a web page. To do this you’ll need to do several things:

1.  Create an admin section for the blog. I’d suggest you make that available via a URL like:  `/editor`. When you visit this section you should be authenticated, or if you are not authenticated directed to a login page.
2.  Create a page to create a new blog post (perhaps  `/editor/post`). On this page allow the user to enter a post title, summary and the post itself. To allow for formatting I suggest you encourage the user to write the post using Markdown.
3.  When the user hits ‘post’ or ‘save’ (whatever you decide to call it) the content should be saved as a new post. For now, I’d suggest simply writing the Markdown to a file, perhaps using the JSON format above.
4.  Render the post at a suitable URL using a template. For example it might be at  `/posts/1`.

### Step 3 - TODO

In this step your goal is to support editing the content of a blog post. The user should be able to login, select a post from a list and then edit the post, updating the fields in the post.

At this stage you should also add a published date and time to the post, which get’s set when the post is created and can optionally be updated when editing.

### Step 4 - TODO

In this step your goal is to store the content of the posts in a database rather than as a text based file. You could do this with a SQL or NoSQL database. Your task here is to consider the tradeoffs and then update the existing code to use your chosen option to save and read all the posts.

### Step 5 - TODO

In this step your goal is to render a homepage listing the blog posts from the database. The posts should be ordered from newest to oldest. Each title should be a link to the full blog post.

### Step 6 - TODO

In this step your goal is to allow comments on blog posts. A user should be able to enter their name, email and comment in response to a blog post.

You should render the comments under a post in order of newest to oldest.
