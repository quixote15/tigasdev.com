import '@styles/globals.css'
import Head from 'next/head'

function Application({ Component, pageProps }) {
  return <>
  <Head>
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');
    </style>
  </Head>
  <Component {...pageProps} />
  </>
  
}

export default Application
