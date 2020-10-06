window.onload = function () {
    var app = new Vue({
        
        el: '#app',
        data: {
            file: null,
            name: '',
            path: '',
            similarity: '',
            faceCards: [],
            bestСard: null,
            uploadPhoto: null,
            request_id: null,
            message: {
              'success': null,
              'info': null,
              'warning': null,
              'danger': null
            },
            status: []
        },


        async mounted() {

            await faceapi.nets.ssdMobilenetv1.loadFromUri('/face-api/models')

            await axios.get('http://REST-API/api/get')
                .then(resp => {this.faceCards = resp.data})
                .catch(error => {console.log(error.message)})

            const imageUpload = document.getElementById('imageUpload')
            
            
            
        },
        
        methods: {

            confirmRecognition(event){
                axios.get('http://REST-API/api/user/confirm_recognition/' + this.request_id + '/' + event.currentTarget.id)
                    .then(resp => {
                        if (resp.data['status_confirm'] == 'ok') {
                            this.message['success'] = 'Thank you for confirming'
                        }
                      })
                    .catch(error => {console.log(error.message)});
                console.log('Confirm: ' + event.currentTarget.id)
            },


            onFileChange(e) {
            let files = e.target.files || e.dataTransfer.files;
                if (!files.length)
                    return;
                this.imageProcessing(files[0]);
            },

            sortByArea(arr) {
                arr.sort((a, b) => a._box.area > b._box.area ? 1 : -1);
            },

            b64toBlob(dataURI) {
                var byteString = atob(dataURI.split(',')[1]);
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);

                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                return new Blob([ab], { type: 'image/jpeg' });
            },

            async imageProcessing(file) {
                [this.message['success'], this.message['info'], this.message['warning'], this.message['danger']] = [null, null, null, null]

                let image
                let canvas
                
                  image = await faceapi.bufferToImage(file) // Upload a user-submitted face

                  canvas = faceapi.createCanvasFromMedia(image) // create canvas

                  const detections = await faceapi.detectAllFaces(image) // Detection all faces in image

                  if (detections != 0){
                    if (detections.length > 1){
                      this.message['info'] = 'More than one person was found in the photo. The largest face sent for recognition (marked with a green rectangle)';
                      // Sorting an array of detections by face area
                      this.sortByArea(detections)

                      biggestFaceDetections = detections.pop()
                  
                      detections.forEach(detection => {
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
                          
                          // const resizedDetections = faceapi.resizeResults(detections, displaySize);
                          var box = detections[0].box
                          var drawOptions = {
                              boxColor: '#00FF00',
                              lineWidth: 4,
                          }
                          const drawBox = new faceapi.draw.DrawBox(box, drawOptions)
                          drawBox.draw(canvas)
                      }

                      var resultCanvas = document.createElement('canvas'),
                      ctx = resultCanvas.getContext("2d")

                      resultCanvas.width = image.width
                      resultCanvas.height = image.height
                      ctx.drawImage(image,0,0);
                      ctx.drawImage(canvas,0,0);

                      this.uploadPhoto = resultCanvas.toDataURL();

                    var elem = document.createElement('canvas')
                    elem.width = box.width;
                    elem.height = box.height;
                    var ctx =  elem.getContext('2d');
                    ctx.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
                    srcEncoded = ctx.canvas.toDataURL(image.src, 'image/jpeg', 1);

                      let oneFaceImage = new Image()

                    oneFaceImage.src = srcEncoded

                    let faceImageBlob = this.b64toBlob(oneFaceImage.src);

                    let data_file = new FormData();
                    data_file.append('file', faceImageBlob);


                    await axios.post('REST-API/api/upload/single_face', data_file)
                          .then(resp => {
                              if (resp.data.faceData[0].similarity > 50) {
                                  this.bestСard = resp.data.faceData.shift()
                              }else{
                                  this.bestСard = null;
                              }
                              this.faceCards = resp.data.faceData
                              this.status = resp.data.response_status
                              this.request_id = resp.data['request_id']
                              
                              console.log(resp.data.response_status)
                          })
                          .catch(error => {console.log(error.message)});
                      
                  } else {
                      this.message['warning'] = 'Face not found'
                      console.log('Face not found')
                  }

            },
        }
    })
}
