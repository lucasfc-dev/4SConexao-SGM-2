import aioboto3
from botocore.exceptions import ClientError
from api.config import (
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_ENDPOINT,
)
from api.exceptions import InternalServerErrorException, NotFoundException


class R2Service:
    def __init__(self):
        self.bucket = R2_BUCKET
        self.session = aioboto3.Session()

    def _client(self):
        return self.session.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name='auto',
        )

    @staticmethod
    def build_key(estabelecimento_id, file_id, filename: str) -> str:
        return f"{estabelecimento_id}/{file_id}/{filename}"

    async def upload(self, key: str, body: bytes, content_type: str):
        async with self._client() as s3:
            try:
                await s3.put_object(
                    Bucket=self.bucket,
                    Key=key,
                    Body=body,
                    ContentType=content_type,
                )
            except ClientError as e:
                raise InternalServerErrorException(f'Falha no upload R2: {e}')

    async def get_stream(self, key: str):
        """Retorna (async_iterator, content_length, content_type)."""
        async with self._client() as s3:
            try:
                obj = await s3.get_object(Bucket=self.bucket, Key=key)
            except ClientError as e:
                code = e.response.get('Error', {}).get('Code')
                if code in ('NoSuchKey', '404'):
                    raise NotFoundException('Arquivo não encontrado no bucket.')
                raise InternalServerErrorException(f'Erro ao ler do R2: {e}')

            content_length = obj.get('ContentLength', 0)
            content_type = obj.get('ContentType', 'application/octet-stream')
            body = await obj['Body'].read()

        async def iterator():
            chunk_size = 64 * 1024
            for i in range(0, len(body), chunk_size):
                yield body[i:i + chunk_size]

        return iterator(), content_length, content_type

    async def copy(self, source_key: str, dest_key: str):
        async with self._client() as s3:
            try:
                await s3.copy_object(
                    Bucket=self.bucket,
                    CopySource={'Bucket': self.bucket, 'Key': source_key},
                    Key=dest_key,
                )
            except ClientError as e:
                raise InternalServerErrorException(f'Falha ao copiar no R2: {e}')

    async def delete(self, key: str):
        async with self._client() as s3:
            try:
                await s3.delete_object(Bucket=self.bucket, Key=key)
            except ClientError as e:
                raise InternalServerErrorException(f'Falha ao deletar no R2: {e}')

    async def delete_many(self, keys: list[str]):
        if not keys:
            return
        async with self._client() as s3:
            try:
                await s3.delete_objects(
                    Bucket=self.bucket,
                    Delete={'Objects': [{'Key': k} for k in keys]},
                )
            except ClientError as e:
                raise InternalServerErrorException(f'Falha ao deletar em lote no R2: {e}')
