"""
Gradio UI for the AI Lead Qualification Bot.
"""

import gradio as gr

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from config.settings import app_config
from services.bot_service import LeadBot
from utils.logging import get_logger

logger = get_logger(__name__)

def build_ui():
    """Builds the Gradio interface."""
    bot = LeadBot()
    
    # Custom CSS for a slick look
    custom_css = """
    body {
        background: linear-gradient(135deg, #1b1f3b, #3d2c8d);
        font-family: 'Inter', sans-serif;
    }
    
    .gradio-container {
        max-width: 1200px !important;
        padding: 20px;
        color: white;
    }
    
    #chatbox .message {
        animation: fadeIn 0.4s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    button {
        background: linear-gradient(135deg, #6a11cb, #2575fc);
        border: none !important;
        color: white !important;
        font-weight: bold;
        transition: transform 0.2s ease;
    }
    
    button:hover {
        transform: scale(1.05);
    }
    """
    
    with gr.Blocks(
        title="AI Lead Qualification Bot",
        theme=gr.themes.Soft(),
        css=custom_css
    ) as ui:
        
        gr.Markdown("""
        # 🤖 AI Lead Qualification Bot
        
        Chat with prospects, extract key info, and score leads automatically.
        
        **Features:**
        - Natural conversation flow
        - Real-time lead scoring
        - CRM integration ready
        - Intent detection
        """)
        
        with gr.Row():
            # Left side - chat
            with gr.Column(scale=2):
                chat_display = gr.Chatbot(
                    label="Conversation",
                    height=500,
                    show_label=True,
                    container=True,
                    bubble_full_width=False
                )
                
                with gr.Row():
                    user_input = gr.Textbox(
                        label="Your message",
                        placeholder="Type your message here...",
                        lines=2,
                        scale=4
                    )
                    send_button = gr.Button("Send", variant="primary", scale=1)
                
                with gr.Row():
                    new_chat_btn = gr.Button("New Chat", variant="secondary")
                    crm_sync_btn = gr.Button("Sync to CRM", variant="secondary")
                    summary_btn = gr.Button("Show Summary", variant="secondary")
            
            # Right side - lead data
            with gr.Column(scale=1):
                chat_id_display = gr.Textbox(
                    label="Session ID",
                    value="None",
                    interactive=False
                )
                
                lead_info_display = gr.Markdown(
                    label="Lead Analysis",
                    value="Start chatting to see lead data..."
                )
                
                gr.Markdown("""
                ### 🟢 System Status
                - LLM: Ready
                - Vector DB: Ready
                - Scorer: Ready
                - CRM: Ready
                """)
        
        # Wire up the handlers
        def on_send(msg, session_id, history):
            return bot.chat(msg, session_id, history)
        
        def on_new_chat():
            greeting, session_id = bot.start_chat()
            return [[greeting, None]], session_id, "New session started"
        
        def on_crm_sync(session_id):
            return bot.sync_to_crm(session_id)
        
        def on_summary(session_id):
            return bot.get_summary(session_id)
        
        # Connect events
        send_button.click(
            on_send,
            inputs=[user_input, chat_id_display, chat_display],
            outputs=[chat_display, chat_id_display, lead_info_display]
        )
        
        user_input.submit(
            on_send,
            inputs=[user_input, chat_id_display, chat_display],
            outputs=[chat_display, chat_id_display, lead_info_display]
        )
        
        new_chat_btn.click(
            on_new_chat,
            outputs=[chat_display, chat_id_display, lead_info_display]
        )
        
        crm_sync_btn.click(
            on_crm_sync,
            inputs=[chat_id_display],
            outputs=[lead_info_display]
        )
        
        summary_btn.click(
            on_summary,
            inputs=[chat_id_display],
            outputs=[lead_info_display]
        )
        
        # Auto-start with a greeting
        greeting, initial_id = bot.start_chat()
        chat_display.value = [[greeting, None]]
        chat_id_display.value = initial_id
    
    return ui

def run():
    """Launches the app."""
    try:
        ui = build_ui()
        
        logger.info(f"Starting bot on port {app_config.gradio_port}")
        
        ui.launch(
            server_name="0.0.0.0",
            server_port=app_config.gradio_port,
            share=app_config.gradio_share,
            debug=app_config.gradio_debug,
            show_error=True
        )
        
    except Exception as e:
        logger.error(f"Failed to start: {e}")
        raise

if __name__ == "__main__":
    run()
