import React, { memo, useCallback, useEffect } from "react"
import * as THREE from 'three'
import Orbitcontrols from 'three-orbit-controls'
import './index.less'

export default memo(() => {

  const initThree = useCallback(() => {
    const container = document.querySelector('#three-base')
    if(container) {
      const animate = () => {
        requestAnimationFrame(animate)
        cube.rotation.x += 0.01
        cube.rotation.y += 0.01
        renderer.render(scene, camera)
      }
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000)
      camera.position.set(0, 0, 5)
      camera.lookAt(scene.position)
      // let orbitControls = new Orbitcontrols(camera)
      const geometry = new THREE.BoxGeometry()
      const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
      const cube = new THREE.Mesh( geometry, material )
      scene.add( cube )
      // orbitControls.autoRotate = false
      const renderer = new THREE.WebGLRenderer()
      renderer.setSize(containerWidth, containerHeight)
      container.appendChild( renderer.domElement )
      animate()
    }
  }, [])

  useEffect(() => {
    initThree()
  }, [])
  
  return (
    <div id="three-base"></div>
  )
  
})