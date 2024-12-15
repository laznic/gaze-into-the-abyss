import { Link } from "react-router";
import 'splitting/dist/splitting.css'
import 'splitting/dist/splitting-cells.css'
import Splitting from 'splitting'
import { useEffect } from "react";
import { createTimeline, stagger, utils } from '@juliangarnierorg/anime-beta'

export default function Main() {
  useEffect(() => {
    Splitting()

    utils.$('.char').forEach(char => {
      utils.set(char, { filter: 'blur(50px)', scale: 0, opacity: 0 })
    })

    createTimeline({
      defaults: {
        duration: 1500,
        ease: 'inOutQuad'
      }
     })
     .add('.char', { filter: 'blur(0px)', opacity: 1, scale: 1 }, stagger(100))
  }, [])

  return (
    <>
      <svg className="fixed inset-0 w-full h-full -z-10 ">
        <defs>
          <filter id="noise">
            <feTurbulence 
              id="turbFreq"
              type="fractalNoise" 
              baseFrequency="0.01"
              seed="5"
              numOctaves="1"
            >
            </feTurbulence>
            <feGaussianBlur stdDeviation="10">
              <animate
                attributeName="stdDeviation"
                values="10;50;10"
                dur="20s"
                repeatCount="indefinite"
              />
            </feGaussianBlur>
            <feColorMatrix
              type="matrix"
              values="-1 0 0 0 -1
                      0 -1 0 0 -1
                      0 0 -1 0 -1
                      0 0 0 25 -13"
            />
          </filter>
        </defs>
        <rect width="200%" height="200%" filter="url(#noise)" className="rotation-animation" />
      </svg>
      <div className="container mx-auto max-w-3xl h-screen flex flex-col justify-center items-center relative">
        <blockquote className="text-neutral-100 mb-4 font-serif text-3xl leading-none z-10" data-splitting>
          If you gaze long into an abyss, the abyss also gazes into you.
          <cite className="text-neutral-500 text-base mt-4 block text-right">
            - Friedrich Nietzsche
          </cite>
        </blockquote>


        <Link to="/room" className="text-white hover:text-gray-300 z-10">Room</Link>
      </div>
      <div className="fixed inset-0 w-[95vw] h-[95vh] bg-black rounded-full blur-[128px] m-auto">
      </div>
    </>
  )
}

