/**
 * Hero3D — theme-aware rendition. A soft floating orb with thin orbital rings
 * and a sparse node graph, rendered in the indigo/violet brand palette so it
 * reads cleanly on both the light canvas and the dark navy canvas.
 */
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { useTheme } from '../../../shared/theme/ThemeProvider.jsx'

function Orb({ palette }) {
  const m = useRef()
  useFrame((s, dt) => {
    if (!m.current) return
    m.current.rotation.x += dt * 0.12
    m.current.rotation.y += dt * 0.18
  })
  return (
    <Float speed={1.0} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={m}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color={palette.orb} roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color={palette.wire} wireframe transparent opacity={palette.wireOpacity} />
      </mesh>
    </Float>
  )
}

function Ring({ radius, thickness = 0.012, rotation = [0, 0, 0], color, opacity = 0.3 }) {
  const ref = useRef()
  useFrame((s, dt) => {
    if (!ref.current) return
    ref.current.rotation.z += dt * 0.05
  })
  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, thickness, 16, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

function Nodes({ count = 36, color }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 1.3
      const t = Math.random() * Math.PI * 2
      const p = Math.acos(2 * Math.random() - 1)
      arr[i * 3 + 0] = r * Math.sin(p) * Math.cos(t)
      arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.5
      arr[i * 3 + 2] = r * Math.cos(p)
    }
    return arr
  }, [count])
  useFrame((s, dt) => {
    if (!ref.current) return
    ref.current.rotation.y += dt * 0.04
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

export default function Hero3D() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const palette = dark
    ? { orb: '#6366f1', wire: '#a5b4fc', wireOpacity: 0.35, ring: '#818cf8', node: '#a5b4fc' }
    : { orb: '#6366f1', wire: '#8b5cf6', wireOpacity: 0.28, ring: '#6366f1', node: '#8b5cf6' }

  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 2]} gl={{ alpha: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 5]} intensity={0.9} />
      <pointLight position={[-4, -2, 2]} intensity={0.6} color={palette.ring} />
      <Orb palette={palette} />
      <Ring radius={2.0} rotation={[Math.PI / 2.4, 0, 0]} color={palette.ring} opacity={dark ? 0.5 : 0.32} />
      <Ring radius={2.6} rotation={[Math.PI / 2.8, Math.PI / 6, 0]} color={palette.ring} opacity={dark ? 0.32 : 0.2} />
      <Ring radius={3.2} rotation={[Math.PI / 3.2, -Math.PI / 5, 0]} color={palette.ring} opacity={dark ? 0.2 : 0.12} />
      <Nodes color={palette.node} />
    </Canvas>
  )
}
