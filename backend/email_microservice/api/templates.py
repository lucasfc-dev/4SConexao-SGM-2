from jinja2 import Environment, select_autoescape
from api.config import NEXT_FRONTEND_URL
from urllib.parse import quote


_JINJA_ENV = Environment(
    autoescape=select_autoescape(default_for_string=True, default=True),
)

# Adiciona filtro urlencode customizado
def urlencode_filter(value):
    """Encoda valor para URL"""
    return quote(str(value), safe='')

_JINJA_ENV.filters['urlencode'] = urlencode_filter

TEMPLATE_PASSWORD_RESET = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 24px; color: #374151; line-height: 1.5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <tr>
            <td style="background-color: #010440; padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0;">Recuperação de Senha - SGM</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px 24px; text-align: center;">
                <p style="margin: 0;">Olá,</p>
                <p style="margin: 16px 0;">Recebemos um pedido para redefinir a sua senha.</p>
                <p style="margin: 16px 0;">Para redefinir a sua senha, clique no link abaixo:</p>
                <a href="{{ NEXT_FRONTEND_URL }}/redefinir-senha?token={{ token | urlencode }}" style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; margin: 8px 0; transition: background-color 0.2s ease;">Redefinir Senha</a>
                <p style="color: #f97316; font-weight: 600; margin-top: 16px;">Se você não solicitou a redefinição, ignore este e-mail.</p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #010440; padding: 16px 24px; text-align: center;">
                <p style="color: #ffffff; font-size: 14px; margin: 4px 0;">Suporte SGM - 4S Conexão e Tecnologia</p>
            </td>
        </tr>
    </table>
</body>
</html>

"""

TEMPLATE_SHARE_FILE = """
    <!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compartilhamento de Documento</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 10px;
            background-color: #007BFF;
            color: #ffffff;
        }
        .content {
            padding: 20px;
            text-align: left;
            color: #333333;
        }
        .button-container {
            text-align: center;
            margin-top: 20px;
        }
        .button {
            background-color: #007BFF;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            font-weight: bold;
            border-radius: 5px;
            display: inline-block;
        }
        .footer {
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color: #888888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Documento Compartilhado</h1>
        </div>
        <div class="content">
            <p>Olá,</p>
            <p><strong>{{ sender }}</strong> compartilhou um documento com você.</p>
            <p>Para baixar o documento em PDF, clique no anexo abaixo:</p>
        </div>
        <div class="footer">
            <p>Este é um e-mail automático. Por favor, não responda.</p>
        </div>
    </div>
</body>
</html>

"""

TEMPLATE_OUVIDORIA_PROTOCOL = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Protocolo de Ouvidoria - SGM</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 24px; color: #374151; line-height: 1.5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <tr>
            <td style="background-color: #010440; padding: 32px 24px; text-align: center;">
                <div style="margin-bottom: 16px;">
                    <div style="background-color: #f97316; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                        <span style="color: #ffffff; font-size: 36px; font-weight: bold;">🔍</span>
                    </div>
                </div>
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0;">Protocolo de Ouvidoria - SGM</h1>
                <p style="color: #e5e7eb; margin: 8px 0 0 0; font-size: 14px;">Sistema de Gestão Municipal</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px 24px;">
                <h2 style="color: #f97316; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Abertura de Solicitação</h2>
                <p style="margin: 0 0 16px 0;">Prezado(a),</p>
                <p style="margin: 0 0 16px 0;">Foi registrado seu protocolo <strong style="color: #010440;">{{ protocol_number }}</strong> via de Ouvidoria da {{ estabelecimento }}</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #f97316; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0;"><strong>Tipo:</strong> {{ request_type }}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Assunto:</strong> {{ subject }}</p>
                    <p style="margin: 0;"><strong>Data de Abertura:</strong> {{ created_date }}</p>
                </div>
                
                <p style="margin: 16px 0;">Para visualizar o andamento do atendimento do protocolo, acesse:</p>
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="{{ NEXT_FRONTEND_URL }}/ouvidoria/acompanhamento?protocolo={{ protocol_number | urlencode }}" 
                       style="display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; transition: background-color 0.2s ease;">
                        Acompanhar Protocolo
                    </a>
                </div>
                
                <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280;">
                    Ao clicar no link acima, você será direcionado para o portal de acompanhamento.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    <strong>Atenciosamente,</strong><br>
                    Equipe de Ouvidoria - SGM<br>
                    {{ estabelecimento }}
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #010440; padding: 16px 24px; text-align: center;">
                <p style="color: #ffffff; font-size: 12px; margin: 0 0 4px 0;">
                    Não responda este e-mail. Este é um sistema automático.
                </p>
                <p style="color: #e5e7eb; font-size: 12px; margin: 0;">
                    © 2025 SGM - 4S Conexão e Tecnologia. Todos os direitos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""

TEMPLATE_OUVIDORIA_RESPOSTA = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resposta de Ouvidoria - SGM</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 24px; color: #374151; line-height: 1.5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <tr>
            <td style="background-color: #010440; padding: 32px 24px; text-align: center;">
                <div style="margin-bottom: 16px;">
                    <div style="background-color: #10b981; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                        <span style="color: #ffffff; font-size: 36px; font-weight: bold;">💬</span>
                    </div>
                </div>
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0;">Resposta de Ouvidoria - SGM</h1>
                <p style="color: #e5e7eb; margin: 8px 0 0 0; font-size: 14px;">Sistema de Gestão Municipal</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px 24px;">
                <h2 style="color: #10b981; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">Retorno da Solicitação</h2>
                <p style="margin: 0 0 16px 0;">Prezado(a),</p>
                <p style="margin: 0 0 16px 0;">Recebemos um retorno para seu protocolo <strong style="color: #010440;">{{ protocol_number }}</strong> via Ouvidoria da {{ estabelecimento }}</p>
                
                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0 0 8px 0;"><strong>Protocolo:</strong> {{ protocol_number }}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Status:</strong> {{ status }}</p>
                    <p style="margin: 0;"><strong>Data da Resposta:</strong> {{ response_date }}</p>
                </div>
                
                <div style="background-color: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <h3 style="color: #010440; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Resposta:</h3>
                    <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">{{ resposta }}</div>
                </div>
                
                {% if tem_anexos %}
                <div style="background-color: #fffbeb; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #f59e0b;">
                    <h3 style="color: #d97706; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
                        📎 Anexos Incluídos na Resposta:
                    </h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        {% for anexo in anexos %}
                        <li style="color: #92400e; margin: 4px 0;">{{ anexo.filename }}</li>
                        {% endfor %}
                    </ul>
                    <p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e; font-style: italic;">
                        Os arquivos estão anexados a este e-mail.
                    </p>
                </div>
                {% endif %}
                
                <p style="margin: 16px 0;">Para visualizar o histórico completo do protocolo, acesse:</p>
                
                <div style="text-align: center; margin: 24px 0;">
                    <a href="{{ NEXT_FRONTEND_URL }}/ouvidoria/acompanhamento?protocolo={{ protocol_number | urlencode }}" 
                       style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; transition: background-color 0.2s ease;">
                        Ver Histórico Completo
                    </a>
                </div>
                
                <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280;">
                    Ao clicar no link acima, você será direcionado para o portal de acompanhamento.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    <strong>Atenciosamente,</strong><br>
                    Equipe de Ouvidoria - SGM<br>
                    {{ estabelecimento }}
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #010440; padding: 16px 24px; text-align: center;">
                <p style="color: #ffffff; font-size: 12px; margin: 0 0 4px 0;">
                    Não responda este e-mail. Este é um sistema automático.
                </p>
                <p style="color: #e5e7eb; font-size: 12px; margin: 0;">
                    © 2025 SGM - 4S Conexão e Tecnologia. Todos os direitos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""

templates = {1:TEMPLATE_PASSWORD_RESET,2:TEMPLATE_SHARE_FILE,3:TEMPLATE_OUVIDORIA_PROTOCOL,4:TEMPLATE_OUVIDORIA_RESPOSTA}

def render_template(template_num, keys):
    if template_num not in templates:
        raise ValueError(f"Invalid template number: {template_num}")

    if not NEXT_FRONTEND_URL:
        raise RuntimeError("NEXT_FRONTEND environment variable is not configured")

    template = _JINJA_ENV.from_string(templates[template_num])
    # Adiciona NEXT_FRONTEND_URL ao contexto para que todos os templates possam acessar
    context = {**(keys or {}), "NEXT_FRONTEND_URL": NEXT_FRONTEND_URL}
    return template.render(context)

