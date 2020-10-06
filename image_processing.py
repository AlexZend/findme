import face_recognition
import numpy as np
import pandas as pd


data = pd.read_pickle('dictionary.pickle')
known_face_names = np.array([str(d[0]) + ' ' + str(d[1]) for d in list(zip(data['surname'], data['lastname']))])

# known_face_lastnames = data.lastname.values
known_face_encodings = np.array(list(data['encodings']))
known_face_paths = data.paths.values

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# def allowed_file(filename):
#     return '.' in filename and \
#            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def face_detection_recognition(file_stream):

    # Load the uploaded image file
    img = face_recognition.load_image_file(file_stream)
    # Get face encodings for any faces in the uploaded image
    unknown_face_encodings = face_recognition.face_encodings(img, num_jitters=1)
    # print(unknown_face_encodings)
    face_found = False
    more_than_one_person = False

    result = {
        'response_status': [],
        'faceData': [],
    }

    if len(unknown_face_encodings) > 0:
        face_found = True
        more_than_one_person = True
        if len(unknown_face_encodings) == 1:
            more_than_one_person = False

        def_result = {
            'face_found_in_image' : face_found,
            'more_than_one_person_in_the_photo' : more_than_one_person,
        }
        result['response_status'].append(def_result)

        matches = face_recognition.compare_faces(known_face_encodings, unknown_face_encodings[0], tolerance=0.8)

        face_distances = face_recognition.face_distance(known_face_encodings, unknown_face_encodings[0])

        bests_match_indexs = np.argsort(face_distances)[:5]

        for best_match_index in bests_match_indexs:
            if matches[best_match_index]:
                name = known_face_names[best_match_index]
                small_image_path = known_face_paths[best_match_index]
                distances = face_distances[best_match_index]
            # Rounding distance
            distances = round(distances, 2)
            # Transfer to percent
            distances = int((1 - distances)*100)
            # Return the result as json
            add_result = {
                "name" : name,
                "path": small_image_path,
                "similarity" : distances
            }
            # print(unknown_face_encodings)
            result['unknown_face_encodings'] = unknown_face_encodings[0].tolist()
            result['faceData'].append(add_result)

    return result