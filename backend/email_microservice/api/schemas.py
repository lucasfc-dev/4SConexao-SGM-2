from pydantic import BaseModel, EmailStr,field_validator
from typing import Optional,Union,List
import base64

class AttachmentSchema(BaseModel):
    file:bytes
    filename:str

    @field_validator('file', mode='before')
    def decode_file(cls, value):
        if isinstance(value, str):
            return base64.b64decode(value)
        return value

class EmailSchema(BaseModel):
    email: Union[EmailStr,List[EmailStr]]
    subject: str
    keys:dict
    attachment:Union[AttachmentSchema,List[AttachmentSchema],None] = None
