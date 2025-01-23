'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Card3D } from './Card3D'
// import { Button } from '@/components/ui/button'
import * as THREE from 'three'

const suits = ['♠', '♥', '♣', '♦']
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const createDeck = () => {
  return suits.flatMap(suit => values.map(value => ({ suit, value })))
}

const perfectFaroShuffle = (deck: { suit: string; value: string; number: number }[]) => {
  const half = Math.floor(deck.length / 2)
  const firstHalf = deck.slice(0, half)
  const secondHalf = deck.slice(half)
  const shuffled = []

  for (let i = 0; i < half; i++) {
    shuffled.push(secondHalf[i], firstHalf[i])
  }

  return shuffled
}

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export const PerfectFaroShuffle3D: React.FC = () => {
  const [deck, setDeck] = useState(createDeck().map((card, index) => ({ ...card, number: index + 1 })))
  const [shuffleCount, setShuffleCount] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)
  const shuffleStageRef = useRef(0)

  const getCardPosition = (index: number, totalCards: number, stage: number, progress: number) => {
    const baseY = -totalCards * 0.025 + index * 0.05
    const baseZ = totalCards * 0.025 - index * 0.05

    if (stage === 0) {
      return [0, baseY, baseZ]
    } else if (stage === 1) {
      const half = Math.floor(totalCards / 2)
      const isFirstHalf = index < half
      const startX = 0
      const endX = isFirstHalf ? -1.5 : 1.5
      const startY = baseY
      const endY = isFirstHalf ? index * 0.05 : (index - half) * 0.05
      const startZ = baseZ
      const endZ = 0

      const t = easeInOutCubic(progress)
      const x = startX + (endX - startX) * t
      const y = startY + (endY - startY) * t
      const z = startZ + (endZ - startZ) * t

      // Add a slight arc to the movement
      const arcHeight = isFirstHalf ? 0.5 : -0.5
      const arc = Math.sin(t * Math.PI) * arcHeight

      return [x, y + arc, z]
    } else {
      const newIndex = perfectFaroShuffle(deck.map((_, i) => i))[index]
      const startX = index < totalCards / 2 ? -1.5 : 1.5
      const startY = index < totalCards / 2 ? index * 0.05 : (index - totalCards / 2) * 0.05
      const startZ = 0
      const endX = 0
      const endY = -totalCards * 0.025 + newIndex * 0.05
      const endZ = totalCards * 0.025 - newIndex * 0.05

      const t = easeInOutCubic(progress)
      const x = startX + (endX - startX) * t
      const y = startY + (endY - startY) * t
      const z = startZ + (endZ - startZ) * t

      // Add a slight arc to the movement
      const arcHeight = 0.5
      const arc = Math.sin(t * Math.PI) * arcHeight

      return [x, y + arc, z]
    }
  }

  const shuffle = useCallback(() => {
    if (isShuffling) return

    setIsShuffling(true)
    shuffleStageRef.current = 1

    const animationDuration = 1000 // 1 second for each stage
    const startTime = Date.now()

    const animateStage = (stage: number) => {
      const animate = () => {
        const now = Date.now()
        const progress = Math.min(1, (now - startTime) / animationDuration)

        setDeck(deck => deck.map((card, index) => ({
          ...card,
          position: getCardPosition(index, deck.length, stage, progress)
        })))

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else if (stage === 1) {
          shuffleStageRef.current = 2
          setDeck(perfectFaroShuffle(deck)) //Corrected this line
          setTimeout(() => animateStage(2), 0)
        } else {
          setIsShuffling(false)
          shuffleStageRef.current = 0
          setShuffleCount(prev => prev + 1)
        }
      }

      requestAnimationFrame(animate)
    }

    animateStage(1)
  }, [deck, isShuffling])

  const reset = useCallback(() => {
    setDeck(createDeck().map((card, index) => ({ ...card, number: index + 1 })))
    setShuffleCount(0)
    shuffleStageRef.current = 0
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-4">3Dパーフェクトファロシャッフル</h1>
      <div className="w-full h-[60vh] mb-4">
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          {deck.map((card, index) => (
            <Card3D
              key={`${card.suit}-${card.value}-${index}`}
              suit={card.suit}
              value={card.value}
              position={card.position || getCardPosition(index, deck.length, shuffleStageRef.current, 0)}
              rotation={[0, 0, 0]}
              index={index}
              number={card.number}
            />
          ))}
          <OrbitControls />
        </Canvas>
      </div>
      <div className="flex space-x-4">
        <button type="button" onClick={shuffle} className="mb-2" disabled={isShuffling}>シャッフル</button>
        <button type="button" onClick={reset} className="mb-2" disabled={isShuffling}>リセット</button>
      </div>
      <p className="text-lg">シャッフル回数: {shuffleCount}</p>
    </div>
  )
}

