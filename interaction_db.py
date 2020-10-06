from pymongo import MongoClient
import datetime
import uuid


MongoURI = 'mongodb://<dbuser>:<dbpassword>@<URI>/<database>' # To connect using a driver via the standard MongoDB URI

client = MongoClient(MongoURI, retryWrites=False)
findmedstu = client.findmedstu

requests = findmedstu.requests

def addRequestToDB(id_photo, ids_result_persons):
    document = {
        'id_photo': id_photo,
        'user_confirmation': False,
        'admin_confirmation': False,
        'ids_result_persons': ids_result_persons,
        'date_time': datetime.datetime.utcnow()
    }
    requests.insert_one(document)

def updateRequest(request_id, face_card_id):
    requests.update_one(
        {'id_photo': uuid.UUID(request_id)},
        {'$set':
            {
                "user_confirmation": True,
                "user_confirmed_card_id": face_card_id
            }
        }
    )
    print('status confirm: ok')
