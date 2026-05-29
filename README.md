<div align="center">

# 🤖 AI Lead Qualification Bot

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=28&duration=3000&pause=1000&color=2563EB&center=true&vCenter=true&width=800&lines=AI-Powered+Lead+Qualification;Intelligent+Conversation+Analysis;Predictive+Scoring+%26+CRM+Integration;Built+with+Open+Source+Models" alt="Typing SVG" />

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=flat-square)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/bhaskarviswanadh/AI-Lead-Qualification-Bot?style=flat-square)](https://github.com/bhaskarviswanadh/AI-Lead-Qualification-Bot/stargazers)
[![Forks](https://img.shields.io/github/forks/bhaskarviswanadh/AI-Lead-Qualification-Bot?style=flat-square)](https://github.com/bhaskarviswanadh/AI-Lead-Qualification-Bot/network)

<p align="center">
  <strong>🚀 Transform your lead qualification process with AI-powered conversations and predictive analytics</strong>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-core-features">Features</a> •
  <a href="#-installation--setup">Setup</a> •
  <a href="#-example-usage">Demo</a> •
  <a href="#-system-architecture">Architecture</a>
</p>

---

</div>

## 📊 Overview

<div align="center">

**An intelligent lead qualification system that automates prospect evaluation through conversational AI and predictive analytics.**

</div>

This system combines natural language processing with machine learning to:

- 💬 **Conduct automated qualification conversations** with prospects
- 📈 **Generate real-time lead scores** based on conversation analysis  
- 🎯 **Extract key buying signals** and intent indicators
- 🔗 **Integrate seamlessly** with existing CRM workflows
- 📋 **Provide structured data output** for sales teams

<div align="center">

### ✨ Key Benefits

| Benefit | Impact |
|---------|--------|
| ⚡ **Reduces manual qualification time** | Save hours per lead |
| 🎯 **Improves lead scoring accuracy** | Better conversion rates |
| 📊 **Standardizes qualification processes** | Consistent results |
| 🚀 **Scales prospect engagement** | Handle more leads |

</div>

## ✨ Core Features

<div align="center">

<table>
<tr>
<td width="50%" align="center">

### 🤖 Conversational Intelligence
- **Natural Language Processing**: Powered by Mistral-7B for human-like interactions
- **Context Retention**: Maintains conversation history for coherent multi-turn dialogues
- **Adaptive Questioning**: Dynamically adjusts questions based on prospect responses

</td>
<td width="50%" align="center">

### 🎯 Predictive Analytics
- **Real-time Scoring**: Generates lead scores (0-100) during conversations
- **Intent Classification**: Categorizes prospects by purchase readiness
- **Signal Detection**: Identifies key buying indicators and pain points

</td>
</tr>
<tr>
<td width="50%" align="center">

### 📚 Knowledge Integration
- **Document Retrieval**: RAG-based system for accessing product information
- **Competitive Intelligence**: Integrated battlecards for handling objections
- **Case Study Access**: Relevant success stories for prospect engagement

</td>
<td width="50%" align="center">

### 🔗 CRM Connectivity
- **Multi-platform Support**: HubSpot and Salesforce integrations
- **Automated Data Entry**: Creates and updates lead records automatically
- **Custom Tagging**: Applies relevant tags based on conversation insights

</td>
</tr>
</table>

</div>

## 🎬 Example Usage

<div align="center">

### 💬 Interactive Conversation Flow

</div>

```
Prospect: "Hi, I'm looking for a CRM solution for my team of 25 people. 
          We're currently using spreadsheets but need something more robust."

Bot: "I understand you're looking to upgrade from spreadsheets to a proper CRM. 
     That's a common challenge for growing teams. What's driving this decision 
     right now - are you facing specific pain points with your current process?"

Prospect: "Yes, we're losing track of leads and our sales process is inconsistent. 
          We need to implement something within the next quarter."
```

<div align="center">

### 📊 Structured System Output

</div>

```json
{
  "prospect_profile": {
    "company_size": 25,
    "current_solution": "spreadsheets",
    "decision_timeline": "next_quarter"
  },
  "qualification_score": 78,
  "intent_level": "high_interest",
  "key_signals": [
    "specific_pain_points_identified",
    "defined_timeline",
    "team_size_specified"
  ],
  "next_action": "schedule_demo",
  "crm_tags": ["mid_market", "spreadsheet_migration", "q1_timeline"]
}
```

## 🏗️ System Architecture

<div align="center">

**Modular architecture with clear separation of concerns**

</div>

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Gradio Interface │───▶│ Bot Service     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────────────────────┼─────────────────────────────────┐
                       │                                 ▼                                 │
                       │                    ┌─────────────────┐                           │
                       │                    │ LLM Pipeline    │                           │
                       │                    └─────────────────┘                           │
                       │                                 │                                 │
                       ▼                                 ▼                                 ▼
            ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
            │ Vector Store    │              │ Predictive      │              │ CRM Integration │
            │ (Knowledge RAG) │              │ Scoring Model   │              │ Manager         │
            └─────────────────┘              └─────────────────┘              └─────────────────┘
```

<div align="center">

### 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Interface** | Gradio | Web-based user interaction |
| **Orchestration** | LangChain | Workflow management |
| **Language Model** | Mistral-7B | Conversation generation |
| **Embeddings** | Sentence Transformers | Text vectorization |
| **Vector Database** | FAISS | Document retrieval |
| **ML Framework** | LightGBM | Predictive scoring |
| **Runtime** | Python 3.8+ | Core application |

</div>

## 🚀 Installation & Setup

<div align="center">

### 📋 System Requirements

| Requirement | Specification |
|-------------|---------------|
| **Python** | 3.8 or higher |
| **Memory** | 8GB RAM minimum |
| **Network** | Internet connection for model downloads |

</div>

### 🛠️ Installation Steps

<details open>
<summary><b>1️⃣ Clone Repository</b></summary>

```bash
git clone https://github.com/bhaskarviswanadh/AI-Lead-Qualification-Bot.git
cd AI-Lead-Qualification-Bot
```

</details>

<details open>
<summary><b>2️⃣ Setup Environment</b></summary>

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

</details>

<details open>
<summary><b>3️⃣ Install Dependencies</b></summary>

```bash
pip install -r requirements.txt
```

</details>

<details>
<summary><b>4️⃣ Configure Environment (Optional)</b></summary>

Create `.env` file with your API credentials:
```bash
HUGGINGFACE_TOKEN=your_token_here
HUBSPOT_API_KEY=your_hubspot_key
SALESFORCE_API_KEY=your_salesforce_key
ENVIRONMENT=development
```

</details>

<details open>
<summary><b>5️⃣ Launch Application</b></summary>

```bash
python app.py
```

🌐 Access the interface at `http://localhost:7860`

</details>

## 📁 Project Structure

<div align="center">

**Clean, modular codebase for easy maintenance and extension**

</div>

```
AI-Lead-Qualification-Bot/
├── 🎯 app.py                      # Main application entry point
├── 🧪 test_bot.py                 # Test suite
├── 📦 requirements.txt            # Python dependencies
├── ⚙️ .env                        # Environment configuration
│
├── 📂 config/
│   ├── prompts.py                # Conversation templates
│   └── settings.py               # System configuration
│
├── 📂 services/
│   └── bot_service.py            # Core conversation logic
│
├── 📂 models/
│   ├── llm_pipeline.py           # Language model interface
│   ├── predictive_model.py       # Scoring algorithms
│   └── vector_store.py           # Document retrieval system
│
├── 📂 integrations/
│   ├── hubspot.py                # HubSpot CRM connector
│   ├── salesforce.py             # Salesforce CRM connector
│   └── manager.py                # Integration orchestrator
│
├── 📂 data/
│   ├── product_docs/             # Product documentation
│   ├── case_studies/             # Customer success stories
│   ├── competitor_battlecards/   # Competitive intelligence
│   └── training_data/            # ML training datasets
│
└── 📂 utils/
    └── logging.py                # Logging utilities
```

## ⚙️ Configuration & Customization

<div align="center">

### 🔧 Model Settings

</div>

Modify `config/settings.py` to adjust model parameters:

```python
# Language model configuration
LLM_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Text processing settings
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
MAX_TOKENS = 2048
```

<div align="center">

### 📝 Conversation Templates

</div>

Update `config/prompts.py` to customize:
- 🎭 **System behavior prompts**
- ❓ **Qualification question sequences**
- 📋 **Response formatting templates**

<div align="center">

### 📚 Knowledge Base Management

</div>

Organize your content in the `data/` directory:

| Directory | Content Type |
|-----------|-------------|
| `product_docs/` | Technical specifications and feature descriptions |
| `case_studies/` | Customer success stories and use cases |
| `competitor_battlecards/` | Competitive positioning information |

## 🧪 Testing

<div align="center">

**Execute the test suite to verify system functionality**

</div>

```bash
python test_bot.py
```

<div align="center">

### ✅ Test Coverage

| Component | Validation |
|-----------|------------|
| ⚙️ **Configuration** | Loading and validation |
| 🤖 **Model Initialization** | LLM and embedding models |
| 🗄️ **Vector Store** | Document indexing and retrieval |
| 🔗 **CRM Integration** | API endpoints and authentication |
| 💬 **Conversation Flow** | Multi-turn dialogue logic |

</div>

## 🔗 API Integration

<div align="center">

### 📊 Structured Response Format

**The system outputs structured JSON for seamless integration**

</div>

```json
{
  "prospect_data": {
    "name": "string|null",
    "email": "string|null", 
    "company": "string|null",
    "role": "string|null",
    "industry": "string|null"
  },
  "qualification_results": {
    "intent_category": "high_interest|moderate_interest|low_interest|not_qualified",
    "score": "0-100",
    "confidence_level": "high|medium|low"
  },
  "conversation_insights": {
    "key_signals": ["array", "of", "signals"],
    "pain_points": ["identified", "challenges"],
    "decision_factors": ["important", "criteria"]
  },
  "recommendations": {
    "next_action": "schedule_demo|send_proposal|nurture_sequence|disqualify",
    "priority_level": "hot|warm|cold",
    "crm_tags": ["relevant", "tags"]
  }
}
```

## 🚀 Deployment Options

<div align="center">

### 🐳 Docker Deployment

</div>

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["python", "app.py"]
```

<div align="center">

### ☁️ Cloud Platform Support

| Platform | Compatibility | Notes |
|----------|---------------|-------|
| **Hugging Face Spaces** | ✅ Native | Gradio-compatible |
| **AWS EC2** | ✅ Docker | Full control |
| **Google Cloud Run** | ✅ Container | Serverless scaling |
| **Azure Container Instances** | ✅ Container | Easy deployment |

</div>

## 🛠️ Troubleshooting

<div align="center">

### 🔧 Common Issues & Solutions

</div>

<details>
<summary><b>❌ Module Import Errors</b></summary>

```bash
pip install -r requirements.txt
```

</details>

<details>
<summary><b>💾 Memory Issues</b></summary>

- Close unnecessary applications
- Adjust `llm_max_length` in configuration
- Consider using a smaller language model

</details>

<details>
<summary><b>🔒 Authentication Errors</b></summary>

```bash
export HUGGINGFACE_TOKEN=your_token_here
```

</details>

<div align="center">

*Refer to configuration files and logs for additional troubleshooting guidance.*

</div>

## 🤝 Contributing

<div align="center">

**Contributions are welcome! Join our growing community of developers.**

</div>

1. 🍴 **Fork the repository**
2. 🌿 **Create a feature branch** (`git checkout -b feature/new-feature`)
3. 💾 **Commit your changes** (`git commit -m 'Add new feature'`)
4. 📤 **Push to the branch** (`git push origin feature/new-feature`)
5. 🔀 **Open a Pull Request**

## 🗺️ Development Roadmap

<div align="center">

### 🚀 Upcoming Features

| Feature | Status | Priority |
|---------|--------|----------|
| 🌍 **Multi-language conversation support** | Planned | High |
| 📊 **Enhanced analytics dashboard** | In Progress | High |
| 🔔 **Webhook integration capabilities** | Planned | Medium |
| 📱 **Mobile-responsive interface** | Planned | Medium |
| 🎯 **Advanced model fine-tuning tools** | Research | Low |

</div>

## 📄 License

<div align="center">

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

</div>

## 👨‍💻 Author

<div align="center">

### **Bhaskar Viswanadh**

[![GitHub](https://img.shields.io/badge/GitHub-bhaskarviswanadh-blue?style=flat-square&logo=github)](https://github.com/bhaskarviswanadh)
[![Repository](https://img.shields.io/badge/Repository-AI--Lead--Qualification--Bot-green?style=flat-square&logo=github)](https://github.com/bhaskarviswanadh/AI-Lead-Qualification-Bot)

---

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=16&duration=2000&pause=1000&color=6B7280&center=true&vCenter=true&width=600&lines=Built+with+open-source+technologies;Designed+for+scalable+lead+qualification;Ready+for+enterprise+deployment" alt="Footer Typing SVG" />

**⭐ If you find this project helpful, please consider giving it a star!**

</div>
