#!/usr/bin/env python3
"""
Quick test suite to make sure everything works.
"""

import json
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.llm_pipeline import get_llm_pipeline
from models.vector_store import get_vector_store
from models.predictive_model import get_predictive_model
from integrations.manager import get_crm_client
from config.settings import validate_config

def check_config():
    """Make sure config is valid."""
    print("🔧 Checking config...")
    
    if validate_config():
        print("✅ Config looks good")
        return True
    else:
        print("❌ Config validation failed")
        return False

def check_vector_db():
    """Test the vector store."""
    print("\n📚 Testing vector database...")
    
    try:
        store = get_vector_store()
        stats = store.get_stats()
        print(f"✅ Vector DB loaded with {stats['total_documents']} docs")
        return True
    except Exception as e:
        print(f"❌ Vector DB test failed: {e}")
        return False

def check_scorer():
    """Test the predictive model."""
    print("\n🤖 Testing lead scorer...")
    
    try:
        model = get_predictive_model()
        
        # Dummy data
        test_data = {
            'messages': [
                {'role': 'user', 'content': 'Need CRM for 50 people'},
                {'role': 'assistant', 'content': 'Sure, tell me more'},
                {'role': 'user', 'content': 'Budget is $100k, need it in a month'}
            ],
            'lead_info': {
                'name': 'Sarah',
                'company': 'TechCorp',
                'role': 'Sales Director',
                'industry': 'Tech',
                'team_size': 50
            },
            'behavioral_data': {
                'pages_visited': 5,
                'trial_usage': 0.2,
                'email_opens': 3,
                'demo_requested': True
            }
        }
        
        result = model.predict(test_data)
        print(f"✅ Scorer works - Score: {result['score']}, Intent: {result['intent']}")
        return True
    except Exception as e:
        print(f"❌ Scorer test failed: {e}")
        return False

def check_crm():
    """Test CRM integration."""
    print("\n🔗 Testing CRM integration...")
    
    try:
        crm = get_crm_client()
        
        # Dummy lead
        test_lead = {
            'name': 'Sarah Johnson',
            'email': 'sarah@techcorp.com',
            'company': 'TechCorp',
            'role': 'Sales Director',
            'industry': 'Tech',
            'intent': 'buy_soon',
            'score': 85,
            'tags': ['enterprise', 'hot']
        }
        
        results = crm.sync_leads(test_lead)
        print(f"✅ CRM integration works - {len(results)} systems configured")
        return True
    except Exception as e:
        print(f"❌ CRM test failed: {e}")
        return False

def check_conversation():
    """Test the conversation flow."""
    print("\n💬 Testing conversation...")
    
    try:
        llm = get_llm_pipeline()
        
        # Start a chat
        chat_id = "test_123"
        greeting = llm.start_conversation(chat_id)
        print(f"✅ Chat started: {greeting[:50]}...")
        
        # Send a message
        test_msg = "Hi, I'm Sarah from TechCorp. Looking for CRM for 50 people. Currently using Salesforce but it's too expensive."
        
        result = llm.process_message(chat_id, test_msg)
        
        print(f"✅ Message processed")
        print(f"   Response: {result['response'][:80]}...")
        print(f"   Score: {result['structured_output']['score']}")
        print(f"   Intent: {result['structured_output']['intent']}")
        
        return True
    except Exception as e:
        print(f"❌ Conversation test failed: {e}")
        return False

def run_all_tests():
    """Run the full test suite."""
    print("🚀 Running AI Lead Bot Tests\n")
    
    tests = [
        ("Config", check_config),
        ("Vector DB", check_vector_db),
        ("Scorer", check_scorer),
        ("CRM", check_crm),
        ("Conversation", check_conversation)
    ]
    
    passed = 0
    total = len(tests)
    
    for name, test_fn in tests:
        try:
            if test_fn():
                passed += 1
        except Exception as e:
            print(f"❌ {name} crashed: {e}")
    
    print(f"\n📈 Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️  Some tests failed")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
