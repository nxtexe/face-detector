import { OpenCV, IPosition } from './common/opencv';
export interface IOptions {
    border_width: number;
    border_colour: string;
}
export declare class FaceDetector extends OpenCV {
    private src;
    private grey;
    private faces;
    private eyes;
    constructor();
    detectFaceData(image_data: ImageData): IPosition;
}
