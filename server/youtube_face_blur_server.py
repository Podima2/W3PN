# import cv2
# from flask import Flask, Response
# import yt_dlp

# app = Flask(__name__)

# YOUTUBE_URL = 'https://www.twitch.tv/podima2'  # Replace with your desired YouTube livestream URL


# def get_youtube_stream_url(youtube_url):
#     ydl_opts = {'format': 'best', 'quiet': True}
#     with yt_dlp.YoutubeDL(ydl_opts) as ydl:
#         info = ydl.extract_info(youtube_url, download=False)
#         return info['url']

# def gen():
#     stream_url = get_youtube_stream_url(YOUTUBE_URL)
#     cap = cv2.VideoCapture(stream_url)
#     face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break
#         # Face detection and blurring
#         gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
#         faces = face_cascade.detectMultiScale(gray, 1.3, 5)
#         for (x, y, w, h) in faces:
#             face = frame[y:y+h, x:x+w]
#             face = cv2.GaussianBlur(face, (99, 99), 30)
#             frame[y:y+h, x:x+w] = face
#         _, jpeg = cv2.imencode('.jpg', frame)
#         yield (b'--frame\r\n'
#                b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

# @app.route('/video_feed')
# def video_feed():
#     return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5001) 

import cv2
from flask import Flask, Response
import yt_dlp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enables CORS for all routes and origins

YOUTUBE_URL = 'https://www.twitch.tv/strangr35gaming'  # Replace with your stream URL


def get_youtube_stream_url(youtube_url):
    ydl_opts = {'format': 'best', 'quiet': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        return info['url']

def gen():
    stream_url = get_youtube_stream_url(YOUTUBE_URL)
    cap = cv2.VideoCapture(stream_url)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Face detection and blurring
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        for (x, y, w, h) in faces:
            face = frame[y:y+h, x:x+w]
            face = cv2.GaussianBlur(face, (99, 99), 30)
            frame[y:y+h, x:x+w] = face
        _, jpeg = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
