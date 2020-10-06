 
const imageUpload = document.getElementById('imageUpload')

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('/face-api/models')
]).then(start)

function b64toBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);

  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: 'image/jpeg' });
}

function sortByArea(arr) {
  arr.sort((a, b) => a._box.area > b._box.area ? 1 : -1);
}

async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  document.body.append('Loaded models')

  let faceImage = new Image()
  let image
  let canvas
  imageUpload.addEventListener('change', async () => {

    if(image) image.remove()
    if(canvas) canvas.remove()
    if(faceImage) faceImage.remove()

    image = await faceapi.bufferToImage(imageUpload.files[0])

    // console.log(image)
    newWidth = 400
    scaleFactor = image.width / newWidth
    image.width = newWidth
    image.height = image.height / scaleFactor



    canvas = faceapi.createCanvasFromMedia(image)

    container.append(image)
    container.append(canvas)

    const displaySize = { width: image.width, height: image.height }

    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image)
    // console.log(detections)
    if (detections != 0){
      if (detections.length > 1){
        // Сортировка массива detections по площади лица
        sortByArea(detections)
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        biggestFaceDetections = resizedDetections.pop()
    
        resizedDetections.forEach(detection => {
          // console.log(detection._box.area)
          var box = detection.box
          var drawOptions = {
            boxColor: '#FF0000',
            lineWidth: 3,
          }
          const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
          drawBox.draw(canvas)
        })

        drawOptions = {
          boxColor: '#00FF00',
          lineWidth: 4,
        }

        var box = biggestFaceDetections.box
        drawBox = new faceapi.draw.DrawBox(box, drawOptions)
        drawBox.draw(canvas)
      } else {
          const resizedDetections = faceapi.resizeResults(detections, displaySize)
          var box = resizedDetections[0].box
          var drawOptions = {
            boxColor: '#00FF00',
            lineWidth: 4,
          }
          const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
          drawBox.draw(canvas)
        }

        // Увеличение области вырезаемого изображения лица
      scaleFactor = 1.5;
      var faceBox = {
        x: box.x - Math.floor(box.width/scaleFactor)/scaleFactor ** 2,
        y: box.y - Math.floor(box.height/scaleFactor)/scaleFactor ** 2,
        width: box.width * scaleFactor,
        height: box.height * scaleFactor,
      };

      var elem = document.createElement('canvas')
      elem.width = faceBox.width;
      elem.height = faceBox.height;
      var ctx =  elem.getContext('2d');
      ctx.drawImage(image, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, faceBox.width, faceBox.height);
      srcEncoded = ctx.canvas.toDataURL(image.src, 'image/jpeg', 1);

      
      // let faceImage = new Image()
      faceImage.src = srcEncoded
      // if(faceImage) faceImage.remove()
      // console.log(faceImage.src)

      document.body.append(faceImage)

      let faceImageBlob = b64toBlob(image.src);
      // console.log(faceImageBlob)

      var data_file = new FormData();
        // data_file.append('foo', 'bar');
        data_file.append('file', faceImageBlob);
        let respRecognition
        await axios.post('http://192.168.31.222:5000/api/upload_face', data_file)
          .then(resp => {respRecognition = resp.data})
          .catch(error => {console.log(error.message)});
      console.log(respRecognition)
    } else {
      console.log('Face not found')
    }
  })
}