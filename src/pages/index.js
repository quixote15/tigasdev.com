

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

            <div className='flex flex-col justify-between mt-2'>
              <div className="flex flex-row items-center justify-around">
                <div className='flex col '>
                  <div className='flex flex-col px-1 pb-2 bg-white rounded-md -rotate-12' >
                    <img src='/images/graduation-cerimony.JPG' className='w-48 h-36 mt-1' />
                    <label className='text-dark font-nanum text-xl text-center'>Sergipe BR - 2019</label>
                  </div>
                </div>
                <div className='flex flex-col w-1/2 ml-6'>
                  <h1 className='text-xl text-blue-300  '>School</h1>
                  <label className='text-md text-blue-300 mb-4 '>2014 - 2019</label>
                  <label className="text-white text-md  mb-2 font-bold">
                    I started studying at the Universidade Federal de Sergipe in Brazil
                  </label>
                  <label className="text-md text-white font-bold">
                    In my early years, I explored competitive programming, web dev, AI entrepreneurship and also met great people.
                  </label>
                  <div className="flex flex-row gap-2 ">
                    <div className=" bg-slate-900 p-2 rounded-md mt-4 w-26">
                      <label className=" max-w-20 text-white text-xs text-center  text-ellipsis">
                        I was very good at the programming contests and event competed in the first two years
                      </label>
                    </div>
                    <div className="w-26 bg-slate-900 p-2 rounded-md mt-4 text-ellipsis" >
                      <label className="max-w-20 text-white text-xs text-center ">
                      I found the thrill of using technology to create new projects and products incredibly inspiring. This passion often kept me awake through countless nights during hackathons.
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
