import React from 'react';
import './App.css';
import {FaceDetector} from './facial-recognition/index';

class App extends React.Component {
  private face_detector : FaceDetector | undefined;
  componentDidMount() {
    const canvas : HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    const context : CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.face_detector = new FaceDetector(context, {
      palette: {
        FACE: '#5CB4F3',
        IRIS: '#E8760C'
      }
    });
    this.face_detector.detect();
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div id="canvas-container">
            <canvas id="canvas" width="480" height="852" />
          </div>
        </header>
      </div>
    );
  }
}

export default App;
