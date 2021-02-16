import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { MediaPipeFaceMesh } from '@tensorflow-models/face-landmarks-detection/dist/types';
import * as tf from '@tensorflow/tfjs-core';
// If you are using the WebGL backend:
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import {TRIANGULATION} from './common/triangulation';

export interface ICallbacks {
    found?: Function;
    error?: Function;
}
enum Eevents {
    found,
    error
}
export type events = keyof typeof Eevents;

export interface IPalette {
    FACE : string;
    IRIS : string;
}
export interface IConfig {
    NUM_KEYPOINTS      : number;
    NUM_IRIS_KEYPOINTS : number;
    palette            : IPalette;
}
export interface Config {
    NUM_KEYPOINTS?      : number;
    NUM_IRIS_KEYPOINTS? : number;
    palette?            : IPalette;
}

export class FaceDetector {
    private _output_render_context : CanvasRenderingContext2D;
    private _video : HTMLVideoElement;
    private _stream : MediaStream = new MediaStream();
    private _is_scanning : boolean = false;
    private _anim_id : number = 0;
    protected _callbacks : ICallbacks = {};
    private model : MediaPipeFaceMesh | undefined;
    private config : IConfig = {
        NUM_KEYPOINTS: 468,
        NUM_IRIS_KEYPOINTS: 5,
        palette: {
            FACE: '#32EEDB',
            IRIS: '#FF2C35'
        }
    };
    constructor(context : CanvasRenderingContext2D, config? : Config) {
        this._output_render_context = context;
        this._video = document.createElement('video') as HTMLVideoElement;
        if (config) {
            this.config = {
                ...this.config,
                ...config
            }
        }
        //clear canvas to black
        this._output_render_context.fillStyle = "black";
        this._output_render_context.fillRect(0, 0, this._output_render_context.canvas.width, this._output_render_context.canvas.height);
    }

    private distance(a : number[], b : number[]) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
      }
      
    private drawPath(topLeft : {x: number, y: number}, coverRatio : number, points : number[][], closePath : boolean) {
        const region : Path2D = new Path2D();
        region.moveTo((points[0][0] * coverRatio) + topLeft.x, (points[0][1] - topLeft.y) * coverRatio);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            region.lineTo((point[0] * coverRatio) + topLeft.x, (point[1]- topLeft.y) * coverRatio);
        }
        
        if (closePath) {
            region.closePath();
        }
        this._output_render_context.stroke(region);
    }

    private async _render() {
        //scale to cover
        var originalRatios = {
            width: this._output_render_context.canvas.width / this._video.videoWidth,
            height: this._output_render_context.canvas.height / this._video.videoHeight
        };
        
        // formula for cover:
        var coverRatio = Math.max(originalRatios.width, originalRatios.height); 
        
        // result:
        var newImageWidth = this._video.videoWidth * coverRatio;
        var newImageHeight = this._video.videoHeight * coverRatio;

        // // get the top left position of the image
        var x = (this._output_render_context.canvas.width / 2) - (this._video.videoWidth / 2) * coverRatio;
        var y = (this._output_render_context.canvas.height / 2) - (this._video.videoHeight / 2) * coverRatio;


        // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain an
        // array of detected faces from the MediaPipe graph. If passing in a video
        // stream, a single prediction per frame will be returned.
        const predictions = await this.model?.estimateFaces({
            input: this._video,
            returnTensors: false,
            flipHorizontal: false,
            predictIrises: true
        });

        //draw to canvas
        this._output_render_context.drawImage(this._video, x, y, newImageWidth, newImageHeight);

        //render face triangle mesh
        if (predictions && predictions.length > 0) {
            predictions.forEach(prediction => {
                const keypoints : number[][] = prediction.scaledMesh as unknown as number[][];
        
                this._output_render_context.strokeStyle = this.config.palette.FACE;
                this._output_render_context.lineWidth = 0.5;
                
                //face
                for (let i = 0; i < TRIANGULATION.length / 3; i++) {
                    const points = [
                    TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1],
                    TRIANGULATION[i * 3 + 2]
                    ].map(index => keypoints[index]);
        
                    this.drawPath({x: x, y: y}, coverRatio, points, true);
                }

                //iris
                if(keypoints.length > this.config.NUM_KEYPOINTS) {
                    this._output_render_context.strokeStyle = this.config.palette.IRIS;
                    this._output_render_context.lineWidth = 1;
            
                    const leftCenter = keypoints[this.config.NUM_KEYPOINTS];
                    const leftDiameterY = this.distance(
                      keypoints[this.config.NUM_KEYPOINTS + 4],
                      keypoints[this.config.NUM_KEYPOINTS + 2]);
                    const leftDiameterX = this.distance(
                      keypoints[this.config.NUM_KEYPOINTS + 3],
                      keypoints[this.config.NUM_KEYPOINTS + 1]);
            
                    this._output_render_context.beginPath();
                    this._output_render_context.ellipse((leftCenter[0] * coverRatio) + x, (leftCenter[1] - y) * coverRatio, leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI);
                    this._output_render_context.stroke();
            
                    if(keypoints.length > this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS) {
                      const rightCenter = keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS];
                      const rightDiameterY = this.distance(
                        keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 2],
                        keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 4]);
                      const rightDiameterX = this.distance(
                        keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 3],
                        keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 1]);
            
                      this._output_render_context.beginPath();
                      this._output_render_context.ellipse((rightCenter[0] * coverRatio) + x, (rightCenter[1] - y) * coverRatio, rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI);
                      this._output_render_context.stroke();
                    }
                }
            });
        }

        
        

        if (this._is_scanning) {
            this._anim_id = window.requestAnimationFrame(this._render.bind(this));
        } else {
            window.cancelAnimationFrame(this._anim_id);
        }
        
    }

    public print(text : string, x : number, y : number, lineHeight : number) {
        const maxWidth : number = this._output_render_context.canvas.getBoundingClientRect().width;
        let words : string[] = text.split(' ');
        let line : string = '';

        //write error message to canvas
        this._output_render_context.font = "20px Arial";
        this._output_render_context.fillStyle = "white";
        this._output_render_context.textAlign = "center";

        for(let n = 0; n < words.length; n++) {
          let testLine : string = line + words[n] + ' ';
          let metrics : TextMetrics = this._output_render_context.measureText(testLine);
          let testWidth : number = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            this._output_render_context.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        this._output_render_context.fillText(line, x, y);
    }

    public detect() : Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    if (!this._is_scanning) {
                        this._stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                width: {
                                    ideal: this._output_render_context.canvas.width
                                }, 
                                height: {
                                    ideal: this._output_render_context.canvas.height
                                },
                                facingMode: 'user',
                                frameRate: {
                                    ideal: 24
                                }
                            }
                        });
                      
                        this._video.srcObject = this._stream;
                        this._video?.play();
                        
                        this._is_scanning = true;

                        this._render();

                        await tf.setBackend("webgl");
                        // Load the MediaPipe Facemesh package.
                        this.model = await faceLandmarksDetection.load(
                            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
                            {
                                shouldLoadIrisModel: true,
                                detectionConfidence: 1,
                                maxFaces: 1,
                                iouThreshold: 0,
                                // scoreThreshold: 1,
                            }
                        );

                        

                        resolve();
    
                    } else {
                        const error : Error = new Error("Stream already initialised.");
                        if (this._callbacks.error) {
                            this._callbacks.error(error);
                        }

                        reject(error);
                    }
                } catch(e) {
                    if (this._callbacks.error) {
                        this._callbacks.error(e);
                    }

                    
                    this.print("Error. Permission denied. Please update browser permissions to access camera.", this._output_render_context.canvas.width / 2, this._output_render_context.canvas.height / 2, 25);

                    reject(e);
                }
            
            } else {
                const error : Error = new Error("Browser does not support getUserMedia.");
                if (this._callbacks.error) {
                    this._callbacks.error(error);
                }

                //write error message to canvas
                this.print("Error. Your browser does not support camera access. Use a modern browser or update your browser.", this._output_render_context.canvas.width / 2, this._output_render_context.canvas.height / 2, 25);

                reject(error);
            }
        })
    }

    public stop() : Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this._stream) {
                //stop scanning
                this._is_scanning = false;
                //stop camera
                this._video.pause();
                this._video.src = "";
                this._stream.getTracks().forEach(function(track) {
                    track.stop();
                });
    
                //clear canvas to black
                this._output_render_context.fillStyle = "black";
                this._output_render_context.fillRect(0, 0, this._output_render_context.canvas.width, this._output_render_context.canvas.height);
                resolve(true);
            } else {
                reject(new Error("Stream was not initialised."));
            }
        })
    }
}

export {};