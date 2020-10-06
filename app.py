from flask import Flask, jsonify, request, redirect, render_template
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
from image_processing import face_detection_recognition
from interaction_db import addRequestToDB, updateRequest


app = Flask(__name__)

CORS(app)

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


@app.route('/api/get', methods=['GET'])
def simpleCard():
    RESULTS = [{'name': 'Алиса Чернякова',
                'path': 'known_people/17747596232.JPG',
                'similarity': 65},
               {'name': 'Кристина Власова',
                'path': 'known_people/16308898900.jpg',
                'similarity': 56},
               {'name': 'Виолетта Зайдинер',
                'path': 'known_people/15345455463.jpg',
                'similarity': 51},
               {'name': 'Елена Юрьева',
                'path': 'known_people/16027090939.jpg',
                'similarity': 49}]
    return jsonify(RESULTS)

@app.route('/api/upload', methods=['GET', 'POST'])
def uploadFile():
    RESULTS = [{'face_found_in_image': 'False'}]
    if request.method == 'POST':

        file = request.files['file']

        if file:
            filename = secure_filename(file.filename)

            # Gen GUUID File Name
            fileExt = filename.split('.')[1]
            autoGenFileName = uuid.uuid4()
            newFileName = str(autoGenFileName) + '.' + fileExt

            file.save(os.path.join(app.config['UPLOAD_FOLDER'], newFileName))
            RESULTS = face_detection_recognition(file)
            print(RESULTS)
    return jsonify(RESULTS)


@app.route('/api/upload/single_face', methods=['GET', 'POST'])
def uploadFace():
    RESULTS = {}
    if request.method == 'POST':
        file = request.files['file']
        if file:
            print(file)
            # filename = secure_filename(file.filename)
            autoGenFileName = uuid.uuid4()
            newFileName = str(autoGenFileName) + '.' + 'jpg'
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], newFileName))

        else:
            RESULTS = {'Message': 'File error'}

        RESULTS = face_detection_recognition(file)
        RESULTS.update({'request_id': autoGenFileName})

        addRequestToDB(autoGenFileName, RESULTS['faceData'])
        # print(RESULTS)
    return jsonify(RESULTS)


@app.route('/api/user/confirm_recognition/<request_id>/<face_card_id>', methods=['GET'])
def confirm_recognition(request_id, face_card_id):
    updateRequest(request_id, face_card_id)

    return (jsonify({'status_confirm': 'ok'}))

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)
