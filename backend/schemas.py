from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class FeedbackCreate(BaseModel):
    text: str
    source: Optional[str] = None
    category: Optional[str] = None
    metadata: Optional[Dict] = None


class FeedbackResponse(BaseModel):
    id: int
    text: str
    source: str
    category: Optional[str]
    sentiment: str
    sentiment_score: float
    keywords: List[str]
    metadata: Optional[Dict]
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackStats(BaseModel):
    total: int
    positive: int
    negative: int
    neutral: int


class AnalysisResponse(BaseModel):
    total_feedback: int
    sentiment_distribution: Dict[str, int]
    top_keywords: List[Dict[str, any]]
    sources: List[str]
    average_sentiment_score: float
    stats: FeedbackStats
