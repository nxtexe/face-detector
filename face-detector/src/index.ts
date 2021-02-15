import {OpenCV, IResult, IPosition, Dimension, Rect} from './common/opencv';

export interface IOptions {
    border_width: number;
    border_colour : string;
}
export class FaceDetector extends OpenCV {
    private src : any;
    private grey : any;
    private faces : any;
    private eyes : any;
    constructor() {
        super();
    }

    public detectFaceData(image_data : ImageData) : IPosition {
        this.src = this.cv.matFromImageData(image_data);
        this.grey = new this.cv.Mat();
        this.cv.cvtColor(this.src, this.grey, this.cv.COLOR_RGBA2GRAY, 0);                
        
        this.faces = new this.cv.RectVector();
        this.eyes = new this.cv.RectVector();
        
        let position : IPosition = {};
        
        // detect faces
        let msize = new this.cv.Size(0, 0);
        this.face_cascade.detectMultiScale(this.grey, this.faces, 1.1, 3, 0, msize, msize);
        for (let i = 0; i < this.faces.size(); ++i) {
            let roiGray = this.grey.roi(this.faces.get(i));
            let roiSrc = this.src.roi(this.faces.get(i));
            let point1 : Dimension = new this.cv.Point(this.faces.get(i).x, this.faces.get(i).y);
            let point2 : Dimension = new this.cv.Point(this.faces.get(i).x + this.faces.get(i).width,
                                    this.faces.get(i).y + this.faces.get(i).height);

            position.face = {
                topLeft: point1,
                bottomRight: point2
            }

            position.eyes = [];

            // detect eyes in face ROI
            this.eye_cascade.detectMultiScale(roiGray, this.eyes);
            for (let j = 0; j < this.eyes.size(); ++j) {
                let point1 = new this.cv.Point(this.eyes.get(j).x, this.eyes.get(j).y);
                let point2 = new this.cv.Point(this.eyes.get(j).x + this.eyes.get(j).width,
                                        this.eyes.get(j).y + this.eyes.get(j).height);
                
                position.eyes.push({
                    topLeft: point1,
                    bottomRight: point2
                });
                
            }
            roiGray.delete(); roiSrc.delete();
        }
                        
        return position;
    }
}
