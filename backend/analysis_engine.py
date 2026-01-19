import re
from collections import Counter
from textblob import TextBlob
from typing import List, Dict
from models import Feedback


def analyze_feedback(text: str, source: str = "manual") -> Dict:
    """
    Analyze a single feedback text and extract:
    - Sentiment (positive/negative/neutral)
    - Sentiment score
    - Keywords
    """
    # Clean text
    text = text.strip()
    
    # Sentiment analysis using TextBlob
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity  # Range: -1 (negative) to 1 (positive)
    
    # Determine sentiment category
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    # Extract keywords (simple approach: important words)
    words = blob.words
    # Filter out common stop words and short words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
        'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
        'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our',
        'their', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
        'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
        'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
        'so', 'than', 'too', 'very', 'just', 'now'
    }
    
    # Get meaningful keywords (nouns and adjectives, excluding stop words)
    keywords = []
    for word in words:
        word_lower = word.lower()
        if len(word_lower) > 3 and word_lower not in stop_words:
            # Get word tags to filter for nouns and adjectives
            tags = blob.tags
            for tagged_word, tag in tags:
                if tagged_word.lower() == word_lower:
                    if tag.startswith('NN') or tag.startswith('JJ'):  # Nouns or Adjectives
                        keywords.append(word_lower)
                    break
    
    # Get top 10 keywords
    keyword_counts = Counter(keywords)
    top_keywords = [word for word, count in keyword_counts.most_common(10)]
    
    return {
        "sentiment": sentiment,
        "sentiment_score": round(polarity, 3),
        "keywords": top_keywords
    }


def get_aggregate_analysis(feedbacks: List[Feedback]) -> Dict:
    """
    Analyze all feedback and return aggregate statistics
    """
    if not feedbacks:
        return {
            "total_feedback": 0,
            "sentiment_distribution": {},
            "top_keywords": [],
            "sources": [],
            "average_sentiment_score": 0.0,
            "stats": {
                "total": 0,
                "positive": 0,
                "negative": 0,
                "neutral": 0
            }
        }
    
    # Sentiment distribution
    sentiment_counts = Counter([f.sentiment for f in feedbacks])
    sentiment_distribution = {
        "positive": sentiment_counts.get("positive", 0),
        "negative": sentiment_counts.get("negative", 0),
        "neutral": sentiment_counts.get("neutral", 0)
    }
    
    # Average sentiment score
    avg_sentiment = sum([f.sentiment_score for f in feedbacks]) / len(feedbacks)
    
    # Aggregate all keywords
    all_keywords = []
    for feedback in feedbacks:
        if feedback.keywords:
            keywords_list = [k.strip() for k in feedback.keywords.split(",")]
            all_keywords.extend(keywords_list)
    
    keyword_counts = Counter(all_keywords)
    top_keywords = [
        {"word": word, "count": count}
        for word, count in keyword_counts.most_common(20)
    ]
    
    # Unique sources
    sources = list(set([f.source for f in feedbacks]))
    
    return {
        "total_feedback": len(feedbacks),
        "sentiment_distribution": sentiment_distribution,
        "top_keywords": top_keywords,
        "sources": sources,
        "average_sentiment_score": round(avg_sentiment, 3),
        "stats": {
            "total": len(feedbacks),
            "positive": sentiment_distribution["positive"],
            "negative": sentiment_distribution["negative"],
            "neutral": sentiment_distribution["neutral"]
        }
    }
