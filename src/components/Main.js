//pic size 687*687
import React from 'react'
const CANNON = require('cannon')
const THREE = require('three')
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Tone from 'tone'
import * as faceapi from 'face-api.js'
import '../debug.js'
import * as bodyPix from '@tensorflow-models/body-pix'
import '@babel/polyfill'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-converter'
import '../style.scss'

class Main extends React.Component{
  constructor(){
    super()
    this.state = {
      data: {},
      error: ''

    }
    this.componentDidMount = this.componentDidMount.bind(this)





  }


  componentDidMount(){

    const scoreDisplay = document.getElementById('score')
    const livesDisplay = document.getElementById('lives')
    const ballsIn = document.getElementById('ballsIn')
    const reset = document.getElementById('reset')
    let score = 0
    let lives = 5

    const webcamElement = document.getElementById('webcam')
    const canvas = document.getElementById('canvas')
    const instructions = document.getElementById('instructions')
    let playing = false
    let ready = false
    const drums = ['C3', 'D3', 'F3', 'E3', 'B3']
    var sampler = new Tone.Sampler({
      'C3': 'assets/Clap.wav',
      'D3': 'assets/Kick.wav',
      'F3': 'assets/Snare.wav',
      'E3': 'assets/wood.wav',
      'B3': 'assets/daiko.wav'

    }, function(){
      //sampler will repitch the closest sample
      //sampler.triggerAttack("D3")
      //console.log('loaded')
      playing = true
    }).toMaster()
    function setupWebcam() {
      return new Promise((resolve, reject) => {
        const navigatorAny = navigator
        navigator.getUserMedia = navigator.getUserMedia ||
                navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
                navigatorAny.msGetUserMedia
        if (navigator.getUserMedia) {
          navigator.getUserMedia({ video: true },
            stream => {
              webcamElement.srcObject = stream
              webcamElement.addEventListener('loadeddata', () => resolve(), false)
            },
            error => reject())
        } else {
          reject()
        }
      })
    }



    async function loadAndPredict() {
      const net = await bodyPix.load(/** optional arguments, see below **/)

          async function draw(){
            window.requestAnimFrame = (function(){
          return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function( callback ){
                  window.setTimeout(callback, 1000 / 60);
              };
      })();
            const camera = document.getElementById('webcam');
        const canvasPerson = document.getElementById("canvas");
        const multiplier = 0.75;
        const outputStride = 16;
        const segmentationThreshold = 0.5;
        let contextPerson = canvasPerson.getContext('2d');
        let currentStream
        let deviceIds = []
        let selectedDevice
        let cameraFrame
        let currentBGIndex = 0

        function detectBody(){
          net.segmentPerson(camera, outputStride, segmentationThreshold)
            .catch(error => {
              //alert("Fail to segment person");
            })
            .then(personSegmentation => {
              drawBody(personSegmentation);

            })
          cameraFrame = window.requestAnimFrame(detectBody);
        }

        function drawBody(personSegmentation)
        {
          contextPerson.drawImage(camera, 0, 0, camera.width, camera.height);
          var imageData = contextPerson.getImageData(0,0, camera.width, camera.height);
          var pixel = imageData.data;
          for (var p = 0; p<pixel.length; p+=4)
          {
            if (personSegmentation && personSegmentation.data[p/4] == 0) {
              pixel[p+3] = 0;
            }
          }
          contextPerson.imageSmoothingEnabled = true;
          contextPerson.putImageData(imageData,0,0);
        }
        detectBody()
      }
      draw()




    }
    loadAndPredict()
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
      faceapi.nets.faceExpressionNet.loadFromUri('./models')
    ]).then( x=> {
      setupWebcam()
      ready = true
      // instructions.innerText=
      //   'The balls are controlled by surpised or happy faces.'
    })

    let sad, surprised, happy

    webcamElement.addEventListener('play', () => {
      const canvas = document.getElementById('canvas')
      const displaySize = { width: webcamElement.width, height: webcamElement.height }
      faceapi.matchDimensions(canvas, displaySize)
      setInterval(async () => {
        if(ready){
          const detections = await faceapi.detectAllFaces(webcamElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
          const resizedDetections = faceapi.resizeResults(detections, displaySize)
          if(resizedDetections[0] !== undefined){
            happy = resizedDetections[0].expressions.happy
            surprised = resizedDetections[0].expressions.surprised
          }
        }
        //console.log(faceapi)
      }, 100)
    })
    const scene = new THREE.Scene()

    const light = new THREE.DirectionalLight( 0xffffff )
    light.position.set( 40, 25, 10 )
    light.castShadow = true
    scene.add(light)

    //console.log(scene.scene)

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize( window.innerWidth, window.innerHeight )
    document.body.appendChild( renderer.domElement )
    //var controls = new OrbitControls( camera, renderer.domElement );


    const camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 3000 )
    camera.position.z = 20

    let texture = new THREE.CanvasTexture(canvas);
                 console.log(texture)

              var geometry = new THREE.PlaneGeometry( 8, 4, 24, 12 );
              var material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, map: texture} );
          let plane = new THREE.Mesh( geometry, material );

          scene.add(plane)
          let world, timeStep=1/60, ballBody, ballShape, ballMaterial, wallContactMaterial


          const ballMeshes = []
          const balls = []
let groundBody, groundShape ,wallMaterial

world = new CANNON.World()
world.gravity.set(0,-20,0)
world.broadphase = new CANNON.NaiveBroadphase()
world.solver.iterations = 10

wallMaterial = new CANNON.Material('wallMaterial')

ballMaterial = new CANNON.Material('ballMaterial')
wallContactMaterial = new CANNON.ContactMaterial(ballMaterial, wallMaterial)
wallContactMaterial.friction = 0
wallContactMaterial.restitution = 2
          groundShape = new CANNON.Box(new CANNON.Vec3(300,300,2))
      groundBody = new CANNON.Body({ mass: 0, material: wallMaterial })
      groundBody.addShape(groundShape)
      groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2)
      groundBody.position.set(0,0,0)
      groundBody.position.y = -20
      world.addBody(groundBody)
          function ballCreate(x,y){
  const materialBall = new THREE.MeshPhongMaterial( { color: `rgba(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},1)`, specular: `rgba(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},1)` , shininess: 100, side: THREE.DoubleSide, opacity: 0.8,
    transparent: true } )

  const ballGeometry = new THREE.SphereGeometry(1, 32, 32)
  const ballMesh = new THREE.Mesh( ballGeometry, materialBall )
  ballMesh.name = 'ball'
  scene.add(ballMesh)
  ballMeshes.push(ballMesh)




  ballShape = new CANNON.Sphere(1)
  ballBody = new CANNON.Body({ mass: 1, material: ballMaterial })
  ballBody.addShape(ballShape)
  ballBody.linearDamping = 0
  world.addBody(ballBody)
  balls.push(ballBody)
  ballBody.position.set(x,y,(Math.random()*-30)-30)
  ballBody.angularVelocity.y = 3
  ballBody.addEventListener('collide',function(e){


    if(playing){

      sampler.triggerAttackRelease(drums[Math.floor(Math.random()*5)], 1)



    }
  })
}
ballCreate(Math.floor(Math.random()*25), Math.floor(Math.random()*25))
const cannonDebugRenderer = new THREE.CannonDebugRenderer( scene, world )
    function animate() {

                requestAnimationFrame( animate )
                // controls.update();

                render()
                if(texture){
                texture.needsUpdate = true;
              }

              if(happy>0.9){

                plane.position.x++

  }

  if(surprised>0.9){

      plane.position.x--

  }
  scoreDisplay.innerHTML = ' '+ score
      livesDisplay.innerHTML = ' '+ lives
      if(cannonDebugRenderer){
        cannonDebugRenderer.update()
      }
            }

            function render() {


              //console.log(camera)






  //               if(cannonDebugRenderer){
  //   cannonDebugRenderer.update()
  // }
  updatePhysics()
                renderer.render( scene, camera );

            }


            animate()
            function updatePhysics() {
      // Step the physics world
      world.step(timeStep)

      for(var j=0; j<balls.length; j++){
        ballMeshes[j].position.copy(balls[j].position)
        ballMeshes[j].quaternion.copy(balls[j].quaternion)
      }
    }
  }

  componentDidUpdate(){



  }




  render() {

    //console.log(this.state)

    return (
      <div>
        <div className="info">
     Score  :<span id="score" className="banner"></span>
     Lives  :<span id="lives" className="banner"></span>

        </div>
        <video autoPlay playsInline muted id="webcam" width="500px" height="500px" poster='' ></video>
        <canvas id="canvas" width="500" height="500"></canvas>

      </div>


    )
  }
}
export default Main
