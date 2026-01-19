"""
Setup script to download required NLTK data
Run this once after installing dependencies
"""
import nltk

print("Downloading NLTK data...")
nltk.download('punkt', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
print("NLTK data downloaded successfully!")
