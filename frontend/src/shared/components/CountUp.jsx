import { useEffect, useRef, useState } from 'react'
import { animate, useMotionValue } from 'framer-motion'

export default function CountUp({ value = 0, duration = 1.2, decimals = 0, suffix = '' }) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(0)
  const last = useRef(0)

  useEffect(() => {
    const controls = animate(mv, Number(value) || 0, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        last.current = v
        setDisplay(v)
      },
    })
    return () => controls.stop()
  }, [value, duration, mv])

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()
  return (
    <span className="num">
      {formatted}
      {suffix}
    </span>
  )
}
