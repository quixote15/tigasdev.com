import Layout from "@components/Layout";
import Link from "next/link";

export default function projects() {
    const projects = [
        {
            year: "2024",
            title: "Password Manager",
            description: "Secure password storage with client-side encryption",
            link: "/password-manager"
        },
        {
            year: "2024", 
            title: "Video Call Platform",
            description: "WebRTC-powered video calling application",
            link: "/meet"
        }
    ];

    return (
        <Layout>
            <div className="container mx-auto px-6 py-16 max-w-4xl">
                <div className="mb-16">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Projects
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Open-source projects I've made over the years.
                    </p>
                </div>

                <div className="space-y-6">
                    {projects.map((project, index) => (
                        <div key={index} className="group bg-gray-900 border border-gray-800 rounded-lg p-6 hover:bg-gray-800 hover:border-gray-700 transition-all">
                            <div className="flex items-start gap-6">
                                <div className="text-gray-500 text-sm font-mono mt-1 w-12 flex-shrink-0">
                                    {project.year}
                                </div>
                                
                                <div className="flex-grow">
                                    <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                                        <Link href={project.link}>
                                            {project.title}
                                        </Link>
                                    </h2>
                                    <p className="text-gray-400 mt-1">
                                        {project.description}
                                    </p>
                                    
                                    <div className="flex gap-4 mt-3">
                                        <Link href={project.link} className="text-blue-400 hover:text-blue-300 text-sm">
                                            Demo
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    )
}