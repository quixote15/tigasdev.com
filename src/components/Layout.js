import Header  from './Header'
import Footer  from './Footer'

const Layout = ({ children }) => {
    return (
        <div className="container w-screen">
            <Header/>
            <main className="bg-gray-950 w-screen min-h-full">{children}</main>
            <Footer/>
        </div>
    )

}

export default Layout