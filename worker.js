importScripts("./opencv.js");
(async function() {
    function createFileFromUrl (path, url, callback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function(ev) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    let data = new Uint8Array(request.response);
                    _cv.FS_createDataFile('/', path, data, true, false, false);
                    callback();
                }
            }
        }.bind(this);
        request.send();
    };
    const _cv = await cv();
    face_cascade = new _cv.CascadeClassifier();
    eye_cascade = new _cv.CascadeClassifier();
    
    createFileFromUrl("haarcascade_frontalface_default.xml", "./haarcascade_frontalface_default.xml", function() {
        face_cascade.load("haarcascade_frontalface_default.xml"); // in the callback, load the cascade from file 
    }.bind(this));

    createFileFromUrl("haarcascade_eye.xml", "./haarcascade_eye.xml", function() {
        eye_cascade.load("haarcascade_eye.xml"); // in the callback, load the cascade from file 
    }.bind(this));

    onmessage = function(e) {
        const start = Date.now();
        const image_data = e.data[0];
        let src = _cv.matFromImageData(image_data);
        let grey = new _cv.Mat();
        _cv.cvtColor(src, grey, _cv.COLOR_RGBA2GRAY, 0);                
        
        faces = new _cv.RectVector();
        eyes = new _cv.RectVector();
        
        let position = {};
        
        // detect faces
        let msize = new _cv.Size(0, 0);
        face_cascade.detectMultiScale(grey, faces, 1.1, 3, 0, msize, msize);
        for (let i = 0; i < faces.size(); ++i) {
            let roiGray = grey.roi(faces.get(i));
            let roiSrc = src.roi(faces.get(i));
            let point1 = new _cv.Point(faces.get(i).x, faces.get(i).y);
            let point2 = new _cv.Point(faces.get(i).x + faces.get(i).width,
                                    faces.get(i).y + faces.get(i).height);

            position.face = {
                topLeft: point1,
                bottomRight: point2
            }

            position.eyes = [];

            // detect eyes in face ROI
            eye_cascade.detectMultiScale(roiGray, eyes);
            for (let j = 0; j < eyes.size(); ++j) {
                let point1 = new _cv.Point(eyes.get(j).x, eyes.get(j).y);
                let point2 = new _cv.Point(eyes.get(j).x + eyes.get(j).width,
                                        eyes.get(j).y + eyes.get(j).height);
                
                position.eyes.push({
                    topLeft: point1,
                    bottomRight: point2
                });
                
            }
            roiGray.delete(); roiSrc.delete();
        }
        
        const end = Date.now();

        //cleanup
        src.delete();
        grey.delete(); 
        faces.delete();
        eyes.delete();
        postMessage({
            position: {
                ...position
            },
            profile_info: `${(end-start).toFixed(2)}ms / ${(1/((end-start)/1000)).toFixed(2)}fps`
        });
    }
})();