import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { MediaPipeFaceMesh } from '@tensorflow-models/face-landmarks-detection/dist/types';
import * as tf from '@tensorflow/tfjs-core';
// If you are using the WebGL backend:
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';

import {TRIANGULATION} from './common/triangulation';
import { Coord2D } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh/util';
import {mobileCheck} from './common/utils';

tfjsWasm.setWasmPaths(
    `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`);

export interface ICallbacks {
    found?: Function;
    error?: Function;
    ready?: Function;
}
enum Eevents {
    found,
    error,
    ready
}
export type events = keyof typeof Eevents;
export interface IPalette {
    FACE : string;
    IRIS : string;
}
export interface IConfig {
    NUM_KEYPOINTS          : number;
    NUM_IRIS_KEYPOINTS     : number;
    palette                : IPalette;
    FACE_IN_VIEW_THRESHOLD : number;
    RENDER_FX              : boolean;
    TENSORFLOW_BACKEND     : string;
}
export interface Config {
    NUM_KEYPOINTS?          : number;
    NUM_IRIS_KEYPOINTS?     : number;
    palette?                : IPalette;
    FACE_IN_VIEW_THRESHOLD? : number;
    RENDER_FX?              : boolean;
    TENSORFLOW_BACKEND?     : string;
}
export interface IMetaData {
    cover_ratio  : number;
    top_left     : {x: number, y: number};
    image_height : number;
    image_width  : number;
}
export type Vec2 = {
    x: number;
    y: number;
}
export interface IPosition {
    bottomLeft  : Vec2;
    bottomRight : Vec2;
    topLeft     : Vec2;
    topRight    : Vec2;
}
export interface IResult {
    error?       : string;
    position     : IPosition;
    profile_info : {mspf: string, fps: string};
}
export class Result implements IResult {
    public error        : string;
    public position     : IPosition;
    public profile_info : {mspf: string, fps: string};
    constructor(
        result?      : {error?: string,
        position?    : IPosition,
        profile_info?: {mspf: string, fps: string}}
    ) {
        if (result) {
            this.profile_info = result.profile_info ? result.profile_info : {mspf: '0', fps: '0'};
            this.error = result.error               ? result.error        : '';
            this.position = result.position         ? result.position     :
            {
                bottomRight: {x: 0, y: 0},
                bottomLeft:  {x: 0, y: 0},
                topRight:    {x: 0, y: 0},
                topLeft:     {x: 0, y: 0},
            };
        } else {
            this.profile_info = {mspf: '0', fps: '0'};
            this.error       = '';
            this.position    =
            {
                bottomRight: {x: 0, y: 0},
                bottomLeft:  {x: 0, y: 0},
                topRight:    {x: 0, y: 0},
                topLeft:     {x: 0, y: 0},
            };
        }
    }
}

export class FaceDetector {
    private _output_render_context : CanvasRenderingContext2D;
    private _video                 : HTMLVideoElement;
    private _stream                : MediaStream = new MediaStream();
    private _is_scanning           : boolean = false;
    private _anim_id               : number = 0;
    protected _callbacks           : ICallbacks = {};
    private model                  : MediaPipeFaceMesh | undefined;
    private _interval_id           : number = 0;
    private keypoints              : number[][];
    private _image_metadata        : IMetaData;
    private render_fx              : boolean = false;
    private config                 : IConfig = {
        NUM_KEYPOINTS: 468,
        NUM_IRIS_KEYPOINTS: 5,
        palette: {
            FACE: '#32EEDB',
            IRIS: '#FF2C35'
        },
        FACE_IN_VIEW_THRESHOLD: 0.8,
        RENDER_FX: true,
        TENSORFLOW_BACKEND: !tf.ENV.getBool('WEBGL_RENDER_FLOAT32_CAPABLE') ? "wasm" : "webgl"
    };
    constructor(context : CanvasRenderingContext2D, config? : Config) {
        this._output_render_context = context;
        this._video = document.createElement('video') as HTMLVideoElement;
        if (config) {
            this.set_config(config);
        }

        this.keypoints = [[0]];

        this._image_metadata = {
            cover_ratio:  0,
            image_height: 0,
            image_width:  0,
            top_left: {
                x: 0,
                y: 0
            }
        }
        //clear canvas to black
        this._output_render_context.fillStyle = "black";
        this._output_render_context.fillRect(
            0,
            0,
            this._output_render_context.canvas.width,
            this._output_render_context.canvas.height
        );
    }

    private distance(a : number[], b : number[]) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    }
      
    private drawPath(points : number[][], closePath : boolean) {
        const region : Path2D = new Path2D();
        region.moveTo(
            (points[0][0] * this._image_metadata.cover_ratio) + this._image_metadata.top_left.x,
            (points[0][1] - this._image_metadata.top_left.y) * this._image_metadata.cover_ratio
        );
        for (let i = 1; i < points.length; i++) {
            const point : number[] = points[i];
            region.lineTo(
                (point[0] * this._image_metadata.cover_ratio) + this._image_metadata.top_left.x,
                (point[1] - this._image_metadata.top_left.y) * this._image_metadata.cover_ratio
            );
        }
        
        if (closePath) {
            region.closePath();
        }
        this._output_render_context.stroke(region);
    }

    private async _read() {
        this._output_render_context.setTransform(-1,0,0,1,this._output_render_context.canvas.width,0);
        // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain an
        // array of detected faces from the MediaPipe graph. If passing in a video
        // stream, a single prediction per frame will be returned.
        const start : number = Date.now();
        const predictions = await this.model?.estimateFaces({
            input: this._video,
            returnTensors: false,
            flipHorizontal: false,
            predictIrises: true
        });
        const end : number = Date.now();

        //render face triangle mesh
        if (predictions && predictions.length > 0) {
            if (
                predictions[0].faceInViewConfidence > this.config.FACE_IN_VIEW_THRESHOLD
                && this._callbacks.found
            ) {
                //face found render effects
                this.render_fx = true;
                
                const topLeft : Vec2 = {
                    x: (predictions[0].boundingBox.topLeft as Coord2D)[0],
                    y: (predictions[0].boundingBox.topLeft as Coord2D)[1]
                };

                const bottomRight : Vec2 = {
                    x: (predictions[0].boundingBox.bottomRight as Coord2D)[0],
                    y: (predictions[0].boundingBox.bottomRight as Coord2D)[1]
                };

                const result : IResult = {
                    position: {
                        topLeft:     topLeft,
                        bottomRight: bottomRight,
                        topRight: {
                            x: bottomRight.x,
                            y: topLeft.y
                        },
                        bottomLeft: {
                            x: topLeft.x,
                            y: bottomRight.y
                        }
                    },
                    profile_info: {
                        mspf: (end-start).toFixed(2),
                        fps: (1/((end-start)/1000)).toFixed(2)
                    }
                }
                this._callbacks.found(result);
            } else {
                this.render_fx = false;
            }
            this.keypoints = predictions[0].scaledMesh as unknown as number[][];
        }

        if (this._is_scanning) {
            this._interval_id = window.setTimeout(this._read.bind(this), 41);
        } else {
            clearTimeout(this._interval_id);
        }
    }

    private async _render() {
        this._output_render_context.setTransform(-1,0,0,1,this._output_render_context.canvas.width,0);
        //scale to cover
        let original_ratios = {
            width: this._output_render_context.canvas.width / this._video.videoWidth,
            height: this._output_render_context.canvas.height / this._video.videoHeight
        };
        
        // formula for cover:
        let cover_ratio = Math.max(original_ratios.width, original_ratios.height); 
        
        // result:
        let new_image_width  = this._video.videoWidth  * cover_ratio;
        let new_image_height = this._video.videoHeight * cover_ratio;

        // get the top left position of the image
        let x = (this._output_render_context.canvas.width  / 2) - (this._video.videoWidth  / 2) * cover_ratio;
        let y = (this._output_render_context.canvas.height / 2) - (this._video.videoHeight / 2) * cover_ratio;

        this._image_metadata = {
            cover_ratio:  cover_ratio,
            image_height: new_image_height,
            image_width:  new_image_width,
            top_left: {
                x: x,
                y: y
            },
        };

        //draw to canvas
        this._output_render_context.drawImage(
            this._video,
            x,
            y,
            new_image_width,
            new_image_height
        );
        
        this._output_render_context.strokeStyle = this.config.palette.FACE;
        this._output_render_context.lineWidth   = 0.5;
        
        //render effects (triangle mesh and iris mesh)
        //render_fx if face found
        //this.config.RENDER_FX if user wants effects rendered
        if (this.keypoints.length > 1 && this.render_fx && this.config.RENDER_FX) {
            //face
            for (let i = 0; i < TRIANGULATION.length / 3; i++) {
                const points = [
                    TRIANGULATION[i * 3 + 0],
                    TRIANGULATION[i * 3 + 1],
                    TRIANGULATION[i * 3 + 2]
                ].map(index => this.keypoints[index]);
                this.drawPath(points, true);
            }

            //iris
            if(this.keypoints.length > this.config.NUM_KEYPOINTS) {
                this._output_render_context.strokeStyle = this.config.palette.IRIS;
                this._output_render_context.lineWidth   = 1;
        
                const leftCenter    = this.keypoints[this.config.NUM_KEYPOINTS];
                const leftDiameterY = this.distance(
                    this.keypoints[this.config.NUM_KEYPOINTS + 4],
                    this.keypoints[this.config.NUM_KEYPOINTS + 2]
                );
                const leftDiameterX = this.distance(
                    this.keypoints[this.config.NUM_KEYPOINTS + 3],
                    this.keypoints[this.config.NUM_KEYPOINTS + 1]
                );
        
                this._output_render_context.beginPath();
                this._output_render_context.ellipse(
                    (leftCenter[0] * this._image_metadata.cover_ratio) + this._image_metadata.top_left.x,
                    (leftCenter[1] - this._image_metadata.top_left.y)  * this._image_metadata.cover_ratio,
                    leftDiameterX / 2,
                    leftDiameterY / 2,
                    0, 0, 2 * Math.PI
                );
                this._output_render_context.stroke();
        
                if(this.keypoints.length > this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS) {
                    const rightCenter = this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS];
                    const rightDiameterY = this.distance(
                        this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 2],
                        this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 4]
                    );
                    const rightDiameterX = this.distance(
                        this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 3],
                        this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 1]
                    );
        
                    this._output_render_context.beginPath();
                    this._output_render_context.ellipse(
                        (rightCenter[0] * this._image_metadata.cover_ratio) + this._image_metadata.top_left.x,
                        (rightCenter[1] - this._image_metadata.top_left.y)  * this._image_metadata.cover_ratio,
                        rightDiameterX / 2,
                        rightDiameterY / 2,
                        0, 0, 2 * Math.PI
                    );
                    this._output_render_context.stroke();
                }
            }
        }


        if (this._is_scanning) {
            this._anim_id = window.requestAnimationFrame(this._render.bind(this));
        } else {
            window.cancelAnimationFrame(this._anim_id);
        }
        
    }

    public print(text : string, x : number, y : number, lineHeight : number) {
        const maxWidth : number = this._output_render_context.canvas.getBoundingClientRect().width;
        let words      : string[] = text.split(' ');
        let line       : string = '';

        //write error message to canvas
        this._output_render_context.font      = "20px Arial";
        this._output_render_context.fillStyle = "white";
        this._output_render_context.textAlign = "center";

        for(let n = 0; n < words.length; n++) {
          let testLine  : string      = line + words[n] + ' ';
          let metrics   : TextMetrics = this._output_render_context.measureText(testLine);
          let testWidth : number      = metrics.width;

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
                                },
                                aspectRatio: {
                                    ideal: 3/4
                                }
                            }
                        });
                      
                        this._video.srcObject = this._stream;
                        this._video?.play();
                        
                        this._is_scanning = true;

                        this._render();

                        
                        //set tensorflow compute backend
                        await tf.setBackend(this.config.TENSORFLOW_BACKEND);
                        tf.enableProdMode();
                        // Load the MediaPipe Facemesh package.
                        this.model = await faceLandmarksDetection.load(
                            faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
                            {
                                shouldLoadIrisModel: true,
                                detectionConfidence: 1,
                                maxFaces: 1,
                                iouThreshold: 0,
                                // scoreThreshold: 1,//let user discriminate
                            }
                        );
                            
                        this._read();
                        
                        if (this._callbacks.ready) {
                            this._callbacks.ready();
                        }
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

                    
                    this.print(
                        "Error. Permission denied. Please update browser permissions to access camera.",
                        this._output_render_context.canvas.width  / 2,
                        this._output_render_context.canvas.height / 2,
                        25
                    );

                    reject(e);
                }
            
            } else {
                const error : Error = new Error("Browser does not support getUserMedia.");
                if (this._callbacks.error) {
                    this._callbacks.error(error);
                }

                //write error message to canvas
                this.print(
                    "Error. Your browser does not support camera access. Use a modern browser or update your browser.",
                    this._output_render_context.canvas.width  / 2,
                    this._output_render_context.canvas.height / 2,
                    25
                );

                reject(error);
            }
        });
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
                this._output_render_context.fillRect(
                    0,
                    0,
                    this._output_render_context.canvas.width,
                    this._output_render_context.canvas.height
                );
                resolve(true);
            } else {
                reject(new Error("Stream was not initialised."));
            }
        });
    }

    public on(event : events, callback : Function) : void {
        switch(event) {
            case "found":
                this._callbacks.found = callback;
                break;
            
            case "error":
                this._callbacks.error = callback;
                break;
            
            case "ready":
                this._callbacks.ready = callback;
                break;
        }
    }

    public get_clean_plate() : HTMLCanvasElement {
        const clean_plate         : HTMLCanvasElement        = document.createElement('canvas') as HTMLCanvasElement;
        const clean_plate_context : CanvasRenderingContext2D = clean_plate.getContext('2d')     as CanvasRenderingContext2D;

        clean_plate.height = this._image_metadata.image_height;
        clean_plate.width = this._image_metadata.image_width;
        //draw to canvas
        clean_plate_context.drawImage(
            this._video,
            this._image_metadata.top_left.x,
            this._image_metadata.top_left.y,
            this._image_metadata.image_width,
            this._image_metadata.image_height
        );

        return clean_plate;
    }

    public set_config(config : Config) {
        //update config_vars
        this.config = {
            ...this.config,
            ...config
        };
    }

    public async getHQSanpshot() : Promise<Blob> {
        try {
            const video_track : MediaStreamTrack = this._stream.getVideoTracks()[0]
            const image_capture = new ImageCapture(video_track);
            const image : Blob = await image_capture.takePhoto();
            return image;
        } catch(e) {
            //image capture unavailable?
            const clean_plate : HTMLCanvasElement = this.get_clean_plate();
            
            return new Promise((resolve, reject) => {
                clean_plate.toBlob(function (blob : Blob | null) {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Could not construct blob.'));
                    }
                }, 'image/png', 1);
            })
        }
    }
}