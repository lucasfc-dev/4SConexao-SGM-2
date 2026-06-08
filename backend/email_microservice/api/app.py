from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.schemas import EmailSchema,AttachmentSchema
from api.templates import render_template
from api.config import ENVIRONMENT,NEXT_FRONTEND_URL
from dotenv import load_dotenv
from email.message import EmailMessage
import aiosmtplib
import os
import ssl
import certifi
from typing import List, Union
import base64

load_dotenv()

if ENVIRONMENT == "development":
    app = FastAPI()
else:
    app = FastAPI(
        docs_url=None,     
        redoc_url=None,    
        openapi_url=None,
    )

origins = ['http://localhost:3000', NEXT_FRONTEND_URL, 'https://sgm-hml.4sconexaoetecnologia.com.br']
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL")


async def send_email(to_email: Union[str, List[str]], subject: str, body: str, attachment=None):
    try:
        message = EmailMessage()
        message["From"] = FROM_EMAIL
        
        # Trata tanto string quanto lista de emails
        if isinstance(to_email, list):
            message["To"] = ', '.join(to_email)
        else:
            message["To"] = to_email
            
        message["Subject"] = subject
        message.add_alternative(body, subtype='html') 
        
        if attachment:
            # Verifica se é uma lista de anexos ou um único anexo
            attachments = attachment if isinstance(attachment, list) else [attachment]
            
            for attach in attachments:
                main_type, sub_type = 'application', 'pdf'
                if isinstance(attach.file, str):
                    file_content = base64.b64decode(attach.file)
                else:
                    file_content = attach.file
                
                message.add_attachment(
                    file_content,
                    maintype=main_type,
                    subtype=sub_type,
                    filename=attach.filename
                )
        tls_context = ssl.create_default_context(cafile=certifi.where())
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_SERVER,
            port=SMTP_PORT,
            username=SMTP_USERNAME,
            password=SMTP_PASSWORD,
            use_tls=False, 
            start_tls=True,
            tls_context=tls_context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao enviar e-mail: {str(e)}")

@app.get('/')
async def root():
    return 'Rota Principal'

@app.post('/email/password/')
async def post_email_password(email: EmailSchema, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_email, email.email, email.subject, render_template(1,email.keys))
    return {'message': 'Email enviado com sucesso!!!'}

@app.post('/email/share/')
async def post_email_share(email: EmailSchema, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_email, email.email, email.subject, render_template(2,email.keys),email.attachment)
    return {'message': 'Email enviado com sucesso!!!'}

@app.post('/email/ouvidoria/protocolo/')
async def post_email_ouvidoria(email: EmailSchema, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_email, email.email, email.subject, render_template(3,email.keys))
    return {'message': 'Email enviado com sucesso!!!'}

@app.post('/email/ouvidoria/resposta/')
async def post_email_ouvidoria_resposta(email: EmailSchema, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_email, email.email, email.subject, render_template(4,email.keys), email.attachment)
    return {'message': 'Email enviado com sucesso!!!'}