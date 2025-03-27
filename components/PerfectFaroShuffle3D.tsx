'use client'

import type React from 'react'
import { useState, useCallback, useRef, ChangeEvent } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Card3D } from './Card3D'
import * as THREE from 'three'

const suits = ['♠', '♥', '♣', '♦']
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const createDeck = (size = 52): Card[] => {
  const baseDeck: Omit<Card, 'number'>[] = suits.flatMap(suit =>
    values.map(value => ({
      suit,
      value,
    }))
  )

  const deck: Card[] = []
  for (let i = 0; i < size; i++) {
    const card = baseDeck[i % baseDeck.length]
    deck.push({ ...card, number: i + 1 })
  }
  return deck
}

function perfectFaroShuffle(deck: Card[]) {
  const half = Math.floor(deck.length / 2)
  const firstHalf = deck.slice(0, half)
  const secondHalf = deck.slice(half)
  const shuffled: Card[] = []
  for (let i = 0; i < half; i++) {
    shuffled.push(secondHalf[i], firstHalf[i])
  }

  return shuffled
}

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2

interface Card {
  suit: string
  value: string
  number: number
  position?: [number, number, number]
}

export const PerfectFaroShuffle3D: React.FC = () => {
  const [deckSize, setDeckSize] = useState(52)
  const [deckSizeInput, setDeckSizeInput] = useState(String(deckSize))
  const [sizeError, setSizeError] = useState('')
  const [deck, setDeck] = useState(createDeck(deckSize))
  const [shuffleCount, setShuffleCount] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)
  const shuffleStageRef = useRef(0)

  const getCardPosition = useCallback((index: number, totalCards: number, stage: number, progress: number): [number, number, number] => {
    const baseY = 0
    const baseZ = totalCards * 0.025 - index * 0.05

    if (stage === 0) {
      return [0, baseY, baseZ]
    }

    if (stage === 1) {
      const half = Math.floor(totalCards / 2)
      const isFirstHalf = index < half
      const startX = 0
      const endX = isFirstHalf ? -1.0 : 1.0
      const startY = baseY
      const endY = 0
      const startZ = baseZ
      const endZ = baseZ

      const t = easeInOutCubic(progress)
      const x = startX + (endX - startX) * t
      const y = startY + (endY - startY) * t
      const z = startZ + (endZ - startZ) * t

      // Add a slight arc to the movement
      const arcHeight = isFirstHalf ? 0.5 : -0.5
      const arc = Math.sin(t * Math.PI) * arcHeight

      return [x, y, z]
    }

    const half = Math.floor(totalCards / 2)
    const isFirstHalf = index < half
    const startX = isFirstHalf ? -1.0 : 1.0
    const startY = 0
    const startZ = baseZ
    const endX = 0
    const endY = 0
    const newIndex = isFirstHalf ? (2 * index + 1) : (index - half) * 2
    const endZ = totalCards * 0.025 - newIndex * 0.05

    const t = easeInOutCubic(progress)
    const x = startX + (endX - startX) * t
    const y = startY + (endY - startY) * t
    const z = startZ + (endZ - startZ) * (t ** 0.16)

    // Add a slight arc to the movement
    const arcHeight = 0.5
    const arc = Math.sin(t * Math.PI) * arcHeight

    return [x, y, z]
  }, [])

  const shuffle = useCallback(() => {
    if (isShuffling) return

    setIsShuffling(true)
    shuffleStageRef.current = 1

    const animationDuration = 300

    const animateStage = (stage: number) => {
      const startTime = Date.now()
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
          setTimeout(() => animateStage(2), 0)
        } else {
          const shuffledDeck = perfectFaroShuffle(deck);
          setDeck(deck.map((card, index) => ({
            ...shuffledDeck[index],
            position: card.position
          })));

          setIsShuffling(false)
          shuffleStageRef.current = 0
          setShuffleCount(prev => prev + 1)
        }
      }

      requestAnimationFrame(animate)
    }

    animateStage(1)
  }, [deck, isShuffling])

  const reset = useCallback((size: number) => {
    setDeck(createDeck(size))
    setShuffleCount(0)
    shuffleStageRef.current = 0
  }, [deckSize])

  const handleDeckSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    const num = parseInt(input, 10)
    if (!isNaN(num) && num > 0 && num % 2 === 0) {
      setDeckSize(num)
      reset(num)
    }
  }

  const handleDeckSizeInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setDeckSizeInput(input)

    if (input === '' || isNaN(parseInt(input, 10))) {
      setSizeError('')
      return;
    }

    const num = parseInt(input, 10)
    if (num > 0 && num % 2 === 0) {
      setSizeError('')
      setDeckSize(num)
      reset(num)
    } else {
      setSizeError('そこは偶数でひとつ🙏')
    }
  };

  const handleDeckSizeBlur = () => {
    const num = parseInt(deckSizeInput, 10)

    if (isNaN(num) || num <= 0 || num % 2 !== 0) {
      setDeckSizeInput(String(deckSize))
      setSizeError('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-2 md:p-4">
      <h1 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">Perfect Faro Shuffle</h1>
      <div className="mb-2 md:mb-4">
        <div className="flex items-center">
          <label className="mr-2 font-semibold">カード枚数 (偶数で):</label>
          <input
            type="text"
            className={`text-center w-full md:w-[5em] border rounded px-2 py-1 ${sizeError ? 'border-red-500' : ''}`}
            value={deckSizeInput}
            onChange={handleDeckSizeInputChange}
            onBlur={handleDeckSizeBlur}
          />
        </div>
        <div className="h-4 mt-1 text-right">
          {sizeError && <span className="ml-2 text-red-500 text-sm">{sizeError}</span>}
        </div>
      </div>
      <div className="w-full h-[50vh] md:h-[70vh] mb-2 md:mb-4">
        <Canvas camera={{ position: [2, 3, 3], fov: 50 }} shadows>
          <ambientLight intensity={0.7} />
          <mesh castShadow receiveShadow position={[0, -0.6, 0]}>
            <boxGeometry args={[5, 0.01, 5]} />
            <meshStandardMaterial color="#50d8e4" />
          </mesh>
          <directionalLight position={[10, 10, 20]} intensity={0.5} castShadow />
          <pointLight position={[10, 10, 10]} castShadow />
          {deck.map((card, index) => (
            <Card3D
              key={card.number}
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
        <button
          type="button"
          onClick={shuffle}
          className="mb-1 md:mb-2 px-3 md:px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={isShuffling}
        >
          シャッフル
        </button>
        <button
          type="button"
          onClick={() => reset(deckSize)}
          className="mb-1 md:mb-2 px-3 md:px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
          disabled={isShuffling}
        >
          リセット
        </button>
      </div>
      <p className="text-sm md:text-lg">シャッフル回数: {shuffleCount}</p>
    </div>
  )
}
