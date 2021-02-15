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
import { simd, threads } from "https://unpkg.com/wasm-feature-detect?module";
export function loadOpenCV(paths, onloadCallback) {
    return __awaiter(this, void 0, void 0, function () {
        var OPENCV_URL, asmPath, wasmPath, simdPath, threadsPath, threadsSimdPath, wasmSupported, simdSupported, threadsSupported, script, node;
        return __generator(this, function (_a) {
            OPENCV_URL = "";
            asmPath = "";
            wasmPath = "";
            simdPath = "";
            threadsPath = "";
            threadsSimdPath = "";
            if (!(paths instanceof Object)) {
                throw new Error("The first input should be a object that points the path to the OpenCV.js");
            }
            if ("asm" in paths) {
                asmPath = paths["asm"];
            }
            if ("wasm" in paths) {
                wasmPath = paths["wasm"];
            }
            if ("threads" in paths) {
                threadsPath = paths["threads"];
            }
            if ("simd" in paths) {
                simdPath = paths["simd"];
            }
            if ("threadsSimd" in paths) {
                threadsSimdPath = paths["threadsSimd"];
            }
            wasmSupported = !(typeof WebAssembly === 'undefined');
            if (!wasmSupported && OPENCV_URL === "" && asmPath != "") {
                OPENCV_URL = asmPath;
                console.log("The OpenCV.js for Asm.js is loaded now");
            }
            else if (!wasmSupported && asmPath == "") {
                throw new Error("The browser supports the Asm.js only, but the path of OpenCV.js for Asm.js is empty");
            }
            simdSupported = wasmSupported ? simd() : false;
            threadsSupported = wasmSupported ? threads() : false;
            if (simdSupported && threadsSupported && threadsSimdPath != "") {
                OPENCV_URL = threadsSimdPath;
                console.log("The OpenCV.js with simd and threads optimization is loaded now");
            }
            else if (simdSupported && simdPath != "") {
                if (threadsSupported && threadsSimdPath === "") {
                    console.log("The browser supports simd and threads, but the path of OpenCV.js with simd and threads optimization is empty");
                }
                OPENCV_URL = simdPath;
                console.log("The OpenCV.js with simd optimization is loaded now.");
            }
            else if (threadsSupported && threadsPath != "") {
                if (simdSupported && threadsSimdPath === "") {
                    console.log("The browser supports simd and threads, but the path of OpenCV.js with simd and threads optimization is empty");
                }
                OPENCV_URL = threadsPath;
                console.log("The OpenCV.js with threads optimization is loaded now");
            }
            else if (wasmSupported && wasmPath != "") {
                if (simdSupported && threadsSupported) {
                    console.log("The browser supports simd and threads, but the path of OpenCV.js with simd and threads optimization is empty");
                }
                if (simdSupported) {
                    console.log("The browser supports simd optimization, but the path of OpenCV.js with simd optimization is empty");
                }
                if (threadsSupported) {
                    console.log("The browser supports threads optimization, but the path of OpenCV.js with threads optimization is empty");
                }
                OPENCV_URL = wasmPath;
                console.log("The OpenCV.js for wasm is loaded now");
            }
            else if (wasmSupported) {
                console.log("The browser supports wasm, but the path of OpenCV.js for wasm is empty");
            }
            if (OPENCV_URL === "") {
                throw new Error("No available OpenCV.js, please check your paths");
            }
            script = document.createElement('script');
            script.setAttribute('async', '');
            script.setAttribute('type', 'text/javascript');
            script.addEventListener('load', function () {
                onloadCallback();
            });
            script.addEventListener('error', function () {
                console.log('Failed to load opencv.js');
            });
            script.src = OPENCV_URL;
            node = document.getElementsByTagName('script')[0];
            if (node.src != OPENCV_URL) {
                node.parentNode.insertBefore(script, node);
            }
            return [2 /*return*/];
        });
    });
}
//# sourceMappingURL=loader.js.map