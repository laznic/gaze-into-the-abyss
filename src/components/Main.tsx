import { Link } from "react-router";
import 'splitting/dist/splitting.css'
import 'splitting/dist/splitting-cells.css'
import Splitting from 'splitting'
import { useEffect, useState } from "react";
import { createTimeline, stagger, utils } from '@juliangarnierorg/anime-beta'

export default function Main() {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)

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
     .then(() => {
       setIsAnimationComplete(true)
     })
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center max-w-3xl mx-auto">
      <blockquote className="text-neutral-100 mb-4 font-serif text-3xl leading-none z-10 italic max-w-3xl px-4" data-splitting>
        If you gaze long into an abyss, the abyss also gazes into you.
        <cite className="text-neutral-500 text-base mt-4 block text-right">
          - Friedrich Nietzsche
        </cite>
      </blockquote>

      <footer className={`w-full flex justify-between items-center p-8 transition-opacity duration-1000 ${isAnimationComplete ? 'opacity-100' : 'opacity-0'}`}>
        <Link to="/room" className="text-white hover:text-gray-300 z-10 font-serif italic calibration-button border border-neutral-900 transition-all text-md px-4 py-2 rounded">
          Enter
        </Link>

        <div className="inline-flex items-center gap-4 text-neutral-500">
          <a 
            href="https://github.com/laznic/gaze-into-the-abyss" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="inline-block align-middle">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>

          <div className="group relative">
            <button className="hover:text-neutral-100 hover:bg-neutral-900 transition-colors border border-neutral-900 rounded-full px-2">?</button>
            <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-black/90 rounded text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-neutral-100 border border-neutral-950 z-50">
              This experimental web experience uses your webcam to track eye movements and detect blinking.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

