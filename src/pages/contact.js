import Layout from "@components/Layout";
import { PopupWidget } from "@components/wip";
import { InlineWidget } from "react-calendly";

export default function contact() {
    return (
        <Layout>
            <div>
                <div className="mt-10 w-10/12 flex flex-col mx-auto">
                    <h1 className="text-2xl text-center bg-gradient-to-r  from-grape to-light-grape text-transparent bg-clip-text">Hire me</h1>
                    <label className="text-white text-center text-sm font-mono">
                        My work speaks for the goals of my clients; it’s crafted carefully, studied through the gamut of human psychology, and created to stand the test of time. My role is to listen and trust, research and explore, create and design, present and deliver, and to cater to your needs.
                    </label>
                    <label className="text-white text-center text-sm font-mono mt-4">
                        I am currently accepting new projects!
                    </label>

                    <form></form>
                </div>
                <div className="App mt-30" id="root">
                <InlineWidget  url="https://calendly.com/otigasdev"/>
                </div>
            </div>
        </Layout>
    )
}