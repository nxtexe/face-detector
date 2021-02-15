var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { OpenCV } from './common/opencv.js';
var FaceDetector = /** @class */ (function (_super) {
    __extends(FaceDetector, _super);
    function FaceDetector() {
        return _super.call(this) || this;
    }
    FaceDetector.prototype.detectFaceData = function (image_data) {
        this.src = this.cv.matFromImageData(image_data);
        this.grey = new this.cv.Mat();
        this.cv.cvtColor(this.src, this.grey, this.cv.COLOR_RGBA2GRAY, 0);
        this.faces = new this.cv.RectVector();
        this.eyes = new this.cv.RectVector();
        var position = {};
        // detect faces
        var msize = new this.cv.Size(0, 0);
        this.face_cascade.detectMultiScale(this.grey, this.faces, 1.1, 3, 0, msize, msize);
        for (var i = 0; i < this.faces.size(); ++i) {
            var roiGray = this.grey.roi(this.faces.get(i));
            var roiSrc = this.src.roi(this.faces.get(i));
            var point1 = new this.cv.Point(this.faces.get(i).x, this.faces.get(i).y);
            var point2 = new this.cv.Point(this.faces.get(i).x + this.faces.get(i).width, this.faces.get(i).y + this.faces.get(i).height);
            position.face = {
                topLeft: point1,
                bottomRight: point2
            };
            position.eyes = [];
            // detect eyes in face ROI
            this.eye_cascade.detectMultiScale(roiGray, this.eyes);
            for (var j = 0; j < this.eyes.size(); ++j) {
                var point1_1 = new this.cv.Point(this.eyes.get(j).x, this.eyes.get(j).y);
                var point2_1 = new this.cv.Point(this.eyes.get(j).x + this.eyes.get(j).width, this.eyes.get(j).y + this.eyes.get(j).height);
                position.eyes.push({
                    topLeft: point1_1,
                    bottomRight: point2_1
                });
            }
            roiGray.delete();
            roiSrc.delete();
        }
        return position;
    };
    return FaceDetector;
}(OpenCV));
export { FaceDetector };
//# sourceMappingURL=index.js.map