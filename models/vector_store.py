"""
Vector store implementation using FAISS for document retrieval.
"""

import os
import pickle
import json
from typing import List, Dict, Any, Optional
from pathlib import Path

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from config.settings import model_config
from utils.logging import get_logger

logger = get_logger(__name__)

class VectorStore:
    """FAISS-based vector store for document retrieval."""
    
    def __init__(self, embedding_model_name: str = None, vector_db_path: str = None):
        """Initialize the vector store."""
        self.embedding_model_name = embedding_model_name or model_config.embedding_model_name
        self.vector_db_path = vector_db_path or model_config.vector_db_path
        self.chunk_size = model_config.chunk_size
        self.chunk_overlap = model_config.chunk_overlap
        self.top_k = model_config.top_k_retrieval
        
        # Initialize components
        self.embedding_model = None
        self.index = None
        self.documents = []
        self.metadata = []
        
        # Create directory if it doesn't exist
        os.makedirs(self.vector_db_path, exist_ok=True)
        
        self._load_or_initialize()
    
    def _load_or_initialize(self):
        """Load existing index or initialize new one."""
        index_path = os.path.join(self.vector_db_path, "faiss_index")
        documents_path = os.path.join(self.vector_db_path, "documents.pkl")
        metadata_path = os.path.join(self.vector_db_path, "metadata.json")
        
        if os.path.exists(index_path) and os.path.exists(documents_path):
            logger.info("Loading existing vector store...")
            self._load_index(index_path, documents_path, metadata_path)
        else:
            logger.info("Initializing new vector store...")
            self._initialize_index()
    
    def _initialize_index(self):
        """Initialize the FAISS index and embedding model."""
        # Initialize embedding model
        self.embedding_model = SentenceTransformer(self.embedding_model_name)
        embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
        
        # Initialize FAISS index
        self.index = faiss.IndexFlatIP(embedding_dim)  # Inner product for cosine similarity
        
        logger.info(f"Initialized FAISS index with dimension {embedding_dim}")
    
    def _load_index(self, index_path: str, documents_path: str, metadata_path: str):
        """Load existing FAISS index and documents."""
        try:
            # Load FAISS index
            self.index = faiss.read_index(index_path)
            
            # Load documents
            with open(documents_path, 'rb') as f:
                self.documents = pickle.load(f)
            
            # Load metadata
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            
            # Initialize embedding model
            self.embedding_model = SentenceTransformer(self.embedding_model_name)
            
            logger.info(f"Loaded vector store with {len(self.documents)} documents")
            
        except Exception as e:
            logger.error(f"Error loading vector store: {e}")
            self._initialize_index()
    
    def _save_index(self):
        """Save the FAISS index and documents."""
        try:
            index_path = os.path.join(self.vector_db_path, "faiss_index")
            documents_path = os.path.join(self.vector_db_path, "documents.pkl")
            metadata_path = os.path.join(self.vector_db_path, "metadata.json")
            
            # Save FAISS index
            faiss.write_index(self.index, index_path)
            
            # Save documents
            with open(documents_path, 'wb') as f:
                pickle.dump(self.documents, f)
            
            # Save metadata
            with open(metadata_path, 'w') as f:
                json.dump(self.metadata, f)
            
            logger.info("Vector store saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving vector store: {e}")
    
    def add_documents(self, documents: List[Document], document_type: str = "general"):
        """Add documents to the vector store."""
        if not documents:
            logger.warning("No documents provided to add")
            return
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
        )
        
        chunks = []
        for doc in documents:
            doc_chunks = text_splitter.split_documents([doc])
            chunks.extend(doc_chunks)
        
        # Extract text and metadata
        texts = [chunk.page_content for chunk in chunks]
        metadatas = [chunk.metadata for chunk in chunks]
        
        # Generate embeddings
        embeddings = self.embedding_model.encode(texts, show_progress_bar=True)
        
        # Add to FAISS index
        if self.index.ntotal == 0:
            self.index.add(embeddings.astype('float32'))
        else:
            # For incremental updates, we need to rebuild the index
            # This is a simplified approach - in production, you might want more sophisticated handling
            existing_embeddings = self.index.reconstruct_n(0, self.index.ntotal)
            all_embeddings = np.vstack([existing_embeddings, embeddings.astype('float32')])
            
            # Rebuild index
            self.index = faiss.IndexFlatIP(embeddings.shape[1])
            self.index.add(all_embeddings)
        
        # Update documents and metadata
        self.documents.extend(texts)
        self.metadata.extend(metadatas)
        
        logger.info(f"Added {len(chunks)} chunks to vector store")
        self._save_index()
    
    def similarity_search(self, query: str, k: int = None) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        if not query.strip():
            return []
        
        k = k or self.top_k
        
        # Generate query embedding
        query_embedding = self.embedding_model.encode([query])
        
        # Search in FAISS index
        scores, indices = self.index.search(query_embedding.astype('float32'), k)
        
        # Return results
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < len(self.documents):
                results.append({
                    'content': self.documents[idx],
                    'metadata': self.metadata[idx] if idx < len(self.metadata) else {},
                    'score': float(score)
                })
        
        return results
    
    def get_relevant_documents(self, query: str, document_types: List[str] = None) -> List[Dict[str, Any]]:
        """Get relevant documents for a query, optionally filtered by document type."""
        results = self.similarity_search(query)
        
        if document_types:
            # Filter by document type if specified
            filtered_results = []
            for result in results:
                doc_type = result.get('metadata', {}).get('document_type', 'general')
                if doc_type in document_types:
                    filtered_results.append(result)
            results = filtered_results
        
        return results
    
    def get_product_knowledge(self, query: str) -> str:
        """Get product knowledge relevant to the query."""
        results = self.get_relevant_documents(query, ['product_docs', 'case_studies'])
        
        if not results:
            return "I don't have specific information about that topic yet."
        
        # Combine relevant information
        knowledge_parts = []
        for result in results[:3]:  # Top 3 most relevant
            content = result['content']
            metadata = result.get('metadata', {})
            source = metadata.get('source', 'Unknown')
            
            knowledge_parts.append(f"From {source}:\n{content}")
        
        return "\n\n".join(knowledge_parts)
    
    def get_case_studies(self, query: str) -> str:
        """Get relevant case studies."""
        results = self.get_relevant_documents(query, ['case_studies'])
        
        if not results:
            return "I don't have specific case studies for that scenario yet."
        
        case_studies = []
        for result in results[:2]:  # Top 2 case studies
            content = result['content']
            metadata = result.get('metadata', {})
            company = metadata.get('company', 'Unknown Company')
            
            case_studies.append(f"Case Study - {company}:\n{content}")
        
        return "\n\n".join(case_studies)
    
    def get_competitor_info(self, query: str) -> str:
        """Get competitor information."""
        results = self.get_relevant_documents(query, ['competitor_battlecards'])
        
        if not results:
            return "I don't have specific competitor information for that comparison."
        
        competitor_info = []
        for result in results[:2]:  # Top 2 competitor comparisons
            content = result['content']
            metadata = result.get('metadata', {})
            competitor = metadata.get('competitor', 'Unknown Competitor')
            
            competitor_info.append(f"Comparison with {competitor}:\n{content}")
        
        return "\n\n".join(competitor_info)
    
    def clear(self):
        """Clear all documents from the vector store."""
        self.documents = []
        self.metadata = []
        
        # Reinitialize index
        embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatIP(embedding_dim)
        
        # Save empty state
        self._save_index()
        
        logger.info("Vector store cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store."""
        return {
            'total_documents': len(self.documents),
            'index_size': self.index.ntotal if self.index else 0,
            'embedding_dimension': self.embedding_model.get_sentence_embedding_dimension() if self.embedding_model else 0,
            'document_types': list(set([meta.get('document_type', 'general') for meta in self.metadata]))
        }


# Global vector store instance
_vector_store = None

def get_vector_store() -> VectorStore:
    """Get the global vector store instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store

def initialize_vector_store_from_files(data_dir: str):
    """Initialize vector store with documents from the data directory."""
    vector_store = get_vector_store()
    
    # Clear existing documents
    vector_store.clear()
    
    # Load documents from different directories
    document_types = {
        'product_docs': 'data/product_docs',
        'case_studies': 'data/case_studies', 
        'competitor_battlecards': 'data/competitor_battlecards'
    }
    
    for doc_type, dir_path in document_types.items():
        if os.path.exists(dir_path):
            documents = load_documents_from_directory(dir_path, doc_type)
            if documents:
                vector_store.add_documents(documents, doc_type)
                logger.info(f"Loaded {len(documents)} {doc_type} documents")
    
    logger.info("Vector store initialization complete")

def load_documents_from_directory(directory: str, document_type: str) -> List[Document]:
    """Load documents from a directory."""
    documents = []
    
    if not os.path.exists(directory):
        return documents
    
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        
        if os.path.isfile(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Create document with metadata
                doc = Document(
                    page_content=content,
                    metadata={
                        'source': filename,
                        'document_type': document_type,
                        'file_path': file_path
                    }
                )
                documents.append(doc)
                
            except Exception as e:
                logger.error(f"Error loading document {file_path}: {e}")
    
    return documents
