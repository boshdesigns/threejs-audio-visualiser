import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 2);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();

    this.setLights();
    this.setGeometry();
    this.render();
    this.setResize();
    this.setAudioListener();
  }

  playAudio() {
    if (!this.sound.isPlaying) {
      this.sound.play();
      document.getElementById('pause-icon').classList.remove('greyed');
      document.getElementById('play-icon').classList.add('greyed');
    }
  }

  pauseAudio() {
    if (this.sound.isPlaying) {
      this.sound.pause();
      document.getElementById('play-icon').classList.remove('greyed');
      document.getElementById('pause-icon').classList.add('greyed');
    }
  }

  setAudioListener() {
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);

    this.sound = new THREE.Audio(this.audioListener);
    this.audioLoader = new THREE.AudioLoader();

    // Load default audio
    this.loadAudio('./assets/audio/chill_bebop.mp3');

    // Add event listeners for play and pause buttons
    document.getElementById('play-icon').addEventListener('click', () => {
      this.playAudio();
    });

    document.getElementById('pause-icon').addEventListener('click', () => {
      this.pauseAudio();
    });

    // Handle file upload
    document
      .getElementById('file-upload')
      .addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'audio/mp3' || file.type === 'audio/mpeg')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            this.audioListener.context.decodeAudioData(
              arrayBuffer,
              (buffer) => {
                this.sound.stop();

                this.sound.setBuffer(buffer);
                this.sound.setLoop(true);
                this.sound.setVolume(1);

                this.playAudio();

                document.getElementById('now-playing').innerHTML =
                  file?.name.replace('.mp3', '') || 'Unknown';
              },
              (error) => {
                console.error(
                  'An error happened decoding the audio data.',
                  error
                );
              }
            );
          };
          reader.readAsArrayBuffer(file);
        }
      });

    this.audioAnalyser = new THREE.AudioAnalyser(this.sound, 32);
  }

  loadAudio(filePath) {
    this.audioLoader.load(
      filePath,
      (buffer) => {
        this.sound.setBuffer(buffer);
        this.sound.setLoop(true);
        this.sound.setVolume(1);
      },
      undefined,
      (error) => {
        console.error('An error happened loading the audio.', error);
      }
    );
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setGeometry() {
    // this.planeGeometry = new THREE.PlaneGeometry(1, 1, 128, 128);
    // this.planeMaterial = new THREE.ShaderMaterial({
    //   side: THREE.DoubleSide,
    //   wireframe: true,
    //   fragmentShader: fragment,
    //   vertexShader: vertex,
    //   uniforms: {
    //     progress: { type: 'f', value: 0 }
    //   }
    // });

    // this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    // this.scene.add(this.planeMesh);

    this.icoGeometry = new THREE.IcosahedronGeometry(0.7, 30);
    this.icoMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      wireframe: true,
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: {
        u_progress: { type: 'f', value: 0 },
        u_resolution: {
          type: 'v2',
          value: new THREE.Vector2(device.width, device.height)
        },
        u_time: { type: 'f', value: 0 },
        u_frequency: { type: 'f', value: 0 }
      }
    });

    this.icoMesh = new THREE.Mesh(this.icoGeometry, this.icoMaterial);
    this.scene.add(this.icoMesh);
  }

  getFrequency() {
    // console.log(this?.audioAnalyser?.getAverageFrequency() || 1);

    return this?.audioAnalyser?.getAverageFrequency() || 10;
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    // this.planeMesh.rotation.x = 0.2 * elapsedTime;
    // this.planeMesh.rotation.y = 0.1 * elapsedTime;

    this.icoMesh.rotation.x = 0.02 * elapsedTime;
    this.icoMesh.rotation.y = 0.03 * elapsedTime;

    this.icoMaterial.uniforms.u_frequency.value = this.getFrequency();

    this.icoMaterial.uniforms.u_time.value = elapsedTime;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}

