export declare type Dimension = {
    x: number;
    y: number;
};
export declare type Rect = {
    topLeft: Dimension;
    bottomRight: Dimension;
};
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
declare enum Eevents {
    ready = 0,
    error = 1,
    found = 2
}
export declare type events = keyof typeof Eevents;
export declare abstract class OpenCV {
    protected cv: any;
    protected _is_ready: boolean;
    protected _callbacks: ICallbacks;
    protected face_cascade: any;
    protected eye_cascade: any;
    constructor();
    private createFileFromUrl;
    on(event: events, callback: Function): void;
}
export {};
