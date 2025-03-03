import clsx from "clsx"

export const PictureRotatorItem = ({photo}) => {
  return (
    <div>
        <div className={clsx('flex flex-col px-1 pb-2 bg-white rounded-md -rotate-12', photo.className, photo.disableRotate && 'rotate-0')} >
            <img src={photo.url} className={clsx('mt-1', photo.height ?? 'h-36', photo.width ?? 'w-10/11' )}/>
            <label className='text-dark font-nanum text-xl text-center'>{photo.label}</label>
        </div>
        {photo.arrowComponent?.()}
    </div>
  )
}
export const PicturesRotator = ({photos}) => {
  if(photos.length === 1)  {
    const [photo] = photos
    return (
     <PictureRotatorItem photo={photo} />
    )
  }

  return photos.map((photo, index) => (
      <div key={photo.url} className={clsx('flex flex-col px-1 pb-2 bg-white rounded-md mt-3', index % 2 === 0 ? '-rotate-12' : 'rotate-12', `z-${index * 10}`)} >
          <img src={photo.url} className={clsx('mt-1', photo.height ?? 'h-36', photo.width ?? 'w-10/11' )}/>
          <label className='text-dark font-nanum text-xl text-center'>{photo.label}</label>
      </div>
  ))
}

export const ExperienceRowEntry = ({experience, position}) => {
  const middleIndex = Math.floor(experience.photos.length / 2)
  
  const leftPictures = experience.photos.slice(0, middleIndex)
  const rightPictures = [

    ...experience.photos.slice(middleIndex)
  ]
 
    return (
        <div className='flex flex-col justify-between mt-2'>
        <div className={clsx("flex items-center justify-around", position === 'right' ? 'flex-row-reverse' : 'flex-row')}>
          <div className='flex flex-col '>
             <PicturesRotator photos={leftPictures} />
          </div>
          <div className='flex flex-col w-1/2 ml-6'>
            <h1 className='text-xl text-blue-300 text-center'>{experience.title}</h1>
            <label className='text-md text-blue-300 mb-4 text-center'>{experience.period}</label>
              {experience.paragraphs.map((paragraph) => (
                    <label className="font-mono text-white text-sm text-center  mb-2 font-bold"> {paragraph}</label>
              ) )}
            <div className="flex flex-row gap-2 ">
              {experience.achievements.map((achievement) => (
                <div key={achievement} className="bg-slate-900 p-2 rounded-md w-26">
                  <label className="text-white text-xs text-center  text-ellipsis">
                    {achievement}
                  </label>
                </div>
              ))}
            </div>

          </div>

          <div className='flex flex-col '>
           { rightPictures.map((photo, index) => (
              <div key={photo.url} className={clsx('flex flex-col px-1 pb-2 bg-transparent rounded-md mt-3', index % 2 === 0 ? '-rotate-12' : 'rotate-12', `z-${index * 10}`)} >
                  <img src={photo.url} className={clsx('mt-1 object-contain', photo.height ?? 'h-48', photo.width ?? 'w-10/12' )}/>
                  <label className='text-dark font-nanum text-xl text-center'>{photo.label}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
};