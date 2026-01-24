import { useEffect, useRef } from 'react'

const AnimatedGridBackground = () => {
    const canvasRef = useRef(null)
    const mouseRef = useRef({ x: -100, y: -100 })

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let animationFrameId
        let scrollY = 0

        // Configuration
        const squareSize = 50
        const gridColor = '#333333' // Subtle grid line color
        const hoverFillColor = '#1a1a1a'
        const scrollSpeed = 0.5
        const vignetteColorOuter = '#060010' // Dark purple/black

        // Resize handler
        const handleResize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        // Mouse move handler
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect()
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            }
        }

        // Initial resize
        handleResize()
        window.addEventListener('resize', handleResize)
        window.addEventListener('mousemove', handleMouseMove)

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Update scroll
            scrollY = (scrollY + scrollSpeed) % squareSize

            const cols = Math.ceil(canvas.width / squareSize)
            const rows = Math.ceil(canvas.height / squareSize) + 1 // +1 for seamless scrolling

            ctx.beginPath()

            // Draw Grid and Hover
            for (let i = 0; i < cols; i++) {
                for (let j = -1; j < rows; j++) {
                    const x = i * squareSize
                    const y = j * squareSize + scrollY

                    // Check if mouse is over this square
                    if (
                        mouseRef.current.x >= x &&
                        mouseRef.current.x < x + squareSize &&
                        mouseRef.current.y >= y &&
                        mouseRef.current.y < y + squareSize
                    ) {
                        ctx.fillStyle = hoverFillColor
                        ctx.fillRect(x, y, squareSize, squareSize)
                    }

                    // Draw grid lines
                    ctx.strokeStyle = gridColor
                    ctx.lineWidth = 1
                    ctx.strokeRect(x, y, squareSize, squareSize)
                }
            }

            // Draw Vignette
            // Create radial gradient
            const radius = Math.max(canvas.width, canvas.height) * 0.8

            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, radius
            )

            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)') // Transparent center
            gradient.addColorStop(0.8, vignetteColorOuter) // Fade to dark edges
            gradient.addColorStop(1, vignetteColorOuter)

            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('mousemove', handleMouseMove)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                pointerEvents: 'none', // Allow clicks to pass through to content, but we need mouse events for hover
                // Wait, if pointerEvents is none, mousemove won't fire on canvas?
                // Actually, we attached mousemove to window, so it's fine.
                // But if content is on top (z-10), it might block view?
                // No, z-index 0 is behind.
                background: '#0a0a0a' // Base background color
            }}
        />
    )
}

export default AnimatedGridBackground
