var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs-core';
// If you are using the WebGL backend:
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import { TRIANGULATION } from './common/triangulation';
tfjsWasm.setWasmPaths("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@" + tfjsWasm.version_wasm + "/dist/");
var Eevents;
(function (Eevents) {
    Eevents[Eevents["found"] = 0] = "found";
    Eevents[Eevents["error"] = 1] = "error";
    Eevents[Eevents["ready"] = 2] = "ready";
})(Eevents || (Eevents = {}));
var Result = /** @class */ (function () {
    function Result(result) {
        if (result) {
            this.profile_info = result.profile_info ? result.profile_info : { mspf: '0', fps: '0' };
            this.error = result.error ? result.error : '';
            this.position = result.position ? result.position :
                {
                    bottomRight: { x: 0, y: 0 },
                    bottomLeft: { x: 0, y: 0 },
                    topRight: { x: 0, y: 0 },
                    topLeft: { x: 0, y: 0 },
                };
        }
        else {
            this.profile_info = { mspf: '0', fps: '0' };
            this.error = '';
            this.position =
                {
                    bottomRight: { x: 0, y: 0 },
                    bottomLeft: { x: 0, y: 0 },
                    topRight: { x: 0, y: 0 },
                    topLeft: { x: 0, y: 0 },
                };
        }
    }
    return Result;
}());
export { Result };
var FaceDetector = /** @class */ (function () {
    function FaceDetector(context, config) {
        this._stream = new MediaStream();
        this._is_scanning = false;
        this._anim_id = 0;
        this._callbacks = {};
        this._interval_id = 0;
        this.render_fx = false;
        this.config = {
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
        this._output_render_context = context;
        this._video = document.createElement('video');
        if (config) {
            this.set_config(config);
        }
        this.keypoints = [[0]];
        this._image_metadata = {
            cover_ratio: 0,
            image_height: 0,
            image_width: 0,
            top_left: {
                x: 0,
                y: 0
            }
        };
        //clear canvas to black
        this._output_render_context.fillStyle = "black";
        this._output_render_context.fillRect(0, 0, this._output_render_context.canvas.width, this._output_render_context.canvas.height);
    }
    FaceDetector.prototype.distance = function (a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    };
    FaceDetector.prototype.drawPath = function (points, closePath) {
        var region = new Path2D();
        region.moveTo((points[0][0] * this._image_metadata.cover_ratio) + this._image_metadata.top_left.x, (points[0][1] - this._image_metadata.top_left.y) * this._image_metadata.cover_ratio);
        for (var i = 1; i < points.length; i++) {
            var point = points[i];
            region.lineTo((point[0] * this._image_metadata.cover_ratio) + this._image_metadata.top_left.x, (point[1] - this._image_metadata.top_left.y) * this._image_metadata.cover_ratio);
        }
        if (closePath) {
            region.closePath();
        }
        this._output_render_context.stroke(region);
    };
    FaceDetector.prototype._read = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var start, predictions, end, topLeft, bottomRight, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this._output_render_context.setTransform(-1, 0, 0, 1, this._output_render_context.canvas.width, 0);
                        start = Date.now();
                        return [4 /*yield*/, ((_a = this.model) === null || _a === void 0 ? void 0 : _a.estimateFaces({
                                input: this._video,
                                returnTensors: false,
                                flipHorizontal: false,
                                predictIrises: true
                            }))];
                    case 1:
                        predictions = _b.sent();
                        end = Date.now();
                        //render face triangle mesh
                        if (predictions && predictions.length > 0) {
                            if (predictions[0].faceInViewConfidence > this.config.FACE_IN_VIEW_THRESHOLD
                                && this._callbacks.found) {
                                //face found render effects
                                this.render_fx = true;
                                topLeft = {
                                    x: predictions[0].boundingBox.topLeft[0],
                                    y: predictions[0].boundingBox.topLeft[1]
                                };
                                bottomRight = {
                                    x: predictions[0].boundingBox.bottomRight[0],
                                    y: predictions[0].boundingBox.bottomRight[1]
                                };
                                result = {
                                    position: {
                                        topLeft: topLeft,
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
                                        mspf: (end - start).toFixed(2),
                                        fps: (1 / ((end - start) / 1000)).toFixed(2)
                                    }
                                };
                                this._callbacks.found(result);
                            }
                            else {
                                this.render_fx = false;
                            }
                            this.keypoints = predictions[0].scaledMesh;
                        }
                        if (this._is_scanning) {
                            this._interval_id = window.setTimeout(this._read.bind(this), 41);
                        }
                        else {
                            clearTimeout(this._interval_id);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    FaceDetector.prototype._render = function () {
        return __awaiter(this, void 0, void 0, function () {
            var original_ratios, cover_ratio, new_image_width, new_image_height, x, y, i, points, leftCenter, leftDiameterY, leftDiameterX, rightCenter, rightDiameterY, rightDiameterX;
            var _this = this;
            return __generator(this, function (_a) {
                this._output_render_context.setTransform(-1, 0, 0, 1, this._output_render_context.canvas.width, 0);
                original_ratios = {
                    width: this._output_render_context.canvas.width / this._video.videoWidth,
                    height: this._output_render_context.canvas.height / this._video.videoHeight
                };
                cover_ratio = Math.max(original_ratios.width, original_ratios.height);
                new_image_width = this._video.videoWidth * cover_ratio;
                new_image_height = this._video.videoHeight * cover_ratio;
                x = (this._output_render_context.canvas.width / 2) - (this._video.videoWidth / 2) * cover_ratio;
                y = (this._output_render_context.canvas.height / 2) - (this._video.videoHeight / 2) * cover_ratio;
                this._image_metadata = {
                    cover_ratio: cover_ratio,
                    image_height: new_image_height,
                    image_width: new_image_width,
                    top_left: {
                        x: x,
                        y: y
                    },
                };
                //draw to canvas
                this._output_render_context.drawImage(this._video, x, y, new_image_width, new_image_height);
                this._output_render_context.strokeStyle = this.config.palette.FACE;
                this._output_render_context.lineWidth = 0.5;
                //render effects (triangle mesh and iris mesh)
                //render_fx if face found
                //this.config.RENDER_FX if user wants effects rendered
                if (this.keypoints.length > 1 && this.render_fx && this.config.RENDER_FX) {
                    //face
                    for (i = 0; i < TRIANGULATION.length / 3; i++) {
                        points = [
                            TRIANGULATION[i * 3 + 0],
                            TRIANGULATION[i * 3 + 1],
                            TRIANGULATION[i * 3 + 2]
                        ].map(function (index) { return _this.keypoints[index]; });
                        this.drawPath(points, true);
                    }
                    //iris
                    if (this.keypoints.length > this.config.NUM_KEYPOINTS) {
                        this._output_render_context.strokeStyle = this.config.palette.IRIS;
                        this._output_render_context.lineWidth = 1;
                        leftCenter = this.keypoints[this.config.NUM_KEYPOINTS];
                        leftDiameterY = this.distance(this.keypoints[this.config.NUM_KEYPOINTS + 4], this.keypoints[this.config.NUM_KEYPOINTS + 2]);
                        leftDiameterX = this.distance(this.keypoints[this.config.NUM_KEYPOINTS + 3], this.keypoints[this.config.NUM_KEYPOINTS + 1]);
                        this._output_render_context.beginPath();
                        this._output_render_context.ellipse((leftCenter[0] * this._image_metadata.cover_ratio) + this._image_metadata.top_left.x, (leftCenter[1] - this._image_metadata.top_left.y) * this._image_metadata.cover_ratio, leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI);
                        this._output_render_context.stroke();
                        if (this.keypoints.length > this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS) {
                            rightCenter = this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS];
                            rightDiameterY = this.distance(this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 2], this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 4]);
                            rightDiameterX = this.distance(this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 3], this.keypoints[this.config.NUM_KEYPOINTS + this.config.NUM_IRIS_KEYPOINTS + 1]);
                            this._output_render_context.beginPath();
                            this._output_render_context.ellipse((rightCenter[0] * this._image_metadata.cover_ratio) + this._image_metadata.top_left.x, (rightCenter[1] - this._image_metadata.top_left.y) * this._image_metadata.cover_ratio, rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI);
                            this._output_render_context.stroke();
                        }
                    }
                }
                if (this._is_scanning) {
                    this._anim_id = window.requestAnimationFrame(this._render.bind(this));
                }
                else {
                    window.cancelAnimationFrame(this._anim_id);
                }
                return [2 /*return*/];
            });
        });
    };
    FaceDetector.prototype.print = function (text, x, y, lineHeight) {
        var maxWidth = this._output_render_context.canvas.getBoundingClientRect().width;
        var words = text.split(' ');
        var line = '';
        //write error message to canvas
        this._output_render_context.font = "20px Arial";
        this._output_render_context.fillStyle = "white";
        this._output_render_context.textAlign = "center";
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = this._output_render_context.measureText(testLine);
            var testWidth = metrics.width;
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
    };
    FaceDetector.prototype.detect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, error, e_1, error;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return [3 /*break*/, 9];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 7, , 8]);
                        if (!!this._is_scanning) return [3 /*break*/, 5];
                        _a = this;
                        return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
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
                                        ideal: 3 / 4
                                    }
                                }
                            })];
                    case 2:
                        _a._stream = _d.sent();
                        this._video.srcObject = this._stream;
                        (_c = this._video) === null || _c === void 0 ? void 0 : _c.play();
                        this._is_scanning = true;
                        this._render();
                        //set tensorflow compute backend
                        return [4 /*yield*/, tf.setBackend(this.config.TENSORFLOW_BACKEND)];
                    case 3:
                        //set tensorflow compute backend
                        _d.sent();
                        tf.enableProdMode();
                        // Load the MediaPipe Facemesh package.
                        _b = this;
                        return [4 /*yield*/, faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
                                shouldLoadIrisModel: true,
                                detectionConfidence: 1,
                                maxFaces: 1,
                                iouThreshold: 0,
                            })];
                    case 4:
                        // Load the MediaPipe Facemesh package.
                        _b.model = _d.sent();
                        this._read();
                        if (this._callbacks.ready) {
                            this._callbacks.ready();
                        }
                        resolve();
                        return [3 /*break*/, 6];
                    case 5:
                        error = new Error("Stream already initialised.");
                        if (this._callbacks.error) {
                            this._callbacks.error(error);
                        }
                        reject(error);
                        _d.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_1 = _d.sent();
                        if (this._callbacks.error) {
                            this._callbacks.error(e_1);
                        }
                        this.print("Error. Permission denied. Please update browser permissions to access camera.", this._output_render_context.canvas.width / 2, this._output_render_context.canvas.height / 2, 25);
                        reject(e_1);
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error = new Error("Browser does not support getUserMedia.");
                        if (this._callbacks.error) {
                            this._callbacks.error(error);
                        }
                        //write error message to canvas
                        this.print("Error. Your browser does not support camera access. Use a modern browser or update your browser.", this._output_render_context.canvas.width / 2, this._output_render_context.canvas.height / 2, 25);
                        reject(error);
                        _d.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        }); });
    };
    FaceDetector.prototype.stop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this._stream) {
                //stop scanning
                _this._is_scanning = false;
                //stop camera
                _this._video.pause();
                _this._video.src = "";
                _this._stream.getTracks().forEach(function (track) {
                    track.stop();
                });
                //clear canvas to black
                _this._output_render_context.fillStyle = "black";
                _this._output_render_context.fillRect(0, 0, _this._output_render_context.canvas.width, _this._output_render_context.canvas.height);
                resolve(true);
            }
            else {
                reject(new Error("Stream was not initialised."));
            }
        });
    };
    FaceDetector.prototype.on = function (event, callback) {
        switch (event) {
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
    };
    FaceDetector.prototype.get_clean_plate = function () {
        var clean_plate = document.createElement('canvas');
        var clean_plate_context = clean_plate.getContext('2d');
        clean_plate.height = this._image_metadata.image_height;
        clean_plate.width = this._image_metadata.image_width;
        //draw to canvas
        clean_plate_context.drawImage(this._video, this._image_metadata.top_left.x, this._image_metadata.top_left.y, this._image_metadata.image_width, this._image_metadata.image_height);
        return clean_plate;
    };
    FaceDetector.prototype.set_config = function (config) {
        //update config_vars
        this.config = __assign(__assign({}, this.config), config);
    };
    FaceDetector.prototype.getHQSanpshot = function () {
        return __awaiter(this, void 0, void 0, function () {
            var video_track, image_capture, image, e_2, clean_plate_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        video_track = this._stream.getVideoTracks()[0];
                        image_capture = new ImageCapture(video_track);
                        return [4 /*yield*/, image_capture.takePhoto()];
                    case 1:
                        image = _a.sent();
                        return [2 /*return*/, image];
                    case 2:
                        e_2 = _a.sent();
                        clean_plate_1 = this.get_clean_plate();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                clean_plate_1.toBlob(function (blob) {
                                    if (blob) {
                                        resolve(blob);
                                    }
                                    else {
                                        reject(new Error('Could not construct blob.'));
                                    }
                                }, 'image/png', 1);
                            })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return FaceDetector;
}());
export { FaceDetector };
