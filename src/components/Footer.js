import styles from './Footer.module.css'

export default function Footer() {
  return (
    <>
      <footer className="w-screen h-60 flex justify-center items-center border-sky-300 bg-gray-950 fixed-bottom">
        <div className='flex flex-row gap-8'>
        <a href="github.com/quixote15" target="_blank" rel="noopener noreferrer" className='bg-transparent self-center'>
          <img src='/images/github-logo.png' className="w-8 h-fit bg-transparent" />
        </a>
        <a href="https://www.linkedin.com/in/tiago-conceicao/" target="_blank" rel="noopener noreferrer">
          <img src='/images/linkedin.png' className="w-8 h-fit" />
        </a>
        <a href="https://x.com/TiagoCnT" target="_blank" rel="noopener noreferrer" className='bg-transparent self-center rounded-md'>
          <img src='/images/x-logo.png' className="w-8 h-fit bg-transparent rounded-full" />
        </a>
        </div>
      </footer>
    </>
  )
}
