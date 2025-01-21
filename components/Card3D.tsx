import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useSpring, animated } from '@react-spring/three'

interface Card3DProps {
  position: [number, number, number]
  rotation: [number, number, number]
  suit: string
  value: string
  index: number
  number: number
}

export const Card3D: React.FC<Card3DProps> = ({ position, rotation, suit, value, index, number }) => {
  const groupRef = useRef<THREE.Group>(null!)

  const { pos, rot } = useSpring({
    pos: position,
    rot: rotation,
    config: { mass: 1, tension: 180, friction: 12 }
  })

  return (
    <animated.group
      ref={groupRef}
      position={pos}
      rotation={rot.to((x, y, z) => [x, y, z])}
    >
      <mesh>
        <boxGeometry args={[0.7, 1, 0.01]} />
        <meshStandardMaterial color="white" />
        <Text
          position={[0, 0, 0.006]}
          fontSize={0.15}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {`${value}${suit}`}
        </Text>
        <Text
          position={[0, 0, -0.006]}
          fontSize={0.15}
          color="black"
          anchorX="center"
          anchorY="middle"
          rotation={[0, Math.PI, 0]}
        >
          {`${value}${suit}`}
        </Text>
      </mesh>
      <Text
        position={[0.4, 0, 0.006]}
        fontSize={0.15}
        color="black"
        anchorX="left"
        anchorY="middle"
      >
        {number}
      </Text>
    </animated.group>
  )
}

