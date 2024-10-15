import { ExperienceEntry } from "@components/ ExperienceEntry"

import { ExperienceRowEntry } from "@components/ ExperienceRowEntry"
import { ExperienceGaleryEntry } from "@components/ ExperienceGaleryEntry"

const skills = [
  "Backend (NodeJS)",
  "Frontend (React, Next)",
  "Web3",
  "Cloud computing (AWS, GCP)",
  "Problem solving",
  "SQL databases (Postgres, MySQL)",
  "NoSQL databases (MongoDB, Firebase, DynamoDB)",
  "Message Brokers (SNS, SQS, Kafka)",
  "Design System",
  "Microservices design patterns"
]

const experiences = [
  {
    title: "Software Engineer",
    period: "2021 - Present",
    paragraphs: [],
    achievements: [],
    photos: []
  },

  {
    title: "Softeam",
    period: "2017 - 2019",
    paragraphs: ['While I was finishing my studies,  I volunteered Softeam to make a difference and learn something in the process. Softeam is a junior enterprise, which basically is a civil social nonprofit organization established and executed entirely by students of a university.', 'I was lucky to work with great people who were smart, friendly, coffee lovers and always willing to develop projects and help me whenever needed. I Thank you all for having my back :)'],
    achievements: ['The marshmallow challenge is a classic problem-solving and team building exercise. I was happy to have won this challenge with my team on an PMI event.', 'I joined softeam as a frontend developer and finished as a project manager of a small team of devs. During my time there I was able to deliver projects on time and that helped the company achieve high revenue growth for 3 consecutive years.'],
    photos: [{ url: '/images/marshmallow-challenge.png', label: 'The Marshmallow - 2019' }, { url: '/images/sermej.png', label: 'High growth celebration - 2019' }]
  },

  {
    title: "Fecho",
    period: "2019 - 2021",
    paragraphs: ['I co-founded a startup with peers to revolutionize the Brazilian real estate market by integrating Artificial Intelligence as a mediator between buyers, sellers, and property developers.', ' Fun fact: Fecho, our product, originated from my undergraduate thesis and represents the pinnacle of my academic journey. It allowed me to consolidate the knowledge and skills I gained throughout college, and has shaped my development as a software engineer and entrepreneur, preparing me for the challenges ahead.'],
    achievements: ['There was no AI Hype nor ChatGPT API/models at the time so I had to go through all the papers on machine learning and Natural language processing in order to build a human-like buying experience that scales well.', 'Integration was the key to our success. I managed to develop an omnichannel platform that integrated with WhatsApp, Slack, Web, and Mobile, allowing us to reach a broader audience and reach our client no matter where they were.'],
    photos: [{ url: '/images/fechoapp.jpeg', label: 'The Marshmallow - 2019', className: 'bg-transparent', width: 'w-30', height: 'h-60 rounded-md', disableRotate: true }, {url: '/images/node-t-shirt.png'}]
  },
   {
    title: "Fecho",
    period: "2019 - 2021",
    paragraphs: ['I co-founded a startup with peers to revolutionize the Brazilian real estate market by integrating Artificial Intelligence as a mediator between buyers, sellers, and property developers.'],
    achievements: [],
    photos: [{ url: '/images/fechoapp.png', label: '', className: 'bg-transparent', width: 'w-30', height: 'h-60 rounded-md', disableRotate: true }, {url: '/images/t-shirt.png'}]
  },

   {
    title: "Ayo",
    period: "2019 - 2021",
    paragraphs: ['I left my comfort zone and saw an opportunity to start my own project. It was a really good time.', 'It was a time of constant experimentation and a lot of work in different areas of design.', 'I learned a lot about software development, marketing, and self-management. In collaboration with talented people we designed beautiful projects.'],
    achievements: [],
    photos: [ {url:'/images/me-at-ayo.jpeg', label: 'AyoApp HQ - 2021', className: 'bg-white', width: 'object-cover', disableRotate: true},{ url: '/images/ayo.png', label: '', className: 'bg-transparent', width: 'w-30 object-scale-down', height: 'h-60 rounded-md', disableRotate: true }, {url: '/images/ayopay.png', width: 'w-10 object-fill' , height: 'h-10 rounded-full', className: 'bg-transparent', disableRotate: true}]
  },
]

export default function Home() {
  return (
    <div className="container w-screen">
      <main className="bg-gray-950 w-screen">
        <div className=" h-full w-10/12 max-w-3xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="self-center">
              <div className=" max-w-[150px] bg-gradient-to-r from-sky-300 indigo-700 p-1 rounded-full">
                <div className="p-2 rounded-full bg-gradient-to-r from-light-grape to-grape">
                  <img className="h-25 w-25" src="/images/avatar.png" />
                </div>
              </div>
            </div>

            <div className="self-center gap-2">
              <h1 className="text-2xl text-center leading-7 font-mono font-bold bg-gradient-to-r  from-grape to-light-grape text-transparent bg-clip-text">Hi. I'm Tiago Santos (Aka Tigas)</h1>
              <h1 className="text-2xl text-center leading-7 font-mono font-bold bg-gradient-to-r  from-grape to-light-grape text-transparent bg-clip-text">A Software enginner.</h1>
            </div>


            <div className="self-center">
              <img className="h-30 w-80" src="/images/scratch-icon.svg" />
            </div>

          </div>

          <div className="self center flex flex-col justify-center w-full gap-4 max-w-10/12">
            <label className="font-mono font-bold text-white text-lg text-center ">
              Skills
            </label>

            <div className="flex flex-wrap gap-4 self-center justify-center">
              {skills.map(skill => {
                return (
                  <div key={skill} className="py-2 px-6 rounded-full border-violet-500 border-2">
                    <label className="bg-gradient-to-r from-amber-200 via-amber-300 to-green-500 inline-block text-transparent bg-clip-text">
                      {skill}
                    </label>
                  </div>
                )
              })}

            </div>

            <div className="self-center">
              <img src="/images/arrow-down-01.svg" className="w-20 h-60 mx-auto" />
              <h1 className="text-center text-white font-mono font-bold text-2xl">My journey as Software Engineer</h1>
            </div>

            <div className="flex flex-row grid-rows-3  justify-between items-center">
              <label className="text-lg font-mono uppercase  w-1/3 max-w-[200px] mb-4 bg-gradient-to-r from-emerald-200 to-blue-500 inline-block text-transparent bg-clip-text"> I started my JOURNEY IN it VOLUNTEERING AT A JUNIOR ENTERPRISE IN 2016.</label>
              <img src="/images/two-arrow-down.svg" className="h-2/3 w-1/3 self-center relative top-0" />
              <label className="text-md font-mono   max-w-30 w-1/3 max-w-[300px] mb-4 bg-gradient-to-r from-emerald-200 to-blue-500 inline-block text-transparent bg-clip-text">
                The first time I really came into contact with programming I was around 14 years old.  I wanted to build my own MMORPG game server to have fun with some friends and earn some bucks in the process.
              </label>
            </div>

            <ExperienceEntry experience={
              {
                title: "School",
                period: "2024 - 2019",
                paragraphs: ['I started studying at the Universidade Federal de Sergipe in Brazil', 'In my early years, I explored competitive programming, web dev, AI entrepreneurship and also met great people.'],
                achievements: ['I was very good at the programming contests and event competed in the first two years', 'I found the thrill of using technology to create new projects and products incredibly inspiring. This passion often kept me awake through countless nights during hackathons.'],
                photos: [{
                  url: '/images/graduation-cerimony.JPG', label: 'Sergipe BR - 2019', arrowComponent: () => (<div className="flex flex-col">
                    <img src='/images/arrow-up-left.svg' className='w-20 h-30 z-10 self-center relative -left-10 -top-14' />
                    <label className="bg-gradient-to-r from-emerald-200 to-blue-500 inline-block text-transparent bg-clip-text font-bold font-mono text-lg text-right relative -top-20 mt-2 mr-3">That's Me!</label>
                  </div>)
                }]
              }
            } position={'left'} />

            <div className="flex flex-row-reverse ">
              <img src="/images/arrow-down-round.svg" className="h-2/3 w-1/3 self-center relative top-0" />
            </div>

            <ExperienceEntry experience={experiences[1]} position={'left'} />

            <div className="flex flex-row-reverse">
              <img src="/images/arrow-down-orange.svg" className="h-2/3 w-1/3 mr-32 " />
            </div>
            <ExperienceRowEntry experience={experiences[3]} position={'left'} />

            <div className="flex flex-row-reverse justify-center">
              <img src="/images/arrow-down-center.svg" className="h-1/3 w-1/5" />
            </div>


            <ExperienceGaleryEntry experience={experiences[4]} position={'left'} />

          </div>
        </div>
      </main>
    </div>
  )
}
