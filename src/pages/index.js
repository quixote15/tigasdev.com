import Head from 'next/head'


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

export default function Home() {
  return (
    <div className="container w-screen">


      <main className="bg-gray-950 w-screen">
        <div className=" h-full w-10/12 mx-auto">
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
              <label className="text-lg font-mono uppercase text-white w-1/3 max-w-[200px] mb-4"> I started my JOURNEY IN it VOLUNTEERING IN A SOFTWARE HOUSE IN 2016 6</label>
              <img src="/images/two-arrow-down.svg" className="h-2/3 w-1/3 self-center relative top-0" />
              <label className="text-md font-mono  text-white max-w-30 w-1/3 max-w-[300px] mb-4">
              The first time I really came into contact with programming I was around 14 years old.  I wanted to build my own MMORPG  server to have fun with some friends and earn some bucks in the process
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
