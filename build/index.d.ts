import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
export interface ICallbacks {
    found?: Function;
    error?: Function;
    ready?: Function;
}
declare enum Eevents {
    found = 0,
    error = 1,
    ready = 2
}
export declare type events = keyof typeof Eevents;
export interface IPalette {
    FACE: string;
    IRIS: string;
}
export interface IConfig {
    NUM_KEYPOINTS: number;
    NUM_IRIS_KEYPOINTS: number;
    palette: IPalette;
    FACE_IN_VIEW_THRESHOLD: number;
    RENDER_FX: boolean;
    TENSORFLOW_BACKEND: string;
}
export interface Config {
    NUM_KEYPOINTS?: number;
    NUM_IRIS_KEYPOINTS?: number;
    palette?: IPalette;
    FACE_IN_VIEW_THRESHOLD?: number;
    RENDER_FX?: boolean;
    TENSORFLOW_BACKEND?: string;
}
export interface IMetaData {
    cover_ratio: number;
    top_left: {
        x: number;
        y: number;
    };
    image_height: number;
    image_width: number;
}
export declare type Vec2 = {
    x: number;
    y: number;
};
export interface IPosition {
    bottomLeft: Vec2;
    bottomRight: Vec2;
    topLeft: Vec2;
    topRight: Vec2;
}
export interface IResult {
    error?: string;
    position: IPosition;
    profile_info: {
        mspf: string;
        fps: string;
    };
}
export declare class Result implements IResult {
    error: string;
    position: IPosition;
    profile_info: {
        mspf: string;
        fps: string;
    };
    constructor(result?: {
        error?: string;
        position?: IPosition;
        profile_info?: {
            mspf: string;
            fps: string;
        };
    });
}
export declare class FaceDetector {
    private _output_render_context;
    private _video;
    private _stream;
    private _is_scanning;
    private _anim_id;
    protected _callbacks: ICallbacks;
    private model;
    private _interval_id;
    private keypoints;
    private _image_metadata;
    private render_fx;
    private config;
    constructor(context: CanvasRenderingContext2D, config?: Config);
    private distance;
    private drawPath;
    private _read;
    private _render;
    print(text: string, x: number, y: number, lineHeight: number): void;
    detect(): Promise<void>;
    stop(): Promise<boolean>;
    on(event: events, callback: Function): void;
    get_clean_plate(): HTMLCanvasElement;
    set_config(config: Config): void;
    getHQSanpshot(): Promise<Blob>;
}
export {};
