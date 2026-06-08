import logging
from datetime import date, datetime, timedelta
from pytz import timezone
from tortoise.expressions import Q
from api.models import Licitacao, Dispensa, Modalidade
from api.config import TORTOISE_CONFIG


logger = logging.getLogger(__name__)

SCHEDULER_TIMEZONE = timezone(TORTOISE_CONFIG.get("timezone", "UTC"))


def get_business_days_ago(days: int) -> date:
    """Calcula uma data N dias úteis no passado (seg-sex)"""
    current_date = datetime.now(SCHEDULER_TIMEZONE).date()
    business_days_count = 0
    
    while business_days_count < days:
        current_date -= timedelta(days=1)
        # weekday() retorna 0-6 (seg-dom), 5 e 6 são sábado e domingo
        if current_date.weekday() < 5:
            business_days_count += 1
    
    return current_date

async def update_situacao_licitacao() -> dict[str, int]:
    limite_concorrencia = get_business_days_ago(10)
    limite_outras = get_business_days_ago(8)
    modalidade_concorrencia_ids = await Modalidade.filter(
        nome="Concorrência Pública"
    ).values_list("id", flat=True)

    if modalidade_concorrencia_ids:
        updated_concorrencia = await Licitacao.filter(
            modalidade_id__in=modalidade_concorrencia_ids,
            situacao="aberta",
            pub_date__lte=limite_concorrencia,
        ).update(situacao="em_andamento")

        updated_outras = await Licitacao.filter(
            ~Q(modalidade_id__in=modalidade_concorrencia_ids),
            situacao="aberta",
            pub_date__lte=limite_outras,
        ).update(situacao="em_andamento")
    else:
        updated_concorrencia = 0
        updated_outras = await Licitacao.filter(
            situacao="aberta",
            pub_date__lte=limite_outras,
        ).update(situacao="em_andamento")

    logger.info(
        "Scheduler licitacoes atualizado: concorrencia=%s outras=%s",
        updated_concorrencia,
        updated_outras,
    )
    return {
        "concorrencia": updated_concorrencia,
        "outras": updated_outras,
        "total": updated_concorrencia + updated_outras,
    }

async def update_situacao_dispensa() -> dict[str, int]:
    limite = get_business_days_ago(3)
    updated_dispensas = await Dispensa.filter(
        situacao="aberta",
        pub_date__lte=limite,
    ).update(situacao="em_andamento")

    logger.info("Scheduler dispensas atualizado: %s", updated_dispensas)
    return {"total": updated_dispensas}

async def update_situacao() -> dict[str, dict[str, int] | str]:
    logger.info(
        "Executando scheduler de atualização de situação às %s",
        datetime.now(SCHEDULER_TIMEZONE).isoformat(),
    )
    result: dict[str, dict[str, int] | str] = {}

    try:
        result["licitacoes"] = await update_situacao_licitacao()
    except Exception as exc:
        logger.exception("Falha ao atualizar situacao de licitacoes")
        result["licitacoes_error"] = str(exc)

    try:
        result["dispensas"] = await update_situacao_dispensa()
    except Exception as exc:
        logger.exception("Falha ao atualizar situacao de dispensas")
        result["dispensas_error"] = str(exc)

    logger.info("Resultado do scheduler: %s", result)
    return result

from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler(timezone=SCHEDULER_TIMEZONE)

scheduler.add_job(
    update_situacao,
    trigger="cron",
    hour=0,
    minute=15,
    id="update_situacao_contratacao",
    coalesce=True,
    misfire_grace_time=3600,
)