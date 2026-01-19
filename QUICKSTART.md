# Quick Start Guide

## First Time Setup

### 1. Backend Setup (Terminal 1)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python setup_nltk.py
python main.py
```

Or use the batch file:
```bash
start_backend.bat
```

The backend will run on `http://localhost:8000`

### 2. Frontend Setup (Terminal 2)

Open a **new terminal** and run:

```bash
cd frontend
npm install
npm run dev
```

Or use the batch file:
```bash
start_frontend.bat
```

The frontend will run on `http://localhost:3000`

## Using the Application

1. Open your browser and go to `http://localhost:3000`
2. You'll see the Feedback Analysis Tool interface
3. Navigate between tabs:
   - **Dashboard**: View analytics and visualizations
   - **Add Feedback**: Add single or batch feedback
   - **All Feedback**: View and filter all feedback entries

## Testing the Application

### Add Sample Feedback

Try adding these sample feedback entries:

1. "I love this product! It's amazing and works perfectly."
2. "The service was terrible. Very disappointed with the quality."
3. "It's okay, nothing special but it works."
4. "Great customer support, very helpful team!"
5. "The app crashes frequently and needs bug fixes."

### View Analysis

Go to the Dashboard tab to see:
- Sentiment analysis results
- Keyword extraction
- Visual charts and graphs
- Statistics

## API Testing

You can also test the API directly:

1. Visit `http://localhost:8000/docs` for interactive API documentation
2. Or use curl:

```bash
# Get all feedback
curl http://localhost:8000/api/feedback

# Add feedback
curl -X POST http://localhost:8000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"text": "This is great!", "source": "test"}'

# Get analysis
curl http://localhost:8000/api/analysis
```

## Troubleshooting

### Backend Issues

- **Module not found**: Make sure you activated the virtual environment
- **NLTK errors**: Run `python setup_nltk.py` in the backend directory
- **Port 8000 in use**: Change the port in `backend/main.py`

### Frontend Issues

- **Cannot connect to API**: Make sure the backend is running on port 8000
- **npm install fails**: Make sure Node.js is installed (version 16+)
- **Port 3000 in use**: Vite will automatically use the next available port

## Next Steps

- Add more feedback to see richer analytics
- Try batch import with multiple entries
- Explore the API documentation at `/docs`
- Customize the analysis engine in `backend/analysis_engine.py`
