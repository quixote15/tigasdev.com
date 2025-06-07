import '@styles/globals.css'
import Head from 'next/head'


function Application({ Component, pageProps }) {
  return <>
  <Head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');
    </style>
  </Head>
  <Component {...pageProps} />
  </>
  
}

export default Application
