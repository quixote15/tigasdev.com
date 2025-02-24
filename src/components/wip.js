export const WipComponent = () => {
    return (
        <div className="w-screen h-screen flex items-start justify-items-start md:justify-center md:items-center">
            <div className="flex flex-col w-full md:self-center xs:gap-2 md:gap-4">
                <h1 className="xs:text-2xl md:text-4xl text-white font-mono text-bold text-center">Work in progress...</h1>
                <label className="text-md font-mono text-white text-center">New updates will come soon. </label>
            </div>
        </div>
    )
}