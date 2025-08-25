'use client'
import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  twinkle: number
  color: string
}



export default function UniverseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Track mouse movement for subtle parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Generate stars
    const stars: Star[] = []
    const starCount = 200
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.5 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
        color: ['#ffffff', '#ffeb3b', '#4fc3f7', '#f06292', '#81c784'][Math.floor(Math.random() * 5)]
      })
    }



    let time = 0

    const animate = () => {
      time += 0.016 // 60fps

      // Clear canvas with gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      )
      gradient.addColorStop(0, '#0a0a0a')
      gradient.addColorStop(0.3, '#1a1a2e')
      gradient.addColorStop(0.7, '#16213e')
      gradient.addColorStop(1, '#0f0f23')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw stars
      stars.forEach((star, index) => {
        // Twinkle effect
        const twinkle = Math.sin(time * 2 + star.twinkle) * 0.3 + 0.7
        
        ctx.save()
        ctx.globalAlpha = star.opacity * twinkle
        
        // Star glow
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4)
        glowGradient.addColorStop(0, `${star.color}${Math.floor(star.opacity * 0.8 * 255).toString(16).padStart(2, '0')}`)
        glowGradient.addColorStop(0.5, `${star.color}${Math.floor(star.opacity * 0.3 * 255).toString(16).padStart(2, '0')}`)
        glowGradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2)
        ctx.fill()
        
        // Star core
        ctx.fillStyle = `${star.color}${Math.floor(star.opacity * 0.9 * 255).toString(16).padStart(2, '0')}`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()
        
        // Update star position
        star.y += star.speed
        if (star.y > canvas.height + 10) {
          star.y = -10
          star.x = Math.random() * canvas.width
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
}
