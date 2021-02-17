import React from 'react';
import './App.css';
import {FaceDetector, IResult} from './face-detector/index';

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
    const fps : HTMLParagraphElement = document.getElementById('fps') as HTMLParagraphElement;
    const mspf : HTMLParagraphElement = document.getElementById('mspf') as HTMLParagraphElement;

    this.face_detector.detect();
    this.face_detector.on('found', (result : IResult) => {
      fps.textContent = `FPS: ${result.profile_info.fps}`;
      mspf.textContent = `MSPF: ${result.profile_info.mspf}`;
      const width : number = result.position.bottomRight.x - result.position.bottomLeft.x;
      const height : number = result.position.bottomLeft.y - result.position.topLeft.y;

      const output_canvas : HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
      const input_canvas : HTMLCanvasElement = this.face_detector?.get_clean_plate() as HTMLCanvasElement;
      const input_context : CanvasRenderingContext2D = input_canvas.getContext('2d') as CanvasRenderingContext2D;
      const output_context : CanvasRenderingContext2D = output_canvas.getContext('2d') as CanvasRenderingContext2D;

      output_canvas.height = height;
      output_canvas.width = width;

      const image_data : ImageData = input_context.getImageData(result.position.topLeft.x, result.position.topLeft.y, width, height);
      output_context.putImageData(image_data, 0, 0);

      const img : HTMLImageElement = document.getElementById('image') as HTMLImageElement;
      img.setAttribute('src', output_canvas.toDataURL());
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
          <div id="profile-info">
            <h5>Stats</h5>
            <p id="fps"></p>
            <p id="mspf"></p>
          </div>
          <div id="canvas-container">
            <canvas id="canvas" width="540" height="720" />
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
