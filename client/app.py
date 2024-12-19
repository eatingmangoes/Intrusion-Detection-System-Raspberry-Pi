import io
import logging
import socketserver
from http import server
from threading import Condition, Thread, Lock
import cv2
import numpy as np
import pickle
import face_recognition
import time
import requests
import adafruit_dht
import board

# MJPEG streaming page HTML
PAGE = """\
<html>
<head>
<title>Face Recognition Streaming Demo</title>
</head>
<body>
<h1>Face Recognition Streaming</h1>
<img src="stream.mjpg" width="640" height="480" />
</body>
</html>
"""

class StreamingOutput(io.BufferedIOBase):
    def __init__(self):
        self.frame = None
        self.condition = Condition()

    def write(self, buf):
        with self.condition:
            self.frame = buf
            self.condition.notify_all()

class StreamingHandler(server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(301)
            self.send_header('Location', '/index.html')
            self.end_headers()
        elif self.path == '/index.html':
            content = PAGE.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        elif self.path == '/stream.mjpg':
            self.send_response(200)
            self.send_header('Age', 0)
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            try:
                while True:
                    with output.condition:
                        output.condition.wait()
                        frame = output.frame
                    self.wfile.write(b'--FRAME\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', len(frame))
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b'\r\n')
            except Exception as e:
                logging.warning(
                    'Removed streaming client %s: %s',
                    self.client_address, str(e))
        else:
            self.send_error(404)
            self.end_headers()

class StreamingServer(socketserver.ThreadingMixIn, server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True

# Load the trained face recognizer and label dictionary
try:
    with open("encodings.pkl", "rb") as f:
        known_face_encodings, known_face_names = pickle.load(f)
except Exception as e:
    logging.error(f"Error loading face encodings: {e}")
    known_face_encodings, known_face_names = [], []

# Initialize the video capture (webcam)
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    logging.error("Error: Could not open video device.")
    exit()

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

output = StreamingOutput()
dht_device = adafruit_dht.DHT22(board.D4)  # Adjust GPIO pin as per your wiring
# Initialize the DHT11 temperature sensor
unknown_faces = {}
unknown_face_lock = Lock()
# Function for capturing video frames, face recognition, and streaming
def capture_and_stream():
    while True:
        ret, frame = cap.read()
        if not ret:
            logging.error("Failed to capture frame.")
            break

        # Convert the frame to RGB for face recognition
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Detect face locations and compute encodings
        face_locations = face_recognition.face_locations(rgb_frame)
        face_names = []

        # Check if we have known face encodings
        if known_face_encodings:
            try:
                # Compute face encodings for detected faces
                face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

                # Compare each detected face with known faces
                for face_encoding in face_encodings:
                    # Compare the detected face with known face encodings
                    matches = face_recognition.compare_faces(known_face_encodings, face_encoding,tolerance=0.4)
                    name = "Unknown"

                    # Find the best match
                    if True in matches:
                        # Find indices of all matched faces
                        match_indices = [i for i, is_match in enumerate(matches) if is_match]
                        
                        # Find the face with the lowest face distance (most similar)
                        face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
                        best_match_index = match_indices[np.argmin(face_distances[match_indices])]
                        name = known_face_names[best_match_index]

                    face_names.append(name)

            except Exception as e:
                logging.error(f"Error in face recognition: {e}")

        # Iterate through face locations *before* checking unknown_faces
        found_unknown = False  # Flag to track if any unknown faces are found

        for (top, right, bottom, left), name in zip(face_locations, face_names):
            with unknown_face_lock:
                current_time = time.time()
                face_loc = (top, right, bottom, left)
                temperature = dht_device.temperature
                humidity = dht_device.humidity
                if name == "Unknown":
                    found_unknown = True  # Set the flag
                    if face_loc not in unknown_faces:
                        unknown_faces[face_loc] = current_time
                    elif current_time - unknown_faces[face_loc] >= 0.5:
                        print("Unknown Face Detected!")
                        requests.get(f"http://3.109.56.7/proj2/php/save1.php?temp={temperature:.1f}&humidity={humidity:.1f}&motion=1")
                        unknown_faces.pop(face_loc)
                        break  # Exit the inner loop after printing
                elif face_loc in unknown_faces:
                    unknown_faces.pop(face_loc)
                print(temperature)
                requests.get(f"http://3.109.56.7/proj2/php/save1.php?temp={temperature:.1f}&humidity={humidity:.1f}")


        # After processing all faces, check if only known faces were found
#        if not found_unknown and face_locations:  # Check if faces were detected and none were unknown.
#            try:
#                requests.get("http://3.109.56.7/proj2/php/save1.php?motion=0") # Reset motion
#                print("Motion reset to 0 (Only known faces detected)") # Console confirmation
#            except requests.RequestException as e:
#                logging.error(f"Error sending motion reset to API: {e}")


        # Draw rectangles and names (still inside the outer loop)
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)
            cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 0), 2)

        # Encode the frame as JPEG
        _, jpeg = cv2.imencode('.jpg', frame)

        # Send the JPEG frame to the MJPEG stream
        with output.condition:
            output.frame = jpeg.tobytes()
            output.condition.notify_all()


# Start the capture and stream thread
try:
    capture_and_stream_thread = Thread(target=capture_and_stream, daemon=True)
    capture_and_stream_thread.start()

    # Start the MJPEG streaming server
    address = ('', 8000)
    server = StreamingServer(address, StreamingHandler)
    server.serve_forever()

finally:
    cap.release()