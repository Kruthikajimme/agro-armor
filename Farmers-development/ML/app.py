import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
tf.config.set_visible_devices([], 'GPU')
import numpy as np
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Load model with tf_keras compatibility for Keras 2 depthwise convolution layers
model_path = os.path.join(os.path.dirname(__file__), 'chicken_disease_model.h5')
model = None
model_load_error = None

try:
    import tf_keras as keras
    model = keras.models.load_model(model_path)
    print("Model loaded successfully with tf_keras!")
except Exception as e1:
    try:
        import tensorflow as tf
        model = tf.keras.models.load_model(model_path)
        print("Model loaded successfully with tensorflow.keras!")
    except Exception as e2:
        model_load_error = f"tf_keras: {str(e1)} | tf.keras: {str(e2)}"
        print(f"Warning: Model could not be loaded: {model_load_error}")

classes = ['Coccidiosis', 'Healthy', 'New Castle Disease', 'Salmonella']

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({
            'error': 'ML model is not loaded',
            'details': model_load_error
        }), 503

    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    
    try:
        # Read and preprocess image
        img = Image.open(io.BytesIO(file.read())).convert('RGB')
        img = img.resize((224, 224))
        img_array = img_to_array(img)
        img_array = preprocess_input(img_array)
        img_array = np.expand_dims(img_array, axis=0)
        
        # Predict
        prediction = model.predict(img_array)
        class_index = np.argmax(prediction[0])
        confidence = float(prediction[0][class_index])
        
        return jsonify({
            'disease': classes[class_index],
            'confidence': confidence,
            'all_predictions': {
                classes[i]: float(prediction[0][i]) 
                for i in range(len(classes))
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'service': 'AgroArmour Poultry Disease Detection ML API',
        'status': 'healthy',
        'version': '1.0.0',
        'model_loaded': True,
        'classes': classes,
        'endpoints': {
            'health': '/health',
            'predict': '/predict'
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'agro-armor-ml',
        'model_loaded': model is not None,
        'model_error': model_load_error
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Chicken Disease Prediction API on port {port}...")
    print("Model loaded successfully!")
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)

