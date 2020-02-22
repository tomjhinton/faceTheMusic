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



    const webcamElement = document.getElementById('webcam')
    const canvas = document.getElementById('canvas')
    const instructions = document.getElementById('instructions')
    let playing = false
    let ready = false
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

              var geometry = new THREE.PlaneGeometry( 4, 2, 24, 12 );
              var material = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide, map: texture} );
          let    plane = new THREE.Mesh( geometry, material );

          scene.add(plane)

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


            }

            function render() {


              //console.log(camera)






  //               if(cannonDebugRenderer){
  //   cannonDebugRenderer.update()
  // }
                renderer.render( scene, camera );

            }


            animate()
  }

  componentDidUpdate(){



  }




  render() {

    //console.log(this.state)

    return (
      <div>
        <video autoPlay playsInline muted id="webcam" width="500px" height="500px" poster='' ></video>
        <canvas id="canvas" width="500" height="500"></canvas>

      </div>


    )
  }
}
export default Main
