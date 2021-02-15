import {loadOpenCV} from './loader.js';
export declare type Dimension = {
    x: number;
    y: number;
};
export declare type Rect = {
    topLeft: Dimension;
    bottomRight: Dimension;
}
export interface IPosition {
    eyes?: Rect[];
    face?: Rect;
}
export interface IResult {
    error: string;
    position: IPosition;
    profile_info: string;
}
export declare class Result implements IResult {
    error: string;
    position: IPosition;
    profile_info: string;
    constructor(result?: {
        error?: string;
        position?: IPosition;
        profile_info?: string;
    });
}

export interface ICallbacks {
    ready?: Function;
    error?: Function;
    found?: Function;
}

enum Eevents {
    ready,
    error,
    found
}
export type events = keyof typeof Eevents;

export abstract class OpenCV {
    protected cv : any;
    protected _is_ready : boolean;
    protected _callbacks : ICallbacks = {};
    protected face_cascade : any;
    protected eye_cascade : any;
    constructor() {
        // Set paths configuration
        let pathsConfig = {
            wasm: "./opencv.js",
        }
        // Load OpenCV.js and use the pathsConfiguration and main function as the params.
        this.cv = {};
        this._is_ready = false;
        if (!(self as any).cv) {
            loadOpenCV(pathsConfig, async function(this : OpenCV) {
                this.cv = await (self as any).cv;
                this._is_ready = true;
                if (this._callbacks.ready) {
                    this.face_cascade = new this.cv.CascadeClassifier();
                    this.eye_cascade = new this.cv.CascadeClassifier();
                    
                    this.createFileFromUrl("haarcascade_frontalface_default.xml", "./haarcascade_frontalface_default.xml", function(this : OpenCV) {
                        this.face_cascade.load("haarcascade_frontalface_default.xml"); // in the callback, load the cascade from file 
                    }.bind(this));

                    this.createFileFromUrl("haarcascade_eye.xml", "./haarcascade_eye.xml", function(this : OpenCV) {
                        this.eye_cascade.load("haarcascade_eye.xml"); // in the callback, load the cascade from file 
                    }.bind(this));
                    this._callbacks.ready();
                }
            }.bind(this));
        }
    }

    private createFileFromUrl (path : string, url : string, callback : Function) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function(this : OpenCV, ev : Event) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let data = new Uint8Array(request.response);
                    this.cv.FS_createDataFile('/', path, data, true, false, false);
                    callback();
                } else {
                    if (this._callbacks.error) {
                        this._callbacks.error(new Error('Failed to load ' + url + ' status: ' + request.status));
                    }
                }
            }
        }.bind(this);
        request.send();
    };

    public on(event : events, callback : Function) : void {
        switch(event) {
            case "ready":
                this._callbacks.ready = callback;
                break;
            
            case "error":
                this._callbacks.error = callback;
                break;
            
            case "found":
                this._callbacks.found = callback;
                break;
        }
    }
}