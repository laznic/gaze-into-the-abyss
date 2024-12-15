# Gaze into the Abyss
![Social preview](/public/social-preview.png)

An experimental web experience where participants join virtual rooms and track each other's eye movements and blinks in real-time. Built for Supabase Launch Week 13 Hackathon.

## 🌟 Features

- Eye tracking and blink detection using WebGazer.js
- Real-time synchronization of eye movements between participants
- Dynamic room allocation with up to 10 participants per room
- Ambient audio experience
- Animated SVG eyes with realistic pupil movement and blinking
- Atmospheric visual effects using SVG filters

## 🛠️ Built With

- [React](https://react.dev/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [WebGazer.js](https://webgazer.cs.brown.edu/)
- [Motion One](https://motion.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Stable Audio](https://www.stableaudio.com/)

## 🎮 How it Works

1. Allow camera access for eye tracking calibration
2. Calibrate your eye movements by following the red dots
3. Join a room automatically with other participants
4. Watch as other participants' eyes appear and follow their gaze

## 🎯 Technical Details

- Uses WebGazer.js for real-time eye tracking and blink detection
- Implements dynamic brightness threshold analysis for (somewhat) accurate blink detection
- Supabase Realtime channels for synchronized participant states
- Complex SVG animations for realistic eye movements and effects

## 🚀 Future Ideas

- WebRTC integration for peer-to-peer audio
- Enhanced audio processing for better whisper detection
- Additional atmospheric elements

## 👥 Created By

- laznic ([GitHub](https://github.com/laznic), [Twitter](https://twitter.com/laznic))

## 🙏 Thanks to

- Brown University's WebGazer.js team
- Supabase team for the realtime infrastructure

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
