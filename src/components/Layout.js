import Header  from './Header'
import Footer  from './Footer'
import MobileMenu from './MobileMenu'
const Layout = ({ children }) => {
    // check is os is mobile
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    return (
        <div className="container w-screen">
            {!isMobile ? <Header/> :
            <MobileMenu />}
            <main className="bg-gray-950 w-screen min-h-full">{children}</main>
            <Footer/>
        </div>
    )

}

export default Layout