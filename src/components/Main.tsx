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
    <div className="container mx-auto max-w-3xl h-screen flex flex-col justify-center items-center relative">
      <blockquote className="text-neutral-100 mb-4 font-serif text-3xl leading-none z-10" data-splitting>
        If you gaze long into an abyss, the abyss also gazes into you.
        <cite className="text-neutral-500 text-base mt-4 block text-right">
          - Friedrich Nietzsche
        </cite>
      </blockquote>

      <Link to="/room" className="text-white hover:text-gray-300 z-10">Room</Link>
    </div>
  )
}

