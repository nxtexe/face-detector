import React from 'react';
import './App.css';
import {FaceDetector, IResult} from 'tensorflow-face-detector';

class App extends React.Component {
  private face_detector : FaceDetector | undefined;
  componentDidMount() {
    const canvas : HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    const context : CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.face_detector = new FaceDetector(context, {
      palette: {
        FACE: '#5CB4F3',
        IRIS: '#E8760C'
      },
      FACE_IN_VIEW_THRESHOLD: 0.9,
      RENDER_FX: true
    });

    this.face_detector.on('ready', () => {
      const loading : HTMLDivElement = document.getElementById('loading') as HTMLDivElement;
      loading.style.display = "none";
    });
    const fps : HTMLParagraphElement = document.getElementById('fps') as HTMLParagraphElement;
    const mspf : HTMLParagraphElement = document.getElementById('mspf') as HTMLParagraphElement;

    this.face_detector.detect();
    this.face_detector.on('found', async (result : IResult) => {
      fps.textContent = `FPS: ${result.profile_info.fps}`;
      mspf.textContent = `MSPF: ${result.profile_info.mspf}`;
      
      //this.face_detector?.stop();
    });
    this.face_detector.on('error', () => {
      this.face_detector?.stop();
    });
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div id="loading">
            <p>Loading...</p>
          </div>
          <div id="profile-info">
            <h5>Stats</h5>
            <p id="fps"></p>
            <p id="mspf"></p>
          </div>
          <div id="canvas-container">
            <canvas id="canvas" width="360" height="480" />
          </div>
          <div>
            <img id="image" />
          </div>
        </header>
      </div>
    );
  }
}

export default App;
