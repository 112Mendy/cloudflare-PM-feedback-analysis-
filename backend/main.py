from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn

from database import SessionLocal, engine, Base
from models import Feedback
from schemas import FeedbackCreate, FeedbackResponse, AnalysisResponse, FeedbackStats
from analysis_engine import analyze_feedback, get_aggregate_analysis

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Feedback Aggregation & Analysis Tool", version="1.0.0")

# CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
async def root():
    return {"message": "Feedback Aggregation & Analysis API"}


@app.post("/api/feedback", response_model=FeedbackResponse)
async def create_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    """Create a new feedback entry"""
    try:
        # Analyze the feedback
        analysis = analyze_feedback(feedback.text, feedback.source or "manual")
        
        # Create feedback record
        db_feedback = Feedback(
            text=feedback.text,
            source=feedback.source or "manual",
            category=feedback.category,
            sentiment=analysis["sentiment"],
            sentiment_score=analysis["sentiment_score"],
            keywords=", ".join(analysis["keywords"]),
            metadata=feedback.metadata
        )
        
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        
        return FeedbackResponse(
            id=db_feedback.id,
            text=db_feedback.text,
            source=db_feedback.source,
            category=db_feedback.category,
            sentiment=db_feedback.sentiment,
            sentiment_score=db_feedback.sentiment_score,
            keywords=db_feedback.keywords.split(", ") if db_feedback.keywords else [],
            metadata=db_feedback.metadata,
            created_at=db_feedback.created_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback/batch", response_model=List[FeedbackResponse])
async def create_feedback_batch(feedbacks: List[FeedbackCreate], db: Session = Depends(get_db)):
    """Create multiple feedback entries at once"""
    results = []
    for feedback in feedbacks:
        try:
            analysis = analyze_feedback(feedback.text, feedback.source or "batch")
            
            db_feedback = Feedback(
                text=feedback.text,
                source=feedback.source or "batch",
                category=feedback.category,
                sentiment=analysis["sentiment"],
                sentiment_score=analysis["sentiment_score"],
                keywords=", ".join(analysis["keywords"]),
                metadata=feedback.metadata
            )
            
            db.add(db_feedback)
            results.append(db_feedback)
        except Exception as e:
            continue
    
    db.commit()
    
    return [
        FeedbackResponse(
            id=fb.id,
            text=fb.text,
            source=fb.source,
            category=fb.category,
            sentiment=fb.sentiment,
            sentiment_score=fb.sentiment_score,
            keywords=fb.keywords.split(", ") if fb.keywords else [],
            metadata=fb.metadata,
            created_at=fb.created_at
        )
        for fb in results
    ]


@app.get("/api/feedback", response_model=List[FeedbackResponse])
async def get_all_feedback(
    skip: int = 0,
    limit: int = 100,
    source: Optional[str] = None,
    sentiment: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all feedback with optional filters"""
    query = db.query(Feedback)
    
    if source:
        query = query.filter(Feedback.source == source)
    if sentiment:
        query = query.filter(Feedback.sentiment == sentiment)
    
    feedbacks = query.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        FeedbackResponse(
            id=fb.id,
            text=fb.text,
            source=fb.source,
            category=fb.category,
            sentiment=fb.sentiment,
            sentiment_score=fb.sentiment_score,
            keywords=fb.keywords.split(", ") if fb.keywords else [],
            metadata=fb.metadata,
            created_at=fb.created_at
        )
        for fb in feedbacks
    ]


@app.get("/api/feedback/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(feedback_id: int, db: Session = Depends(get_db)):
    """Get a specific feedback entry"""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return FeedbackResponse(
        id=feedback.id,
        text=feedback.text,
        source=feedback.source,
        category=feedback.category,
        sentiment=feedback.sentiment,
        sentiment_score=feedback.sentiment_score,
        keywords=feedback.keywords.split(", ") if feedback.keywords else [],
        metadata=feedback.metadata,
        created_at=feedback.created_at
    )


@app.delete("/api/feedback/{feedback_id}")
async def delete_feedback(feedback_id: int, db: Session = Depends(get_db)):
    """Delete a feedback entry"""
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    db.delete(feedback)
    db.commit()
    return {"message": "Feedback deleted successfully"}


@app.get("/api/analysis", response_model=AnalysisResponse)
async def get_analysis(
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get aggregate analysis of all feedback"""
    query = db.query(Feedback)
    if source:
        query = query.filter(Feedback.source == source)
    
    feedbacks = query.all()
    
    if not feedbacks:
        return AnalysisResponse(
            total_feedback=0,
            sentiment_distribution={},
            top_keywords=[],
            sources=[],
            average_sentiment_score=0.0,
            stats=FeedbackStats(
                total=0,
                positive=0,
                negative=0,
                neutral=0
            )
        )
    
    return get_aggregate_analysis(feedbacks)


@app.get("/api/stats", response_model=FeedbackStats)
async def get_stats(
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get basic statistics about feedback"""
    query = db.query(Feedback)
    if source:
        query = query.filter(Feedback.source == source)
    
    feedbacks = query.all()
    
    return FeedbackStats(
        total=len(feedbacks),
        positive=len([f for f in feedbacks if f.sentiment == "positive"]),
        negative=len([f for f in feedbacks if f.sentiment == "negative"]),
        neutral=len([f for f in feedbacks if f.sentiment == "neutral"])
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
